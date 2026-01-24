import React, { useState, useEffect } from 'react';
import { DailyEntry, AppData } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';

interface CalendarViewProps {
  appData: AppData;
  onClose: () => void;
}

function CalendarView({ appData, onClose }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMonthEntries();
  }, [currentMonth]);

  const loadMonthEntries = async () => {
    setIsLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEntries = await window.electronAPI.getDailyEntries(start, end);
      setEntries(monthEntries);
    } catch (error) {
      console.error('Error loading month entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = entries.find(e => e.date === dateStr);
    setSelectedEntry(entry || null);
  };

  const getEntryForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.find(e => e.date === dateStr);
  };

  const calculateDayTotals = (entry: DailyEntry) => {
    return entry.meals.reduce(
      (totals, meal) => {
        meal.foods.forEach(food => {
          totals.calories += food.calories;
          totals.protein += food.protein;
          totals.carbs += food.carbs;
          totals.fats += food.fats;
        });
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const getDayColor = (entry: DailyEntry) => {
    const totals = calculateDayTotals(entry);
    const goal = appData.goals.dailyCalories;
    const percentage = (totals.calories / goal) * 100;

    if (percentage < 80) return 'bg-green-100 border-green-300 text-green-900';
    if (percentage <= 110) return 'bg-blue-100 border-blue-300 text-blue-900';
    return 'bg-red-100 border-red-300 text-red-900';
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = monthStart.getDay();

  // Create empty cells for days before the month starts
  const emptyCells = Array(firstDayOfWeek).fill(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Calendar View</h2>
              <p className="text-sm text-white/90 mt-1">View your nutrition history</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-purple-600 rounded-lg p-2 transition-colors"
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
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            {/* Calendar */}
            <div className="lg:col-span-2 p-6 border-r border-gray-200">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}

                {/* Empty cells before month starts */}
                {emptyCells.map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square"></div>
                ))}

                {/* Days */}
                {daysInMonth.map(date => {
                  const entry = getEntryForDate(date);
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateClick(date)}
                      className={`aspect-square p-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : entry
                          ? getDayColor(entry)
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      } ${isToday ? 'ring-2 ring-purple-300' : ''}`}
                    >
                      <div className="flex flex-col h-full">
                        <div className={`text-sm font-medium ${isToday ? 'text-purple-600' : ''}`}>
                          {format(date, 'd')}
                        </div>
                        {entry && (
                          <div className="mt-auto text-xs font-medium">
                            {Math.round(calculateDayTotals(entry).calories)}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                  <span className="text-gray-600">Under goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                  <span className="text-gray-600">On target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span className="text-gray-600">Over goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 ring-2 ring-purple-300 rounded"></div>
                  <span className="text-gray-600">Today</span>
                </div>
              </div>
            </div>

            {/* Details Panel */}
            <div className="p-6 bg-gray-50">
              {selectedEntry ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {format(parseISO(selectedEntry.date), 'EEEE, MMM d')}
                    </h4>
                    <p className="text-sm text-gray-600">Daily Summary</p>
                  </div>

                  {/* Totals */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-3">Nutrition</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(calculateDayTotals(selectedEntry).calories)}
                        </div>
                        <div className="text-xs text-gray-600">Calories</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-700">
                          {Math.round(calculateDayTotals(selectedEntry).protein)}g
                        </div>
                        <div className="text-xs text-gray-600">Protein</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-700">
                          {Math.round(calculateDayTotals(selectedEntry).carbs)}g
                        </div>
                        <div className="text-xs text-gray-600">Carbs</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-700">
                          {Math.round(calculateDayTotals(selectedEntry).fats)}g
                        </div>
                        <div className="text-xs text-gray-600">Fats</div>
                      </div>
                    </div>
                  </div>

                  {/* Meals */}
                  {selectedEntry.meals.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-3">
                        Meals ({selectedEntry.meals.length})
                      </h5>
                      <div className="space-y-3">
                        {selectedEntry.meals.map(meal => (
                          <div key={meal.id} className="text-sm">
                            <div className="font-medium text-gray-900 capitalize">
                              {meal.mealType} <span className="text-gray-500">• {meal.time}</span>
                            </div>
                            <div className="text-gray-600 mt-1">
                              {meal.foods.map(f => f.name).join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exercise */}
                  {selectedEntry.exercise && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-2">Exercise</h5>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {selectedEntry.exercise.type}
                        </div>
                        <div className="text-gray-600">
                          {selectedEntry.exercise.caloriesBurned} calories burned
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Water & Weight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-1 text-sm">Water</h5>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedEntry.water.glasses}
                      </div>
                      <div className="text-xs text-gray-600">glasses</div>
                    </div>
                    {selectedEntry.weight && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-1 text-sm">Weight</h5>
                        <div className="text-lg font-bold text-gray-700">
                          {selectedEntry.weight}
                        </div>
                        <div className="text-xs text-gray-600">lbs</div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedEntry.notes && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-2">Notes</h5>
                      <p className="text-sm text-gray-600">{selectedEntry.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p>Click a date to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;
