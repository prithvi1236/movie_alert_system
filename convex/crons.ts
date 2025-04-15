import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for new showtimes every hour
crons.interval(
  "check-new-showtimes",
  { minutes: 60 },
  internal.alerts.checkShowtimes.checkShowtimes,
  {}
);

export default crons;
