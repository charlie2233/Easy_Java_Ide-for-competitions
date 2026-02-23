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

  'python-usaco': `import sys


def solve() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    # Example parse:
    # n = int(data[0])
    # ...
    print("ready")


if __name__ == "__main__":
    solve()
`,

  'python-fastio': `import sys


def ints():
    return map(int, sys.stdin.buffer.readline().split())


def solve() -> None:
    n = int(sys.stdin.buffer.readline())
    out = []
    for _ in range(n):
        x = int(sys.stdin.buffer.readline())
        out.append(str(x))
    sys.stdout.write("\\n".join(out))


if __name__ == "__main__":
    solve()
`,

  'python-dp': `import sys


def solve() -> None:
    n = int(sys.stdin.buffer.readline())
    inf = 10 ** 18
    dp = [inf] * (n + 1)
    dp[0] = 0

    for i in range(1, n + 1):
        # dp[i] = min/max transition from earlier states
        pass

    print(dp[n])


if __name__ == "__main__":
    solve()
`,

  'python-graph': `from collections import deque
import sys


def solve() -> None:
    n, m = map(int, sys.stdin.buffer.readline().split())
    graph = [[] for _ in range(n + 1)]
    for _ in range(m):
        u, v = map(int, sys.stdin.buffer.readline().split())
        graph[u].append(v)
        graph[v].append(u)

    dist = [-1] * (n + 1)
    q = deque([1])
    dist[1] = 0

    while q:
        u = q.popleft()
        for v in graph[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)

    print(dist[n])


if __name__ == "__main__":
    solve()
`,

  'java-binary-search': `import java.io.*;
import java.util.*;

public class Main {
    static boolean good(long x) {
        // TODO: monotonic check
        return x >= 0;
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        long lo = 0, hi = (long) 1e18;
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (good(mid)) hi = mid;
            else lo = mid + 1;
        }
        System.out.println(lo);
    }
}
`,

  'cpp-binary-search': `#include <bits/stdc++.h>
using namespace std;

bool good(long long x) {
    // TODO: monotonic check
    return x >= 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    long long lo = 0, hi = (long long)1e18;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (good(mid)) hi = mid;
        else lo = mid + 1;
    }
    cout << lo << "\\n";
    return 0;
}
`,

  'java-dsu': `import java.io.*;
import java.util.*;

public class Main {
    static class DSU {
        int[] p, sz;

        DSU(int n) {
            p = new int[n + 1];
            sz = new int[n + 1];
            for (int i = 1; i <= n; i++) {
                p[i] = i;
                sz[i] = 1;
            }
        }

        int find(int x) {
            if (p[x] == x) return x;
            return p[x] = find(p[x]);
        }

        boolean unite(int a, int b) {
            a = find(a);
            b = find(b);
            if (a == b) return false;
            if (sz[a] < sz[b]) {
                int t = a; a = b; b = t;
            }
            p[b] = a;
            sz[a] += sz[b];
            return true;
        }
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        int m = Integer.parseInt(st.nextToken());
        DSU dsu = new DSU(n);

        for (int i = 0; i < m; i++) {
            st = new StringTokenizer(br.readLine());
            int u = Integer.parseInt(st.nextToken());
            int v = Integer.parseInt(st.nextToken());
            dsu.unite(u, v);
        }
    }
}
`,

  'cpp-dsu': `#include <bits/stdc++.h>
using namespace std;

struct DSU {
    vector<int> p, sz;
    DSU(int n) : p(n + 1), sz(n + 1, 1) {
        iota(p.begin(), p.end(), 0);
    }
    int find(int x) {
        if (p[x] == x) return x;
        return p[x] = find(p[x]);
    }
    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) swap(a, b);
        p[b] = a;
        sz[a] += sz[b];
        return true;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    DSU dsu(n);
    while (m--) {
        int u, v;
        cin >> u >> v;
        dsu.unite(u, v);
    }
    return 0;
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
let workspaceRoot = null;
const expandedProjectDirs = new Set();
let autoSaveIntervalId = null;
let autoSaveInFlight = false;

const AUTO_SAVE_INTERVAL_MS = 4000;

function renderBootError(message) {
  const existing = document.getElementById('boot-error');
  if (existing) return;
  const el = document.createElement('div');
  el.id = 'boot-error';
  el.textContent = message;
  document.body.appendChild(el);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
if (!window.require || !window.require.config) {
  renderBootError('Editor assets failed to load. Reinstall or rebuild the app package.');
} else {
window.require(['vs/editor/editor.main'], async function () {
  settings = await window.electronAPI.getSettings();
  hydrateSnippetImportsFromStorage();
  workspaceRoot = settings.workspaceRoot || null;
  applyTheme(settings.theme);
  initEditor();
  registerSnippetProviders();
  loadInitialContent();
  wireUI();
  initializeBrandingAssets();
  await setSidebarCollapsed(settings.sidebarCollapsed === true, false);
  startAutoSaveLoop();
  loadCustomInputFromStorage();
  loadTestCasesFromStorage();
  initSubmissionPanel();
  updateBundleStatus();
  refreshGitStatus();
  refreshProjectTree();
  loadRecentFiles();
  // Check for first run
  if (!settings.setupComplete) {
    showSetupModal();
  }
});
}

// ─── Setup / Onboarding ───────────────────────────────────────────────────────
function showSetupModal() {
  document.getElementById('setup-overlay').classList.remove('hidden');
  updateSetupLang(); // Trigger check for default lang
}

window.selectSetupTheme = function(theme) {
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.theme-card[data-theme="${theme}"]`).classList.add('selected');
  applyTheme(theme); // Live preview
};

