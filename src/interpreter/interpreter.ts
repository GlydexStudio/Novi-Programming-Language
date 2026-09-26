import type {
  AssignmentStatement,
  BinaryOperator,
  CheckStatement,
  EachStatement,
  Expression,
  FunctionDeclaration,
  Program,
  ReturnStatement,
  Statement,
  UnaryOperator,
} from "../ast/nodes";
import { NoviRuntimeError } from "../errors";
import type { SourceLocation } from "../source";
import { Environment } from "../runtime/environment";
import {
  NOVI_NONE,
  displayValue,
  noviArray,
  noviBoolean,
  noviNumber,
  noviObject,
  noviString,
  isTruthy,
  type NoviArray,
  type NoviFunction,
  type NoviObject,
  type NoviValue,
} from "../runtime/value";

export type OutputSink = (text: string) => void;

class ReturnSignal {
  public constructor(public readonly value: NoviValue, public readonly location: SourceLocation) {}
}

export class Interpreter {
  private readonly globals = new Environment();
  private environment = this.globals;
  private readonly output: OutputSink;

  public constructor(output: OutputSink = (text) => console.log(text)) {
    this.output = output;
  }

  public execute(program: Program): void {
    try {
      this.executeStatements(program.statements);
    } catch (error) {
      if (error instanceof ReturnSignal) {
        throw new NoviRuntimeError("'return' can only be used inside a function", error.location);
      }
      throw error;
    }
  }

  private executeStatements(statements: Statement[]): void {
    for (const statement of statements) {
      this.executeStatement(statement);
    }
  }

  private executeStatement(statement: Statement): void {
    switch (statement.type) {
      case "AssignmentStatement":
        this.executeAssignment(statement);
        return;
      case "ExpressionStatement":
        this.evaluate(statement.expression);
        return;
      case "SayStatement":
        this.output(displayValue(this.evaluate(statement.expression)));
        return;
      case "FunctionDeclaration":
        this.executeFunctionDeclaration(statement);
        return;
      case "ReturnStatement":
        this.executeReturn(statement);
        return;
      case "CheckStatement":
        this.executeCheck(statement);
        return;
      case "EachStatement":
        this.executeEach(statement);
        return;
    }
  }

  private executeAssignment(statement: AssignmentStatement): void {
    const value = this.evaluate(statement.value);
    this.environment.assign(statement.name, value, statement.location);
  }

  private executeFunctionDeclaration(statement: FunctionDeclaration): void {
    const closure = this.environment;
    const callable: NoviFunction = {
      kind: "function",
      name: statement.name,
      arity: statement.parameters.length,
      declaration: statement,
      closure,
      call: (args) => this.callFunction(statement, closure, args),
    };
    this.environment.define(statement.name, callable);
  }

  private executeReturn(statement: ReturnStatement): void {
    if (statement.value === undefined) {
      throw new ReturnSignal(NOVI_NONE, statement.location);
    }
    throw new ReturnSignal(this.evaluate(statement.value), statement.location);
  }

  private executeCheck(statement: CheckStatement): void {
    if (isTruthy(this.evaluate(statement.condition))) {
      this.executeInChildScope(statement.thenBranch);
      return;
    }
    if (statement.elseBranch) {
      this.executeInChildScope(statement.elseBranch);
    }
  }

  private executeEach(statement: EachStatement): void {
    const iterable = this.evaluate(statement.iterable);
    if (iterable.kind !== "array") {
      throw new NoviRuntimeError("'each' expects an array", statement.iterable.location);
    }

    for (const item of iterable.elements) {
      this.executeInChildScope(statement.body, (scope) => scope.define(statement.variable, item));
    }
  }

  private executeInChildScope(statements: Statement[], setup?: (scope: Environment) => void): void {
    const previous = this.environment;
    const child = new Environment(previous);
    this.environment = child;
    try {
      setup?.(child);
      this.executeStatements(statements);
    } finally {
      this.environment = previous;
    }
  }

  private callFunction(declaration: FunctionDeclaration, closure: Environment, args: NoviValue[]): NoviValue {
    if (args.length !== declaration.parameters.length) {
      throw new NoviRuntimeError(
        `Function '${declaration.name}' expected ${declaration.parameters.length} argument(s) but received ${args.length}`,
        declaration.location,
      );
    }

    const previous = this.environment;
    const functionEnvironment = new Environment(closure);
    declaration.parameters.forEach((name, index) => functionEnvironment.define(name, args[index]));
    this.environment = functionEnvironment;

    try {
      this.executeStatements(declaration.body);
    } catch (error) {
      if (error instanceof ReturnSignal) {
        return error.value;
      }
      throw error;
    } finally {
      this.environment = previous;
    }

    return NOVI_NONE;
  }

  private evaluate(expression: Expression): NoviValue {
    switch (expression.type) {
      case "LiteralExpression":
        return expression.value === null
          ? NOVI_NONE
          : typeof expression.value === "string"
            ? noviString(expression.value)
            : typeof expression.value === "number"
              ? noviNumber(expression.value)
              : noviBoolean(expression.value);

      case "IdentifierExpression":
        return this.environment.get(expression.name, expression.location);

      case "ArrayExpression":
        return noviArray(expression.elements.map((item) => this.evaluate(item)));

      case "ObjectExpression": {
        const object = noviObject();
        for (const property of expression.properties) {
          object.properties.set(property.name, this.evaluate(property.value));
        }
        return object;
      }

      case "UnaryExpression":
        return this.evaluateUnary(expression.operator, this.evaluate(expression.operand), expression.location);

      case "BinaryExpression":
        return this.evaluateBinary(
          expression.operator,
          expression.left,
          expression.right,
          expression.location,
        );

      case "CallExpression": {
        const callee = this.evaluate(expression.callee);
        if (callee.kind !== "function") {
          throw new NoviRuntimeError("Only functions can be called", expression.location);
        }
        const args = expression.arguments.map((argument) => this.evaluate(argument));
        return callee.call(args);
      }

      case "IndexExpression":
        return this.evaluateIndex(expression.target, expression.index, expression.location);

      case "PropertyExpression":
        return this.evaluateProperty(expression.target, expression.name, expression.location);
    }
  }

