import {
  bytesToBase64,
  type DatabaseValue,
  decodeDatabaseValue,
} from "/p/the8020/db/codecs.ts";
import {
  type DatabaseBackend,
  kernel,
  kernelDatabaseBackend,
} from "@the8020/kernel";

const MAXIMUM_STATEMENT_BYTES = 1_048_576;
const rowStatementKinds = new Set([
  "CALL",
  "DESCRIBE",
  "EXPLAIN",
  "PRAGMA",
  "SELECT",
  "SHOW",
  "TABLE",
  "VALUES",
]);
const nonRowStatementKinds = new Set([
  "ALTER",
  "ANALYZE",
  "ATTACH",
  "COMMENT",
  "CREATE",
  "DELETE",
  "DETACH",
  "DO",
  "DROP",
  "GRANT",
  "INSERT",
  "MERGE",
  "REINDEX",
  "REPLACE",
  "RESET",
  "REVOKE",
  "SET",
  "TRUNCATE",
  "UPDATE",
  "VACUUM",
]);
const transactionStatementKinds = new Set([
  "ABORT",
  "BEGIN",
  "COMMIT",
  "END",
  "RELEASE",
  "ROLLBACK",
  "SAVEPOINT",
  "START",
]);
const statementKinds = new Set([
  ...rowStatementKinds,
  ...nonRowStatementKinds,
  ...transactionStatementKinds,
]);

export interface SQLResultColumn {
  key: string;
  heading: string;
}

export interface SQLResultPresentation {
  columns: SQLResultColumn[];
  rows: Record<string, string>[];
}

export interface SQLStatementIntent {
  statement: string;
  returnRows: boolean;
  returnInsertId: boolean;
}

interface SQLResult {
  columns: string[];
  rows: DatabaseValue[][];
  affected_rows?: DatabaseValue;
  insert_id?: DatabaseValue;
}

interface Token {
  word: string;
  depth: number;
}

export async function executeSQL(
  source: string,
): Promise<SQLResultPresentation> {
  const intent = sqlStatementIntent(source, kernelDatabaseBackend());
  const result = await kernel.database.execute(intent.statement, [], {
    returnRows: intent.returnRows,
    ...(intent.returnInsertId ? { returnInsertId: true } : {}),
  });
  return presentSQLResult(result);
}

export function sqlStatementIntent(
  source: string,
  backend: DatabaseBackend,
): SQLStatementIntent {
  if (typeof source !== "string" || source.trim().length === 0) {
    throw new TypeError("Enter one SQL statement to run");
  }
  if (new TextEncoder().encode(source).byteLength > MAXIMUM_STATEMENT_BYTES) {
    throw new TypeError("SQL statement must not exceed 1 MiB");
  }
  const statement = source.trim();
  const tokens = tokenizeStatement(statement, backend);
  if (tokens.length === 0) {
    throw new TypeError("Enter one SQL statement to run");
  }
  const topLevel = tokens.filter((token) => token.depth === 0);
  let kind = topLevel[0]?.word ?? "";
  if (kind === "WITH") {
    kind = topLevel.slice(1).find((token) => statementKinds.has(token.word))
      ?.word ?? "WITH";
  }
  if (transactionStatementKinds.has(kind)) {
    throw new TypeError(
      "Transaction control is unavailable; run one self-contained SQL statement",
    );
  }
  const hasReturning = topLevel.some((token) => token.word === "RETURNING");
  const returnRows = hasReturning || rowStatementKinds.has(kind) ||
    !nonRowStatementKinds.has(kind);
  return {
    statement,
    returnRows,
    returnInsertId: !returnRows && (kind === "INSERT" || kind === "REPLACE"),
  };
}

export function presentSQLResult(result: SQLResult): SQLResultPresentation {
  if (result.columns.length > 0) {
    const columns = resultColumns(result.columns);
    return {
      columns,
      rows: result.rows.map((values, rowIndex) => {
        if (values.length !== columns.length) {
          throw new Error("Database returned a malformed result row");
        }
        return {
          __rowKey: String(rowIndex),
          ...Object.fromEntries(columns.map((column, columnIndex) => [
            column.key,
            displayDatabaseValue(values[columnIndex]!),
          ])),
        };
      }),
    };
  }
  if (result.rows.length > 0) {
    throw new Error("Database returned values without result columns");
  }
  const facts: Array<[string, string]> = [];
  if (result.affected_rows !== undefined) {
    facts.push(["Rows affected", displayDatabaseValue(result.affected_rows)]);
  }
  if (result.insert_id !== undefined) {
    facts.push(["Insert ID", displayDatabaseValue(result.insert_id)]);
  }
  if (facts.length === 0) {
    facts.push(["Status", "Statement completed successfully"]);
  }
  return {
    columns: [
      { key: "result", heading: "Result" },
      { key: "value", heading: "Value" },
    ],
    rows: facts.map(([result, value], index) => ({
      __rowKey: String(index),
      result,
      value,
    })),
  };
}

