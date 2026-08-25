const bcrypt = require("bcryptjs");
const { getDatabase } = require("./interviewModel");

function parseUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function createUser({ name, email, password }) {
  const db = await getDatabase();
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.run(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'student')
    `,
    [name.trim(), email.trim().toLowerCase(), passwordHash]
  );

  return findUserById(result.lastID);
}

async function findUserByEmail(email) {
  const db = await getDatabase();

  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  console.log("SEARCHING EMAIL:", normalizedEmail);

  // Check all users
  const allUsers = await db.all(`
    SELECT id, name, email, role
    FROM users
  `);

  console.log("ALL USERS IN BACKEND DATABASE:", allUsers);

  const row = await db.get(
    `
      SELECT *
      FROM users
      WHERE LOWER(TRIM(email)) = ?
    `,
    [normalizedEmail]
  );

  console.log("USER FOUND:", row);

  return row
    ? {
        ...parseUser(row),
        passwordHash: row.password_hash,
      }
    : null;
}

async function findUserById(id) {
  const db = await getDatabase();

  const row = await db.get(
    `SELECT * FROM users WHERE id = ?`,
    [id]
  );

  return parseUser(row);
}

async function verifyUserCredentials(email, password) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// ==========================================
// PASSWORD RESET
// ==========================================

async function createPasswordResetToken({
  userId,
  tokenHash,
  expiresAt,
}) {
  const db = await getDatabase();

  await db.run(
    `DELETE FROM password_reset_tokens WHERE user_id = ?`,
    [userId]
  );

  const result = await db.run(
    `
      INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?)
    `,
    [userId, tokenHash, expiresAt]
  );

  return result.lastID;
}

async function findPasswordResetToken(tokenHash) {
  const db = await getDatabase();

  const row = await db.get(
    `
      SELECT *
      FROM password_reset_tokens
      WHERE token_hash = ?
        AND datetime(expires_at) > datetime('now')
    `,
    [tokenHash]
  );

  return row || null;
}

async function deletePasswordResetToken(tokenHash) {
  const db = await getDatabase();

  await db.run(
    `
      DELETE FROM password_reset_tokens
      WHERE token_hash = ?
    `,
    [tokenHash]
  );
}

async function updateUserPassword(userId, password) {
  const db = await getDatabase();

  const passwordHash = await bcrypt.hash(password, 10);

  await db.run(
    `
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
    `,
    [passwordHash, userId]
  );
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUserCredentials,
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  updateUserPassword,
};