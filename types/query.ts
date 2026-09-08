import { decimal, field, z } from "/p/the8020/db/fields.ts";
import type { ColumnDescriptor } from "/p/the8020/db/codecs.ts";

export const DEFAULT_BROWSE_LIMIT = 100;
export const MAXIMUM_BROWSE_LIMIT = 10_000;
export const MAXIMUM_SQL_CLAUSE_LENGTH = 4_000;

export const queryInfo = z.object({
  where: field(z.string().max(MAXIMUM_SQL_CLAUSE_LENGTH), {
    label: "Where",
    description:
      "A SQL condition, for example `enabled = true`. Leave out the `WHERE` keyword. Leave empty to include all rows up to the limit.",
  }),
  limit: field(z.number().int().min(1).max(MAXIMUM_BROWSE_LIMIT), {
    label: "Limit",
    description:
      "Maximum number of rows to fetch, from **1** through **10,000**. Use Where to narrow large tables before increasing the limit.",
  }),
  orderBy: field(z.string().max(MAXIMUM_SQL_CLAUSE_LENGTH), {
    label: "Order by",
    description:
      "Fields to sort by, for example `createdAt DESC`. Leave out the `ORDER BY` keyword.",
  }),
  sql: field(z.string().max(1_048_576), {
    label: "SQL",
    description:
      "Run one SQL statement at a time, up to **1 MiB**. Statements may read or change data and schema. Transaction-control statements are unavailable.",
  }),
  resultValue: field(z.string(), {
    label: "Value",
    description:
      'The value returned by the SQL statement. `NULL` means no value, `""` is empty text, and `base64:` introduces binary data.',
  }),
});

/** Values presented from deployed descriptors; no source-module evaluation. */
export function tableValue(column: ColumnDescriptor): z.ZodType {
  let schema: z.ZodType;
  switch (column.logical_type) {
    case "boolean":
      schema = z.boolean();
      break;
    case "integer":
      schema = z.number().int();
      break;
    case "float":
      schema = z.number();
      break;
    case "json":
      schema = z.json();
      break;
    case "decimal":
      schema = decimal(column.precision!, column.scale!);
      break;
    case "enum":
      schema = z.enum(column.enum_values! as [string, ...string[]]);
      break;
    default:
      schema = z.string();
  }
  if (column.nullable && column.logical_type !== "json") {
    schema = schema.nullable();
  }
  const type = column.logical_type === "decimal"
    ? `Decimal with ${column.precision} total digits and ${column.scale} decimal places.`
    : column.logical_type === "enum"
    ? `One of: ${column.enum_values!.join(", ")}.`
    : column.logical_type === "bytes"
    ? "Binary data displayed as Base64 text."
    : `A ${column.logical_type} value.`;
  return field(schema, {
    label: column.name,
    description: [
      type,
      column.nullable ? "SQL NULL is allowed." : "A value is required.",
      ...(column.reference
        ? [`References ${column.reference.table}.${column.reference.column}.`]
        : []),
    ].join(" "),
  });
}
