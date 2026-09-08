import { field, z } from "/p/the8020/db/fields.ts";

export const catalogInfo = z.object({
  tableName: field(z.string(), {
    label: "Table",
    description: "The table name within its owning package.",
  }),
  state: field(z.string(), {
    label: "State",
    description:
      "Whether this structure is active, retired, missing from the database, or uncatalogued.",
  }),
  synchronization: field(z.string(), {
    label: "Last sync result",
    description:
      "The result of the most recent attempt to align the database with the deployed definition.",
  }),
  synchronizedAt: field(z.string(), {
    label: "Last synchronized",
    description:
      "When the table was most recently synchronized with its deployed definition.",
  }),
  attention: field(z.string(), {
    label: "Attention",
    description:
      "Schema or inspection problems to review before synchronizing or using this table.",
  }),
  columnName: field(z.string(), {
    label: "Field",
    description: "The field name used in SQL queries and table definitions.",
  }),
  logicalType: field(z.string(), {
    label: "Logical type",
    description:
      "The package-defined value type, including decimal precision and scale or allowed enum values.",
  }),
  databaseType: field(z.string(), {
    label: "Database type",
    description: "The physical type currently used by the database engine.",
  }),
  required: field(z.string(), {
    label: "Required",
    description:
      "Whether this field must contain a value. Required fields do not accept SQL NULL.",
  }),
  defaultValue: field(z.string(), {
    label: "Default",
    description:
      "The value supplied by the table definition when an insert omits this field.",
  }),
  databaseDefault: field(z.string(), {
    label: "Database default",
    description:
      "The default expression currently configured in the physical database.",
  }),
  constraints: field(z.string(), {
    label: "Constraints",
    description:
      "Rules such as primary key, unique, or generated that apply to this field.",
  }),
  reference: field(z.string(), {
    label: "Reference",
    description: "The related table and field referenced by this foreign key.",
  }),
  indexName: field(z.string(), {
    label: "Index",
    description:
      "The name of the index used to find rows efficiently or enforce uniqueness.",
  }),
  indexColumns: field(z.string(), {
    label: "Fields",
    description: "The fields in this index, in index order.",
  }),
  unique: field(z.string(), {
    label: "Unique",
    description:
      "Whether this index rejects rows with duplicate indexed values.",
  }),
  difference: field(z.string(), {
    label: "Difference",
    description:
      "A difference between the activated definition, deployed catalog, and physical database.",
  }),
  schemaState: field(z.string(), {
    label: "Database schema",
    description:
      "Whether the physical database agrees with the deployed table definition.",
  }),
  fields: field(z.string(), {
    label: "Fields",
    description: "The number of active and retired fields in this table.",
  }),
  expression: field(z.string(), {
    label: "Database check",
    description:
      "An expression the database checks when inserting or updating a row.",
  }),
  change: field(z.string(), {
    label: "Change",
    description:
      "How the activated source definition differs from the deployed definition.",
  }),
  activated: field(z.string(), {
    label: "Activated definition",
    description:
      "The definition evaluated from the currently activated package source.",
  }),
  deployed: field(z.string(), {
    label: "Deployed definition",
    description:
      "The definition most recently synchronized into the database catalog.",
  }),
  database: field(z.string(), {
    label: "Database",
    description:
      "The field or index as it currently exists in the physical database.",
  }),
  result: field(z.string(), {
    label: "Result",
    description:
      "Whether the compared definitions agree, or how many differences need review.",
  }),
  operation: field(z.string(), {
    label: "Operation",
    description: "The database operation that will run after confirmation.",
  }),
  affected: field(z.string(), {
    label: "Permanently remove",
    description:
      "The table or retired fields whose stored data will be permanently deleted.",
  }),
  warning: field(z.string(), {
    label: "Warning",
    description: "The data-loss consequence of confirming this operation.",
  }),
  activeColumns: field(z.number(), {
    label: "Active fields",
    description: "Number of fields in the deployed active table definition.",
  }),
  retiredColumns: field(z.number(), {
    label: "Retired fields",
    description:
      "Number of retired fields retained in the database until explicitly trimmed.",
  }),
  confirmed: field(z.boolean(), {
    label: "I understand that this data cannot be recovered",
    description:
      "Confirm only after reviewing the exact structures and data that will be permanently removed.",
  }),
});
