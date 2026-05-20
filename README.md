# Pari Portfolio

A high-performance, feature-rich developer portfolio built to showcase personal projects, technical experience, and real-time coding achievements. This project integrates a suite of modern technologies to create a dynamic, AI-enhanced visitor experience with a robust backend management system.

---

## 🚀 Overview

This portfolio serves as more than just a static bio. It is a live dashboard of my engineering journey, featuring real-time statistics synchronization from top coding platforms, a custom-built analytics engine, and an AI-powered chatbot to assist recruiters and visitors.

🌐 **Live Demo:** https://pari-portfolio.web.app

---

# 🚀 Key Features

## 1. Dynamic Content Management (Admin Dashboard)
- **Authenticated Admin Portal**: 
- Secure login via Google Authentication.
- **In-place Editing**: 
- Modify any section (About, Experience, Projects, Skills) directly from the UI when logged in.
- Real-time CRUD management for projects, certifications, skills, achievements, and portfolio sections.
- **Image & PDF Hosting**:
- Upload and manage certificates, resumes, and media assets directly from the dashboard.
- In-place editing support without requiring application redeployment.
- Built-in support for uploading certificates and resumes directly to the portfolio.

---

## 2. Live Coding Stats Synchronization
- **Platform Integrations**: Automatically fetches and aggregates solved problem counts and activity streaks, contribution metrics, contest ratings, and coding activity.
- Real-time synchronization of coding statistics from:
  - GitHub
  - LeetCode
  - Codeforces
  - CodeChef
  - HackerRank
- Dynamically updates graphs and analytics visualizations in real time.
- Modular API integration structure allowing future platform expansion.
- **Interactive Heatmap**: A custom SVG-based contribution heatmap that reflects real-world coding activity.
- **Relational Data Mapping**: Logic handles handle-to-profile URL mapping and API data parsing for multiple platforms.

---

## 3. GitHub Stats & Repository Integration
- Dynamically fetches GitHub repositories, contribution data, and profile analytics.
- Live repository links can be opened directly from the portfolio interface.
- Real-time synchronization ensures portfolio projects stay updated with GitHub activity.
- Integrated version-control workflow support for portfolio deployment and project management.

---

## 4. AI Chatbot Integration
- Integrated AI-powered chatbot using the Google Gemini API.
- Context-aware assistant capable of answering questions related to Pari’s skills, projects, certifications, and experience.
- API requests are routed securely using server-side proxying to protect sensitive API keys.
- Interactive assistant improves portfolio navigation and visitor engagement.

---

## 5. Advanced Analytics & Interaction Tracking
- **Custom Tracking Engine**: Built-in service to monitor page views and social media referrals.
- Tracks portfolio visits, project clicks, and interaction metrics in real time.
- Displays live portfolio view counts and engagement analytics.
- Stores analytics data efficiently using Firebase Firestore.
- **Geo & Tech Insights**: Captures anonymized browser, OS,  device-type and geographical data.
- **Real-time Dashboard**: A dedicated analytics view for the admin to monitor portfolio performance inside the admin dashboard.

---

## 6. Inbox & Contact Automation System
- Contact form submissions are processed using Google Apps Script automation.
- Messages are automatically synchronized to:
  - Google Sheets
  - Gmail notifications
- Includes integrated inbox functionality for managing portfolio communication.
- Enables lightweight serverless communication workflows without a custom backend server.

---

## 7. Resume & External Link Support
- Resume preview and download functionality with support for opening resumes in a new browser tab.
- Integrated PDF preview support using PDF.js.
- Live project links, GitHub repositories, and external platforms are directly openable from the portfolio.
- Static asset routing improves reliability for media delivery and resume handling.

---

## 8. Responsive UI & Multi-Theme Experience
- **Responsive Mastery**:
- Tailored Fully responsive layouts optimized for:
  - Desktop
  - Tablet
  - Mobile devices
- **Interactive Themes**:
- Multiple interactive themes including:
  - Light
  - Yellow
  - Gradient
  - Navy
  - Violet modes.
- **Fluid Animations**:
- High-performance transitions using Framer Motion (`motion/react`) for an immersive experience.
- Smooth transitions and animations powered by Framer Motion.
- Enhanced UI interactions with optimized modal and navigation behavior.

---

## ✨ Summary (Core Features)

