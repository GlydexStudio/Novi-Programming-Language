import type { FunctionDeclaration } from "../ast/nodes";
import type { Environment } from "./environment";

export type NoviValue =
  | NoviNone
  | NoviString
  | NoviNumber
  | NoviBoolean
  | NoviArray
  | NoviObject
  | NoviFunction;

export type NoviPrimitive = NoviNone | NoviString | NoviNumber | NoviBoolean;

export interface NoviCallable {
  readonly kind: "function";
  readonly name: string;
  readonly arity: number;
  call(args: NoviValue[]): NoviValue;
}

export interface NoviNone {
  readonly kind: "none";
}

export interface NoviString {
  readonly kind: "string";
  readonly value: string;
}

export interface NoviNumber {
  readonly kind: "number";
  readonly value: number;
}

export interface NoviBoolean {
  readonly kind: "boolean";
  readonly value: boolean;
}

export interface NoviArray {
  readonly kind: "array";
  readonly elements: NoviValue[];
}

export interface NoviObject {
  readonly kind: "object";
  readonly properties: Map<string, NoviValue>;
}

export interface NoviFunction extends NoviCallable {
  readonly declaration: FunctionDeclaration;
  readonly closure: Environment;
}

export const NOVI_NONE: NoviNone = Object.freeze({ kind: "none" });

export function noviString(value: string): NoviString {
  return { kind: "string", value };
}

export function noviNumber(value: number): NoviNumber {
  return { kind: "number", value };
}

export function noviBoolean(value: boolean): NoviBoolean {
  return { kind: "boolean", value };
}

export function noviArray(elements: NoviValue[]): NoviArray {
  return { kind: "array", elements };
}

export function noviObject(properties?: Map<string, NoviValue>): NoviObject {
  return { kind: "object", properties: properties ?? new Map() };
}

export function displayValue(value: NoviValue): string {
  switch (value.kind) {
    case "none":
      return "none";
    case "string":
      return value.value;
    case "number":
      return Number.isInteger(value.value) ? String(value.value) : String(value.value);
    case "boolean":
      return value.value ? "yes" : "no";
    case "array":
      return `[${value.elements.map(displayValue).join(", ")}]`;
    case "object":
      return `{${[...value.properties.entries()].map(([key, item]) => `${key} = ${displayValue(item)}`).join("; ")}}`;
    case "function":
      return `<function ${value.name}>`;
  }
}

export function isTruthy(value: NoviValue): boolean {
  switch (value.kind) {
    case "none": return false;
    case "boolean": return value.value;
    case "number": return value.value !== 0;
    case "string": return value.value.length > 0;
    case "array": return true;
    case "object": return true;
    case "function": return true;
  }
}