window.updateSetupLang = async function() {
  const lang = document.getElementById('setup-lang-select').value;
  const statusEl = document.getElementById('setup-lang-status');
  statusEl.textContent = 'Checking availability...';
  statusEl.style.color = 'var(--text-secondary)';
  
  // Quick check
  const bundles = await window.electronAPI.detectBundles();
  const info = bundles[lang];
  
  if (info && info.available) {
    statusEl.textContent = `✓ Found: ${info.version || 'Ready'}`;
    statusEl.style.color = 'var(--success)';
  } else {
    statusEl.textContent = `✗ Not found. You can install it later.`;
    statusEl.style.color = 'var(--warning)';
  }
};

window.finishSetup = async function() {
  const theme = document.querySelector('.theme-card.selected').dataset.theme;
  const lang = document.getElementById('setup-lang-select').value;
  
  settings.theme = theme;
  settings.language = lang;
  settings.setupComplete = true;
  
  await window.electronAPI.setSetting('theme', theme);
  await window.electronAPI.setSetting('language', lang);
  await window.electronAPI.setSetting('setupComplete', true);
  
  document.getElementById('setup-overlay').classList.add('hidden');
  
  // Apply changes
  applyTheme(theme);
  loadInitialContent();
};

// ─── Setup / Onboarding ───────────────────────────────────────────────────────
function showSetupModal() {
  document.getElementById('setup-overlay').classList.remove('hidden');
  updateSetupLang(); // Trigger check for default lang
}

