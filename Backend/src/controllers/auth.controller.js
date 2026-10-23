import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const accessSecret = () => {
  if (!process.env.JWT_ACCESS_SECRET)
    throw new ApiError(500, "JWT_ACCESS_SECRET is not configured");
  return process.env.JWT_ACCESS_SECRET;
};
const refreshSecret = () => {
  if (!process.env.JWT_REFRESH_SECRET)
    throw new ApiError(500, "JWT_REFRESH_SECRET is not configured");
  return process.env.JWT_REFRESH_SECRET;
};
const createTokens = (user) => ({
  accessToken: jwt.sign({ sub: user.id, email: user.email }, accessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  }),
  refreshToken: jwt.sign({ sub: user.id, type: "refresh" }, refreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  }),
});
const response = (res, data, status = 200) =>
  res.status(status).json(new ApiResponse(status, data));
const cleanUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});
const refreshCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: 7 * 86400000,
};
export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10)
    throw new ApiError(
      400,
      "Provide a name, valid email, and password of at least 10 characters",
    );
  if (await User.exists({ email }))
    throw new ApiError(409, "An account with this email already exists");
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
  });
  const tokens = createTokens(user);
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12);
  await user.save();
  res.cookie("refreshToken", tokens.refreshToken, refreshCookie);
  return response(
    res,
    { user: cleanUser(user), accessToken: tokens.accessToken },
    201,
  );
});
export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new ApiError(401, "Email or password is incorrect");
  const tokens = createTokens(user);
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12);
  await user.save();
  res.cookie("refreshToken", tokens.refreshToken, refreshCookie);
  return response(res, {
    user: cleanUser(user),
    accessToken: tokens.accessToken,
  });
});
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "Refresh token is required");
  let payload;
  try {
    payload = jwt.verify(token, refreshSecret());
  } catch {
    throw new ApiError(401, "Refresh token is invalid or expired");
  }
  if (payload.type !== "refresh")
    throw new ApiError(401, "Invalid refresh token");
  const user = await User.findById(payload.sub);
  if (
    !user ||
    !user.refreshTokenHash ||
    !(await bcrypt.compare(token, user.refreshTokenHash))
  )
    throw new ApiError(401, "Refresh token has been revoked");
  const tokens = createTokens(user);
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12);
  await user.save();
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 7 * 86400000,
  });
  return response(res, {
    accessToken: tokens.accessToken,
    user: cleanUser(user),
  });
});
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, refreshSecret());
      await User.findByIdAndUpdate(payload.sub, { refreshTokenHash: "" });
    } catch {
      /* Expired cookies are still cleared. */
    }
  }
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: refreshCookie.sameSite,
    path: "/api/auth",
  });
  return response(res, null, 200);
});
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.sub).select("name email");
  if (!user) throw new ApiError(401, "Account no longer exists");
  return response(res, cleanUser(user));
});
