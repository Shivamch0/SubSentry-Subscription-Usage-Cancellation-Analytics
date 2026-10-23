# SubSentry API

Express 5 + Mongoose REST API. Run `npm install`, copy `.env.example` to `.env`, set `DB_URL` to MongoDB, then use `npm run dev`. `npm start` runs the server; `npm test` runs the non-database HTTP checks; `npm run seed` inserts deterministic demo records.

All routes are prefixed with `/api`. `GET /health` is public. Register/login at `/auth/register` and `/auth/login`; both return a short-lived access token and set an HTTP-only refresh cookie. Send `Authorization: Bearer <accessToken>` to all customer, plan, subscription, usage, analytics, and CSV routes. `POST /auth/refresh` rotates the cookie and returns a new access token; `POST /auth/logout` revokes the stored refresh token.

Configure `CORS_ORIGINS` as a comma-separated allowlist. Keep JWT signing secrets server-side and distinct. The current account model authenticates users but does not scope the shared data by account or role. See the root README for endpoint list, metric definitions, limitations, and Power BI model.
