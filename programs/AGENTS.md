Parent DOX: [admin-db DOX](../AGENTS.md).

# Purpose

- Group the database catalog, row browser, and SQL administration programs.

# Ownership

- Own program discovery and shared navigation expectations; each child owns its
  program, view models, layouts, and tests.

# Local Contracts

- All three programs declare `uui = true`; the row browser is hidden and
  receives the physical table name as one positional argument.
- Use typed kernel database operations and preserve UUI Models across actions
  and returns.

# Work Guidance

# Verification

- From the repository root, run `deno task check` and `deno task test`.

# Child DOX Index

- [browse/AGENTS.md](browse/AGENTS.md): Browse bounded table rows using deployed
  descriptors and logical value codecs.
- [database/AGENTS.md](database/AGENTS.md): Present the database catalog, schema
  detail, definition comparison, and explicit synchronization actions.
- [sql/AGENTS.md](sql/AGENTS.md): Provide the explicit single-statement SQL
  execution screen.
