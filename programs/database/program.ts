import { kernel } from "@the8020/kernel";
import {
  BACK_EVENT,
  callScreen,
  invokeProgram,
  type ScreenAction,
  sendMessage,
  z,
} from "/p/the8020/uui/mod.ts";
import { countTableRows } from "../browse/data.ts";
import compareLayout from "./layouts/compare.json" with { type: "json" };
import confirmLayout from "./layouts/confirm.json" with { type: "json" };
import definitionsLayout from "./layouts/definitions.json" with {
  type: "json",
};
import detailLayout from "./layouts/detail.json" with { type: "json" };
import listLayout from "./layouts/list.json" with { type: "json" };
import {
  CompareScreen,
  ConfirmScreen,
  DefinitionsScreen,
  DetailScreen,
  ListScreen,
  stateLabel,
  tableComparisonModel,
  type TableDetail,
  tableDetailModel,
  tableRows,
  type TableSummary,
} from "./view.ts";

export { tableAlert } from "./view.ts";

export const TABLE_BROWSE_PROGRAM = "the8020/admin-db/browse";
export const SQL_EXECUTOR_PROGRAM = "the8020/admin-db/sql";

export default async function databaseTables(): Promise<void> {
  while (true) {
    const result = await kernel.database.tables.list() as TableSummary[];
    const event = await callScreen({
      id: "database-tables",
      title: "Database tables",
      schema: ListScreen,
      model: { tables: tableRows(result) },
      layout: listLayout,
      header: {
        actions: [
          { id: "sync-all", label: "Synchronize all", kind: "primary" },
          { id: "definitions", label: "Scan definitions" },
          { id: "sql", label: "SQL executor" },
          { id: "refresh", label: "[[icon=refresh]] Refresh" },
        ],
      },
    });
    if (event.action === BACK_EVENT) return;
    if (event.action === "select" && typeof event.value === "string") {
      await tableDetail(event.value);
    }
    if (event.action === "definitions") await definitionList();
    if (event.action === "sql") {
      try {
        await invokeProgram(SQL_EXECUTOR_PROGRAM);
      } catch (error) {
        notifyError(error, "SQL executor failed");
      }
    }
    if (event.action === "sync-all") {
      try {
        await kernel.database.tables.synchronizeAll();
        sendMessage("Database tables synchronized", "success");
      } catch (error) {
        notifyError(error, "Synchronization failed");
      }
    }
  }
}

async function tableDetail(tableId: string): Promise<void> {
  while (true) {
    const detail = await kernel.database.tables.inspect(
      tableId,
    ) as unknown as TableDetail;
    const retired = detail.columns.filter((column) =>
      column.state === "retired"
    )
      .map((column) => column.column_name);
    const event = await callScreen({
      id: "database-table-detail",
      title: detail.table_id,
      schema: DetailScreen,
      model: tableDetailModel(detail),
      layout: detailLayout,
      header: {
        actions: tableDetailActions(detail),
      },
    });
    if (event.action === BACK_EVENT) return;
    if (event.action === "compare") await comparisonDetail(tableId);
    try {
      if (event.action === "count-rows") {
        const count = await countTableRows(detail.table_id);
        sendMessage(
          `Table contains ${count.toString()} ${count === 1n ? "row" : "rows"}`,
          "info",
        );
      }
      if (event.action === "browse") {
        await invokeProgram(TABLE_BROWSE_PROGRAM, detail.table_id);
      }
      if (event.action === "sync") {
        await kernel.database.tables.synchronize(tableId);
        sendMessage("Table synchronized", "success");
      }
      if (
        event.action === "trim-columns" &&
        await confirmTrim("Retired fields", retired.join(", "))
      ) {
        await kernel.database.tables.trim({
          tableId,
          columns: retired,
          confirm: true,
        });
        sendMessage("Retired fields permanently removed", "success");
      }
      if (
        event.action === "trim-table" &&
        await confirmTrim("Retired table", tableId)
      ) {
        await kernel.database.tables.trim({
          tableId,
          dropTable: true,
          confirm: true,
        });
        sendMessage("Retired table permanently removed", "success");
        return;
      }
    } catch (error) {
      notifyError(error, "Database operation failed");
    }
  }
}

