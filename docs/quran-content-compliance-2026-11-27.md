# Quran text source and public-repository compliance

Date: 2026-11-27

## Why the bundled snapshot was removed

The repository previously included two pages of Quran Foundation API text in a public TypeScript data file, along with a script that could regenerate and commit that snapshot.

The Quran Foundation Developer Terms, updated 2026-11-20, state that Quran Foundation Content/raw API data may not be redistributed in a public source-code repository or downloadable package. Regular API responses also have storage/synchronization restrictions. The two-page snapshot and its generator are therefore removed from the public repository.

Official terms:
- https://api-docs.quran.com/legal/developer-terms/
- https://api-docs.quran.com/docs/tutorials/faq/

## Current behavior after this change

- The default reader displays a text-free 15-line demo frame and navigation metadata.
- No page is falsely presented as containing complete Quran text.
- The live Quran Foundation API adapter remains opt-in; enable it only after accepting current terms, obtaining approved production access, and implementing required attribution/privacy and storage/sync behavior.
- The adapter must not create a bundled/public dataset from regular API responses.
- This change does not add the complete Mushaf and does not change the live site or Supabase.

## Future full Mushaf path

Tanzil's Uthmani text is a candidate for a verbatim bundled text dataset under its CC BY 3.0 terms, with required source attribution/link and no alteration:
- https://tanzil.net/download/
- https://tanzil.net/docs/Text_License
- https://tanzil.net/docs/uthmani

Tanzil text licensing does not automatically establish rights to any particular 15-line word-level layout. Text edition and 15-line page/line layout must be sourced and documented separately. Do not approximate line breaks.
