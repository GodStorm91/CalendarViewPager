import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';

export default function SyncHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.get('/sync/history', {
        params: { limit: 20 }
      });
      setHistory(response.data.history);
    } catch (error) {
      console.error('Error loading sync history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Sync History</h2>
        <button
          onClick={loadHistory}
          className="text-indigo-600 hover:text-indigo-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No sync history yet. Start by syncing your training plans!
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {item.status === 'success' || item.status === 'partial' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-semibold">
                      {item.sync_type === 'garmin_to_google'
                        ? 'Garmin → Google Calendar'
                        : 'Google Calendar → Garmin'}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Items synced: {item.items_synced}</p>
                    <p className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {format(new Date(item.synced_at), 'PPpp')}
                    </p>
                    {item.error_message && (
                      <p className="text-red-600 text-xs mt-2">
                        {item.error_message}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'partial'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
