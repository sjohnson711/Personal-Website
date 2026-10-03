# Review the changes locally

From the repository root, run:

```powershell
npm run preview:local --workspace frontend
```

Open **http://127.0.0.1:5173/**. This starts the updated Vite application with local
copies of the public site's published articles and comments. No database setup is
required. A banner identifies the preview, and all form/admin submissions are
blocked. Nothing is deployed by this command.

The first start needs internet access. Later starts can fall back to the cached
public content if the API is unavailable. Stop the preview with `Ctrl+C`.

## What to review

- **Home:** clearer gold links and metadata, newsletter contrast/focus, smaller avatar.
- **Articles:** paging between equally populated pages keeps cards visible.
- **Article:** readable links/headings, larger Share button, comments metadata.
- **About:** use Tab to open Email, navigate the dialog, and close it with Escape.
- **Mobile:** collapsed navigation is skipped by Tab; Escape closes the open menu.
- **Reduced motion:** page fades, scroll reveals, and card/button movement are disabled.

## Completed implementation

- Shared readable text colors while preserving cream, navy, and gold accents.
- Visible keyboard focus, inert closed navigation, and contact-dialog focus management.
- Article loading/retry states that distinguish request failures from empty/missing content.
- Per-card scroll reveals, including a visible fallback without IntersectionObserver.
- A 6 KB homepage avatar, preserving the original photo.
- Cleanup of unused CSS, starter SVGs, an extra font download, and backend `slugify`.
- 13 frontend regression tests; the existing 66 tests also pass.

Validation commands:

```powershell
npm run test --workspace frontend -- --runInBand
npm test -- --runInBand
npm run build --workspace frontend
```
