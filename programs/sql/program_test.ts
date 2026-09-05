import { assertEquals, assertThrows } from "@std/assert";
import {
  kernelDatabaseBackendSymbol,
  kernelInvokeSymbol,
} from "@the8020/kernel";
import {
  BACK_EVENT,
  type LayoutDocument,
  type ScreenEventMessage,
  type ScreenSnapshot,
  UUI_PROTOCOL_VERSION,
  type UUIClientMessage,
  type UUIWorkerOutbound,
} from "/p/the8020/uui/mod.ts";
import { bindSession, type SessionChannel } from "/p/the8020/uui/internal.ts";
import { presentSQLResult, sqlStatementIntent } from "./data.ts";
import sqlExecutor from "./program.ts";

const sqliteIntent = (source: string) => sqlStatementIntent(source, "sqlite");

Deno.test("SQL intent distinguishes result and execution statements", () => {
  assertEquals(sqliteIntent("SELECT COUNT(*) FROM orders"), {
    statement: "SELECT COUNT(*) FROM orders",
    returnRows: true,
    returnInsertId: false,
  });
  assertEquals(sqliteIntent("UPDATE orders SET active = false"), {
    statement: "UPDATE orders SET active = false",
    returnRows: false,
    returnInsertId: false,
  });
  assertEquals(sqliteIntent("INSERT INTO orders DEFAULT VALUES"), {
    statement: "INSERT INTO orders DEFAULT VALUES",
    returnRows: false,
    returnInsertId: true,
  });
  assertEquals(
    sqliteIntent(
      "WITH changed AS (SELECT 1) UPDATE orders SET active = true RETURNING id",
    ).returnRows,
    true,
  );
  assertEquals(
    sqliteIntent("WITH recent AS (SELECT 1) SELECT * FROM recent")
      .returnRows,
    true,
  );
  assertEquals(sqlStatementIntent("CALL report_totals()", "postgresql"), {
    statement: "CALL report_totals()",
    returnRows: true,
    returnInsertId: false,
  });
});

Deno.test("SQL intent permits quoted semicolons but rejects multiple statements", () => {
  assertEquals(
    sqliteIntent("SELECT ';' AS value; -- one trailing terminator")
      .returnRows,
    true,
  );
  assertEquals(
    sqlStatementIntent(
      "CREATE FUNCTION example() RETURNS void AS $$ BEGIN PERFORM 1; END $$ LANGUAGE plpgsql",
      "postgresql",
    ).returnRows,
    false,
  );
  assertThrows(
    () => sqliteIntent("SELECT 1; DELETE FROM orders"),
    TypeError,
    "one SQL statement",
  );
  assertThrows(
    () => sqliteIntent("BEGIN"),
    TypeError,
    "Transaction control is unavailable",
  );
});

Deno.test("SQL intent honors backend-specific quoting and comments", () => {
  const dollarQuoted = "SELECT $body$; DELETE FROM orders$body$";
  assertEquals(sqlStatementIntent(dollarQuoted, "postgresql").returnRows, true);
  assertThrows(
    () => sqlStatementIntent(dollarQuoted, "sqlite"),
    TypeError,
    "one SQL statement",
  );

  const nestedComment = "SELECT 1 /* outer /* inner */ ; DELETE FROM orders */";
  assertEquals(
    sqlStatementIntent(nestedComment, "postgresql").returnRows,
    true,
  );
  assertThrows(
    () => sqlStatementIntent(nestedComment, "sqlite"),
    TypeError,
    "one SQL statement",
  );
});

Deno.test("SQL row output preserves arbitrary and duplicate result columns", () => {
  assertEquals(
    presentSQLResult({
      columns: ["count", "message", "count", "payload", "nothing", "empty"],
      rows: [[
        { type: "bigint", value: "9007199254740993" },
        "hello",
        2,
        { type: "json", value: { ready: true } },
        null,
        "",
      ]],
    }),
    {
      columns: [
        { key: "value_0", heading: "count" },
        { key: "value_1", heading: "message" },
        { key: "value_2", heading: "count (2)" },
        { key: "value_3", heading: "payload" },
        { key: "value_4", heading: "nothing" },
        { key: "value_5", heading: "empty" },
      ],
      rows: [{
        __rowKey: "0",
        value_0: "9007199254740993",
        value_1: "hello",
        value_2: "2",
        value_3: '{"ready":true}',
        value_4: "NULL",
        value_5: '""',
      }],
    },
  );
});

