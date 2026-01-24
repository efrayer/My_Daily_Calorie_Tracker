import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import matter from 'gray-matter';
import CryptoJS from 'crypto-js';
import Store from 'electron-store';
import { DailyEntrySchema, AppDataSchema, validateData } from './validation';

const store = new Store();
let mainWindow: BrowserWindow | null = null;
let dataPath: string | null = null;
let encryptionPassword: string | null = null;
const PASSWORD_FILE = '.password';

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app
  const prodIndexPath = path.join(__dirname, '../renderer/index.html');
  const isDev = !fsSync.existsSync(prodIndexPath);

  if (isDev) {
    const ports = [5173, 5174, 5175, 5176, 5177];
    let loaded = false;

    for (const port of ports) {
      try {
        await mainWindow.loadURL(`http://localhost:${port}`);
        loaded = true;
        console.log(`Successfully loaded from port ${port}`);
        break;
      } catch (error) {
        console.log(`Failed to load from port ${port}, trying next...`);
      }
    }

    if (!loaded) {
      console.error('Failed to load from any Vite dev server port');
    }

    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(prodIndexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Helper functions
function encrypt(text: string, password: string): string {
  return CryptoJS.AES.encrypt(text, password).toString();
}

function decrypt(encryptedText: string, password: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, password);
  return bytes.toString(CryptoJS.enc.Utf8);
}

async function ensureDataPath() {
  if (!dataPath) {
    throw new Error('Data path not set. Please select a data folder first.');
  }
  await fs.mkdir(dataPath, { recursive: true });
  await fs.mkdir(path.join(dataPath, 'daily'), { recursive: true });
}

// IPC Handlers

// Select data folder
ipcMain.handle('select-data-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Data Folder',
    buttonLabel: 'Select Folder',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    dataPath = result.filePaths[0];
    await fs.mkdir(dataPath, { recursive: true });
    await fs.mkdir(path.join(dataPath, 'daily'), { recursive: true });

    // Persist the data path
    store.set('dataPath', dataPath);

    return dataPath;
  }
  return null;
});

// Get data path
ipcMain.handle('get-data-path', () => {
  // If not in memory, try to load from persistent storage
  if (!dataPath) {
    dataPath = store.get('dataPath') as string | null;
  }
  return dataPath;
});

// Password management
ipcMain.handle('set-password', async (event, password: string, remember: boolean) => {
  encryptionPassword = password;

  if (remember && dataPath) {
    try {
      const passwordPath = path.join(dataPath, PASSWORD_FILE);
      // Encrypt the password before saving
      const encrypted = encrypt(password, app.getName());
      await fs.writeFile(passwordPath, encrypted, 'utf-8');
    } catch (error) {
      console.error('Error saving password:', error);
    }
  }

  return true;
});

ipcMain.handle('get-saved-password', async () => {
  if (!dataPath) return null;

  try {
    const passwordPath = path.join(dataPath, PASSWORD_FILE);
    const encrypted = await fs.readFile(passwordPath, 'utf-8');
    const decrypted = decrypt(encrypted, app.getName());
    return decrypted;
  } catch (error) {
    return null;
  }
});

