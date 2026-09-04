import { field, z } from "/p/the8020/uui/mod.ts";

export interface TableSummary {
  table_id: string;
  source_package: string;
  source_commit: string;
  source_module: string;
  state: string;
  synchronization_state: string;
  descriptor_hash: string;
  synchronized_at?: string;
  active_columns: number;
  retired_columns: number;
  error?: string;
}

interface DefaultDescriptor {
  kind: string;
  value?: unknown;
}

interface ReferenceDescriptor {
  table: string;
  column: string;
}

interface ColumnDescriptor {
  name: string;
  logical_type: string;
  precision?: number;
  scale?: number;
  enum_values?: string[];
  nullable: boolean;
  default?: DefaultDescriptor;
  generated: boolean;
  primary_key: boolean;
  unique: boolean;
  reference?: ReferenceDescriptor;
}

interface IndexDescriptor {
  name: string;
  columns: string[];
  unique: boolean;
}

interface TableDescriptor {
  columns?: ColumnDescriptor[];
  indexes?: IndexDescriptor[];
}

interface CatalogColumn {
  column_name: string;
  logical_type: string;
  definition_json: string;
  state: string;
}

interface PhysicalColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  generated: boolean;
  primary_key: boolean;
}

interface PhysicalIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface TableDetail extends TableSummary {
  descriptor: TableDescriptor;
  current_descriptor?: TableDescriptor;
  current_descriptor_hash?: string;
  current_source_commit?: string;
  definition_state?: string;
  columns: CatalogColumn[];
  physical_columns: PhysicalColumn[];
  physical_indexes: PhysicalIndex[];
  physical_checks: string[];
  differences: string[];
}

export const ListScreen = z.object({
  tables: z.array(z.object({
    navigation: z.string(),
    package: field(z.string(), { label: "Package", readOnly: true }),
    table: field(z.string(), { label: "Table", readOnly: true }),
    state: field(z.string(), { label: "Table state", readOnly: true }),
    synchronization: field(z.string(), {
      label: "Last sync result",
      readOnly: true,
    }),
    activeColumns: field(z.number(), {
      label: "Active fields",
      readOnly: true,
    }),
    retiredColumns: field(z.number(), {
      label: "Retired fields",
      readOnly: true,
    }),
    synchronizedAt: field(z.string(), {
      label: "Last synchronized",
      readOnly: true,
    }),
    alert: field(z.string(), { label: "Attention", readOnly: true }),
  })),
});

const ColumnRow = z.object({
  key: z.string(),
  name: field(z.string(), { label: "Field", readOnly: true }),
  state: field(z.string(), { label: "State", readOnly: true }),
  logicalType: field(z.string(), { label: "Logical type", readOnly: true }),
  databaseType: field(z.string(), { label: "Database type", readOnly: true }),
  required: field(z.string(), { label: "Required", readOnly: true }),
  defaultValue: field(z.string(), { label: "Default", readOnly: true }),
  databaseDefault: field(z.string(), {
    label: "Database default",
    readOnly: true,
  }),
  constraints: field(z.string(), { label: "Constraints", readOnly: true }),
  reference: field(z.string(), { label: "Reference", readOnly: true }),
});

const IndexRow = z.object({
  key: z.string(),
  name: field(z.string(), { label: "Index", readOnly: true }),
  state: field(z.string(), { label: "State", readOnly: true }),
  columns: field(z.string(), { label: "Fields", readOnly: true }),
  unique: field(z.string(), { label: "Unique", readOnly: true }),
});

const DifferenceRow = z.object({
  key: z.string(),
  status: field(z.string(), { label: "Status", readOnly: true }),
  issue: field(z.string(), { label: "Difference", readOnly: true }),
});

export const DetailScreen = z.object({
  package: field(z.string(), { label: "Package", readOnly: true }),
  tableName: field(z.string(), { label: "Table", readOnly: true }),
  physicalTable: field(z.string(), {
    label: "Physical table",
    readOnly: true,
  }),
  tableState: field(z.string(), { label: "State", readOnly: true }),
  schemaState: field(z.string(), { label: "Database schema", readOnly: true }),
  sourceCommit: field(z.string(), {
    label: "Deployed package commit",
    readOnly: true,
  }),
  sourceModule: field(z.string(), {
    label: "Definition module",
    readOnly: true,
  }),
  synchronizedAt: field(z.string(), {
    label: "Last synchronized",
    readOnly: true,
  }),
  fields: field(z.string(), { label: "Fields", readOnly: true }),
  attention: field(z.string(), { label: "Attention", readOnly: true }),
  columns: z.array(ColumnRow),
  indexes: z.array(IndexRow),
  checks: z.array(z.object({
    key: z.string(),
    expression: field(z.string(), { label: "Database check", readOnly: true }),
  })),
  differences: z.array(DifferenceRow),
});

