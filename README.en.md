[中文](README.md) | [English](README.en.md)

# Frontend Treasure Chest

A collection of auxiliary tools for frontend development, integrating multiple features to help frontend developers improve efficiency, reduce repetitive work, and enhance development quality.

## 1. Feature Overview

### CSS & HTML Tools
- Generate CSS style structures by selecting frontend template code (supports CSS/LESS/SCSS)
- Display the CSS structure corresponding to a class name (hover preview)
- Click a class name to automatically navigate to its CSS definition
- Click an attribute value to quickly navigate to its definition or assignment location
- AI-powered semantic class naming (supports BEM / CSS Modules / Tailwind conventions)
- CSS redundancy detection report with select all / invert selection / batch delete for unused classes
- **CSS Compatibility Hover** — Hover CSS property names to see browser compatibility and vendor prefix suggestions
- **CSS Variable Extraction** — Scan hardcoded colors/sizes and extract as `:root` CSS variables
- **Quick Wrap Tag** — Select content, enter tag name (supports attributes), auto-wrap

### API & Data Tools
- Generate dubbo interface definitions from API names
- Generate multi-level mock data from interface documentation (pure code generation, no AI required)
- **JSON to TypeScript Types** — Select JSON or paste JSON to automatically generate TypeScript interface definitions, with Zod Schema validation code generation support
- **Timestamp/Date Conversion** — Bidirectional conversion between timestamps and date strings, with results automatically copied to clipboard

### Conversion Tools
- **CSS Unit Batch Conversion** — Select CSS code and convert px↔rem, px↔vw with one click, supporting custom base values
- **Color Format Conversion** — Select a color value and convert between HEX / RGB / RGBA / HSL / HSLA
- **Encode/Decode Conversion** — Supports URL encoding/decoding, Base64 encoding/decoding, HTML entity encoding/decoding
- **SVG Optimization** — Remove comments, metadata, and redundant attributes to reduce SVG file size

### AI Design to Code
- **Figma Link to Frontend Code** — Paste a Figma component link to automatically fetch design data and generate HTML/Vue/React/Tailwind code via AI streaming (with smart rate limiting and persistent caching to significantly reduce API throttling risks)
- **AI Self-Check & Fix** — Automatically detect code issues (unclosed tags, missing structures, etc.) after generation and call AI to fix them
- **Streaming Output** — AI generation is written to the editor in real time, no need to wait for completion
- **API Request Code Generation** — Select JSON response data, choose axios/fetch, and AI automatically generates complete TypeScript request code + type definitions
- **Code Diff Comparison** — Select two code snippets and AI generates a semantic Markdown diff description, suitable for PR descriptions

### Development Aids
- **Regex Visual Tester** — Open a visual panel, input regex + test text in real time, highlight matches and display capture groups; includes Token color parsing, capture group highlighting, and 11 common regex templates (email, phone, URL, ID card, IP, etc.)
- **JSON Path Query** — Open a visual panel, input JSON data and path expressions (e.g., `data.list[0].name`), preview matching results in real time
- **HTML Accessibility (a11y) Check** — Automatically detect accessibility issues in HTML/Vue files (missing alt on img, empty buttons, inputs without labels, etc.), auto-check on editor switch and save, with VS Code native squiggly line warnings
- **Image Resource Analysis** — Scan workspace for unused images, duplicate images (based on file hash), and oversized images, generate a visual analysis report with format conversion suggestions (PNG→WebP estimated ~30% savings)
- **CSS Redundancy Detection** — Scan CSS class definitions not referenced by templates, supporting current file and entire workspace modes, generate visual reports, batch delete redundant classes
- **Snippet Collection** — Save selected code as reusable snippets, support tag categorization, template variables (`${1:default}` syntax), usage frequency sorting, and data persistence
- **Placeholder Image Generation** — Quickly select dimensions and insert a placeholder `<img>` tag
- **Console.log Management** — Place cursor on a variable to quickly insert console.log, one-click remove/comment/highlight/toggle all console.log and console.warn (preserves console.error for error handling)
- Quick navigation to imported component paths — select path, right-click to trace, automatically search and locate component files (supports `@/` and `~/` prefixes)
- **Chinese Variable Name Auto-Translation to English** — Automatically translate Chinese variable names after `const/let/var` to English camelCase (e.g., `const 用户名` → `const userName`), with a local dictionary of 480 single characters + 80 word groups, prioritizing longest word-group match, zero latency, optional AI mode
- **Chinese Code Snippets** — Type Chinese keywords to auto-expand code snippets (e.g., type `判断` → `if (condition) { }`), covering conditionals, loops, functions, requests/API, array operations, string handling, DOM operations, storage, regex, testing, Vue/React templates across 16 categories with 150+ keywords
- **Snippet Import/Export** — Supports export to VS Code `.code-snippets` format and import (auto-deduplication and merging)
- **Figma Design Token Extraction** — Extract colors, fonts, border radii, spacing, and other design tokens from Figma files, output as CSS Variables / SCSS Variables / Tailwind Config

