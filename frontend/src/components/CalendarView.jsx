import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api';
import { format } from 'date-fns';

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const response = await api.get('/google/events', {
        params: {
          calendarId: 'primary',
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString()
        }
      });

      const formattedEvents = response.data.events.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        backgroundColor: event.extendedProperties?.private?.source === 'garmin' ? '#4f46e5' : '#10b981',
        extendedProps: {
          description: event.description,
          source: event.extendedProperties?.private?.source
        }
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info) => {
    const event = info.event;
    alert(`
Event: ${event.title}
Start: ${format(new Date(event.start), 'PPpp')}
${event.extendedProps.description ? `\nDescription: ${event.extendedProps.description}` : ''}
${event.extendedProps.source ? `\nSource: ${event.extendedProps.source}` : ''}
    `);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Training Calendar</h2>

      {loading ? (
        <div className="text-center py-8">Loading calendar...</div>
      ) : (
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            editable={false}
            selectable={true}
          />
        </div>
      )}

      <div className="mt-4 flex items-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-indigo-600 rounded mr-2"></div>
          <span>Garmin Workouts</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
          <span>Other Events</span>
        </div>
      </div>
    </div>
  );
}