ipcMain.handle('clear-saved-password', async () => {
  if (!dataPath) return false;

  try {
    const passwordPath = path.join(dataPath, PASSWORD_FILE);
    await fs.unlink(passwordPath);
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('verify-password', async (event, password: string) => {
  try {
    await ensureDataPath();

    // Check if app-data.json exists and try to decrypt it
    const appDataPath = path.join(dataPath!, 'app-data.json');

    if (fsSync.existsSync(appDataPath)) {
      const fileContent = await fs.readFile(appDataPath, 'utf-8');

      try {
        // Try to decrypt
        const decrypted = decrypt(fileContent, password);
        JSON.parse(decrypted); // Verify it's valid JSON
        encryptionPassword = password;
        return true;
      } catch (error) {
        return false;
      }
    } else {
      // No data yet, accept any password
      encryptionPassword = password;
      return true;
    }
  } catch (error) {
    return false;
  }
});

// Get daily entries
ipcMain.handle('get-daily-entries', async (event, startDate?: string, endDate?: string) => {
  try {
    await ensureDataPath();
    const dailyPath = path.join(dataPath!, 'daily');
    const files = await fs.readdir(dailyPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const entries = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(dailyPath, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        let entryContent = content;
        if (encryptionPassword) {
          try {
            entryContent = decrypt(content, encryptionPassword);
          } catch (error) {
            entryContent = '[Unable to decrypt entry]';
          }
        }

        // Parse the markdown content back to JSON
        const entry = JSON.parse(entryContent);

        return {
          ...entry,
          id: file.replace('.md', ''),
          date: data.date || entry.date,
        };
      })
    );

    // Filter by date range if provided
    let filtered = entries;
    if (startDate) {
      filtered = filtered.filter(e => e.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.date <= endDate);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting daily entries:', error);
    return [];
  }
});

// Save daily entry
ipcMain.handle('save-daily-entry', async (event, entry: unknown) => {
  try {
    await ensureDataPath();

    // Validate input data
    const validation = validateData(DailyEntrySchema, entry);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const validatedEntry = validation.data;
    const fileName = `${validatedEntry.date}.md`;
    const dailyPath = path.join(dataPath!, 'daily');
    const filePath = path.join(dailyPath, fileName);

    // Convert entry to JSON string
    const contentJson = JSON.stringify(validatedEntry, null, 2);

    // Encrypt if password is set
    let content = contentJson;
    if (encryptionPassword) {
      content = encrypt(contentJson, encryptionPassword);
    }

    const frontmatter = {
      date: validatedEntry.date,
      totalCalories: validatedEntry.meals.reduce((sum: number, meal) =>
        sum + meal.foods.reduce((mSum: number, food) => mSum + food.calories, 0), 0
      ),
      encrypted: !!encryptionPassword,
    };

    const fileContent = matter.stringify(content, frontmatter);
    await fs.writeFile(filePath, fileContent, 'utf-8');

    return { success: true, id: validatedEntry.date };
  } catch (error) {
    console.error('Error saving daily entry:', error);
    return { success: false, error: String(error) };
  }
});

// Delete daily entry
ipcMain.handle('delete-daily-entry', async (event, entryId: string) => {
  try {
    await ensureDataPath();
    const fileName = `${entryId}.md`;
    const dailyPath = path.join(dataPath!, 'daily');
    const filePath = path.join(dailyPath, fileName);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting daily entry:', error);
    return { success: false, error: String(error) };
  }
});

// Get app data (goals, saved foods, etc.)
ipcMain.handle('get-app-data', async () => {
  try {
    await ensureDataPath();
    const appDataPath = path.join(dataPath!, 'app-data.json');

    if (!fsSync.existsSync(appDataPath)) {
      // Return default data
      return {
        goals: {
          dailyCalories: 2000,
          protein: 150,
          carbs: 200,
          fats: 65,
          targetWeight: 180,
          waterGlasses: 8,
        },
        savedFoods: [],
        recentMeals: [],
        weightHistory: [],
      };
    }

    const fileContent = await fs.readFile(appDataPath, 'utf-8');

    let dataJson = fileContent;
    if (encryptionPassword) {
      dataJson = decrypt(fileContent, encryptionPassword);
    }

    return JSON.parse(dataJson);
  } catch (error) {
    console.error('Error getting app data:', error);
    return null;
  }
});

// Save app data
ipcMain.handle('save-app-data', async (event, data: unknown) => {
  try {
    await ensureDataPath();

    // Validate input data
    const validation = validateData(AppDataSchema, data);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const appDataPath = path.join(dataPath!, 'app-data.json');
    let content = JSON.stringify(validation.data, null, 2);

    if (encryptionPassword) {
      content = encrypt(content, encryptionPassword);
    }

    await fs.writeFile(appDataPath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error saving app data:', error);
    return { success: false, error: String(error) };
  }
});

// Search entries
ipcMain.handle('search-entries', async (event, query: string, tags: string[]) => {
  try {
    await ensureDataPath();
    const dailyPath = path.join(dataPath!, 'daily');
    const files = await fs.readdir(dailyPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const allEntries = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(dailyPath, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        let entryContent = content;
        if (encryptionPassword) {
          try {
            entryContent = decrypt(content, encryptionPassword);
          } catch (error) {
            entryContent = '[Unable to decrypt entry]';
          }
        }

        const entry = JSON.parse(entryContent);
        return {
          ...entry,
          id: file.replace('.md', ''),
          date: data.date || entry.date,
        };
      })
    );

    let filtered = allEntries;

    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter((entry: any) =>
        entry.notes?.toLowerCase().includes(lowerQuery) ||
        entry.meals.some((meal: any) =>
          meal.foods.some((food: any) =>
            food.name.toLowerCase().includes(lowerQuery)
          )
        )
      );
    }

    if (tags && tags.length > 0) {
      filtered = filtered.filter((entry: any) =>
        tags.some(tag => entry.tags.includes(tag))
      );
    }

    return filtered;
  } catch (error) {
    console.error('Error searching entries:', error);
    return [];
  }
});

// Export data
ipcMain.handle('export-data', async (event, format: 'csv' | 'json', startDate: string, endDate: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath: `calorie-tracker-export.${format}`,
    filters: [
      { name: format === 'csv' ? 'CSV' : 'JSON', extensions: [format] },
    ],
  });

  if (!result.canceled && result.filePath) {
    try {
      await ensureDataPath();
      const dailyPath = path.join(dataPath!, 'daily');
      const files = await fs.readdir(dailyPath);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      const allEntries = await Promise.all(
        mdFiles.map(async (file) => {
          const filePath = path.join(dailyPath, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const { data, content } = matter(fileContent);

          let entryContent = content;
          if (encryptionPassword) {
            try {
              entryContent = decrypt(content, encryptionPassword);
            } catch (error) {
              entryContent = '[Unable to decrypt entry]';
            }
          }

          const entry = JSON.parse(entryContent);
          return {
            ...entry,
            id: file.replace('.md', ''),
            date: data.date || entry.date,
          };
        })
      );

      // Filter by date range
      let entries = allEntries;
      if (startDate) {
        entries = entries.filter(e => e.date >= startDate);
      }
      if (endDate) {
        entries = entries.filter(e => e.date <= endDate);
      }
      entries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (format === 'json') {
        await fs.writeFile(result.filePath, JSON.stringify(entries, null, 2), 'utf-8');
      } else {
        // CSV format
        let csv = 'Date,Total Calories,Protein,Carbs,Fats,Exercise Calories,Weight,Water Glasses\n';

        entries.forEach((entry: any) => {
          const totals = entry.meals.reduce((acc: any, meal: any) => {
            meal.foods.forEach((food: any) => {
              acc.calories += food.calories;
              acc.protein += food.protein;
              acc.carbs += food.carbs;
              acc.fats += food.fats;
            });
            return acc;
          }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

          csv += `${entry.date},${totals.calories},${totals.protein},${totals.carbs},${totals.fats},${entry.exercise?.caloriesBurned || 0},${entry.weight || ''},${entry.water.glasses}\n`;
        });

        await fs.writeFile(result.filePath, csv, 'utf-8');
      }

      return { success: true };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { success: false };
    }
  }

  return { success: false };
});
