const { getDatabase } = require("./interviewModel");

function parseQuiz(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    quizDate: row.quiz_date,
    title: row.title,
    questions: JSON.parse(row.questions || "[]"),
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseAttempt(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    quizId: row.quiz_id,
    userId: row.user_id,
    answers: JSON.parse(row.answers || "[]"),
    score: Number(row.score || 0),
    correctCount: Number(row.correct_count || 0),
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    quizDate: row.quiz_date,
    title: row.title,
  };
}

async function initializeDailyQuizDatabase() {
  const db = await getDatabase();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS daily_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_date TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT 'Daily Quiz',
      questions TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS daily_quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      answers TEXT NOT NULL DEFAULT '[]',
      score INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(quiz_id, user_id),
      FOREIGN KEY (quiz_id) REFERENCES daily_quizzes(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

async function findDailyQuizByDate(quizDate) {
  const db = await getDatabase();
  const row = await db.get(
    `SELECT * FROM daily_quizzes WHERE quiz_date = ?`,
    [quizDate]
  );

  return parseQuiz(row);
}

async function createDailyQuiz({ quizDate, title, questions, metadata = {} }) {
  const db = await getDatabase();
  const result = await db.run(
    `
      INSERT INTO daily_quizzes (quiz_date, title, questions, metadata, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [quizDate, title, JSON.stringify(questions), JSON.stringify(metadata)]
  );

  const row = await db.get(`SELECT * FROM daily_quizzes WHERE id = ?`, [result.lastID]);
  return parseQuiz(row);
}

async function findDailyQuizAttempt(quizId, userId) {
  const db = await getDatabase();
  const row = await db.get(
    `
      SELECT attempts.*, quizzes.quiz_date, quizzes.title
      FROM daily_quiz_attempts AS attempts
      JOIN daily_quizzes AS quizzes ON quizzes.id = attempts.quiz_id
      WHERE attempts.quiz_id = ? AND attempts.user_id = ?
    `,
    [quizId, userId]
  );

  return parseAttempt(row);
}

async function saveDailyQuizAttempt({
  quizId,
  userId,
  answers,
  score,
  correctCount,
  metadata = {},
}) {
  const db = await getDatabase();

  await db.run(
    `
      INSERT INTO daily_quiz_attempts (
        quiz_id,
        user_id,
        answers,
        score,
        correct_count,
        metadata,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(quiz_id, user_id)
      DO UPDATE SET
        answers = excluded.answers,
        score = excluded.score,
        correct_count = excluded.correct_count,
        metadata = excluded.metadata,
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      quizId,
      userId,
      JSON.stringify(answers),
      score,
      correctCount,
      JSON.stringify(metadata),
    ]
  );

  return findDailyQuizAttempt(quizId, userId);
}

async function listRecentDailyQuizAttempts(userId, limit = 5) {
  const db = await getDatabase();
  const rows = await db.all(
    `
      SELECT attempts.*, quizzes.quiz_date, quizzes.title
      FROM daily_quiz_attempts AS attempts
      JOIN daily_quizzes AS quizzes ON quizzes.id = attempts.quiz_id
      WHERE attempts.user_id = ?
      ORDER BY datetime(attempts.updated_at) DESC, attempts.id DESC
      LIMIT ?
    `,
    [userId, limit]
  );

  return rows.map(parseAttempt);
}

module.exports = {
  initializeDailyQuizDatabase,
  findDailyQuizByDate,
  createDailyQuiz,
  findDailyQuizAttempt,
  saveDailyQuizAttempt,
  listRecentDailyQuizAttempts,
};
