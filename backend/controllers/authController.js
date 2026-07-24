const jwt = require("jsonwebtoken");
const {
  createUser,
  findUserByEmail,
  verifyUserCredentials,
} = require("../models/userModel");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "replace_with_a_long_secret",
    { expiresIn: "7d" }
  );
}

async function signup(req, res, next) {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password || "";

    if (!name || name.length < 2) {
      throw createError("Name must be at least 2 characters long.");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError("A valid email is required.");
    }

    if (password.length < 6) {
      throw createError("Password must be at least 6 characters long.");
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      throw createError("An account with this email already exists.");
    }

    const user = await createUser({ name, email, password });
    const token = signToken(user);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      throw createError("Email and password are required.");
    }

    const user = await verifyUserCredentials(email, password);

    if (!user) {
      throw createError("Invalid email or password.", 401);
    }

    const token = signToken(user);

    res.json({
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  signup,
  login,
  me,
};
