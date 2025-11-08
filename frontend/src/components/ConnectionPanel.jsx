import React, { useState } from 'react';
import { CheckCircle, XCircle, Settings } from 'lucide-react';
import api from '../services/api';

export default function ConnectionPanel({ garminConnected, googleConnected, onConnectionChange }) {
  const [showGarminModal, setShowGarminModal] = useState(false);
  const [garminEmail, setGarminEmail] = useState('');
  const [garminPassword, setGarminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGarminConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/garmin/connect', {
        email: garminEmail,
        password: garminPassword
      });

      setShowGarminModal(false);
      setGarminEmail('');
      setGarminPassword('');
      onConnectionChange();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to Garmin');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const response = await api.get('/google/auth-url');
      window.location.href = response.data.authUrl;
    } catch (err) {
      console.error('Failed to get Google auth URL:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Connections</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Garmin Connection */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <img
                src="https://static.garmin.com/com.garmin.gps/apple-touch-icon.png"
                alt="Garmin"
                className="w-8 h-8 mr-2"
              />
              <h3 className="font-semibold">Garmin Connect</h3>
            </div>
            {garminConnected ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {garminConnected
              ? 'Connected to your Garmin account'
              : 'Connect to sync your training plans'}
          </p>

          {!garminConnected && (
            <button
              onClick={() => setShowGarminModal(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Connect Garmin
            </button>
          )}
        </div>

        {/* Google Calendar Connection */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <img
                src="https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png"
                alt="Google Calendar"
                className="w-8 h-8 mr-2"
              />
              <h3 className="font-semibold">Google Calendar</h3>
            </div>
            {googleConnected ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {googleConnected
              ? 'Connected to your Google Calendar'
              : 'Connect to sync events'}
          </p>

          {!googleConnected && (
            <button
              onClick={handleGoogleConnect}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Connect Google
            </button>
          )}
        </div>
      </div>

      {/* Garmin Connection Modal */}
      {showGarminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Connect to Garmin</h3>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleGarminConnect}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Garmin Email
                </label>
                <input
                  type="email"
                  value={garminEmail}
                  onChange={(e) => setGarminEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Garmin Password
                </label>
                <input
                  type="password"
                  value={garminPassword}
                  onChange={(e) => setGarminPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGarminModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
