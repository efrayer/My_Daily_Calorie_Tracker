# 🥗 My Daily Calorie Tracker

> A secure, offline-first desktop application for tracking nutrition, exercise, and health metrics with military-grade encryption.

[![Windows](https://img.shields.io/badge/Platform-Windows-blue.svg)](https://github.com/efrayer/My_Daily_Calorie_Tracker)
[![Electron](https://img.shields.io/badge/Electron-39.3.0-47848F.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6.svg)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Download](#-download)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Tech Stack](#-tech-stack)
- [Security](#-security)
- [License](#-license)

---

## 🎯 Overview

**My Daily Calorie Tracker** is a privacy-focused Windows desktop application designed for health-conscious individuals who want complete control over their nutrition data. Built with Electron, React, and TypeScript, it combines the convenience of modern UI with the security of local, encrypted storage.

### Why This App?

✅ **100% Offline** - No internet connection required, no data leaves your computer
✅ **Military-Grade Encryption** - AES-256 encryption protects your health data
✅ **Cloud Sync Ready** - Store encrypted files in OneDrive/Dropbox for multi-device access
✅ **Orange Theory Focused** - Pre-configured for Orange Theory Fitness workouts
✅ **Portable** - Single executable, no installation required

---

## ✨ Features

### 🍽️ Nutrition Tracking

- **Complete Meal Logging** - Track Breakfast, Lunch, Dinner, and Snacks
- **Macro Tracking** - Monitor calories, protein, carbs, and fats
- **Food Library** - Save frequently used foods for quick entry
- **Smart Search** - Filter your food database instantly
- **Edit & Delete** - Hover over any meal to modify or remove
- **12-Hour Time Format** - Clear AM/PM timestamps

### 💪 Exercise Tracking

- **Orange Theory Workouts** - Pre-configured types:
  - 2G Class (60 min) - ~500 cal
  - 3G Class (60 min) - ~450 cal
  - Tread 50 (45 min) - ~400 cal
  - Weight 50 (45 min) - ~350 cal
  - Custom Workouts
- **Calories & Duration** - Track both burned calories and workout time
- **Exercise Notes** - Log achievements and performance details
- **Full Edit Support** - Update or delete logged exercises

### 💧 Daily Tracking

- **Water Intake** - Quick +/- buttons for 8oz glass tracking
- **Weight Logging** - Monitor weight trends over time
- **Progress Bars** - Visual indicators for goals (Green/Yellow/Red)
- **Daily Dashboard** - See everything at a glance

### 📊 Advanced Features

- **Calendar View** - Browse historical entries by date
- **Statistics Dashboard** - Analyze trends and patterns with charts
- **Data Export** - Export to CSV or JSON formats
- **Tag System** - Organize entries with custom tags
- **Search Functionality** - Find entries quickly
- **Goal Management** - Set and track daily nutrition targets

### 🔒 Security & Privacy

- **AES-256 Encryption** - Bank-level data protection
- **Password Auto-Login** - "Remember Me" feature with secure storage
- **No Telemetry** - Zero tracking or data collection
- **Offline Operation** - Complete privacy, no internet needed
- **Local Storage** - Your data stays on your computer

---

## 📸 Screenshots

### Main Dashboard
> Clean, modern interface showing daily progress, meals, exercise, and water intake

### Meal Logger
> Easy food entry with saved library and macro calculations

### Exercise Tracker
> Orange Theory-focused workout logging with calorie tracking

---

## 📥 Download

### Latest Release: v1.0.0

Two distribution options available:

#### Option 1: Portable Executable (Recommended)
- **File:** `My Daily Calorie Tracker 1.0.0.exe` (87 MB)
- **No installation required** - Run directly from any location
- **Perfect for:** USB drives, cloud folders, or portable use

#### Option 2: Windows Installer
- **File:** `My Daily Calorie Tracker Setup 1.0.0.exe` (87 MB)
- **Traditional installer** with Start Menu and Desktop shortcuts
- **Custom installation directory**

### System Requirements

- **OS:** Windows 10 or Windows 11 (64-bit)
- **RAM:** 100 MB minimum
- **Storage:** 200 MB (app + data)
- **Screen:** Minimum 1000x700, optimized for 1250x850

---

## 🚀 Getting Started

### First Launch

1. **Select Data Folder**
   - Choose where to store your encrypted data
   - Recommended: OneDrive or Dropbox folder for cloud sync

2. **Create Password**
   - Set a strong password for encryption
   - Check "Remember Me" to enable auto-login

3. **Set Your Goals**
   - Configure daily calorie targets
   - Set macro goals (protein, carbs, fats)

4. **Start Tracking!**
   - Log your first meal
   - Track water intake
   - Record your workout

### Daily Usage

1. **Dashboard View** - See today's overview
2. **Add Meals** - Click "Add Meal" or use Quick Entry
3. **Log Exercise** - Track Orange Theory workouts
4. **Update Water** - Use +/- buttons
5. **Review Progress** - Check color-coded progress bars

### Cloud Sync Setup

1. Point your data folder to a cloud service folder
2. Files sync automatically
3. Data remains encrypted in the cloud
4. Install app on other computers
5. Use same password to access data

---

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm 9+
- Windows 10/11 (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/efrayer/My_Daily_Calorie_Tracker.git

# Navigate to directory
cd My_Daily_Calorie_Tracker

# Install dependencies
npm install
```

### Development Mode

```bash
# Run in development mode with hot reload
npm run dev

# Main process only (test Electron backend)
npm run dev:main

# Renderer only (test React UI)
npm run dev:renderer
```

### Building

```bash
# Build for production
npm run build

# Create Windows executables (portable + installer)
npm run dist:win
```

Output files will be in the `release/` folder.

### Project Structure

```
my_daily_calorie_tracker/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── main.ts               # Main process entry point
│   │   └── validation.ts         # Zod schemas for validation
│   ├── preload/                  # IPC bridge
│   │   └── preload.ts           # Preload script
│   └── renderer/                 # React application
│       ├── components/           # React components
│       │   ├── Dashboard.tsx
│       │   ├── MealLogger.tsx
│       │   ├── ExerciseLogger.tsx
│       │   ├── QuickEntry.tsx
│       │   ├── FoodLibrary.tsx
│       │   ├── WeightTracker.tsx
│       │   ├── CalendarView.tsx
│       │   ├── StatsView.tsx
│       │   ├── GoalsSettings.tsx
│       │   ├── PasswordScreen.tsx
│       │   └── Toast.tsx
│       ├── utils/                # Utility functions
│       │   ├── dateUtils.ts
│       │   └── calculations.ts
│       ├── App.tsx              # Main app component
│       ├── types.ts             # TypeScript types
│       ├── main.tsx             # React entry point
│       └── index.css            # Global styles
├── dist/                         # Build output
├── release/                      # Executables
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
└── tailwind.config.js          # TailwindCSS config
```

---

## 🔧 Tech Stack

### Core Technologies

- **[Electron](https://www.electronjs.org/) 39.3.0** - Cross-platform desktop framework
- **[React](https://reactjs.org/) 18.2** - UI library
- **[TypeScript](https://www.typescriptlang.org/) 5.3** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/) 7.3** - Lightning-fast build tool

### UI & Styling

- **[TailwindCSS](https://tailwindcss.com/) 3.3** - Utility-first CSS framework
- **[Recharts](https://recharts.org/) 2.10** - Charting library
- **Custom Toast System** - Non-blocking notifications

### Data & Storage

- **[crypto-js](https://github.com/brix/crypto-js) 4.2** - AES-256 encryption
- **[gray-matter](https://github.com/jonschlinkert/gray-matter) 4.0** - Markdown frontmatter parsing
- **[date-fns](https://date-fns.org/) 3.0** - Date formatting and manipulation
- **[electron-store](https://github.com/sindresorhus/electron-store) 8.2** - Persistent settings
- **[Zod](https://zod.dev/) 4.3** - Runtime schema validation

### Build Tools

- **[electron-builder](https://www.electron.build/) 23.0** - Executable packaging
- **[PostCSS](https://postcss.org/) 8.4** - CSS processing
- **[Autoprefixer](https://github.com/postcss/autoprefixer) 10.4** - CSS vendor prefixes

---

## 🔐 Security

### Encryption

- **Algorithm:** AES-256 (Advanced Encryption Standard)
- **Key Derivation:** User password
- **Scope:** All daily entries and saved data
- **Storage:** Encrypted files in markdown format

### Password Management

- **Auto-Login:** Optional "Remember Me" feature
- **Storage:** Encrypted with app-specific key
- **Verification:** Password tested against app-data.json on login

### Privacy Guarantee

✅ **No internet connection** - App works completely offline
✅ **No analytics** - Zero tracking or telemetry
✅ **No external servers** - All data stays local
✅ **No data sharing** - Your information never leaves your control

### Data Storage Format

```
YourDataFolder/
├── daily/
│   ├── 2026-01-23.md          # Daily entry (encrypted)
│   ├── 2026-01-24.md
│   └── ...
├── app-data.json              # Settings & food library (encrypted)
└── .password                  # Saved password (encrypted)
```

---

## 📝 Data Format

### Daily Entry (Markdown with Frontmatter)

```markdown
---
date: 2026-01-23
totalCalories: 1850
encrypted: true
---

{
  "date": "2026-01-23",
  "meals": [...],
  "exercise": {...},
  "water": {...},
  "weight": 175,
  "notes": "Great day!"
}
```

### App Data (JSON)

```json
{
  "goals": {
    "dailyCalories": 2000,
    "protein": 150,
    "carbs": 200,
    "fats": 65,
    "targetWeight": 180,
    "waterGlasses": 8
  },
  "savedFoods": [
    {
      "name": "Greek Yogurt",
      "calories": 100,
      "protein": 17,
      "carbs": 6,
      "fats": 0,
      "useCount": 24
    }
  ]
}
```

---

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome!

1. Open an issue describing the problem or feature request
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

---

## 📄 License

**MIT License**

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

---

## 🙏 Acknowledgments

- Built for Orange Theory Fitness enthusiasts
- Inspired by privacy-first software principles
- Designed for seamless cloud sync with local encryption

---

## 📧 Contact

For questions, suggestions, or support:

- **Design and Development:** Eric Frayer - info@ericfrayer.com - www.ericfrayer.com
- **GitHub Issues:** [Report a bug or request a feature](https://github.com/efrayer/My_Daily_Calorie_Tracker/issues)
- **Repository:** [View source code](https://github.com/efrayer/My_Daily_Calorie_Tracker)

---

<div align="center">

**Made with ❤️ for health-conscious individuals who value privacy**

[⬆ Back to Top](#-my-daily-calorie-tracker)

</div>