window.selectSetupTheme = function(theme) {
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.theme-card[data-theme="${theme}"]`).classList.add('selected');
  applyTheme(theme); // Live preview
};

window.updateSetupLang = async function() {
  const lang = document.getElementById('setup-lang-select').value;
  const statusEl = document.getElementById('setup-lang-status');
  statusEl.textContent = 'Checking availability...';
  statusEl.style.color = 'var(--text-secondary)';
  
  // Quick check
  let bundles = bundlesState;
  if (!bundles) {
    bundles = await window.electronAPI.detectBundles();
  }
  const info = bundles[lang];
  
  if (info && info.available) {
    statusEl.textContent = `✓ Found: ${info.version || 'Ready'}`;
    statusEl.style.color = 'var(--success)';
  } else {
    statusEl.textContent = `✗ Not found. You can install it later.`;
    statusEl.style.color = 'var(--warning)';
  }
};

window.finishSetup = async function() {
  const theme = document.querySelector('.theme-card.selected').dataset.theme;
  const lang = document.getElementById('setup-lang-select').value;
  
  settings.theme = theme;
  settings.language = lang;
  settings.setupComplete = true;
  
  await window.electronAPI.setSetting('theme', theme);
  await window.electronAPI.setSetting('language', lang);
  await window.electronAPI.setSetting('setupComplete', true);
  
  document.getElementById('setup-overlay').classList.add('hidden');
  
  // Apply changes
  applyTheme(theme);
  loadInitialContent();
};

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
    cursorStyle: 'line',
    cursorWidth: 2,
    cursorBlinking: 'phase',
    cursorSmoothCaretAnimation: 'on',
    bracketPairColorization: { enabled: true },
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: { other: true, comments: false, strings: false },
    lineHeight: 21,
    letterSpacing: 0.2,
    renderLineHighlight: 'line',
    padding: { top: 12, bottom: 12 }, // Add some breathing room
  });

  // Track dirty state and content changes
  editor.onDidChangeModelContent(() => {
    isDirty = true;
    updateTitle();
    toggleWelcomeScreen(); // Let function decide based on content
    markAllTestCasesStale('Code changed. Re-run tests.');
  });

  // Track cursor position for status bar
  editor.onDidChangeCursorPosition((e) => {
    updateStatusBarCursor(e.position);
  });

  // Cmd+Enter to run
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runCode());
  // Cmd+S to save
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveFile());

  // Auto-resize on window resize
  window.addEventListener('resize', () => editor.layout());
}

function startAutoSaveLoop() {
  if (autoSaveIntervalId) clearInterval(autoSaveIntervalId);
  autoSaveIntervalId = window.setInterval(() => {
    void autoSaveCurrentFile();
  }, AUTO_SAVE_INTERVAL_MS);
}

async function autoSaveCurrentFile() {
  if (autoSaveInFlight || !editor || !currentFilePath || !isDirty) return;
  const model = editor.getModel();
  if (!model) return;

  const versionBefore = typeof model.getAlternativeVersionId === 'function'
    ? model.getAlternativeVersionId()
    : model.getVersionId();
  const content = editor.getValue();

  autoSaveInFlight = true;
  try {
    const { ok } = await window.electronAPI.writeFile(currentFilePath, content);
    if (!ok) return;

    const versionAfter = typeof model.getAlternativeVersionId === 'function'
      ? model.getAlternativeVersionId()
      : model.getVersionId();

    // Only clear dirty state if the user didn't type during the autosave write.
    if (versionAfter === versionBefore) {
      isDirty = false;
      updateTitle();
    }
  } catch (_) {
    // Keep autosave silent; manual save still surfaces write failures.
  } finally {
    autoSaveInFlight = false;
  }
}

function updateStatusBarCursor(position) {
  const el = document.getElementById('sb-cursor');
  if (el) el.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
}

function toggleWelcomeScreen(show) {
  const el = document.getElementById('welcome-screen');
  const hasContent = editor.getValue().trim().length > 0;
  
  // If explicitly showing, or if undefined and editor is empty
  const shouldShow = show !== undefined ? show : (!hasContent && !currentFilePath);
  
  if (shouldShow) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
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
  updateLangBadge(lang);
  document.getElementById('lang-select').value = lang;
  
  // If no previous file was loaded (or explicitly asking for welcome), show it?
  // But our "default" is a template. Let's start with the template to be helpful.
  // The user can clear it to see the welcome screen if they want.
  
  const templateKey = lang === 'java'
    ? 'java-usaco'
    : lang === 'cpp'
      ? 'cpp-usaco'
      : lang === 'python'
        ? 'python-usaco'
        : null;
  if (templateKey) {
    editor.setValue(TEMPLATES[templateKey]);
    // It's a template, so technically not dirty yet, but it has content.
    // Let's treat it as "clean" new file.
    isDirty = false;
    currentFilePath = null;
    updateTitle();
    toggleWelcomeScreen(false); // Has content
  } else {
    // Empty
    toggleWelcomeScreen(true);
  }
}

// ─── UI Wiring ────────────────────────────────────────────────────────────────
function wireUI() {
  const bind = (id, event, handler, optional = false) => {
    const el = document.getElementById(id);
    if (!el) {
      const message = `Missing UI element: #${id}`;
      console.warn(message);
      if (!optional) {
        renderBootError(`UI initialization failed: ${message}. Rebuild/reinstall the app package.`);
      }
      return null;
    }
    el.addEventListener(event, handler);
    return el;
  };

  // Titlebar buttons
  bind('btn-run', 'click', runCode);
  bind('btn-run-input', 'click', () => { switchTab('input'); runCodeWithInput(); });
  bind('btn-run-tests', 'click', runAllTests);
  bind('btn-stop', 'click', stopRun);
  bind('btn-toggle-sidebar', 'click', () => toggleSidebar(), true);
  bind('btn-settings', 'click', openSettings);

  // Editor toolbar
  bind('btn-open', 'click', openFile);
  bind('btn-save', 'click', saveFile);
  bind('btn-format', 'click', formatCode);

  // Welcome Screen
  bind('btn-welcome-new', 'click', newFile, true);
  bind('btn-welcome-open', 'click', openFile, true);

  // Language selector
  bind('lang-select', 'change', (e) => {
    const lang = e.target.value;
    settings.language = lang;
    window.electronAPI.setSetting('language', lang);
    setEditorLanguage(lang);
    updateLangBadge(lang);
    updateTitle();
    document.getElementById('sb-lang').textContent = { java: 'Java', cpp: 'C++', python: 'Python' }[lang] || lang;
  });

  // Template buttons
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.template;
      if (TEMPLATES[key]) {
        if (!isDirty || confirm('Replace current code with template?')) {
          editor.setValue(TEMPLATES[key]);
          isDirty = false;
          // Set language based on template key prefix.
          const langPrefix = (key || '').split('-')[0];
          if (['java', 'cpp', 'python'].includes(langPrefix)) {
            document.getElementById('lang-select').value = langPrefix;
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
  bind('btn-clear-output', 'click', () => {
    document.getElementById('output-area').textContent = '';
    setStatus('idle', 'Ready');
    document.getElementById('run-time').textContent = '';
  });
  bind('btn-copy-output', 'click', () => {
    const text = document.getElementById('output-area').textContent;
    navigator.clipboard.writeText(text);
  });

  // Input toolbar
  bind('btn-clear-input', 'click', () => {
    document.getElementById('input-area').value = '';
    saveCustomInputToStorage();
  });
  bind('input-area', 'input', () => {
    saveCustomInputToStorage();
  });

  // Test cases
  bind('btn-add-test', 'click', () => addTestCase());
  bind('btn-import-test-files', 'click', importTestFilesAsCases);
  bind('btn-paste-test', 'click', pasteTestCase);
  bind('btn-fetch-problem', 'click', fetchProblemSamplesIntoTests);
  bind('btn-run-all-tests', 'click', runAllTests);
  bind('problem-url-input', 'keydown', (e) => {
    if (e.key === 'Enter') fetchProblemSamplesIntoTests();
  });

  // Workspace / bundle / extension controls
  bind('btn-open-project-folder', 'click', chooseProjectFolder, true);
  bind('btn-refresh-project', 'click', refreshProjectTree, true);
  bind('btn-refresh-bundles', 'click', updateBundleStatus, true);
  bind('btn-refresh-repo', 'click', refreshGitStatus, true);
  bind('btn-open-terminal', 'click', openTerminalAtWorkspace, true);

  const openRemoteBtn = document.getElementById('btn-open-remote');
  if (openRemoteBtn) {
    openRemoteBtn.addEventListener('click', () => {
      const browseUrl = toBrowsableRemoteUrl(gitState?.remoteUrl);
      if (browseUrl) window.electronAPI.openExternal(browseUrl);
    });
  }

  bind('btn-import-vscode-ext', 'click', importVSCodeExtension, true);
  bind('btn-import-vscode-vsix', 'click', importVSIXExtension, true);

  // Submission helpers
  bind('submit-platform', 'change', saveSubmissionSettingsFromUI, true);
  bind('submit-cf-contest', 'input', saveSubmissionSettingsFromUI, true);
  bind('submit-cf-problem', 'input', saveSubmissionSettingsFromUI, true);
  bind('submit-usaco-cpid', 'input', saveSubmissionSettingsFromUI, true);
  bind('btn-submit-open-problem', 'click', () => openSubmissionTarget('problemUrl'), true);
  bind('btn-submit-open-submit', 'click', () => openSubmissionTarget('submitUrl'), true);
  bind('btn-submit-export', 'click', exportSubmissionFile, true);

  // Settings modal
  bind('btn-settings-close', 'click', closeSettings, true);
  bind('btn-settings-cancel', 'click', closeSettings, true);
  bind('btn-settings-save', 'click', saveSettings, true);
  const settingsOverlay = document.getElementById('settings-overlay');
  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', (e) => {
      if (e.target === settingsOverlay) closeSettings();
    });
  }

  // Menu events from main process
  window.electronAPI.onMenuEvent('run', () => runCode());
  window.electronAPI.onMenuEvent('run-input', () => { switchTab('input'); runCodeWithInput(); });
  window.electronAPI.onMenuEvent('run-tests', () => runAllTests());
  window.electronAPI.onMenuEvent('stop', () => stopRun());
  window.electronAPI.onMenuEvent('settings', () => openSettings());
  window.electronAPI.onMenuEvent('toggle-theme', () => toggleTheme());
  window.electronAPI.onMenuEvent('toggle-sidebar', () => toggleSidebar());
  window.electronAPI.onMenuEvent('toggle-tests', () => switchTab('tests'));
  window.electronAPI.onMenuEvent('new-file', () => newFile());
  window.electronAPI.onMenuEvent('save', () => saveFile());
  window.electronAPI.onMenuEvent('template', () => {});
  window.electronAPI.onMenuEvent('bundle-status', () => updateBundleStatus());
  window.electronAPI.onMenuEvent('import-vscode-ext', () => importVSCodeExtension());
  window.electronAPI.onMenuEvent('import-vscode-vsix', () => importVSIXExtension());
  window.electronAPI.onMenuEvent('open-project-folder', () => chooseProjectFolder());
  window.electronAPI.onMenuEvent('toggle-terminal', () => openTerminalAtWorkspace());

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
    document.body.classList.add('resizing-layout');
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
      document.body.classList.remove('resizing-layout');
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
  toggleWelcomeScreen(true); // Empty file shows welcome screen? Or maybe just empty.
  // Usually "New File" means "I want to type". So let's focus editor and hide welcome screen if user starts typing.
  // Actually, let's keep it visible until they type, OR insert a template.
  // Let's insert the default template again for convenience.
  const lang = settings.language || 'java';
  const templateKey = lang === 'java'
    ? 'java-usaco'
    : lang === 'cpp'
      ? 'cpp-usaco'
      : lang === 'python'
        ? 'python-usaco'
        : null;
  if (templateKey) {
    editor.setValue(TEMPLATES[templateKey]);
    toggleWelcomeScreen(false);
  } else {
    toggleWelcomeScreen(true);
  }
  refreshProjectTree();
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
  toggleWelcomeScreen(false);

  // Auto-detect language
  const ext = filePath.split('.').pop().toLowerCase();
  const langMap = { java: 'java', cpp: 'cpp', cc: 'cpp', c: 'cpp', py: 'python' };
  const lang = langMap[ext] || 'java';
  
  // Update UI
  document.getElementById('lang-select').value = lang;
  settings.language = lang; // Temp update
  setEditorLanguage(lang);
  updateLangBadge(lang);
  document.getElementById('sb-lang').textContent = { java: 'Java', cpp: 'C++', python: 'Python' }[lang] || lang;

  loadRecentFiles();
  refreshGitStatus();

  if (!workspaceRoot || !isPathInsideRoot(filePath, workspaceRoot)) {
    void setWorkspaceRoot(requirePathDirname(filePath), true);
  } else {
    refreshProjectTree();
  }
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

