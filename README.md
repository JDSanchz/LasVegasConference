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

- Required lead fields: first name, last name, email, company, job title, phone.
- Optional fields: industry, company size.
- UTM params captured: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.
- Leads are always saved locally in `localStorage` under `lv_conf_leads`.
- If `VITE_LEAD_ENDPOINT` is set, form submissions are also POSTed as JSON to that endpoint.

Copy `.env.example` to `.env` and set `VITE_LEAD_ENDPOINT` to integrate with CRM/API.
