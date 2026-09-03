# Purpose

- Provide first-party UUI administration for the 80|20 database catalog.
- This file is the root contract of the independent `the8020/admin-db` Git
  repository.

# Ownership

- Own database table list, detail, activated-definition comparison,
  synchronization, and confirmed destructive-trim screens.
- Do not own the table DSL, Kysely driver, codecs, evaluator, catalog, physical
  schema operations, or database credentials.

# Local Contracts

- `the8020/admin-db/database` is a parameterless program backed only by typed
  `@the8020/kernel` commands and the ordinary UUI package mapping.
- Ordinary list and detail screens are fast database-first views. They present
  fields, indexes, checks, and differences as structured rows and never launch
  TypeScript evaluation.
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
- `deno task test` covers list/detail/comparison view models, removal of raw
  descriptor controls, and destructive confirmation.
