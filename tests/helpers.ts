import { Lexer } from "../src/lexer/lexer";
import { Parser } from "../src/parser/parser";
import { Interpreter } from "../src/interpreter/interpreter";

export function run(source: string): string[] {
  const output: string[] = [];
  const tokens = new Lexer(source, "test.novi").tokenize();
  const program = new Parser(tokens, "test.novi").parse();
  new Interpreter((text) => output.push(text)).execute(program);
  return output;
}