*   **Real-Time Coding Statistics**: Automated synchronization with **GitHub**, **LeetCode**, and **Codeforces**. Displays total solved problems, commit history, and contest ratings dynamically.
*   **Gemini AI Chatbot**: A custom-trained AI assistant integrated using the **Gemini 1.5 Flash API**. It answers questions about my skills, projects, and availability in a warm, professional tone.
*   **Custom Analytics Engine**: A localized tracking system that monitors page views, unique visitors, interaction rates, and session durations directly in Firestore—bypassing the need for heavy third-party scripts.
*   **Admin Dashboard**: A secure, Google-authenticated management interface allowing for real-time content updates, certificate management, and analytics visualization.
*   **Dynamic UI & Experience**: A polished, responsive interface built with **Tailwind CSS** and **Framer Motion**, featuring a "Cosmic" transition system and optimized PDF resume viewing.
*   **Workflow Automation**: Contact form submissions are seamlessly synchronized from Firestore to a **Google Sheet** via a custom **Google Apps Script** background service for centralized lead management.

---

## 🏗️ Architecture Decisions

- **Security First**: All sensitive Firebase configuration and third-party API keys are managed via environment variables. The codebase is clean of hardcoded secrets, making it safe for public repository hosting.
- **Relational Integrity**: Firestore security rules are architected with a "Master Gate" pattern to ensure only the authenticated admin can perform write operations while keeping public data accessible.
- **Performance**: Heavy assets like PDFs and large images are handled with optimized previews and lazy-loading to ensure sub-second initial load times.

---

# 🛠️ Technical Architecture

The project follows a full-stack architecture optimized for low-latency and scalability:

*   **Frontend**: React 19 (TypeScript) + Vite
*   **Styling**: Tailwind CSS 4.0
*   **Animations**: Framer Motion (`motion/react`)
*   **Database**: Firebase Cloud Firestore (NoSQL)
*   **Authentication**: Firebase Auth (Google OAuth)
*   **AI Support**: Google Gemini API
*   **Backend Automation**: Google Apps Script
*   **PDF Processing**: PDF.js / React-PDF for high-fidelity certificate previews

---

## 🛠️ Tech Stack Flow

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts / Chart.js

### Backend & Services
- Node.js + Express

### Database & Auth
- Firebase Firestore
- Firebase Authentication
- Firebase Analytics

### APIs & Integrations
- GitHub API
- LeetCode APIs
- Codeforces APIs
- Google Gemini API

### Utilities & Tools
- Git & GitHub
- PDF.js (Live resume preview)
- REST APIs
- Firebase Hosting
- EmailJS (Contact form)
- Google Apps Script (Sheet sync backup)

---

## 📸 Screenshots

### 🏠 Home — Light Theme
![Home Light](README-assets/home-light.png)

---

### 🌑 Home — Dark Theme
![Home Dark](README-assets/home-dark.png)

---

### 👩‍💻 About Section
![About](README-assets/about-section.png)

---

### 🛠️ Skills Dashboard
![Skills](README-assets/skills-section.png)

---

### 🚀 Projects Showcase
![Projects](README-assets/projects-section.png)

---

### 📊 Live Coding Profiles & Sync
![Coding Profiles](README-assets/coding-profiles.png)

---

### 📈 Real-Time Coding Architecture Graph
![Coding Graph](README-assets/coding-graph.png)

---

### 🔥 Consistency Contribution Heatmap
![Consistency Graph](README-assets/consistency-graph.png)

---

### 📄 Resume Management
![Resume Section](README-assets/resume-section.png)

---

### 📡 Real-Time Analytics Dashboard
![Analytics Dashboard](README-assets/analytics-dashboard-top.png)

---

### 📊 Interaction & Visitor Insights
![Analytics Insights](README-assets/analytics-dashboard-bottom.png)

---

### 📬 Contact & Social Integration
![Contact Section](README-assets/contact-section-light.png)

---

### 🤖 AI Chatbot Assistant
![Chatbot](README-assets/chatbot.png)

---

### 🔐 Admin Portal
![Admin Login](README-assets/admin-login.png)

---

# 🏗️ System Workflow

```text
[ React + TypeScript Frontend ]
              │
              ├──► GitHub APIs
              ├──► LeetCode APIs
              ├──► Codeforces APIs
              ├──► Competitive Platform Sync Engine
              │
              ├──► Firebase Authentication
              ├──► Firebase Firestore Database
              ├──► Firebase Analytics
              │
              ├──► Google Gemini API (AI Chatbot)
              │
              ├──► Portfolio Analytics System
              │
              └──► Google Apps Script
                          ├──► Google Sheets
                          └──► Gmail Notifications
```

