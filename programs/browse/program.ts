import { kernel } from "@the8020/kernel";
import {
  BACK_EVENT,
  callScreen,
  Model,
  sendMessage,
} from "/p/the8020/uui/mod.ts";
import type { ColumnDescriptor } from "/p/the8020/db/codecs.ts";
import { browseTableRows } from "./data.ts";
import {
  tableBrowseLayout,
  tableBrowseModel,
  tableBrowseScreen,
} from "./view.ts";

interface BrowseTableDetail {
  table_id: string;
  descriptor: { columns?: ColumnDescriptor[] };
}

export default async function browseTable(tableName: unknown): Promise<void> {
  if (typeof tableName !== "string" || tableName.length === 0) {
    throw new TypeError("Table browse requires a table name input parameter");
  }
  const detail = await kernel.database.tables.inspect(
    tableName,
  ) as unknown as BrowseTableDetail;
  const columns = detail.descriptor.columns ?? [];
  const schema = tableBrowseScreen(columns);
  const model = tableBrowseModel();
  const layout = tableBrowseLayout(columns);
  let refresh = true;

  const screenModel = new Model(model);
  while (true) {
    if (refresh) {
      try {
        model.rows = await browseTableRows(detail.table_id, columns, model);
      } catch (error) {
        model.rows = [];
        sendMessage(
          error instanceof Error ? error.message : "Table browse failed",
          "error",
        );
      }
    }
    screenModel.data = model;
    const event = await callScreen({
      id: "database-table-browse",
      title: `Browse ${detail.table_id}`,
      description:
        "Rows use the deployed TypeScript table definition. Where and Order by accept one read-only SQL fragment each.",
      schema,
      model: screenModel,
      layout,
      header: {
        actions: [{ id: "run", label: "Run query", kind: "primary" }],
      },
    });
    if (event.action === BACK_EVENT) return;
    refresh = event.action === "run";
  }
}
