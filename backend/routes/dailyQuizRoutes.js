const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getTodayDailyQuiz,
  listDailyQuizAttempts,
  submitDailyQuiz,
} = require("../controllers/dailyQuizController");

const router = express.Router();

router.use(requireAuth);
router.get("/daily-quiz/today", getTodayDailyQuiz);
router.get("/daily-quiz/attempts", listDailyQuizAttempts);
router.post("/daily-quiz/submit", submitDailyQuiz);

module.exports = router;
