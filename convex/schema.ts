import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  userAlerts: defineTable({
    userId: v.id("users"),
    movieId: v.string(),
    cinemaId: v.string(),
    movieTitle: v.string(),
    cinemaName: v.string(),
    oneSignalPlayerId: v.string(),
  }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