const ComparisonRow = z.object({
  key: z.string(),
  name: field(z.string(), { label: "Field", readOnly: true }),
  change: field(z.string(), { label: "Change", readOnly: true }),
  activated: field(z.string(), {
    label: "Activated definition",
    readOnly: true,
  }),
  deployed: field(z.string(), { label: "Deployed definition", readOnly: true }),
  database: field(z.string(), { label: "Database", readOnly: true }),
});

const ComparisonIndexRow = ComparisonRow.extend({
  name: field(z.string(), { label: "Index", readOnly: true }),
});

export const CompareScreen = z.object({
  tableId: field(z.string(), { label: "Table", readOnly: true }),
  definitionState: field(z.string(), {
    label: "Activated definition",
    readOnly: true,
  }),
  deployedCommit: field(z.string(), {
    label: "Deployed package commit",
    readOnly: true,
  }),
  activatedCommit: field(z.string(), {
    label: "Activated package commit",
    readOnly: true,
  }),
  result: field(z.string(), { label: "Result", readOnly: true }),
  attention: field(z.string(), { label: "Attention", readOnly: true }),
  columns: z.array(ComparisonRow),
  indexes: z.array(ComparisonIndexRow),
  differences: z.array(DifferenceRow),
});

export const ConfirmScreen = z.object({
  operation: field(z.string(), { label: "Operation", readOnly: true }),
  affected: field(z.string(), { label: "Permanently remove", readOnly: true }),
  warning: field(z.string(), { label: "Warning", readOnly: true }),
  confirmed: field(z.boolean(), {
    label: "I understand that this data cannot be recovered",
    control: "checkbox",
  }),
});

export const DefinitionsScreen = z.object({
  definitions: z.array(z.object({
    navigation: z.string(),
    id: field(z.string(), { label: "Definition", readOnly: true }),
    package: field(z.string(), { label: "Package", readOnly: true }),
    state: field(z.string(), { label: "Change", readOnly: true }),
    commit: field(z.string(), { label: "Activated commit", readOnly: true }),
    error: field(z.string(), { label: "Attention", readOnly: true }),
  })),
});

export function tableRows(tables: TableSummary[]) {
  return tables.map((table) => ({
    navigation: table.table_id,
    package: table.source_package || "—",
    table: tableName(table),
    state: stateLabel(table.state),
    synchronization: stateLabel(table.synchronization_state),
    activeColumns: table.active_columns,
    retiredColumns: table.retired_columns,
    synchronizedAt: table.synchronized_at ?? "—",
    alert: tableAlert(table) || "—",
  }));
}

function tableName(table: TableSummary): string {
  const filename = table.source_module.split("/").at(-1) ?? "";
  if (filename.endsWith(".ts") && filename.length > 3) {
    return filename.slice(0, -3);
  }
  return table.table_id.split("__").at(-1) || "—";
}

export function tableAlert(table: TableSummary): string {
  const alerts = [table.error ?? ""];
  if (table.retired_columns > 0) {
    alerts.push(`${table.retired_columns} retired fields`);
  }
  return [...new Set(alerts.filter(Boolean))].join("; ");
}

export function tableDetailModel(
  detail: TableDetail,
): z.infer<typeof DetailScreen> {
  return {
    package: detail.source_package || "—",
    tableName: tableName(detail),
    physicalTable: detail.table_id,
    tableState: stateLabel(detail.state),
    schemaState: stateLabel(detail.synchronization_state),
    sourceCommit: detail.source_commit || "—",
    sourceModule: detail.source_module || "—",
    synchronizedAt: detail.synchronized_at ?? "—",
    fields:
      `${detail.active_columns} active, ${detail.retired_columns} retired`,
    attention: detail.error || "None",
    columns: columnRows(detail),
    indexes: indexRows(
      detail.descriptor.indexes ?? [],
      detail.physical_indexes,
    ),
    checks: detail.physical_checks.map((expression, index) => ({
      key: String(index),
      expression,
    })),
    differences: differenceRows(detail.differences),
  };
}

