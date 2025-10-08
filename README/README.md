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

### 📈 ENHANCED ROAST CURVE VISUALIZATION (January 2025)
- **🔧 Fixed Rate of Rise Calculation:** Corrected double time conversion bug that was causing unrealistic ROR values (25,000-100,000 °/m)
- **📊 Professional ROR Smoothing:** Implemented advanced smoothing algorithm using linear regression over time windows for stable rate calculations
- **🎯 Realistic Y-Axis Scaling:** ROR axis now displays meaningful range (-20 to 100 °/m) instead of scaling to extreme values
- **🛡️ Outlier Detection:** Smart outlier detection and correction for ROR spikes caused by sparse data points
- **📱 Mobile Optimization:** Improved chart layout and spacing for mobile devices with better touch interaction
- **🔄 Historical Mode Enhancement:** Added ROR visualization for historical roasts with proper data filtering
- **🎨 Visual Improvements:** Enhanced milestone markers, better color coding, and improved chart responsiveness
- **📊 Data Quality:** Filtered out invalid temperature readings (0°F, non-SET events) for cleaner curve visualization
- **⚡ Performance Optimization:** Reduced chart rendering overhead with optimized data processing

### 🎯 ADVANCED ROR CURVE COMPARISON (January 2025)
- **📊 Historical RoR Visualization:** Added RoR curves to compare roasts screens (dashboard and modal)
- **🎨 Color-Matched RoR Curves:** RoR curves use same colors as temperature curves but with dotted lines and 60% opacity
- **🔧 Improved Spike Detection:** Enhanced RoR spike detection and smoothing for real temperature jumps in roast data
- **📈 Professional RoR Display:** RoR curves appear as dotted, semi-transparent lines alongside temperature curves
- **🛡️ Better Data Filtering:** Fixed milestone events without temperature data causing RoR calculation spikes
- **⚡ Optimized RoR Calculation:** Applied same smoothing logic to historical RoR calculations as live mode
- **🎯 Enhanced Comparison:** Each roast now shows both temperature (solid) and RoR (dotted) curves for complete analysis

### 🎯 ENHANCED ROAST PHASE TRACKING (January 2025)
- **🌾 Dry End Milestone:** New milestone button to mark the end of the drying phase
- **🟡 Maillard Phase Tracking:** Dedicated phase between drying and development with real-time timer
- **📊 Development Percentage:** Smart percentage tracker showing progress through the development phase
- **⏱️ Phase Timeline Visualization:** Interactive timeline showing all roast phases with proper time formatting
- **🔄 State Persistence:** Complete roast phase data restoration after page refresh
- **🎨 Visual Phase Indicators:** Color-coded phase indicators with elapsed time display
- **📈 Enhanced Timeline:** Roast phases timeline with M:SS time format and proper phase transitions
- **🛠️ Improved Milestone System:** No temperature requirement for milestone buttons (Dry End, First Crack, Second Crack, Cool)
- **💾 Database Integration:** New `t_dry_end_sec` and `t_dry_end` columns in roast_entries table
- **🔧 Robust Error Handling:** Fixed database constraint issues and improved event logging

### 🤖 RAG-POWERED ROASTING COPILOT (December 2024)
- **🧠 AI-Powered Recommendations:** Intelligent pre-roast planning based on historical data and bean profiles
- **📊 Enhanced Data Capture:** Roast outcomes, reflections, and tasting notes for AI learning
- **🔍 Semantic Search:** Vector database integration for finding similar beans and roasts
- **⚡ Real-Time Guidance:** During-roast AI coaching and adjustment recommendations
- **📈 Post-Roast Analysis:** AI analysis of roast outcomes with improvement suggestions
- **🗄️ Advanced Database:** New tables for roast outcomes, curves, and AI coaching data
- **🔗 Vector Integration:** Weaviate vector database with FastEmbed for free local embeddings
- **💬 Interactive Chat Interface:** Minimizable chat window with unread message indicators and quick actions
- **🌡️ Environmental Integration:** AI considers temperature, humidity, elevation, and pressure for tailored advice
- **🛠️ Machine Configuration Awareness:** AI understands extension tube status and adjusts recommendations accordingly
- **🫘 Bean Profile Integration:** AI uses complete bean characteristics (origin, variety, process, altitude, density, screen size) for personalized recommendations
- **📱 Performance Optimized:** 15-second timeout with fallback responses and user unit preferences support

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
- **🐛 Roast Detail Page Fix:** Fixed undefined roast ID issue causing 422 errors

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

