import { assertEquals, assertThrows } from "@std/assert";
import detailLayout from "./layouts/detail.json" with { type: "json" };
import { requireDestructiveConfirmation } from "./program.ts";
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
    id: "acme__orders__orders",
    package: "acme/orders",
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
      { name: "note", change: "New" },
      { name: "status", change: "Changed" },
      { name: "total", change: "Removed" },
    ],
  );
  assertEquals(model.differences[0]?.issue, detail.differences[0]);
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
