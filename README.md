# Movie Showtime Alert System

## Overview

This application allows users to find movie showtimes at nearby theaters and set up alerts to receive push notifications when a specific movie becomes available at a chosen theater on a particular day. It leverages the Convex platform for its backend infrastructure, including database, serverless functions (actions, mutations), and scheduled tasks (cron jobs), providing a real-time and scalable solution.

## Key Features

*   **Theater Discovery:** Find nearby movie theaters by entering a city name (utilizes OpenStreetMap Nominatim for geocoding).
*   **Showtime Browsing:** View movies and their corresponding showtimes for a selected theater and date (integrates with the MovieGlu API).
*   **Alert Management:**
    *   Create alerts for specific movie/theater combinations.
    *   View a list of currently active alerts.
    *   Delete unwanted alerts.
*   **Push Notifications:** Receive real-time push notifications via OneSignal when a scheduled check finds showtimes matching an active alert.
*   **Scheduled Checks:** A background cron job runs periodically (e.g., hourly) to check for new showtimes against active alerts.

## Technology Stack

*   **Backend:** [Convex](https://convex.dev) (Database, Actions, Mutations, Cron Jobs, Auth)
*   **Frontend:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
*   **External APIs:**
    *   [MovieGlu](https://www.movieglu.com/): Movie, theater, and showtime data.
    *   [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/): Geocoding city names to coordinates.
    *   [OneSignal](https://onesignal.com/): Push notification delivery.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (implied by class names in components)
*   **UI Components:** [react-select](https://react-select.com/), [react-datepicker](https://reactdatepicker.com/)

## Project Structure

*   **`/src`**: Contains the frontend React application code (components, hooks, etc.), built with Vite.
*   **`/convex`**: Contains the Convex backend code, including:
    *   `schema.ts`: Database schema definition.
    *   `*.ts` (e.g., `alerts.ts`, `movieglu.ts`): Backend functions (mutations, actions, queries).
    *   `crons.ts`: Definition for scheduled tasks.
    *   `_generated`: Auto-generated types and API helpers by Convex.
*   **`index.html`**: Entry point for the frontend application, includes OneSignal SDK setup.
*   **`.env.local`**: Local environment variables for frontend connection and development keys (ignored by Git).

## Setup and Running

1.  **Prerequisites:**
    *   Node.js and npm (or yarn) installed.
    *   A Convex account (https://convex.dev).
    *   API keys/credentials for MovieGlu and OneSignal.

2.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd movie-alert-system
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

4.  **Configure Environment Variables:**
    *   **Convex:** Log in to Convex (`npx convex login`) and link the project (`npx convex link`). Your `CONVEX_DEPLOY_KEY` and `CONVEX_DEPLOYMENT` should be set up.
    *   **Frontend (`.env.local`):** Ensure `VITE_CONVEX_URL` points to your Convex deployment URL. Add your OneSignal App ID (e.g., `VITE_ONESIGNAL_APP_ID=...`).
    *   **Backend (Convex Dashboard):** Set the following environment variables in your Convex project dashboard under Settings -> Environment Variables for your deployment (e.g., `dev:brainy-jaguar-358`):
        *   `MOVIEGLU_API_KEY`
        *   `MOVIEGLU_CLIENT_ID`
        *   `MOVIEGLU_AUTHORIZATION`
        *   `MOVIEGLU_TERRITORY`
        *   `ONESIGNAL_APP_ID`
        *   `ONESIGNAL_REST_API_KEY`

5.  **Run Development Servers:** This command starts the Vite frontend server and the Convex development process (syncing backend code).
    ```bash
    npm run dev
    # or
    # yarn dev
    ```

6.  **Access the Application:** Open your browser to the local URL provided by Vite (usually `http://localhost:5173` or similar).

## Authentication

The application currently uses Convex Auth with Anonymous authentication for simplicity during development. For a production environment, consider implementing a more robust authentication method (e.g., password, social logins) as described in the Convex Auth documentation.

## Further Development

Check out the Convex docs for more information on developing, deploying, and optimizing your Convex application.
