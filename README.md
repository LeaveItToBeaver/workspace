# User Management System

A full‑stack demo that manages users with geolocation from OpenWeather. Backend uses Node/Express + Firebase Realtime Database; frontend is React + Vite with feature‑focused structure, Tailwind CSS, and shadcn‑style components.

## Quickstart

Prereqs: Node 18+, a .env in `server/` with:

```
PORT=8080
FIREBASE_DATABASE_URL=<your-firebase-db-url>
OPENWEATHER_API_KEY=<your-openweather-key>
# Option A: file at server/serviceAccountKey.json
# Option B: inline JSON
# SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

Install and run:

```
# from repo root
npm run install:all
npm run both
```

This launches:

- Server: http://localhost:8080
- Client: http://localhost:5173 (or 5174 if 5173 is taken)

Health checks:

- API: GET http://localhost:8080/health
- Users API: GET http://localhost:8080/api/users

Seeder (optional):

```
chmod +x server/scripts/seed-users.sh
./server/scripts/seed-users.sh               # default 1000 users
TOTAL=25 DELAY_SEC=0.2 ./server/scripts/seed-users.sh
```

## Architecture

### Server (Express)

- Routes: `src/routes/*.js` – HTTP routes and middleware wiring.
- Controllers: `src/controllers/*.js` – Request/response orchestration, no business logic.
- Services: `src/services/*.js` – Business rules (validation, geolocation fetch, orchestration).
- Repositories: `src/repositories/*.js` – Data access (Firebase Realtime Database).
- Middleware: `src/middleware/*.js` – Validation, error handling, etc.
- Config: `src/config/*` – Environment, DB bootstrap.

Flow (controller → service → repository):

1. Controller validates inputs and delegates to service.
2. Service applies business logic and calls repository.
3. Repository talks to Firebase and returns plain objects.

Key services:

- `geolocationService`: wraps OpenWeather Current Weather API, returns latitude, longitude, timezone (+ offset), and city.
- `userService`: composes user data, fetches geolocation on create and when zip changes.

### Frontend (React + Vite)

- Feature‑focused: `client/src/features/users/*` encapsulates hooks, views, and types.
- Styling: Tailwind CSS.
- Components: shadcn‑style primitives in `client/src/components/*` (Button, Card, Input, DataTable, EditableCell).
- Data: TanStack Query for fetching/mutations, optimistic updates.

Routing:

- `/` → Users page with create form and table (search, selection, inline edit).

## Testing

Backend has comprehensive Jest tests (unit, integration, middleware, performance). Run from root:

```
npm test
```

## Roadmap / Next steps

These are partially scaffolded in code or easy additions:

- Authentication & Authorization
  - Pipeline with JWT or Firebase Auth (verify ID tokens middleware; role claims for admin ops).
  - Protect mutating routes (POST/PUT/DELETE) and expose read‑only for public.
- Rate Limiting
  - Express middleware (e.g., express-rate-limit) with `constants.RATE_LIMIT` settings.
  - Per‑IP + optional user‑ID limits; 429 on exceed.
- Caching
  - In‑memory cache for geolocation responses per zip (TTL 1h) to reduce OpenWeather calls.
  - ETag/Last‑Modified headers on user list responses to save bandwidth.
- Observability
  - Structured logging (Winston/pino), request IDs, and basic metrics (response times, error rates).
- Pagination & Filtering (Server)
  - Query params: `?page=1&limit=20&zipCode=12345&name=John` to mirror the client’s table features.
- CI/CD
  - GitHub Actions workflow: install, test, coverage gate, and optional deploy.

## API Summary

- POST /api/users – Create (name, zipCode). Auto‑enriches with location.
- GET /api/users – List.
- GET /api/users/:id – Read.
- PUT /api/users/:id – Update (name, zipCode). Re‑fetch location if zip changed.
- DELETE /api/users/:id – Delete.

Error handling

- Consistent JSON structure via `errorHandler` with status, error, message.

## Frontend UX Notes

- Inline edits validate on enter/blur and show errors inline.
- Table supports client‑side search, per‑page selection, and simple pagination.

## Troubleshooting

- If OpenWeather calls rate‑limit during seeding, increase `DELAY_SEC`.
- Ensure Firebase credentials are configured (env or serviceAccountKey.json).
- CORS origins are whitelisted in `server/index.js`.

## Original requirements below:

/\*
Task name: User endpoints

Requirements

1.  We need to create CRUD endpoints
2.  The entries (users) can just be saved in a noSQL database (Bonus for using Firebase Realtime Database)
3.  Each user should have the following data entries:
    id, name, zip code, latitude, longitude, timezone
4.  When creating a user, allow input for name and zip code.  
    (Fetch the latitude, longitude, and timezone - Documentation: https://openweathermap.org/current)
5.  When updating a user, Re-fetch the latitude, longitude, and timezone (if zip code changes)
6.  Connect to a ReactJS front-end

- feel free to add add something creative you'd like

\*/
