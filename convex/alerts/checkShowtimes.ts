"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { api } from "../_generated/api";

export const checkShowtimes = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all alerts
    const alerts = await ctx.runQuery(internal.alerts.getAllAlerts);

    // For each alert, check for new showtimes
    for (const alert of alerts) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const showtimes = await ctx.runAction(api.movieglu.getMovieShowtimes, {
          cinemaId: alert.cinemaId,
          date: today,
        });

        // If we found the movie in the showtimes, send a notification
        const movieFound = showtimes.some((movie: any) => movie.film_id === alert.movieId);
        
        if (movieFound) {
          // Send notification via OneSignal REST API
          const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify({
              app_id: process.env.ONESIGNAL_APP_ID,
              include_player_ids: [alert.oneSignalPlayerId],
              contents: {
                en: `New showtime available for ${alert.movieTitle} at ${alert.theaterName}!`,
              },
              headings: {
                en: 'New Showtime Alert',
              },
            }),
          });

          if (!response.ok) {
            console.error('Failed to send OneSignal notification:', await response.text());
          }
        }
      } catch (error) {
        console.error(`Error checking showtimes for alert ${alert._id}:`, error);
      }
    }
  },
});
