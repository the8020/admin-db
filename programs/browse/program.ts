import { kernel } from "@the8020/kernel";
import {
  BACK_EVENT,
  callScreen,
  Model,
  presentPage,
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
      title: `Rows · ${detail.table_id.split("__").at(-1)}`,
      description:
        "Filter and sort the rows below. Leave Where blank to include all rows up to the limit.",
      schema,
      model: screenModel,
      layout,
      header: {
        actions: [{ id: "run", label: "Run query", kind: "primary" }, {
          id: "table",
          label: "Table details",
        }],
      },
    });
    if (event.action === BACK_EVENT) return;
    if (event.action === "table") {
      const { default: tables } = await import("../database/program.ts");
      await presentPage(() => tables(detail.table_id));
    }
    refresh = event.action === "run";
  }
}
