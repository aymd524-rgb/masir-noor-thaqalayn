# Release checkpoint — 2026-11-28

## Verified
- PR #20 head commit `dd98e96fc9bfa90d48863e53b1f6d8e1e5a27dad` passed GitHub Actions `build` check (run `46110836445`): dependency installation, application tests, and production build succeeded.
- Cloudflare Workers Builds check for the same commit completed successfully. This confirms a preview/build pipeline, not a production release.
- The Mushaf snapshot fetcher retry fix is included in that commit: permanent HTTP errors are not retried; transient transport errors and HTTP 429/5xx are retried.

## Not yet released
- PR #19 and PR #20 are still open Draft PRs; neither is merged.
- No staging Supabase migration or account-isolation/RLS acceptance evidence has been recorded.
- Real SMS OTP delivery/provider configuration has not been tested end-to-end.
- The manual sample Mushaf workflow has not been confirmed run; no full 604-page, 15-line Uthmani snapshot has been downloaded and visually checked against reference pages.
- Android Arabic/Persian certificate print/Save-as-PDF acceptance is outstanding.
- No production database migration, production Edge Function deployment, or public-site release has been performed.

## Required release sequence
1. Run the manual sample Mushaf workflow and inspect pages 1, 2, 50, and 604.
2. Obtain and validate the full 604-page dataset and confirm source licensing/redistribution terms.
3. Run migrations and the documented authorization/isolation matrix in a disposable staging Supabase project.
4. Configure the SMS provider and complete phone OTP tests.
5. Verify certificate printing on Android.
6. Review and merge the PRs in dependency order, then perform authorized production migration/deployment and smoke tests.

This checkpoint records evidence only; it does not mark the app released.
