import { NoviRuntimeError } from "../errors";
import type { SourceLocation } from "../source";
import type { NoviValue } from "./value";

export class Environment {
  private readonly values = new Map<string, NoviValue>();

  public constructor(public readonly parent?: Environment) {}

  public define(name: string, value: NoviValue): void {
    this.values.set(name, value);
  }

  public get(name: string, location?: SourceLocation): NoviValue {
    if (this.values.has(name)) {
      return this.values.get(name)!;
    }
    if (this.parent) {
      return this.parent.get(name, location);
    }
    throw new NoviRuntimeError(`Undefined variable '${name}'`, location);
  }

  public assign(name: string, value: NoviValue, location?: SourceLocation): void {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return;
    }
    if (this.parent) {
      this.parent.assign(name, value, location);
      return;
    }
    this.values.set(name, value);
  }

  public hasLocal(name: string): boolean {
    return this.values.has(name);
  }
}