### 🌾 Enhanced Roast Phase Tracking
- **Four-Phase System:** Drying → Maillard → Development → Cooling with automatic transitions
- **Dry End Milestone:** Mark the end of the drying phase to start Maillard phase tracking
- **Real-Time Phase Timers:** Live timers for each phase showing elapsed time in M:SS format
- **Development Percentage:** Smart percentage tracker showing progress through development phase
- **Phase Timeline Visualization:** Interactive timeline showing all roast phases with color-coded segments
- **State Persistence:** Complete roast phase data restoration after page refresh
- **Visual Phase Indicators:** Color-coded indicators (Green: Drying, Yellow: Maillard, Orange: Development, Cyan: Cooling)
- **Milestone System:** Simplified milestone buttons without temperature requirements
- **Timeline Formatting:** Consistent M:SS time format across all phase displays

### 📊 Data Tracking & Environmental Data
- **Machine Configuration:** SR800/SR450 support with extension tube tracking
- **Coffee Details:** Origin, processing method, and roast level preferences
- **Real-time Logging:** Fan/heat changes, temperature readings, and control adjustments
- **Milestone Tracking:** Dry end, first crack, second crack, and drop/cool events (no temperature required)
- **Environmental Conditions:** Automatic elevation, temperature, humidity, and pressure data
- **Unit Preferences:** Configurable temperature (Fahrenheit/Celsius) and elevation (feet/meters)

### 📈 Roast Curve Visualization
- **Live Roast Curve:** Real-time temperature and rate of rise graphing during roasting
- **Professional ROR Calculation:** Advanced smoothing algorithm using linear regression over time windows for stable rate calculations
- **Realistic ROR Scaling:** Y-axis displays meaningful coffee roasting range (-20 to 100 °/m) with outlier detection
- **Milestone Markers:** Visual indicators for Dry End (yellow), First Crack (red), Second Crack (purple), and Drop/Cool (cyan)
- **Historical Comparison:** Compare multiple roasts with customizable line colors and ROR visualization
- **Dual Curve Display:** Each roast shows both temperature (solid line) and RoR (dotted line) curves in matching colors
- **RoR Comparison Mode:** RoR curves appear as dotted, semi-transparent lines alongside temperature curves
- **Interactive Charts:** Built with Recharts for smooth, responsive data visualization with mobile optimization
- **Custom Tooltips:** Hover to see detailed temperature and milestone information
- **Data Quality Filtering:** Automatically filters out invalid readings (0°F, non-temperature events) for clean visualization
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

### 🤖 RAG-Powered AI Roasting Copilot
- **Pre-Roast Planning:** AI recommendations based on similar historical roasts and bean characteristics
- **Real-Time Guidance:** During-roast coaching with temperature and timing adjustments
- **Post-Roast Analysis:** AI analysis of roast outcomes with improvement suggestions
- **Semantic Search:** Find similar beans and roasts using vector embeddings
- **Learning System:** AI learns from your roast outcomes, reflections, and tasting notes
- **Vector Database:** Weaviate integration with FastEmbed for free local embeddings
- **Enhanced Data Capture:** Store detailed roast outcomes, reflections, and AI insights
- **Intelligent Recommendations:** Context-aware suggestions based on your roasting history
- **Interactive Chat Interface:** Minimizable chat window with unread message indicators and quick actions
- **Environmental Integration:** AI considers weather conditions (temperature, humidity, elevation, pressure) for tailored advice
- **Machine Configuration Awareness:** AI understands your machine setup (extension tube, etc.) and adjusts recommendations
- **Bean Profile Integration:** AI uses complete bean characteristics for personalized guidance
- **Performance Optimized:** 15-second timeout with fallback responses and user unit preferences support
- **Event-Triggered Responses:** Automatic AI responses to logged events (heat/fan changes, milestones)

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

### Database Schema Updates
- **Enhanced Roast Entries:** Added `t_dry_end_sec` and `t_dry_end` columns for dry end milestone tracking
- **Event Constraints:** Updated `roast_events_kind_check` constraint to include `DRY_END` event type
- **Phase Data Storage:** Complete roast phase timing data stored in database for persistence

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
3. **Phase Tracking:** Monitor current roast phase (Drying, Maillard, Development, Cooling) with live timers
4. **Phase Timeline:** Visual timeline showing all roast phases with color-coded segments
5. **Controls:** Adjust fan and heat levels as needed
6. **Log Changes:** Click "Log Change" to record settings and temperature readings
7. **Milestones:** Mark dry end, first crack, second crack, and drop/cool events (no temperature required)
8. **Development Percentage:** Track progress through the development phase with percentage indicator
9. **Event Management:** Edit or delete logged events inline
10. **End Session:** Click "End Roast Session" when roasting is complete

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

**RAG Copilot API:**
- `POST /api/rag/pre-roast-planning` - Get AI-powered roast recommendations
- `POST /api/rag/roast-outcome` - Store roast outcomes and reflections
- `GET /api/rag/health` - RAG system health check
- `GET /search/beans` - Semantic search for similar beans
- `GET /search/roasts` - Semantic search for similar roasts
- `GET /search/similar-beans/{bean_id}` - Find similar beans to a specific bean
- `GET /search/recommend-roast/{bean_id}` - Get roast recommendations for a bean

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
