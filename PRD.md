# FreshRoast CoPilot – Product Requirements Document (PRD)

## 1. Overview
**Product Name:** FreshRoast CoPilot  
**Owner:** CJ Britz  
**Version:** Draft v0.5 (Living Document)  
**Last Updated:** December 2024

The FreshRoast CoPilot is an intelligent roasting assistant designed to help home roasters (starting with FreshRoast SR540/SR800 models) record, analyze, and improve their coffee roasts. It will capture environmental conditions, machine parameters, temperature data, and roast outcomes, then provide AI-powered recommendations and visual roast curve analysis to improve consistency and quality over time.

**NEW:** The application now features secure, account-based authentication with multiple sign-in options for personalized roast tracking and data isolation, plus a comprehensive profile management system with setup wizard, environmental data integration, and enhanced user experience.

## 2. Goals
- Provide an easy way to log each roast with minimal friction
- Build a knowledge base of roasts (time, temperature, machine, outcomes) **per user**
- Visualize roast curves for historical analysis and real-time monitoring
- Deliver AI-powered recommendations for roast adjustments based on data patterns
- Support multiple machines per user (SR540, SR800, with/without extension tube)
- Enable temperature probe integration for automated data collection
- Persist roast history securely and make it exportable (CSV, dashboard)
- **NEW:** Ensure user data privacy and security through account-based authentication
- **NEW:** Provide seamless onboarding with multiple authentication options
- **NEW:** Deliver beautiful, intuitive user experience with comprehensive profile management
- **NEW:** Integrate real-time environmental data for enhanced roast tracking
- **NEW:** Support multiple roasting machines per user with CRUD management

## 3. User Stories

### As a New User:
- I want to sign up quickly with email/password, Google, or GitHub so I can start roasting immediately
- I want my account to be created instantly without email verification delays
- I want a beautiful, guided setup wizard that helps me configure my profile, machines, and location
- I want to set my preferred units (Fahrenheit/Celsius, Feet/Meters) during setup
- I want to access my roast data from any device by signing in

### As a Home Roaster:
- I want to select my machine (e.g., SR800 + Extension Tube) so recommendations are tailored
- I want my machine and location settings to be pre-filled from my profile for faster setup
- I want to enter pre-roast info (coffee type, region, process, weight before roast)
- I want to record environmental conditions automatically (temperature, humidity, altitude, pressure)
- I want to see environmental data displayed in my preferred units during roasting
- I want to time my roast and record this as an attribute/variable of the roast
- I want to log roast adjustments to heat and fan levels and associate them with the time they occurred in the roast
- I want to log temperature readings manually during the roast for curve analysis
- I want to log roast milestones like first crack, second crack, begin cooling, end roast
- I want to input temperature readings for milestone events (first crack, second crack, drop/cool)
- I want to see all events (including END events) in the complete roast log
- I want to log post-roast info (weight after roast, notes, first crack, drop time)
- I want to see **my personal** roast history in a clean dashboard with sortable columns
- I want to export **my** data for analysis or sharing
- **NEW:** I want to know that my roast data is private and only accessible to me
- **NEW:** I want to manage multiple machines and switch between them easily
- **NEW:** I want to update my profile settings and preferences anytime

### As an Advanced User:
- I want to view roast curves showing temperature over time with milestone markers
- I want to compare roast curves between different sessions to identify patterns
- I want to see Rate of Rise (ROR) calculations and visualization
- I want the copilot to analyze **my** roast data and suggest improvements using AI
- I want to connect a temperature probe for automatic temperature logging
- I want real-time roast curve updates during active roasting sessions
- I want to share roast profiles with other users (with privacy controls)
- **NEW:** I want to manage my account settings and authentication preferences
- **NEW:** I want to see environmental data overlaid on roast curves for correlation analysis
- **NEW:** I want to configure unit preferences that apply across all features

### As a Data-Driven Roaster:
- I want AI analysis of **my** roasting patterns across environmental conditions
- I want predictive suggestions based on coffee origin, process, and environmental factors
- I want voice control for hands-free logging during roasting
- I want automated milestone detection based on temperature curve analysis
- **NEW:** I want confidence that my roasting data is secure and backed up

## 4. Core Features (MVP)

