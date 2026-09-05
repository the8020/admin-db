Parent DOX: [admin-db/programs DOX](../AGENTS.md).

# Purpose

- Provide the explicit single-statement SQL execution screen.

# Ownership

- Own SQL input handling, result view models, layouts, and tests.

# Local Contracts

- Preserve returned column order, including duplicate names, and distinguish row
  results from affected-row or insert-ID metadata.
- Render scalar and tagged values human-readably and report execution failures
  through UUI messages.

# Work Guidance

# Verification

- From the repository root, run `deno task check` and `deno task test`.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.
