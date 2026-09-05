import { assertEquals, assertThrows } from "@std/assert";
import type { ColumnDescriptor } from "/p/the8020/db/codecs.ts";
import { kernelInvokeSymbol } from "@the8020/kernel";
import type {
  ScreenEventMessage,
  ScreenSnapshot,
  UUIClientMessage,
  UUIWorkerOutbound,
} from "/p/the8020/uui/mod.ts";
import { UUI_PROTOCOL_VERSION } from "/p/the8020/uui/mod.ts";
import { bindSession, type SessionChannel } from "/p/the8020/uui/internal.ts";
import {
  countTableRows,
  rowCountFromResult,
  tableBrowseStatement,
  tableRowsFromResult,
} from "../browse/data.ts";
import {
  tableBrowseLayout,
  tableBrowseModel,
  tableBrowseScreen,
} from "../browse/view.ts";
import browseTable from "../browse/program.ts";
import detailLayout from "./layouts/detail.json" with { type: "json" };
import {
  requireDestructiveConfirmation,
  TABLE_BROWSE_PROGRAM,
  tableDetailActions,
} from "./program.ts";
import {
  tableComparisonModel,
  type TableDetail,
  tableDetailModel,
  tableRows,
} from "./view.ts";

Deno.test("database table list contains only useful human-facing state", () => {
  const [row] = tableRows([{
    table_id: "acme__orders__orders",
    source_package: "acme/orders",
    source_commit: "commit",
    source_module: "/workspace/packages/acme/orders/tables/orders.ts",
    state: "active",
    synchronization_state: "drift",
    descriptor_hash: "hash",
    active_columns: 4,
    retired_columns: 2,
    error: "physical table is missing",
  }]);
  assertEquals(row, {
    navigation: "acme__orders__orders",
    package: "acme/orders",
    table: "orders",
    state: "Active",
    synchronization: "Drift",
    activeColumns: 4,
    retiredColumns: 2,
    synchronizedAt: "—",
    alert: "physical table is missing; 2 retired fields",
  });
});

Deno.test("table detail presents fields, indexes, checks, and differences as rows", () => {
  const model = tableDetailModel(tableFixture());
  assertEquals(model.package, "acme/orders");
  assertEquals(model.tableName, "orders");
  assertEquals(model.physicalTable, "acme__orders__orders");
  assertEquals(model.tableState, "Active");
  assertEquals(model.schemaState, "Synchronized");
  assertEquals(model.attention, "None");
  assertEquals(model.columns, [
    {
      key: "id",
      name: "id",
      state: "Active",
      logicalType: "integer",
      databaseType: "INTEGER",
      required: "Yes",
      defaultValue: "—",
      databaseDefault: "—",
      constraints: "Primary key, Generated",
      reference: "—",
    },
    {
      key: "status",
      name: "status",
      state: "Active",
      logicalType: "enum (confirmed, draft)",
      databaseType: "TEXT",
      required: "Yes",
      defaultValue: "“draft”",
      databaseDefault: "'draft'",
      constraints: "—",
      reference: "—",
    },
    {
      key: "total",
      name: "total",
      state: "Active",
      logicalType: "decimal(18, 2)",
      databaseType: "INTEGER",
      required: "Yes",
      defaultValue: "—",
      databaseDefault: "—",
      constraints: "—",
      reference: "—",
    },
  ]);
  assertEquals(model.indexes, [{
    key: "orders_status",
    name: "orders_status",
    state: "Active",
    columns: "status",
    unique: "No",
  }]);
  assertEquals(model.checks, [{ key: "0", expression: "total >= 0" }]);
  assertEquals(model.differences, [{
    key: "ok",
    status: "OK",
    issue: "No differences detected",
  }]);
});

