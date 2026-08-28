# Raghnall Backend API

Standalone Express API extracted from the Raghnall Next.js application. The existing Next.js API routes remain active until the frontend is deliberately switched to this service.

## Features

- MongoDB Atlas connection with retry after failed attempts
- Admin login/logout/session using an HttpOnly JWT cookie
- Protected banner management endpoints
- S3 presigned POST uploads with MIME and 10 MB size enforcement
- Public CloudFront-backed banner responses
- Contact email endpoint
- Explicit CORS/origin allowlist, security headers and rate limiting
- Render health endpoint and Blueprint

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

On Windows PowerShell, copy the example using:

```powershell
Copy-Item .env.example .env
```

The API defaults to `http://localhost:5000`. The frontend remains at `http://localhost:3000`.

## Routes

| Method | Route | Access |
|---|---|---|
| GET | `/health` | Public |
| POST | `/api/admin/login` | Public, rate-limited |
| POST | `/api/admin/logout` | Public |
| GET | `/api/admin/session` | Admin |
| GET | `/api/admin/banners/:page` | Admin |
| PUT | `/api/admin/banners/:page` | Admin |
| POST | `/api/admin/upload` | Admin |
| GET | `/api/banners/:page` | Public |
| POST | `/api/contact` | Public, rate-limited |

## Create the first admin

Set `MONGODB_URI`, `INITIAL_ADMIN_USERNAME`, and `INITIAL_ADMIN_PASSWORD` in `.env`, then run:

```bash
npm run create-admin
```

## Authentication and domains

All browser requests from the frontend must use `credentials: "include"`.

For local development or related custom subdomains such as `www.example.com` and `api.example.com`, use `COOKIE_SAME_SITE=lax`. For unrelated HTTPS Render domains, use `COOKIE_SAME_SITE=none`. Production cookies are always Secure.

Set `FRONTEND_ORIGINS` to a comma-separated exact allowlist without trailing slashes:

```env
FRONTEND_ORIGINS=http://localhost:3000,https://www.example.com
```

## Frontend migration

Add this to the frontend environment:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Change frontend requests from relative paths such as:

```js
fetch("/api/admin/login", options)
```

to:

```js
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
  ...options,
  credentials: "include",
})
```

Deploy and test the backend before removing any existing Next.js API route.

## Render

Create a separate repository from this directory or set `backend` as the Render service Root Directory. Use:

```text
Build Command: npm ci
Start Command: npm start
Health Check: /health
```

Alternatively, deploy with `render.yaml`. Add the backend service's outbound CIDR ranges to the MongoDB Atlas IP Access List.

## AWS

S3 CORS must allow `POST` from each frontend origin. CloudFront remains the public image-delivery layer. Set `AWS_CDN_URL` to the CloudFront base URL.
