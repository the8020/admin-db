Parent DOX: [admin-db/programs DOX](../AGENTS.md).

# Purpose

- Browse bounded table rows using deployed descriptors and logical value codecs.

# Ownership

- Own `data.ts`, `program.ts`, `view.ts`, and row-browsing tests.

# Local Contracts

- Accept one physical table name and preserve deployed descriptor column order.
- Accept only single-statement read-only Where and Order by fragments; bound the
  result limit.
- Shared database codecs own physical-to-logical value conversion.

# Work Guidance

# Verification

- From the repository root, run `deno task check` and `deno task test`.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.
