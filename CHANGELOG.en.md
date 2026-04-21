[中文](CHANGELOG.md) | [English](CHANGELOG.en.md)

# Changelog
This file records all important changes to the "Frontend Treasure Chest" extension.

The format follows the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) specification,
and version numbers adopt the [Semantic Versioning](https://semver.org/) standard.

## [2.0.1] - 2026-4-21
### Improved
- **Context Menu Cleanup** — All tool entries consolidated into a "Frontend Treasure Chest ▸" submenu, organized into 4 groups (CSS/Code/Navigation/Console), reducing right-click menu from 20+ items to 1 entry
- **Webview Panel Opening** — All standalone panels (Regex Tester, JSON Path, Design to Code, Image Analysis, CSS Redundancy, Layout Visualizer, TODO Board, Env Manager) now open as a right-side split editor (`ViewColumn.Beside`) without stealing focus

## [2.0.0] - 2026-4-20
### Added
- **Code Snippet Management Enhancements** — Snippets now support tag-based categorization (comma-separated input), template variables, and usage frequency tracking (sorted by usage count in descending order, with most-used items appearing first)
- **Chinese Variable Translation Enhancements** — Added approximately 80 common programming phrase dictionaries (e.g., 用户名→username, 价格→price, 搜索框→searchBox), prioritizing phrase-level longest match before character-by-character matching, significantly improving translation quality; supports custom dictionary and undo blacklist parameters (`userDict` / `blacklist`)
- **Unit Tests** — Added Mocha test coverage for core pure function modules: toolbox (JSON→TS, CSS unit conversion, color conversion, timestamp, encode/decode, SVG optimization, console management), ChineseToEnglish (single character/phrase/mixed translation), RegexVisualizer (Token parsing, match analysis), totaling 98 test cases
- **Internationalization Infrastructure** — Added `src/i18n/` module (zh-CN / en string mappings) and `t()` translation function, automatically switching based on VS Code language environment; added `package.nls.json` / `package.nls.en.json` NLS files
- **Chinese Code Snippet Triggers** — In js/ts/jsx/tsx/vue files, typing Chinese keywords automatically expands corresponding code snippets (e.g., typing `判断` → `if (condition) { }`), covering 16 categories with 150+ keywords: conditionals, loops, functions, classes & objects, exception handling, timers, DOM events, Promise & Async, JSON & Data, TypeScript, React, Vue, imports/exports, comments, debugging, common utilities, array operations, string processing, requests/API, utility functions, form handling, routing, storage, regular expressions, DOM manipulation, testing, HTML/Vue templates
- Supports searching "Chinese Code Snippet List" in the command palette to view all available snippets

### New Commands
- `extension.listChineseSnippets` — Chinese code snippet list

## [1.1.26] - 2026-4-15
### Added
- **Auto-translate Chinese Variable Names to English** — When typing `const/let/var` followed by a Chinese variable name in js/ts/vue files, automatically translates to English camelCase naming (e.g., `const 用户名` → `const userName`). Uses a local 480-character dictionary by default (zero latency), with optional AI translation mode for more accurate results
- **Regex Common Template Library** — Regex visual tester now includes 11 common regex templates (email, phone number, URL, ID card number, IP, date, Chinese characters, HTML tags, password strength, hexadecimal color, license plate number); selecting a template auto-fills it
- **Console.log Management Enhancements** — Added "Comment All Console", "Highlight All Console" (3-second orange highlight), and "Toggle Comment Status" commands; removal functionality now also supports console.warn/error
- **Code Snippet Import/Export** — Supports exporting code snippets to VS Code `.code-snippets` format files, and importing from `.code-snippets` files (automatic deduplication and merging)
- **AI Class Naming Multi-convention** — AI-generated class names now support selectable naming conventions: custom semantic, BEM (block__element--modifier), CSS Modules (camelCase), Tailwind utility classes
- **JSON→TS Enhancements** — Added Zod Schema generation mode (TS types + Zod validation), supports automatic JSON reading from clipboard, customizable root type name
- **CSS Redundancy Detection One-click Cleanup** — Redundancy report panel now has select all / invert selection / batch delete functionality, supporting cross-file batch deletion of redundant class definitions (validates line content before deletion to prevent accidental removal)
- **Image Analysis Compression Suggestions** — Image analysis report now includes format conversion suggestions (PNG→WebP estimated ~30% savings, JPEG→WebP estimated ~25% savings), with tinypng.com / squoosh.app compression tool tips for large images
- **Figma Design Token Extraction** — Extract design tokens such as colors, fonts, border radius, and spacing from Figma files, supporting output in CSS Variables / SCSS Variables / Tailwind Config formats

### Improved
- Console.log removal functionality now also supports console.warn and console.error

### New Configuration
- `generateCssTree.autoTranslateVariable` — Whether to enable automatic Chinese variable name translation (default: true)
- `generateCssTree.autoTranslateUseAI` — Whether to use AI for Chinese variable name translation (default: false, uses local dictionary)
- `generateCssTree.namingConvention` — Naming convention for AI-generated class names (default: custom)

### New Commands
- `extension.commentAllConsoleLogs` — Comment all console statements
- `extension.highlightConsoleLogs` — Highlight all console statements
- `extension.toggleConsoleLogs` — Toggle console comment status
- `extension.exportSnippets` — Export code snippets
- `extension.importSnippets` — Import code snippets
- `extension.figmaExtractTokens` — Figma design token extraction

## [1.1.25] - 2026-4-14
### Improved
- **Figma API Rate Limiting Optimization** — Intelligent rate limiting control, minimum request interval increased from 5 seconds to 10 seconds, supports server Retry-After response header automatic waiting, exponential backoff retry strategy (10s/20s/40s)
- **File System Persistent Cache** — Figma file data cached for 1 hour, node data cached for 30 minutes, cache persists across sessions, significantly reducing API calls
- **Intelligent Data Fetching Strategy** — Prioritizes fetching entire file data then extracting specified nodes, reducing direct Figma API calls
- **429 Error Message Improvements** — Displays quota reset time, current configuration values, provides clear solution suggestions

### New Configuration
- `generateCssTree.figmaMinRequestInterval` — Minimum Figma API request interval (milliseconds), default 10000ms (10 seconds)

## [1.1.23] - 2026-4-13
### Added
- **HTML Accessibility (a11y) Checker** — Automatically detects common accessibility issues in HTML/Vue files (img missing alt, empty buttons, input missing label, anchors missing href, etc.), uses VS Code native squiggly line indicators, automatically checks on editor switch and file save
- **JSON Path Query** — Opens a visual panel where you input JSON data and path expressions (e.g., `data.list[0].name`), with real-time preview of matched results and copy support
- **API Request Code Generation** — Select JSON response data (or paste it), choose axios/fetch, and AI automatically generates complete TypeScript request code + type definitions
- **Code Diff Comparison** — Select two code snippets (or get the second from clipboard), AI generates semantic Markdown diff descriptions, suitable for PR descriptions
- **Image Resource Analysis** — Scans workspace for unused images, duplicate images (based on SHA-256), and oversized images, generating a visual analysis report
- **CSS Redundancy Detection** — Scans CSS/LESS/SCSS/Vue files for class definitions not referenced by templates, supports both current file and entire workspace modes, generates visual reports
- **Regex Visual Testing** — Regex tester upgraded with colorful regex expression Token parsing (literals, character sets, capture groups, quantifiers, etc.), test text capture group highlighting annotations, and legend explanations

### New Configuration
- `generateCssTree.largeImageThreshold` — Large image detection threshold (bytes), default 500KB

## [1.1.22] - 2026-4-10
### Improved
- Optimized API rate limiting issues

## [1.1.21] - 2026-4-9
### Changed
- Optimized miscellaneous issues

## [1.1.20] - 2026-4-9
### Added
- **JSON to TypeScript Types** — Select JSON data or paste JSON to automatically generate TypeScript interface/type definitions
- **CSS Unit Batch Conversion** — Select CSS code and convert px↔rem, px↔vw with one click, supports custom base values
- **Color Format Conversion** — Select a color value to convert between HEX/RGB/RGBA/HSL/HSLA
- **Timestamp/Date Conversion** — Select a timestamp or date string for automatic bidirectional conversion, with results copied to clipboard
- **Encode/Decode Conversion** — Select text for URL encoding/decoding, Base64 encoding/decoding, HTML entity encoding/decoding
- **SVG Optimization & Compression** — Select SVG code to remove comments, metadata, and redundant attributes, reducing file size
- **Regular Expression Tester** — Opens a visual panel for real-time regex and test text input, highlighting matched results and displaying capture groups
- **Code Snippet Collection** — Select code and right-click to save as snippet; manage, insert, and delete via sidebar with persistent storage
- **Placeholder Image Generation** — Quickly select dimensions and insert `<img src="https://placehold.co/..." />` tags
- **Console.log Management** — Place cursor on a variable and right-click to insert console.log, or remove all console.log in the current file with one click
- Sidebar layout redesign: two-column grid + compact list, displaying more features without feeling cluttered

### New Configuration
- `generateCssTree.remBase` — Base value for px to rem conversion (default: 16)
- `generateCssTree.vwDesignWidth` — Design width for px to vw conversion (default: 375)

## [1.1.19] - 2026-4-3
### Improved
- Panel text adjustments
- Mock data generation functionality improvements

## [1.1.18] - 2026-2-9
### Improved
- Panel display optimization

## [1.1.17] - 2026-2-6
### Added
- Path tracking upgrade, now supports all ~/ or @/ prefixed paths
- Fixed panel copy functionality issue

## [1.1.16] - 2026-2-2
### Fixed
- Fixed panel issue — data not updating

## [1.1.15] - 2026-1-24
### Fixed
- Adjusted some errors and UI issues

## [1.1.14] - 2026-1-21
### Fixed
- A bunch of bugs are being fixed (*^_^*)

## [1.1.13] - 2026-1-19
### Added
- Due to issues with path quick-jump in the previous version, the feature has been changed to mouse selection of the corresponding component path address, with right-click to execute quick component search and open file
- Other detail optimizations

## [1.1.12] - 2026-1-5
### Added
- First, wishing everyone a Happy New Year, good health, and all your wishes come true!!
- Component path quick-jump: hover over the imported component address and Ctrl+click to open that file, supporting @ or ~ path prefixes
- Other optimizations

## [1.1.11] - 2025-12-26
### Added
- Project info now supports copying project name and branch
- More project information displayed

## [1.1.9] - 2025-12-26
### Added
- Optimized miscellaneous issues
- Added panel for learning more about available operations
- Panel now displays project information

## [1.1.8] - 2025-12-10
### Added
- Optimized miscellaneous issues
- AI-powered class name definition (fully released)

## [1.1.3] - 2025-08-28
### Added
- Optimized miscellaneous issues
- Added AI (DeepSeek) powered class name definition (beta testing)

## [1.1.1] - 2025-08-07
### Improved
- Optimized miscellaneous issues

## [1.1.0] - 2025-08-06
### Improved
- Optimized interface definition

## [1.0.9] - 2025-08-06
### Added
- Generate dubbo interface definitions from API interface names

## [1.0.8] - 2025-07-28
### Improved
- Fixed support for generating CSS structures in complex code structures when developing uni-app WeChat mini-programs

## [1.0.7] - 2025-07-25
### Added
- Generate mock data from interface documentation structure (currently only supports single-level generation, not nested)

## [1.0.6] - 2025-07-25
### Improved
- Fixed user experience issues

## [1.0.5] - 2025-06-21
### Added
- In Vue or JS files, Ctrl+left-click on an attribute value to quickly navigate to its definition or assignment location; if multiple locations exist, a popup will appear for selection

## [1.0.4] - 2025-06-20
### Added
- Description and documentation updates

## [1.0.3] - 2025-06-19
### Added
- Extension renamed to "Frontend Treasure Chest" (前端百宝箱)
- Hovering over a class name automatically displays the corresponding CSS structure
- Ctrl+left-click on a class name to jump to the corresponding CSS structure location

## [1.0.2] - 2025-06-19
### Added
- Right-click context menu now includes quick CSS structure generation options: "Current Page" and "New Window"
- Current Page: When a `lang="less"` tag is detected in the frontend code file, CSS structure code will be generated below it without creating a new window; if styles already exist under the less tag, new CSS structure code will be appended after them without affecting the original style structure
- New Window: Opens the CSS structure in a new window

## [1.0.1] - 2025-06-18
### Added
- Initial release
- Fixed a bug where tree structure generation included comments in code snippets
- Removed prerequisite tags
- Added right-click context menu shortcuts