// ─── Project Explorer ─────────────────────────────────────────────────────────
async function chooseProjectFolder() {
  const result = await window.electronAPI.openFolderDialog();
  if (!result || result.canceled || !result.filePaths?.length) return;
  await setWorkspaceRoot(result.filePaths[0], true);
}

async function setWorkspaceRoot(rootPath, persist = true) {
  if (!rootPath) return;
  workspaceRoot = rootPath;
  expandedProjectDirs.clear();
  expandedProjectDirs.add(rootPath);

  if (persist) {
    settings.workspaceRoot = rootPath;
    await window.electronAPI.setSetting('workspaceRoot', rootPath);
  }

  renderProjectRootLabel();
  await refreshProjectTree();
}

function renderProjectRootLabel() {
  const label = document.getElementById('project-root-label');
  if (!label) return;
  if (!workspaceRoot) {
    label.textContent = 'No project folder selected.';
    label.title = '';
    return;
  }
  const base = basenameSafe(workspaceRoot);
  label.textContent = base || workspaceRoot;
  label.title = workspaceRoot;
}

async function refreshProjectTree() {
  const container = document.getElementById('project-tree');
  if (!container) return;

  renderProjectRootLabel();
  if (!workspaceRoot) {
    container.innerHTML = '<div class="project-tree-empty">Open a folder to enable project explorer.</div>';
    return;
  }

  const treeResult = await window.electronAPI.listWorkspaceTree(workspaceRoot, {
    maxDepth: 6,
    maxNodes: 3500,
    ignoreHidden: true,
  });

  if (!treeResult.ok || !treeResult.tree) {
    container.innerHTML = `<div class="project-tree-empty">${escHtml(treeResult.error || 'Unable to read folder.')}</div>`;
    return;
  }

  renderProjectTree(treeResult.tree, !!treeResult.truncated);
}

function renderProjectTree(rootNode, truncated) {
  const container = document.getElementById('project-tree');
  container.innerHTML = '';

  const fragment = document.createDocumentFragment();
  const children = Array.isArray(rootNode.children) ? rootNode.children : [];
  children.forEach((child) => appendProjectNode(fragment, child, 0));

  if (!children.length) {
    const empty = document.createElement('div');
    empty.className = 'project-tree-empty';
    empty.textContent = 'Folder is empty.';
    fragment.appendChild(empty);
  }

  if (truncated) {
    const cutoff = document.createElement('div');
    cutoff.className = 'project-tree-empty';
    cutoff.textContent = 'Tree truncated for performance.';
    fragment.appendChild(cutoff);
  }

  container.appendChild(fragment);
}

