const {
  createInterview,
  deleteInterviewById,
  findInterviewById,
  getInterviewAnalytics,
  listRecentInterviews,
  listRecentQuestionsByTopic,
  updateInterviewSubmission,
} = require("../models/interviewModel");
const {
  evaluateInterview,
  generateInterviewQuestions,
} = require("../services/aiService");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeQuestionCount(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 30) {
    throw createError("Question count must be a number between 1 and 30.");
  }

  return parsedValue;
}

function normalizeTimerMinutes(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 5 || parsedValue > 60) {
    throw createError("Timer must be between 5 and 60 minutes.");
  }

  return parsedValue;
}

function normalizeCategory(value) {
  const category = value?.trim()?.toLowerCase() || "technical";
  const allowedCategories = [
    "technical",
    "hr",
    "behavioral",
    "system-design",
    "subject",
  ];

  if (!allowedCategories.includes(category)) {
    throw createError(
      "Category must be technical, hr, behavioral, system-design, or subject."
    );
  }

  return category;
}

async function generateInterview(req, res, next) {
  try {
    const userId = req.user.id;
    const topic = req.body.topic?.trim();
    const category = normalizeCategory(req.body.category);
    const difficulty = req.body.difficulty?.trim()?.toLowerCase();
    const questionCount = normalizeQuestionCount(
      req.body.questionCount ?? req.body.count
    );
    const timerMinutes = normalizeTimerMinutes(req.body.timerMinutes ?? 15);

    if (!topic) {
      throw createError("Topic is required.");
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      throw createError("Difficulty must be easy, medium, or hard.");
    }

    const recentQuestions = await listRecentQuestionsByTopic(
      userId,
      topic,
      difficulty,
      25
    );

    const generationResult = await generateInterviewQuestions({
      topic,
      category,
      difficulty,
      count: questionCount,
      previousQuestions: recentQuestions,
    });

    const interview = await createInterview({
      userId,
      topic,
      category,
      difficulty,
      questionCount,
      timerMinutes,
      questions: generationResult.questions,
      metadata: {
        generation: generationResult.meta,
      },
    });

    res.status(201).json({
      message: "Interview generated successfully.",
      interview,
      meta: generationResult.meta,
    });
  } catch (error) {
    next(error);
  }
}

async function submitInterview(req, res, next) {
  try {
    const userId = req.user.id;
    const interviewId = req.body.interviewId;
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];

    if (!interviewId) {
      throw createError("Interview ID is required.");
    }

    const interview = await findInterviewById(interviewId, userId);

    if (!interview) {
      throw createError("Interview not found.", 404);
    }

    if (!answers.length) {
      throw createError("At least one answer is required.");
    }

    const normalizedAnswers = interview.questions.map(
      (_question, index) => answers[index]?.trim() || ""
    );

    const evaluationResult = await evaluateInterview({
      topic: interview.topic,
      category: interview.category,
      difficulty: interview.difficulty,
      questions: interview.questions,
      answers: normalizedAnswers,
    });

    const updatedInterview = await updateInterviewSubmission(interview.id, userId, {
      answers: normalizedAnswers,
      evaluation: evaluationResult,
    });

    res.json({
      message: "Interview submitted successfully.",
      interview: updatedInterview,
      meta: evaluationResult.meta,
    });
  } catch (error) {
    next(error);
  }
}

async function getInterview(req, res, next) {
  try {
    const interview = await findInterviewById(req.params.id, req.user.id);

    if (!interview) {
      throw createError("Interview not found.", 404);
    }

    res.json({ interview });
  } catch (error) {
    next(error);
  }
}

async function listInterviews(req, res, next) {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 6, 20);
    const interviews = await listRecentInterviews(req.user.id, limit);

    res.json({ interviews });
  } catch (error) {
    next(error);
  }
}

async function deleteInterview(req, res, next) {
  try {
    const deleted = await deleteInterviewById(req.params.id, req.user.id);

    if (!deleted) {
      throw createError("Interview not found.", 404);
    }

    res.json({
      message: "Interview deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const analytics = await getInterviewAnalytics(req.user.id);
    res.json({ analytics });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateInterview,
  submitInterview,
  getInterview,
  listInterviews,
  deleteInterview,
  getAnalytics,
};
