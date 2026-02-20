'use strict';

const { runCode } = require('./runner');

/**
 * Run a list of test cases and return results for each.
 * @param {object} opts
 * @param {string} opts.language
 * @param {string} opts.code
 * @param {Array<{name, input, expectedOutput}>} opts.testCases
 * @param {number} [opts.timeLimitMs]
 * @param {number} [opts.memoryLimitMb]
 * @param {object} [opts.toolchain]
 * @param {boolean} [opts.usacoMode]
 * @param {string} [opts.usacoProblem]
 * @param {boolean} [opts.usacoUseFileInput]
 * @returns {Promise<Array<{name, passed, input, expectedOutput, actualOutput, stderr, timeMs, timedOut}>>}
 */
async function runTestCases({
  language,
  code,
  testCases,
  timeLimitMs = 5000,
  memoryLimitMb = 256,
  toolchain = {},
  usacoMode = false,
  usacoProblem = 'problem',
  usacoUseFileInput = true,
}) {
  const results = [];

  for (const tc of testCases) {
    const result = await runCode({
      language,
      code,
      input: tc.input,
      timeLimitMs,
      memoryLimitMb,
      toolchain,
      usacoMode,
      usacoProblem,
      usacoUseFileInput,
    });

    const actual = normalizeOutput(result.stdout);
    const expected = normalizeOutput(tc.expectedOutput || '');

    results.push({
      name: tc.name || 'Test',
      passed: !result.compileError && !result.timedOut && actual === expected,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: result.stdout,
      stderr: result.stderr,
      timeMs: result.timeMs,
      timedOut: result.timedOut,
      compileError: result.compileError,
      exitCode: result.exitCode,
    });

    // If compile error, all tests will fail the same way
    if (result.compileError) break;
  }

  return results;
}

/**
 * Normalize output for comparison: trim trailing whitespace per line, remove trailing newlines.
 */
function normalizeOutput(str) {
  return (str || '')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trimEnd();
}

module.exports = { runTestCases };
