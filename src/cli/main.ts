#!/usr/bin/env node
const { readFileSync }: { readFileSync(path: string, encoding: string): string } = require("node:fs");
const { resolve }: { resolve(path: string): string } = require("node:path");
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { Interpreter } from "../interpreter/interpreter";
import { NoviError } from "../errors";
import { NOVI_VERSION } from "../version";

function printHelp(): void {
  console.log(`Novi Programming Language ${NOVI_VERSION}\n\nUsage:\n  novi <file.novi>\n  novi --help\n  novi --version\n\nOptions:\n  --help       Show this help message\n  --version    Show the Novi version`);
}

function main(argv: string[]): number {
  const args = argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return 0;
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`Novi ${NOVI_VERSION}`);
    return 0;
  }

  if (args.length !== 1) {
    console.error("Novi Error: Expected exactly one .novi source file. Use 'novi --help' for usage.");
    return 64;
  }

  const filename = resolve(args[0]);
  let source: string;
  try {
    source = readFileSync(filename, "utf8");
  } catch {
    console.error(`Novi Error: Could not read file '${args[0]}'`);
    return 66;
  }

  try {
    const tokens = new Lexer(source, args[0]).tokenize();
    const program = new Parser(tokens, args[0]).parse();
    new Interpreter().execute(program);
    return 0;
  } catch (error) {
    if (error instanceof NoviError) {
      console.error(error.format());
      return 1;
    }
    console.error(`Novi Error: Internal error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

process.exitCode = main(process.argv);
