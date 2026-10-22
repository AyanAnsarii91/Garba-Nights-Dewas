# Garba-Nights-Dewas

## Environment configuration

The frontend reads its API origin from `VITE_API_URL`. Local development uses
`frontend/.env` (`http://localhost:5001/api`); production builds use
`frontend/.env.production` (`https://garba-nights-dewas.onrender.com/api`).
These URLs are public and contain no credentials. Netlify can also set
`VITE_API_URL` as a build environment variable to override the file value.

For the backend, copy `backend/.env.example` to `backend/.env` and provide the
private database, JWT, and PhonePe credentials. In Render, set
`FRONTEND_URL=https://dholkinights.netlify.app`,
`BACKEND_URL=https://garba-nights-dewas.onrender.com`, and
`CORS_ORIGINS=https://dholkinights.netlify.app`. The local backend `.env`
allows both local development and the production frontend.

Set the Render environment variables `MONGODB_URI`, `JWT_SECRET`,
`PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_SALT_INDEX`, and `PHONEPE_ENV=PRODUCTION` in the
Render dashboard; do not put these secrets in frontend environment files.
Register `https://garba-nights-dewas.onrender.com/api/payments/phonepe/webhook`
as the PhonePe S2S webhook/callback URL in the PhonePe merchant dashboard. The webhook endpoint is server-to-server and verifies requests cryptographically using the PhonePe salt key.

Netlify should build the `frontend` directory with `npm run build`. Its
`public/_redirects` fallback preserves React routes such as ticket pages on
direct navigation and refresh.

Paid tickets remain available from the backend using their order or ticket
number URL, so customers can reopen the ticket page and download a PNG copy
after refreshing or closing the browser. The download includes the event and
attendee details plus the QR generated from the backend-held ticket token;
entry validity is still checked by the backend scanner.
