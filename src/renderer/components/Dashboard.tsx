import React, { useState, useEffect } from 'react';
import { DailyEntry, AppData, MealEntry, ExerciseEntry } from '../types';
import { getTodayDateString, formatDisplayDate, formatDisplayTime } from '../utils/dateUtils';
import { calculateMealTotals, calculateProgress, getProgressColor } from '../utils/calculations';
import { useToast } from './Toast';
import MealLogger from './MealLogger';
import ExerciseLogger from './ExerciseLogger';
import QuickEntry from './QuickEntry';

interface DashboardProps {
  appData: AppData;
  onDataChange: () => void;
  onOpenWeightTracker?: () => void;
}

function Dashboard({ appData, onDataChange, onOpenWeightTracker }: DashboardProps) {
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMealLogger, setShowMealLogger] = useState(false);
  const [showExerciseLogger, setShowExerciseLogger] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const { showToast } = useToast();
  const today = getTodayDateString();

  useEffect(() => {
    loadTodayEntry();
  }, []);

  const loadTodayEntry = async () => {
    setIsLoading(true);
    try {
      const entries = await window.electronAPI.getDailyEntries(today, today);
      if (entries.length > 0) {
        setTodayEntry(entries[0]);
      } else {
        // Create empty entry for today
        const newEntry: DailyEntry = {
          id: today,
          date: today,
          meals: [],
          water: { glasses: 0, ounces: 0 },
          tags: [],
        };
        setTodayEntry(newEntry);
      }
    } catch (error) {
      console.error('Error loading today entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!todayEntry) {
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }
    return calculateMealTotals(todayEntry.meals);
  };

  const handleMealAdded = async (meal: MealEntry) => {
    if (!todayEntry) return;

    const updatedEntry: DailyEntry = {
      ...todayEntry,
      meals: [...todayEntry.meals, meal],
    };

    const result = await window.electronAPI.saveDailyEntry(updatedEntry);
    if (result.success) {
      setTodayEntry(updatedEntry);
      onDataChange();
      showToast('success', 'Meal saved successfully');
    } else {
      showToast('error', result.error || 'Failed to save meal');
    }
  };

  const handleExerciseAdded = async (exercise: ExerciseEntry) => {
    if (!todayEntry) return;

    const updatedEntry: DailyEntry = {
      ...todayEntry,
      exercise,
    };

    const result = await window.electronAPI.saveDailyEntry(updatedEntry);
    if (result.success) {
      setTodayEntry(updatedEntry);
      onDataChange();
      showToast('success', 'Exercise logged successfully');
    } else {
      showToast('error', result.error || 'Failed to save exercise');
    }
  };

  const handleWaterIncrement = async () => {
    if (!todayEntry) return;

    const updatedEntry: DailyEntry = {
      ...todayEntry,
      water: {
        glasses: todayEntry.water.glasses + 1,
        ounces: (todayEntry.water.glasses + 1) * 8, // Assuming 8 oz per glass
      },
    };

    const result = await window.electronAPI.saveDailyEntry(updatedEntry);
    if (result.success) {
      setTodayEntry(updatedEntry);
      onDataChange();
      showToast('success', 'Water intake updated');
    } else {
      showToast('error', result.error || 'Failed to update water');
    }
  };

  const handleWaterDecrement = async () => {
    if (!todayEntry || todayEntry.water.glasses === 0) return;

    const updatedEntry: DailyEntry = {
      ...todayEntry,
      water: {
        glasses: todayEntry.water.glasses - 1,
        ounces: (todayEntry.water.glasses - 1) * 8, // Assuming 8 oz per glass
      },
    };

    const result = await window.electronAPI.saveDailyEntry(updatedEntry);
    if (result.success) {
      setTodayEntry(updatedEntry);
      onDataChange();
      showToast('success', 'Water intake updated');
    } else {
      showToast('error', result.error || 'Failed to update water');
    }
  };

  const handleEditMeal = (meal: MealEntry) => {
    setEditingMeal(meal);
    setShowMealLogger(true);
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!todayEntry) return;

    if (!confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    const updatedEntry: DailyEntry = {
      ...todayEntry,
      meals: todayEntry.meals.filter(m => m.id !== mealId),
    };

    const result = await window.electronAPI.saveDailyEntry(updatedEntry);
    if (result.success) {
      setTodayEntry(updatedEntry);
      onDataChange();
      showToast('success', 'Meal deleted');
    } else {
      showToast('error', result.error || 'Failed to delete meal');
    }
  };

  const handleDeleteExercise = async () => {
    if (!todayEntry) return;

    if (!confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    const updatedEntry: DailyEntry = {
      ...todayEntry,
      exercise: undefined,
    };

    const result = await window.electronAPI.saveDailyEntry(updatedEntry);
    if (result.success) {
      setTodayEntry(updatedEntry);
      onDataChange();
      showToast('success', 'Exercise deleted');
    } else {
      showToast('error', result.error || 'Failed to delete exercise');
    }
  };

  const handleMealUpdated = async (updatedMeal: MealEntry) => {
    if (!todayEntry || !editingMeal) return;

    const updatedEntry: DailyEntry = {
      ...todayEntry,
      meals: todayEntry.meals.map(m => m.id === editingMeal.id ? updatedMeal : m),
    };

    const result = await window.electronAPI.saveDailyEntry(updatedEntry);
    if (result.success) {
      setTodayEntry(updatedEntry);
      onDataChange();
      setEditingMeal(null);
      showToast('success', 'Meal updated successfully');
    } else {
      showToast('error', result.error || 'Failed to update meal');
    }
  };

  const handleCloseMealLogger = () => {
    setShowMealLogger(false);
    setEditingMeal(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const totals = calculateTotals();
  const goals = appData.goals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {formatDisplayDate(new Date())}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Track your daily nutrition</p>
        </div>
      </div>

      {/* Calorie Summary Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Daily Calories</h3>
          <div className="text-right">
            <div className="text-3xl font-bold">{Math.round(totals.calories)}</div>
            <div className="text-sm opacity-90">of {goals.dailyCalories}</div>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500 rounded-full"
            style={{ width: `${calculateProgress(totals.calories, goals.dailyCalories)}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm opacity-90">
          {goals.dailyCalories - totals.calories > 0
            ? `${Math.round(goals.dailyCalories - totals.calories)} calories remaining`
            : `${Math.round(totals.calories - goals.dailyCalories)} calories over goal`}
        </div>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Protein */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-600">Protein</h4>
            <span className="text-lg font-bold text-gray-900">
              {Math.round(totals.protein)}g
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`${getProgressColor(totals.protein, goals.protein)} h-full transition-all duration-500`}
              style={{ width: `${calculateProgress(totals.protein, goals.protein)}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Goal: {goals.protein}g</div>
        </div>

        {/* Carbs */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-600">Carbs</h4>
            <span className="text-lg font-bold text-gray-900">
              {Math.round(totals.carbs)}g
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`${getProgressColor(totals.carbs, goals.carbs)} h-full transition-all duration-500`}
              style={{ width: `${calculateProgress(totals.carbs, goals.carbs)}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Goal: {goals.carbs}g</div>
        </div>

        {/* Fats */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-600">Fats</h4>
            <span className="text-lg font-bold text-gray-900">
              {Math.round(totals.fats)}g
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`${getProgressColor(totals.fats, goals.fats)} h-full transition-all duration-500`}
              style={{ width: `${calculateProgress(totals.fats, goals.fats)}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Goal: {goals.fats}g</div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Water Intake */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.5 3A2.5 2.5 0 003 5.5v9A2.5 2.5 0 005.5 17h9a2.5 2.5 0 002.5-2.5v-9A2.5 2.5 0 0014.5 3h-9zm0 2h9a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-600">Water</h4>
              <p className="text-xl font-bold text-gray-900">
                {todayEntry?.water.glasses || 0} / {goals.waterGlasses} glasses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleWaterDecrement}
                disabled={!todayEntry || todayEntry.water.glasses === 0}
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={handleWaterIncrement}
                className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{
                width: `${calculateProgress(
                  todayEntry?.water.glasses || 0,
                  goals.waterGlasses
                )}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Exercise */}
        <div className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => setShowExerciseLogger(true)}>
              <h4 className="text-sm font-medium text-gray-600">Exercise</h4>
              <p className="text-xl font-bold text-gray-900">
                {todayEntry?.exercise ? (
                  <>
                    {todayEntry.exercise.type} - {todayEntry.exercise.caloriesBurned} cal
                    {todayEntry.exercise.duration && ` (${todayEntry.exercise.duration} min)`}
                  </>
                ) : (
                  'No exercise logged'
                )}
              </p>
            </div>
            {todayEntry?.exercise && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setShowExerciseLogger(true)}
                  className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                  title="Edit exercise"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleDeleteExercise}
                  className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete exercise"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Today's Meals</h3>
        </div>
        <div className="p-5">
          {todayEntry && todayEntry.meals.length > 0 ? (
            <div className="space-y-4">
              {todayEntry.meals.map((meal) => (
                <div key={meal.id} className="border-l-4 border-orange-500 pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <h4 className="font-medium text-gray-900 capitalize">{meal.mealType}</h4>
                      <span className="text-sm text-gray-500">{formatDisplayTime(meal.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditMeal(meal)}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit meal"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete meal"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {meal.foods.map((food, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-600 flex items-center justify-between"
                      >
                        <span>
                          {food.name}
                          {food.servingSize && ` (${food.servingSize})`}
                        </span>
                        <span className="font-medium">{food.calories} cal</span>
                      </div>
                    ))}
                  </div>
                  {meal.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">{meal.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">No meals logged yet today</p>
              <p className="text-sm text-gray-400 mt-1">
                Start tracking your nutrition by adding a meal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setShowMealLogger(true)}
          className="bg-white hover:bg-gray-50 border-2 border-orange-500 text-orange-600 rounded-lg p-4 transition-colors"
        >
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-sm font-medium">Add Meal</span>
        </button>

        <button
          onClick={() => setShowExerciseLogger(true)}
          className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg p-4 transition-colors"
        >
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="text-sm font-medium">Log Exercise</span>
        </button>

        <button
          onClick={onOpenWeightTracker}
          className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg p-4 transition-colors"
        >
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
          <span className="text-sm font-medium">Add Weight</span>
        </button>

        <button
          onClick={() => setShowQuickEntry(true)}
          className="bg-white hover:bg-gray-50 border-2 border-green-500 text-green-600 rounded-lg p-4 transition-colors"
        >
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="text-sm font-medium">Quick Entry</span>
        </button>
      </div>

      {/* Meal Logger Modal */}
      {showMealLogger && (
        <MealLogger
          appData={appData}
          onMealAdded={editingMeal ? handleMealUpdated : handleMealAdded}
          onClose={handleCloseMealLogger}
          existingMeal={editingMeal || undefined}
        />
      )}

      {/* Exercise Logger Modal */}
      {showExerciseLogger && (
        <ExerciseLogger
          currentExercise={todayEntry?.exercise}
          onExerciseAdded={handleExerciseAdded}
          onClose={() => setShowExerciseLogger(false)}
        />
      )}

      {/* Quick Entry Modal */}
      {showQuickEntry && (
        <QuickEntry
          appData={appData}
          onMealAdded={handleMealAdded}
          onClose={() => setShowQuickEntry(false)}
        />
      )}
    </div>
  );
}

export default Dashboard;
