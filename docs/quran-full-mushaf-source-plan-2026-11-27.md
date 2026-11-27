# Full Qur'an Mushaf: source and implementation plan

Date: 2026-11-27

## Current code facts

- The reader is designed around 604 Madani pages and 15 line slots per page.
- `src/lib/mushaf/data/qpc-hafs-snapshot.ts` currently contains only pages 1 and 2.
- `scripts/fetch-mushaf-snapshot.ts` fetches those pages from Quran.com API v4 using `text_qpc_hafs`, KFGQPC Hafs mushaf ID 5, and cross-checks line placement against mushaf ID 1.
- The script and source adapter explicitly state that the text licence/usage permission must be confirmed before enabling or expanding this source.
- The existing source returns the prototype/demo frame for pages without bundled text. Do not present those pages as a complete Qur'an.

## Candidate text source with published reuse terms

Tanzil Project's Uthmani text v1.1 is published under CC BY 3.0. Its stated terms allow verbatim copying and distribution and use in websites/apps when the source is clearly identified and linked to Tanzil. The text itself must not be changed, and the copyright/license notice must be retained in copies and files containing a substantial portion of the text.

Official source and terms:
- Download: https://tanzil.net/download
- Text license: https://tanzil.net/docs/Text_License
- Updates: https://tanzil.net/updates/

Important: Tanzil's verse text and structural metadata do not, by themselves, prove that a particular 15-line word-by-word layout is available or licensed. Text provenance and page/line layout provenance must be recorded separately.

## Recommended path

1. Keep the existing reader clearly labelled as a prototype until all 604 pages contain source-backed text.
2. Prefer a verbatim, licensed Uthmani text dataset (Tanzil v1.1 is a candidate) for the Arabic verse text. Preserve the publisher's notice and source link; do not normalize, edit, or regenerate the Arabic string content.
3. For 15-line page layout, use a separately identified and permission-cleared layout source. If the Quran.com/Quran Foundation QPC Hafs data is retained, obtain and record its applicable terms/permission before bundling or enabling the API adapter.
4. Do not infer line breaks by fitting text into the page or by approximate character counts. Store/consume authoritative line numbers and validate the layout.
5. Keep a source manifest containing edition/version, source URL, licence/permission, retrieval date, checksum, text field, page-layout source, and attribution displayed in the reader.
6. Do not add an unlicensed translation, recitation audio, or page image as part of this text-only integration.

## Acceptance checks before calling the Mushaf complete

- Exactly 604 pages are addressable and each page has the intended 15-line frame.
- Every displayed Arabic verse is sourced verbatim from the selected edition; no placeholder text is shown as Qur'an.
- Verify all 114 surahs, 30 juz, page start/end references, and the expected verse inventory against the chosen metadata.
- Verify page 1 and page 2 against the existing snapshot and source data, then run automated checks over every page.
- Check surah headings, basmala handling (including Surah 1 and 9), ayah markers, and page transitions.
- Show source attribution in the reader and retain the full required notice in the repository.
- Keep the prototype/demo badge until the data, permissions, and checks are complete.

## Release boundary

This document is planning and provenance work only. It does not change the live app, Supabase, or production deployment. Any production data migration or deployment requires separate approval.
