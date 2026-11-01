import { text as localizedText } from "/p/the8020/i18n/mod.ts";
import { msg } from "/p/the8020/admin-db/i18n/messages.ts";
import { catalogInfo, catalogStateLabels } from "../../types/catalog.ts";
import { sourceInfo } from "/p/the8020/packages/types/source.ts";
import { field, z } from "/p/the8020/uui/mod.ts";
import { packageId } from "/p/the8020/packages/types/package.ts";
import { tableId } from "/p/the8020/db/types/table.ts";

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
    package: field(packageId, { readOnly: true }),
    table: field(catalogInfo.shape.tableName, {
      label: msg("view.table"),
      readOnly: true,
    }),
    state: field(catalogInfo.shape.state, {
      label: msg("view.table_state"),
      readOnly: true,
    }),
    synchronization: field(catalogInfo.shape.synchronization, {
      label: msg("view.last_sync_result"),
      readOnly: true,
    }),
    activeColumns: field(catalogInfo.shape.activeColumns, {
      label: msg("view.active_fields"),
      readOnly: true,
    }),
    retiredColumns: field(catalogInfo.shape.retiredColumns, {
      label: msg("view.retired_fields"),
      readOnly: true,
    }),
    synchronizedAt: field(catalogInfo.shape.synchronizedAt, {
      label: msg("view.last_synchronized"),
      readOnly: true,
    }),
    alert: field(catalogInfo.shape.attention, {
      label: msg("view.attention"),
      readOnly: true,
    }),
  })),
});

export const ColumnRow = z.object({
  key: z.string(),
  name: field(catalogInfo.shape.columnName, { readOnly: true }),
  state: field(catalogInfo.shape.state, { readOnly: true }),
  logicalType: field(catalogInfo.shape.logicalType, {
    readOnly: true,
  }),
  databaseType: field(catalogInfo.shape.databaseType, {
    readOnly: true,
  }),
  required: field(catalogInfo.shape.required, {
    readOnly: true,
  }),
  defaultValue: field(catalogInfo.shape.defaultValue, {
    readOnly: true,
  }),
  databaseDefault: field(catalogInfo.shape.databaseDefault, {
    readOnly: true,
  }),
  constraints: field(catalogInfo.shape.constraints, {
    readOnly: true,
  }),
  reference: field(catalogInfo.shape.reference, {
    readOnly: true,
  }),
  referenceTable: field(tableId, {
    label: msg("view.related_table"),
    readOnly: true,
  }),
});

const IndexRow = z.object({
  key: z.string(),
  name: field(catalogInfo.shape.indexName, { readOnly: true }),
  state: field(catalogInfo.shape.state, { readOnly: true }),
  columns: field(catalogInfo.shape.indexColumns, {
    readOnly: true,
  }),
  unique: field(catalogInfo.shape.unique, { readOnly: true }),
});

const DifferenceRow = z.object({
  key: z.string(),
  status: field(catalogInfo.shape.differenceStatus, { readOnly: true }),
  issue: field(catalogInfo.shape.difference, {
    readOnly: true,
  }),
});

export const DetailScreen = z.object({
  package: field(packageId, { readOnly: true }),
  tableName: field(catalogInfo.shape.tableName, {
    readOnly: true,
  }),
  physicalTable: field(tableId, {
    label: msg("view.physical_table"),
    readOnly: true,
    open: undefined,
  }),
  tableState: field(catalogInfo.shape.state, {
    readOnly: true,
  }),
  schemaState: field(catalogInfo.shape.schemaState, {
    readOnly: true,
  }),
  sourceCommit: field(sourceInfo.shape.commit, {
    label: msg("view.deployed_package_commit"),
    readOnly: true,
  }),
  sourceModule: field(sourceInfo.shape.path, {
    label: msg("view.definition_module"),
    readOnly: true,
  }),
  synchronizedAt: field(catalogInfo.shape.synchronizedAt, {
    readOnly: true,
  }),
  fields: field(catalogInfo.shape.fields, { readOnly: true }),
  attention: field(catalogInfo.shape.attention, {
    readOnly: true,
  }),
  columns: z.array(ColumnRow),
  indexes: z.array(IndexRow),
  checks: z.array(z.object({
    key: z.string(),
    expression: field(catalogInfo.shape.expression, {
      label: msg("view.database_check"),
      readOnly: true,
    }),
  })),
  differences: z.array(DifferenceRow),
});

