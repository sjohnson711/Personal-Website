# Local review: images, subscription alerts, security, and analytics

The full review is available at **http://127.0.0.1:5174/**. It uses sample data in a separate local PostgreSQL cluster; emails are captured to a local mailbox. No production database or email credentials are used.

Sign in at **http://127.0.0.1:5174/gateway**:

- Email: `review@letterofforgiveness.test`
- Password: `ReviewLocalOnly!2026`

Captured emails: **http://127.0.0.1:5174/__review/mailbox**.

## What to review

1. Open **Local image placement test**, then edit it from the admin dashboard. Place the cursor between paragraphs and paste a copied image or an HTTPS URL ending in `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, or `.avif`. Save and reopen it. Images must stay where pasted, and surrounding text must remain intact. Clipboard files are limited to 2 MB; complete article requests to 8 MB. Edit the Markdown image description for alt text.
2. Sign out and subscribe with a test email. The local mailbox should show the signup alert within approximately 15 seconds, addressed to `samaritanbrotherseth@gmail.com`, with the submitted email and UTC signup time. Submitting the same address again must not generate another alert.
3. Sign in and open **Site Analytics**. Review the 7/30/90-day selector, daily views, popular pages, sources, devices, interactions, active subscribers, and alert statuses. Test at a narrow phone width; wide tables scroll within their cards. Refresh updates data. Signed-in admin visits are excluded from traffic.
4. Open a private draft’s public URL after signing out. It must be unavailable. The privacy page explains traffic collection and submitted identities.

Sample traffic is illustrative, not real production traffic. There are no unique-person counts, browser identifiers, or links between submitted identities and anonymous visits. Names and emails remain unverified because signup is immediate. Site history is removed after 90 days; active subscribers and published comments are retained separately. Signup alerts accepted by Resend are marked `sent`; this does not prove inbox delivery.

## Restart and verification

From the repository root:

```powershell
npm run review:local --workspace frontend
npm run test --workspace frontend -- --runInBand
npm test -- --runInBand
npm run test:local --workspace backend
node backend/scripts/verify-migration.mjs
npm run build --workspace frontend
npm run build --workspace backend
node frontend/scripts/verify-browser.mjs
node frontend/scripts/verify-built-site.mjs
```

The review uses PostgreSQL 18 installed on this computer, listening only on `127.0.0.1:5433`, with the dedicated database `personal_review`. Integration and migration tests use separate named databases. Local files and screenshots are under ignored `node_modules/.cache/local-review/`. Stop the frontend/API with Ctrl+C. The database can be stopped with:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D '.\node_modules\.cache\local-review\pgdata' -m fast stop
```

`--reset-sample` on the review command restores only the demonstration article. The earlier read-only snapshot preview remains available through `preview:local`.

## Completed implementation

- Clipboard image insertion uses an immediate anchor, preserving placement even while file reading and other edits overlap. Direct raster image URLs insert at the selected location; ordinary links retain normal behavior.
- Subscription creation, recent interaction, and pending admin alert are saved atomically. A leased worker retries transient failures using a stable Resend idempotency key, stops before 24 hours, recovers expired leases, and exposes failures privately.
- Markdown HTML is sanitized; unsafe URLs, raw HTML, and SVG data images are blocked. User-controlled email content is escaped. API schemas enforce types and limits. Database operations use Prisma models; migration fixture SQL uses parameterized values.
- Draft article/comment reads require authentication. JWT algorithm and payload validation, exact allowed origins, a required request header and Origin for writes, public-form/login throttling, request limits, and API/frontend security headers were added.
- Private analytics and activity APIs accompany `/admin/analytics`. Public traffic events use a per-event UUID solely for retry deduplication. Paths are restricted to known public pages; queries, full referrers, IP addresses, and raw user agents are not stored. DNT/GPC suppress traffic collection.
- The additive database migration preserves existing records and backfills only subscriptions/comments from the last 90 days, without historical signup alerts. Contact and traffic history starts with collection.
- Compatible dependency updates were applied, including the existing Next.js package’s security update. The deployed Vite/Express architecture and visual palette remain intact.

## Production release notes

The production release is approved. At the owner's request, email delivery is deferred until a service is chosen. Production uses `MAIL_MODE=disabled`: subscriptions and analytics still save, signup alerts remain unattempted/pending for up to 90 days, and the private analytics page displays the disabled state. Contact submissions return a clear temporary-unavailability response instead of claiming delivery. Publication emails are skipped. The local preview continues to capture test emails.

The additive migration was applied successfully to production. An authenticated temporary check verified two forwarding hops on the actual API path and confirmed that forged single/multiple `X-Forwarded-For` values and `X-Real-IP` were stripped. Only hop counts and boolean/hash-match results were returned; no IP addresses were recorded. Production uses the verified `TRUST_PROXY_HOPS=2`. The temporary check has been removed from the final source.

Final local validation: 29 frontend tests and 66 existing tests passed; 22 API scenarios passed against the isolated PostgreSQL test database. Existing-data migration and schema comparison passed. Headless browser checks passed for login, analytics, mobile layout, image insertion/save/reopen/render, signup, and captured alert. The built frontend also passed with the actual Vercel security-header configuration and no runtime or CSP violations.

Local testing captures emails. When email delivery is enabled later, sender configuration and actual inbox delivery must be verified; browser/API tests cannot establish delivery to Gmail from the production account. Email delivery is not part of the current production verification while it is explicitly disabled.

Confirm Railway has a `JWT_SECRET` of at least 32 characters, the existing `DATABASE_URL`, `MAIL_MODE=disabled`, `SITE_URL=https://letterofforgiveness.com`, and `PUBLIC_API_URL=https://personal-website-production-b2f4.up.railway.app/api`. Set `FRONTEND_URL` to the production frontend; additional authorized previews must be explicitly listed in comma-separated `PREVIEW_ORIGINS`. Configure `TRUST_PROXY_HOPS` to Railway's verified proxy hop count so throttling uses the real client address; do not trust arbitrary forwarded headers. Email credentials and a verified sender are required only when delivery is enabled later.

Frontend and API changes must be deployed together because writes now require the security header. Deploy the additive migration/API, immediately followed by the matching frontend, and verify sign-in, save/paste, signup alert, unsubscribe, and analytics. The existing backend start command runs `prisma migrate deploy`. If application rollback is needed, retain the additive tables and restore compatible frontend/API versions together.

The scoped dependency audit still reports advisories in Prisma CLI transitive dependencies (`deepmerge-ts`, `mysql2`) and the development `esbuild` dependency. The full repository also reports existing lint/test-tool dependencies. These are not used to process public Vite/Express requests, but remain audit findings requiring review before production approval. An automatic audit fix proposes a Prisma major downgrade; it was not applied because it would change the approved architecture and compatibility. No claim of a clean dependency audit or guaranteed absence of bugs is made.
