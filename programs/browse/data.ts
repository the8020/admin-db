import {
  bytesToBase64,
  type ColumnDescriptor,
  type DatabaseValue,
  decodeDatabaseColumnValue,
  decodeDatabaseValue,
} from "/p/the8020/db/codecs.ts";
import { kernel } from "@the8020/kernel";

export const DEFAULT_BROWSE_LIMIT = 100;
export const MAXIMUM_BROWSE_LIMIT = 10_000;
export const MAXIMUM_SQL_CLAUSE_LENGTH = 4_000;

export interface BrowseOptions {
  limit: number;
  where: string;
  orderBy: string;
}

interface RowResult {
  columns: string[];
  rows: DatabaseValue[][];
}

export async function countTableRows(tableName: string): Promise<bigint> {
  const result = await kernel.database.execute(
    `SELECT COUNT(*) AS "row_count" FROM ${quoteIdentifier(tableName)}`,
    [],
    { returnRows: true },
  );
  return rowCountFromResult(result);
}

export function rowCountFromResult(result: RowResult): bigint {
  const raw = result.rows[0]?.[0];
  if (raw === undefined) {
    throw new Error("Database did not return a row count");
  }
  const value = decodeDatabaseValue(raw);
  const count = typeof value === "bigint"
    ? value
    : typeof value === "number" && Number.isSafeInteger(value)
    ? BigInt(value)
    : undefined;
  if (count === undefined || count < 0n) {
    throw new Error("Database returned an invalid row count");
  }
  return count;
}

export async function browseTableRows(
  tableName: string,
  columns: readonly ColumnDescriptor[],
  options: BrowseOptions,
): Promise<Record<string, unknown>[]> {
  const transaction = await kernel.database.transaction.begin({
    readOnly: true,
  });
  try {
    const result = await kernel.database.execute(
      tableBrowseStatement(tableName, columns, options),
      [],
      { returnRows: true, transaction: transaction.transaction },
    );
    return tableRowsFromResult(result, columns);
  } finally {
    await kernel.database.transaction.rollback(transaction.transaction);
  }
}

export function tableBrowseStatement(
  tableName: string,
  columns: readonly ColumnDescriptor[],
  options: BrowseOptions,
): string {
  if (
    !Number.isSafeInteger(options.limit) || options.limit < 1 ||
    options.limit > MAXIMUM_BROWSE_LIMIT
  ) {
    throw new TypeError(
      `Limit must be an integer from 1 through ${MAXIMUM_BROWSE_LIMIT}`,
    );
  }
  if (columns.length === 0) {
    throw new TypeError("Table has no defined fields to browse");
  }
  const where = sqlClause(options.where, "Where");
  const orderBy = sqlClause(options.orderBy, "Order by");
  const selection = columns.map((column) => quoteIdentifier(column.name)).join(
    ", ",
  );
  return [
    `SELECT ${selection} FROM ${quoteIdentifier(tableName)}`,
    ...(where === "" ? [] : [`WHERE ${where}`]),
    ...(orderBy === "" ? [] : [`ORDER BY ${orderBy}`]),
    `LIMIT ${options.limit}`,
  ].join(" ");
}

export function tableRowsFromResult(
  result: RowResult,
  columns: readonly ColumnDescriptor[],
): Record<string, unknown>[] {
  if (
    result.columns.length !== columns.length ||
    result.columns.some((name, index) => name !== columns[index]?.name)
  ) {
    throw new Error(
      "Database returned fields that differ from the table definition",
    );
  }
  return result.rows.map((values) => {
    if (values.length !== columns.length) {
      throw new Error("Database returned a malformed table row");
    }
    return Object.fromEntries(columns.map((column, index) => [
      column.name,
      presentValue(decodeDatabaseColumnValue(values[index]!, column)),
    ]));
  });
}

function presentValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return bytesToBase64(value);
  return value;
}

function quoteIdentifier(value: string): string {
  if (
    typeof value !== "string" || value.length === 0 || value.includes("\0") ||
    new TextEncoder().encode(value).byteLength > 63
  ) {
    throw new TypeError("Invalid database identifier");
  }
  return `"${value.replaceAll('"', '""')}"`;
}

function sqlClause(value: string, label: string): string {
  if (typeof value !== "string") throw new TypeError(`${label} must be text`);
  const clause = value.trim();
  if (clause.length > MAXIMUM_SQL_CLAUSE_LENGTH) {
    throw new TypeError(
      `${label} must not exceed ${MAXIMUM_SQL_CLAUSE_LENGTH} characters`,
    );
  }
  if (
    clause.includes("\0") || clause.includes(";") || clause.includes("--") ||
    clause.includes("/*") || clause.includes("*/")
  ) {
    throw new TypeError(
      `${label} must be one SQL fragment without comments or a statement separator`,
    );
  }
  return clause;
}