function resultColumns(names: readonly string[]): SQLResultColumn[] {
  const occurrences = new Map<string, number>();
  return names.map((name, index) => {
    const base = name.trim() || `Column ${index + 1}`;
    const occurrence = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, occurrence);
    return {
      key: `value_${index}`,
      heading: occurrence === 1 ? base : `${base} (${occurrence})`,
    };
  });
}

function displayDatabaseValue(value: DatabaseValue): string {
  const decoded = decodeDatabaseValue(value);
  if (decoded === null) return "NULL";
  if (decoded instanceof Date) return decoded.toISOString();
  if (decoded instanceof Uint8Array) {
    return `base64:${bytesToBase64(decoded)}`;
  }
  if (typeof decoded === "bigint") return decoded.toString();
  if (typeof decoded === "object") return JSON.stringify(decoded);
  if (decoded === "") return '""';
  return String(decoded);
}

function tokenizeStatement(source: string, backend: DatabaseBackend): Token[] {
  const tokens: Token[] = [];
  let depth = 0;
  let terminated = false;
  let index = 0;
  while (index < source.length) {
    const character = source[index]!;
    if (/\s/.test(character)) {
      index++;
      continue;
    }
    if (source.startsWith("--", index)) {
      const newline = source.indexOf("\n", index + 2);
      index = newline < 0 ? source.length : newline + 1;
      continue;
    }
    if (source.startsWith("/*", index)) {
      index = blockCommentEnd(source, index, backend === "postgresql");
      continue;
    }
    if (terminated) {
      throw new TypeError("Run one SQL statement at a time");
    }
    if (character === ";") {
      terminated = true;
      index++;
      continue;
    }
    const prefixedQuote = backend === "postgresql"
      ? postgresPrefixedQuote(source, index)
      : undefined;
    if (prefixedQuote !== undefined) {
      index = quotedEnd(
        source,
        prefixedQuote.start,
        prefixedQuote.quote,
        true,
      );
      continue;
    }
    if (
      character === "'" || character === '"' ||
      (backend === "sqlite" && character === "`")
    ) {
      index = quotedEnd(source, index, character);
      continue;
    }
    if (backend === "sqlite" && character === "[") {
      index = bracketedIdentifierEnd(source, index);
      continue;
    }
    const dollarQuote = backend === "postgresql"
      ? source.slice(index).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0]
      : undefined;
    if (dollarQuote !== undefined) {
      const end = source.indexOf(dollarQuote, index + dollarQuote.length);
      if (end < 0) {
        throw new TypeError("SQL contains an unterminated dollar quote");
      }
      index = end + dollarQuote.length;
      continue;
    }
    if (character === "(") {
      depth++;
      index++;
      continue;
    }
    if (character === ")") {
      depth = Math.max(0, depth - 1);
      index++;
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      let end = index + 1;
      while (end < source.length && /[A-Za-z0-9_$]/.test(source[end]!)) end++;
      tokens.push({ word: source.slice(index, end).toUpperCase(), depth });
      index = end;
      continue;
    }
    index++;
  }
  return tokens;
}

function postgresPrefixedQuote(
  source: string,
  start: number,
): { start: number; quote: string } | undefined {
  const boundary = start === 0 || !/[A-Za-z0-9_$]/.test(source[start - 1]!);
  if (!boundary) return undefined;
  if (
    (source[start] === "E" || source[start] === "e") &&
    source[start + 1] === "'"
  ) {
    return { start: start + 1, quote: "'" };
  }
  if (
    (source[start] === "U" || source[start] === "u") &&
    source[start + 1] === "&" &&
    (source[start + 2] === "'" || source[start + 2] === '"')
  ) {
    return { start: start + 2, quote: source[start + 2]! };
  }
  return undefined;
}

function quotedEnd(
  source: string,
  start: number,
  quote: string,
  backslashEscapes = false,
): number {
  let index = start + 1;
  while (index < source.length) {
    if (backslashEscapes && source[index] === "\\") {
      index += 2;
      continue;
    }
    if (source[index] !== quote) {
      index++;
      continue;
    }
    if (source[index + 1] === quote) {
      index += 2;
      continue;
    }
    return index + 1;
  }
  throw new TypeError("SQL contains an unterminated quoted value");
}

function bracketedIdentifierEnd(source: string, start: number): number {
  const end = source.indexOf("]", start + 1);
  if (end >= 0) return end + 1;
  throw new TypeError("SQL contains an unterminated bracketed identifier");
}

function blockCommentEnd(
  source: string,
  start: number,
  nested: boolean,
): number {
  let level = 1;
  let index = start + 2;
  while (index < source.length) {
    if (nested && source.startsWith("/*", index)) {
      level++;
      index += 2;
      continue;
    }
    if (source.startsWith("*/", index)) {
      level--;
      index += 2;
      if (level === 0) return index;
      continue;
    }
    index++;
  }
  throw new TypeError("SQL contains an unterminated block comment");
}