### New Tools (v2.0.1)
- **Flexbox/Grid Layout Visualizer** — Real-time parameter adjustment and layout preview, one-click copy CSS code
- **Dead Code Detection** — Detect unused functions and variables in the current file
- **Git Blame Inline Hint** — Hover code lines to see last commit info
- **Quick Static Server** — One-click local HTTP static server
- **npm Version Query** — Hover package names in package.json to see latest version
- **TODO Board** — Scan workspace TODO/FIXME/HACK comments, display in tag-based kanban columns
- **Clipboard History** — Auto-record last 50 clipboard entries, quick paste
- **Environment Variable Manager** — Visual management of .env files, multi-environment support

### Sidebar Panel
- View current project information (branch, commit history, contributors, etc.)
- Tool function list — click to execute

![GIF](https://i.postimg.cc/RFkVkB6v/classaisc.gif)

## 2. How to Use

### Quickly View Attribute Value Definition/Assignment Location

1. Open any frontend HTML code file
2. Hover over an attribute value in the code
3. Ctrl + left-click the attribute value to automatically navigate to its definition or assignment location; if multiple locations exist, a popup will appear for selection

### Quickly Generate CSS Structure

![GIF](https://i.postimg.cc/jdrSvRYX/cssjg.gif)

1. Open any frontend HTML code file
2. Select the code snippet for which you want to generate CSS styles
3. Right-click and select "Quickly Generate CSS Structure"

### View CSS Structure for Class Names and Navigate to Definition

![GIF](https://i.postimg.cc/5y8N1RLL/csslj.gif)

1. Open any frontend HTML code file
2. Hover over a class name to view its style structure
3. Ctrl + left-click the class name to automatically navigate to its CSS definition location

### Generate TypeScript Types from JSON

1. Select JSON text, or right-click and choose "JSON to TypeScript Types"
2. If no text is selected, an input box will appear for pasting JSON
3. Automatically generates TypeScript interface definitions and opens them in a new editor window

### CSS Unit Batch Conversion

1. Select CSS code containing px/rem/vw values
2. Right-click and choose "CSS Unit Batch Conversion"
3. Select the conversion direction (px→rem, px→vw, rem→px, vw→px)
4. Unit values in the selected code are automatically replaced

### Color Format Conversion

1. Select a color value (e.g., `#ff6900`, `rgb(255,105,0)`)
2. Right-click and choose "Color Format Conversion"
3. Select the target format — the value is automatically replaced

### Encode/Decode

1. Select the text to encode or decode
2. Right-click and choose "Encode/Decode Conversion"
3. Select the operation type (URL/Base64/HTML Entity) — the text is automatically replaced

### Regular Expression Tester

1. Open "Regex Visual Tester" from the sidebar or command palette
2. Enter a regular expression and test text in the panel
3. View regex Token color parsing (literals, character sets, capture groups, quantifiers, etc.), hover for descriptions
4. View match highlights and capture group details in real time

### JSON Path Query

1. Open "JSON Path Query" from the sidebar or command palette
2. Paste JSON data in the upper area
3. Enter a path expression in the input box (e.g., `data.list[0].name`)
4. View query results in real time — supports copying

### HTML Accessibility Check

1. Open an HTML or Vue file — the extension automatically checks and marks issues
2. You can also manually trigger a check from the sidebar or right-click menu
3. View squiggly line warnings in the editor and the full list in the "Problems" panel

### Image Resource Analysis

1. Open "Image Resource Analysis" from the sidebar
2. Wait for the scan to complete (supports cancellation)
3. View the report: unused images, duplicate images, oversized images

### CSS Redundancy Detection

1. Open "CSS Redundancy Detection" from the sidebar
2. Select the scan scope (current file / entire workspace)
3. View the report: unused class definitions grouped by file

### API Request Code Generation

1. Select JSON response data (or paste it)
2. Right-click and choose "API Request Code Generation"
3. Select the request library (axios / fetch), optionally enter an API endpoint
4. AI streams TypeScript request code + type definitions

### Code Diff Comparison

1. Select the first code snippet (original code), right-click and choose "Code Diff Comparison"
2. Choose how to provide the second code snippet (clipboard / manual input)
3. Optionally enter supplementary context (e.g., PR title)
4. AI streams a Markdown-formatted diff description

### Snippet Collection

1. Select code, right-click and choose "Save Snippet"
2. Enter a snippet name, optionally enter tags (comma-separated, e.g., `utils,react`)
3. View, insert, copy, or delete saved snippets from the sidebar "Manage Snippets" (sorted by usage frequency)
4. Template variables (e.g., `${1:defaultValue}`) can be used in snippets — an input box will pop up when inserting
5. Supports export to `.code-snippets` format files and import from `.code-snippets` files (auto-deduplication and merging)

### Generate Mock Data from Interface Documentation

![GIF](https://i.postimg.cc/wB3q3vD6/mock.gif)

1. Copy the interface documentation structure (supports multi-level nested types)
2. Right-click to open the menu and select "Generate Mock Data from Interface Documentation"
3. Paste the copied interface structure in the input box and press Enter
4. Multi-level mock data is automatically generated and inserted at the cursor position

### Figma Link to Frontend Code

1. In Figma, right-click a component → "Copy link"
2. In VS Code, right-click and select "Figma Link to Code"
3. Paste the link and press Enter
4. Design data is automatically fetched from the Figma API, and code is generated via AI streaming
5. After generation is complete, code quality is automatically checked and issues are fixed

> **Smart Rate Limiting & Caching**: The extension includes built-in smart rate limiting (default minimum interval of 10 seconds) and file system persistent caching (file data cached for 1 hour, node data cached for 30 minutes), significantly reducing the risk of triggering Figma API rate limits (HTTP 429). Repeated requests for the same file/node are served directly from cache with zero API calls.
>
> First-time use requires configuring `generateCssTree.figmaToken` (Figma personal access token) and AI-related settings (`aiApiEndpoint`, `aiApiKey`, `aiModel`) in the settings. If you encounter frequent rate limiting, you can increase the `figmaMinRequestInterval` value in settings.

### Figma Design Token Extraction

1. Select "Figma Design Token Extraction" from the sidebar or command palette
2. Paste a Figma file link
3. Select the output format (CSS Variables / SCSS Variables / Tailwind Config)
4. Automatically extract design tokens such as colors, fonts, border radii, and spacing from the Figma file and generate code

### Chinese Variable Name Auto-Translation to English

1. Write code normally in js/ts/vue files
2. Type `const 用户名` or `let 价格列表` with Chinese variable names
3. Automatically translated to English camelCase: `userName`, `priceList`
4. Translation result shown in the bottom status bar
5. Can be disabled in settings (`generateCssTree.autoTranslateVariable`) or AI translation mode enabled (`generateCssTree.autoTranslateUseAI`)

### Chinese Code Snippets

1. Type Chinese keywords in js/ts/jsx/tsx/vue files
2. Code completion suggestions pop up automatically — select to insert the corresponding snippet
3. You can also search "Chinese Code Snippet List" from the command palette to view all available snippets

**Supported keyword categories (150+):**

| Category | Example Keywords |
|----------|-----------------|
| Conditionals | 判断 → `if`, 否则 → `else`, 三元 → `? :`, 开关 → `switch` |
| Loops | 循环 → `for`, 遍历 → `for...of`, 映射 → `map`, 过滤 → `filter`, 归约 → `reduce` |
| Functions | 函数 → `function`, 箭头 → `=>`, 异步 → `async`, 立即 → `IIFE` |
| Array Operations | 合并, 切片, 排序, 反转, 扁平化, 包含, 查找索引, 每个, 某个 |
| String Handling | 转大写, 转小写, 首字母大写, 替换, 分割, 截取, 模板字符串 |
| Requests/API | 获取 → `fetch GET`, 发送数据 → `POST`, 上传 → `FormData` |
| Utility Functions | 节流, 防抖, 随机数, UUID, 格式化日期, 柯里化 |
| DOM Operations | 获取元素, 创建元素, 添加类名, 切换类名, 设置属性 |
| Storage | 本地存储, 本地读取, 会话存储 |
| Regular Expressions | 正则匹配, 正则测试, 邮箱正则, 手机正则, URL正则 |
| Testing | 测试套件 → `describe`, 测试用例 → `test`, 期望 → `expect`, 模拟函数 |
| Vue Templates | 条件渲染 → `v-if`, 列表渲染 → `v-for`, 双向绑定 → `v-model`, 插槽, Props |
| React Templates | 组件, 状态 → `useState`, 效应 → `useEffect`, 条件渲染React |

### Quick Wrap Tag

1. Select the content to wrap
2. Right-click → Frontend Treasure Chest → Quick Wrap Tag
3. Enter a tag name (e.g., `div class="box"` or `span`)
4. Automatically wraps with `<tag>selected content</tag>`

### CSS Compatibility Hover

1. Open a CSS/LESS/SCSS/Vue file
2. Hover over a CSS property name (e.g., `flex`, `gap`, `backdrop-filter`)
3. Browser compatibility table and vendor prefix suggestions are displayed automatically

### CSS Variable Extraction

1. Open a CSS/Vue file, right-click → Frontend Treasure Chest → Extract CSS Variable
2. Select hardcoded colors or font sizes to extract (multi-select supported)
3. Enter a variable name prefix (or leave empty for auto-generation)
4. `:root` variables are generated at the top and all references are replaced

### Flexbox/Grid Layout Visualizer

1. Open "Flexbox/Grid Layout Visualizer" from the sidebar or command palette
2. Switch between Flexbox / Grid tabs
3. Adjust direction, alignment, gap, and other parameters for real-time layout preview
4. Click "Copy" to copy the generated CSS code

### Dead Code Detection

1. Open a JS/TS/Vue file, right-click → Frontend Treasure Chest → Dead Code Detection
2. View detected unused functions/variables list
3. Click a list item to navigate to the code location

### Git Blame Hint

1. In any file, hover over a code line
2. Last commit's hash, author, date, and message are displayed automatically

### Quick Static Server

1. Open "Start Static Server" from the sidebar or command palette
2. Enter a port number (default 8080), press Enter
3. Click "Open Browser" to preview the page
4. To stop, run the command again and select "Stop Server"

### npm Version Query

1. Open a package.json file
2. Hover over a dependency package name
3. Latest version, description, last publish date, and outdated status are displayed

### TODO Board

1. Open "TODO Board" from the sidebar or command palette
2. Automatically scans all TODO/FIXME/HACK/XXX/NOTE/BUG comments in workspace
3. Displayed in kanban columns by tag, click entries to navigate to source files
4. Click "Refresh" to re-scan

### Clipboard History

1. Copy code or text normally (extension auto-records, up to 50 entries)
2. Right-click → Frontend Treasure Chest → Clipboard History (or use command palette)
3. Select content from the list to paste at cursor position

### Environment Variable Manager

1. Open "Environment Variable Manager" from the sidebar or command palette
2. Auto-detects all .env files in the project root
3. Switch tabs to select the environment file to edit
4. Edit values and click "Save", or click "+ Add Variable" to create new ones

![GIF](https://i.postimg.cc/wB3q3vD6/mock.gif)

1. Copy the interface documentation structure (supports multi-level nested types)
2. Right-click to open the menu and select "Generate Mock Data from Interface Documentation"
3. Paste the copied interface structure in the input box and press Enter
4. Multi-level mock data is automatically generated and inserted at the cursor position

## 3. Extension Settings

This extension provides the following configuration options:

| Setting | Description | Default |
|---------|-------------|---------|
| `generateCssTree.cssFlavor` | CSS preprocessor type (`css` / `less` / `scss`) | `scss` |
| `generateCssTree.enableHover` | Enable CSS class hover preview | `true` |
| `generateCssTree.enableGoToDefinition` | Enable CSS class go-to-definition | `true` |
| `generateCssTree.remBase` | Base value for px to rem conversion (root font-size) | `16` |
| `generateCssTree.vwDesignWidth` | Design width for px to vw conversion | `375` |
| `generateCssTree.aiApiEndpoint` | AI API endpoint address (OpenAI protocol compatible) | `https://open.bigmodel.cn/api/coding/paas/v4` |
| `generateCssTree.aiApiKey` | AI API key | `` |
| `generateCssTree.aiModel` | AI model name | `GLM-4.7` |
| `generateCssTree.figmaToken` | Figma personal access token | `` |
| `generateCssTree.designOutputFormat` | Design-to-code output format (`html`/`vue`/`vue3`/`react`/`tailwind`) | `vue` |
| `generateCssTree.designAutoFix` | Automatically detect and fix code issues after design-to-code generation | `true` |
| `generateCssTree.largeImageThreshold` | Large image detection threshold (bytes) | `512000` (500KB) |
| `generateCssTree.figmaMinRequestInterval` | Figma API minimum request interval (ms), used to avoid rate limiting | `10000` (10s) |
| `generateCssTree.namingConvention` | Naming convention for AI-generated class names (`custom` / `bem` / `cssModules` / `tailwind`) | `custom` |
| `generateCssTree.autoTranslateVariable` | Automatically translate Chinese variable names to English camelCase after const/let/var | `true` |
| `generateCssTree.autoTranslateUseAI` | Use AI for Chinese variable name translation (requires AI API Key configuration) | `false` |
