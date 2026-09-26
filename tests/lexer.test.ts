const test: (name: string, fn: () => void) => void = require("node:test");
const assert: any = require("node:assert/strict");
import { Lexer } from "../src/lexer/lexer";
import { TokenType } from "../src/token";

 test("tokenizes Novi keywords, literals, operators and punctuation", () => {
  const source = `# comment\nname = "Nexus";\nage = 19;\ncheck(age >= 18 and online == yes) { say name; }`;
  const tokens = new Lexer(source, "main.novi").tokenize();
  const types = tokens.map((token) => token.type);

  assert.deepEqual(types, [
    TokenType.Identifier,
    TokenType.Equal,
    TokenType.String,
    TokenType.Semicolon,
    TokenType.Identifier,
    TokenType.Equal,
    TokenType.Number,
    TokenType.Semicolon,
    TokenType.Check,
    TokenType.LeftParen,
    TokenType.Identifier,
    TokenType.GreaterEqual,
    TokenType.Number,
    TokenType.And,
    TokenType.Identifier,
    TokenType.EqualEqual,
    TokenType.Yes,
    TokenType.RightParen,
    TokenType.LeftBrace,
    TokenType.Say,
    TokenType.Identifier,
    TokenType.Semicolon,
    TokenType.RightBrace,
    TokenType.EOF,
  ]);

  assert.equal(tokens[0].location.line, 2);
  assert.equal(tokens[0].location.column, 1);
  assert.equal(tokens[2].literal, "Nexus");
});

test("reports unterminated strings with source position", () => {
  assert.throws(
    () => new Lexer('say "broken;', "main.novi").tokenize(),
    (error: unknown) => error instanceof Error && error.message === "Unterminated string" && (error as { location?: { line: number; column: number } }).location?.line === 1,
  );
});
