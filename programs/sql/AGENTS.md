Parent DOX: [admin-db/programs DOX](../AGENTS.md).

# Purpose

- Provide the explicit single-statement SQL execution screen.

# Ownership

- Own SQL input handling, result view models, layouts, and tests.

# Local Contracts

- Reuse `../../types/` fields for labels, descriptions, and scalar schemas;
  screen modules own layout and editability.

- Keep the SQL textarea at the standard two-row size (`rowSpan: 2`).
- Reuse the database-owned table field for on-demand search and navigation. The
  optional selected table pre-fills a quoted SELECT limited to 100 rows. New
  SELECT prepares text only; Run SQL remains the execution action. Share
  identifier quoting with the row browser.
- Preserve returned column order, including duplicate names, and distinguish row
  results from affected-row or insert-ID metadata.
- Render scalar and tagged values human-readably and report execution failures
  through UUI messages.

# Work Guidance

# Verification

- From the repository root, run `deno task check` and `deno task test`.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.
