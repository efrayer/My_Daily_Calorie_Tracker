import React, { useState, useEffect } from 'react';
import { DailyEntry, AppData } from '../types';
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface StatsViewProps {
  appData: AppData;
  onClose: () => void;
}

type TimeRange = '7days' | '30days' | '90days';

function StatsView({ appData, onClose }: StatsViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [timeRange]);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const daysBack = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      const startDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const data = await window.electronAPI.getDailyEntries(startDate, endDate);
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
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

  // Prepare calorie trend data
  const calorieTrendData = entries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
      const totals = calculateDayTotals(entry);
      return {
        date: format(new Date(entry.date), 'M/d'),
        calories: Math.round(totals.calories),
        goal: appData.goals.dailyCalories,
      };
    });

  // Calculate averages
  const avgCalories = entries.length > 0
    ? Math.round(entries.reduce((sum, entry) => sum + calculateDayTotals(entry).calories, 0) / entries.length)
    : 0;

  const avgProtein = entries.length > 0
    ? Math.round(entries.reduce((sum, entry) => sum + calculateDayTotals(entry).protein, 0) / entries.length)
    : 0;

  const avgCarbs = entries.length > 0
    ? Math.round(entries.reduce((sum, entry) => sum + calculateDayTotals(entry).carbs, 0) / entries.length)
    : 0;

  const avgFats = entries.length > 0
    ? Math.round(entries.reduce((sum, entry) => sum + calculateDayTotals(entry).fats, 0) / entries.length)
    : 0;

  // Macro distribution pie data
  const macroData = [
    { name: 'Protein', value: avgProtein * 4, color: '#3b82f6' },
    { name: 'Carbs', value: avgCarbs * 4, color: '#10b981' },
    { name: 'Fats', value: avgFats * 9, color: '#f59e0b' },
  ];

  // Weekly comparison data
  const weeklyData = (() => {
    const thisWeekStart = startOfWeek(new Date());
    const thisWeekEnd = endOfWeek(new Date());
    const lastWeekStart = startOfWeek(subWeeks(new Date(), 1));
    const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1));

    const thisWeekEntries = entries.filter(e => {
      const date = new Date(e.date);
      return date >= thisWeekStart && date <= thisWeekEnd;
    });

    const lastWeekEntries = entries.filter(e => {
      const date = new Date(e.date);
      return date >= lastWeekStart && date <= lastWeekEnd;
    });

    const thisWeekAvg = thisWeekEntries.length > 0
      ? thisWeekEntries.reduce((sum, e) => sum + calculateDayTotals(e).calories, 0) / thisWeekEntries.length
      : 0;

    const lastWeekAvg = lastWeekEntries.length > 0
      ? lastWeekEntries.reduce((sum, e) => sum + calculateDayTotals(e).calories, 0) / lastWeekEntries.length
      : 0;

    return [
      { week: 'Last Week', calories: Math.round(lastWeekAvg) },
      { week: 'This Week', calories: Math.round(thisWeekAvg) },
    ];
  })();

  // Exercise stats
  const totalExerciseDays = entries.filter(e => e.exercise).length;
  const totalExerciseCalories = entries.reduce((sum, e) => sum + (e.exercise?.caloriesBurned || 0), 0);

  // Meal type distribution
  const mealTypeCount = entries.reduce((acc, entry) => {
    entry.meals.forEach(meal => {
      acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const COLORS = ['#f97316', '#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Statistics & Analytics</h2>
              <p className="text-sm text-white/90 mt-1">Track your progress over time</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-indigo-600 rounded-lg p-2 transition-colors"
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

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {[
              { value: '7days' as TimeRange, label: 'Last 7 Days' },
              { value: '30days' as TimeRange, label: 'Last 30 Days' },
              { value: '90days' as TimeRange, label: 'Last 90 Days' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === option.value
                    ? 'bg-white text-indigo-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p>No data for selected period</p>
                <p className="text-sm mt-1">Start logging meals to see your stats</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Avg Calories/Day</div>
                  <div className="text-3xl font-bold text-orange-600">{avgCalories}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Goal: {appData.goals.dailyCalories}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Avg Protein</div>
                  <div className="text-3xl font-bold text-blue-600">{avgProtein}g</div>
                  <div className="text-xs text-gray-500 mt-1">Goal: {appData.goals.protein}g</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Days Logged</div>
                  <div className="text-3xl font-bold text-green-600">{entries.length}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {timeRange === '7days' ? 'Last 7 days' : timeRange === '30days' ? 'Last 30 days' : 'Last 90 days'}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Workouts</div>
                  <div className="text-3xl font-bold text-purple-600">{totalExerciseDays}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(totalExerciseCalories)} cal burned
                  </div>
                </div>
              </div>

              {/* Calorie Trend Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Calorie Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={calorieTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="goal"
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      name="Goal"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="#f97316"
                      strokeWidth={2}
                      name="Calories"
                      dot={{ fill: '#f97316', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly Comparison */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Weekly Comparison</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Bar dataKey="calories" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Macro Distribution */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Average Macro Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Macro Averages</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Protein:</span>
                      <span className="font-medium">{avgProtein}g ({Math.round((avgProtein * 4 / avgCalories) * 100)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carbs:</span>
                      <span className="font-medium">{avgCarbs}g ({Math.round((avgCarbs * 4 / avgCalories) * 100)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fats:</span>
                      <span className="font-medium">{avgFats}g ({Math.round((avgFats * 9 / avgCalories) * 100)}%)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Meal Frequency</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(mealTypeCount).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{type}:</span>
                        <span className="font-medium">{count} times</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Exercise Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workout Days:</span>
                      <span className="font-medium">{totalExerciseDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Burned:</span>
                      <span className="font-medium">{totalExerciseCalories} cal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg per Workout:</span>
                      <span className="font-medium">
                        {totalExerciseDays > 0 ? Math.round(totalExerciseCalories / totalExerciseDays) : 0} cal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsView;
