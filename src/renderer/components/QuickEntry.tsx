import React, { useState } from 'react';
import { MealEntry, SavedFood, AppData, FoodItem } from '../types';
import { getCurrentTimeString } from '../utils/dateUtils';
import { calculateFoodTotals } from '../utils/calculations';
import { useToast } from './Toast';

interface QuickEntryProps {
  appData: AppData;
  onMealAdded: (meal: MealEntry) => void;
  onClose: () => void;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

function QuickEntry({ appData, onMealAdded, onClose }: QuickEntryProps) {
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Get frequently used foods (top 20 by use count)
  const frequentFoods = [...appData.savedFoods]
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 20);

  // Get recently used foods from recent meals
  const recentFoodIds = new Set<string>();
  const recentFoods: SavedFood[] = [];

  appData.recentMeals.forEach(meal => {
    meal.foods.forEach(food => {
      const savedFood = appData.savedFoods.find(f => f.name === food.name);
      if (savedFood && !recentFoodIds.has(savedFood.id)) {
        recentFoodIds.add(savedFood.id);
        recentFoods.push(savedFood);
      }
    });
  });

  // Filter foods by search
  const filteredFoods = searchQuery
    ? appData.savedFoods.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : frequentFoods;

  const handleToggleFood = async (food: SavedFood) => {
    const foodItem: FoodItem = {
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
    };

    const isSelected = selectedFoods.some(f => f.name === food.name);

    if (isSelected) {
      setSelectedFoods(selectedFoods.filter(f => f.name !== food.name));
    } else {
      setSelectedFoods([...selectedFoods, foodItem]);

      // Increment useCount for the saved food
      const updatedFood: SavedFood = {
        ...food,
        useCount: food.useCount + 1,
      };
      const updatedSavedFoods = appData.savedFoods.map((f) =>
        f.name === food.name ? updatedFood : f
      );
      const updatedAppData = { ...appData, savedFoods: updatedSavedFoods };
      await window.electronAPI.saveAppData(updatedAppData);
    }
  };

  const handleQuickAdd = () => {
    if (selectedFoods.length === 0) {
      showToast('warning', 'Please select at least one food');
      return;
    }

    const meal: MealEntry = {
      id: `meal-${Date.now()}`,
      mealType,
      time: getCurrentTimeString(),
      foods: selectedFoods,
    };

    onMealAdded(meal);
    onClose();
  };

  const calculateTotals = () => {
    return calculateFoodTotals(selectedFoods);
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Quick Entry</h2>
              <p className="text-sm text-white/90 mt-1">Rapidly log your meals</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-green-600 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Meal Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white/90">Meal Type</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 capitalize"
            >
              <option value="breakfast" className="text-gray-900">Breakfast</option>
              <option value="lunch" className="text-gray-900">Lunch</option>
              <option value="dinner" className="text-gray-900">Dinner</option>
              <option value="snack" className="text-gray-900">Snack</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Selected Foods Summary */}
            {selectedFoods.length > 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-green-900">
                    {selectedFoods.length} {selectedFoods.length === 1 ? 'item' : 'items'} selected
                  </h3>
                  <button
                    onClick={() => setSelectedFoods([])}
                    className="text-sm text-green-700 hover:text-green-900"
                  >
                    Clear all
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-900">
                      {Math.round(totals.calories)}
                    </div>
                    <div className="text-xs text-gray-600">cal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-700">{Math.round(totals.protein)}g</div>
                    <div className="text-xs text-gray-600">protein</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-700">{Math.round(totals.carbs)}g</div>
                    <div className="text-xs text-gray-600">carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-700">{Math.round(totals.fats)}g</div>
                    <div className="text-xs text-gray-600">fats</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedFoods.map((food, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm"
                    >
                      <span className="font-medium text-gray-900">{food.name}</span>
                      <button
                        onClick={() => setSelectedFoods(selectedFoods.filter((_, i) => i !== idx))}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search foods..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Food Grid */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                {searchQuery
                  ? 'Search Results'
                  : 'Frequently Used Foods'}
              </h3>

              {filteredFoods.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredFoods.map((food) => {
                    const isSelected = selectedFoods.some(f => f.name === food.name);
                    return (
                      <button
                        key={food.id}
                        onClick={() => handleToggleFood(food)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium truncate ${
                                isSelected ? 'text-green-900' : 'text-gray-900'
                              }`}
                            >
                              {food.name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {food.calories} cal
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        {food.useCount > 0 && !searchQuery && (
                          <div className="text-xs text-gray-500 mt-1">
                            Used {food.useCount}x
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No foods found</p>
                  <p className="text-sm mt-1">Try a different search or add foods to your library</p>
                </div>
              )}
            </div>

            {/* Recent Meals Section */}
            {!searchQuery && recentFoods.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Recently Used</h3>
                <div className="flex flex-wrap gap-2">
                  {recentFoods.slice(0, 10).map((food) => {
                    const isSelected = selectedFoods.some(f => f.name === food.name);
                    return (
                      <button
                        key={food.id}
                        onClick={() => handleToggleFood(food)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                          isSelected
                            ? 'border-green-500 bg-green-50 text-green-900'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {food.name} ({food.calories} cal)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Quick Entry Tips
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-7">
                <li>• Click foods to quickly add them to your meal</li>
                <li>• Select multiple foods at once</li>
                <li>• Most frequently used foods appear first</li>
                <li>• Search to find any food in your library</li>
                <li>• Perfect for logging familiar meals</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleQuickAdd}
              disabled={selectedFoods.length === 0}
              className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Add {selectedFoods.length > 0 ? `${selectedFoods.length} ${selectedFoods.length === 1 ? 'Food' : 'Foods'}` : 'Meal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickEntry;
