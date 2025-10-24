# CampusMarketplace - Frontend Project Structure

## Overview

The frontend of CampusMarketplace is built using **React** with **TypeScript** and **Vite** as the build tool. This document outlines the complete project structure for the UI client.

## Technology Stack

- **Framework**: React 19.1.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7.9.1
- **Validation**: Zod 4.1.11
- **Linting**: ESLint 9.36.0

## Project Structure

```
ui-client/
├── public/                          # Static assets
├── src/                            # Source code
│   ├── api/                        # API integration layer
│   ├── components/                 # Reusable React components
│   ├── css/                       # Additional CSS files
│   ├── pages/                     # Page-level components
│   ├── App.css                    # Main application styles
│   ├── App.tsx                    # Root React component
│   ├── index.css                  # Global styles
│   └── main.tsx                   # Application entry point
├── eslint.config.js               # ESLint configuration
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── README.md                      # Project documentation
├── tsconfig.app.json              # TypeScript config for app
├── tsconfig.json                  # Main TypeScript config
├── tsconfig.node.json             # TypeScript config for Node.js
└── vite.config.ts                 # Vite build configuration
```
  

## Getting Started

The following npm scripts are available:

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Development Setup

1. Navigate to the `ui-client` directory
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open browser to `http://localhost:3050` (default Vite port)
 