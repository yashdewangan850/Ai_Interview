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
  const row = await db.get(`SELECT * FROM users WHERE email = ?`, [
    email.trim().toLowerCase(),
  ]);

  return row
    ? {
        ...parseUser(row),
        passwordHash: row.password_hash,
      }
    : null;
}

async function findUserById(id) {
  const db = await getDatabase();
  const row = await db.get(`SELECT * FROM users WHERE id = ?`, [id]);

  return parseUser(row);
}

async function verifyUserCredentials(email, password) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

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

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUserCredentials,
};
