Parent DOX: [admin-db DOX](../AGENTS.md).

# Purpose

- Share database administration field meaning across catalog, comparison, SQL,
  and row-browsing screens.

# Ownership

- `catalog.ts` owns descriptive catalog and schema-operation fields.
- `query.ts` owns query input fields and bounds, textual SQL result fields, and
  descriptor-based row-value schemas.

# Local Contracts

- Reuse the db table reference and package/source fields from their owners.
- Keep labels and useful help in ordinary Zod fields. Screens own read-only
  controls, layout, and row identity keys.
- Browse uses deployed storage descriptors without importing table sources.
  Describe only known type, nullability, and reference facts. Decimal strings
  retain exact decimal semantics; JSON and enum fields retain their types.
- Arbitrary SQL output has column names and textual values, without authored
  business metadata. Preserve those headings and describe its returned-value
  notation without inferring business meaning from a name.
- Data operations retain SQL-fragment validation, statement parsing, and byte
  limits; sharing field definitions does not replace execution validation.

# Work Guidance

# Verification

- Run `deno task check` and `deno task test` from the repository root. Database
  program tests cover query bounds, value schemas, and catalog field help; UUI's
  Programs browser scenario covers database navigation and SQL help.

# Child DOX Index

No child DOX documents. This document owns the entire local scope.