const ComparisonRow = z.object({
  key: z.string(),
  name: field(catalogInfo.shape.columnName, { readOnly: true }),
  change: field(catalogInfo.shape.change, { readOnly: true }),
  activated: field(catalogInfo.shape.activated, {
    readOnly: true,
  }),
  deployed: field(catalogInfo.shape.deployed, {
    readOnly: true,
  }),
  database: field(catalogInfo.shape.database, {
    readOnly: true,
  }),
});

const ComparisonIndexRow = ComparisonRow.extend({
  name: field(catalogInfo.shape.indexName, { readOnly: true }),
});

export const CompareScreen = z.object({
  tableId: field(tableId, { readOnly: true }),
  definitionState: field(catalogInfo.shape.definitionState, {
    readOnly: true,
  }),
  deployedCommit: field(sourceInfo.shape.commit, {
    label: msg("view.deployed_package_commit"),
    readOnly: true,
  }),
  activatedCommit: field(sourceInfo.shape.commit, {
    label: msg("view.activated_package_commit"),
    readOnly: true,
  }),
  result: field(catalogInfo.shape.result, { readOnly: true }),
  attention: field(catalogInfo.shape.attention, {
    readOnly: true,
  }),
  columns: z.array(ComparisonRow),
  indexes: z.array(ComparisonIndexRow),
  differences: z.array(DifferenceRow),
});

export const ConfirmScreen = z.object({
  operation: field(catalogInfo.shape.operation, {
    readOnly: true,
  }),
  affected: field(catalogInfo.shape.affected, {
    readOnly: true,
  }),
  warning: field(catalogInfo.shape.warning, {
    readOnly: true,
  }),
  confirmed: field(catalogInfo.shape.confirmed, {
    control: "checkbox",
  }),
});

