import React, { useState } from 'react';
import { SavedFood, AppData, FoodItem } from '../types';

interface FoodLibraryProps {
  appData: AppData;
  onClose: () => void;
  onDataUpdated: () => void;
}

type ViewMode = 'list' | 'add' | 'edit';

function FoodLibrary({ appData, onClose, onDataUpdated }: FoodLibraryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingFood, setEditingFood] = useState<SavedFood | null>(null);

  const [formData, setFormData] = useState<FoodItem & { category?: string }>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    servingSize: '',
    category: '',
  });

  const categories = ['All', 'Protein', 'Carbs', 'Vegetables', 'Fruits', 'Snacks', 'Other'];

  const filteredFoods = appData.savedFoods
    .filter((food) => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ||
        (food.category || 'Other').toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by use count (most used first), then alphabetically
      if (b.useCount !== a.useCount) {
        return b.useCount - a.useCount;
      }
      return a.name.localeCompare(b.name);
    });

  const handleStartAdd = () => {
    setFormData({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      servingSize: '',
      category: 'Other',
    });
    setViewMode('add');
  };

  const handleStartEdit = (food: SavedFood) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
      category: food.category || 'Other',
    });
    setViewMode('edit');
  };

  const handleSaveFood = async () => {
    if (!formData.name.trim() || formData.calories <= 0) {
      alert('Please enter a food name and calories');
      return;
    }

    const updatedSavedFoods = [...appData.savedFoods];

    if (viewMode === 'edit' && editingFood) {
      // Update existing food
      const index = updatedSavedFoods.findIndex((f) => f.id === editingFood.id);
      if (index !== -1) {
        updatedSavedFoods[index] = {
          ...updatedSavedFoods[index],
          name: formData.name,
          calories: formData.calories,
          protein: formData.protein,
          carbs: formData.carbs,
          fats: formData.fats,
          servingSize: formData.servingSize,
          category: formData.category,
        };
      }
    } else {
      // Add new food
      const newFood: SavedFood = {
        id: `food-${Date.now()}`,
        name: formData.name,
        calories: formData.calories,
        protein: formData.protein,
        carbs: formData.carbs,
        fats: formData.fats,
        servingSize: formData.servingSize,
        category: formData.category,
        useCount: 0,
        lastUsed: new Date().toISOString(),
      };
      updatedSavedFoods.push(newFood);
    }

    const result = await window.electronAPI.saveAppData({
      ...appData,
      savedFoods: updatedSavedFoods,
    });

    if (result.success) {
      onDataUpdated();
      setViewMode('list');
      setEditingFood(null);
    } else {
      alert('Failed to save food: ' + (result.error || 'Unknown error'));
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!confirm('Are you sure you want to delete this food?')) {
      return;
    }

    const updatedSavedFoods = appData.savedFoods.filter((f) => f.id !== foodId);

    const result = await window.electronAPI.saveAppData({
      ...appData,
      savedFoods: updatedSavedFoods,
    });

    if (result.success) {
      onDataUpdated();
    } else {
      alert('Failed to delete food: ' + (result.error || 'Unknown error'));
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingFood(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {viewMode === 'list'
                  ? 'Food Library'
                  : viewMode === 'add'
                  ? 'Add New Food'
                  : 'Edit Food'}
              </h2>
              <p className="text-sm text-white/90 mt-1">
                {viewMode === 'list'
                  ? `${appData.savedFoods.length} saved foods`
                  : 'Enter nutritional information'}
              </p>
            </div>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'list' ? (
            <>
              {/* Search and Filter */}
              <div className="mb-6 space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search foods..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleStartAdd}
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Food
                  </button>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category.toLowerCase())}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category.toLowerCase()
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foods List */}
              {filteredFoods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFoods.map((food) => (
                    <div
                      key={food.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{food.name}</h3>
                          {food.servingSize && (
                            <p className="text-sm text-gray-500">{food.servingSize}</p>
                          )}
                          {food.category && (
                            <span className="inline-block mt-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                              {food.category}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleStartEdit(food)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteFood(food.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mt-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-orange-600">
                            {food.calories}
                          </div>
                          <div className="text-xs text-gray-600">cal</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-700">{food.protein}g</div>
                          <div className="text-xs text-gray-600">protein</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-700">{food.carbs}g</div>
                          <div className="text-xs text-gray-600">carbs</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-700">{food.fats}g</div>
                          <div className="text-xs text-gray-600">fats</div>
                        </div>
                      </div>

                      {food.useCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Used {food.useCount} {food.useCount === 1 ? 'time' : 'times'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  <p className="text-gray-500 mb-2">
                    {searchQuery || selectedCategory !== 'all'
                      ? 'No foods found'
                      : 'No saved foods yet'}
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Add foods to your library for quick meal logging
                  </p>
                  <button
                    onClick={handleStartAdd}
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Your First Food
                  </button>
                </div>
              )}
            </>
          ) : (
            // Add/Edit Form
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Food Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grilled Chicken Breast"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serving Size (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.servingSize || ''}
                    onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                    placeholder="e.g., 6 oz, 1 cup"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category || 'Other'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                  <input
                    type="number"
                    value={formData.calories || ''}
                    onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={formData.protein || ''}
                    onChange={(e) => setFormData({ ...formData, protein: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                  <input
                    type="number"
                    value={formData.carbs || ''}
                    onChange={(e) => setFormData({ ...formData, carbs: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fats (g)</label>
                  <input
                    type="number"
                    value={formData.fats || ''}
                    onChange={(e) => setFormData({ ...formData, fats: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formData.calories || 0}
                    </div>
                    <div className="text-xs text-gray-600">Calories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{formData.protein || 0}g</div>
                    <div className="text-xs text-gray-600">Protein</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{formData.carbs || 0}g</div>
                    <div className="text-xs text-gray-600">Carbs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{formData.fats || 0}g</div>
                    <div className="text-xs text-gray-600">Fats</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {viewMode !== 'list' && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFood}
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                {viewMode === 'edit' ? 'Update Food' : 'Save Food'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FoodLibrary;
