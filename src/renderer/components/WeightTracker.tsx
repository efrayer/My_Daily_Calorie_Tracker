import React, { useState } from 'react';
import { AppData, WeightEntry } from '../types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface WeightTrackerProps {
  appData: AppData;
  onClose: () => void;
  onDataUpdated: () => void;
}

function WeightTracker({ appData, onClose, onDataUpdated }: WeightTrackerProps) {
  const [weight, setWeight] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);

  const sortedWeightHistory = [...appData.weightHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestWeight = sortedWeightHistory[0];
  const startingWeight = sortedWeightHistory[sortedWeightHistory.length - 1];
  const targetWeight = appData.goals.targetWeight;

  const weightChange = latestWeight && startingWeight
    ? latestWeight.weight - startingWeight.weight
    : 0;

  const weightToGoal = latestWeight
    ? latestWeight.weight - targetWeight
    : 0;

  // Check if user can log weight today (3x per week limit)
  const canLogToday = () => {
    const today = new Date();
    const thisWeekEntries = sortedWeightHistory.filter((entry) => {
      const entryDate = parseISO(entry.date);
      const daysDiff = differenceInDays(today, entryDate);
      return daysDiff >= 0 && daysDiff < 7;
    });
    return thisWeekEntries.length < 3;
  };

  const handleAddWeight = async () => {
    if (weight <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    if (!canLogToday()) {
      alert('You can only log weight 3 times per week');
      return;
    }

    const newEntry: WeightEntry = {
      weight,
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: notes.trim() || undefined,
    };

    const updatedWeightHistory = [...appData.weightHistory, newEntry];

    const result = await window.electronAPI.saveAppData({
      ...appData,
      weightHistory: updatedWeightHistory,
    });

    if (result.success) {
      onDataUpdated();
      setWeight(0);
      setNotes('');
      setShowAddForm(false);
    } else {
      alert('Failed to save weight: ' + (result.error || 'Unknown error'));
    }
  };

  const handleDeleteWeight = async (date: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) {
      return;
    }

    const updatedWeightHistory = appData.weightHistory.filter((entry) => entry.date !== date);

    const result = await window.electronAPI.saveAppData({
      ...appData,
      weightHistory: updatedWeightHistory,
    });

    if (result.success) {
      onDataUpdated();
    } else {
      alert('Failed to delete weight: ' + (result.error || 'Unknown error'));
    }
  };

  // Prepare chart data (reverse to show oldest to newest)
  const chartData = [...sortedWeightHistory]
    .reverse()
    .map((entry) => ({
      date: format(parseISO(entry.date), 'M/d'),
      weight: entry.weight,
    }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Weight Tracker</h2>
              <p className="text-sm text-white/90 mt-1">Track up to 3 times per week</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-600 rounded-lg p-2 transition-colors"
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
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Weight */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Current Weight</div>
                <div className="text-3xl font-bold text-blue-900">
                  {latestWeight ? `${latestWeight.weight} lbs` : 'No data'}
                </div>
                {latestWeight && (
                  <div className="text-xs text-gray-500 mt-1">
                    {format(parseISO(latestWeight.date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>

              {/* Weight Change */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Change</div>
                <div
                  className={`text-3xl font-bold ${
                    weightChange < 0 ? 'text-green-600' : weightChange > 0 ? 'text-red-600' : 'text-gray-900'
                  }`}
                >
                  {weightChange > 0 ? '+' : ''}
                  {weightChange.toFixed(1)} lbs
                </div>
                {startingWeight && (
                  <div className="text-xs text-gray-500 mt-1">
                    Since {format(parseISO(startingWeight.date), 'MMM d')}
                  </div>
                )}
              </div>

              {/* To Goal */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">To Goal</div>
                <div
                  className={`text-3xl font-bold ${
                    weightToGoal > 0 ? 'text-orange-600' : weightToGoal < 0 ? 'text-green-600' : 'text-gray-900'
                  }`}
                >
                  {weightToGoal > 0 ? '+' : ''}
                  {weightToGoal.toFixed(1)} lbs
                </div>
                <div className="text-xs text-gray-500 mt-1">Goal: {targetWeight} lbs</div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Weight Progress</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                    <YAxis
                      domain={['dataMin - 5', 'dataMax + 5']}
                      style={{ fontSize: '12px' }}
                      label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <ReferenceLine
                      y={targetWeight}
                      stroke="#f97316"
                      strokeDasharray="3 3"
                      label="Goal"
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Add Weight Button / Form */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                disabled={!canLogToday()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {canLogToday() ? 'Log Weight Today' : 'Already logged 3 times this week'}
              </button>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Add Weight Entry</h3>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setWeight(0);
                      setNotes('');
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      value={weight || ''}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      placeholder="Enter your weight"
                      step="0.1"
                      className="w-full px-4 py-3 text-xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="How are you feeling? Any changes?"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleAddWeight}
                    disabled={weight <= 0}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Save Weight
                  </button>
                </div>
              </div>
            )}

            {/* Weight History */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Weight History</h3>
              </div>
              {sortedWeightHistory.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {sortedWeightHistory.map((entry) => (
                    <div
                      key={entry.date}
                      className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-bold text-gray-900">
                            {entry.weight} lbs
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1 italic">{entry.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteWeight(entry.date)}
                        className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete entry"
                      >
                        <svg
                          className="w-5 h-5"
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
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
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
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                  <p className="mb-2">No weight entries yet</p>
                  <p className="text-sm">Start tracking your progress today</p>
                </div>
              )}
            </div>

            {/* Info */}
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
                Weight Tracking Tips
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-7">
                <li>• Weigh yourself at the same time each day (morning is best)</li>
                <li>• Track 3 times per week for consistent monitoring</li>
                <li>• Weight fluctuates naturally - focus on the trend</li>
                <li>• Use the same scale in the same location</li>
                <li>• Don't stress over daily changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeightTracker;