---

# ⚙️ Engineering Decisions

## Client-Side API Synchronization
Competitive programming statistics and GitHub analytics are fetched directly on the client side to reduce infrastructure complexity and maintain a lightweight serverless architecture.

## Secure AI Request Handling
Gemini API interactions are routed through a backend proxy layer to avoid exposing sensitive API credentials on the frontend.

## Modular Architecture
The application is structured modularly to simplify future integration of additional coding platforms, analytics systems, and UI enhancements.

## Reliable Resume Delivery
Static asset routing is used for resume delivery and media handling to ensure reliable previewing, downloading, and rendering across sessions.

## Performance Optimization
Large assets, graphs, and media content are optimized using lazy loading and efficient rendering strategies to improve responsiveness and loading performance.

## Firebase as Source of Truth
Instead of hardcoding project data, I utilized Firestore as a CMS. This allows for instant updates through the admin panel without requiring a new build or deployment.

## Client-Side Aggregation
Coding stats are gathered via public platform APIs (GitHub REST, Codeforces API, and Alfa-LeetCode). For consistency and performance, an admin-triggered sync caches these results in Firestore, reducing API rate-limit issues for public visitors.

## Security-Oriented Design
Sensitive credentials and configuration values are managed through environment variables, keeping the repository secure and production-ready.

---

# 📁 Project Structure

```text
├── components/          # React components organized by UI section
│   ├── AIChatbot.tsx    # Gemini AI integration and chat interface
│   ├── Analytics.tsx    # Admin analytics visualization dashboard
│   ├── CodingProfiles.tsx # Real-time stats fetching and heatmap logic
│   └── ...              # Modular sections (Projects, Skills, etc.)
├── hooks/               # Custom React hooks (useScrollLock, etc.)
├── public/              # Static assets and media
├── .env.example         # Reference for required environment variables
├── analyticsService.ts  # Core visitor tracking and Firestore sync logic
├── geminiService.ts     # AI model configuration and system prompt
├── googleAppsScript.gs  # Script for Firestore-to-Spreadsheet synchronization
├── index.tsx            # App entry point and Firebase initialization
├── server.ts            # Express server (Vite middleware / production serving)
└── firestore.rules      # Hardened security rules for database access
```

---

# ⚙️ Setup & Installation

## Prerequisites
- Node.js 20+
- Firebase Project Configuration
- Google Gemini API Key (for Chatbot)
 
---

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pari-portfolio.git
   cd pari-portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   # Firebase Config
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # AI Configuration
   GEMINI_API_KEY=your_gemini_key

   # Admin Configuration
   VITE_ADMIN_EMAIL=your_email@gmail.com
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

---

### Deployment
The project is optimized for Firebase Hosting. Ensure you have the [Firebase CLI](https://firebase.google.com/docs/cli) installed.
1. **Build the project:**
   ```bash
   npm run build
   ```
2. **Deploy to Firebase:**
   ```bash
   firebase deploy
   ```

---

## 🔒 Security

*   **Firestore Rules**: Implemented granular Attribute-Based Access Control (ABAC). Public access is read-only for specific collections, while write/delete permissions are strictly locked to the verified admin UID.
*   **PII Protection**: Contact messages are isolated in a protected collection, only accessible by the owner, and synced to a private Google Sheet.
*   **Secret Masking**: No API keys are exposed in the client-side bundle beyond public Firebase identifiers necessary for initialization.

---

## 📈 Future Improvements

*   **Dark/Light Mode persistence**: Enhancing the theme engine for OS-preference detection.
*   **Automated Sync Cron**: Moving the coding stats sync to a Firebase Function for 100% automated daily updates.
*   **Additional Platform Support**: Integrating HackerRank and CodeChef stats once stable APIs are identified.

---

## 📄 License

This project is intended for personal portfolio and educational purposes. Feel free to use the code as inspiration, but please credit the original work.

---

# 👩‍💻 Author

*Built with ❤️ by **Pari Sangamnerkar**.*

- Portfolio: https://pari-portfolio.web.app
- GitHub: https://github.com/pari-28
- LinkedIn: https://www.linkedin.com/in/pari-sangamnerkar-ab356038b/


