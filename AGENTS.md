Parent DOX: [8020 workspace](../AGENTS.md).

Framework source:
[agent0ai/dox/AGENTS.md](https://github.com/agent0ai/dox/blob/765ae4ac02cc884eefcd41a3d0f71941721adb89/AGENTS.md).

# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable
  docs must stay understandable from the nearest applicable AGENTS.md plus every
  parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path,
   read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide
   rules
7. If docs conflict, the closer doc controls local work details, but no child
   doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session
before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or
  quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child
index changes. Update child docs when parent changes alter local rules. Remove
stale or contradictory text immediately. Small edits that do not change behavior
or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences,
  durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX
  Index
- Each parent explains what its direct children cover and what stays owned by
  the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own
  purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user
  instructions; if there are no specific standards or instructions yet, leave it
  empty
- Verification must reflect an existing check; if no verification framework
  exists yet, leave it empty and update it when one exists

Default section order:

- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local
  version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for
  risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the
relevant child AGENTS.md

## Child DOX Index

This root retains repository-wide contracts and files outside the child scopes
below.

- [programs/AGENTS.md](programs/AGENTS.md): Group the database catalog, row
  browser, and SQL administration programs.

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
- Database, SQL, and the hidden row browser declare `uui = true`; calls to the
  row browser pass its table name as one positional argument to `invokeProgram`.
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
  Query fields are ordered Where (long), Limit (medium), then Order by (medium)
  in both the screen schema and layout.
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

- Each screen function retains its UUI Model across actions, refreshes, and
  child-program returns. Standard list query/page processing applies to the
  supplied result array; backend browse/SQL predicates remain explicit program
  actions. Lists use declarative column metadata.

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
