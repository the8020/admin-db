# Purpose

- Provide first-party UUI administration for the 80|20 database catalog.
- This file is the root contract of the independent `the8020/admin-db` Git
  repository.

# Ownership

- Own database table list, detail, row counting, read-only row browsing, generic
  single-statement SQL execution, activated-definition comparison,
  synchronization, and confirmed destructive-trim screens.
- Do not own the table DSL, Kysely driver, codecs, evaluator, catalog, physical
  schema operations, or database credentials.

# Local Contracts

- `the8020/admin-db/database` is a parameterless program backed only by typed
  `@the8020/kernel` commands and the ordinary UUI package mapping.
- Ordinary list and detail screens are fast database-first views. They present
  fields, indexes, checks, and differences as structured rows and never launch
  TypeScript evaluation. Field rows preserve table-definition order; database-
  only fields follow in physical table order.
- The table list displays package and source table name as its first two
  columns; the concatenated physical identifier remains only its navigation key.
- Table detail starts with package, source table name, physical table name, and
  active/retired state, in that order.
- Table detail exposes row count as an informational message and launches the
  non-discoverable `browse` program with its physical table name. Browse uses
  deployed descriptor order and logical codecs, bounds the result limit, and
  accepts only single-statement read-only Where and Order by SQL fragments.
- The discoverable `sql` program presents one SQL textarea and one dynamically
  shaped output list. It preserves returned column order (including duplicate
  names), renders scalar and tagged values human-readably, and summarizes
  statements that return affected-row or insert-ID metadata. Execution errors
  use UUI error messages.
- Activated definition scans, per-table comparison, and synchronization are
  explicit deeper operations. Selecting a scan result opens comparison and never
  mutates the database implicitly.
- Destructive trim is offered only for retired structures and requires a
  dedicated confirmation screen.

# Work Guidance

- Show concise human-readable schema information. Never expose raw descriptor
  JSON as an administration control.
- Keep command behavior and physical schema decisions in the kernel; this
  package only maps typed results to UUI models and explicit actions.

# Verification

- `deno task check` formats, lints, and type-checks the program.
- `deno task test` covers list/detail/comparison view models, row browse query
  and logical-value mapping, generic SQL intent and dynamic result presentation,
  removal of raw descriptor controls, and destructive confirmation.