### 4.1 User Authentication & Account Management ✅ **IMPLEMENTED**
- **Multiple Sign-In Options:**
  - Email/Password (instant signup, no email verification required)
  - Google OAuth (one-click signin)
  - GitHub OAuth (one-click signin)
- **User Profile Management:**
  - User avatar and display name
  - Account settings dropdown
  - Secure sign-out functionality
- **Data Isolation:**
  - All roast data is user-specific
  - Row-level security (RLS) policies in database
  - JWT-based authentication for API security

### 4.2 Profile Management System ✅ **IMPLEMENTED**
- **Setup Wizard:**
  - Beautiful step-by-step onboarding for new users
  - Progress indicators with completion checkmarks
  - Guided setup for display name, machines, and location
  - Skip options for flexible onboarding
- **User Profile Settings:**
  - Customizable display names with gradient avatars
  - Address management for environmental data
  - Unit preferences (Fahrenheit/Celsius, Feet/Meters)
  - Profile modal accessible via user avatar dropdown
- **Machine Management:**
  - Add, edit, and delete multiple roasting machines
  - Support for SR800 and SR450 models
  - Extension tube tracking
  - Custom machine names for easy identification
  - On-page confirmation for deletions
- **Environmental Data Integration:**
  - Real-time weather data fetching (Open-Meteo API)
  - Elevation, temperature, humidity, and pressure tracking
  - User-preferred unit display (Fahrenheit/Celsius, Feet/Meters)
  - Compact environmental conditions widget during roasting
  - **FIXED:** Improved timestamp selection logic for accurate current conditions
  - **FIXED:** Enhanced timezone handling and current weather data prioritization

### 4.3 Roast Logging ✅ **ENHANCED**
- **Smart Defaults:** Machine and location automatically populated from user profile
- **Machine Selector:** Support for SR800 and SR450 models with extension tube tracking
- **Environment Auto-Fetch:** Address → Temp, Humidity, Elevation, Pressure via Open-Meteo
- **Coffee Inputs:** Region, Type, Process with required field validation
- **Roast Settings:** Desired roast level (City, City Plus, Full City, Full City Plus)
- **Pre/Post Roast Weights:** Before (g), After (g), Auto-calc weight loss %
- **Event Timestamps:** Heat (1-9) and Fan (1-9) setting logged from second beginning(0:00) to end of roast
- **Temperature Logging:** Manual temperature entry with timestamp for curve building
- **Milestone Timestamps:** First crack, second crack, drop/cool, end roast
- **Complete Event Log:** All events including END events visible in After tab
- **Notes:** Free text for observations
- **All data automatically associated with authenticated user**

### 4.4 Data Storage ✅ **ENHANCED**
- **Supabase (primary):** roast_entries, roast_events, machines, users, auth.users
- **Enhanced Security:**
  - JWT token validation on all API endpoints
  - User-specific data filtering
  - Row-level security policies
- **Enhanced Event Logging:** Temperature readings stored in roast_events table
- **User Profile Storage:** Display names, addresses, unit preferences in user_metadata
- **Machine Management:** User-specific machine storage with CRUD operations
- **Export to CSV (working):** User-specific data export

### 4.5 Roast History Dashboard
- **User-Specific Data:** Only shows roasts belonging to authenticated user
- Clean table view with columns:
  - Date/Time
  - Machine
  - Coffee Region / Type / Process
  - Roast Level
  - In/Out Weights + % Loss
  - Environmental conditions (T, Humidity, Pressure, Elevation)
  - Roast Duration
  - Notes
- Pagination/filtering by machine or coffee
- Quick access to roast curves for each historical entry

### 4.6 Roast Curve Visualization ✅ COMPLETED
- **Live Roast Curves:** Real-time temperature and rate of rise graphing during active roasting sessions
- **Historical Roast Curves:** Line charts showing temperature vs. time for completed roasts
- **Milestone Markers:** Visual indicators with temperature data for first crack (red), second crack (purple), and drop/cool (cyan)
- **Rate of Rise (ROR):** Calculated and displayed as secondary line on chart
- **Curve Comparison:** Side-by-side comparison of multiple roast curves with customizable colors and labels
- **Interactive Charts:** Built with Recharts for smooth, responsive data visualization
- **Custom Tooltips:** Hover to see detailed temperature and milestone information
- **Temperature Input:** Custom modal for entering temperature readings at milestone events