export function tableComparisonModel(
  detail: TableDetail,
): z.infer<typeof CompareScreen> {
  const differenceCount = detail.differences.length;
  return {
    tableId: detail.table_id,
    definitionState: stateLabel(detail.definition_state ?? "unavailable"),
    deployedCommit: detail.source_commit || "—",
    activatedCommit: detail.current_source_commit ?? "—",
    result: differenceCount === 0
      ? "Activated definition, deployed catalog, and database agree"
      : `${differenceCount} difference${
        differenceCount === 1 ? "" : "s"
      } detected`,
    attention: detail.error || "None",
    columns: comparisonColumnRows(detail),
    indexes: comparisonIndexRows(detail),
    differences: differenceRows(detail.differences),
  };
}

function columnRows(detail: TableDetail): z.infer<typeof ColumnRow>[] {
  const deployed = descriptorColumns(detail.descriptor);
  const catalog = new Map(
    detail.columns.map((column) => [column.column_name, column]),
  );
  const physical = new Map(
    detail.physical_columns.map((column) => [column.name, column]),
  );
  for (const column of detail.columns) {
    if (!deployed.has(column.column_name)) {
      const parsed = parseCatalogColumn(column);
      if (parsed !== undefined) deployed.set(column.column_name, parsed);
    }
  }
  return orderedUnion(deployed, catalog, physical).map((name) => {
    const definition = deployed.get(name);
    const catalogColumn = catalog.get(name);
    const databaseColumn = physical.get(name);
    return {
      key: name,
      name,
      state: columnState(definition, catalogColumn, databaseColumn),
      logicalType: definition === undefined
        ? catalogColumn?.logical_type ?? "—"
        : logicalType(definition),
      databaseType: databaseColumn?.type ?? "—",
      required: definition !== undefined
        ? yesNo(!definition.nullable)
        : databaseColumn === undefined
        ? "—"
        : yesNo(!databaseColumn.nullable),
      defaultValue: defaultValue(definition?.default),
      databaseDefault: databaseColumn?.default || "—",
      constraints: constraints(definition, databaseColumn),
      reference: definition?.reference === undefined
        ? "—"
        : `${definition.reference.table}.${definition.reference.column}`,
    };
  });
}

function indexRows(
  expectedItems: IndexDescriptor[],
  physicalItems: PhysicalIndex[],
) {
  const expected = new Map(expectedItems.map((index) => [index.name, index]));
  const physical = new Map(physicalItems.map((index) => [index.name, index]));
  return orderedUnion(expected, physical).map((name) => {
    const definition = expected.get(name);
    const databaseIndex = physical.get(name);
    return {
      key: name,
      name,
      state: definition === undefined
        ? "Uncatalogued"
        : databaseIndex === undefined
        ? "Missing from database"
        : "Active",
      columns: (definition?.columns ?? databaseIndex?.columns ?? []).join(", "),
      unique: yesNo(definition?.unique ?? databaseIndex?.unique ?? false),
    };
  });
}

function comparisonColumnRows(detail: TableDetail) {
  const activated = descriptorColumns(detail.current_descriptor);
  const deployed = descriptorColumns(detail.descriptor);
  const physical = new Map(
    detail.physical_columns.map((column) => [column.name, column]),
  );
  const unavailable = detail.definition_state === "error" ||
    detail.definition_state === "unknown";
  return orderedUnion(activated, deployed, physical).map((name) => ({
    key: name,
    name,
    change: unavailable
      ? "Unavailable"
      : definitionChange(activated.get(name), deployed.get(name)),
    activated: unavailable
      ? "Definition could not be evaluated"
      : logicalColumnSummary(activated.get(name)),
    deployed: logicalColumnSummary(deployed.get(name)),
    database: physicalColumnSummary(physical.get(name)),
  }));
}

function comparisonIndexRows(detail: TableDetail) {
  const activated = descriptorIndexes(detail.current_descriptor);
  const deployed = descriptorIndexes(detail.descriptor);
  const physical = new Map(
    detail.physical_indexes.map((index) => [index.name, index]),
  );
  const unavailable = detail.definition_state === "error" ||
    detail.definition_state === "unknown";
  return orderedUnion(activated, deployed, physical).map((name) => ({
    key: name,
    name,
    change: unavailable
      ? "Unavailable"
      : definitionChange(activated.get(name), deployed.get(name)),
    activated: unavailable
      ? "Definition could not be evaluated"
      : indexSummary(activated.get(name)),
    deployed: indexSummary(deployed.get(name)),
    database: indexSummary(physical.get(name)),
  }));
}

