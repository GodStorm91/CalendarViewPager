import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, RefreshCw, Settings, Calendar as CalendarIcon } from 'lucide-react';
import api from '../services/api';
import ConnectionPanel from '../components/ConnectionPanel';
import CalendarView from '../components/CalendarView';
import SyncPanel from '../components/SyncPanel';
import SyncHistory from '../components/SyncHistory';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [garminConnected, setGarminConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const [garminRes, googleRes] = await Promise.all([
        api.get('/garmin/status'),
        api.get('/google/status')
      ]);

      setGarminConnected(garminRes.data.connected);
      setGoogleConnected(googleRes.data.connected);
    } catch (error) {
      console.error('Error checking connections:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CalendarIcon className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Garmin Calendar Sync
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <ConnectionPanel
          garminConnected={garminConnected}
          googleConnected={googleConnected}
          onConnectionChange={checkConnections}
        />

        {/* Sync Panel */}
        {garminConnected && googleConnected && (
          <SyncPanel />
        )}

        {/* Calendar View */}
        {garminConnected && googleConnected && (
          <CalendarView />
        )}

        {/* Sync History */}
        {garminConnected && googleConnected && (
          <SyncHistory />
        )}
      </main>
    </div>
  );
}
