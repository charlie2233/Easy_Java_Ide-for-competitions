'use strict';

/**
 * Tests for the code runner (Java, C++, Python) and test runner.
 * Run with: node tests/runner.test.js
 */

const { runCode } = require('../src/main/runner');
const { runTestCases } = require('../src/main/test-runner');
const { detectBundles } = require('../src/main/bundle-manager');
const { importVSCodeExtensionFolder } = require('../src/main/vscode-importer');
const { importVSIXFile } = require('../src/main/vsix-importer');
const { parseProblemSamplesFromHtml } = require('../src/main/problem-fetcher');
const { listWorkspaceTree } = require('../src/main/workspace-manager');
const { buildSubmissionTargets } = require('../src/main/submission-helper');
const AdmZip = require('adm-zip');
const fs = require('fs');
const os = require('os');
const path = require('path');

let passed = 0;
let failed = 0;
const tests = [];

function test(name, fn) { tests.push({ name, fn }); }

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`${msg || 'Not equal'}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ─── Java Tests ─────────────────────────────────────────────────────────────
test('Java: Hello World', async () => {
  const result = await runCode({
    language: 'java',
    code: 'public class Main { public static void main(String[] args) { System.out.println("Hello, World!"); } }',
    input: '',
  });
  assert(!result.compileError, 'Should not have compile error');
  assertEqual(result.exitCode, 0, 'Exit code');
  assert(result.stdout.trim() === 'Hello, World!', `Expected "Hello, World!", got "${result.stdout.trim()}"`);
});

test('Java: Reading input', async () => {
  const code = [
    'import java.util.Scanner;',
    'public class Main {',
    '  public static void main(String[] args) {',
    '    Scanner sc = new Scanner(System.in);',
    '    int a = sc.nextInt(), b = sc.nextInt();',
    '    System.out.println(a + b);',
    '  }',
    '}',
  ].join('\n');
  const result = await runCode({ language: 'java', code, input: '3 7' });
  assert(!result.compileError, 'Should compile');
  assertEqual(result.stdout.trim(), '10', 'Sum output');
});

test('Java: Compile error is detected', async () => {
  const result = await runCode({
    language: 'java',
    code: 'public class Main { public static void main() { int x = ; } }',
    input: '',
  });
  assert(result.compileError, 'Should detect compile error');
  assert(result.exitCode !== 0, 'Non-zero exit code');
});

test('Java: Time limit detected', async () => {
  const code = 'public class Main { public static void main(String[] args) throws Exception { while(true){} } }';
  const result = await runCode({ language: 'java', code, input: '', timeLimitMs: 800 });
  assert(result.timedOut, 'Should time out');
});

// ─── C++ Tests ───────────────────────────────────────────────────────────────
test('C++: Hello World', async () => {
  const code = '#include<iostream>\nusing namespace std;\nint main(){cout<<"Hello, C++!"<<endl;return 0;}';
  const result = await runCode({ language: 'cpp', code, input: '' });
  assert(!result.compileError, 'Should compile');
  assertEqual(result.stdout.trim(), 'Hello, C++!', 'C++ output');
});

test('C++: Reading input', async () => {
  const code = '#include<iostream>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a+b<<endl;}';
  const result = await runCode({ language: 'cpp', code, input: '10 20' });
  assertEqual(result.stdout.trim(), '30', 'C++ sum');
});

test('C++: Compile error detected', async () => {
  const result = await runCode({ language: 'cpp', code: 'int main(){int x=;return 0;}', input: '' });
  assert(result.compileError, 'Should detect compile error');
});

// ─── Python Tests ─────────────────────────────────────────────────────────────
test('Python: Hello World', async () => {
  const result = await runCode({ language: 'python', code: 'print("Hello, Python!")', input: '' });
  assert(!result.compileError, 'No compile error');
  assertEqual(result.stdout.trim(), 'Hello, Python!', 'Python output');
});

test('Python: Reading input', async () => {
  const code = 'a, b = map(int, input().split())\nprint(a + b)';
  const result = await runCode({ language: 'python', code, input: '5 15' });
  assertEqual(result.stdout.trim(), '20', 'Python sum');
});

// ─── Test Runner Tests ────────────────────────────────────────────────────────
test('Test runner: all pass', async () => {
  const code = '#include<iostream>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a+b;}';
  const results = await runTestCases({
    language: 'cpp',
    code,
    testCases: [
      { name: 'TC1', input: '1 2', expectedOutput: '3' },
      { name: 'TC2', input: '10 20', expectedOutput: '30' },
    ],
  });
  assertEqual(results.length, 2, 'Should have 2 results');
  assert(results[0].passed, 'TC1 should pass');
  assert(results[1].passed, 'TC2 should pass');
});

test('Test runner: detect wrong answer', async () => {
  const code = '#include<iostream>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a-b;}';
  const results = await runTestCases({
    language: 'cpp',
    code,
    testCases: [{ name: 'TC1', input: '5 3', expectedOutput: '8' }],
  });
  assert(!results[0].passed, 'Should detect wrong answer');
});

test('Test runner: output normalization', async () => {
  const code = '#include<iostream>\nusing namespace std;\nint main(){cout<<"hello   "<<endl;}';
  const results = await runTestCases({
    language: 'cpp',
    code,
    testCases: [{ name: 'TC1', input: '', expectedOutput: 'hello' }],
  });
  assert(results[0].passed, 'Should pass despite trailing spaces');
});

// ─── Bundle Manager Tests ─────────────────────────────────────────────────────
test('detectBundles returns correct structure', async () => {
  const result = await detectBundles();
  assert(typeof result.java === 'object', 'java key exists');
  assert(typeof result.cpp === 'object', 'cpp key exists');
  assert(typeof result.python === 'object', 'python key exists');
  assert(typeof result.java.available === 'boolean', 'java.available is boolean');
  assert(typeof result.java.status === 'string', 'java.status is string');
  assert(result.java.available, 'Java should be available (status: ' + result.java.status + ')');
  assert(result.cpp.available, 'C++ should be available (status: ' + result.cpp.status + ')');
});

// ─── VSCode Importer Tests ────────────────────────────────────────────────────
test('VSCode importer: imports Java/C++/Python snippets from unpacked extension', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'compide-vscode-test-'));
  try {
    const snippetsDir = path.join(tempRoot, 'snippets');
    fs.mkdirSync(snippetsDir, { recursive: true });

    fs.writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({
      name: 'sample-snippets',
      displayName: 'Sample Snippets',
      version: '1.0.0',
      contributes: {
        snippets: [
          { language: 'java', path: './snippets/java.json' },
          { language: 'cpp', path: './snippets/cpp.json' },
          { language: 'python', path: './snippets/python.json' },
        ],
      },
    }, null, 2));

    fs.writeFileSync(path.join(snippetsDir, 'java.json'), JSON.stringify({
      FastScanner: {
        prefix: 'fastio',
        body: ['BufferedReader br = new BufferedReader(new InputStreamReader(System.in));'],
        description: 'Fast Java I/O',
      },
    }, null, 2));

    fs.writeFileSync(path.join(snippetsDir, 'cpp.json'), JSON.stringify({
      Main: {
        prefix: 'cpmain',
        body: ['int main(){', '    ios::sync_with_stdio(false);', '    cin.tie(nullptr);', '}'],
        description: 'C++ main',
      },
    }, null, 2));

    fs.writeFileSync(path.join(snippetsDir, 'python.json'), JSON.stringify({
      Main: {
        prefix: ['pyfast', 'solve'],
        body: ['def solve():', '    pass', '', "if __name__ == '__main__':", '    solve()'],
        description: 'Python solve template',
      },
    }, null, 2));

    const result = importVSCodeExtensionFolder(tempRoot);
    assert(result.ok, 'Import should succeed');
    assert(result.snippetCount >= 4, 'Expected at least 4 snippets including multiple Python prefixes');
    assert(result.snippetsByLanguage.java.length >= 1, 'Java snippets imported');
    assert(result.snippetsByLanguage.cpp.length >= 1, 'C++ snippets imported');
    assert(result.snippetsByLanguage.python.length >= 2, 'Python snippets imported');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('VSIX importer: imports snippets from .vsix package', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'compide-vsix-test-'));
  try {
    const extensionDir = path.join(tempRoot, 'extension');
    const snippetsDir = path.join(extensionDir, 'snippets');
    fs.mkdirSync(snippetsDir, { recursive: true });

    fs.writeFileSync(path.join(extensionDir, 'package.json'), JSON.stringify({
      name: 'vsix-sample',
      version: '1.0.0',
      contributes: {
        snippets: [{ language: 'java', path: './snippets/java.json' }],
      },
    }, null, 2));

    fs.writeFileSync(path.join(snippetsDir, 'java.json'), JSON.stringify({
      Main: {
        prefix: 'main',
        body: ['public class Main {', '  public static void main(String[] args) {}', '}'],
      },
    }, null, 2));

    const vsixPath = path.join(tempRoot, 'sample.vsix');
    const zip = new AdmZip();
    zip.addLocalFolder(extensionDir, 'extension');
    zip.writeZip(vsixPath);

    const imported = importVSIXFile(vsixPath);
    assert(imported.ok, imported.error || 'VSIX import should succeed');
    assertEqual(imported.extension.sourceType, 'vsix', 'Should mark extension source type');
    assert(imported.snippetsByLanguage.java.length >= 1, 'Java snippet should be imported');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

// ─── Workspace / Submission / Problem Fetcher Tests ─────────────────────────
test('Workspace manager: lists files and directories', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compide-workspace-'));
  try {
    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(path.join(root, 'src', 'Main.java'), 'public class Main {}');
    const result = listWorkspaceTree(root, { maxDepth: 4, maxNodes: 200, ignoreHidden: true });
    assert(result.ok, 'Tree listing should succeed');
    assert(result.tree && result.tree.type === 'dir', 'Root should be dir node');
    const srcNode = result.tree.children.find((node) => node.name === 'src');
    assert(srcNode && srcNode.type === 'dir', 'src dir should exist');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Submission helper: builds Codeforces and USACO links', async () => {
  const cf = buildSubmissionTargets({ platform: 'codeforces', contestId: '2000', problemIndex: 'a' });
  assert(cf.ok, 'Codeforces target should build');
  assertEqual(cf.problemUrl, 'https://codeforces.com/contest/2000/problem/A', 'Codeforces problem URL');

  const usaco = buildSubmissionTargets({ platform: 'usaco', cpid: '1234' });
  assert(usaco.ok, 'USACO target should build');
  assert(usaco.problemUrl.includes('cpid=1234'), 'USACO cpid URL');
});

test('Problem fetcher parser: extracts sample tests from HTML', async () => {
  const html = `
    <html>
      <head><title>Sample Problem</title></head>
      <body>
        <div class="input"><pre>2 3</pre></div>
        <div class="output"><pre>5</pre></div>
        <div class="input"><pre>10 20</pre></div>
        <div class="output"><pre>30</pre></div>
      </body>
    </html>
  `;
  const parsed = parseProblemSamplesFromHtml(html, 'https://codeforces.com/contest/1/problem/A');
  assert(parsed.ok, 'Parser should succeed');
  assertEqual(parsed.source, 'codeforces', 'Source detection');
  assertEqual(parsed.testCases.length, 2, 'Should parse two samples');
  assertEqual(parsed.testCases[1].expectedOutput, '30', 'Second expected output');
});

// ─── Run All ──────────────────────────────────────────────────────────────────
async function main() {
  const groups = [
    { name: 'Java Runner', prefix: 'Java' },
    { name: 'C++ Runner', prefix: 'C++' },
    { name: 'Python Runner', prefix: 'Python' },
    { name: 'Test Runner', prefix: 'Test runner' },
    { name: 'Bundle Manager', prefix: 'detectBundles' },
    { name: 'VSCode Importer', prefix: 'VSCode importer' },
    { name: 'VSIX Importer', prefix: 'VSIX importer' },
    { name: 'Workspace / Submit / Fetch', prefix: 'Workspace manager' },
    { name: 'Workspace / Submit / Fetch', prefix: 'Submission helper' },
    { name: 'Workspace / Submit / Fetch', prefix: 'Problem fetcher parser' },
  ];

  for (const group of groups) {
    const groupTests = tests.filter(t => t.name.startsWith(group.prefix));
    if (groupTests.length === 0) continue;
    console.log(`\n${group.name}:`);
    for (const { name, fn } of groupTests) {
      try {
        await fn();
        console.log(`  ✓ ${name}`);
        passed++;
      } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.message}`);
        failed++;
      }
    }
  }

  console.log('\n' + '─'.repeat(40));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