## 5. Enhanced Features (V2)

### 5.1 AI Analysis & Recommendations
- Pattern Recognition: AI analysis of **user's** roast history to identify successful patterns
- Environmental Correlation: Recommendations based on weather, humidity, elevation
- Predictive Modeling: Suggest optimal heat/fan profiles for specific coffee types
- Roast Outcome Prediction: Estimate final roast characteristics based on current curve
- Personalized Suggestions: Learn user preferences and adapt recommendations
- **NEW:** Privacy-preserving AI analysis (data stays user-specific)

### 5.2 Real-Time Roast Monitoring
- Live Temperature Tracking: Real-time curve updates during active roast
- Automatic Event Detection: AI-powered milestone detection (crack sounds, color changes)
- Roast Progress Indicators: Visual cues for roast phase transitions
- Alert System: Notifications for critical roast moments or deviations

### 5.3 Voice & Chat Interface
- Voice Commands: Hands-free logging during roasting ("Log first crack", "Set heat to 7")
- Chat Interface: Natural language queries about roast history and planning
- Audio Feedback: Spoken confirmations and roast status updates
- Conversational AI: Planning assistance and roast guidance

## 6. Advanced Features (V3)

### 6.1 Hardware Integration
- Temperature Probe Support: Integration with Bluetooth/WiFi temperature probes
- Automated Data Collection: Continuous temperature logging every 15-30 seconds
- Multi-Probe Support: Bean temperature + environmental temperature monitoring
- Hardware Compatibility: Support for popular probe brands (MEATER, ThermoWorks, etc.)

### 6.2 Advanced Analytics
- Curve Shape Analysis: Mathematical analysis of roast curve characteristics
- Development Ratio Calculations: Automatic computation of roast development metrics
- Batch Consistency Scoring: Measure consistency across multiple roasts
- Statistical Analysis: Trends, correlations, and performance metrics
- **NEW:** User-specific analytics and insights

### 6.3 Community & Sharing
- Profile Sharing: Share successful roast profiles with community (with privacy controls)
- Roast Challenges: Community-driven roasting experiments and comparisons
- Knowledge Base: Crowd-sourced roasting tips and troubleshooting
- **NEW:** User consent and privacy controls for sharing

## 7. Data Model Updates ✅ **ENHANCED**

### Enhanced auth.users Table (Supabase)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| email | Text | User email |
| user_metadata | JSONB | **NEW: Profile data storage** |
| created_at | Timestamptz | Account creation |
| updated_at | Timestamptz | Last profile update |

### user_metadata Structure (JSONB)
```json
{
  "display_name": "John Doe",
  "address": "123 Main St, City, State",
  "units": {
    "temperature": "fahrenheit",
    "elevation": "feet"
  },
  "avatar_url": "https://...",
  "full_name": "John Doe"
}
```

### Enhanced roast_entries Table
| Field | Type | Notes |
|-------|------|-------|
| id | BigInt | PK |
| **user_id** | **UUID** | **NEW: FK → auth.users** |
| machine_id | BigInt | FK → machines |
| resolved_address | Text | Auto-fetched location |
| latitude | Float | Auto-fetched |
| longitude | Float | Auto-fetched |
| temperature_c | Float | Auto-fetched environmental |
| temperature_f | Float | Auto-fetched environmental |
| humidity_pct | Float | Auto-fetched environmental |
| pressure_hpa | Float | Auto-fetched environmental |
| elevation_m | Float | Auto-fetched environmental |
| elevation_ft | Float | Auto-fetched environmental |
| as_of | Timestamptz | Environmental data timestamp |
| timezone | Text | Auto-fetched |
| timezone_abbreviation | Text | Auto-fetched |
| coffee_region | Text | User input |
| coffee_type | Text | User input |
| coffee_process | Text | User input |
| desired_roast_level | Text | User input |
| weight_before_g | Float | User input |
| weight_after_g | Float | User input |
| weight_loss_pct | Float | Auto-calculated |
| notes | Text | User input |
| t_first_crack_sec | Integer | Auto-calculated from events |
| t_first_crack | Integer | Auto-calculated (minutes) |
| t_second_crack_sec | Integer | Auto-calculated from events |
| t_second_crack | Integer | Auto-calculated (minutes) |
| t_drop_sec | Integer | Auto-calculated from events |
| t_drop | Integer | Auto-calculated (minutes) |
| created_at | Timestamptz | System timestamp |