export function tableDetailActions(detail: TableDetail): ScreenAction[] {
  const retired = detail.columns.some((column) => column.state === "retired");
  return [
    { id: "count-rows", label: "Count rows" },
    { id: "browse", label: "Browse" },
    ...(detail.source_package
      ? [
        { id: "sync", label: "Synchronize", kind: "primary" as const },
        { id: "compare", label: "Compare activated definition" },
      ]
      : []),
    { id: "refresh", label: "[[icon=refresh]] Refresh" },
    ...(retired
      ? [{
        id: "trim-columns",
        label: "Trim retired fields",
        kind: "danger" as const,
      }]
      : []),
    ...(detail.state === "retired"
      ? [{
        id: "trim-table",
        label: "Trim table",
        kind: "danger" as const,
      }]
      : []),
  ];
}

async function comparisonDetail(tableId: string): Promise<void> {
  while (true) {
    const detail = await kernel.database.tables.compare(
      tableId,
    ) as unknown as TableDetail;
    const event = await callScreen({
      id: "database-table-comparison",
      title: `Compare ${tableId}`,
      schema: CompareScreen,
      model: tableComparisonModel(detail),
      layout: compareLayout,
      header: {
        actions: [
          ...(
            detail.definition_state !== "error" &&
              detail.definition_state !== "missing"
              ? [{ id: "sync", label: "Synchronize", kind: "primary" as const }]
              : []
          ),
          { id: "refresh", label: "[[icon=refresh]] Refresh" },
        ],
      },
    });
    if (event.action === BACK_EVENT) return;
    if (event.action === "sync") {
      try {
        await kernel.database.tables.synchronize(tableId);
        sendMessage("Table synchronized", "success");
      } catch (error) {
        notifyError(error, "Synchronization failed");
      }
    }
  }
}

async function confirmTrim(
  operation: string,
  affected: string,
): Promise<boolean> {
  const model: z.infer<typeof ConfirmScreen> = {
    operation,
    affected,
    warning: "This permanently deletes database structure and stored data.",
    confirmed: false,
  };
  while (true) {
    const event = await callScreen({
      id: "database-trim-confirmation",
      title: "Confirm destructive database trim",
      schema: ConfirmScreen,
      model,
      layout: confirmLayout,
      header: {
        actions: [{ id: "trim", label: "Permanently trim", kind: "danger" }],
      },
    });
    if (event.action === BACK_EVENT) return false;
    if (event.action === "trim") {
      try {
        requireDestructiveConfirmation(model.confirmed);
        return true;
      } catch (error) {
        notifyError(error, "Confirmation required");
      }
    }
  }
}

export function requireDestructiveConfirmation(confirmed: boolean): void {
  if (!confirmed) {
    throw new Error("Confirm permanent deletion before trimming database data");
  }
}

async function definitionList(): Promise<void> {
  while (true) {
    const definitions = await kernel.database.tables.definitions();
    const event = await callScreen({
      id: "database-table-definitions",
      title: "Activated definition changes",
      description:
        "This scan evaluates activated TypeScript definitions. Select a table to compare it before synchronizing.",
      schema: DefinitionsScreen,
      model: {
        definitions: definitions.map((definition) => ({
          navigation: definition.table_id,
          id: definition.table_id,
          package: definition.source_package,
          state: stateLabel(definition.synchronization_state),
          commit: definition.source_commit,
          error: definition.error ?? "",
        })),
      },
      layout: definitionsLayout,
      header: {
        actions: [{ id: "refresh", label: "[[icon=refresh]] Refresh" }],
      },
    });
    if (event.action === BACK_EVENT) return;
    if (event.action === "select" && typeof event.value === "string") {
      await comparisonDetail(event.value);
    }
  }
}

function notifyError(error: unknown, fallback: string): void {
  sendMessage(error instanceof Error ? error.message : fallback, "error");
}
