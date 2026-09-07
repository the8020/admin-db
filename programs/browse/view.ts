import type { ColumnDescriptor } from "/p/the8020/db/codecs.ts";
import { field, type LayoutDocument, z } from "/p/the8020/uui/mod.ts";
import {
  DEFAULT_BROWSE_LIMIT,
  MAXIMUM_BROWSE_LIMIT,
  MAXIMUM_SQL_CLAUSE_LENGTH,
} from "./data.ts";

export function tableBrowseScreen(columns: readonly ColumnDescriptor[]) {
  const rowShape: z.ZodRawShape = Object.fromEntries(
    columns.map((column) => [column.name, tableValueSchema(column)]),
  );
  return z.object({
    where: field(z.string().max(MAXIMUM_SQL_CLAUSE_LENGTH), {
      label: "Where",
      description:
        "A SQL condition, for example `enabled = true`. Leave out the `WHERE` keyword.",
      length: "long",
    }),
    limit: field(
      z.number().int().min(1).max(MAXIMUM_BROWSE_LIMIT),
      { label: "Limit", length: "medium" },
    ),
    orderBy: field(z.string().max(MAXIMUM_SQL_CLAUSE_LENGTH), {
      label: "Order by",
      description:
        "Fields to sort by, for example `createdAt DESC`. Leave out the `ORDER BY` keyword.",
      length: "medium",
    }),
    rows: z.array(z.object(rowShape)),
  });
}

export function tableBrowseModel() {
  return {
    where: "",
    limit: DEFAULT_BROWSE_LIMIT,
    orderBy: "",
    rows: [] as Record<string, unknown>[],
  };
}

export function tableBrowseLayout(
  columns: readonly ColumnDescriptor[],
): LayoutDocument {
  return {
    schema: 1,
    id: "database-table-browse",
    root: {
      id: "browse",
      type: "stack",
      children: [
        {
          id: "query",
          type: "detail",
          title: "Query",
          controls: ["where", "limit", "orderBy"],
        },
        {
          id: "rows",
          type: "list",
          title: "Rows",
          bind: "rows",
          display: columns.map((column) => column.name),
          headings: Object.fromEntries(
            columns.map((column) => [
              column.name,
              column.name,
            ]),
          ),
        },
      ],
    },
  };
}

function tableValueSchema(column: ColumnDescriptor): z.ZodType {
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
    default:
      schema = z.string();
  }
  if (column.nullable && column.logical_type !== "json") {
    schema = schema.nullable();
  }
  return field(schema, {
    label: column.name,
    readOnly: true,
    ...(column.logical_type === "datetime" ? { semanticType: "datetime" } : {}),
  });
}