### Enhanced roast_events Table
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| roast_id | BigInt | FK → roast_entries |
| kind | Text | SET, TEMP, FIRST_CRACK, SECOND_CRACK, DROP, END |
| t_offset_sec | Integer | Seconds from roast start |
| fan_level | Integer | Optional (1-9) |
| heat_level | Integer | Optional (1-9) |
| temp_f | Float | Enhanced for curve data |
| note | Text | Optional user notes |
| auto_logged | Boolean | NEW: Distinguishes manual vs. probe data |
| created_at | Timestamptz | System timestamp |

### New roast_curves Table (Future)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| roast_id | BigInt | FK → roast_entries |
| curve_data | JSONB | Compressed temperature time-series |
| ror_data | JSONB | Rate of Rise calculations |
| curve_analysis | JSONB | AI-generated curve insights |
| created_at | Timestamptz | System timestamp |

## 8. Implementation Roadmap

### Phase 1: Authentication & Security ✅ **COMPLETED**
- ✅ Implemented Google OAuth authentication
- ✅ Implemented GitHub OAuth authentication  
- ✅ Implemented email/password authentication (instant signup)
- ✅ Added JWT token validation to all API endpoints
- ✅ Implemented user-specific data isolation
- ✅ Added Row Level Security (RLS) policies
- ✅ Created comprehensive authentication setup guide
- ✅ Fixed security vulnerabilities (removed .env from git)
- ✅ Updated .gitignore for security
- **Timeline:** Completed September 25, 2025

### Phase 2: Profile Management & UX Enhancement ✅ **COMPLETED**
- ✅ Implemented beautiful setup wizard for new user onboarding
- ✅ Created comprehensive profile management system
- ✅ Added machine management (SR800/SR450) with CRUD operations
- ✅ Integrated real-time environmental data with unit preferences
- ✅ Enhanced user experience with smart defaults and better UX flow
- ✅ Added custom gradient avatars with user initials
- ✅ Implemented environmental conditions display during roasting
- ✅ Added complete event log visibility in After tab
- ✅ Enhanced UI with improved empty states and validation
- ✅ Removed clutter-causing success messages
- **Timeline:** Completed December 19, 2024

### Phase 2.5: Major Architecture Refactoring ✅ **COMPLETED**
- ✅ **App.jsx Refactoring:** Reduced from 1902 lines to 1007 lines (47% reduction)
- ✅ **Component Extraction:** Created 7 major reusable components:
  - ActiveRoast: Master wrapper component for roast workflow
  - RoastControls: Fan/heat controls and temperature logging
  - RoastTimer: Timer display with phase indicators
  - EventsTable: Events table with editing capabilities
  - AfterRoast: Roast completion workflow
  - Dashboard: Historical roasts and dashboard functionality
  - Shared components: RoastCurveGraph, EnvironmentalConditions
- ✅ **Modular Architecture:** Clean component separation with focused responsibilities
- ✅ **Improved Maintainability:** Better code organization and debugging capabilities
- ✅ **Enhanced Developer Experience:** Easier to modify, test, and extend components
- ✅ **Scalable Design:** Foundation for future feature additions
- **Timeline:** Completed December 2024

### Phase 3: Core Curve Visualization (Current)
- ✅ Fixed environmental data collection bug (field name mismatch resolved)
- Implement historical roast curve charts (Recharts)
- Add temperature logging to current roast flow
- Basic ROR calculations
- **Timeline:** 2-4 weeks

### Phase 4: AI Analysis Integration
- Claude API integration for roast pattern analysis
- Basic recommendation engine
- Roast comparison features
- **Timeline:** 1-2 months

### Phase 5: Real-Time & Voice
- Live roast monitoring with curve updates
- Voice command integration
- Chat interface for roast queries
- **Timeline:** 2-3 months

### Phase 6: Hardware Integration
- Temperature probe integration
- Automated data collection
- Advanced curve analytics
- **Timeline:** 3-6 months

## 9. Technical Architecture

