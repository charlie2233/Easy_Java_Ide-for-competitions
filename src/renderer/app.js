'use strict';
/* global require, monaco */

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = {
  'java-usaco': `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        // Initialize Reader
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // PrintWriter pw = new PrintWriter(System.out);

        // For USACO file I/O:
        // BufferedReader br = new BufferedReader(new FileReader("problem.in"));
        // PrintWriter pw = new PrintWriter(new FileWriter("problem.out"));

        StringTokenizer st = new StringTokenizer("");
        
        // Example: Read N
        // String line = br.readLine();
        // if (line == null) return;
        // int n = Integer.parseInt(line.trim());
        
        // Solve...
        
        // pw.println(ans);
        // pw.close();
    }
}`,

  'cpp-usaco': `#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    cin >> n;
    // solve...
    cout << n << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // For USACO file I/O:
    // freopen("problem.in", "r", stdin);
    // freopen("problem.out", "w", stdout);

    solve();
    return 0;
}`,

  'java-dp': `import java.util.*;
import java.io.*;

public class Main {
    static long[] dp;

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        dp = new long[n + 1];
        Arrays.fill(dp, Long.MAX_VALUE / 2);
        dp[0] = 0;

        for (int i = 1; i <= n; i++) {
            // dp[i] = min/max over transitions
        }

        System.out.println(dp[n]);
    }
}`,

  'cpp-graph': `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 1e5 + 5;
vector<pair<int,int>> adj[MAXN]; // {neighbor, weight}
long long dist[MAXN];
bool visited[MAXN];
int n, m;

void dijkstra(int src) {
    fill(dist, dist + n + 1, LLONG_MAX);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (visited[u]) continue;
        visited[u] = true;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cin >> n >> m;
    for (int i = 0; i < m; i++) {
        int u, v, w; cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    dijkstra(1);
    cout << dist[n] << "\\n";
}`,

  'java-scanner': `import java.util.*;
import java.io.*;

public class Main {
    // Fast I/O
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;
    static StringBuilder sb = new StringBuilder();

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }
    static int nextInt() throws IOException { return Integer.parseInt(next()); }
    static long nextLong() throws IOException { return Long.parseLong(next()); }

    public static void main(String[] args) throws IOException {
        int n = nextInt();
        for (int i = 0; i < n; i++) {
            int x = nextInt();
            sb.append(x).append('\\n');
        }
        System.out.print(sb);
    }
}`,

  'cpp-segment': `#include <bits/stdc++.h>
using namespace std;

struct SegTree {
    int n;
    vector<long long> tree;
    SegTree(int n) : n(n), tree(4 * n, 0) {}

    void update(int node, int start, int end, int idx, long long val) {
        if (start == end) { tree[node] = val; return; }
        int mid = (start + end) / 2;
        if (idx <= mid) update(2*node, start, mid, idx, val);
        else            update(2*node+1, mid+1, end, idx, val);
        tree[node] = tree[2*node] + tree[2*node+1];
    }

    long long query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2*node, start, mid, l, r) + query(2*node+1, mid+1, end, l, r);
    }

    void update(int idx, long long val) { update(1, 0, n-1, idx, val); }
    long long query(int l, int r) { return query(1, 0, n-1, l, r); }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n, q; cin >> n >> q;
    SegTree seg(n);
    for (int i = 0; i < n; i++) { int x; cin >> x; seg.update(i, x); }
    while (q--) {
        int t, a, b; cin >> t >> a >> b;
        if (t == 1) seg.update(a, b);
        else cout << seg.query(a, b) << "\\n";
    }
}`,
};

// ─── State ────────────────────────────────────────────────────────────────────
let editor = null;
let settings = {};
let currentFilePath = null;
let isDirty = false;
let testCases = [];
let nextTestId = 1;
let bundlesState = null;
let gitState = null;
let importedVSCodeExtensions = [];
let importedSnippets = { java: [], cpp: [], python: [] };
let snippetProviders = [];

// ─── Boot ─────────────────────────────────────────────────────────────────────
require(['vs/editor/editor.main'], async function () {
  settings = await window.electronAPI.getSettings();
  hydrateSnippetImportsFromStorage();
  applyTheme(settings.theme);
  initEditor();
  registerSnippetProviders();
  loadInitialContent();
  wireUI();
  updateBundleStatus();
  refreshGitStatus();
  loadRecentFiles();
  loadTestCasesFromStorage();
  renderImportedExtensions();
});

