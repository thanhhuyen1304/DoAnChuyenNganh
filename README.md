# BugHunter Project

## Overview
BugHunter is a web platform designed to help learners improve their programming skills through debugging practice. The platform supports multiple programming languages and incorporates gamification elements to enhance the learning experience.

## Features
- User authentication (login and registration)
- Online code editor with support for multiple languages
- Real-time feedback on code submissions
- XP and ranking system
- PvP challenges for competitive learning
- AI-powered debugging assistance

## Project Structure
The project is divided into two main parts: the client and the server.

### Client
- **React** application built with TypeScript and styled using TailwindCSS.
- Components for authentication, common UI elements, and user profiles.
- Main entry point for the application is located in `src/App.tsx`.

### Server
- **Node.js** application using TypeScript.
- Handles authentication logic, user data management, and API routes.
- Main entry point for the server is located in `src/app.ts`.

## Setup Instructions

### Client
1. Navigate to the `client` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

### Server
1. Navigate to the `server` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm run start
   ```

## Usage
- Users can register for an account or log in to access the platform.
- Once logged in, users can select coding exercises, debug code, and track their progress.
- Participate in PvP challenges to compete with other users.

## Future Enhancements
- Implement AI debugging assistant for personalized learning.
- Expand the library of coding exercises and challenges.
- Introduce community features such as forums or chat.

## License
This project is licensed under the MIT License.