function differenceRows(differences: string[]) {
  if (differences.length === 0) {
    return [{ key: "ok", status: "OK", issue: "No differences detected" }];
  }
  return differences.map((issue, index) => ({
    key: String(index),
    status: "Attention",
    issue,
  }));
}

function descriptorColumns(descriptor: TableDescriptor | undefined) {
  return new Map(
    (descriptor?.columns ?? []).map((column) => [column.name, column]),
  );
}

function descriptorIndexes(descriptor: TableDescriptor | undefined) {
  return new Map(
    (descriptor?.indexes ?? []).map((index) => [index.name, index]),
  );
}

function parseCatalogColumn(
  column: CatalogColumn,
): ColumnDescriptor | undefined {
  try {
    const parsed = JSON.parse(column.definition_json) as ColumnDescriptor;
    return parsed.name === column.column_name &&
        typeof parsed.logical_type === "string"
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}

function columnState(
  definition: ColumnDescriptor | undefined,
  catalog: CatalogColumn | undefined,
  physical: PhysicalColumn | undefined,
): string {
  if (catalog?.state === "retired") return "Retired";
  if (definition === undefined && physical !== undefined) return "Uncatalogued";
  if (definition !== undefined && physical === undefined) {
    return "Missing from database";
  }
  if (catalog === undefined) return "Uncatalogued";
  return "Active";
}

function logicalType(column: ColumnDescriptor): string {
  if (column.logical_type === "decimal") {
    return `decimal(${column.precision ?? "?"}, ${column.scale ?? "?"})`;
  }
  if (column.logical_type === "enum") {
    return `enum (${(column.enum_values ?? []).join(", ")})`;
  }
  return column.logical_type;
}

function defaultValue(value: DefaultDescriptor | undefined): string {
  if (value === undefined) return "—";
  if (value.kind === "now") return "Current time";
  if (value.kind !== "literal") return stateLabel(value.kind);
  if (typeof value.value === "string") return `“${value.value}”`;
  return value.value === null ? "null" : String(value.value);
}

function constraints(
  logical: ColumnDescriptor | undefined,
  physical: PhysicalColumn | undefined,
): string {
  const values: string[] = [];
  if (logical?.primary_key ?? physical?.primary_key) values.push("Primary key");
  if (logical?.unique) values.push("Unique");
  if (logical?.generated ?? physical?.generated) values.push("Generated");
  return values.join(", ") || "—";
}

function logicalColumnSummary(column: ColumnDescriptor | undefined): string {
  if (column === undefined) return "—";
  const parts = [
    logicalType(column),
    column.nullable ? "optional" : "required",
  ];
  const value = defaultValue(column.default);
  if (value !== "—") parts.push(`default ${value}`);
  const rules = constraints(column, undefined);
  if (rules !== "—") parts.push(rules.toLocaleLowerCase());
  if (column.reference !== undefined) {
    parts.push(
      `references ${column.reference.table}.${column.reference.column}`,
    );
  }
  return parts.join(" · ");
}

function physicalColumnSummary(column: PhysicalColumn | undefined): string {
  if (column === undefined) return "—";
  const parts = [column.type, column.nullable ? "optional" : "required"];
  if (column.default) parts.push(`default ${column.default}`);
  const rules = constraints(undefined, column);
  if (rules !== "—") parts.push(rules.toLocaleLowerCase());
  return parts.join(" · ");
}

function indexSummary(
  index: IndexDescriptor | PhysicalIndex | undefined,
): string {
  if (index === undefined) return "—";
  return `${index.columns.join(", ")}${index.unique ? " · unique" : ""}`;
}

function definitionChange<T>(
  current: T | undefined,
  deployed: T | undefined,
): string {
  if (current === undefined && deployed !== undefined) return "Removed";
  if (current !== undefined && deployed === undefined) return "New";
  return JSON.stringify(current) === JSON.stringify(deployed)
    ? "Same"
    : "Changed";
}

function orderedUnion(
  ...maps: Array<{ keys(): IterableIterator<string> }>
): string[] {
  const values = new Set<string>();
  for (const map of maps) {
    for (const key of map.keys()) values.add(key);
  }
  return [...values];
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function stateLabel(value: string): string {
  if (!value) return "—";
  return value.replaceAll("_", " ").replace(
    /\b\w/g,
    (letter) => letter.toLocaleUpperCase(),
  );
}
