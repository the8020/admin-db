Parent DOX: [admin-db/programs DOX](../AGENTS.md).

# Purpose

- Present the database catalog, schema detail, definition comparison, and
  explicit synchronization actions.

# Ownership

- Own `program.ts`, `view.ts`, layouts, and catalog view tests.

# Local Contracts

- Ordinary list/detail views use the deployed catalog without evaluating
  TypeScript definitions.
- Definition scans, comparison, and synchronization are explicit actions;
  retired-structure trim requires its dedicated confirmation.
- Keep package/source table names distinct from the physical identifier used for
  navigation.

# Work Guidance

# Verification

- From the repository root, run `deno task check` and `deno task test`.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.
