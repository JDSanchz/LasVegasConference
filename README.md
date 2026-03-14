# Las Vegas Conference Landing Page

Premium, mobile-first lead generation landing page built with React + Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Lead capture and UTM tracking

- Required lead fields: first name, last name, email, company, job title, social handle.
- UTM params captured: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.
- Form submissions are handled by an internal API router in `src/api`.
- Lead records are saved in `localStorage` under `lv_conf_leads`.

### Local API endpoint structure

- `GET /api/health` -> health check for the local API.
- `GET /api/leads` -> returns all saved lead requests from local storage.
- `POST /api/leads` -> validates and saves a lead request to local storage.
- `GET /api/leads/:id` -> returns a single lead request by id.