  private evaluateUnary(operator: UnaryOperator, value: NoviValue, location: SourceLocation): NoviValue {
    if (operator === "not" || operator === "!") {
      return noviBoolean(!isTruthy(value));
    }
    if (value.kind !== "number") {
      throw new NoviRuntimeError("Unary '-' expects a number", location);
    }
    return noviNumber(-value.value);
  }

  private evaluateBinary(operator: BinaryOperator, leftExpression: Expression, rightExpression: Expression, location: SourceLocation): NoviValue {
    if (operator === "and") {
      const left = this.evaluate(leftExpression);
      return isTruthy(left) ? noviBoolean(isTruthy(this.evaluate(rightExpression))) : noviBoolean(false);
    }
    if (operator === "or") {
      const left = this.evaluate(leftExpression);
      return isTruthy(left) ? noviBoolean(true) : noviBoolean(isTruthy(this.evaluate(rightExpression)));
    }

    const left = this.evaluate(leftExpression);
    const right = this.evaluate(rightExpression);

    switch (operator) {
      case "+":
        if (left.kind === "number" && right.kind === "number") return noviNumber(left.value + right.value);
        if (left.kind === "string" || right.kind === "string") return noviString(displayValue(left) + displayValue(right));
        throw new NoviRuntimeError("Operator '+' expects numbers or strings", location);
      case "-":
        return this.numericOperation(left, right, (a, b) => a - b, "'-'", location);
      case "*":
        return this.numericOperation(left, right, (a, b) => a * b, "'*'", location);
      case "/":
        if (right.kind === "number" && right.value === 0) {
          throw new NoviRuntimeError("Division by zero", location);
        }
        return this.numericOperation(left, right, (a, b) => a / b, "'/'", location);
      case "%":
        if (right.kind === "number" && right.value === 0) {
          throw new NoviRuntimeError("Division by zero", location);
        }
        return this.numericOperation(left, right, (a, b) => a % b, "'%'", location);
      case "==":
        return noviBoolean(this.equals(left, right));
      case "!=":
        return noviBoolean(!this.equals(left, right));
      case ">":
        return this.compare(left, right, (a, b) => a > b, location);
      case "<":
        return this.compare(left, right, (a, b) => a < b, location);
      case ">=":
        return this.compare(left, right, (a, b) => a >= b, location);
      case "<=":
        return this.compare(left, right, (a, b) => a <= b, location);
    }
  }

  private numericOperation(left: NoviValue, right: NoviValue, operation: (a: number, b: number) => number, operator: string, location: SourceLocation): NoviValue {
    if (left.kind !== "number" || right.kind !== "number") {
      throw new NoviRuntimeError(`Operator ${operator} expects numbers`, location);
    }
    return noviNumber(operation(left.value, right.value));
  }

  private compare(left: NoviValue, right: NoviValue, operation: (a: number, b: number) => boolean, location: SourceLocation): NoviValue {
    if (left.kind !== "number" || right.kind !== "number") {
      throw new NoviRuntimeError("Comparison operators expect numbers", location);
    }
    return noviBoolean(operation(left.value, right.value));
  }

  private equals(left: NoviValue, right: NoviValue): boolean {
    if (left.kind !== right.kind) return false;
    switch (left.kind) {
      case "none": return true;
      case "string": return left.value === (right as typeof left).value;
      case "number": return left.value === (right as typeof left).value;
      case "boolean": return left.value === (right as typeof left).value;
      default: return left === right;
    }
  }

  private evaluateIndex(targetExpression: Expression, indexExpression: Expression, location: SourceLocation): NoviValue {
    const target = this.evaluate(targetExpression);
    const index = this.evaluate(indexExpression);

    if (target.kind === "array") {
      if (index.kind !== "number" || !Number.isInteger(index.value)) {
        throw new NoviRuntimeError("Array index must be an integer", location);
      }
      if (index.value < 0 || index.value >= target.elements.length) {
        throw new NoviRuntimeError(`Array index ${index.value} is out of range`, location);
      }
      return target.elements[index.value];
    }

    if (target.kind === "object") {
      if (index.kind !== "string") {
        throw new NoviRuntimeError("Object index must be a string", location);
      }
      if (!target.properties.has(index.value)) {
        throw new NoviRuntimeError(`Undefined object property '${index.value}'`, location);
      }
      return target.properties.get(index.value)!;
    }

    throw new NoviRuntimeError("Only arrays and objects can be indexed", location);
  }

  private evaluateProperty(targetExpression: Expression, name: string, location: SourceLocation): NoviValue {
    const target = this.evaluate(targetExpression);
    if (target.kind === "object") {
      if (!target.properties.has(name)) {
        throw new NoviRuntimeError(`Undefined object property '${name}'`, location);
      }
      return target.properties.get(name)!;
    }
    if (name === "length" && (target.kind === "array" || target.kind === "string")) {
      return noviNumber(target.kind === "array" ? target.elements.length : target.value.length);
    }
    throw new NoviRuntimeError(`Property '${name}' is not available on ${target.kind}`, location);
  }
}
