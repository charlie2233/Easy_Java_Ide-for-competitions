# CompIDE — Competitive Programming IDE

A fast, "kool", and offline-capable desktop IDE built specifically for competitive programmers (USACO, IOI, ICPC, Codeforces, etc.).

## ✨ Features

- **Monaco Editor** — The same editor powering VS Code, with full syntax highlighting, autocomplete, bracket pair colorization, and font ligatures.
- **Java, C++ & Python Support** — Compile and run all three languages with a single keypress.
- **One-Click Run** — Press `⌘↵` (macOS) or `Ctrl+Enter` (Windows) to compile + run instantly.
- **Auto-Setup & Detection** — Automatically detects installed compilers (Java, GCC/Clang, Python). Provides direct download links if tools are missing.
- **Smart Test Runner** — Define multiple test cases, "Paste Sample" from clipboard, and run all at once with clear PASS/FAIL indicators.
- **Problem Fetcher** — Paste a Codeforces/USACO URL and auto-import sample input/output into test cases.
- **Competition Templates** — Built-in templates for USACO (Java/C++), DP, Graph, Segment Tree, and Fast I/O.
- **USACO Mode** — Optional `<problem>.in` fallback and auto-write `<problem>.out` on successful runs.
- **Project Explorer** — Integrated folder tree for quick file navigation.
- **External Formatting** — Syntax-aware formatting via `google-java-format` and `clang-format` when available.
- **Submission Helpers** — Built-in Codeforces/USACO helper panel for problem/submit links and export-ready source files.
- **Offline Capable** — Works fully offline once compilers are installed.
- **Themes** — Modern Dark (Replit-inspired), Light, and High Contrast themes.
- **Persistent Settings** — Saves your preferences, compiler paths, and snippets.
- **VS Code Import** — Import snippets from unpacked extension folders and direct `.vsix` packages.

## 🚀 Quick Start

### Prerequisites

You need the language runtimes installed. The app will guide you if they are missing!

| Language | Requirement |
|---|---|
| **Java** | [Adoptium JDK 17+](https://adoptium.net/) |
| **C++** | Xcode CLI Tools (macOS) or MinGW/MSYS2 (Windows) |
| **Python** | [Python 3](https://www.python.org/downloads/) |

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

## 🧪 Testing

```bash
npm test
```
Runs 18 automated tests across runner, bundle detection, snippet imports (folder + VSIX), workspace tree, submission helper, and problem parsing.

## 📦 Build for Distribution

```bash
# macOS .dmg
npm run dist:mac

# Windows .exe
npm run dist:win
```

## 🏆 USACO & Competition Tips

1.  **Templates**: Use the sidebar buttons to insert "USACO Java" or "USACO C++" templates that handle file I/O boilerplate.
2.  **Paste Sample**: Copy the sample input/output from the problem page and click "Paste" in the Test Cases tab.
3.  **Run All**: Click "Run All" to verify your solution against all samples instantly.
4.  **Time Limit**: Adjust the Time Limit in settings (default 5000ms) to match the problem constraints.

## 📋 Roadmap Status

- [x] Packaged macOS + Windows build scripts (`electron-builder`)
- [x] VSCode extension import (unpacked folder snippets)
- [x] VSIX direct import
- [x] Integrated file explorer / project view
- [x] Syntax-aware code formatting (Google Java Format, clang-format)
- [x] Submission integrations (Codeforces, USACO helper flow)
- [x] Problem fetcher (sample test parsing from problem URLs)

---

*Made for competitive programmers, by competitive programmers.*
