# ☕ FreshRoast Assistant

A professional coffee roasting logging and analysis application built with React and FastAPI. Track your roasting sessions, log temperature changes, and analyze your coffee roasting data.

![FreshRoast Assistant](https://img.shields.io/badge/Status-Live-brightgreen)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-blue)

## 🚀 Live Demo

**Frontend:** [roastbuddy.app](https://www.roastbuddy.app)  
**Backend API:** [Railway](https://roast-backend-production-8883.up.railway.app)

## ✨ Features

### 🔐 User Authentication
- **Google Sign-In:** Secure authentication with Gmail accounts
- **User-Specific Data:** Each user's roast logs are private and isolated
- **Session Management:** Persistent login sessions with automatic token refresh

### 🎯 Roasting Workflow
- **Before Roast:** Configure machine settings, coffee details, and initial parameters
- **During Roast:** Real-time logging of fan/heat changes, temperature readings, and milestone tracking
- **After Roast:** Record final weight and add detailed notes

### 📊 Data Tracking
- Machine configuration (SR540/SR800, extension tube)
- Coffee origin and processing details
- Real-time temperature and control logging
- Milestone tracking (first crack, second crack, drop/cool)
- Weight loss calculations
- Detailed notes and observations

### 🎨 User Experience
- Clean, intuitive interface with professional styling
- Responsive design for desktop and mobile
- Real-time timer during roasting sessions
- Inline editing of logged events
- Color-coded event types for easy identification

## 🏗️ Architecture

```
roast-app/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx    # Main application component
│   │   ├── App.css    # Component styles
│   │   └── main.jsx   # Application entry point
│   ├── package.json
│   └── tailwind.config.js
├── backend/           # FastAPI + Python + Supabase
│   ├── main.py        # API server with Supabase integration
│   ├── requirements.txt
│   └── Procfile       # Railway deployment
└── README.md
```

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

### Starting a Roast Session

1. **Setup:** Enter coffee details (type, region, process, target roast level)
2. **Machine:** Select your FreshRoast model and extension tube status
3. **Location:** Optionally add roasting location for environmental data
4. **Start:** Click "Start Roast Session" and set initial fan/heat levels

### During Roasting

1. **Timer:** Watch the real-time roast timer
2. **Controls:** Adjust fan and heat levels as needed
3. **Log Changes:** Click "Log Change" to record settings and temperature
4. **Milestones:** Mark first crack, second crack, and drop/cool events
5. **End Session:** Click "End Roast Session" when roasting is complete

### Completing the Roast

1. **Weight:** Record the final weight of roasted beans
2. **Notes:** Add detailed notes about the roast
3. **Complete:** Click "Complete Roast Session" to finalize

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

- `POST /roasts` - Create new roast session
- `GET /roasts/{id}/events` - Get roast events
- `POST /roasts/{id}/events` - Add new event
- `PUT /roasts/{id}/events/{event_id}` - Update event
- `DELETE /roasts/{id}/events/{event_id}` - Delete event
- `PATCH /roasts/{id}` - Update roast details

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
