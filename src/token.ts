import type { SourceLocation } from "./source";

export enum TokenType {
  EOF = "EOF",
  Identifier = "Identifier",
  Number = "Number",
  String = "String",

  Say = "Say",
  Check = "Check",
  Otherwise = "Otherwise",
  Each = "Each",
  In = "In",
  Return = "Return",
  Yes = "Yes",
  No = "No",
  None = "None",
  And = "And",
  Or = "Or",
  Not = "Not",

  Plus = "Plus",
  Minus = "Minus",
  Star = "Star",
  Slash = "Slash",
  Percent = "Percent",
  Equal = "Equal",
  EqualEqual = "EqualEqual",
  Bang = "Bang",
  BangEqual = "BangEqual",
  Greater = "Greater",
  GreaterEqual = "GreaterEqual",
  Less = "Less",
  LessEqual = "LessEqual",

  LeftParen = "LeftParen",
  RightParen = "RightParen",
  LeftBracket = "LeftBracket",
  RightBracket = "RightBracket",
  LeftBrace = "LeftBrace",
  RightBrace = "RightBrace",
  Comma = "Comma",
  Semicolon = "Semicolon",
  Dot = "Dot",
}

export interface Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: string | number | undefined;
  readonly location: SourceLocation;
}

export const KEYWORDS: Readonly<Record<string, TokenType>> = {
  say: TokenType.Say,
  check: TokenType.Check,
  otherwise: TokenType.Otherwise,
  each: TokenType.Each,
  in: TokenType.In,
  return: TokenType.Return,
  yes: TokenType.Yes,
  no: TokenType.No,
  none: TokenType.None,
  and: TokenType.And,
  or: TokenType.Or,
  not: TokenType.Not,
};
