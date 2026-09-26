const test: (name: string, fn: () => void) => void = require("node:test");
const assert: any = require("node:assert/strict");
import { Lexer } from "../src/lexer/lexer";
import { Parser } from "../src/parser/parser";
import { NoviParserError } from "../src/errors";

function parse(source: string) {
  const tokens = new Lexer(source, "parser.novi").tokenize();
  return new Parser(tokens, "parser.novi").parse();
}

test("builds an AST for functions, calls, arrays and objects", () => {
  const program = parse(`\
add(a, b) { return a + b; }\n\nitems = ["A", "B"];\nuser = { name = "Nexus"; };\nresult = add(items[0].length, user.name.length);\n`);

  assert.equal(program.statements.length, 4);
  assert.equal(program.statements[0].type, "FunctionDeclaration");
  assert.equal(program.statements[1].type, "AssignmentStatement");
  assert.equal(program.statements[2].type, "AssignmentStatement");
  assert.equal(program.statements[3].type, "AssignmentStatement");
});

test("respects operator precedence", () => {
  const program = parse("result = 2 + 3 * 4;\n");
  assert.equal(program.statements[0].type, "AssignmentStatement");
  const statement = program.statements[0];
  if (statement.type !== "AssignmentStatement") throw new Error("unexpected AST");
  assert.equal(statement.value.type, "BinaryExpression");
  if (statement.value.type !== "BinaryExpression") throw new Error("unexpected AST");
  assert.equal(statement.value.operator, "+");
  assert.equal(statement.value.right.type, "BinaryExpression");
});

test("reports parser errors with file, line and column", () => {
  assert.throws(
    () => parse("name = \"Nexus\"\n"),
    (error: unknown) => error instanceof NoviParserError
      && error.message === "Expected ';' after assignment"
      && error.location?.filename === "parser.novi"
      && error.location.line === 2,
  );
});
