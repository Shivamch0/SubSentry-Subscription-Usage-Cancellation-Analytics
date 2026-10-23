# SubSentry frontend

React 19 + Vite 8 + Tailwind CSS 4 client for the SubSentry API.

## Setup

```sh
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the API prefix (default `http://localhost:5000/api`, matching the current backend `.env`). Vite variables are public client configuration: never put passwords, JWT signing keys, access tokens, or refresh tokens in them.

## Scripts

- `npm run dev` — local Vite server.
- `npm run build` — production bundle.
- `npm run preview` — serve the built bundle locally.
- `npm run lint` — ESLint.

## Structure and API

- `src/App.jsx` — authenticated workspace shell, dashboard and resource screens.
- `src/services/api.js` — Axios instance, bearer access token, refresh-cookie rotation, and API helpers.
- `src/index.css` — responsive workspace styling and Tailwind import.

The sign-in screen supports account registration and login. Access tokens are held in memory; refresh tokens are HTTP-only cookies. Axios sends credentials and refreshes an expired access token once before retrying the request. Configure the API `CORS_ORIGINS` allowlist to include the frontend origin.

The dashboard reads live summary data. Customers, plans, subscriptions, and usage pages support creating and listing records. Subscription/plan IDs are accepted as inputs until searchable relationship pickers are added. The Power BI export workflow is documented at `../powerbi/README.md`.
