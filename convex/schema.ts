import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  theaters: defineTable({
    cinemaId: v.string(),
    name: v.string(),
  }).index("by_cinema_id", ["cinemaId"]),

  userAlerts: defineTable({
    userId: v.id("users"),
    movieId: v.string(),
    theaterId: v.id("theaters"),
    cinemaId: v.string(),
    movieTitle: v.string(),
    theaterName: v.string(),
    oneSignalPlayerId: v.string(),
  }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
