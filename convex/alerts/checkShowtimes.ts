"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { api } from "../_generated/api";

export const checkShowtimes = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all alerts
    const alerts = await ctx.runQuery(internal.alerts.getAllAlerts);
    console.log(
      "inside checkShowtimes.ts, alerts: ",
      alerts,
      "alerts length: ",
      alerts.length,
    )
    // For each alert, check for new showtimes
    for (const alert of alerts) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const showtimes = await ctx.runAction(api.movieglu.getMovieShowtimes, {
          cinemaId: String(alert.cinemaId),
          date: today,
        });

        // If we found the movie in the showtimes, send a notification
        const movieFound = showtimes.some((movie: any) => movie.film_id === alert.movieId);
        
        if (movieFound) {
          // Log alert and notification payload for debugging
          console.log('Preparing to send OneSignal notification for alert:', alert);
          const notificationPayload = {
            app_id: process.env.ONESIGNAL_APP_ID,
            include_player_ids: [alert.oneSignalPlayerId],
            contents: {
              en: `New showtime available for ${alert.movieTitle} at ${alert.cinemaName}!`,
            },
            headings: {
              en: 'New Showtime Alert',
            },
          };
          console.log('OneSignal notification payload:', notificationPayload);
          const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(notificationPayload),
          });

          const responseText = await response.text();
          console.log('OneSignal API response status:', response.status, 'body:', responseText);

          if (!response.ok) {
            console.error('Failed to send OneSignal notification:', responseText);
          } else {
            // Delete the alert after successful notification
            await ctx.runMutation(api.alerts.deleteAlert, { alertId: alert._id });
          }
        }
      } catch (error) {
        console.error(`Error checking showtimes for alert ${alert._id}:`, error);
      }
    }
  },
});