function appendProjectNode(parent, node, depth) {
  const row = document.createElement('div');
  row.className = `project-node ${node.type}`;
  row.style.paddingLeft = `${6 + depth * 12}px`;

  const caret = document.createElement('span');
  caret.className = 'caret';
  const name = document.createElement('span');
  name.className = 'name';

  if (node.type === 'dir') {
    const expanded = expandedProjectDirs.has(node.path);
    caret.textContent = expanded ? '▾' : '▸';
    name.textContent = node.name;
    row.appendChild(caret);
    row.appendChild(name);
    row.addEventListener('click', () => {
      if (expandedProjectDirs.has(node.path)) expandedProjectDirs.delete(node.path);
      else expandedProjectDirs.add(node.path);
      refreshProjectTree();
    });
    parent.appendChild(row);

    if (expanded && Array.isArray(node.children)) {
      node.children.forEach((child) => appendProjectNode(parent, child, depth + 1));
    }
    return;
  }

  if (node.path === currentFilePath) row.classList.add('active');
  caret.textContent = '';
  name.textContent = node.name;
  row.appendChild(caret);
  row.appendChild(name);
  row.addEventListener('click', async () => {
    const { ok, content, error } = await window.electronAPI.readFile(node.path);
    if (!ok) {
      alert(`Failed to open file: ${error}`);
      return;
    }
    openFileContent(node.path, content);
  });
  parent.appendChild(row);
}

// ─── Code Formatting ─────────────────────────────────────────────────────────
async function formatCode() {
  const currentCode = editor.getValue();
  const language = settings.language || 'java';

  try {
    const result = await window.electronAPI.formatCode({
      language,
      code: currentCode,
      javaFormatterPath: settings.javaFormatterPath || '',
      clangFormatPath: settings.clangFormatPath || '',
    });

    if (result?.ok && typeof result.formattedCode === 'string') {
      if (result.formattedCode !== currentCode) {
        const pos = editor.getPosition();
        editor.setValue(result.formattedCode);
        if (pos) editor.setPosition(pos);
      }
      setStatus('ok', `Formatted (${result.tool || 'external'})`);
      return;
    }
  } catch (err) {
    console.error(err);
  }

  await editor.getAction('editor.action.formatDocument').run();
  setStatus('idle', 'Formatted (Monaco)');
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
  setStatus('running', 'Running...');
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
      setStatus('error', 'Compile Error');
      output.textContent = result.stderr || 'Compilation failed.';
      output.style.color = 'var(--error)';
    } else if (result.timedOut) {
      setStatus('tle', 'Time Limit Exceeded');
      output.textContent = (result.stdout || '') + '\n[TLE: Process killed]';
      output.style.color = 'var(--warning)';
    } else if (result.exitCode !== 0) {
      setStatus('error', 'Runtime Error');
      output.textContent = result.stdout + (result.stderr ? '\n--- stderr ---\n' + result.stderr : '');
      output.style.color = 'var(--error)';
    } else {
      setStatus('ok', 'Completed');
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
    setStatus('error', 'Execution Error');
    document.getElementById('output-area').textContent = err.message;
  } finally {
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-stop').disabled = true;
  }
}

function stopRun() {
  window.electronAPI.killProcess();
  setStatus('idle', 'Stopped');
  document.getElementById('btn-run').disabled = false;
  document.getElementById('btn-stop').disabled = true;
}

// ─── Test Cases ────────────────────────────────────────────────────────────────
function saveCustomInputToStorage() {
  try {
    const inputValue = document.getElementById('input-area')?.value || '';
    localStorage.setItem('comp-ide-custom-input', inputValue);
  } catch (_) {}
}

function loadCustomInputFromStorage() {
  try {
    const saved = localStorage.getItem('comp-ide-custom-input');
    if (typeof saved === 'string') {
      const inputEl = document.getElementById('input-area');
      if (inputEl) inputEl.value = saved;
    }
  } catch (_) {}
}

function parseSampleFileInfo(filePath) {
  const baseName = basenameSafe(filePath);
  const lower = baseName.toLowerCase();
  const ext = (lower.split('.').pop() || '').trim();
  const outputExts = new Set(['out', 'ans']);
  const outputHints = /(output|expected|answer|ans|out)(?:[_\-.]?\d+)?$/i;

  const role = outputExts.has(ext) || outputHints.test(lower.replace(/\.[^.]+$/, ''))
    ? 'output'
    : 'input';

  const withoutExt = lower.replace(/\.[^.]+$/, '');
  const key = withoutExt
    .replace(/[_\-.]?(input|in|output|out|expected|answer|ans)$/i, '')
    .trim() || withoutExt;

  return { baseName, role, key };
}

