import React, { useState } from 'react';
import { RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { format, addDays } from 'date-fns';

export default function SyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));

  const handleSync = async (direction) => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const endpoint = direction === 'garmin-to-google'
        ? '/sync/garmin-to-google'
        : '/sync/google-to-garmin';

      const response = await api.post(endpoint, {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        calendarId: 'primary'
      });

      setSyncResult(response.data);
    } catch (error) {
      setSyncResult({
        success: false,
        error: error.response?.data?.error || 'Sync failed'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Sync Training Plans</h2>

      {/* Date Range Selector */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Sync Buttons */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <button
          onClick={() => handleSync('garmin-to-google')}
          disabled={syncing}
          className="flex items-center justify-center bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <ArrowRight className="w-5 h-5 mr-2" />
          Garmin to Google
        </button>
        <button
          onClick={() => handleSync('google-to-garmin')}
          disabled={syncing}
          className="flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Google to Garmin
        </button>
      </div>

      {/* Sync Status */}
      {syncing && (
        <div className="flex items-center justify-center text-indigo-600">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          Syncing...
        </div>
      )}

      {/* Sync Result */}
      {syncResult && (
        <div
          className={`p-4 rounded-lg ${
            syncResult.success
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}
        >
          {syncResult.success ? (
            <div>
              <p className="font-semibold">Sync Successful!</p>
              <p className="text-sm">
                Synced {syncResult.synced} of {syncResult.total} items
              </p>
              {syncResult.note && (
                <p className="text-sm mt-2 italic">{syncResult.note}</p>
              )}
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold">Errors:</p>
                  <ul className="text-xs list-disc list-inside">
                    {syncResult.errors.map((err, idx) => (
                      <li key={idx}>{err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="font-semibold">Sync Failed</p>
              <p className="text-sm">{syncResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
