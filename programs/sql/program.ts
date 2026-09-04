import {
  BACK_EVENT,
  callScreen,
  sendMessage,
} from "@packages/the8020/uui/mod.ts";
import { executeSQL, type SQLResultColumn } from "./data.ts";
import { sqlLayout, sqlScreen } from "./view.ts";

export default async function sqlExecutor(): Promise<void> {
  const model = {
    sql: "",
    output: [] as Record<string, string>[],
  };
  let columns: SQLResultColumn[] = [];

  while (true) {
    const event = await callScreen({
      id: "database-sql-executor",
      title: "SQL executor",
      description:
        "Run one SQL statement directly against the system database. Statements may change data or schema; output shows rows or an execution summary.",
      schema: sqlScreen(columns),
      model,
      layout: sqlLayout(columns),
      header: {
        actions: [{ id: "run", label: "Run SQL", kind: "primary" }],
      },
    });
    if (event.action === BACK_EVENT) return;
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