Deno.test("SQL execution output summarizes mutation metadata", () => {
  assertEquals(
    presentSQLResult({
      columns: [],
      rows: [],
      affected_rows: { type: "bigint", value: "3" },
      insert_id: { type: "bigint", value: "17" },
    }),
    {
      columns: [
        { key: "result", heading: "Result" },
        { key: "value", heading: "Value" },
      ],
      rows: [
        { __rowKey: "0", result: "Rows affected", value: "3" },
        { __rowKey: "1", result: "Insert ID", value: "17" },
      ],
    },
  );
});

Deno.test("SQL program reshapes output and reports errors as UUI messages", async () => {
  const calls: Record<string, unknown>[] = [];
  const runtime = globalThis as unknown as Record<symbol, unknown>;
  const previousInvoke = runtime[kernelInvokeSymbol];
  const previousBackend = runtime[kernelDatabaseBackendSymbol];
  runtime[kernelDatabaseBackendSymbol] = "sqlite";
  runtime[kernelInvokeSymbol] = (
    operation: string,
    input: Record<string, unknown>,
  ) => {
    if (operation !== "database.execute") {
      return Promise.reject(new Error(`unexpected operation ${operation}`));
    }
    calls.push(input);
    const statement = String(input.statement);
    if (statement.startsWith("SELECT")) {
      return Promise.resolve({ columns: ["answer"], rows: [[42]] });
    }
    if (statement.startsWith("UPDATE")) {
      return Promise.resolve({
        columns: [],
        rows: [],
        affected_rows: { type: "bigint", value: "2" },
      });
    }
    return Promise.reject(new Error("syntax error near BROKEN"));
  };

  const channel = new ProgramChannel();
  const unbind = bindSession(channel);
  try {
    const running = sqlExecutor();
    const initial = await channel.screen();
    assertEquals(initial.screen.id, "database-sql-executor");
    assertEquals(
      initial.screen.controls.find((control) => control.bind === "sql")
        ?.control,
      "textarea",
    );

    channel.event(initial, "run", [{ bind: "sql", value: "SELECT 42" }]);
    const selected = await channel.screen();
    assertEquals(calls[0]?.return_rows, true);
    assertEquals(selected.screen.model, {
      sql: "SELECT 42",
      output: [],
    });
    assertEquals(selected.screen.lists[0]!.rows, [{
      __rowKey: "0",
      value_0: "42",
    }]);
    const selectedLayout = selected.screen.layout as LayoutDocument;
    assertEquals(
      selectedLayout.root.children?.[1]?.headings,
      { value_0: "answer" },
    );

    channel.event(selected, "run", [{
      bind: "sql",
      value: "UPDATE orders SET active = false",
    }]);
    const updated = await channel.screen();
    assertEquals(calls[1]?.return_rows, false);
    assertEquals(updated.screen.model, {
      sql: "UPDATE orders SET active = false",
      output: [],
    });
    assertEquals(updated.screen.lists[0]!.rows, [{
      __rowKey: "0",
      result: "Rows affected",
      value: "2",
    }]);

    channel.event(updated, "run", [{ bind: "sql", value: "BROKEN" }]);
    assertEquals(await channel.message(), {
      type: "notification.show",
      level: "error",
      message: "syntax error near BROKEN",
    });
    const failed = await channel.screen();
    assertEquals(failed.screen.model, { sql: "BROKEN", output: [] });
    channel.event(failed, BACK_EVENT);
    await running;
  } finally {
    unbind();
    if (previousInvoke === undefined) delete runtime[kernelInvokeSymbol];
    else runtime[kernelInvokeSymbol] = previousInvoke;
    if (previousBackend === undefined) {
      delete runtime[kernelDatabaseBackendSymbol];
    } else runtime[kernelDatabaseBackendSymbol] = previousBackend;
  }
});

interface WorkerScreenShow {
  surfaceId: string;
  screen: ScreenSnapshot;
}
type WorkerNotification = Extract<
  UUIWorkerOutbound,
  { type: "notification.show" }
>;

class ProgramChannel implements SessionChannel {
  readonly sessionId = "admin-db-sql-program-test";
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

  async message(): Promise<WorkerNotification> {
    while (true) {
      const message = await this.#nextServer();
      if (message.type === "notification.show") return message;
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
      eventType: action === BACK_EVENT ? BACK_EVENT : "action",
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
