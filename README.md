# CompIDE — Competitive Programming IDE

A fast, offline-capable desktop IDE built specifically for competitive programmers (USACO, IOI, ICPC, Codeforces, etc.).

## ✨ Features

- **Monaco Editor** — the same editor powering VS Code, with full syntax highlighting, autocomplete, bracket pair colorization, and font ligatures
- **Java, C++ & Python support** — compile and run all three languages with a single keypress
- **One-click run** — press `⌘↵` (macOS) or `Ctrl+Enter` (Windows) to compile + run instantly
- **Custom input panel** — paste your test input, hit run, see output immediately
- **Test case manager** — define multiple input/expected-output pairs; run all at once and see PASS/FAIL/TLE per test
- **Competition templates** — USACO Java, USACO C++, DP, Graph (Dijkstra), Fast Scanner, Segment Tree baked right in
- **Time limit enforcement** — configurable TLE detection (default 5000 ms)
- **Language bundle auto-detection** — detects Java (`java` + `javac`), C++ (`g++`/`clang++`/`cl`), and Python (`python3`/`python`/`py -3`) at startup
- **Smart bundle auto-selection** — picks the best installed runtime/compiler per language (macOS + Windows-aware) and supports manual path overrides
- **Compile cache for speed** — skips recompilation when code/toolchain are unchanged
- **Themes** — Dark, Light, High Contrast (toggle in Settings)
- **Persistent settings** — font size, tab size, time limit, compiler paths all saved locally
- **USACO file mode** — optional `<problem>.in` input fallback and automatic `<problem>.out` output writing
- **Workspace Git status** — local branch + dirty-state summary directly in sidebar
- **VSCode snippet import** — import unpacked VSCode extension folders and use their Java/C++/Python snippets in Monaco autocomplete
- **Fully offline** — no internet required after install
- **macOS & Windows** — works on both platforms

## 🚀 Quick Start

### Prerequisites

Install the language runtimes you want to use:

| Language | Install |
|---|---|
| Java | [Adoptium JDK 17+](https://adoptium.net/) or `brew install openjdk` |
| C++ | Xcode CLI Tools: `xcode-select --install` (macOS) or MinGW/MSYS2 (Windows) |
| Python | [python.org](https://www.python.org/downloads/) or `brew install python` |

### Run the App

```bash
# Clone
git clone https://github.com/charlie2233/Easy_Java_Ide-for-competitions.git
cd Easy_Java_Ide-for-competitions

# Install dependencies
npm install

# Start
npm start
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘↵` / `Ctrl+Enter` | Run code |
| `⌘⇧↵` / `Ctrl+Shift+Enter` | Switch to Input tab and run |
| `⌘T` / `Ctrl+T` | Run all test cases |
| `⌘.` / `Ctrl+.` | Stop running process |
| `⌘S` / `Ctrl+S` | Save file |
| `⌘O` / `Ctrl+O` | Open file |
| `⌘N` / `Ctrl+N` | New file |
| `⌘,` / `Ctrl+,` | Open Settings |

## 🧪 Running Tests

```bash
npm test
```

Runs 14 automated tests covering Java/C++/Python compilation, execution, input handling, TLE detection, compile error detection, test case comparison, bundle detection, and VSCode snippet import.

## 🗂️ Project Structure

```
.
├── main.js              # Electron main process
├── preload.js           # Context bridge (renderer ↔ main)
├── src/
│   ├── main/
│   │   ├── runner.js         # Compile + execute code
│   │   ├── test-runner.js    # Multi-test-case runner with pass/fail comparison
│   │   ├── bundle-manager.js # Detect installed language runtimes
│   │   └── vscode-importer.js # Import snippets from unpacked VSCode extensions
│   └── renderer/
│       ├── index.html        # App UI
│       ├── app.js            # Renderer logic (Monaco integration, UI state)
│       └── styles.css        # Themes and layout
├── templates/           # Template reference docs
├── tests/
│   └── runner.test.js   # Automated backend tests
└── package.json
```

## ⚙️ Settings

Open Settings with `⌘,`. Configure:

- **Theme** — Dark / Light / High Contrast
- **Font size** and **Tab size**
- **Time limit** (ms) — used for TLE detection
- **Memory limit** (MB) — passed to JVM as `-Xmx`
- **Language paths** — override auto-detected compiler/runtime paths
- **Auto-pick bundle** — enable/disable automatic toolchain selection
- **USACO file mode** — set base problem name and file-input fallback behavior

## 📦 Build Installers

```bash
# macOS .dmg/.zip
npm run dist:mac

# Windows installer/.zip
npm run dist:win
```

## 🏆 USACO-Specific Tips

- Use the **"USACO Java"** or **"USACO C++"** templates for the correct I/O setup
- For file I/O problems, uncomment the `FileReader`/`FileWriter` lines in the Java template
- Set your **Time Limit** in Settings to match the problem's limit (typically 2000–4000 ms for USACO)
- Add all sample test cases from the problem statement in the **Test Cases** panel and run them all at once before submitting

## 📋 Roadmap

- [x] Packaged macOS + Windows build scripts (`electron-builder`)
- [x] VSCode extension import (unpacked folder snippets)
- [ ] VSIX direct import
- [ ] Integrated file explorer / project view
- [ ] Syntax-aware code formatting (Google Java Format, clang-format)
- [ ] Submission integrations (Codeforces, USACO)
- [ ] Problem fetcher (parse problems from competitive programming sites)
