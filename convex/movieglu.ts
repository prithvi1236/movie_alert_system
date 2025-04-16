"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// --- Define Interfaces for API responses (Recommended) ---
interface MovieGluTime {
  start_time: string; // Keep original start_time if needed elsewhere
  display_start_time: string; // The value you want
  booking_url?: string;
}

// Represents the value associated with a key like "Standard" in showings
interface MovieGluShowingVersion {
  film_id: number;
  film_name: string;
  times: MovieGluTime[];
}

// The structure of the 'showings' object in the API response
interface MovieGluShowings {
  [versionType: string]: MovieGluShowingVersion; // e.g., "Standard": { ... }
}

interface MovieGluFilm {
  film_id: number;
  film_name: string;
  showings: MovieGluShowings; // Updated type
  // ... other properties
}
// --- End API Interfaces ---

// --- Define Interfaces for the Result to be returned to the frontend ---
interface TimeResult {
  start_time: string; // Use display_start_time here
}

interface ShowtimeResult {
  // Optional: Add versionType if you need to distinguish (e.g., "Standard")
  // versionType: string;
  times: TimeResult[];
}

interface MovieResult {
  film_title: string; // Match frontend type 'Movie'
  film_id: string;    // Match frontend type 'Movie' (string)
  showtimes: ShowtimeResult[]; // Match frontend type 'Movie'
}

export const getMovieShowtimes = action({
  args: {
    cinemaId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Fetching showtimes for cinema:", args.cinemaId, "date:", args.date);
    
    const headers = {
      "client": process.env.MOVIEGLU_CLIENT_ID ?? "",
      "x-api-key": process.env.MOVIEGLU_API_KEY ?? "",
      "authorization": process.env.MOVIEGLU_AUTHORIZATION ?? "",
      "territory": process.env.MOVIEGLU_TERRITORY ?? "",
      "api-version": "v201",
      "geolocation": "14.0",
      "device-datetime": new Date().toISOString(),
    };
    
    console.log("Using headers:", {
      ...headers,
      authorization: "[REDACTED]",
      "x-api-key": "[REDACTED]"
    });

    const response = await fetch(
      `https://api-gate2.movieglu.com/cinemaShowTimes/?cinema_id=${args.cinemaId}&date=${args.date}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MovieGlu API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`MovieGlu API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    // console.log("MovieGlu API response (getMovieShowtimes):", data); // Log only if needed

    if (!data || typeof data !== 'object' || !Array.isArray(data.films)) {
      console.error("Unexpected API response format (getMovieShowtimes):", data);
      throw new Error("Unexpected API response format from MovieGlu showtimes.");
    }

    // Map the response using defined interfaces
    return data.films.map((film: MovieGluFilm): MovieResult => {
      // --- Process showings object ---
      const processedShowtimes: ShowtimeResult[] = [];
      if (film.showings && typeof film.showings === 'object') {
        // Iterate over the values (like the "Standard" object) in film.showings
        Object.values(film.showings).forEach((showingVersion: MovieGluShowingVersion) => {
          if (showingVersion && Array.isArray(showingVersion.times)) {
            processedShowtimes.push({
              // Map the times array, using display_start_time
              times: showingVersion.times.map((time: MovieGluTime) => ({
                start_time: time.display_start_time, // Use display_start_time
              })),
            });
          }
        });
      }
      // --- End Process showings ---

      return {
        film_title: film.film_name,
        film_id: String(film.film_id), // Convert film_id number to string
        showtimes: processedShowtimes, // Use the processed array
      };
    });
  },
});

export const getNearbyTheaters = action({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    console.log("Fetching theaters for coordinates:", args);
    
    const headers = {
      "client": process.env.MOVIEGLU_CLIENT_ID ?? "",
      "x-api-key": process.env.MOVIEGLU_API_KEY ?? "",
      "authorization": process.env.MOVIEGLU_AUTHORIZATION ?? "",
      "territory": process.env.MOVIEGLU_TERRITORY ?? "",
      "api-version": "v200",
      "geolocation": "-22;14",
      "device-datetime": new Date().toISOString(),
    };
    
    console.log("Using headers:", {
      ...headers,
      authorization: "[REDACTED]",
      "x-api-key": "[REDACTED]"
    });

    const response = await fetch(
      `https://api-gate2.movieglu.com/cinemasNearby/?n=10&latitude=${args.lat}&longitude=${args.lng}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MovieGlu API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`MovieGlu API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    interface MovieGluCinema {
      cinema_id: number;
      cinema_name: string;
      address: string;
      // Add other fields like address2, city, state, postcode if available and needed
  }

  if (!data.cinemas || !Array.isArray(data.cinemas)) {
    console.error("Unexpected API response format (getNearbyTheaters):", data);
    throw new Error("Unexpected API response format");
  }

  // --- FIX: Map to the Theater type expected by the frontend ---
  return data.cinemas.map((cinema: MovieGluCinema) => ({
    name: cinema.cinema_name, // Use 'name'
    address: cinema.address,   // Keep 'address'
    cinemaId: String(cinema.cinema_id), // Use 'cinemaId' and convert number to string
  }));
  // --- End FIX ---
},
});
