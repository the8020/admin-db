import {
  BACK_EVENT,
  callScreen,
  Model,
  sendMessage,
} from "/p/the8020/uui/mod.ts";
import { executeSQL, type SQLResultColumn } from "./data.ts";
import { sqlLayout, sqlScreen } from "./view.ts";
import { quoteIdentifier } from "../browse/data.ts";

export default async function sqlExecutor(table = ""): Promise<void> {
  const model = {
    table,
    sql: table ? `SELECT * FROM ${quoteIdentifier(table)} LIMIT 100` : "",
    output: [] as Record<string, string>[],
  };
  let columns: SQLResultColumn[] = [];

  const screenModel = new Model(model);
  while (true) {
    screenModel.data = model;
    const event = await callScreen({
      id: "database-sql-executor",
      title: "SQL executor",
      description:
        "Run one SQL statement directly against the system database. Statements may change data or schema; output shows rows or an execution summary.",
      schema: sqlScreen(columns),
      model: screenModel,
      layout: sqlLayout(columns),
      header: {
        controls: [{ bind: "table", label: "Table reference", length: "long" }],
        actions: [
          { id: "run", label: "Run SQL", kind: "primary" },
          ...(model.table ? [{ id: "select", label: "New SELECT" }] : []),
        ],
      },
    });
    if (event.action === BACK_EVENT) return;
    if (event.action === "select" && model.table) {
      model.sql = `SELECT * FROM ${quoteIdentifier(model.table)} LIMIT 100`;
      continue;
    }
    if (event.action !== "run") continue;
    try {
      const result = await executeSQL(model.sql);
      columns = result.columns;
      model.output = result.rows;
    } catch (error) {
      columns = [];
      model.output = [];
      sendMessage(
        error instanceof Error ? error.message : "SQL execution failed",
        "error",
      );
    }
  }
}
