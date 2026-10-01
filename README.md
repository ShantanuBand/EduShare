# Campus Share Hub

Campus Share Hub is a comprehensive college resource platform designed to help students easily share, discover, and organize academic materials such as assignments, past year question papers (PYQs), notes, and important topics. It features an integrated AI chatbot to assist students with their studies, along with a robust discussion and resource-sharing system.

## Project Structure

This project is structured as a `pnpm` monorepo containing:
- **`artifacts/college-resource-platform`**: The frontend application built with React and Vite.
- **`artifacts/api-server`**: The backend API server built with Express and Node.js.
- **`lib/*`**: Shared libraries and database schema configurations using Drizzle ORM.

## Prerequisites

Make sure you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **pnpm** (v10+ recommended)
- **PostgreSQL** (or a cloud provider like Neon for the database)

## Environment Setup

Before running the project, you need to configure the environment variables. 
Create a `.env` file in the root directory (you can use `.env.example` as a reference if available) and add the following keys:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
SESSION_SECRET="your-secure-session-secret"
GEMINI_API_KEY="your-google-gemini-api-key"
```

> **Note:** The `GEMINI_API_KEY` is required for the AI chat features to work properly.

## Installation

To install all the dependencies across the workspace, run the following command from the root of the project:

```bash
pnpm install
```

## Running the Application

You will need to start both the backend API server and the frontend development server.

### 1. Start the Backend (API Server)
In a new terminal window, run:
```bash
pnpm --filter @workspace/api-server dev
```
The API server will start and typically listen on `http://localhost:5000`.

### 2. Start the Frontend (Client)
In another terminal window, run:
```bash
pnpm --filter @workspace/college-resource-platform dev
```
The frontend will start and typically be accessible at `http://localhost:3000` (or `http://localhost:5173` depending on your Vite configuration).

## Building for Production

To build the entire project for production, simply run:
```bash
pnpm run build
```
This will trigger the build scripts for all packages and applications within the workspace.

## License
MIT License
