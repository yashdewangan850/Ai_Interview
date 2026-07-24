const jwt = require("jsonwebtoken");
const { findUserById } = require("../models/userModel");

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      const error = new Error("Authentication required.");
      error.statusCode = 401;
      throw error;
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "replace_with_a_long_secret"
    );
    const user = await findUserById(payload.sub);

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401;
      error.message = "Invalid or expired session.";
    }

    next(error);
  }
}

module.exports = {
  requireAuth,
};
