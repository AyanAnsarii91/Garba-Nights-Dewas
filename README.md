# Garba-Nights-Dewas

## Environment configuration

The frontend reads its API origin from `VITE_API_URL`. Local development uses
`frontend/.env` (`http://localhost:5000/api`); production builds use
`frontend/.env.production` (`https://garba-nights-dewas.onrender.com/api`).
These URLs are public and contain no credentials. Netlify can also set
`VITE_API_URL` as a build environment variable to override the file value.

For the backend, copy `backend/.env.example` to `backend/.env` and provide the
private database, JWT, Razorpay, and mail credentials. In Render, set
`FRONTEND_URL=https://dholkinights.netlify.app` and
`CORS_ORIGINS=https://dholkinights.netlify.app`. The local backend `.env`
allows both local development and the production frontend.

Set the Render environment variables `MONGODB_URI`, `JWT_SECRET`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in the
Render dashboard; do not put these secrets in frontend environment files.
Register `https://garba-nights-dewas.onrender.com/api/payments/razorpay/webhook`
as the Razorpay webhook URL and use the same webhook secret in Render and
Razorpay. The webhook endpoint is server-to-server and does not depend on CORS.

Netlify should build the `frontend` directory with `npm run build`. Its
`public/_redirects` fallback preserves React routes such as ticket pages on
direct navigation and refresh.

Paid tickets remain available from the backend using their order or ticket
number URL, so customers can reopen the ticket page and download a PNG copy
after refreshing or closing the browser. The download includes the event and
attendee details plus the QR generated from the backend-held ticket token;
entry validity is still checked by the backend scanner.
