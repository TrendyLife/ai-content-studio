# AI Content Studio — release checks (updated 2026-11-18)

This project currently offers **editable, template-generated drafts** in the browser. Do not advertise the free drafts as AI-generated. The `/api/generate` route is a disabled-by-default AI integration, not a finished paid feature.

## Verify before a Flippa listing

- [ ] Test current free tools (combined keyword/hashtag ideas, product descriptions, marketing emails, and Product Video Studio planning) on mobile and desktop. Check that results are editable and copy correctly. Keyword ideas are not search-volume measurements; Product Video Studio does not create MP4s.
- [ ] Test both Product Video Studio workflows (describe your own idea / guided choices), with text and optional local photo, plus copy, save, and download. Confirm that photos are not uploaded.
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
- `api/generate.js`: Gemini API route, **hard-blocked with HTTP 503** as of 2026-11-18 until server-side verified authentication and persistent quotas are implemented. Even setting `AI_STUDIO_GENERATION_ENABLED=true` must not expose a billable endpoint. Its existence does not mean the UI uses AI.
- No verified production subscription system, secure metering, or cross-device draft sync. Do not describe these as live features.

## No-cost smoke tests

1. Open the production deployment in a private browser window. Create a draft, edit it, save it, refresh and check persistence.
2. Export drafts to JSON, remove a draft, re-import, and check the restored content.
3. Verify that the account form **does not claim successful signup** before a dedicated Supabase project is configured.
4. POST to `/api/generate` without enabling it and verify a controlled 503 response (no AI provider charge).
5. Repeat on a narrow phone viewport and desktop; inspect for clipped controls or horizontal overflow.

**Provisional listing language (subject to production testing):** “A responsive content-drafting web app with free template-based keyword/hashtag, product-description and marketing-email tools, a guided product-video storyboard/prompt planner, and browser-local saved drafts. Video rendering, secure authentication, paid AI generation and subscriptions are not live.” Update this description only after testing in production. Do not describe it as a working paid AI SaaS.
