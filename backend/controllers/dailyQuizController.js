const {
  createDailyQuiz,
  findDailyQuizAttempt,
  findDailyQuizByDate,
  listRecentDailyQuizAttempts,
  saveDailyQuizAttempt,
} = require("../models/dailyQuizModel");
const { generateDailyQuiz } = require("../services/aiService");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeQuizQuestions(questions) {
  return questions.map((question, index) => ({
    id: index + 1,
    question: question.question,
    options: question.options,
  }));
}

function buildReview(quiz, attempt) {
  return quiz.questions.map((question, index) => {
    const selectedOption = Number.isInteger(attempt.answers[index])
      ? attempt.answers[index]
      : null;

    return {
      id: index + 1,
      question: question.question,
      options: question.options,
      selectedOption,
      correctOption: question.correctOption,
      correctAnswer: question.options[question.correctOption],
      isCorrect: selectedOption === question.correctOption,
      explanation: question.explanation,
    };
  });
}

async function getOrCreateTodayQuiz() {
  const quizDate = getTodayKey();
  let quiz = await findDailyQuizByDate(quizDate);

  if (!quiz) {
    const generationResult = await generateDailyQuiz({ quizDate });
    quiz = await createDailyQuiz({
      quizDate,
      title: generationResult.title || "Daily Quiz",
      questions: generationResult.questions,
      metadata: generationResult.meta || {},
    });
  }

  return quiz;
}

async function getTodayDailyQuiz(req, res, next) {
  try {
    const quiz = await getOrCreateTodayQuiz();
    const attempt = await findDailyQuizAttempt(quiz.id, req.user.id);

    res.json({
      quiz: {
        id: quiz.id,
        quizDate: quiz.quizDate,
        title: quiz.title,
        metadata: quiz.metadata,
        questionCount: quiz.questions.length,
        questions: sanitizeQuizQuestions(quiz.questions),
      },
      attempt: attempt
        ? {
            ...attempt,
            review: buildReview(quiz, attempt),
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

async function submitDailyQuiz(req, res, next) {
  try {
    const quiz = await getOrCreateTodayQuiz();
    const existingAttempt = await findDailyQuizAttempt(quiz.id, req.user.id);

    if (existingAttempt) {
      return res.json({
        message: "You have already attempted today's daily quiz.",
        quiz: {
          id: quiz.id,
          quizDate: quiz.quizDate,
          title: quiz.title,
          questionCount: quiz.questions.length,
          questions: sanitizeQuizQuestions(quiz.questions),
        },
        attempt: {
          ...existingAttempt,
          review: buildReview(quiz, existingAttempt),
        },
      });
    }

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];

    if (answers.length !== quiz.questions.length) {
      throw createError("Please answer all 5 daily quiz questions.");
    }

    const normalizedAnswers = answers.map((answer) => {
      const optionIndex = Number.parseInt(answer, 10);

      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) {
        throw createError("Each daily quiz answer must be one of the 4 options.");
      }

      return optionIndex;
    });

    const correctCount = quiz.questions.reduce((total, question, index) => {
      return total + (normalizedAnswers[index] === question.correctOption ? 1 : 0);
    }, 0);
    const score = Math.round((correctCount / quiz.questions.length) * 100);

    const attempt = await saveDailyQuizAttempt({
      quizId: quiz.id,
      userId: req.user.id,
      answers: normalizedAnswers,
      score,
      correctCount,
      metadata: {
        source: quiz.metadata?.source || "fallback",
      },
    });

    res.status(201).json({
      message: "Daily quiz submitted successfully.",
      quiz: {
        id: quiz.id,
        quizDate: quiz.quizDate,
        title: quiz.title,
        questionCount: quiz.questions.length,
        questions: sanitizeQuizQuestions(quiz.questions),
      },
      attempt: {
        ...attempt,
        review: buildReview(quiz, attempt),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function listDailyQuizAttempts(req, res, next) {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 5, 12);
    const attempts = await listRecentDailyQuizAttempts(req.user.id, limit);

    res.json({ attempts });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTodayDailyQuiz,
  submitDailyQuiz,
  listDailyQuizAttempts,
};
