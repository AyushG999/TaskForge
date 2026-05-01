# TaskForge - Team Task Manager

A full-stack web application for team task management with role-based access control, project management, and real-time dashboard analytics.

## Features

- **User Authentication** - Signup/Login with JWT-based secure authentication
- **Project Management** - Create projects, add/remove team members
- **Task Management** - Create, assign, and track tasks with priorities and due dates
- **Role-Based Access** - Admin (full control) and Member (view & update assigned tasks)
- **Dashboard** - Overview of total tasks, status breakdown, overdue tasks, and per-user stats
- **Task Board** - Visual column-based board (To Do, In Progress, Done)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (custom dark theme) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

## Project Structure

```
â”œâ”€â”€ client/                 # React Frontend
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ components/     # Navbar
â”‚   â”‚   â”œâ”€â”€ context/        # AuthContext
â”‚   â”‚   â”œâ”€â”€ lib/            # API client (axios)
â”‚   â”‚   â”œâ”€â”€ pages/          # Login, Register, Dashboard, Projects, ProjectDetail
â”‚   â”‚   â”œâ”€â”€ App.jsx
â”‚   â”‚   â”œâ”€â”€ main.jsx
â”‚   â”‚   â””â”€â”€ index.css
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ server/                 # Express Backend
â”‚   â”œâ”€â”€ config/             # DB connection
â”‚   â”œâ”€â”€ middleware/          # Auth + Role guards
â”‚   â”œâ”€â”€ models/             # User, Project, Task
â”‚   â”œâ”€â”€ routes/             # auth, projects, tasks, dashboard
â”‚   â”œâ”€â”€ server.js
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ railway.json            # Railway deployment config
â””â”€â”€ README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get JWT
- `GET /api/auth/me` - Get current user

### Projects
- `POST /api/projects` - Create project (creator becomes admin)
- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (admin only)
- `DELETE /api/projects/:id` - Delete project (admin only)
- `POST /api/projects/:id/members` - Add member by email (admin only)
- `DELETE /api/projects/:id/members/:userId` - Remove member (admin only)

### Tasks
- `POST /api/tasks` - Create task (admin only)
- `GET /api/tasks/project/:projectId` - Get tasks for project
- `PUT /api/tasks/:id` - Update task (admin: all fields, member: status only)
- `DELETE /api/tasks/:id` - Delete task (admin only)

### Dashboard
- `GET /api/dashboard/stats` - Get aggregate stats
- `GET /api/dashboard/project/:id/stats` - Get project-specific stats

## Database Schema

### User
- name, email, password (hashed with bcrypt)

### Project
- name, description, createdBy, members[{user, role, joinedAt}]

### Task
- title, description, project, assignedTo, createdBy, status, priority, dueDate

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)

### Local Development

1. **Clone the repository**
```bash
git clone <repo-url>
cd taskforge
```

2. **Install dependencies**
```bash
cd server && npm install
cd ../client && npm install
```

3. **Configure environment variables**

Create `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskforge
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

4. **Start the development servers**

Terminal 1 (Backend):
```bash
cd server && node server.js
```

Terminal 2 (Frontend):
```bash
cd client && npm run dev
```

5. Open `http://localhost:5173` in your browser

### Production Build

```bash
cd client && npm run build
cd ../server
NODE_ENV=production node server.js
```

## Deployment (Railway)

1. Push code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repository
4. Set environment variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - A random secret string
   - `NODE_ENV` - `production`
5. Railway will auto-detect the `railway.json` config and deploy

## Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create project | âœ… | âœ… |
| Edit/Delete project | âœ… | âŒ |
| Add/Remove members | âœ… | âŒ |
| Create tasks | âœ… | âŒ |
| Edit all task fields | âœ… | âŒ |
| Update task status (own tasks) | âœ… | âœ… |
| Delete tasks | âœ… | âŒ |
| View dashboard | âœ… | âœ… |

## Author

Built as a full-stack coding assignment demonstrating proficiency in React, Node.js, MongoDB, JWT authentication, and role-based access control.
