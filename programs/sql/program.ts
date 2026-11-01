import { msg } from "/p/the8020/admin-db/i18n/messages.ts";
import { allowed } from "../../src/authorized.ts";
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
  // Arbitrary statements can read or change any table.
  if (!await allowed("the8020.admin-db.sql.execute", "")) return;
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
      title: msg("program.sql_executor"),
      description: msg("program.run_one_sql_statement_directly_against_the"),
      schema: sqlScreen(columns),
      model: screenModel,
      layout: sqlLayout(columns),
      header: {
        controls: [{
          bind: "table",
          label: msg("program.table_reference"),
          length: "long",
        }],
        actions: [
          { id: "run", label: msg("program.run_sql"), kind: "primary" },
          ...(model.table
            ? [{ id: "select", label: msg("program.new_select") }]
            : []),
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
