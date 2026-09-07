Parent DOX: [admin-db/programs DOX](../AGENTS.md).

# Purpose

- Browse bounded table rows using deployed descriptors and logical value codecs.

# Ownership

- Own `data.ts`, `program.ts`, `view.ts`, and row-browsing tests.

# Local Contracts

- Accept one physical table name and preserve deployed descriptor column order.
- Accept only single-statement read-only Where and Order by fragments; bound the
  result limit.
- Keep row headings focused on field names. Table details opens the owning
  catalog entry. Field help explains SQL predicates and ordering with examples.
- `data.ts` shares identifier quoting with the SQL starter; both retain the same
  validation and escaping contract.
- Shared database codecs own physical-to-logical value conversion.

# Work Guidance

# Verification

- From the repository root, run `deno task check` and `deno task test`.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.