// ─── Monaco Editor ────────────────────────────────────────────────────────────
function initEditor() {
  const monacoTheme = settings.theme === 'light' ? 'vs' : settings.theme === 'hc-black' ? 'hc-black' : 'vs-dark';

  editor = monaco.editor.create(document.getElementById('monaco-editor'), {
    value: '',
    language: langToMonaco(settings.language || 'java'),
    theme: monacoTheme,
    fontSize: settings.fontSize || 14,
    tabSize: settings.tabSize || 4,
    lineNumbers: settings.showLineNumbers !== false ? 'on' : 'off',
    wordWrap: settings.wordWrap ? 'on' : 'off',
    minimap: { enabled: settings.minimap || false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Menlo', monospace",
    fontLigatures: true,
    renderWhitespace: 'selection',
    smoothScrolling: true,
    cursorSmoothCaretAnimation: 'on',
    bracketPairColorization: { enabled: true },
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: { other: true, comments: false, strings: false },
  });

  // Track dirty state
  editor.onDidChangeModelContent(() => { isDirty = true; updateTitle(); });

  // Cmd+Enter to run
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runCode());
  // Cmd+S to save
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveFile());

  // Auto-resize on window resize
  window.addEventListener('resize', () => editor.layout());
}

function langToMonaco(lang) {
  return { java: 'java', cpp: 'cpp', python: 'python' }[lang] || 'java';
}

function setEditorLanguage(lang) {
  if (!editor) return;
  const model = editor.getModel();
  if (model) monaco.editor.setModelLanguage(model, langToMonaco(lang));
}

// ─── Initial Content ──────────────────────────────────────────────────────────
function loadInitialContent() {
  const lang = settings.language || 'java';
  const templateKey = lang === 'java' ? 'java-usaco' : lang === 'cpp' ? 'cpp-usaco' : null;
  if (templateKey) {
    editor.setValue(TEMPLATES[templateKey]);
  }
  updateLangBadge(lang);
  document.getElementById('lang-select').value = lang;
  updateTitle();
}

// ─── UI Wiring ────────────────────────────────────────────────────────────────
function wireUI() {
  // Titlebar buttons
  document.getElementById('btn-run').addEventListener('click', runCode);
  document.getElementById('btn-run-input').addEventListener('click', () => { switchTab('input'); runCodeWithInput(); });
  document.getElementById('btn-run-tests').addEventListener('click', runAllTests);
  document.getElementById('btn-stop').addEventListener('click', stopRun);
  document.getElementById('btn-settings').addEventListener('click', openSettings);

  // Editor toolbar
  document.getElementById('btn-open').addEventListener('click', openFile);
  document.getElementById('btn-save').addEventListener('click', saveFile);
  document.getElementById('btn-format').addEventListener('click', formatCode);

  // Language selector
  document.getElementById('lang-select').addEventListener('change', (e) => {
    const lang = e.target.value;
    settings.language = lang;
    window.electronAPI.setSetting('language', lang);
    setEditorLanguage(lang);
    updateLangBadge(lang);
  });

  // Template buttons
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.template;
      if (TEMPLATES[key]) {
        if (!isDirty || confirm('Replace current code with template?')) {
          editor.setValue(TEMPLATES[key]);
          isDirty = false;
          // Set language based on template
          if (key.startsWith('java')) {
            document.getElementById('lang-select').value = 'java';
            document.getElementById('lang-select').dispatchEvent(new Event('change'));
          } else if (key.startsWith('cpp')) {
            document.getElementById('lang-select').value = 'cpp';
            document.getElementById('lang-select').dispatchEvent(new Event('change'));
          }
        }
      }
    });
  });

  // IO tabs
  document.querySelectorAll('.io-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Output toolbar
  document.getElementById('btn-clear-output').addEventListener('click', () => {
    document.getElementById('output-area').textContent = '';
    setStatus('idle', 'Ready');
    document.getElementById('run-time').textContent = '';
  });
  document.getElementById('btn-copy-output').addEventListener('click', () => {
    const text = document.getElementById('output-area').textContent;
    navigator.clipboard.writeText(text);
  });

  // Input toolbar
  document.getElementById('btn-clear-input').addEventListener('click', () => {
    document.getElementById('input-area').value = '';
  });

  // Test cases
  document.getElementById('btn-add-test').addEventListener('click', () => addTestCase());
  document.getElementById('btn-paste-test').addEventListener('click', pasteTestCase);
  document.getElementById('btn-run-all-tests').addEventListener('click', runAllTests);

  // Workspace / bundle / extension controls
  const refreshBundlesBtn = document.getElementById('btn-refresh-bundles');
  if (refreshBundlesBtn) refreshBundlesBtn.addEventListener('click', updateBundleStatus);

  const refreshRepoBtn = document.getElementById('btn-refresh-repo');
  if (refreshRepoBtn) refreshRepoBtn.addEventListener('click', refreshGitStatus);

  const openRemoteBtn = document.getElementById('btn-open-remote');
  if (openRemoteBtn) {
    openRemoteBtn.addEventListener('click', () => {
      const browseUrl = toBrowsableRemoteUrl(gitState?.remoteUrl);
      if (browseUrl) window.electronAPI.openExternal(browseUrl);
    });
  }

  const importExtBtn = document.getElementById('btn-import-vscode-ext');
  if (importExtBtn) importExtBtn.addEventListener('click', importVSCodeExtension);

  // Settings modal
  document.getElementById('btn-settings-close').addEventListener('click', closeSettings);
  document.getElementById('btn-settings-cancel').addEventListener('click', closeSettings);
  document.getElementById('btn-settings-save').addEventListener('click', saveSettings);
  document.getElementById('settings-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('settings-overlay')) closeSettings();
  });

  // Menu events from main process
  window.electronAPI.onMenuEvent('run', () => runCode());
  window.electronAPI.onMenuEvent('run-input', () => { switchTab('input'); runCodeWithInput(); });
  window.electronAPI.onMenuEvent('run-tests', () => runAllTests());
  window.electronAPI.onMenuEvent('stop', () => stopRun());
  window.electronAPI.onMenuEvent('settings', () => openSettings());
  window.electronAPI.onMenuEvent('toggle-theme', () => toggleTheme());
  window.electronAPI.onMenuEvent('toggle-tests', () => switchTab('tests'));
  window.electronAPI.onMenuEvent('new-file', () => newFile());
  window.electronAPI.onMenuEvent('save', () => saveFile());
  window.electronAPI.onMenuEvent('template', () => {});
  window.electronAPI.onMenuEvent('bundle-status', () => updateBundleStatus());
  window.electronAPI.onMenuEvent('import-vscode-ext', () => importVSCodeExtension());

  window.electronAPI.onFileOpened(({ filePath, content }) => {
    openFileContent(filePath, content);
  });

  window.electronAPI.onFileSaveAs(({ filePath }) => {
    writeCurrentFile(filePath);
  });

  // Resizable split
  setupResizer();
}

