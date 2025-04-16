import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createAlert = mutation({
  args: {
    movieId: v.string(),
    cinemaId: v.string(), // Expect the MovieGlu cinema ID string
    movieTitle: v.string(),
    cinemaName: v.string(),
    oneSignalPlayerId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("userAlerts", {
      userId,
      movieId: String(args.movieId),
      cinemaId: String(args.cinemaId),
      movieTitle: args.movieTitle,
      cinemaName: args.cinemaName,
      oneSignalPlayerId: args.oneSignalPlayerId,
    });
  },
});

export const getUserAlerts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Consider adding an index on userId for performance if the table grows
    // .withIndex("by_userId", (q) => q.eq("userId", userId))
    return await ctx.db
      .query("userAlerts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc") // Optional: show newest alerts first
      .collect();
  },
});

export const deleteAlert = mutation({
  args: {
    alertId: v.id("userAlerts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const alert = await ctx.db.get(args.alertId);
    // Security check: Ensure the user owns the alert they are trying to delete
    if (!alert || alert.userId !== userId) {
      throw new Error("Alert not found or unauthorized");
    }

    await ctx.db.delete(args.alertId);
  },
});

export const getAllAlerts = internalQuery({
  args: {},
  handler: async (ctx) => {
    // This fetches all alerts for the cron job. Ensure this is intended.
    // If the table grows very large, consider optimizing or paginating.
    return await ctx.db.query("userAlerts").collect();
  },
});
