import { kernel } from "@the8020/kernel";
import {
  BACK_EVENT,
  callScreen,
  invokeProgram,
  Model,
  presentPage,
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
import advancedLayout from "./layouts/advanced.json" with { type: "json" };
import listLayout from "./layouts/list.json" with { type: "json" };
import {
  ColumnRow,
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

export default async function databaseTables(tableId?: string): Promise<void> {
  if (tableId) return await tableDetail(tableId);
  let screenModel: Model<z.infer<typeof ListScreen>> | undefined;
  while (true) {
    const result = await kernel.database.tables.list() as TableSummary[];
    const screenModelData = { tables: tableRows(result) };
    screenModel ??= new Model(screenModelData);
    screenModel.data = screenModelData;
    const event = await callScreen({
      id: "database-tables",
      title: "Database tables",
      schema: ListScreen,
      model: screenModel,
      layout: listLayout,
      header: {
        actions: [
          { id: "sql", label: "SQL executor" },
          { id: "advanced", label: "Advanced" },
          { id: "refresh", label: "[[icon=refresh]] Refresh" },
        ],
      },
    });
    if (event.action === BACK_EVENT) return;
    if (event.action === "select" && typeof event.value === "string") {
      await tableDetail(event.value);
    }
    if (event.action === "advanced") await presentPage(databaseMaintenance);
    if (event.action === "sql") {
      try {
        await invokeProgram(SQL_EXECUTOR_PROGRAM);
      } catch (error) {
        notifyError(error, "SQL executor failed");
      }
    }
  }
}

async function databaseMaintenance(): Promise<void> {
  const model = new Model({});
  while (true) {
    const event = await callScreen({
      id: "database-maintenance",
      title: "Database maintenance",
      description:
        "Review changes to table definitions, then synchronize the database when ready.",
      schema: z.object({}),
      model,
      actions: [{
        id: "definitions",
        label: "Review definitions",
        kind: "primary",
      }, { id: "sync-all", label: "Synchronize all" }],
    });
    if (event.action === BACK_EVENT) return;
    try {
      if (event.action === "definitions") await definitionList();
      if (event.action === "sync-all") {
        await kernel.database.tables.synchronizeAll();
        sendMessage("Database tables synchronized", "success");
      }
    } catch (error) {
      notifyError(error, "Synchronization failed");
    }
  }
}

async function tableDetail(tableId: string, advanced = false): Promise<void> {
  let screenModel1: Model<z.infer<typeof DetailScreen>> | undefined;
  while (true) {
    const detail = await kernel.database.tables.inspect(
      tableId,
    ) as unknown as TableDetail;
    const retired = detail.columns.filter((column) =>
      column.state === "retired"
    )
      .map((column) => column.column_name);
    const screenModel1Data = tableDetailModel(detail);
    screenModel1 ??= new Model(screenModel1Data);
    screenModel1.data = screenModel1Data;
    const event = await callScreen({
      id: advanced ? "database-table-advanced" : "database-table-detail",
      title: `${
        advanced ? "Advanced ·" : "Table"
      } ${screenModel1Data.tableName}`,
      schema: DetailScreen,
      model: screenModel1,
      layout: advanced ? advancedLayout : detailLayout,
      header: {
        actions: tableDetailActions(detail, advanced),
      },
    });
    if (event.action === BACK_EVENT) return;
    if (event.action === "advanced") {
      await presentPage(() => tableDetail(tableId, true));
    }
    if (event.action === "package" && detail.source_package) {
      const { default: packages } = await import(
        "/p/the8020/admin-core/programs/packages/program.ts"
      );
      await presentPage(() => packages(detail.source_package));
    }
    if (event.action === "sql") {
      const { default: sql } = await import("../sql/program.ts");
      await presentPage(() => sql(detail.table_id));
    }
    if (event.action === "select" && event.controlId === "columns") {
      const column = screenModel1Data.columns.find((column) =>
        column.key === event.value
      );
      if (column) {
        await presentPage(() =>
          callScreen({
            id: "database-column",
            title: `Field ${column.name}`,
            schema: ColumnRow,
            model: new Model(column),
            controls: [
              "logicalType",
              "required",
              "defaultValue",
              "constraints",
              "state",
              "databaseType",
              "databaseDefault",
              "reference",
              ...(column.referenceTable ? ["referenceTable"] : []),
            ].map((bind) => ({ bind })),
          })
        );
      }
    }
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
        await invokeProgram(TABLE_BROWSE_PROGRAM, [detail.table_id]);
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

export function tableDetailActions(
  detail: TableDetail,
  advanced = false,
): ScreenAction[] {
  if (!advanced) {
    return [
      { id: "browse", label: "Browse rows", kind: "primary" },
      { id: "count-rows", label: "Count rows" },
      { id: "sql", label: "SQL" },
      ...(detail.source_package
        ? [{ id: "package", label: "Open package" }]
        : []),
      { id: "advanced", label: "Advanced" },
      { id: "refresh", label: "[[icon=refresh]] Refresh" },
    ];
  }
  const retired = detail.columns.some((column) => column.state === "retired");
  return [
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
  let screenModel2: Model<z.infer<typeof CompareScreen>> | undefined;
  while (true) {
    const detail = await kernel.database.tables.compare(
      tableId,
    ) as unknown as TableDetail;
    const screenModel2Data = tableComparisonModel(detail);
    screenModel2 ??= new Model(screenModel2Data);
    screenModel2.data = screenModel2Data;
    const event = await callScreen({
      id: "database-table-comparison",
      title: `Compare ${tableId}`,
      schema: CompareScreen,
      model: screenModel2,
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
  const screenModel3 = new Model(model);
  while (true) {
    screenModel3.data = model;
    const event = await callScreen({
      id: "database-trim-confirmation",
      title: "Confirm destructive database trim",
      schema: ConfirmScreen,
      model: screenModel3,
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
  let screenModel4: Model<z.infer<typeof DefinitionsScreen>> | undefined;
  while (true) {
    const definitions = await kernel.database.tables.definitions();
    const screenModel4Data = {
      definitions: definitions.map((definition) => ({
        navigation: definition.table_id,
        id: definition.table_id,
        package: definition.source_package,
        state: stateLabel(definition.synchronization_state),
        commit: definition.source_commit,
        error: definition.error ?? "",
      })),
    };
    screenModel4 ??= new Model(screenModel4Data);
    screenModel4.data = screenModel4Data;
    const event = await callScreen({
      id: "database-table-definitions",
      title: "Activated definition changes",
      description: "Select a table to review its changes before applying them.",
      schema: DefinitionsScreen,
      model: screenModel4,
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
