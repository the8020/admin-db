Parent DOX: [admin-db/programs DOX](../AGENTS.md).

# Purpose

- Present the database catalog, schema detail, definition comparison, and
  explicit synchronization actions.

# Ownership

- Own `program.ts`, `view.ts`, layouts, and catalog view tests.

# Local Contracts

- Reuse `../../types/` fields for labels, descriptions, and scalar schemas;
  screen modules own layout and editability.

- Ordinary list/detail views use the deployed catalog without evaluating
  TypeScript definitions.
- Definition scans, comparison, and synchronization are explicit actions;
  retired-structure trim requires its dedicated confirmation.
- Main detail prioritizes browsing and a compact field list; field selection
  shows full definition and related-table help. Advanced owns physical/source
  metadata and schema operations. Catalog Advanced opens maintenance.
- Shared table and package fields open their owning programs. The default
  entrypoint accepts an optional selected table ID.
- Keep package/source table names distinct from the physical identifier used for
  navigation.

# Work Guidance

# Verification

- From the repository root, run `deno task check` and `deno task test`.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.
