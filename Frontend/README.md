# Gym & Macro Scanner - Frontend

This is the React frontend for the Gym & Macro Scanner application, built using TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Features
- **Today Dashboard (`src/pages/Today.tsx`)**: Displays daily summaries of calories and macronutrients (protein, carbs, fat) compared against user targets.
- **Kitchen Inventory (`src/pages/Kitchen.tsx`)**: Manage product metrics, brands, macros, units, and custom food items.
- **Product Creator & Scanner (`src/pages/Add.tsx`)**:
  - Barcode camera scanning (via Open Food Facts API proxy).
  - Produce name lookup (via USDA API proxy).
  - Manual custom food builder.
- **Workout Split Planner (`src/pages/Workouts.tsx`)**: Design fitness splits, category groupings, search/preview exercises (via ExerciseDB API), and mark workouts completed.
- **Bodyweight Tracking (`src/pages/Weight.tsx`)**: Log bodyweight entries and view weight changes from the previous entry.
- **History Viewer (`src/pages/History.tsx`)**: Review consumed items and macro totals for the last 14 days.

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
   The application will run at `http://localhost:5173`.

For details on configuration, database setup, and cloud deployments, please refer to the [Main Root README.md](../README.md).