// ─── Tab Switching ────────────────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.io-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  document.querySelectorAll('.io-tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tabName}`));
}

// ─── Resizable Panel ──────────────────────────────────────────────────────────
function setupResizer() {
  const handle = document.getElementById('resize-handle-v');
  const split = document.getElementById('editor-io-split');
  const editorPane = document.getElementById('editor-pane');
  const ioPane = document.getElementById('io-pane');

  let dragging = false;
  let startX, startEditorWidth;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startEditorWidth = editorPane.getBoundingClientRect().width;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const totalWidth = split.getBoundingClientRect().width;
    const newEditorWidth = Math.max(300, Math.min(totalWidth - 200, startEditorWidth + dx));
    const newIoWidth = totalWidth - newEditorWidth - 4; // 4px handle
    editorPane.style.flex = 'none';
    editorPane.style.width = newEditorWidth + 'px';
    ioPane.style.flex = 'none';
    ioPane.style.width = newIoWidth + 'px';
    if (editor) editor.layout();
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
    }
  });
}

// ─── File Operations ──────────────────────────────────────────────────────────
function updateTitle() {
  const name = currentFilePath
    ? currentFilePath.split('/').pop().split('\\').pop()
    : `untitled.${settings.language || 'java'}`;
  document.getElementById('file-name').textContent = (isDirty ? '● ' : '') + name;
}

function newFile() {
  if (isDirty && !confirm('Discard unsaved changes?')) return;
  editor.setValue('');
  currentFilePath = null;
  isDirty = false;
  updateTitle();
  refreshGitStatus();
}

async function openFile() {
  const result = await window.electronAPI.openFileDialog();
  if (result.canceled || !result.filePaths.length) return;
  const filePath = result.filePaths[0];
  const { ok, content, error } = await window.electronAPI.readFile(filePath);
  if (!ok) { alert('Error reading file: ' + error); return; }
  openFileContent(filePath, content);
}

function openFileContent(filePath, content) {
  editor.setValue(content);
  currentFilePath = filePath;
  isDirty = false;
  updateTitle();
  window.electronAPI.addRecentFile(filePath);

  // Auto-detect language
  const ext = filePath.split('.').pop().toLowerCase();
  const langMap = { java: 'java', cpp: 'cpp', cc: 'cpp', c: 'cpp', py: 'python' };
  const lang = langMap[ext] || 'java';
  document.getElementById('lang-select').value = lang;
  document.getElementById('lang-select').dispatchEvent(new Event('change'));

  loadRecentFiles();
  refreshGitStatus();
}

async function saveFile() {
  if (!currentFilePath) return saveFileAs();
  await writeCurrentFile(currentFilePath);
}

async function saveFileAs() {
  const defaultName = currentFilePath || `Main.${settings.language === 'cpp' ? 'cpp' : settings.language === 'python' ? 'py' : 'java'}`;
  const result = await window.electronAPI.saveFileDialog(defaultName);
  if (result.canceled) return;
  await writeCurrentFile(result.filePath);
  currentFilePath = result.filePath;
  updateTitle();
  window.electronAPI.addRecentFile(currentFilePath);
  loadRecentFiles();
}

