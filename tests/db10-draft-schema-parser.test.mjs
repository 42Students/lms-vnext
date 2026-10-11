import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

// DB10 staged sources are not in the active schema barrel. They still must
// parse as TypeScript before Chat 1 can safely register any numbered migration.
const root = "src/db/schema";
const draftNames = readdirSync(root)
  .filter((name) => /^db10-.*\.draft\.ts$/.test(name))
  .sort();

test("DB10 staged draft inventory remains nonempty", () => {
  assert.ok(draftNames.length >= 7, "expected source-known DB10 draft families");
});

test("every DB10 staged schema parses as TypeScript", () => {
  for (const name of draftNames) {
    const path = join(root, name);
    const source = readFileSync(path, "utf8");
    const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const failures = parsed.parseDiagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    assert.deepEqual(failures, [], name + " has a syntax/template parser error");
  }
});

test("DB10 draft pgTable declarations have distinct source identities", () => {
  const exportedSymbols = new Map();
  const persistedTableNames = new Map();
  for (const name of draftNames) {
    const path = join(root, name);
    const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    assert.equal(file.parseDiagnostics.length, 0, path + " must parse first");
    for (const stmt of file.statements) {
      if (!ts.isVariableStatement(stmt)) continue;
      const exported = stmt.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      if (!exported) continue;
      for (const decl of stmt.declarationList.declarations) {
        const init = decl.initializer;
        if (!init || !ts.isCallExpression(init) || !ts.isIdentifier(init.expression) ||
            init.expression.text !== "pgTable") continue;
        assert.ok(ts.isIdentifier(decl.name), path + " has a non-identifier table export");
        const symbol = decl.name.text;
        const [first] = init.arguments;
        assert.ok(first && ts.isStringLiteral(first), path + " must use a literal table name");
        assert.ok(!exportedSymbols.has(symbol),
          symbol + " is also exported by " + exportedSymbols.get(symbol));
        assert.ok(!persistedTableNames.has(first.text),
          first.text + " is also declared by " + persistedTableNames.get(first.text));
        exportedSymbols.set(symbol, path);
        persistedTableNames.set(first.text, path);
      }
    }
  }
  assert.ok(persistedTableNames.size >= 16,
    "DB10 staged persisted table census unexpectedly shrank");
});
