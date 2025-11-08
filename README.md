# Garmin Calendar Sync

A personal web application that syncs your Garmin Connect training plans with Google Calendar, allowing you to view and manage your workouts in one unified dashboard.

## Features

- **Garmin Connect Integration**: Connect to your Garmin account and fetch training plans
- **Google Calendar Sync**: Sync workouts to your Google Calendar
- **Bidirectional Sync**:
  - Garmin → Google Calendar (sync training plans to your calendar)
  - Google Calendar → Garmin (update workouts from calendar edits)
- **Interactive Dashboard**: View all your training plans in a calendar interface
- **Sync History**: Track all synchronization activities
- **Automatic Mapping**: Maintains sync mappings between Garmin workouts and Google Calendar events
- **Multi-User Support**: Each user has their own isolated data and connections
- **Bot Protection**: Google reCAPTCHA v2 integration for login and registration

## Tech Stack

### Backend
- **Node.js** + **Express**: API server
- **SQLite**: Database for user data and sync mappings
- **garmin-connect**: Unofficial Garmin Connect API client
- **googleapis**: Official Google Calendar API
- **JWT**: Authentication

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **FullCalendar**: Interactive calendar component
- **React Router**: Navigation
- **Axios**: HTTP client

## Prerequisites

- Node.js 18+ and npm
- Garmin Connect account
- Google Cloud Project with Calendar API enabled

## Setup Instructions

### 1. Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3001/api/google/callback`
   - Save the Client ID and Client Secret

### 2. Google reCAPTCHA Setup (Bot Protection)

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Click "+" to create a new site
3. Fill in the form:
   - **Label**: Garmin Calendar Sync (or any name you prefer)
   - **reCAPTCHA type**: Choose "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - **Domains**: Add `localhost` for development
4. Accept the reCAPTCHA Terms of Service
5. Click "Submit"
6. Save both keys:
   - **Site Key**: Used in the frontend (.env file)
   - **Secret Key**: Used in the backend (.env file)

**Note**: reCAPTCHA is optional. If not configured, the app will work without CAPTCHA verification (useful for development).

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add your credentials
# - Set a strong JWT_SECRET
# - Add your Google Client ID and Secret
# - Add your reCAPTCHA Secret Key (optional)
nano .env

# Create data directory for SQLite database
mkdir -p data

# Start the backend server
npm run dev
```

The backend will start on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example (optional, for reCAPTCHA)
cp .env.example .env

# Edit .env and add your reCAPTCHA Site Key (optional)
nano .env

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

### 1. Register/Login

1. Open `http://localhost:5173` in your browser
2. Register a new account or login with existing credentials

### 2. Connect Services

#### Connect Garmin
1. Click "Connect Garmin" in the Connections panel
2. Enter your Garmin Connect email and password
3. Click "Connect"

#### Connect Google Calendar
1. Click "Connect Google" in the Connections panel
2. You'll be redirected to Google's OAuth consent screen
3. Authorize the application to access your Google Calendar
4. You'll be redirected back to the dashboard

### 3. Sync Training Plans

#### Garmin → Google Calendar
1. Select the date range you want to sync
2. Click "Garmin to Google"
3. Your Garmin workouts will be added to Google Calendar

#### Google Calendar → Garmin
1. Make edits to Garmin-sourced events in Google Calendar
2. Select the date range
3. Click "Google to Garmin"
4. **Note**: Garmin API has limited write access, so some updates may need to be done manually in Garmin Connect

### 4. View Training Calendar

- The dashboard displays a full calendar view of all your events
- Garmin workouts are shown in blue
- Other calendar events are shown in green
- Click on any event to view details

### 5. Review Sync History

- Scroll down to the Sync History section
- View all past synchronization attempts
- Check for any errors or partial syncs

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Garmin
- `POST /api/garmin/connect` - Connect to Garmin
- `GET /api/garmin/training-plan` - Get training plan
- `GET /api/garmin/status` - Check connection status
- `POST /api/garmin/disconnect` - Disconnect from Garmin

### Google Calendar
- `GET /api/google/auth-url` - Get OAuth URL
- `GET /api/google/callback` - OAuth callback
- `GET /api/google/calendars` - List calendars
- `GET /api/google/events` - Get events
- `POST /api/google/events` - Create event
- `PUT /api/google/events/:eventId` - Update event
- `DELETE /api/google/events/:eventId` - Delete event
- `GET /api/google/status` - Check connection status

### Sync
- `POST /api/sync/garmin-to-google` - Sync Garmin to Google
- `POST /api/sync/google-to-garmin` - Sync Google to Garmin
- `GET /api/sync/history` - Get sync history

## Database Schema

The application uses SQLite with the following tables:

- **users**: User accounts
- **garmin_credentials**: Encrypted Garmin credentials
- **google_tokens**: Google OAuth tokens
- **sync_mappings**: Mapping between Garmin workouts and Google Calendar events
- **sync_history**: Log of all sync operations

## Important Notes

### Garmin API Limitations

This application uses the **unofficial** Garmin Connect API through the `garmin-connect` npm package. Please note:

- The API is not officially supported by Garmin
- Write operations (creating/updating workouts) have limited functionality
- Some features may break if Garmin changes their API
- For best results, use primarily for reading training plans and syncing to Google Calendar

### Security Considerations

- **Production Use**: This is a personal web app intended for local use
- **Credentials Storage**: Garmin credentials are stored in SQLite (encrypt in production!)
- **HTTPS**: Use HTTPS in production environments
- **Environment Variables**: Never commit `.env` file to version control
- **Google OAuth**: Verify redirect URIs match your deployment

## Troubleshooting

### Backend won't start
- Ensure all environment variables are set in `.env`
- Check if port 3001 is available
- Verify Node.js version is 18+

### Frontend won't start
- Ensure port 5173 is available
- Run `npm install` again
- Clear browser cache

### Garmin connection fails
- Verify your Garmin credentials are correct
- Check if you can login to Garmin Connect website
- Garmin might have rate limiting - wait and try again

### Google Calendar connection fails
- Verify OAuth credentials in `.env`
- Check redirect URI matches exactly: `http://localhost:3001/api/google/callback`
- Ensure Google Calendar API is enabled in Google Cloud Console

### Sync not working
- Ensure both Garmin and Google are connected
- Check date range is valid
- Review sync history for error messages
- Check browser console and backend logs for errors

## Development

### Project Structure

```
garmin-calendar-sync/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth middleware
│   │   ├── database/        # Database setup
│   │   └── server.js        # Express app
│   ├── data/                # SQLite database
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context
│   │   ├── services/        # API client
│   │   └── App.jsx
│   └── package.json
└── README.md
```

### Adding Features

Some ideas for enhancements:
- Email notifications for upcoming workouts
- Workout statistics and analytics
- Multiple calendar support
- Automatic scheduled syncs
- Mobile app version
- Workout templates

## License

MIT

## Disclaimer

This is an unofficial tool and is not affiliated with or endorsed by Garmin or Google. Use at your own risk.