async function importTestFilesAsCases() {
  const result = await window.electronAPI.openSampleFilesDialog();
  if (!result || result.canceled || !Array.isArray(result.filePaths) || !result.filePaths.length) return;

  const loaded = [];
  for (const filePath of result.filePaths) {
    const read = await window.electronAPI.readFile(filePath);
    if (!read.ok) continue;
    loaded.push({ filePath, content: read.content || '', ...parseSampleFileInfo(filePath) });
  }

  if (!loaded.length) {
    alert('No readable sample files selected.');
    return;
  }

  const grouped = new Map();
  loaded.forEach((item) => {
    const groupKey = `${requirePathDirname(item.filePath)}::${item.key}`;
    if (!grouped.has(groupKey)) grouped.set(groupKey, { inputs: [], outputs: [] });
    const group = grouped.get(groupKey);
    if (item.role === 'output') group.outputs.push(item);
    else group.inputs.push(item);
  });

  const imported = [];
  grouped.forEach((group, groupKey) => {
    const count = Math.max(group.inputs.length, group.outputs.length);
    if (count === 0) return;
    const baseLabel = groupKey.split('::').pop() || 'sample';

    for (let i = 0; i < count; i++) {
      const inputFile = group.inputs[i] || null;
      const outputFile = group.outputs[i] || null;
      imported.push({
        name: `${baseLabel} ${i + 1}`,
        input: inputFile ? inputFile.content : '',
        expectedOutput: outputFile ? outputFile.content : '',
      });
    }
  });

  if (!imported.length) {
    alert('Could not infer sample input/output from the selected files.');
    return;
  }

  const shouldReplace = testCases.length > 0
    ? confirm(`Import ${imported.length} sample test(s). Replace existing tests? Click Cancel to append.`)
    : true;

  if (shouldReplace) {
    testCases = [];
    nextTestId = 1;
    document.getElementById('test-cases-container').innerHTML = '';
  }

  imported.forEach((tc) => addTestCase(tc.input, tc.expectedOutput, tc.name));
  saveTestCasesToStorage();
  switchTab('tests');
  setStatus('ok', `Imported ${imported.length} sample file test(s)`);
}

