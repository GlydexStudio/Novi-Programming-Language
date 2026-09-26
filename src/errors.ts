import type { SourceLocation } from "./source";

export class NoviError extends Error {
  public readonly kind: string;
  public readonly location?: SourceLocation;

  public constructor(kind: string, message: string, location?: SourceLocation) {
    super(message);
    this.name = kind;
    this.kind = kind;
    this.location = location;
  }

  public format(): string {
    const where = this.location
      ? `\n  at ${this.location.filename ?? "<source>"}:${this.location.line}:${this.location.column}`
      : "";
    return `Novi Error: ${this.message}${where}`;
  }
}

export class NoviLexerError extends NoviError {
  public constructor(message: string, location?: SourceLocation) {
    super("NoviLexerError", message, location);
  }
}

export class NoviParserError extends NoviError {
  public constructor(message: string, location?: SourceLocation) {
    super("NoviParserError", message, location);
  }
}

export class NoviRuntimeError extends NoviError {
  public constructor(message: string, location?: SourceLocation) {
    super("NoviRuntimeError", message, location);
  }
}

export class NoviInternalError extends NoviError {
  public constructor(message: string, location?: SourceLocation) {
    super("NoviInternalError", message, location);
  }
}
