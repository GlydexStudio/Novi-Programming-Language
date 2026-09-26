import type { SourceLocation } from "../source";

export interface Program {
  readonly type: "Program";
  readonly statements: Statement[];
  readonly location: SourceLocation;
}

export type Statement =
  | AssignmentStatement
  | ExpressionStatement
  | SayStatement
  | FunctionDeclaration
  | ReturnStatement
  | CheckStatement
  | EachStatement;

export interface AssignmentStatement {
  readonly type: "AssignmentStatement";
  readonly name: string;
  readonly value: Expression;
  readonly location: SourceLocation;
}

export interface ExpressionStatement {
  readonly type: "ExpressionStatement";
  readonly expression: Expression;
  readonly location: SourceLocation;
}

export interface SayStatement {
  readonly type: "SayStatement";
  readonly expression: Expression;
  readonly location: SourceLocation;
}

export interface FunctionDeclaration {
  readonly type: "FunctionDeclaration";
  readonly name: string;
  readonly parameters: string[];
  readonly body: Statement[];
  readonly location: SourceLocation;
}

export interface ReturnStatement {
  readonly type: "ReturnStatement";
  readonly value?: Expression;
  readonly location: SourceLocation;
}

export interface CheckStatement {
  readonly type: "CheckStatement";
  readonly condition: Expression;
  readonly thenBranch: Statement[];
  readonly elseBranch?: Statement[];
  readonly location: SourceLocation;
}

export interface EachStatement {
  readonly type: "EachStatement";
  readonly variable: string;
  readonly iterable: Expression;
  readonly body: Statement[];
  readonly location: SourceLocation;
}

export type Expression =
  | LiteralExpression
  | IdentifierExpression
  | ArrayExpression
  | ObjectExpression
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | IndexExpression
  | PropertyExpression;

export interface LiteralExpression {
  readonly type: "LiteralExpression";
  readonly value: string | number | boolean | null;
  readonly location: SourceLocation;
}

export interface IdentifierExpression {
  readonly type: "IdentifierExpression";
  readonly name: string;
  readonly location: SourceLocation;
}

export interface ArrayExpression {
  readonly type: "ArrayExpression";
  readonly elements: Expression[];
  readonly location: SourceLocation;
}

export interface ObjectProperty {
  readonly name: string;
  readonly value: Expression;
  readonly location: SourceLocation;
}

export interface ObjectExpression {
  readonly type: "ObjectExpression";
  readonly properties: ObjectProperty[];
  readonly location: SourceLocation;
}

export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "=="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "and"
  | "or";

export interface BinaryExpression {
  readonly type: "BinaryExpression";
  readonly left: Expression;
  readonly operator: BinaryOperator;
  readonly right: Expression;
  readonly location: SourceLocation;
}

export type UnaryOperator = "-" | "not" | "!";

export interface UnaryExpression {
  readonly type: "UnaryExpression";
  readonly operator: UnaryOperator;
  readonly operand: Expression;
  readonly location: SourceLocation;
}

export interface CallExpression {
  readonly type: "CallExpression";
  readonly callee: Expression;
  readonly arguments: Expression[];
  readonly location: SourceLocation;
}

export interface IndexExpression {
  readonly type: "IndexExpression";
  readonly target: Expression;
  readonly index: Expression;
  readonly location: SourceLocation;
}

export interface PropertyExpression {
  readonly type: "PropertyExpression";
  readonly target: Expression;
  readonly name: string;
  readonly location: SourceLocation;
}
