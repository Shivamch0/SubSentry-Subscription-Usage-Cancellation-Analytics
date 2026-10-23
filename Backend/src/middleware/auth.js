import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const requireAuth = (req, _res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  if (!token) return next(new ApiError(401, "Access token is required"));
  try {
    req.auth = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    return next();
  } catch {
    return next(new ApiError(401, "Access token is invalid or expired"));
  }
};
