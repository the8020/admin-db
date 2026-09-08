import type { ColumnDescriptor } from "/p/the8020/db/codecs.ts";
import { field, type LayoutDocument, z } from "/p/the8020/uui/mod.ts";
import {
  DEFAULT_BROWSE_LIMIT,
  queryInfo,
  tableValue,
} from "../../types/query.ts";

export function tableBrowseScreen(columns: readonly ColumnDescriptor[]) {
  const rowShape: z.ZodRawShape = Object.fromEntries(
    columns.map((
      column,
    ) => [
      column.name,
      field(tableValue(column), {
        readOnly: true,
        ...(column.logical_type === "datetime"
          ? { semanticType: "datetime" }
          : {}),
      }),
    ]),
  );
  return z.object({
    where: field(queryInfo.shape.where, { length: "long" }),
    limit: field(queryInfo.shape.limit, { length: "medium" }),
    orderBy: field(queryInfo.shape.orderBy, { length: "medium" }),
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
