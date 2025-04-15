import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createAlert = mutation({
  args: {
    movieId: v.string(),
    theaterId: v.id("theaters"),
    movieTitle: v.string(),
    theaterName: v.string(),
    oneSignalPlayerId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const theater = await ctx.db.get(args.theaterId);
    if (!theater) throw new Error("Theater not found");

    return await ctx.db.insert("userAlerts", {
      userId,
      movieId: args.movieId,
      theaterId: args.theaterId,
      cinemaId: theater.cinemaId,
      movieTitle: args.movieTitle,
      theaterName: args.theaterName,
      oneSignalPlayerId: args.oneSignalPlayerId,
    });
  },
});

export const getUserAlerts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("userAlerts")
      .filter((q) => q.eq(q.field("userId"), userId))
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
    if (!alert || alert.userId !== userId) {
      throw new Error("Alert not found or unauthorized");
    }

    await ctx.db.delete(args.alertId);
  },
});

export const getAllAlerts = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userAlerts").collect();
  },
});
