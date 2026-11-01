import { msg } from "/p/the8020/admin-db/i18n/messages.ts";
import { queryInfo } from "../../types/query.ts";
import { field, type LayoutDeclaration, z } from "/p/the8020/uui/mod.ts";
import type { SQLResultColumn } from "./data.ts";
import { tableId } from "/p/the8020/db/types/table.ts";

export function sqlScreen(columns: readonly SQLResultColumn[]) {
  const resultShape: z.ZodRawShape = {
    __rowKey: z.string(),
    ...Object.fromEntries(
      columns.map((
        column,
      ) => [
        column.key,
        field(queryInfo.shape.resultValue, { label: column.heading }),
      ]),
    ),
  };
  return z.object({
    table: field(tableId, {
      label: msg("program.table_reference"),
      length: "long",
      reactive: true,
    }),
    sql: field(queryInfo.shape.sql, {
      control: "textarea",
      placeholder: msg("view.select_from_table_name_limit_100"),
      length: "long",
      rowSpan: 2,
    }),
    output: z.array(z.object(resultShape)),
  });
}

export function sqlLayout(
  columns: readonly SQLResultColumn[],
): LayoutDeclaration {
  return {
    schema: 1,
    id: "database-sql-executor",
    root: {
      id: "executor",
      type: "stack",
      children: [
        {
          id: "statement",
          type: "detail",
          controls: ["sql"],
        },
        {
          id: "output",
          type: "list",
          title: msg("view.output"),
          bind: "output",
          key: "__rowKey",
          display: columns.map((column) => column.key),
          headings: Object.fromEntries(
            columns.map((column) => [column.key, column.heading]),
          ),
        },
      ],
    },
  };
}