async function writeCurrentFile(filePath) {
  if (settings.formatOnSave) {
    await formatCode();
  }
  const content = editor.getValue();
  const { ok, error } = await window.electronAPI.writeFile(filePath, content);
  if (!ok) { alert('Error saving: ' + error); return; }
  isDirty = false;
  currentFilePath = filePath;
  updateTitle();
  refreshGitStatus();
}

async function loadRecentFiles() {
  const recents = await window.electronAPI.getRecentFiles();
  const container = document.getElementById('recent-files-list');
  container.innerHTML = '';
  recents.slice(0, 8).forEach(fp => {
    const btn = document.createElement('button');
    btn.className = 'recent-file-btn';
    btn.title = fp;
    btn.textContent = fp.split('/').pop().split('\\').pop();
    btn.addEventListener('click', async () => {
      const { ok, content, error } = await window.electronAPI.readFile(fp);
      if (ok) openFileContent(fp, content);
      else alert('File not found: ' + error);
    });
    container.appendChild(btn);
  });
}

// ─── Code Formatting ─────────────────────────────────────────────────────────
async function formatCode() {
  await editor.getAction('editor.action.formatDocument').run();
}

// ─── Run Code ─────────────────────────────────────────────────────────────────
async function runCode() {
  switchTab('output');
  const code = editor.getValue();
  const language = settings.language || 'java';
  const input = document.getElementById('input-area').value;
  await executeAndShow(code, language, input);
}

async function runCodeWithInput() {
  const code = editor.getValue();
  const language = settings.language || 'java';
  const input = document.getElementById('input-area').value;
  switchTab('output');
  await executeAndShow(code, language, input);
}

async function executeAndShow(code, language, input) {
  setStatus('running', '⏳ Running…');
  document.getElementById('output-area').textContent = '';
  document.getElementById('run-time').textContent = '';
  document.getElementById('btn-run').disabled = true;
  document.getElementById('btn-stop').disabled = false;

  try {
    const result = await window.electronAPI.runCode({
      language,
      code,
      input,
      filePath: currentFilePath,
      timeLimitMs: settings.timeLimitMs || 5000,
      memoryLimitMb: settings.memoryLimitMb || 256,
      usacoMode: settings.usacoMode || false,
      usacoProblem: settings.usacoProblem || 'problem',
      usacoUseFileInput: settings.usacoUseFileInput !== false,
    });

    const output = document.getElementById('output-area');

    if (result.compileError) {
      setStatus('error', '✗ Compile Error');
      output.textContent = result.stderr || 'Compilation failed.';
      output.style.color = 'var(--error)';
    } else if (result.timedOut) {
      setStatus('tle', '⏰ Time Limit Exceeded');
      output.textContent = (result.stdout || '') + '\n[TLE: Process killed]';
      output.style.color = 'var(--warning)';
    } else if (result.exitCode !== 0) {
      setStatus('error', '✗ Runtime Error');
      output.textContent = result.stdout + (result.stderr ? '\n--- stderr ---\n' + result.stderr : '');
      output.style.color = 'var(--error)';
    } else {
      setStatus('ok', '✓ Done');
      output.textContent = result.stdout || '(no output)';
      output.style.color = 'var(--text-primary)';
    }

    const metrics = [];
    if (result.timeMs) metrics.push(`${result.timeMs}ms`);
    if (result.compileMs) metrics.push(`compile ${result.compileMs}ms`);
    if (result.cacheHit) metrics.push('cache-hit');
    document.getElementById('run-time').textContent = metrics.join(' • ');

    if (result.usaco?.enabled) {
      const usacoMeta = [];
      if (result.usaco.usedInputFile) usacoMeta.push(`stdin: ${result.usaco.problemName}.in`);
      if (result.usaco.outputWritten) usacoMeta.push(`wrote ${result.usaco.problemName}.out`);
      if (result.usaco.outputWriteError) usacoMeta.push(`write failed: ${result.usaco.outputWriteError}`);
      if (usacoMeta.length) {
        output.textContent += `\n\n[USACO] ${usacoMeta.join(' | ')}`;
      }
    }
  } catch (err) {
    setStatus('error', '✗ Error');
    document.getElementById('output-area').textContent = err.message;
  } finally {
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-stop').disabled = true;
  }
}

function stopRun() {
  window.electronAPI.killProcess();
  setStatus('idle', '■ Stopped');
  document.getElementById('btn-run').disabled = false;
  document.getElementById('btn-stop').disabled = true;
}

// ─── Test Cases ────────────────────────────────────────────────────────────────
function addTestCase(inputVal = '', expectedVal = '') {
  const id = nextTestId++;
  const tc = { id, name: `Test ${id}`, input: inputVal, expectedOutput: expectedVal, result: null };
  testCases.push(tc);
  renderTestCase(tc);
  saveTestCasesToStorage();
}