Deno.test("activated comparison makes changed fields readable", () => {
  const detail = tableFixture();
  detail.current_descriptor = {
    columns: [
      detail.descriptor.columns![0]!,
      { ...detail.descriptor.columns![1]!, nullable: true },
      {
        name: "note",
        logical_type: "text",
        nullable: true,
        generated: false,
        primary_key: false,
        unique: false,
      },
    ],
    indexes: [],
  };
  detail.definition_state = "changed";
  detail.current_source_commit = "new-commit";
  detail.differences = [
    "activated definition differs from deployed descriptor",
  ];
  const model = tableComparisonModel(detail);
  assertEquals(model.definitionState, "Changed");
  assertEquals(model.activatedCommit, "new-commit");
  assertEquals(
    model.columns.map(({ name, change }) => ({ name, change })),
    [
      { name: "id", change: "Same" },
      { name: "status", change: "Changed" },
      { name: "note", change: "New" },
      { name: "total", change: "Removed" },
    ],
  );
  assertEquals(model.differences[0]?.issue, detail.differences[0]);
});

Deno.test("fields preserve table-definition order instead of sorting by name", () => {
  const detail = tableFixture();
  detail.descriptor.columns = [
    detail.descriptor.columns![2]!,
    detail.descriptor.columns![0]!,
    detail.descriptor.columns![1]!,
  ];
  assertEquals(
    tableDetailModel(detail).columns.map((column) => column.name),
    ["total", "id", "status"],
  );
});

Deno.test("activated evaluation failures remain visible and are not presented as removals", () => {
  const detail = tableFixture();
  detail.definition_state = "error";
  detail.error = 'evaluate database tables: Worker "wrk-stale" not found';
  detail.differences = [`activated definition is invalid: ${detail.error}`];
  const model = tableComparisonModel(detail);
  assertEquals(model.attention, detail.error);
  assertEquals(
    model.columns.every((column) => column.change === "Unavailable"),
    true,
  );
  assertEquals(
    model.differences[0]?.issue,
    `activated definition is invalid: ${detail.error}`,
  );
});

Deno.test("database detail layout contains no JSON descriptor textareas", () => {
  const serialized = JSON.stringify(detailLayout);
  assertEquals(serialized.includes("textarea"), false);
  for (const obsolete of ["logical", "current", "physical", "catalog"]) {
    assertEquals(serialized.includes(`\"${obsolete}\"`), false);
  }
});

Deno.test("destructive trim requires deliberate confirmation", () => {
  assertThrows(
    () => requireDestructiveConfirmation(false),
    Error,
    "Confirm permanent deletion",
  );
  requireDestructiveConfirmation(true);
});

Deno.test("table detail exposes row count and parameterized browse actions", () => {
  assertEquals(
    tableDetailActions(tableFixture()).slice(0, 2).map((action) => ({
      id: action.id,
      label: action.label,
    })),
    [
      { id: "count-rows", label: "Count rows" },
      { id: "browse", label: "Browse" },
    ],
  );
  assertEquals(TABLE_BROWSE_PROGRAM, "the8020/admin-db/browse");
});

Deno.test("browse builds one bounded read-only table query", () => {
  const columns = browseColumns().slice(0, 2);
  assertEquals(
    tableBrowseStatement("acme__orders__orders", columns, {
      limit: 25,
      where: " enabled = 1 ",
      orderBy: "id DESC",
    }),
    'SELECT "id", "enabled" FROM "acme__orders__orders" WHERE enabled = 1 ORDER BY id DESC LIMIT 25',
  );
  assertThrows(
    () =>
      tableBrowseStatement("acme__orders__orders", columns, {
        limit: 25,
        where: "1 = 1; DELETE FROM anything",
        orderBy: "",
      }),
    TypeError,
    "one SQL fragment",
  );
  assertThrows(
    () =>
      tableBrowseStatement("acme__orders__orders", columns, {
        limit: 10_001,
        where: "",
        orderBy: "",
      }),
    TypeError,
    "1 through 10000",
  );
});

Deno.test("browse rows use logical types from the deployed table definition", () => {
  const columns = browseColumns();
  const rows = tableRowsFromResult({
    columns: columns.map((column) => column.name),
    rows: [[
      7,
      1,
      { type: "bigint", value: "12345" },
      "2026-09-04T01:02:03.000Z",
      { type: "bytes", value: "AP4=" },
      '{"ready":true}',
    ]],
  }, columns);
  assertEquals(rows, [{
    id: 7,
    enabled: true,
    total: "123.45",
    createdAt: "2026-09-04T01:02:03.000Z",
    receipt: "AP4=",
    metadata: { ready: true },
  }]);

  const model = { ...tableBrowseModel(), rows };
  assertEquals(tableBrowseScreen(columns).safeParse(model).success, true);
  assertEquals(
    tableBrowseScreen(columns).safeParse({
      ...model,
      rows: [{ ...rows[0], enabled: "true" }],
    }).success,
    false,
  );
  assertEquals(
    tableBrowseLayout(columns).root.children?.[1]?.headings?.total,
    "total (decimal(18, 2))",
  );
});

