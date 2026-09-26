import { NoviLexerError } from "../errors";
import { KEYWORDS, TokenType, type Token } from "../token";
import type { SourceLocation } from "../source";

export class Lexer {
  private readonly source: string;
  private readonly filename?: string;
  private readonly tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private tokenStartLine = 1;
  private tokenStartColumn = 1;

  public constructor(source: string, filename?: string) {
    this.source = source;
    this.filename = filename;
  }

  public tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.tokenStartLine = this.line;
      this.tokenStartColumn = this.column;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: "",
      literal: undefined,
      location: this.location(),
    });
    return this.tokens;
  }

  private scanToken(): void {
    const character = this.advance();

    switch (character) {
      case "(": return this.addToken(TokenType.LeftParen);
      case ")": return this.addToken(TokenType.RightParen);
      case "[": return this.addToken(TokenType.LeftBracket);
      case "]": return this.addToken(TokenType.RightBracket);
      case "{": return this.addToken(TokenType.LeftBrace);
      case "}": return this.addToken(TokenType.RightBrace);
      case ",": return this.addToken(TokenType.Comma);
      case ";": return this.addToken(TokenType.Semicolon);
      case ".": return this.addToken(TokenType.Dot);
      case "+": return this.addToken(TokenType.Plus);
      case "-": return this.addToken(TokenType.Minus);
      case "*": return this.addToken(TokenType.Star);
      case "%": return this.addToken(TokenType.Percent);
      case "=": return this.addToken(this.match("=") ? TokenType.EqualEqual : TokenType.Equal);
      case "!": return this.addToken(this.match("=") ? TokenType.BangEqual : TokenType.Bang);
      case ">": return this.addToken(this.match("=") ? TokenType.GreaterEqual : TokenType.Greater);
      case "<": return this.addToken(this.match("=") ? TokenType.LessEqual : TokenType.Less);
      case "/":
        return this.addToken(TokenType.Slash);
      case "#":
        this.skipComment();
        return;
      case " ":
      case "\r":
      case "\t":
        return;
      case "\n":
        this.line += 1;
        this.column = 1;
        return;
      case '"':
        return this.string();
      default:
        if (this.isDigit(character)) {
          this.number();
          return;
        }
        if (this.isIdentifierStart(character)) {
          this.identifier();
          return;
        }
        throw new NoviLexerError(
          `Unexpected character '${character}'`,
          this.location(this.tokenStartLine, this.tokenStartColumn),
        );
    }
  }

  private skipComment(): void {
    while (!this.isAtEnd() && this.peek() !== "\n") {
      this.advance();
    }
  }

  private identifier(): void {
    while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
      this.advance();
    }

    const text = this.source.slice(this.start, this.current);
    const keyword = KEYWORDS[text];
    this.addToken(keyword ?? TokenType.Identifier);
  }

  private number(): void {
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance();
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const raw = this.source.slice(this.start, this.current);
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new NoviLexerError(
        `Invalid number '${raw}'`,
        this.location(this.tokenStartLine, this.tokenStartColumn),
      );
    }
    this.addToken(TokenType.Number, value);
  }

  private string(): void {
    let value = "";

    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === "\n") {
        this.advance();
        this.line += 1;
        this.column = 1;
        value += "\n";
        continue;
      }

      if (this.peek() === "\\") {
        this.advance();
        if (this.isAtEnd()) {
          break;
        }
        const escaped = this.advance();
        switch (escaped) {
          case "n": value += "\n"; break;
          case "r": value += "\r"; break;
          case "t": value += "\t"; break;
          case '"': value += '"'; break;
          case "\\": value += "\\"; break;
          default:
            throw new NoviLexerError(
              `Unknown string escape '\\${escaped}'`,
              this.location(this.line, this.column - 1),
            );
        }
        continue;
      }

      value += this.advance();
    }

    if (this.isAtEnd()) {
      throw new NoviLexerError(
        "Unterminated string",
        this.location(this.tokenStartLine, this.tokenStartColumn),
      );
    }

    this.advance();
    this.addToken(TokenType.String, value);
  }

  private addToken(type: TokenType, literal?: string | number): void {
    this.tokens.push({
      type,
      lexeme: this.source.slice(this.start, this.current),
      literal,
      location: this.location(this.tokenStartLine, this.tokenStartColumn),
    });
  }

  private advance(): string {
    const character = this.source[this.current] ?? "";
    this.current += 1;
    this.column += 1;
    return character;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source[this.current] !== expected) {
      return false;
    }
    this.current += 1;
    this.column += 1;
    return true;
  }

  private peek(): string {
    return this.source[this.current] ?? "\0";
  }

  private peekNext(): string {
    return this.source[this.current + 1] ?? "\0";
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private isDigit(character: string): boolean {
    return character >= "0" && character <= "9";
  }

  private isIdentifierStart(character: string): boolean {
    return /[A-Za-z_]/.test(character);
  }

  private isIdentifierPart(character: string): boolean {
    return /[A-Za-z0-9_]/.test(character);
  }

  private location(line = this.line, column = this.column): SourceLocation {
    return { filename: this.filename, line, column };
  }
}