### Current Stack ✅ **ENHANCED**
- **Frontend:** React + Vite + Tailwind CSS + Recharts
- **Backend:** FastAPI + Python + PyJWT + Supabase Admin API
- **Database:** Supabase (PostgreSQL) with RLS
- **Authentication:** Supabase Auth (Google, GitHub, Email/Password)
- **Deployment:** Railway (Backend), Vercel (Frontend)
- **APIs:** Open-Meteo (Environmental), OpenStreetMap (Geocoding), Anthropic Claude (AI Analysis)
- **New Components:** SetupWizard, ProfilePage, EnvironmentalConditions, UserProfile

### Security Architecture ✅ **IMPLEMENTED**
- **JWT Authentication:** All API endpoints require valid JWT tokens
- **User Isolation:** Database queries filtered by user_id
- **Row Level Security:** Database-level access controls
- **Environment Variables:** Secure credential management
- **Git Security:** Comprehensive .gitignore rules

### Planned Additions
- Real-time: WebSockets for live data streaming
- Voice: Web Speech API + Speech Recognition
- Hardware: Bluetooth/Serial communication libraries
- Analytics: Statistical analysis libraries (NumPy, SciPy)

## 10. Security & Privacy Considerations

### Data Protection ✅ **IMPLEMENTED**
- **User Data Isolation:** All roast data is user-specific
- **Secure Authentication:** Multiple OAuth providers + email/password
- **JWT Token Security:** All API calls require authentication
- **Database Security:** Row-level security policies
- **Environment Security:** Proper .env file handling

### Privacy Features
- **No Email Verification Required:** Instant account creation for better UX
- **User Control:** Users can delete their accounts and data
- **Data Export:** Users can export their own data
- **Sharing Controls:** Future feature for controlled data sharing

## 11. Open Questions
- What temperature probe hardware should we target first?
- How frequently should automatic temperature logging occur (15s? 30s? 60s?)?
- Should we implement custom roast curve analysis algorithms or rely primarily on AI?
- What level of curve analysis detail do users actually want?
- How should we handle probe calibration and accuracy verification?
- **NEW:** Should we add two-factor authentication for enhanced security?
- **NEW:** How should we handle user data deletion and GDPR compliance?

## 12. Success Metrics

### Usage Metrics
- Number of roasts logged per user per month
- Temperature data points captured per roast
- Roast curve views and comparisons
- AI recommendation acceptance rate
- **NEW:** User retention rate (monthly active users)
- **NEW:** Authentication method preferences

### Quality Metrics
- Roast consistency improvement over time
- User-reported satisfaction with recommendations
- Reduction in "failed" or unsatisfactory roasts
- Community engagement with shared profiles
- **NEW:** User satisfaction with authentication experience
- **NEW:** Data security incident rate (target: 0)

### Security Metrics
- **NEW:** Authentication success rate
- **NEW:** Failed authentication attempts
- **NEW:** Data breach incidents (target: 0)
- **NEW:** User data privacy compliance score

---

📌 **This is a living document. All sections are open for refinement as the product evolves with user feedback and technical discoveries.**

**Recent Updates (v0.5):**
- ✅ **MAJOR:** Complete App.jsx refactoring - 47% size reduction (1902 → 1007 lines)
- ✅ **MAJOR:** Extracted 7 major reusable components from monolithic architecture
- ✅ **MAJOR:** Created modular component architecture with focused responsibilities
- ✅ **MAJOR:** Improved maintainability and developer experience
- ✅ **MAJOR:** Enhanced code organization and debugging capabilities
- ✅ Added comprehensive authentication system
- ✅ Implemented user data isolation and security
- ✅ Updated data models for user-specific data
- ✅ Added security architecture and privacy considerations
- ✅ **NEW:** Implemented beautiful setup wizard for new user onboarding
- ✅ **NEW:** Created comprehensive profile management system with machine management
- ✅ **NEW:** Added real-time environmental data integration with unit preferences
- ✅ **NEW:** Enhanced user experience with smart defaults and improved UX flow
- ✅ **NEW:** Added custom gradient avatars and improved UI components
- ✅ **NEW:** Implemented environmental conditions display during roasting
- ✅ **NEW:** Added complete event log visibility including END events
- ✅ **NEW:** Enhanced validation and error handling throughout the application
- ✅ Updated implementation roadmap with completed profile management phase