async function pasteTestCase() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text || !text.trim()) return;

    let input = '';
    let output = '';

    // Simple heuristic for "Input ... Output" format common in CP
    const inputMatch = text.match(/Input:?\s*([\s\S]*?)(?:Output:?\s*([\s\S]*)|$)/i);
    
    if (inputMatch) {
      input = inputMatch[1].trim();
      output = (inputMatch[2] || '').trim();
    } else {
      // Fallback: just use whole text as input
      input = text.trim();
    }

    addTestCase(input, output);
    // Scroll to bottom
    const container = document.getElementById('test-cases-container');
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    console.error('Failed to read clipboard', err);
    alert('Could not paste from clipboard. Please grant permission.');
  }
}

function renderTestCase(tc) {
  const container = document.getElementById('test-cases-container');
  const div = document.createElement('div');
  div.className = 'test-case';
  div.id = `tc-${tc.id}`;
  div.innerHTML = `
    <div class="test-case-header">
      <span class="test-result-badge result-idle" id="tc-badge-${tc.id}">IDLE</span>
      <span class="test-case-name">${escHtml(tc.name)}</span>
      <span class="test-time" id="tc-time-${tc.id}"></span>
      <button class="test-delete-btn" data-id="${tc.id}" title="Delete">✕</button>
    </div>
    <div class="test-case-body">
      <div class="test-io-section">
        <div class="test-io-label">Input</div>
        <textarea class="test-io-text tc-input" data-id="${tc.id}" spellcheck="false">${escHtml(tc.input)}</textarea>
      </div>
      <div class="test-io-section">
        <div class="test-io-label">Expected Output</div>
        <textarea class="test-io-text tc-expected" data-id="${tc.id}" spellcheck="false">${escHtml(tc.expectedOutput)}</textarea>
      </div>
      <div class="test-io-section" id="tc-actual-section-${tc.id}" style="display:none;">
        <div class="test-io-label">Actual Output</div>
        <pre class="test-io-text tc-actual" id="tc-actual-${tc.id}"></pre>
      </div>
    </div>
  `;

  // Bind textarea changes
  div.querySelector(`.tc-input`).addEventListener('input', (e) => {
    tc.input = e.target.value;
    saveTestCasesToStorage();
  });
  div.querySelector(`.tc-expected`).addEventListener('input', (e) => {
    tc.expectedOutput = e.target.value;
    saveTestCasesToStorage();
  });

  // Delete button
  div.querySelector('.test-delete-btn').addEventListener('click', () => {
    testCases = testCases.filter(t => t.id !== tc.id);
    div.remove();
    saveTestCasesToStorage();
  });

  container.appendChild(div);
}

function updateTestCaseResult(tc, result) {
  const badge = document.getElementById(`tc-badge-${tc.id}`);
  const timeEl = document.getElementById(`tc-time-${tc.id}`);
  const actualSection = document.getElementById(`tc-actual-section-${tc.id}`);
  const actualEl = document.getElementById(`tc-actual-${tc.id}`);

  if (!badge) return;

  if (result.compileError) {
    badge.className = 'test-result-badge result-fail';
    badge.textContent = 'COMPILE';
    actualSection.style.display = '';
    actualEl.textContent = result.stderr || 'Compile error';
    actualEl.className = 'test-io-text tc-actual test-actual-fail';
  } else if (result.timedOut) {
    badge.className = 'test-result-badge result-tle';
    badge.textContent = 'TLE';
    timeEl.textContent = `>${settings.timeLimitMs || 5000}ms`;
  } else if (result.passed) {
    badge.className = 'test-result-badge result-pass';
    badge.textContent = 'PASS';
    timeEl.textContent = `${result.timeMs}ms`;
    actualSection.style.display = '';
    actualEl.textContent = result.actualOutput;
    actualEl.className = 'test-io-text tc-actual test-actual-ok';
  } else {
    badge.className = 'test-result-badge result-fail';
    badge.textContent = 'FAIL';
    timeEl.textContent = `${result.timeMs}ms`;
    actualSection.style.display = '';
    actualEl.textContent = result.actualOutput;
    actualEl.className = 'test-io-text tc-actual test-actual-fail';
  }
}

