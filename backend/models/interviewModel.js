const fs = require("fs/promises");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const dataDirectory = path.join(__dirname, "..", "data");
const databaseFile = path.join(dataDirectory, "interviews.db");

let dbPromise;

async function getDatabase() {
  if (!dbPromise) {
    await fs.mkdir(dataDirectory, { recursive: true });

    dbPromise = open({
      filename: databaseFile,
      driver: sqlite3.Database,
    });
  }

  return dbPromise;
}

function parseInterview(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    category: row.category || "technical",
    difficulty: row.difficulty,
    questionCount: row.question_count,
    timerMinutes: row.timer_minutes || 15,
    questions: JSON.parse(row.questions || "[]"),
    answers: JSON.parse(row.answers || "[]"),
    evaluation: row.evaluation ? JSON.parse(row.evaluation) : null,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureInterviewColumn(columnName, definition) {
  const db = await getDatabase();
  const columns = await db.all(`PRAGMA table_info(interviews)`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await db.exec(
      `ALTER TABLE interviews ADD COLUMN ${columnName} ${definition}`,
    );
  }
}

async function initializeDatabase() {
  const db = await getDatabase();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      topic TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'technical',
      difficulty TEXT NOT NULL,
      question_count INTEGER NOT NULL,
      timer_minutes INTEGER NOT NULL DEFAULT 15,
      questions TEXT NOT NULL,
      answers TEXT DEFAULT '[]',
      evaluation TEXT,
      metadata TEXT DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'generated',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
 await db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
  await ensureInterviewColumn("user_id", "INTEGER");
  await ensureInterviewColumn("category", "TEXT NOT NULL DEFAULT 'technical'");
  await ensureInterviewColumn("timer_minutes", "INTEGER NOT NULL DEFAULT 15");
  await ensureInterviewColumn("metadata", "TEXT DEFAULT '{}'");
}

async function createInterview({
  userId,
  topic,
  category,
  difficulty,
  questionCount,
  timerMinutes,
  questions,
  metadata = {},
}) {
  const db = await getDatabase();

  const result = await db.run(
    `
      INSERT INTO interviews (
        user_id,
        topic,
        category,
        difficulty,
        question_count,
        timer_minutes,
        questions,
        metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      topic,
      category,
      difficulty,
      questionCount,
      timerMinutes,
      JSON.stringify(questions),
      JSON.stringify(metadata),
    ],
  );

  return findInterviewById(result.lastID, userId);
}

async function findInterviewById(id, userId) {
  const db = await getDatabase();
  const params = [id];
  let query = `SELECT * FROM interviews WHERE id = ?`;

  if (userId) {
    query += ` AND user_id = ?`;
    params.push(userId);
  }

  const row = await db.get(query, params);
  return parseInterview(row);
}

async function updateInterviewSubmission(id, userId, { answers, evaluation }) {
  const db = await getDatabase();
  const currentInterview = await findInterviewById(id, userId);
  const currentMetadata = currentInterview?.metadata || {};
  const nextMetadata = {
    ...currentMetadata,
    evaluation: evaluation.meta || currentMetadata.evaluation,
  };

  await db.run(
    `
      UPDATE interviews
      SET answers = ?, evaluation = ?, metadata = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `,
    [
      JSON.stringify(answers),
      JSON.stringify(evaluation),
      JSON.stringify(nextMetadata),
      id,
      userId,
    ],
  );

  return findInterviewById(id, userId);
}

async function listRecentInterviews(userId, limit = 6) {
  const db = await getDatabase();
  const rows = await db.all(
    `
      SELECT * FROM interviews
      WHERE user_id = ?
      ORDER BY datetime(updated_at) DESC, id DESC
      LIMIT ?
    `,
    [userId, limit],
  );

  return rows.map(parseInterview);
}

async function listRecentQuestionsByTopic(
  userId,
  topic,
  difficulty,
  limit = 20,
) {
  const db = await getDatabase();
  const rows = await db.all(
    `
      SELECT questions
      FROM interviews
      WHERE user_id = ?
        AND lower(topic) = lower(?)
        AND difficulty = ?
      ORDER BY datetime(updated_at) DESC, id DESC
      LIMIT ?
    `,
    [userId, topic, difficulty, limit],
  );

  return rows.flatMap((row) => JSON.parse(row.questions || "[]"));
}

async function deleteInterviewById(id, userId) {
  const db = await getDatabase();
  const result = await db.run(
    `DELETE FROM interviews WHERE id = ? AND user_id = ?`,
    [id, userId],
  );

  return result.changes > 0;
}

async function getInterviewAnalytics(userId) {
  const db = await getDatabase();
  const rows = await db.all(
    `
      SELECT * FROM interviews
      WHERE user_id = ?
      ORDER BY datetime(updated_at) DESC, id DESC
    `,
    [userId],
  );

  const interviews = rows.map(parseInterview);
  const completed = interviews.filter((item) => item.status === "completed");
  const scored = completed.filter((item) =>
    Number.isFinite(item.evaluation?.score),
  );
  const averageScore = scored.length
    ? Math.round(
        scored.reduce(
          (total, item) => total + Number(item.evaluation.score || 0),
          0,
        ) / scored.length,
      )
    : 0;

  const categoryMap = {};
  const difficultyMap = {};
  const topicMap = {};
  const completedDates = new Set();

  completed.forEach((item) => {
    const date = new Date(`${item.updatedAt.replace(" ", "T")}Z`);
    const key = date.toISOString().slice(0, 10);
    completedDates.add(key);
  });

  scored.forEach((item) => {
    categoryMap[item.category] = categoryMap[item.category] || {
      category: item.category,
      attempts: 0,
      averageScore: 0,
      totalScore: 0,
    };
    categoryMap[item.category].attempts += 1;
    categoryMap[item.category].totalScore += Number(item.evaluation.score || 0);

    difficultyMap[item.difficulty] = (difficultyMap[item.difficulty] || 0) + 1;
    topicMap[item.topic] = topicMap[item.topic] || {
      topic: item.topic,
      attempts: 0,
      totalScore: 0,
    };
    topicMap[item.topic].attempts += 1;
    topicMap[item.topic].totalScore += Number(item.evaluation.score || 0);
  });

  const categoryBreakdown = Object.values(categoryMap).map((item) => ({
    category: item.category,
    attempts: item.attempts,
    averageScore: Math.round(item.totalScore / item.attempts),
  }));

  const strongestTopics = Object.values(topicMap)
    .map((item) => ({
      topic: item.topic,
      attempts: item.attempts,
      averageScore: Math.round(item.totalScore / item.attempts),
    }))
    .sort((left, right) => right.averageScore - left.averageScore)
    .slice(0, 3);

  const recentScores = scored
    .slice(0, 5)
    .reverse()
    .map((item) => ({
      id: item.id,
      topic: item.topic,
      score: item.evaluation.score,
      category: item.category,
    }));

  let streakDays = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!completedDates.has(key)) {
      break;
    }

    streakDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const weekCursor = new Date();
  weekCursor.setUTCDate(weekCursor.getUTCDate() - 6);
  weekCursor.setUTCHours(0, 0, 0, 0);
  const completedThisWeek = completed.filter((item) => {
    const date = new Date(`${item.updatedAt.replace(" ", "T")}Z`);
    return date >= weekCursor;
  }).length;

  return {
    totals: {
      interviewsCreated: interviews.length,
      interviewsCompleted: completed.length,
      averageScore,
      bestScore: scored.length
        ? Math.max(...scored.map((item) => Number(item.evaluation.score || 0)))
        : 0,
    },
    engagement: {
      streakDays,
      completedThisWeek,
    },
    categoryBreakdown,
    difficultyBreakdown: difficultyMap,
    strongestTopics,
    recentScores,
  };
}

module.exports = {
  getDatabase,
  initializeDatabase,
  createInterview,
  findInterviewById,
  updateInterviewSubmission,
  listRecentInterviews,
  listRecentQuestionsByTopic,
  deleteInterviewById,
  getInterviewAnalytics,
};
