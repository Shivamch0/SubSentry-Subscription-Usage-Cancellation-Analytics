import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (error, _req, res, _next) => {
  const status =
    error instanceof ApiError
      ? error.statusCode
      : error.code === 11000
        ? 409
        : ["ValidationError", "CastError", "SyntaxError"].includes(error.name)
          ? 400
          : error.message === "Origin is not allowed by CORS"
            ? 403
            : error.status || 500;
  const message =
    status >= 500
      ? "Internal server error"
      : error.code === 11000
        ? "A record with this unique value already exists"
        : error.message;
  res
    .status(status)
    .json({ success: false, message, errors: error.errors || [] });
};
