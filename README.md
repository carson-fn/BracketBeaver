# Bracket Beaver

## Overview

Bracket Beaver is a full-stack web application for creating and managing tournament brackets. Users can generate brackets, enter teams and standings, and view AI-generated summaries and predictions for matchups.

This repository contains both the **frontend** and **backend** for the application.

## Installation

### 1. Clone the repository

```
git clone https://github.com/carson-fn/BracketBeaver.git
cd BracketBeaver
```

### 2. Install frontend dependencies

```
cd frontend
npm install
```

### 3. Install backend dependencies

```
cd ../backend
npm install
```

### 4. Set up the database
- Make sure you have PostgreSQL installed and running.
- Create a new database (example using psql):
```
createdb bracket_beaver
```
- Import the provided .sql file located in the repository:
```
psql -d bracket_beaver -f backend/src/database/BracketBeaverDB.sql
```
- Alternative - use pgAdmin to create the database and set up the tables with the same sql file above.
#### There are two pre-made users in the BracketBeaverDB.sql schema
1. - User: admin
    - Password: admin123
2. - User: alice
    - Password: alice123

### 5. Set up environment variables
In the backend folder, create a .env file:
```
cd backend
touch .env
```
Add the following variables to the .env file:
```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.5-flash
```

Replace the placeholders with your respective values. (Note: for example, \<user\> becomes your_username without the arrow brackets) 
## Running the Application

### Start the frontend

```
cd frontend
npm run dev
```

### Start the backend

```
cd backend
npm run dev
```
### Verification

- Open http://localhost:5173
- Log in using (or create a new account):
  - admin / admin123
- You should be able to create and view a bracket

## Project Structure

```
BracketBeaver/
│
├── frontend/                      # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── api/                   # API utilities
│   │   │   └── helloApi.ts
│   │   ├── global-styles/         # Global CSS
│   │   │   └── App.css
│   │   ├── pages/
│   │   │   └── landing/                
│   │   │       ├── LandingPage.tsx
│   │   │       ├── components/
│   │   │       └── styles/             
│   │   │           └── landingStyles.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── package.json
│
├── backend/                       # Node.js + TypeScript backend
│   ├── src/
│   │   ├── controllers/           # Handles request logic
│   │   ├── models/                # Data models / database logic
│   │   ├── routes/                # API route definitions
│   │   ├── services/              # Business logic
│   │   └── index.ts               # Server entry point
│   │
│   └── package.json
│
└── README.md
```


