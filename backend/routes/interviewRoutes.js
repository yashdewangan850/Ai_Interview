const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  deleteInterview,
  generateInterview,
  submitInterview,
  getInterview,
  getAnalytics,
  listInterviews,
} = require("../controllers/interviewController");

const router = express.Router();

router.use(requireAuth);
router.get("/interviews", listInterviews);
router.get("/analytics", getAnalytics);
router.get("/interviews/:id", getInterview);
router.delete("/interviews/:id", deleteInterview);
router.post("/generate-interview", generateInterview);
router.post("/submit-interview", submitInterview);

module.exports = router;
