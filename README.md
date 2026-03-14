# Las Vegas Conference App (Next.js)

This project is built with Next.js.

Landing page + dashboard + API in one Next.js repo.

## Run locally

```bash
npm install
npm run dev
```

## Build and run

```bash
npm run build
npm run start
```

## Routes

- `/` -> landing page
- `/dashboard` -> lead analytics dashboard

## API

- `GET /api/health` -> health check
- `GET /api/leads` -> list all lead requests
- `POST /api/leads` -> validate and create a lead request
- `GET /api/leads/:id` -> get a specific lead request

Required fields for `POST /api/leads`:

- `firstName`
- `lastName`
- `email`
- `company`
- `jobTitle`
- `socialHandle`

## Data storage

- Lead records are stored in Postgres using `DATABASE_URL`.
- UTM params captured from the landing page: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.
