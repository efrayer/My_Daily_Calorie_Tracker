import React, { useState } from 'react';
import { ExerciseEntry } from '../types';
import { useToast } from './Toast';

interface ExerciseLoggerProps {
  currentExercise?: ExerciseEntry;
  onExerciseAdded: (exercise: ExerciseEntry) => void;
  onClose: () => void;
}

type ExerciseType = '2G' | '3G' | 'Tread 50' | 'Weight 50' | 'Other';

function ExerciseLogger({ currentExercise, onExerciseAdded, onClose }: ExerciseLoggerProps) {
  const [exerciseType, setExerciseType] = useState<ExerciseType>(
    currentExercise?.type || '2G'
  );
  const [caloriesBurned, setCaloriesBurned] = useState<number>(
    currentExercise?.caloriesBurned || 0
  );
  const [duration, setDuration] = useState<number>(currentExercise?.duration || 60);
  const [notes, setNotes] = useState<string>(currentExercise?.notes || '');
  const { showToast } = useToast();

  const exerciseTypes: { type: ExerciseType; description: string; defaultCals: number }[] = [
    { type: '2G', description: '2G Class (60 min)', defaultCals: 500 },
    { type: '3G', description: '3G Class (60 min)', defaultCals: 450 },
    { type: 'Tread 50', description: 'Tread 50 (45 min)', defaultCals: 400 },
    { type: 'Weight 50', description: 'Weight 50 (45 min)', defaultCals: 350 },
    { type: 'Other', description: 'Other Workout', defaultCals: 300 },
  ];

  const handleTypeChange = (type: ExerciseType) => {
    setExerciseType(type);
    // Auto-fill suggested calories for the workout type
    const exerciseInfo = exerciseTypes.find((e) => e.type === type);
    if (exerciseInfo && caloriesBurned === 0) {
      setCaloriesBurned(exerciseInfo.defaultCals);
    }
  };

  const handleSubmit = () => {
    if (caloriesBurned <= 0) {
      showToast('warning', 'Please enter calories burned');
      return;
    }

    const exercise: ExerciseEntry = {
      id: currentExercise?.id || `exercise-${Date.now()}`,
      type: exerciseType,
      caloriesBurned,
      duration: duration > 0 ? duration : undefined,
      notes: notes.trim() || undefined,
    };

    onExerciseAdded(exercise);
    onClose();
  };

  const getExerciseIcon = (type: ExerciseType) => {
    if (type === 'Tread 50') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
    }
    if (type === 'Weight 50') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
          />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                {currentExercise ? 'Edit Exercise' : 'Log Exercise'}
              </h2>
              <p className="text-sm text-white/90 mt-1">Track your Orange Theory workout</p>
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

          {/* Current Selection Display */}
          <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                {getExerciseIcon(exerciseType)}
              </div>
              <div>
                <div className="text-lg font-bold">{exerciseType}</div>
                <div className="text-sm text-white/90">
                  {caloriesBurned > 0 ? `${caloriesBurned} calories` : 'Enter calories burned'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Exercise Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Workout Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exerciseTypes.map((exercise) => (
                  <button
                    key={exercise.type}
                    onClick={() => handleTypeChange(exercise.type)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      exerciseType === exercise.type
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          exerciseType === exercise.type
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {getExerciseIcon(exercise.type)}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`font-semibold ${
                            exerciseType === exercise.type ? 'text-orange-900' : 'text-gray-900'
                          }`}
                        >
                          {exercise.type}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {exercise.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ~{exercise.defaultCals} cal avg
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calories Burned */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calories Burned
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={caloriesBurned || ''}
                  onChange={(e) => setCaloriesBurned(Number(e.target.value))}
                  placeholder="Enter calories burned"
                  className="w-full px-4 py-3 text-xl font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="0"
                  step="10"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  cal
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Check your heart rate monitor or OTF app for accurate calorie count
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={duration || ''}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  placeholder="60"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="0"
                  step="5"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  minutes
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did you feel? Any PRs or achievements?"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Quick Stats Info */}
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
                Orange Theory Tips
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-7">
                <li>• 2G classes typically burn 450-600 calories</li>
                <li>• 3G classes typically burn 400-550 calories</li>
                <li>• Check your heart rate monitor for accurate tracking</li>
                <li>• Exercise calories can offset your daily intake</li>
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
              onClick={handleSubmit}
              disabled={caloriesBurned <= 0}
              className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {currentExercise ? 'Update Exercise' : 'Save Exercise'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExerciseLogger;
