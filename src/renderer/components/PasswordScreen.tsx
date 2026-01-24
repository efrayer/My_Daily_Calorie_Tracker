import React, { useState, useEffect } from 'react';

interface PasswordScreenProps {
  onAuthenticated: (dataPath: string) => void;
}

function PasswordScreen({ onAuthenticated }: PasswordScreenProps) {
  const [dataPath, setDataPath] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkExistingDataPath();
  }, []);

  const checkExistingDataPath = async () => {
    const existingPath = await window.electronAPI.getDataPath();
    if (existingPath) {
      setDataPath(existingPath);
    }
  };

  const handleSelectFolder = async () => {
    const selectedPath = await window.electronAPI.selectDataFolder();
    if (selectedPath) {
      setDataPath(selectedPath);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!dataPath) {
      setError('Please select a data folder first');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await window.electronAPI.verifyPassword(password);

      if (isValid) {
        await window.electronAPI.setPassword(password, rememberMe);
        onAuthenticated(dataPath);
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
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
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Daily Calorie Tracker
          </h1>
          <p className="text-gray-600">
            Track your nutrition and reach your goals
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Folder
            </label>
            {dataPath ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 truncate">
                  {dataPath}
                </div>
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSelectFolder}
                className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Select Data Folder
              </button>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Choose where your encrypted data will be stored (e.g., OneDrive folder)
            </p>
          </div>

          {/* Password Input */}
          {dataPath && (
            <>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                  placeholder="Enter your password"
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">
                  First time? Create a new password. Returning? Enter your existing password.
                </p>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  Remember me (save password securely)
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </>
          )}
        </form>

        {/* Footer Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <svg
              className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p>
              Your data is encrypted with AES-256 encryption. Your password is never sent anywhere
              and is only stored locally if you check "Remember me".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordScreen;