function addTestCase(inputVal = '', expectedVal = '', name = null) {
  const id = nextTestId++;
  const tc = { id, name: name || `Test ${id}`, input: inputVal, expectedOutput: expectedVal, result: null };
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

async function fetchProblemSamplesIntoTests() {
  const input = document.getElementById('problem-url-input');
  const url = (input?.value || '').trim();
  if (!url) {
    alert('Paste a problem URL first.');
    return;
  }

  setStatus('running', 'Fetching Samples...');
  const result = await window.electronAPI.fetchProblemSamples(url);
  if (!result.ok) {
    setStatus('error', 'Fetch Failed');
    alert(result.error || 'Could not fetch samples.');
    return;
  }

  if (!Array.isArray(result.testCases) || !result.testCases.length) {
    setStatus('error', 'No Samples Found');
    alert('No sample tests were detected on this page.');
    return;
  }

  const shouldReplace = testCases.length > 0
    ? confirm(`Found ${result.testCases.length} sample test(s). Replace existing tests? Click Cancel to append.`)
    : true;

  if (shouldReplace) {
    testCases = [];
    nextTestId = 1;
    document.getElementById('test-cases-container').innerHTML = '';
  }

  result.testCases.forEach((tc) => addTestCase(tc.input || '', tc.expectedOutput || ''));
  saveTestCasesToStorage();
  switchTab('tests');
  setStatus('ok', `Loaded ${result.testCases.length} samples (${result.source || 'problem'})`);
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
        <div class="test-io-label">Actual Output <span class="test-compare-note" id="tc-compare-${tc.id}"></span></div>
        <pre class="test-io-text tc-actual" id="tc-actual-${tc.id}"></pre>
      </div>
    </div>
  `;

  // Bind textarea changes
  div.querySelector(`.tc-input`).addEventListener('input', (e) => {
    tc.input = e.target.value;
    markTestCaseStale(tc, 'Input changed. Re-run tests.');
    saveTestCasesToStorage();
  });
  div.querySelector(`.tc-expected`).addEventListener('input', (e) => {
    tc.expectedOutput = e.target.value;
    markTestCaseStale(tc, 'Expected output changed.');
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

function normalizeTestOutput(str) {
  return (str || '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd();
}

function summarizeMismatch(expectedRaw, actualRaw) {
  const expected = normalizeTestOutput(expectedRaw);
  const actual = normalizeTestOutput(actualRaw);
  if (expected === actual) return 'Matches expected output';

  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const maxLines = Math.max(expectedLines.length, actualLines.length);

  for (let i = 0; i < maxLines; i++) {
    const expLine = expectedLines[i] ?? '';
    const actLine = actualLines[i] ?? '';
    if (expLine === actLine) continue;

    const maxCols = Math.max(expLine.length, actLine.length);
    let col = 1;
    for (let j = 0; j < maxCols; j++) {
      if ((expLine[j] ?? '') !== (actLine[j] ?? '')) {
        col = j + 1;
        break;
      }
    }
    return `Mismatch at line ${i + 1}, col ${col}`;
  }

  return 'Output differs';
}

function setTestCaseCompareNote(tcId, text, isError = false) {
  const noteEl = document.getElementById(`tc-compare-${tcId}`);
  if (!noteEl) return;
  noteEl.textContent = text || '';
  noteEl.classList.toggle('error', !!isError);
}

function clearTestCaseResultUI(tcId, badgeText = 'IDLE') {
  const badge = document.getElementById(`tc-badge-${tcId}`);
  const timeEl = document.getElementById(`tc-time-${tcId}`);
  const actualSection = document.getElementById(`tc-actual-section-${tcId}`);
  const actualEl = document.getElementById(`tc-actual-${tcId}`);

  if (badge) {
    badge.className = 'test-result-badge result-idle';
    badge.textContent = badgeText;
  }
  if (timeEl) timeEl.textContent = '';
  if (actualSection) actualSection.style.display = 'none';
  if (actualEl) {
    actualEl.textContent = '';
    actualEl.className = 'test-io-text tc-actual';
  }
  setTestCaseCompareNote(tcId, '');
}

function markTestCaseStale(tc, message = '') {
  tc.result = null;
  clearTestCaseResultUI(tc.id, 'EDIT');
  const timeEl = document.getElementById(`tc-time-${tc.id}`);
  if (timeEl) timeEl.textContent = 'needs re-run';
  if (message) {
    setTestCaseCompareNote(tc.id, message, true);
  }
}

function markAllTestCasesStale(message = '') {
  testCases.forEach((tc) => {
    markTestCaseStale(tc, message);
  });
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
    timeEl.textContent = '';
    actualSection.style.display = '';
    actualEl.textContent = result.stderr || 'Compile error';
    actualEl.className = 'test-io-text tc-actual test-actual-fail';
    setTestCaseCompareNote(tc.id, 'Compilation failed', true);
  } else if (result.timedOut) {
    badge.className = 'test-result-badge result-tle';
    badge.textContent = 'TLE';
    timeEl.textContent = `>${settings.timeLimitMs || 5000}ms`;
    setTestCaseCompareNote(tc.id, 'Time limit exceeded', true);
  } else if (result.passed) {
    badge.className = 'test-result-badge result-pass';
    badge.textContent = 'PASS';
    timeEl.textContent = `${result.timeMs}ms`;
    actualSection.style.display = '';
    actualEl.textContent = result.actualOutput;
    actualEl.className = 'test-io-text tc-actual test-actual-ok';
    setTestCaseCompareNote(tc.id, summarizeMismatch(tc.expectedOutput || '', result.actualOutput || ''), false);
  } else {
    badge.className = 'test-result-badge result-fail';
    badge.textContent = 'FAIL';
    timeEl.textContent = `${result.timeMs}ms`;
    actualSection.style.display = '';
    actualEl.textContent = result.actualOutput;
    actualEl.className = 'test-io-text tc-actual test-actual-fail';
    setTestCaseCompareNote(tc.id, summarizeMismatch(tc.expectedOutput || '', result.actualOutput || ''), true);
  }

  tc.result = result;
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
    const actualEl = document.getElementById(`tc-actual-${tc.id}`);
    if (actualEl) actualEl.textContent = '';
    setTestCaseCompareNote(tc.id, '');
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
  const container = document.getElementById('bundle-status');
  if (!container) return; // Guard against missing element
  
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
    
    // Clear previous
    if (meta) meta.innerHTML = '';

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
        const link = document.createElement('a');
        link.className = 'bundle-download-link';
        link.textContent = 'Download';
        // Prevent default link behavior, use electronAPI
        link.href = '#';
        link.onclick = (e) => {
          e.preventDefault();
          const urls = {
            java: 'https://adoptium.net/',
            cpp: 'https://code.visualstudio.com/docs/cpp/config-mingw', // Generic helpful link
            python: 'https://www.python.org/downloads/'
          };
          if (process.platform === 'darwin' && lang === 'cpp') urls.cpp = 'https://developer.apple.com/xcode/resources/';
          
          if (urls[lang]) window.electronAPI.openExternal(urls[lang]);
        };
        meta.appendChild(document.createTextNode((b.installHint || 'Not installed. ') + ' '));
        meta.appendChild(link);
      }
    }
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function initializeBrandingAssets() {
  const candidateSources = ['../../assets/icons/logo.png', '../../assets/icons/icon.png'];
  ['welcome-logo', 'sidebar-logo'].forEach((id) => {
    const img = document.getElementById(id);
    if (!img) return;

    let idx = 0;
    img.src = candidateSources[idx];
    img.onerror = () => {
      idx += 1;
      if (idx < candidateSources.length) {
        img.src = candidateSources[idx];
      } else {
        img.style.display = 'none';
      }
    };
  });
}

function applySidebarCollapsedUI(collapsed) {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  if (toggleBtn) {
    toggleBtn.textContent = collapsed ? 'Show' : 'Hide';
    toggleBtn.title = `${collapsed ? 'Show' : 'Hide'} sidebar (⌘B)`;
  }

  setTimeout(() => {
    if (editor) editor.layout();
  }, 120);
}

async function setSidebarCollapsed(collapsed, persist = true) {
  settings.sidebarCollapsed = !!collapsed;
  applySidebarCollapsedUI(settings.sidebarCollapsed);
  if (persist) {
    await window.electronAPI.setSetting('sidebarCollapsed', settings.sidebarCollapsed);
  }
}

function toggleSidebar() {
  void setSidebarCollapsed(!(settings.sidebarCollapsed === true));
}

function applyTheme(theme) {
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-hc-black');
  document.body.classList.add(`theme-${theme}`);
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
  document.getElementById('setting-java-formatter-path').value = settings.javaFormatterPath || '';
  document.getElementById('setting-clang-format-path').value = settings.clangFormatPath || '';
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
  const javaFormatterPath = document.getElementById('setting-java-formatter-path').value.trim();
  const clangFormatPath = document.getElementById('setting-clang-format-path').value.trim();
  const autoPickBestBundle = document.getElementById('setting-auto-pick-bundle').checked;
  const usacoMode = document.getElementById('setting-usaco-mode').checked;
  const usacoProblem = sanitizeProblemName(document.getElementById('setting-usaco-problem').value.trim() || 'problem');
  const usacoUseFileInput = document.getElementById('setting-usaco-file-input').checked;

  const updates = { theme: newTheme, fontSize: newFontSize, tabSize: newTabSize,
    showLineNumbers, wordWrap, minimap, formatOnSave, timeLimitMs, memoryLimitMb,
    javaPath, javacPath, cppCompiler, pythonPath, javaFormatterPath, clangFormatPath, autoPickBestBundle,
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
    if (!workspaceRoot && status?.inRepo && status.root) {
      await setWorkspaceRoot(status.root, true);
    }
  } catch (err) {
    console.error(err);
  }
}

async function openTerminalAtWorkspace() {
  const targetPath = workspaceRoot || currentFilePath || gitState?.root || null;
  const result = await window.electronAPI.openTerminal(targetPath);
  if (!result?.ok) {
    const detail = result?.error ? `: ${result.error}` : '.';
    setStatus('error', `Terminal Open Failed${detail}`);
    alert(`Failed to open terminal${detail}`);
    return;
  }
  setStatus('idle', `Terminal Opened (${basenameSafe(result.cwd || targetPath || 'workspace')})`);
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

  branchEl.textContent = gitState.branch;
  dirtyEl.textContent = gitState.dirtyCount > 0 ? `• ${gitState.dirtyCount}` : '';
  rootEl.textContent = basenameSafe(gitState.root);
  rootEl.title = gitState.root;
  remoteBtn.disabled = !toBrowsableRemoteUrl(gitState.remoteUrl);

  // Update Status Bar
  const sbBranch = document.getElementById('sb-git-text');
  if (sbBranch) sbBranch.textContent = gitState.branch;
}

// ─── Submission Helpers ───────────────────────────────────────────────────────
function initSubmissionPanel() {
  document.getElementById('submit-platform').value = settings.submitPlatform || 'codeforces';
  document.getElementById('submit-cf-contest').value = settings.submitCodeforcesContest || '';
  document.getElementById('submit-cf-problem').value = settings.submitCodeforcesProblem || 'A';
  document.getElementById('submit-usaco-cpid').value = settings.submitUsacoCpid || '';
  updateSubmissionFieldVisibility();
}

function updateSubmissionFieldVisibility() {
  const platform = document.getElementById('submit-platform').value;
  const codeforcesFields = document.getElementById('submit-codeforces-fields');
  const usacoFields = document.getElementById('submit-usaco-fields');
  if (platform === 'usaco') {
    codeforcesFields.classList.add('submit-hidden');
    usacoFields.classList.remove('submit-hidden');
  } else {
    codeforcesFields.classList.remove('submit-hidden');
    usacoFields.classList.add('submit-hidden');
  }
}

function saveSubmissionSettingsFromUI() {
  settings.submitPlatform = document.getElementById('submit-platform').value;
  settings.submitCodeforcesContest = document.getElementById('submit-cf-contest').value.trim();
  settings.submitCodeforcesProblem = (document.getElementById('submit-cf-problem').value.trim() || 'A').toUpperCase();
  settings.submitUsacoCpid = document.getElementById('submit-usaco-cpid').value.trim();

  updateSubmissionFieldVisibility();

  window.electronAPI.setSetting('submitPlatform', settings.submitPlatform);
  window.electronAPI.setSetting('submitCodeforcesContest', settings.submitCodeforcesContest);
  window.electronAPI.setSetting('submitCodeforcesProblem', settings.submitCodeforcesProblem);
  window.electronAPI.setSetting('submitUsacoCpid', settings.submitUsacoCpid);
}

async function getSubmissionTargetsFromUI() {
  saveSubmissionSettingsFromUI();
  return window.electronAPI.getSubmissionTargets({
    platform: settings.submitPlatform,
    contestId: settings.submitCodeforcesContest,
    problemIndex: settings.submitCodeforcesProblem,
    cpid: settings.submitUsacoCpid,
  });
}

async function openSubmissionTarget(targetKey) {
  const result = await getSubmissionTargetsFromUI();
  if (!result.ok) {
    alert(result.error || 'Could not build submission URLs.');
    return;
  }
  const url = result[targetKey];
  if (!url) {
    alert('URL is not available for this action.');
    return;
  }
  window.electronAPI.openExternal(url);
}

async function exportSubmissionFile() {
  const ext = settings.language === 'cpp' ? 'cpp' : settings.language === 'python' ? 'py' : 'java';
  let baseName = currentFilePath ? basenameSafe(currentFilePath).replace(/\.[^.]+$/, '') : 'solution';
  if (settings.submitPlatform === 'usaco' && settings.usacoProblem) {
    baseName = sanitizeProblemName(settings.usacoProblem);
  }

  const result = await window.electronAPI.saveFileDialog(`${baseName}.${ext}`);
  if (result.canceled || !result.filePath) return;

  const write = await window.electronAPI.writeFile(result.filePath, editor.getValue());
  if (!write.ok) {
    alert(`Export failed: ${write.error}`);
    return;
  }

  setStatus('ok', `Exported ${basenameSafe(result.filePath)}`);
}

// ─── VSCode Extension Snippet Import ─────────────────────────────────────────
async function importVSCodeExtension() {
  const result = await window.electronAPI.openFolderDialog();
  if (!result || result.canceled || !result.filePaths?.length) return;

  const folderPath = result.filePaths[0];
  const importResult = await window.electronAPI.importVSCodeExtensionFolder(folderPath);
  applyImportedExtensionResult(importResult);
}

async function importVSIXExtension() {
  const result = await window.electronAPI.openVsixDialog();
  if (!result || result.canceled || !result.filePaths?.length) return;

  const importResult = await window.electronAPI.importVSIXFile(result.filePaths[0]);
  applyImportedExtensionResult(importResult);
}

function applyImportedExtensionResult(importResult) {
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
    const sourceType = item.extension.sourceType === 'vsix' ? 'vsix' : 'folder';
    row.innerHTML = `
      <div class="vscode-import-title">${escHtml(item.extension.displayName || item.extension.name)}</div>
      <div class="vscode-import-meta">${item.snippetCount || 0} snippets • ${sourceType}</div>
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

function requirePathDirname(value) {
  if (!value) return '';
  const idx = Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\'));
  if (idx <= 0) return value;
  return value.slice(0, idx);
}

function isPathInsideRoot(filePath, rootPath) {
  if (!filePath || !rootPath) return false;
  const normalize = (value) => value.replace(/\\/g, '/').replace(/\/+$/, '');
  const fp = normalize(filePath);
  const rp = normalize(rootPath);
  return fp === rp || fp.startsWith(`${rp}/`);
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