Deno.test("row count supports lossless kernel integer results", () => {
  assertEquals(
    rowCountFromResult({
      columns: ["row_count"],
      rows: [[{ type: "bigint", value: "9007199254740993" }]],
    }),
    9007199254740993n,
  );
});

Deno.test("browse program receives a table name and reruns changed filters", async () => {
  const tableName = "acme__orders__orders";
  const columns = browseColumns().slice(0, 2);
  const statements: string[] = [];
  const runtime = globalThis as unknown as Record<symbol, unknown>;
  const previousInvoke = runtime[kernelInvokeSymbol];
  runtime[kernelInvokeSymbol] = (
    operation: string,
    input: Record<string, unknown>,
  ) => {
    if (operation === "runtime.operation") {
      assertEquals(input, {
        operation: "database.table.inspect",
        input: { table_id: tableName },
      });
      return Promise.resolve({
        success: true,
        result: {
          table: { table_id: tableName, descriptor: { columns } },
        },
      });
    }
    if (operation === "database.transaction.begin") {
      assertEquals(input, { settings: { readOnly: true } });
      return Promise.resolve({ transaction: "browse-transaction" });
    }
    if (operation === "database.transaction.rollback") {
      assertEquals(input, { transaction: "browse-transaction" });
      return Promise.resolve(undefined);
    }
    if (operation === "database.execute") {
      statements.push(String(input.statement));
      assertEquals(input.return_rows, true);
      if (String(input.statement).startsWith("SELECT COUNT(*)")) {
        assertEquals(input.transaction, undefined);
        return Promise.resolve({
          columns: ["row_count"],
          rows: [[4]],
        });
      }
      assertEquals(input.transaction, "browse-transaction");
      return Promise.resolve({
        columns: columns.map((column) => column.name),
        rows: [[4, 1]],
      });
    }
    return Promise.reject(new Error(`unexpected operation ${operation}`));
  };

  const channel = new ProgramChannel();
  const unbind = bindSession(channel);
  try {
    const running = browseTable(tableName);
    const initial = await channel.screen();
    assertEquals(initial.screen.id, "database-table-browse");
    assertEquals(initial.screen.model, {
      limit: 100,
      where: "",
      orderBy: "",
      rows: [],
    });
    assertEquals(
      initial.screen.lists.find((list) => list.bind === "rows")!.rows,
      [{ id: 4, enabled: true }],
    );
    assertEquals(
      statements[0],
      'SELECT "id", "enabled" FROM "acme__orders__orders" LIMIT 100',
    );

    channel.event(initial, "run", [
      { bind: "limit", value: 5 },
      { bind: "where", value: "enabled = 1" },
      { bind: "orderBy", value: "id DESC" },
    ]);
    const filtered = await channel.screen();
    assertEquals(
      statements[1],
      'SELECT "id", "enabled" FROM "acme__orders__orders" WHERE enabled = 1 ORDER BY id DESC LIMIT 5',
    );
    channel.event(filtered, "back");
    await running;
    assertEquals(await countTableRows(tableName), 4n);
  } finally {
    unbind();
    if (previousInvoke === undefined) delete runtime[kernelInvokeSymbol];
    else runtime[kernelInvokeSymbol] = previousInvoke;
  }
});

function browseColumns(): ColumnDescriptor[] {
  const common = {
    nullable: false,
    generated: false,
    primary_key: false,
    unique: false,
  };
  return [
    { ...common, name: "id", logical_type: "integer", primary_key: true },
    { ...common, name: "enabled", logical_type: "boolean" },
    {
      ...common,
      name: "total",
      logical_type: "decimal",
      precision: 18,
      scale: 2,
    },
    { ...common, name: "createdAt", logical_type: "datetime" },
    { ...common, name: "receipt", logical_type: "bytes" },
    { ...common, name: "metadata", logical_type: "json" },
  ];
}

