require("dotenv").config();

const app = require("./app");
const { initializeDailyQuizDatabase } = require("./models/dailyQuizModel");
const { initializeDatabase } = require("./models/interviewModel");

const PORT = process.env.PORT || 5000;

async function startServer() {
  await initializeDatabase();
  await initializeDailyQuizDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
