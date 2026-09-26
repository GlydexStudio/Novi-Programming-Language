export interface SourcePosition {
  readonly line: number;
  readonly column: number;
}

export interface SourceLocation extends SourcePosition {
  readonly filename?: string;
}

export interface LocatedNode {
  readonly location: SourceLocation;
}