function tableFixture(): TableDetail {
  const columns = [
    {
      name: "id",
      logical_type: "integer",
      nullable: false,
      generated: true,
      primary_key: true,
      unique: false,
    },
    {
      name: "status",
      logical_type: "enum",
      enum_values: ["confirmed", "draft"],
      nullable: false,
      default: { kind: "literal", value: "draft" },
      generated: false,
      primary_key: false,
      unique: false,
    },
    {
      name: "total",
      logical_type: "decimal",
      precision: 18,
      scale: 2,
      nullable: false,
      generated: false,
      primary_key: false,
      unique: false,
    },
  ];
  return {
    table_id: "acme__orders__orders",
    source_package: "acme/orders",
    source_commit: "deployed-commit",
    source_module: "/workspace/packages/acme/orders/tables/orders.ts",
    state: "active",
    synchronization_state: "synchronized",
    descriptor_hash: "hash",
    synchronized_at: "2026-09-03T00:00:00Z",
    active_columns: 3,
    retired_columns: 0,
    descriptor: {
      columns,
      indexes: [{ name: "orders_status", columns: ["status"], unique: false }],
    },
    columns: columns.map((column) => ({
      column_name: column.name,
      logical_type: column.logical_type,
      definition_json: JSON.stringify(column),
      state: "active",
    })),
    physical_columns: [
      {
        name: "id",
        type: "INTEGER",
        nullable: false,
        generated: true,
        primary_key: true,
      },
      {
        name: "status",
        type: "TEXT",
        nullable: false,
        default: "'draft'",
        generated: false,
        primary_key: false,
      },
      {
        name: "total",
        type: "INTEGER",
        nullable: false,
        generated: false,
        primary_key: false,
      },
    ],
    physical_indexes: [
      { name: "orders_status", columns: ["status"], unique: false },
    ],
    physical_checks: ["total >= 0"],
    differences: [],
  };
}

interface WorkerScreenShow {
  surfaceId: string;
  screen: ScreenSnapshot;
}

class ProgramChannel implements SessionChannel {
  readonly sessionId = "admin-db-program-test";
  #client: UUIClientMessage[] = [];
  #clientWaiters: Array<(message: UUIClientMessage) => void> = [];
  #server: UUIWorkerOutbound[] = [];
  #serverWaiters: Array<(message: UUIWorkerOutbound) => void> = [];
  #clientSequence = 0;

  send(message: UUIWorkerOutbound): void {
    const waiter = this.#serverWaiters.shift();
    if (waiter === undefined) this.#server.push(message);
    else waiter(message);
  }

  receive(): Promise<UUIClientMessage> {
    const message = this.#client.shift();
    if (message !== undefined) return Promise.resolve(message);
    return new Promise((resolve) => this.#clientWaiters.push(resolve));
  }

  async screen(): Promise<WorkerScreenShow> {
    while (true) {
      const message = await this.#nextServer();
      if (
        message.type === "presentation.show" &&
        message.presentation.activeSurfaceId !== null
      ) {
        const surface = message.presentation.surfaces.at(-1)!;
        return { surfaceId: surface.surfaceId, screen: surface.screen };
      }
    }
  }

  event(
    screen: WorkerScreenShow,
    action: string,
    changes: ScreenEventMessage["changes"] = [],
  ): void {
    const message: ScreenEventMessage = {
      type: "screen.event",
      protocol: UUI_PROTOCOL_VERSION,
      clientSequence: ++this.#clientSequence,
      sessionId: this.sessionId,
      surfaceId: screen.surfaceId,
      screenId: screen.screen.id,
      screenRevision: screen.screen.revision,
      instanceId: screen.screen.state.instanceId,
      screenState: {
        version: screen.screen.state.version,
        scroll: screen.screen.state.scroll,
        elements: {},
      },
      action,
      eventType: action === "back" ? "back" : "action",
      changes,
    };
    const waiter = this.#clientWaiters.shift();
    if (waiter === undefined) this.#client.push(message);
    else waiter(message);
  }

  #nextServer(): Promise<UUIWorkerOutbound> {
    const message = this.#server.shift();
    if (message !== undefined) return Promise.resolve(message);
    return new Promise((resolve) => this.#serverWaiters.push(resolve));
  }
}
