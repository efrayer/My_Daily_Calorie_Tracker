export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize?: string;
}

export interface MealEntry {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  foods: FoodItem[];
  notes?: string;
}

export interface ExerciseEntry {
  id: string;
  type: '2G' | '3G' | 'Tread 50' | 'Weight 50' | 'Other';
  caloriesBurned: number;
  duration?: number;
  notes?: string;
}

export interface WaterEntry {
  glasses: number;
  ounces: number;
}

export interface WeightEntry {
  weight: number;
  date: string;
  notes?: string;
}

export interface DailyEntry {
  id: string;
  date: string;
  meals: MealEntry[];
  exercise?: ExerciseEntry;
  water: WaterEntry;
  weight?: number;
  notes?: string;
  tags: string[];
}

export interface UserGoals {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  targetWeight: number;
  waterGlasses: number;
}

export interface SavedFood extends FoodItem {
  id: string;
  category?: string;
  lastUsed?: string;
  useCount: number;
}

export interface AppData {
  goals: UserGoals;
  savedFoods: SavedFood[];
  recentMeals: MealEntry[];
  weightHistory: WeightEntry[];
}

export interface ElectronAPI {
  // Folder selection
  selectDataFolder: () => Promise<string | null>;
  getDataPath: () => Promise<string | null>;

  // Password/Encryption
  setPassword: (password: string, remember: boolean) => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
  getSavedPassword: () => Promise<string | null>;
  clearSavedPassword: () => Promise<boolean>;

  // Daily entries
  getDailyEntries: (startDate?: string, endDate?: string) => Promise<DailyEntry[]>;
  saveDailyEntry: (entry: DailyEntry) => Promise<{ success: boolean; id?: string; error?: string }>;
  deleteDailyEntry: (entryId: string) => Promise<{ success: boolean; error?: string }>;

  // App data
  getAppData: () => Promise<AppData | null>;
  saveAppData: (data: AppData) => Promise<{ success: boolean; error?: string }>;

  // Search
  searchEntries: (query: string, tags: string[]) => Promise<DailyEntry[]>;

  // Export
  exportData: (format: 'csv' | 'json', startDate: string, endDate: string) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
