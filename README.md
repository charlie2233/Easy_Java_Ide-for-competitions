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
- **Language bundle auto-detection** — checks `java`, `javac`, `g++`, and `python3` at startup; shows status in sidebar
- **Themes** — Dark, Light, High Contrast (toggle in Settings)
- **Persistent settings** — font size, tab size, time limit, compiler paths all saved locally
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

Runs 13 automated tests covering Java/C++/Python compilation, execution, input handling, TLE detection, compile error detection, test case comparison, and bundle detection.

## 🗂️ Project Structure

```
.
├── main.js              # Electron main process
├── preload.js           # Context bridge (renderer ↔ main)
├── src/
│   ├── main/
│   │   ├── runner.js         # Compile + execute code
│   │   ├── test-runner.js    # Multi-test-case runner with pass/fail comparison
│   │   └── bundle-manager.js # Detect installed language runtimes
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

## 🏆 USACO-Specific Tips

- Use the **"USACO Java"** or **"USACO C++"** templates for the correct I/O setup
- For file I/O problems, uncomment the `FileReader`/`FileWriter` lines in the Java template
- Set your **Time Limit** in Settings to match the problem's limit (typically 2000–4000 ms for USACO)
- Add all sample test cases from the problem statement in the **Test Cases** panel and run them all at once before submitting

## 📋 Roadmap

- [ ] Packaged macOS `.app` + Windows `.exe` installers
- [ ] VSCode extension import (VSIX loader)
- [ ] Integrated file explorer / project view
- [ ] Syntax-aware code formatting (Google Java Format, clang-format)
- [ ] Submission integrations (Codeforces, USACO)
- [ ] Problem fetcher (parse problems from competitive programming sites)
