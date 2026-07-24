const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const dailyQuizRoutes = require("./routes/dailyQuizRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    message: "AI Interview Voice Platform backend is running.",
    health: "/api/health",
    routes: [
      "POST /api/auth/signup",
      "POST /api/auth/login",
      "GET /api/auth/me",
      "GET /api/daily-quiz/today",
      "POST /api/daily-quiz/submit",
      "POST /api/generate-interview",
      "POST /api/submit-interview",
      "GET /api/interviews",
      "GET /api/interviews/:id",
      "GET /api/analytics",
    ],
    frontend: process.env.CLIENT_URL || "http://localhost:5173",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", dailyQuizRoutes);
app.use("/api", interviewRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  res.status(error.statusCode || 500).json({
    message: error.message || "Something went wrong.",
  });
});

module.exports = app;
