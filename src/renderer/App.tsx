import React, { useState, useEffect } from 'react';
import PasswordScreen from './components/PasswordScreen';
import Dashboard from './components/Dashboard';
import FoodLibrary from './components/FoodLibrary';
import GoalsSettings from './components/GoalsSettings';
import WeightTracker from './components/WeightTracker';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import { ToastProvider } from './components/Toast';
import { AppData, DailyEntry } from './types';

type AppScreen = 'password' | 'dashboard' | 'foodLibrary';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('password');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dataPath, setDataPath] = useState<string | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFoodLibrary, setShowFoodLibrary] = useState(false);
  const [showGoalsSettings, setShowGoalsSettings] = useState(false);
  const [showWeightTracker, setShowWeightTracker] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showStatsView, setShowStatsView] = useState(false);

  useEffect(() => {
    checkForSavedSession();
  }, []);

  const checkForSavedSession = async () => {
    try {
      const savedDataPath = await window.electronAPI.getDataPath();
      if (savedDataPath) {
        setDataPath(savedDataPath);

        const savedPassword = await window.electronAPI.getSavedPassword();
        if (savedPassword) {
          const isValid = await window.electronAPI.verifyPassword(savedPassword);
          if (isValid) {
            await loadAppData();
            setIsAuthenticated(true);
            setCurrentScreen('dashboard');
          }
        }
      }
    } catch (error) {
      console.error('Error checking saved session:', error);
    }
  };

  const loadAppData = async () => {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.getAppData();
      if (data) {
        setAppData(data);
      }

      const entries = await window.electronAPI.getDailyEntries();
      setDailyEntries(entries);
    } catch (error) {
      console.error('Error loading app data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticated = async (path: string) => {
    setDataPath(path);
    setIsAuthenticated(true);
    await loadAppData();
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setCurrentScreen('password');
    setAppData(null);
    setDailyEntries([]);
    setDataPath(null);
  };

  if (currentScreen === 'password' && !isAuthenticated) {
    return <PasswordScreen onAuthenticated={handleAuthenticated} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Calorie Tracker</h1>
            {dataPath && (
              <p className="text-sm text-gray-500 mt-1">Data: {dataPath}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGoalsSettings(true)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Goals
            </button>
            <button
              onClick={() => setShowWeightTracker(true)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
              Weight
            </button>
            <button
              onClick={() => setShowFoodLibrary(true)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              Food Library
            </button>
            <button
              onClick={() => setShowCalendarView(true)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Calendar
            </button>
            <button
              onClick={() => setShowStatsView(true)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Stats
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {appData && (
            <Dashboard
              appData={appData}
              onDataChange={loadAppData}
              onOpenWeightTracker={() => setShowWeightTracker(true)}
            />
          )}
        </div>
      </main>

      {/* Food Library Modal */}
      {showFoodLibrary && appData && (
        <FoodLibrary
          appData={appData}
          onClose={() => setShowFoodLibrary(false)}
          onDataUpdated={loadAppData}
        />
      )}

      {/* Goals Settings Modal */}
      {showGoalsSettings && appData && (
        <GoalsSettings
          appData={appData}
          onClose={() => setShowGoalsSettings(false)}
          onDataUpdated={loadAppData}
        />
      )}

      {/* Weight Tracker Modal */}
      {showWeightTracker && appData && (
        <WeightTracker
          appData={appData}
          onClose={() => setShowWeightTracker(false)}
          onDataUpdated={loadAppData}
        />
      )}

      {/* Calendar View Modal */}
      {showCalendarView && appData && (
        <CalendarView
          appData={appData}
          onClose={() => setShowCalendarView(false)}
        />
      )}

      {/* Stats View Modal */}
      {showStatsView && appData && (
        <StatsView
          appData={appData}
          onClose={() => setShowStatsView(false)}
        />
      )}
      </div>
    </ToastProvider>
  );
}

export default App;
