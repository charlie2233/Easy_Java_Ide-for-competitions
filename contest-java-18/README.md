# Java Contest Workspace

This workspace is set up for an 18-problem Java contest.

## Layout

- `p01` to `p18`: one folder per problem
- `template/Main.java`: clean starter template
- `run.sh`: compile and run a problem from the terminal

## Quick Start

If you are using Cursor, open this folder directly:

- `/Users/hanfei/Easy_Java_Ide-for-competitions/contest-java-18`

If you want the full app instead, from the repo root:

```bash
npm start
```

Then open one of these files in the app:

- `contest-java-18/p01/Main.java`
- `contest-java-18/p02/Main.java`
- ...
- `contest-java-18/p18/Main.java`

## Cursor Workflow

Open `contest-java-18` as the workspace root in Cursor.

Then:

- Work in `p01/Main.java` to `p18/Main.java`
- Press `Cmd+Shift+B` to run the active problem
- The task uses `input.txt` automatically if it exists in that problem folder
- Use `Run Task` -> `Run current tester` to run `MainTest.java`
- If `expected.txt` exists, the tester prints `PASS` or `FAIL`

Example:

- edit `p04/Main.java`
- put sample input into `p04/input.txt`
- press `Cmd+Shift+B`

## Tester Files

Each problem folder can have:

- `Main.java`: your contest solution
- `MainTest.java`: a very simple local tester
- `input.txt`: sample input for quick testing
- `expected.txt`: optional expected output for auto-checking

The tester is intentionally basic:

- it reads `input.txt`
- it runs `Main.main(...)`
- it prints the output
- if `expected.txt` exists, it compares and reports `PASS` or `FAIL`

There is also a ready-made example in `demo/`:

- `demo/input.txt`
- `demo/expected.txt`
- `demo/Main.java`
- `demo/MainTest.java`

## Terminal Run

From this folder:

```bash
./run.sh p01
```

If `p01/input.txt` exists, `run.sh` uses it automatically.
Otherwise it reads from standard input.

You can also pass a custom input file:

```bash
./run.sh p01 sample.txt
```

To run the tester from the terminal:

```bash
./test.sh p01
```

## Reset A File

If you want a clean copy of the starter template, copy `template/Main.java`
over any `pXX/Main.java` file. You can do the same with `template/MainTest.java`
for the tester.