export const DefinitionsScreen = z.object({
  definitions: z.array(z.object({
    navigation: z.string(),
    id: field(tableId, { label: msg("view.definition"), readOnly: true }),
    package: field(packageId, { label: msg("view.package"), readOnly: true }),
    state: field(catalogInfo.shape.definitionChange, { readOnly: true }),
    commit: field(sourceInfo.shape.commit, {
      label: msg("view.activated_commit"),
      readOnly: true,
    }),
    error: field(catalogInfo.shape.attention, {
      label: msg("view.attention"),
      readOnly: true,
    }),
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
    alerts.push(
      localizedText(
        msg("view.retired_fields", { count: table.retired_columns }),
      ),
    );
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
    attention: detail.error || localizedText(msg("view.none")),
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
      ? localizedText(
        msg("view.activated_definition_deployed_catalog_and_database_agree"),
      )
      : localizedText(
        msg("view.differences_count", { count: differenceCount }),
      ),
    attention: detail.error || localizedText(msg("view.none")),
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
      referenceTable: definition?.reference?.table ?? "",
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
        ? localizedText(msg("view.uncatalogued"))
        : databaseIndex === undefined
        ? localizedText(msg("view.missing_from_database"))
        : localizedText(msg("view.active")),
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
      ? localizedText(msg("view.unavailable"))
      : definitionChange(activated.get(name), deployed.get(name)),
    activated: unavailable
      ? localizedText(msg("view.definition_could_not_be_evaluated"))
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
      ? localizedText(msg("view.unavailable"))
      : definitionChange(activated.get(name), deployed.get(name)),
    activated: unavailable
      ? localizedText(msg("view.definition_could_not_be_evaluated"))
      : indexSummary(activated.get(name)),
    deployed: indexSummary(deployed.get(name)),
    database: indexSummary(physical.get(name)),
  }));
}

function differenceRows(differences: string[]) {
  if (differences.length === 0) {
    return [{
      key: "ok",
      status: "OK",
      issue: localizedText(msg("view.no_differences_detected")),
    }];
  }
  return differences.map((issue, index) => ({
    key: String(index),
    status: localizedText(msg("view.attention")),
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
  if (catalog?.state === "retired") return localizedText(msg("view.retired"));
  if (definition === undefined && physical !== undefined) {
    return localizedText(msg("view.uncatalogued"));
  }
  if (definition !== undefined && physical === undefined) {
    return localizedText(msg("view.missing_from_database"));
  }
  if (catalog === undefined) return localizedText(msg("view.uncatalogued"));
  return localizedText(msg("view.active"));
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
  if (value.kind === "now") return localizedText(msg("view.current_time"));
  if (value.kind !== "literal") return stateLabel(value.kind);
  if (typeof value.value === "string") return `“${value.value}”`;
  return value.value === null ? "null" : String(value.value);
}

function constraints(
  logical: ColumnDescriptor | undefined,
  physical: PhysicalColumn | undefined,
): string {
  const values: string[] = [];
  if (logical?.primary_key ?? physical?.primary_key) {
    values.push(localizedText(msg("view.primary_key")));
  }
  if (logical?.unique) values.push(localizedText(msg("catalog.unique")));
  if (logical?.generated ?? physical?.generated) {
    values.push(localizedText(msg("view.generated")));
  }
  return values.join(", ") || "—";
}

function logicalColumnSummary(column: ColumnDescriptor | undefined): string {
  if (column === undefined) return "—";
  const parts = [
    logicalType(column),
    localizedText(msg(column.nullable ? "view.optional" : "view.required")),
  ];
  const value = defaultValue(column.default);
  if (value !== "—") {
    parts.push(localizedText(msg("view.default_value", { value })));
  }
  const rules = constraints(column, undefined);
  if (rules !== "—") parts.push(rules.toLocaleLowerCase());
  if (column.reference !== undefined) {
    parts.push(
      localizedText(msg("view.reference", {
        table: column.reference.table,
        column: column.reference.column,
      })),
    );
  }
  return parts.join(" · ");
}

function physicalColumnSummary(column: PhysicalColumn | undefined): string {
  if (column === undefined) return "—";
  const parts = [
    column.type,
    localizedText(msg(column.nullable ? "view.optional" : "view.required")),
  ];
  if (column.default) {
    parts.push(
      localizedText(msg("view.default_value", { value: column.default })),
    );
  }
  const rules = constraints(undefined, column);
  if (rules !== "—") parts.push(rules.toLocaleLowerCase());
  return parts.join(" · ");
}

function indexSummary(
  index: IndexDescriptor | PhysicalIndex | undefined,
): string {
  if (index === undefined) return "—";
  return [
    index.columns.join(", "),
    ...(index.unique ? [localizedText(msg("catalog.unique"))] : []),
  ].join(" · ");
}

function definitionChange<T>(
  current: T | undefined,
  deployed: T | undefined,
): string {
  if (current === undefined && deployed !== undefined) {
    return localizedText(msg("view.removed"));
  }
  if (current !== undefined && deployed === undefined) {
    return localizedText(msg("view.new"));
  }
  return JSON.stringify(current) === JSON.stringify(deployed)
    ? localizedText(msg("view.same"))
    : localizedText(msg("view.changed"));
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
  return localizedText(msg(value ? "view.yes" : "choices.no"));
}

export function stateLabel(value: string): string {
  if (!value) return "—";
  const label = catalogStateLabels[value];
  if (label !== undefined) return localizedText(label);
  return value.replaceAll("_", " ").replace(
    /\b\w/g,
    (letter) => letter.toLocaleUpperCase(),
  );
}
