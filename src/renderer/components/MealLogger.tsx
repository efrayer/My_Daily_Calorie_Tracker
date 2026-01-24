import React, { useState } from 'react';
import { MealEntry, FoodItem, SavedFood, AppData } from '../types';
import { getCurrentTimeString } from '../utils/dateUtils';
import { calculateFoodTotals } from '../utils/calculations';
import { useToast } from './Toast';

interface MealLoggerProps {
  appData: AppData;
  onMealAdded: (meal: MealEntry) => void;
  onClose: () => void;
  existingMeal?: MealEntry;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

function MealLogger({ appData, onMealAdded, onClose, existingMeal }: MealLoggerProps) {
  const [mealType, setMealType] = useState<MealType>(existingMeal?.mealType || 'breakfast');
  const [time, setTime] = useState(existingMeal?.time || getCurrentTimeString());
  const [foods, setFoods] = useState<FoodItem[]>(existingMeal?.foods || []);
  const [notes, setNotes] = useState(existingMeal?.notes || '');
  const [showAddFood, setShowAddFood] = useState(false);
  const [showSavedFoods, setShowSavedFoods] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();
  const isEditing = !!existingMeal;

  // New food form state
  const [newFood, setNewFood] = useState<FoodItem>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    servingSize: '',
  });

  const handleAddCustomFood = () => {
    if (newFood.name.trim() && newFood.calories > 0) {
      setFoods([...foods, { ...newFood }]);
      setNewFood({
        name: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        servingSize: '',
      });
      setShowAddFood(false);
    }
  };

  const handleAddSavedFood = async (savedFood: SavedFood) => {
    const food: FoodItem = {
      name: savedFood.name,
      calories: savedFood.calories,
      protein: savedFood.protein,
      carbs: savedFood.carbs,
      fats: savedFood.fats,
      servingSize: savedFood.servingSize,
    };
    setFoods([...foods, food]);
    setShowSavedFoods(false);
    setSearchQuery('');

    // Increment useCount for the saved food
    const updatedFood: SavedFood = {
      ...savedFood,
      useCount: savedFood.useCount + 1,
    };
    const updatedSavedFoods = appData.savedFoods.map((f) =>
      f.name === savedFood.name ? updatedFood : f
    );
    const updatedAppData = { ...appData, savedFoods: updatedSavedFoods };
    await window.electronAPI.saveAppData(updatedAppData);
  };

  const handleRemoveFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (foods.length === 0) {
      showToast('warning', 'Please add at least one food item');
      return;
    }

    const meal: MealEntry = {
      id: existingMeal?.id || `meal-${Date.now()}`,
      mealType,
      time,
      foods,
      notes: notes.trim() || undefined,
    };

    onMealAdded(meal);
    onClose();
  };

  const calculateTotals = () => {
    return calculateFoodTotals(foods);
  };

  const filteredSavedFoods = appData.savedFoods.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-orange-500 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{isEditing ? 'Edit Meal' : 'Log Meal'}</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-orange-600 rounded-lg p-2 transition-colors"
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

          {/* Meal Type and Time */}
          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium mb-2 text-white/90">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Added Foods List */}
          {foods.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Foods Added</h3>
              <div className="space-y-2">
                {foods.map((food, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{food.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {food.servingSize && <span className="mr-3">{food.servingSize}</span>}
                        <span className="mr-3">{food.calories} cal</span>
                        <span className="mr-3">P: {food.protein}g</span>
                        <span className="mr-3">C: {food.carbs}g</span>
                        <span>F: {food.fats}g</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFood(index)}
                      className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(totals.calories)}
                    </div>
                    <div className="text-xs text-gray-600">Calories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">
                      {Math.round(totals.protein)}g
                    </div>
                    <div className="text-xs text-gray-600">Protein</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">
                      {Math.round(totals.carbs)}g
                    </div>
                    <div className="text-xs text-gray-600">Carbs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">
                      {Math.round(totals.fats)}g
                    </div>
                    <div className="text-xs text-gray-600">Fats</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Food Buttons */}
          {!showAddFood && !showSavedFoods && (
            <div className="space-y-3">
              <button
                onClick={() => setShowSavedFoods(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Add from Food Library
              </button>

              <button
                onClick={() => setShowAddFood(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Custom Food
              </button>
            </div>
          )}

          {/* Add Custom Food Form */}
          {showAddFood && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Add Custom Food</h3>
                <button
                  onClick={() => setShowAddFood(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
                <input
                  type="text"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder="e.g., Grilled Chicken Breast"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serving Size (optional)
                </label>
                <input
                  type="text"
                  value={newFood.servingSize || ''}
                  onChange={(e) => setNewFood({ ...newFood, servingSize: e.target.value })}
                  placeholder="e.g., 6 oz, 1 cup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    value={newFood.calories || ''}
                    onChange={(e) =>
                      setNewFood({ ...newFood, calories: Number(e.target.value) })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={newFood.protein || ''}
                    onChange={(e) =>
                      setNewFood({ ...newFood, protein: Number(e.target.value) })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={newFood.carbs || ''}
                    onChange={(e) =>
                      setNewFood({ ...newFood, carbs: Number(e.target.value) })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={newFood.fats || ''}
                    onChange={(e) => setNewFood({ ...newFood, fats: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleAddCustomFood}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Add Food to Meal
              </button>
            </div>
          )}

          {/* Saved Foods List */}
          {showSavedFoods && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Food Library</h3>
                <button
                  onClick={() => {
                    setShowSavedFoods(false);
                    setSearchQuery('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search foods..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredSavedFoods.length > 0 ? (
                  filteredSavedFoods.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => handleAddSavedFood(food)}
                      className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{food.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {food.servingSize && <span className="mr-3">{food.servingSize}</span>}
                        <span className="mr-3">{food.calories} cal</span>
                        <span className="mr-3">P: {food.protein}g</span>
                        <span className="mr-3">C: {food.carbs}g</span>
                        <span>F: {food.fats}g</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No foods found' : 'No saved foods yet'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this meal..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
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
              onClick={handleSubmit}
              disabled={foods.length === 0}
              className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isEditing ? 'Update Meal' : 'Save Meal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MealLogger;
