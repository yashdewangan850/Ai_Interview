const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const {
  createUser,
  findUserByEmail,
  verifyUserCredentials,
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  updateUserPassword,
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

    const user = await createUser({
      name,
      email,
      password,
    });

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


async function forgotPassword(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError("A valid email is required.");
    }

    const user = await findUserByEmail(email);

    if (!user) {
      throw createError("No account found with this email.", 404);
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token valid for 15 minutes
    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    ).toISOString();

    // Save token
    await createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const frontendUrl =
      process.env.FRONTEND_URL || "https://ai-interview-1-zjkp.onrender.com";

    const resetUrl =
      `${frontendUrl}/reset-password/${resetToken}`;

    console.log("RESET URL:", resetUrl);

    return res.status(200).json({
      message: "Password reset link generated successfully.",
      resetUrl,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// RESET PASSWORD
// ==========================================

async function resetPassword(req, res, next) {
  try {
    const token = req.body.token;
    const password = req.body.password || "";

    if (!token) {
      throw createError("Reset token is required.");
    }

    if (password.length < 6) {
      throw createError(
        "Password must be at least 6 characters long."
      );
    }

    // Hash received token
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find valid and non-expired token
    const resetRecord =
      await findPasswordResetToken(tokenHash);

    if (!resetRecord) {
      throw createError(
        "Invalid or expired password reset link.",
        400
      );
    }

    // Update password
    await updateUserPassword(
      resetRecord.user_id,
      password
    );

    // Delete token so it cannot be reused
    await deletePasswordResetToken(tokenHash);

    return res.json({
      message:
        "Password reset successfully. You can now login.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signup,
  login,
  me,
  forgotPassword,
  resetPassword,
};