import { field, type LayoutDocument, z } from "@packages/the8020/uui/mod.ts";
import type { SQLResultColumn } from "./data.ts";

export function sqlScreen(columns: readonly SQLResultColumn[]) {
  const resultShape: z.ZodRawShape = {
    __rowKey: z.string(),
    ...Object.fromEntries(columns.map((column) => [column.key, z.string()])),
  };
  return z.object({
    sql: field(z.string().max(1_048_576), {
      label: "SQL",
      control: "textarea",
      description: "Run one database statement at a time",
      placeholder: "SELECT * FROM table_name LIMIT 100",
      length: "long",
      rowSpan: 6,
    }),
    output: z.array(z.object(resultShape)),
  });
}

export function sqlLayout(
  columns: readonly SQLResultColumn[],
): LayoutDocument {
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
          title: "Output",
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
