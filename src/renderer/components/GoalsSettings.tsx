import React, { useState } from 'react';
import { AppData, UserGoals } from '../types';

interface GoalsSettingsProps {
  appData: AppData;
  onClose: () => void;
  onDataUpdated: () => void;
}

function GoalsSettings({ appData, onClose, onDataUpdated }: GoalsSettingsProps) {
  const [goals, setGoals] = useState<UserGoals>(appData.goals);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await window.electronAPI.saveAppData({
        ...appData,
        goals,
      });

      if (result.success) {
        onDataUpdated();
        onClose();
      } else {
        alert('Failed to save goals: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('An error occurred while saving goals');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateMacroCalories = () => {
    const proteinCals = goals.protein * 4;
    const carbsCals = goals.carbs * 4;
    const fatsCals = goals.fats * 9;
    const total = proteinCals + carbsCals + fatsCals;

    return {
      proteinCals,
      carbsCals,
      fatsCals,
      total,
      proteinPercent: total > 0 ? Math.round((proteinCals / total) * 100) : 0,
      carbsPercent: total > 0 ? Math.round((carbsCals / total) * 100) : 0,
      fatsPercent: total > 0 ? Math.round((fatsCals / total) * 100) : 0,
    };
  };

  const macroBreakdown = calculateMacroCalories();
  const caloriesDiff = goals.dailyCalories - macroBreakdown.total;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Goals & Settings</h2>
              <p className="text-sm text-white/90 mt-1">
                Customize your daily nutrition targets
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
          <div className="space-y-6">
            {/* Calorie Goal */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Daily Calorie Goal
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={goals.dailyCalories}
                  onChange={(e) =>
                    setGoals({ ...goals, dailyCalories: Number(e.target.value) })
                  }
                  className="flex-1 px-4 py-3 text-2xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="0"
                  step="50"
                />
                <span className="text-xl font-medium text-gray-700">calories/day</span>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Your target daily calorie intake to reach your goals
              </p>
            </div>

            {/* Macro Goals */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Macronutrient Goals (grams/day)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Protein */}
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Protein
                  </label>
                  <div className="flex items-baseline gap-2 mb-2">
                    <input
                      type="number"
                      value={goals.protein}
                      onChange={(e) => setGoals({ ...goals, protein: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="5"
                    />
                    <span className="text-gray-600 font-medium">g</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{macroBreakdown.proteinCals} calories</div>
                    <div className="font-medium text-blue-600">
                      {macroBreakdown.proteinPercent}% of total
                    </div>
                  </div>
                </div>

                {/* Carbs */}
                <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carbs</label>
                  <div className="flex items-baseline gap-2 mb-2">
                    <input
                      type="number"
                      value={goals.carbs}
                      onChange={(e) => setGoals({ ...goals, carbs: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      step="5"
                    />
                    <span className="text-gray-600 font-medium">g</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{macroBreakdown.carbsCals} calories</div>
                    <div className="font-medium text-green-600">
                      {macroBreakdown.carbsPercent}% of total
                    </div>
                  </div>
                </div>

                {/* Fats */}
                <div className="bg-white border-2 border-yellow-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fats</label>
                  <div className="flex items-baseline gap-2 mb-2">
                    <input
                      type="number"
                      value={goals.fats}
                      onChange={(e) => setGoals({ ...goals, fats: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      min="0"
                      step="5"
                    />
                    <span className="text-gray-600 font-medium">g</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{macroBreakdown.fatsCals} calories</div>
                    <div className="font-medium text-yellow-600">
                      {macroBreakdown.fatsPercent}% of total
                    </div>
                  </div>
                </div>
              </div>

              {/* Macro Summary */}
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Macros total to calories:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {macroBreakdown.total} cal
                  </span>
                </div>
                {Math.abs(caloriesDiff) > 0 && (
                  <div
                    className={`text-sm ${
                      caloriesDiff > 0 ? 'text-orange-600' : 'text-red-600'
                    }`}
                  >
                    {caloriesDiff > 0 ? (
                      <>
                        ⚠️ Your macros add up to {Math.abs(caloriesDiff)} calories less than your
                        daily goal
                      </>
                    ) : (
                      <>
                        ⚠️ Your macros add up to {Math.abs(caloriesDiff)} calories more than your
                        daily goal
                      </>
                    )}
                  </div>
                )}
                {caloriesDiff === 0 && (
                  <div className="text-sm text-green-600">
                    ✓ Your macros perfectly match your calorie goal
                  </div>
                )}

                {/* Macro Distribution Bar */}
                <div className="mt-3">
                  <div className="flex h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500"
                      style={{ width: `${macroBreakdown.proteinPercent}%` }}
                      title={`Protein ${macroBreakdown.proteinPercent}%`}
                    ></div>
                    <div
                      className="bg-green-500"
                      style={{ width: `${macroBreakdown.carbsPercent}%` }}
                      title={`Carbs ${macroBreakdown.carbsPercent}%`}
                    ></div>
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${macroBreakdown.fatsPercent}%` }}
                      title={`Fats ${macroBreakdown.fatsPercent}%`}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>
                      <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-1"></span>
                      Protein {macroBreakdown.proteinPercent}%
                    </span>
                    <span>
                      <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>
                      Carbs {macroBreakdown.carbsPercent}%
                    </span>
                    <span>
                      <span className="inline-block w-3 h-3 bg-yellow-500 rounded mr-1"></span>
                      Fats {macroBreakdown.fatsPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Common Macro Presets */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const cals = goals.dailyCalories;
                      setGoals({
                        ...goals,
                        protein: Math.round(cals * 0.3 / 4),
                        carbs: Math.round(cals * 0.4 / 4),
                        fats: Math.round(cals * 0.3 / 9),
                      });
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
                  >
                    Balanced (30/40/30)
                  </button>
                  <button
                    onClick={() => {
                      const cals = goals.dailyCalories;
                      setGoals({
                        ...goals,
                        protein: Math.round(cals * 0.4 / 4),
                        carbs: Math.round(cals * 0.3 / 4),
                        fats: Math.round(cals * 0.3 / 9),
                      });
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
                  >
                    High Protein (40/30/30)
                  </button>
                  <button
                    onClick={() => {
                      const cals = goals.dailyCalories;
                      setGoals({
                        ...goals,
                        protein: Math.round(cals * 0.25 / 4),
                        carbs: Math.round(cals * 0.1 / 4),
                        fats: Math.round(cals * 0.65 / 9),
                      });
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
                  >
                    Keto (25/10/65)
                  </button>
                </div>
              </div>
            </div>

            {/* Other Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Weight */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Weight
                </label>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    value={goals.targetWeight}
                    onChange={(e) => setGoals({ ...goals, targetWeight: Number(e.target.value) })}
                    className="flex-1 px-3 py-2 text-xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                    step="0.5"
                  />
                  <span className="text-gray-600 font-medium">lbs</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Your goal weight</p>
              </div>

              {/* Water Intake */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Water Goal
                </label>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    value={goals.waterGlasses}
                    onChange={(e) => setGoals({ ...goals, waterGlasses: Number(e.target.value) })}
                    className="flex-1 px-3 py-2 text-xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                    step="1"
                  />
                  <span className="text-gray-600 font-medium">glasses</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">8 oz glasses per day</p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Tips for Setting Goals
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-7">
                <li>• Protein: 4 calories per gram</li>
                <li>• Carbs: 4 calories per gram</li>
                <li>• Fats: 9 calories per gram</li>
                <li>• Adjust macros to match your calorie goal</li>
                <li>• Common ratio is 30% protein, 40% carbs, 30% fats</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalsSettings;
