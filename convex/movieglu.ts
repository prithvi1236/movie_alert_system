"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

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
    console.log("MovieGlu API response:", data);
    
    if (!data.films || !Array.isArray(data.films)) {
      console.error("Unexpected API response format:", data);
      throw new Error("Unexpected API response format");
    }

    return data.films.map((film: any) => ({
      value: film.film_id,
      label: film.film_name,
      film_id: film.film_id,
    }));
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
    console.log("MovieGlu API response:", data);
    
    if (!data.cinemas || !Array.isArray(data.cinemas)) {
      console.error("Unexpected API response format:", data);
      throw new Error("Unexpected API response format");
    }

    // Store theaters in the database and return them
    const theaters = await Promise.all(
      data.cinemas.map(async (cinema: any) => {
        const theaterId = await ctx.runMutation(api.theaters.storeTheater, {
          cinemaId: String(cinema.cinema_id),
          name: cinema.cinema_name,
        });
        
        return {
          value: theaterId,
          label: cinema.cinema_name,
          cinemaId: String(cinema.cinema_id),
        };
      })
    );

    return theaters;
  },
});
