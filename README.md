# Novi Programming Language

Novi is an independent programming language created by **Glydex Studio**. It is an early **developer preview (v0.1.x)** focused on a clean language pipeline and a small, understandable core.

Novi is not a clone of Python, JavaScript, TypeScript, C, Java, Rust, or another existing language. The project has its own lexer, parser, abstract syntax tree, runtime values, environments, interpreter, diagnostics, and command-line interface.

## Philosophy

Novi starts small on purpose:

- readable syntax with `;` terminated statements and `{ }` blocks;
- explicit language constructs such as `say`, `check`, and `each`;
- a real source-to-AST-to-runtime pipeline;
- clear runtime and parser errors with source positions;
- an implementation that can evolve without replacing the interpreter with generated JavaScript.

## Current features

Novi v0.1.0 currently implements:

- dynamically typed variables;
- strings, numbers, booleans (`yes` / `no`) and `none`;
- `say` output;
- arithmetic and operator precedence;
- string concatenation;
- functions with parameters and `return`;
- `check` / `otherwise` conditions;
- `each` loops over arrays;
- arrays and indexing;
- objects with Novi-native properties;
- property access and `.length` for arrays and strings;
- logical operators `and`, `or`, and unary `not`;
- lexer, recursive-descent parser, AST and interpreter diagnostics;
- the `novi` CLI;
- automated lexer, parser and interpreter tests.

## Installation

Novi currently targets Node.js and TypeScript for its implementation.

Clone or download the project, then install development dependencies:

```bash
npm install
npm run build
```

The CLI entry point is `dist/src/cli/main.js`, and the package exposes the command `novi` through its `bin` field.

For a local shell command after linking the package:

```bash
npm link
novi --version
```

## Your first Novi program

Create `hello.novi`:

```novi
say "Hello world from Novi!";
```

Run it:

```bash
novi hello.novi
```

Expected output:

```text
Hello world from Novi!
```

## Syntax

### Variables

```novi
name = "Nexus";
age = 19;
online = yes;
state = none;
```

### Output

```novi
say "Hello world";
say name;
```

`say` is a Novi language statement handled by the interpreter. It is not implemented as a JavaScript function injected into the parser.

### Arithmetic

```novi
a = 10;
b = 5;

sum = a + b;
difference = a - b;
product = a * b;
division = a / b;
remainder = a % b;
```

### Strings

```novi
name = "Glydex";
message = "Hello " + name;
say message;
```

### Functions

```novi
greet(name) {
    say "Hello " + name;
}

greet("Nexus");
```

Functions can return values:

```novi
add(a, b) {
    return a + b;
}

result = add(5, 10);
say result;
```

### Conditions

```novi
age = 19;

check(age >= 18) {
    say "Adult";
} otherwise {
    say "Minor";
}
```

Supported comparisons:

```text
==  !=  >  <  >=  <=
```

Logical operators:

```text
and  or  not
```

The unary `!` form of `not` is also accepted.

### Arrays

```novi
users = [
    "Nexus",
    "Lyra",
    "Dante"
];

say users[0];
say users.length;
say users;
```

### Each loops

```novi
each(user in users) {
    say user;
}
```

### Objects

Object properties use Novi's assignment syntax and end with semicolons:

```novi
user = {
    name = "Nexus";
    age = 2;
};

say user.name;
say user["name"];
```

`.length` is available on arrays and strings.

## CLI

```bash
novi file.novi
novi --help
novi --version
```

On language errors, the CLI reports a Novi error with the source filename, line and column and exits with a non-zero status.

## Project structure

```text
novi-language/
├── examples/
│   ├── hello.novi
│   ├── variables.novi
│   ├── functions.novi
│   ├── conditions.novi
│   ├── loops.novi
│   ├── arrays.novi
│   └── objects.novi
├── src/
│   ├── ast/
│   │   └── nodes.ts
│   ├── cli/
│   │   └── main.ts
│   ├── interpreter/
│   │   └── interpreter.ts
│   ├── lexer/
│   │   └── lexer.ts
│   ├── parser/
│   │   └── parser.ts
│   ├── runtime/
│   │   ├── environment.ts
│   │   └── value.ts
│   ├── errors.ts
│   ├── index.ts
│   ├── source.ts
│   ├── token.ts
│   └── version.ts
├── tests/
│   ├── helpers.ts
│   ├── interpreter.test.ts
│   ├── lexer.test.ts
│   └── parser.test.ts
├── CHANGELOG.md
├── LICENSE
├── package.json
├── README.md
└── tsconfig.json
```

The execution pipeline is:

```text
Novi source
    ↓
Lexer
    ↓
Tokens
    ↓
Parser
    ↓
AST
    ↓
Interpreter
    ↓
Novi Runtime
    ↓
Output
```

## Development

Build the implementation:

```bash
npm run build
```

Run the automated test suite:

```bash
npm test
```

The test suite executes Novi programs and covers tokenization, AST construction, arithmetic, strings, variables, functions, returns, conditions, arrays, loops, objects, property access, parser errors and runtime errors.

## Examples

The `examples/` directory contains runnable `.novi` programs for the v0.1 language core.

```bash
novi examples/hello.novi
novi examples/variables.novi
novi examples/functions.novi
novi examples/conditions.novi
novi examples/loops.novi
novi examples/arrays.novi
novi examples/objects.novi
```

## Roadmap

### v0.1.x
Core interpreter and language foundations.

### v0.2.x
Better standard library and additional language features.

### v0.3.x
Modules and imports.

### v0.4.x
Bytecode and virtual-machine research.

### v1.0.x
A stable language specification and a mature implementation.

These roadmap items are future work and are not part of the current v0.1.0 implementation.

## License

Novi is released under the MIT License. See [`LICENSE`](LICENSE).

## Developer

**Glydex Studio**

Novi Programming Language — early developer preview, v0.1.0.