async function runAllTests() {
  if (testCases.length === 0) { switchTab('tests'); return; }
  switchTab('tests');

  // Mark all as running
  testCases.forEach(tc => {
    const badge = document.getElementById(`tc-badge-${tc.id}`);
    if (badge) { badge.className = 'test-result-badge result-run'; badge.textContent = 'RUN'; }
    const timeEl = document.getElementById(`tc-time-${tc.id}`);
    if (timeEl) timeEl.textContent = '';
    const actualSection = document.getElementById(`tc-actual-section-${tc.id}`);
    if (actualSection) actualSection.style.display = 'none';
  });

  const code = editor.getValue();
  const language = settings.language || 'java';

  const results = await window.electronAPI.runTestCases({
    language,
    code,
    testCases: testCases.map(tc => ({ name: tc.name, input: tc.input, expectedOutput: tc.expectedOutput })),
    timeLimitMs: settings.timeLimitMs || 5000,
    memoryLimitMb: settings.memoryLimitMb || 256,
    usacoMode: settings.usacoMode || false,
    usacoProblem: settings.usacoProblem || 'problem',
    usacoUseFileInput: settings.usacoUseFileInput !== false,
  });

  results.forEach((result, i) => {
    if (testCases[i]) updateTestCaseResult(testCases[i], result);
  });

  // Show summary in status
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const allPassed = passed === total;
    setStatus(allPassed ? 'ok' : 'error', `Tests: ${passed}/${total} passed`);
    
    // Auto-switch to tests tab if there are failures
    if (!allPassed) {
      switchTab('tests');
    } else {
      // If all passed, show a toast or small notification (optional, for now just status)
    }
}

function saveTestCasesToStorage() {
  try {
    localStorage.setItem('comp-ide-tests', JSON.stringify(testCases.map(tc => ({
      id: tc.id, name: tc.name, input: tc.input, expectedOutput: tc.expectedOutput,
    }))));
    const maxId = Math.max(...testCases.map(t => t.id), 0);
    if (nextTestId <= maxId) {
      nextTestId = maxId + 1;
    }
  } catch (_) {}
}

function loadTestCasesFromStorage() {
  try {
    const saved = localStorage.getItem('comp-ide-tests');
    if (saved) {
      const items = JSON.parse(saved);
      items.forEach(tc => {
        testCases.push(tc);
        nextTestId = Math.max(nextTestId, tc.id + 1);
        renderTestCase(tc);
      });
    }
  } catch (_) {}

  // Add default sample test if no tests loaded
  if (testCases.length === 0) {
    addTestCase('5\n1 2 3 4 5', '15');
  }
}

