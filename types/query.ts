import { text } from "/p/the8020/i18n/mod.ts";
import { msg } from "/p/the8020/admin-db/i18n/messages.ts";
import { decimal, field, z } from "/p/the8020/db/fields.ts";
import type { ColumnDescriptor } from "/p/the8020/db/codecs.ts";

export const DEFAULT_BROWSE_LIMIT = 100;
export const MAXIMUM_BROWSE_LIMIT = 10_000;
export const MAXIMUM_SQL_CLAUSE_LENGTH = 4_000;

export const queryInfo = z.object({
  where: field(z.string().max(MAXIMUM_SQL_CLAUSE_LENGTH), {
    label: msg("query.where"),
    description: msg("query.a_sql_condition_for_example_enabled_true"),
  }),
  limit: field(z.number().int().min(1).max(MAXIMUM_BROWSE_LIMIT), {
    label: msg("query.limit"),
    description: msg("query.maximum_number_of_rows_to_fetch_from"),
  }),
  orderBy: field(z.string().max(MAXIMUM_SQL_CLAUSE_LENGTH), {
    label: msg("query.order_by"),
    description: msg("query.fields_to_sort_by_for_example_createdat"),
  }),
  sql: field(z.string().max(1_048_576), {
    label: msg("program.sql"),
    description: msg("query.run_one_sql_statement_at_a_time"),
  }),
  resultValue: field(z.string(), {
    label: msg("query.value"),
    description: msg("query.the_value_returned_by_the_sql_statement"),
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
    ? text(
      msg("query.decimal", {
        precision: column.precision!,
        scale: column.scale!,
      }),
    )
    : column.logical_type === "enum"
    ? text(msg("query.enum", { values: column.enum_values!.join(", ") }))
    : column.logical_type === "bytes"
    ? text(msg("query.bytes"))
    : text(msg("query.typed", { type: column.logical_type }));
  return field(schema, {
    label: column.name,
    description: [
      type,
      text(msg(column.nullable ? "query.nullable" : "query.required")),
      ...(column.reference
        ? [
          text(
            msg("query.reference", {
              table: column.reference.table,
              column: column.reference.column,
            }),
          ),
        ]
        : []),
    ].join(" "),
  });
}
