import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTheaterByCinemaId = query({
  args: {
    cinemaId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("theaters")
      .withIndex("by_cinema_id", (q) => q.eq("cinemaId", args.cinemaId))
      .unique();
  },
});

export const storeTheater = mutation({
  args: {
    cinemaId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("theaters")
      .withIndex("by_cinema_id", (q) => q.eq("cinemaId", args.cinemaId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("theaters", {
      cinemaId: args.cinemaId,
      name: args.name,
    });
  },
});
