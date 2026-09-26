import { NoviParserError } from "../errors";
import type {
  ArrayExpression,
  AssignmentStatement,
  BinaryExpression,
  CallExpression,
  CheckStatement,
  EachStatement,
  Expression,
  ExpressionStatement,
  FunctionDeclaration,
  IdentifierExpression,
  IndexExpression,
  LiteralExpression,
  ObjectExpression,
  ObjectProperty,
  Program,
  PropertyExpression,
  ReturnStatement,
  SayStatement,
  Statement,
  UnaryExpression,
} from "../ast/nodes";
import { TokenType, type Token } from "../token";

export class Parser {
  private readonly tokens: Token[];
  private readonly filename?: string;
  private current = 0;

  public constructor(tokens: Token[], filename?: string) {
    this.tokens = tokens;
    this.filename = filename;
  }

  public parse(): Program {
    const statements: Statement[] = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }

    return {
      type: "Program",
      statements,
      location: {
        filename: this.filename,
        line: statements[0]?.location.line ?? this.peek().location.line,
        column: statements[0]?.location.column ?? this.peek().location.column,
      },
    };
  }

  private declaration(): Statement {
    if (this.check(TokenType.Identifier) && this.checkNext(TokenType.LeftParen) && this.looksLikeFunctionDeclaration()) {
      return this.functionDeclaration();
    }

    return this.statement();
  }

  private statement(): Statement {
    if (this.match(TokenType.Say)) {
      return this.sayStatement(this.previous());
    }
    if (this.match(TokenType.Return)) {
      return this.returnStatement(this.previous());
    }
    if (this.match(TokenType.Check)) {
      return this.checkStatement(this.previous());
    }
    if (this.match(TokenType.Each)) {
      return this.eachStatement(this.previous());
    }
    if (this.check(TokenType.Identifier) && this.checkNext(TokenType.Equal)) {
      return this.assignmentStatement();
    }

    const expression = this.expression();
    const location = expression.location;
    this.consume(TokenType.Semicolon, "Expected ';'");
    return { type: "ExpressionStatement", expression, location } satisfies ExpressionStatement;
  }

  private assignmentStatement(): AssignmentStatement {
    const name = this.consume(TokenType.Identifier, "Expected variable name");
    this.consume(TokenType.Equal, "Expected '=' after variable name");
    const value = this.expression();
    this.consume(TokenType.Semicolon, "Expected ';' after assignment");
    return {
      type: "AssignmentStatement",
      name: name.lexeme,
      value,
      location: name.location,
    };
  }

  private sayStatement(keyword: Token): SayStatement {
    const expression = this.expression();
    this.consume(TokenType.Semicolon, "Expected ';' after say statement");
    return { type: "SayStatement", expression, location: keyword.location };
  }

  private returnStatement(keyword: Token): ReturnStatement {
    let value: Expression | undefined;
    if (!this.check(TokenType.Semicolon)) {
      value = this.expression();
    }
    this.consume(TokenType.Semicolon, "Expected ';' after return statement");
    return { type: "ReturnStatement", value, location: keyword.location };
  }

  private checkStatement(keyword: Token): CheckStatement {
    this.consume(TokenType.LeftParen, "Expected '(' after 'check'");
    const condition = this.expression();
    this.consume(TokenType.RightParen, "Expected ')' after check condition");
    const thenBranch = this.block();

    let elseBranch: Statement[] | undefined;
    if (this.match(TokenType.Otherwise)) {
      elseBranch = this.block();
    }

    return {
      type: "CheckStatement",
      condition,
      thenBranch,
      elseBranch,
      location: keyword.location,
    };
  }

  private eachStatement(keyword: Token): EachStatement {
    this.consume(TokenType.LeftParen, "Expected '(' after 'each'");
    const variable = this.consume(TokenType.Identifier, "Expected loop variable after 'each('");
    this.consume(TokenType.In, "Expected 'in' in each loop");
    const iterable = this.expression();
    this.consume(TokenType.RightParen, "Expected ')' after each loop expression");
    const body = this.block();
    return {
      type: "EachStatement",
      variable: variable.lexeme,
      iterable,
      body,
      location: keyword.location,
    };
  }

  private functionDeclaration(): FunctionDeclaration {
    const name = this.consume(TokenType.Identifier, "Expected function name");
    this.consume(TokenType.LeftParen, "Expected '(' after function name");

    const parameters: string[] = [];
    if (!this.check(TokenType.RightParen)) {
      do {
        parameters.push(this.consume(TokenType.Identifier, "Expected parameter name").lexeme);
      } while (this.match(TokenType.Comma));
    }

    this.consume(TokenType.RightParen, "Expected ')' after function parameters");
    const body = this.block();
    return {
      type: "FunctionDeclaration",
      name: name.lexeme,
      parameters,
      body,
      location: name.location,
    };
  }

  private block(): Statement[] {
    this.consume(TokenType.LeftBrace, "Expected '{'");
    const statements: Statement[] = [];
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(TokenType.RightBrace, "Expected '}' after block");
    return statements;
  }

  private expression(): Expression {
    return this.or();
  }

  private or(): Expression {
    let expression = this.and();
    while (this.match(TokenType.Or)) {
      const operator = this.previous();
      const right = this.and();
      expression = this.binary(expression, "or", right, operator);
    }
    return expression;
  }

  private and(): Expression {
    let expression = this.equality();
    while (this.match(TokenType.And)) {
      const operator = this.previous();
      const right = this.equality();
      expression = this.binary(expression, "and", right, operator);
    }
    return expression;
  }

  private equality(): Expression {
    let expression = this.comparison();
    while (this.match(TokenType.EqualEqual, TokenType.BangEqual)) {
      const operator = this.previous();
      const right = this.comparison();
      expression = this.binary(expression, operator.type === TokenType.EqualEqual ? "==" : "!=", right, operator);
    }
    return expression;
  }

  private comparison(): Expression {
    let expression = this.term();
    while (this.match(TokenType.Greater, TokenType.GreaterEqual, TokenType.Less, TokenType.LessEqual)) {
      const operator = this.previous();
      const mapping: Record<TokenType, BinaryExpression["operator"]> = {
        [TokenType.Greater]: ">",
        [TokenType.GreaterEqual]: ">=",
        [TokenType.Less]: "<",
        [TokenType.LessEqual]: "<=",
      } as Record<TokenType, BinaryExpression["operator"]>;
      const right = this.term();
      expression = this.binary(expression, mapping[operator.type], right, operator);
    }
    return expression;
  }

  private term(): Expression {
    let expression = this.factor();
    while (this.match(TokenType.Plus, TokenType.Minus)) {
      const operator = this.previous();
      const right = this.factor();
      expression = this.binary(expression, operator.type === TokenType.Plus ? "+" : "-", right, operator);
    }
    return expression;
  }

  private factor(): Expression {
    let expression = this.unary();
    while (this.match(TokenType.Star, TokenType.Slash, TokenType.Percent)) {
      const operator = this.previous();
      const right = this.unary();
      const mapped = operator.type === TokenType.Star ? "*" : operator.type === TokenType.Slash ? "/" : "%";
      expression = this.binary(expression, mapped, right, operator);
    }
    return expression;
  }

  private unary(): Expression {
    if (this.match(TokenType.Minus, TokenType.Not, TokenType.Bang)) {
      const operator = this.previous();
      const operand = this.unary();
      const mapped = operator.type === TokenType.Minus ? "-" : operator.type === TokenType.Bang ? "!" : "not";
      return {
        type: "UnaryExpression",
        operator: mapped,
        operand,
        location: operator.location,
      } satisfies UnaryExpression;
    }
    return this.postfix();
  }

  private postfix(): Expression {
    let expression = this.primary();

    while (true) {
      if (this.match(TokenType.LeftParen)) {
        const argumentsList: Expression[] = [];
        if (!this.check(TokenType.RightParen)) {
          do {
            argumentsList.push(this.expression());
          } while (this.match(TokenType.Comma));
        }
        const closing = this.consume(TokenType.RightParen, "Expected ')' after arguments");
        expression = {
          type: "CallExpression",
          callee: expression,
          arguments: argumentsList,
          location: closing.location,
        } satisfies CallExpression;
        continue;
      }

      if (this.match(TokenType.LeftBracket)) {
        const index = this.expression();
        const closing = this.consume(TokenType.RightBracket, "Expected ']' after index");
        expression = {
          type: "IndexExpression",
          target: expression,
          index,
          location: closing.location,
        } satisfies IndexExpression;
        continue;
      }

      if (this.match(TokenType.Dot)) {
        const property = this.consume(TokenType.Identifier, "Expected property name after '.'");
        expression = {
          type: "PropertyExpression",
          target: expression,
          name: property.lexeme,
          location: property.location,
        } satisfies PropertyExpression;
        continue;
      }

      break;
    }

    return expression;
  }

  private primary(): Expression {
    if (this.match(TokenType.Number, TokenType.String)) {
      const token = this.previous();
      return {
        type: "LiteralExpression",
        value: token.literal as string | number,
        location: token.location,
      } satisfies LiteralExpression;
    }

    if (this.match(TokenType.Yes, TokenType.No, TokenType.None)) {
      const token = this.previous();
      const value = token.type === TokenType.Yes ? true : token.type === TokenType.No ? false : null;
      return { type: "LiteralExpression", value, location: token.location } satisfies LiteralExpression;
    }

    if (this.match(TokenType.Identifier)) {
      const token = this.previous();
      return { type: "IdentifierExpression", name: token.lexeme, location: token.location } satisfies IdentifierExpression;
    }

    if (this.match(TokenType.LeftParen)) {
      const expression = this.expression();
      this.consume(TokenType.RightParen, "Expected ')' after expression");
      return expression;
    }

    if (this.match(TokenType.LeftBracket)) {
      return this.arrayExpression(this.previous());
    }

    if (this.match(TokenType.LeftBrace)) {
      return this.objectExpression(this.previous());
    }

    throw this.errorAtCurrent("Expected an expression");
  }

  private arrayExpression(opening: Token): ArrayExpression {
    const elements: Expression[] = [];
    if (!this.check(TokenType.RightBracket)) {
      do {
        elements.push(this.expression());
      } while (this.match(TokenType.Comma));
    }
    this.consume(TokenType.RightBracket, "Expected ']' after array elements");
    return { type: "ArrayExpression", elements, location: opening.location };
  }

  private objectExpression(opening: Token): ObjectExpression {
    const properties: ObjectProperty[] = [];
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const name = this.consume(TokenType.Identifier, "Expected object property name");
      this.consume(TokenType.Equal, "Expected '=' after object property name");
      const value = this.expression();
      this.consume(TokenType.Semicolon, "Expected ';' after object property");
      properties.push({ name: name.lexeme, value, location: name.location });
    }
    this.consume(TokenType.RightBrace, "Expected '}' after object");
    return { type: "ObjectExpression", properties, location: opening.location };
  }

  private binary(left: Expression, operator: BinaryExpression["operator"], right: Expression, token: Token): BinaryExpression {
    return {
      type: "BinaryExpression",
      left,
      operator,
      right,
      location: token.location,
    };
  }

  private looksLikeFunctionDeclaration(): boolean {
    let index = this.current + 1;
    let depth = 0;
    while (index < this.tokens.length) {
      const type = this.tokens[index].type;
      if (type === TokenType.LeftParen) depth += 1;
      if (type === TokenType.RightParen) {
        depth -= 1;
        if (depth === 0) {
          return this.tokens[index + 1]?.type === TokenType.LeftBrace;
        }
      }
      index += 1;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.errorAtCurrent(message);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private checkNext(type: TokenType): boolean {
    return this.tokens[this.current + 1]?.type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current += 1;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private errorAtCurrent(message: string): NoviParserError {
    const token = this.peek();
    return new NoviParserError(message, {
      filename: this.filename ?? token.location.filename,
      line: token.location.line,
      column: token.location.column,
    });
  }
}
