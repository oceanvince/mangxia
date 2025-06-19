# Mangxia Healthcare Platform

A healthcare platform backend API service.

## Project Structure

```
mangxia/
└── backend/               # Node.js/Express server
    ├── src/
    │   ├── controllers/  # Route controllers
    │   ├── models/       # Database models
    │   ├── routes/       # API routes
    │   ├── services/     # Business logic
    │   └── utils/        # Utility functions
    └── package.json
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment files:
   - Copy `.env.example` to `.env` in the backend directory
   - Update the environment variables with your values

3. Start development server:
   ```bash
   npm run dev
   ```

4. Access the application:
   - Backend API: http://localhost:3000

## Features

### Backend API
- Authentication system
- Patient management
- Medical records management
- Appointment scheduling
- Message system

## Tech Stack

- Backend: Node.js, Express, MongoDB

## Development Status

This is an MVP (Minimum Viable Product) version with basic functionality. Future updates will include:
- Enhanced security features
- Real-time chat
- File upload system
- Advanced scheduling system
- Integration with medical devices