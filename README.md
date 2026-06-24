# KanbanFlow - Modern Kanban Board SaaS Platform

KanbanFlow is a production-ready, full-stack, Trello-style Kanban Board platform designed for team collaboration and project tracking. It features a modern, responsive user interface styled with Tailwind CSS v4, dynamic native HTML5 drag-and-drop mechanics, a robust SQLite database layer, and comprehensive workspace analytics.

---

## 🚀 Key Features

* **Multi-Board Management**: Create, customize, update, and delete distinct project boards.
* **Dynamic Lists**: Side-by-side workflow lists (default: *To Do*, *Doing*, *Done*) with renaming and deletion controls.
* **Card Details Modal**: Rich task editor allowing description updates, due date picks, tag assignments, and team member assignments.
* **Native HTML5 Drag and Drop**: High-performance drag-and-drop card movement within and across lists, persisting positions automatically.
* **Team Directory**: Manage team member records (name, email, profile avatars) and assign them to specific cards.
* **Flexible Tag System**: Create custom colored tags on each board, assign them to cards, and filter card priorities.
* **SaaS Analytics Dashboard**: Visual counters tracking total boards, total cards, completed cards, and overdue items, including lists of "Due Soon" and "Overdue" tasks.
* **System Dark Mode**: Sleek dark mode support persisted in local storage.

---

## 🛠️ Technology Stack

### Frontend
* **Core**: React 19 (Hooks, Portals, Refs)
* **Build Tool**: Vite 8
* **Styling**: Tailwind CSS v4 (native `@theme` and custom variant utilities)
* **Routing**: React Router v6
* **API Client**: Axios

### Backend
* **Runtime**: Node.js (Express.js framework)
* **Database**: SQLite (using the `sqlite3` driver with a clean async promise wrapper)
* **Middleware**: Global JSON parser, CORS config, and structured express error-handler

---

## 📂 Project Structure

```
workspace/
├── backend/
│   ├── src/
│   │   ├── config/          # SQLite database connection & migrations
│   │   ├── controllers/     # Route controller request-response mappings
│   │   ├── middleware/      # Error handler & input validators
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Core database SQL query services
│   │   └── app.js           # Server starter file
│   ├── package.json
│   └── database.sqlite      # SQLite database file
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page views: Dashboard, BoardsList, Board, Team
│   │   ├── services/        # Axios API client endpoints mapping
│   │   ├── App.jsx          # Route manager & Dark mode layout
│   │   ├── index.css        # Tailwind v4 styles, custom scrollbars
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js       # Vite configuration with API dev proxy
├── README.md                # General overview
├── ARCHITECTURE.md          # Database schema & component flow
├── API_DOCUMENTATION.md     # REST endpoint specs
└── DEPLOYMENT_GUIDE.md      # Production build instructions
```

---

## 🚦 Quick Start Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* npm (v9.0.0 or higher)

### Step 1: Run the Backend API
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   npm start
   ```
   The backend server starts on [http://localhost:5000](http://localhost:5000). On first start, it automatically runs database migrations and seeds initial boards, cards, and team members in `database.sqlite`.

### Step 2: Run the Frontend
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   Open your browser to the URL displayed in the console (typically [http://localhost:5173](http://localhost:5173)). The dev server proxy automatically maps `/api/*` requests to the Express backend running on port 5000.
