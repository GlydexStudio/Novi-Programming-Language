const test: (name: string, fn: () => void) => void = require("node:test");
const assert: any = require("node:assert/strict");
import { NoviRuntimeError } from "../src/errors";
import { run } from "./helpers";


test("executes assignments, arithmetic and variables", () => {
  assert.deepEqual(run(`a = 10; b = 5; sum = a + b; product = a * b; remainder = a % b; say sum; say product; say remainder;`), ["15", "50", "0"]);
});

test("concatenates strings", () => {
  assert.deepEqual(run(`name = "Glydex"; message = "Hello " + name; say message;`), ["Hello Glydex"]);
});

test("calls functions with parameters and returns values", () => {
  assert.deepEqual(run(`add(a, b) { return a + b; } result = add(5, 10); say result;`), ["15"]);
});

test("supports zero-parameter functions", () => {
  assert.deepEqual(run(`hello() { say "Hello"; } hello();`), ["Hello"]);
});

test("executes check and otherwise", () => {
  assert.deepEqual(run(`age = 17; check(age >= 18) { say "Adult"; } otherwise { say "Minor"; }`), ["Minor"]);
});

test("executes each over arrays", () => {
  assert.deepEqual(run(`users = ["Nexus", "Lyra", "Dante"]; each(user in users) { say user; }`), ["Nexus", "Lyra", "Dante"]);
});

test("supports array indexing and length", () => {
  assert.deepEqual(run(`users = ["Nexus", "Lyra"]; say users[0]; say users.length;`), ["Nexus", "2"]);
});

test("supports objects, properties and string indexing", () => {
  assert.deepEqual(run(`user = { name = "Nexus"; age = 2; }; say user.name; say user["age"];`), ["Nexus", "2"]);
});

test("supports logical operators and unary not", () => {
  assert.deepEqual(run(`value = yes and not no; check(value or no) { say "ok"; }`), ["ok"]);
});

test("raises Novi runtime errors for missing variables", () => {
  assert.throws(
    () => run("say missing;"),
    (error: unknown) => error instanceof NoviRuntimeError && error.message === "Undefined variable 'missing'",
  );
});

test("raises Novi runtime errors for invalid array access", () => {
  assert.throws(
    () => run("values = [1]; say values[2];"),
    (error: unknown) => error instanceof NoviRuntimeError && error.message.includes("out of range"),
  );
});

test("rejects return outside functions", () => {
  assert.throws(
    () => run("return 1;"),
    (error: unknown) => error instanceof NoviRuntimeError && error.message === "'return' can only be used inside a function",
  );
});
