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


