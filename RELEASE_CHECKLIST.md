# AI Content Studio — release checks (2026-11-17)

This project currently offers **editable, template-generated drafts** in the browser. Do not advertise the free drafts as AI-generated. The `/api/generate` route is a disabled-by-default AI integration, not a finished paid feature.

## Verify before a Flippa listing

- [ ] Test all four free tools (captions, product descriptions, hashtags, emails) on mobile and desktop. Check that results are editable and copy correctly.
- [ ] Test saved drafts, deletion, JSON export/import, and refresh persistence. Browser localStorage is **not cloud backup**; clearing browser data can remove drafts.
- [ ] Create a dedicated Supabase project. Configure the **project URL and publishable key** for the client, enable email verification, and configure approved redirect URLs. Never put a service-role/secret key in frontend code.
- [ ] Test real sign-up, confirmation email, login, logout, invalid credentials, password recovery and session persistence with two separate test accounts. The current UI must remain disabled when Supabase is not configured.
- [ ] Before enabling paid AI generation: verify user JWTs on the **server**, enforce persistent per-user quotas and request limits, and return safe errors. A browser-only counter or a public environment toggle is not sufficient protection against API bills.
- [ ] Confirm the provider model is available and its current pricing, set a spending limit/alert, and test server responses without exposing provider credentials. Keep `AI_STUDIO_GENERATION_ENABLED` unset or false until protections are deployed.
- [ ] If offering subscriptions: implement payment checkout and verified payment webhooks, cancellation and access expiration, and publish clear trial/renewal terms. Never infer paid access from frontend state.
- [ ] Confirm privacy policy, terms, contact/support channel, data deletion policy, ownership/transferability of accounts, and all third-party license/transfer restrictions.
- [ ] Test a clean Vercel production deployment, check browser console and network failures, and record reproducible screenshots and a truthful demo.
- [ ] Obtain owner approval before any charge, production payment activation, or Flippa listing publication.

## Current architecture / known limitations

- `index.html`: single-page UI, free template drafting, browser-local saved projects, Supabase Auth UI awaiting owner configuration.
- `api/generate.js`: Gemini API route, deliberately **off** by default. Its existence does not mean the UI uses AI.
- No verified production subscription system, secure metering, or cross-device draft sync. Do not describe these as live features.

## No-cost smoke tests

1. Open the production deployment in a private browser window. Create a draft, edit it, save it, refresh and check persistence.
2. Export drafts to JSON, remove a draft, re-import, and check the restored content.
3. Verify that the account form **does not claim successful signup** before a dedicated Supabase project is configured.
4. POST to `/api/generate` without enabling it and verify a controlled 503 response (no AI provider charge).
5. Repeat on a narrow phone viewport and desktop; inspect for clipped controls or horizontal overflow.

**Listing language:** “A responsive content-drafting web app with four free template-based writing tools and local browser draft storage; authentication and AI subscription integrations are under development.” Update this description only after each additional feature is tested in production.