// ─── Bundle Status ────────────────────────────────────────────────────────────
async function updateBundleStatus() {
  let bundles;
  try {
    bundles = await window.electronAPI.detectBundles({
      javaPath: settings.javaPath || '',
      javacPath: settings.javacPath || '',
      cppCompiler: settings.cppCompiler || '',
      pythonPath: settings.pythonPath || '',
      autoPickBestBundle: settings.autoPickBestBundle !== false,
    });
  } catch (err) {
    console.error(err);
    return;
  }
  bundlesState = bundles;

  const items = { java: 'bundle-java', cpp: 'bundle-cpp', python: 'bundle-python' };
  for (const [lang, elemId] of Object.entries(items)) {
    const b = bundles[lang];
    const el = document.getElementById(elemId);
    if (!el) continue;
    const span = el.querySelector('span');
    const meta = el.querySelector('.bundle-meta');
    if (b.available) {
      span.className = 'ok';
      span.textContent = '✓ ready';
      const resolved = lang === 'java'
        ? `${basenameSafe(b.runtime?.command)} + ${basenameSafe(b.compiler?.command)}`
        : lang === 'cpp'
        ? `${basenameSafe(b.compiler?.command)} (${b.flavor || 'compiler'})`
        : basenameSafe(b.runtime?.command);
      if (meta) meta.textContent = resolved;
      el.title = b.version || '';
    } else {
      span.className = 'fail';
      span.textContent = '✗ missing';
      if (meta) {
        meta.innerHTML = '';
        const link = document.createElement('span');
        link.className = 'bundle-download-link';
        link.textContent = 'Download';
        link.onclick = () => {
          const urls = {
            java: 'https://adoptium.net/',
            cpp: process.platform === 'win32' ? 'https://www.msys2.org/' : 'https://developer.apple.com/xcode/resources/',
            python: 'https://www.python.org/downloads/'
          };
          if (urls[lang]) window.electronAPI.openExternal(urls[lang]);
        };
        meta.appendChild(document.createTextNode(b.installHint || 'Not installed. '));
        meta.appendChild(link);
      }
    }
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.body.className = `theme-${theme}`;
  if (editor) {
    const monacoTheme = theme === 'light' ? 'vs' : theme === 'hc-black' ? 'hc-black' : 'vs-dark';
    monaco.editor.setTheme(monacoTheme);
  }
}

function toggleTheme() {
  const themes = ['dark', 'light', 'hc-black'];
  const idx = themes.indexOf(settings.theme);
  const next = themes[(idx + 1) % themes.length];
  settings.theme = next;
  window.electronAPI.setSetting('theme', next);
  applyTheme(next);
  if (document.getElementById('setting-theme')) {
    document.getElementById('setting-theme').value = next;
  }
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function openSettings() {
  document.getElementById('setting-theme').value = settings.theme || 'dark';
  document.getElementById('setting-font-size').value = settings.fontSize || 14;
  document.getElementById('setting-tab-size').value = settings.tabSize || 4;
  document.getElementById('setting-line-numbers').checked = settings.showLineNumbers !== false;
  document.getElementById('setting-word-wrap').checked = settings.wordWrap || false;
  document.getElementById('setting-minimap').checked = settings.minimap || false;
  document.getElementById('setting-format-on-save').checked = settings.formatOnSave || false;
  document.getElementById('setting-time-limit').value = settings.timeLimitMs || 5000;
  document.getElementById('setting-memory-limit').value = settings.memoryLimitMb || 256;
  document.getElementById('setting-java-path').value = settings.javaPath || '';
  document.getElementById('setting-javac-path').value = settings.javacPath || '';
  document.getElementById('setting-cpp-compiler').value = settings.cppCompiler || '';
  document.getElementById('setting-python-path').value = settings.pythonPath || '';
  document.getElementById('setting-auto-pick-bundle').checked = settings.autoPickBestBundle !== false;
  document.getElementById('setting-usaco-mode').checked = settings.usacoMode || false;
  document.getElementById('setting-usaco-problem').value = settings.usacoProblem || 'problem';
  document.getElementById('setting-usaco-file-input').checked = settings.usacoUseFileInput !== false;
  document.getElementById('settings-overlay').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-overlay').classList.add('hidden');
}

async function saveSettings() {
  const newTheme = document.getElementById('setting-theme').value;
  const newFontSize = parseInt(document.getElementById('setting-font-size').value);
  const newTabSize = parseInt(document.getElementById('setting-tab-size').value);
  const showLineNumbers = document.getElementById('setting-line-numbers').checked;
  const wordWrap = document.getElementById('setting-word-wrap').checked;
  const minimap = document.getElementById('setting-minimap').checked;
  const formatOnSave = document.getElementById('setting-format-on-save').checked;
  const timeLimitMs = parseInt(document.getElementById('setting-time-limit').value);
  const memoryLimitMb = parseInt(document.getElementById('setting-memory-limit').value);
  const javaPath = document.getElementById('setting-java-path').value.trim();
  const javacPath = document.getElementById('setting-javac-path').value.trim();
  const cppCompiler = document.getElementById('setting-cpp-compiler').value.trim();
  const pythonPath = document.getElementById('setting-python-path').value.trim();
  const autoPickBestBundle = document.getElementById('setting-auto-pick-bundle').checked;
  const usacoMode = document.getElementById('setting-usaco-mode').checked;
  const usacoProblem = sanitizeProblemName(document.getElementById('setting-usaco-problem').value.trim() || 'problem');
  const usacoUseFileInput = document.getElementById('setting-usaco-file-input').checked;

  const updates = { theme: newTheme, fontSize: newFontSize, tabSize: newTabSize,
    showLineNumbers, wordWrap, minimap, formatOnSave, timeLimitMs, memoryLimitMb,
    javaPath, javacPath, cppCompiler, pythonPath, autoPickBestBundle,
    usacoMode, usacoProblem, usacoUseFileInput };

  for (const [k, v] of Object.entries(updates)) {
    settings[k] = v;
    await window.electronAPI.setSetting(k, v);
  }

  // Apply editor changes
  applyTheme(newTheme);
  editor.updateOptions({
    fontSize: newFontSize,
    tabSize: newTabSize,
    lineNumbers: showLineNumbers ? 'on' : 'off',
    wordWrap: wordWrap ? 'on' : 'off',
    minimap: { enabled: minimap },
  });

  closeSettings();
  updateBundleStatus();
}

// ─── Workspace (Git) ─────────────────────────────────────────────────────────
async function refreshGitStatus() {
  try {
    const status = await window.electronAPI.getGitStatus(currentFilePath || null);
    gitState = status;
    renderGitStatus();
  } catch (err) {
    console.error(err);
  }
}

function renderGitStatus() {
  const branchEl = document.getElementById('repo-branch');
  const dirtyEl = document.getElementById('repo-dirty');
  const rootEl = document.getElementById('repo-root');
  const remoteBtn = document.getElementById('btn-open-remote');
  if (!branchEl || !dirtyEl || !rootEl || !remoteBtn) return;

  if (!gitState || !gitState.inRepo) {
    branchEl.textContent = 'No git repo';
    dirtyEl.textContent = '';
    rootEl.textContent = '';
    rootEl.title = '';
    remoteBtn.disabled = true;
    return;
  }

  branchEl.textContent = `Branch: ${gitState.branch}`;
  dirtyEl.textContent = gitState.dirtyCount > 0
    ? `${gitState.dirtyCount} pending changes`
    : 'Clean working tree';
  rootEl.textContent = gitState.root.split('/').pop() || gitState.root;
  rootEl.title = gitState.root;
  remoteBtn.disabled = !toBrowsableRemoteUrl(gitState.remoteUrl);
}

// ─── VSCode Extension Snippet Import ─────────────────────────────────────────
async function importVSCodeExtension() {
  const result = await window.electronAPI.openFolderDialog();
  if (!result || result.canceled || !result.filePaths?.length) return;

  const folderPath = result.filePaths[0];
  const importResult = await window.electronAPI.importVSCodeExtensionFolder(folderPath);
  if (!importResult.ok) {
    alert(`Import failed: ${importResult.error}`);
    return;
  }

  importedVSCodeExtensions = [
    {
      extension: importResult.extension,
      snippetsByLanguage: importResult.snippetsByLanguage,
      snippetCount: importResult.snippetCount,
      importedAt: Date.now(),
    },
    ...importedVSCodeExtensions.filter(
      item => item.extension?.sourcePath !== importResult.extension?.sourcePath,
    ),
  ].slice(0, 20);

  persistSnippetImportsToStorage();
  rebuildSnippetIndex();
  registerSnippetProviders();
  renderImportedExtensions();

  alert(`Imported ${importResult.snippetCount} snippets from ${importResult.extension.displayName}.`);
}

function hydrateSnippetImportsFromStorage() {
  try {
    const raw = localStorage.getItem('comp-ide-vscode-imports');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    importedVSCodeExtensions = parsed.filter(item =>
      item && item.extension && item.snippetsByLanguage,
    );
  } catch (_) {
    importedVSCodeExtensions = [];
  }
  rebuildSnippetIndex();
}

function persistSnippetImportsToStorage() {
  try {
    localStorage.setItem('comp-ide-vscode-imports', JSON.stringify(importedVSCodeExtensions));
  } catch (_) {}
}

function rebuildSnippetIndex() {
  importedSnippets = { java: [], cpp: [], python: [] };
  for (const imported of importedVSCodeExtensions) {
    for (const lang of Object.keys(importedSnippets)) {
      const list = imported.snippetsByLanguage?.[lang] || [];
      importedSnippets[lang].push(...list);
    }
  }
  for (const lang of Object.keys(importedSnippets)) {
    const seen = new Set();
    importedSnippets[lang] = importedSnippets[lang].filter((snippet) => {
      const key = `${snippet.prefix}|${snippet.body}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

function registerSnippetProviders() {
  snippetProviders.forEach((provider) => provider.dispose());
  snippetProviders = [];

  const languagePairs = [
    ['java', 'java'],
    ['cpp', 'cpp'],
    ['python', 'python'],
  ];

  languagePairs.forEach(([monacoLanguage, appLanguage]) => {
    const provider = monaco.languages.registerCompletionItemProvider(monacoLanguage, {
      provideCompletionItems: () => {
        const snippets = importedSnippets[appLanguage] || [];
        const suggestions = snippets.map((snippet, index) => ({
          label: snippet.prefix,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.body,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: snippet.description || snippet.name || 'Imported VSCode snippet',
          sortText: `z-${index.toString().padStart(6, '0')}`,
        }));
        return { suggestions };
      },
    });
    snippetProviders.push(provider);
  });
}

function renderImportedExtensions() {
  const listEl = document.getElementById('vscode-imports-list');
  const countEl = document.getElementById('vscode-import-count');
  if (!listEl || !countEl) return;

  listEl.innerHTML = '';
  const snippetCount = Object.values(importedSnippets).reduce((sum, list) => sum + list.length, 0);
  countEl.textContent = `${snippetCount} snippets`;

  if (!importedVSCodeExtensions.length) {
    const empty = document.createElement('div');
    empty.className = 'vscode-import-empty';
    empty.textContent = 'No imported extensions yet.';
    listEl.appendChild(empty);
    return;
  }

  importedVSCodeExtensions.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'vscode-import-item';
    row.innerHTML = `
      <div class="vscode-import-title">${escHtml(item.extension.displayName || item.extension.name)}</div>
      <div class="vscode-import-meta">${item.snippetCount || 0} snippets</div>
    `;
    listEl.appendChild(row);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setStatus(type, text) {
  const el = document.getElementById('run-status');
  el.className = `status-${type}`;
  el.textContent = text;
}

function updateLangBadge(lang) {
  const badge = document.getElementById('lang-badge');
  badge.dataset.lang = lang;
  badge.textContent = { java: 'Java', cpp: 'C++', python: 'Python' }[lang] || lang;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function basenameSafe(value) {
  if (!value) return '(missing)';
  const parts = value.split(/[\\/]/);
  return parts[parts.length - 1] || value;
}

function sanitizeProblemName(name) {
  const safe = (name || 'problem').replace(/[^A-Za-z0-9_-]/g, '');
  return safe || 'problem';
}

function toBrowsableRemoteUrl(remote) {
  if (!remote) return null;
  if (/^https?:\/\//i.test(remote)) return remote.replace(/\.git$/i, '');
  const sshMatch = remote.match(/^git@([^:]+):(.+)$/i);
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2].replace(/\.git$/i, '')}`;
  }
  return null;
}
