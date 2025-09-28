# ☕ Roast Buddy

A professional coffee roasting logging and analysis application built with React and FastAPI. Track your roasting sessions, log temperature changes, and analyze your coffee roasting data.

![FreshRoast Assistant](https://img.shields.io/badge/Status-Live-brightgreen)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-blue)

## 🚀 Live Demo

**Frontend:** [roastbuddy.app](https://www.roastbuddy.app)  
**Backend API:** [Railway](https://roast-backend-production-8883.up.railway.app)

## 🛠️ Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions, including:
- CORS issues on Railway
- JWT authentication problems  
- Environment variable configuration
- Deployment mistakes to avoid

## 🆕 Latest Updates

### 🏗️ MAJOR ARCHITECTURE REFACTORING (December 2024)
- **🎯 47% Size Reduction:** App.jsx reduced from 1902 lines to 1007 lines
- **🧩 Component Architecture:** Extracted 7 major reusable components from monolithic App.jsx
- **⚡ Improved Maintainability:** Clean, modular codebase with focused component responsibilities
- **🔧 Enhanced Developer Experience:** Better code organization and easier debugging
- **📦 Component Library:** Created comprehensive component library for roast workflow

### Recent Fixes & Improvements
- **🔧 Environmental Data Accuracy Fix:** Fixed timestamp selection logic to ensure accurate current weather data instead of stale forecast data
- **🌡️ Improved Weather Integration:** Enhanced Open-Meteo API integration with better timezone handling and current conditions
- **📅 Real-time Timestamps:** Environmental data now shows actual current time instead of future forecast times

### Major Feature Additions
- **🌟 Setup Wizard:** Beautiful onboarding flow for new users with progress indicators
- **👤 Profile Management:** Complete user profile system with display names and settings
- **🌡️ Environmental Data:** Real-time weather integration with elevation, temperature, humidity, pressure
- **⚙️ Machine Management:** Add, edit, and manage multiple roasting machines (SR800/SR450)
- **📏 Unit Preferences:** Configurable temperature (Fahrenheit/Celsius) and elevation (feet/meters)
- **🎨 Enhanced UI:** Custom gradient avatars, improved styling, and better user experience
- **📱 Responsive Design:** Optimized for all device sizes with clean, modern interface
- **🔐 Multiple Auth Options:** Google, GitHub, and email/password authentication
- **🫘 Bean Profile Management:** Comprehensive coffee bean information storage with AI-optimized fields
- **🔍 Sweet Maria's HTML Parser:** Automated bean profile creation from supplier product pages
- **🧪 HTML Parser Test Interface:** Frontend interface for testing HTML parsing functionality
- **📊 Advanced Data Extraction:** Cupping scores, flavor profiles, technical specifications, and farm information

## ✨ Features

### 🔐 User Authentication & Profile Management
- **Google Sign-In:** Secure authentication with Gmail accounts
- **GitHub Sign-In:** Alternative authentication option
- **Email/Password:** Traditional login and signup
- **User-Specific Data:** Each user's roast logs are private and isolated
- **Session Management:** Persistent login sessions with automatic token refresh
- **Profile Settings:** Customizable display names, addresses, and unit preferences
- **Machine Management:** Add, edit, and manage multiple roasting machines

### 🎯 Roasting Workflow
- **Initial Setup Wizard:** Beautiful step-by-step setup for new users (display name, machines, location)
- **Before Roast:** Simplified configuration with profile defaults (machine, address, coffee details)
- **During Roast:** Real-time logging with environmental conditions display and milestone tracking
- **After Roast:** Complete event log review, final weight recording, and detailed notes

### 📊 Data Tracking & Environmental Data
- **Machine Configuration:** SR800/SR450 support with extension tube tracking
- **Coffee Details:** Origin, processing method, and roast level preferences
- **Real-time Logging:** Fan/heat changes, temperature readings, and control adjustments
- **Milestone Tracking:** First crack, second crack, and drop/cool events with temperature input
- **Environmental Conditions:** Automatic elevation, temperature, humidity, and pressure data
- **Unit Preferences:** Configurable temperature (Fahrenheit/Celsius) and elevation (feet/meters)

### 📈 Roast Curve Visualization
- **Live Roast Curve:** Real-time temperature and rate of rise graphing during roasting
- **Milestone Markers:** Visual indicators for First Crack (red), Second Crack (purple), and Drop/Cool (cyan)
- **Historical Comparison:** Compare multiple roasts with customizable line colors and labels
- **Interactive Charts:** Built with Recharts for smooth, responsive data visualization
- **Custom Tooltips:** Hover to see detailed temperature and milestone information
- **Weight Tracking:** Before and after roast weights with automatic loss calculations
- **Complete Event History:** Full roast session timeline with edit/delete capabilities

### 🫘 Bean Profile Management
- **Personal Bean Profiles:** User-specific coffee bean information storage
- **AI-Optimized Data Fields:** Comprehensive bean characteristics for future AI coaching
- **Manual Bean Entry:** Detailed form for entering bean specifications with flavor profiles
- **Profile Enhancement:** Ability to enhance basic profiles with detailed information
- **Bean Profile Dashboard:** View and manage all personal bean profiles
- **Profile Completeness Tracking:** Automatic calculation of profile completeness levels
- **Sweet Maria's Integration:** Automated bean profile creation from supplier HTML

### 🔍 Sweet Maria's HTML Parser
- **HTML Content Parsing:** Extract comprehensive data from Sweet Maria's product pages
- **Automated Bean Profile Creation:** Parse HTML and create complete bean profiles automatically
- **Data Extraction Capabilities:**
  - Basic product info (name, price, description, stock status)
  - Cupping scores (10 categories: Dry Fragrance, Wet Aroma, Brightness, Flavor, Body, Finish, Sweetness, Clean Cup, Complexity, Uniformity)
  - Flavor profiles (12 categories: Floral, Honey, Sugars, Caramel, Fruits, Citrus, Berry, Cocoa, Nuts, Rustic, Spice, Body)
  - Technical specifications (screen size, processing method, region, grade, appearance)
  - Farm information (altitude, farmer count, processing details)
  - Roast recommendations (City+ to Full City+, espresso suitability)
- **Frontend Test Interface:** Simple HTML paste interface for testing parser functionality
- **Raw Data Storage:** Store complete parsed data for reference and future analysis

### 🎨 User Experience & Interface
- **Clean, Intuitive Design:** Professional styling with orange theme and modern UI
- **Responsive Layout:** Optimized for desktop and mobile devices
- **Setup Wizard:** Beautiful step-by-step onboarding for new users
- **Profile Management:** Easy access to settings via user avatar dropdown
- **Environmental Display:** Real-time weather data in upper-right corner during roasting
- **Real-time Timer:** Live countdown with environmental conditions overlay
- **Event Management:** Inline editing, deletion, and color-coded event types
- **Smart Defaults:** Profile-based machine and location pre-filling
- **Custom Avatars:** Gradient-based avatars with user initials
- **Unit Preferences:** User-configurable temperature and elevation units

## 🏗️ Architecture

### 🎯 Modular Component Architecture (Refactored December 2024)

**Main Application Structure:**
```
roast-app/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx              # Main application (1007 lines, 47% reduction!)
│   │   ├── App.css              # Component styles
│   │   ├── main.jsx             # Application entry point
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx  # Authentication state management
│   │   │   └── ThemeContext.jsx # Theme management
│   │   ├── components/
│   │   │   ├── during_roast/    # 🆕 Roast workflow components
│   │   │   │   ├── ActiveRoast.jsx      # Master wrapper component
│   │   │   │   ├── RoastControls.jsx    # Fan/heat controls & temp logging
│   │   │   │   ├── RoastTimer.jsx       # Timer with phase indicators
│   │   │   │   ├── EventsTable.jsx     # Events table with editing
│   │   │   │   └── AfterRoast.jsx       # Roast completion workflow
│   │   │   ├── dashboard/       # 🆕 Dashboard components
│   │   │   │   └── Dashboard.jsx        # Historical roasts & dashboard
│   │   │   ├── shared/          # 🆕 Shared components
│   │   │   │   ├── RoastCurveGraph.jsx  # Roast curve visualization
│   │   │   │   └── EnvironmentalConditions.jsx # Weather data display
│   │   │   ├── modals/          # Modal components
│   │   │   │   ├── CompareRoasts.jsx    # Roast comparison modal
│   │   │   │   ├── ConfirmationModal.jsx # Generic confirmation modal
│   │   │   │   ├── TemperatureInputModal.jsx # Temperature input
│   │   │   │   └── InitialRoasterSettings.jsx # Initial settings
│   │   │   ├── user_profile/    # User management
│   │   │   │   ├── LoginForm.jsx        # Authentication UI
│   │   │   │   ├── UserProfile.jsx      # User profile dropdown
│   │   │   │   ├── ProfilePage.jsx      # Profile settings modal
│   │   │   │   └── ThemeToggle.jsx     # Theme toggle
│   │   │   ├── wizards/         # Setup workflows
│   │   │   │   ├── SetupWizard.jsx      # New user onboarding
│   │   │   │   └── StartNewRoastModal.jsx # Roast setup
│   │   │   ├── ux_ui/           # UI components
│   │   │   │   └── CustomDropdown.jsx   # Custom dropdown component
│   │   │   └── RoastDetailPage.jsx      # Individual roast details
│   │   └── lib/
│   │       └── supabase.js      # Supabase client configuration
│   ├── package.json
│   └── tailwind.config.js
├── backend/           # FastAPI + Python + Supabase
│   ├── main.py        # API server with Supabase integration
│   ├── requirements.txt
│   └── Procfile       # Railway deployment
├── AUTH_SETUP.md    # Detailed authentication setup guide
└── README.md
```

### 🧩 Component Architecture Benefits
- **Modular Design:** Each component has a single responsibility
- **Reusable Components:** Components can be used across different parts of the app
- **Easy Maintenance:** Changes to one component don't affect others
- **Better Testing:** Individual components can be tested in isolation
- **Scalable Architecture:** Easy to add new features and components

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **PostCSS** - CSS processing

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.13** - Latest Python version
- **Supabase** - PostgreSQL database with real-time capabilities and authentication
- **JWT Authentication** - Secure token-based authentication
- **Railway** - Cloud deployment platform

### Deployment
- **Vercel** - Frontend hosting (deploys from `frontend` branch)
- **Railway** - Backend API hosting (deploys from `backend` branch)
- **Supabase** - Shared PostgreSQL database
- **GitHub** - Source control with branch-based deployments

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.13+
- Git
- Supabase account
- Google Cloud Console account (for OAuth)

### Authentication Setup

Before running the application, you need to set up Supabase Auth with Google OAuth:

1. **Follow the detailed setup guide:** See [AUTH_SETUP.md](./AUTH_SETUP.md) for complete instructions
2. **Configure Google OAuth:** Set up Google Cloud Console and enable Google+ API
3. **Update Supabase settings:** Add Google OAuth provider in Supabase dashboard
4. **Set environment variables:** Configure both frontend and backend environment files
5. **Update database schema:** Add user_id column and RLS policies to roast_entries table

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend will be available at `http://localhost:5173`

### Backend Development

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create a .env file with your Supabase credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# SUPABASE_JWT_SECRET=your_jwt_secret

# Start development server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## 📱 Usage

### Getting Started

**New Users:**
1. **Sign Up:** Use Google, GitHub, or email/password authentication
2. **Setup Wizard:** Complete the beautiful onboarding flow (display name, machines, location)
3. **Profile Setup:** Configure unit preferences (Fahrenheit/Celsius, Feet/Meters)

**Starting a Roast Session:**
1. **Auto-filled Settings:** Machine and location automatically populated from profile
2. **Coffee Details:** Enter coffee type, region, process, and target roast level
3. **Environmental Data:** Address automatically fetches elevation, temperature, humidity, pressure
4. **Start:** Click "Start Roast Session" and set initial fan/heat levels

### During Roasting

1. **Timer:** Watch the real-time roast timer with environmental conditions overlay
2. **Environmental Data:** View temperature, humidity, elevation, and pressure in upper-right corner
3. **Controls:** Adjust fan and heat levels as needed
4. **Log Changes:** Click "Log Change" to record settings and temperature readings
5. **Milestones:** Mark first crack, second crack, and drop/cool events
6. **Event Management:** Edit or delete logged events inline
7. **End Session:** Click "End Roast Session" when roasting is complete

### Completing the Roast

1. **Event Review:** View complete roast event log including END event
2. **Weight:** Record the final weight of roasted beans
3. **Notes:** Add detailed notes about the roast
4. **Complete:** Click "Complete Roast Session" to finalize

### Profile Management

1. **Access:** Click your avatar in the top-right corner
2. **Settings:** Access profile settings, machine management, and unit preferences
3. **Machines:** Add, edit, or delete roasting machines (SR800/SR450 support)
4. **Units:** Configure temperature (Fahrenheit/Celsius) and elevation (feet/meters) preferences

## 🔧 Configuration

### Environment Variables

**Frontend:**
- Automatically detects the environment:
  - **Development:** Uses `http://localhost:8000` for API calls
  - **Production:** Uses Railway backend URL

**Backend:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `SUPABASE_JWT_SECRET` - JWT secret for token verification

**Frontend:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Anonymous key for client-side access

### API Endpoints

**Roast Management:**
- `POST /roasts` - Create new roast session
- `GET /roasts/{id}/events` - Get roast events
- `POST /roasts/{id}/events` - Add new event
- `PUT /roasts/{id}/events/{event_id}` - Update event
- `DELETE /roasts/{id}/events/{event_id}` - Delete event
- `PATCH /roasts/{id}` - Update roast details

**User Profile Management:**
- `GET /user/profile` - Get user profile data
- `PATCH /user/profile` - Update user profile (display name, address, units)
- `GET /user/machines` - Get user's roasting machines
- `POST /user/machines` - Add new roasting machine
- `PATCH /user/machines/{id}` - Update machine details
- `DELETE /user/machines/{id}` - Delete machine

**Bean Profile Management:**
- `GET /bean-profiles` - Get all user's bean profiles
- `POST /bean-profiles` - Create new bean profile
- `GET /bean-profiles/{id}` - Get specific bean profile
- `PATCH /bean-profiles/{id}` - Update bean profile
- `POST /bean-profiles/parse-html` - Parse Sweet Maria's HTML and create bean profile
- `POST /bean-profiles/parse-qr` - Parse QR code URL and create bean profile

## 🚀 Deployment

### Frontend (Vercel)
- Deployed from `frontend` branch
- Auto-deploys on push to `frontend` branch
- Root directory set to `frontend/`
- Custom domain: `roastbuddy.app`

### Backend (Railway)
- Deployed from `backend` branch
- Auto-deploys on push to `backend` branch
- Environment variables configured in Railway dashboard
- Connected to Supabase PostgreSQL database

### Database (Supabase)
- Shared PostgreSQL database
- Used by both frontend and backend
- Real-time capabilities and API

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for coffee enthusiasts and home roasters
- Inspired by professional coffee roasting workflows
- Designed with usability and data tracking in mind

---

**Happy Roasting!** ☕🔥
