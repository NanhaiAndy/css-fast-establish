# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

这是一个名为"前端百宝箱"的 VS Code 扩展（v2.0.1），为前端开发者提供实用工具集以提高开发效率。功能涵盖：CSS 结构生成、class 名称导航、Mock 数据生成、接口定义、AI class 命名（支持 BEM/CSS Modules/Tailwind 规范）、JSON 转 TypeScript（含 Zod Schema）、CSS 单位转换、颜色格式转换、时间戳转换、编解码、SVG 优化、正则可视化测试（含常用模板库）、代码片段管理（含标签/模板变量/频率排序/导入导出）、占位图、console.log 管理（注释/高亮/切换）、Figma 设计稿转前端代码（含智能限流）、Figma 设计令牌提取、HTML 无障碍检查、JSON Path 查询器、API 请求代码生成、代码差异对比、图片资源分析（含压缩建议）、CSS 冗余检测（含一键清理）、中文变量名自动转英文（含词组级字典）、中文代码片段触发器（输入中文关键词自动展开代码，150+ 关键词覆盖 16 个分类）、快速包裹标签、CSS 兼容性提示（hover 自动显示）、CSS 变量提取（硬编码值→CSS 变量）、Flexbox/Grid 布局可视化编辑器、死代码检测、Git Blame 行内提示（hover 自动显示）、快捷静态服务器、npm 依赖版本查询（hover 自动显示）、TODO 看板（按标签分类展示）、剪贴板历史（自动记录最近 50 条）、环境变量管理（可视化管理 .env 文件）。

## 开发命令

```bash
# 编译扩展 TypeScript 代码
yarn run compile
# 或者
tsc -p ./

# 编译 webview (Vue 2 + Vite)
yarn run compile:webview
# 或者
vite build

# 扩展监听模式
yarn run watch
# webview 监听模式
yarn run watch:webview

# 运行测试
yarn run test

# 打包扩展用于发布
yarn run package
```

## 架构

### 双构建系统
项目使用两个独立的构建配置：
- **扩展代码**：使用 TypeScript 编译到 `out/` 目录（target: commonjs, es2020）
  - 配置：`tsconfig.json` - 排除了 `vite.config.ts`、`tsconfig.webview.json`、`webview-dist`
- **Webview 代码**：使用 Vite + Vue2 构建到 `webview-dist/` 目录
  - 配置：`vite.config.ts` + `tsconfig.webview.json`
  - 入口：`src/webview/main.ts`
  - 输出：`index.js`、`index.css` 以及 `webview-dist/` 中的资源文件

### 核心源文件

**扩展入口点：**
- `src/extension.ts` - 精简入口，初始化 i18n 和侧边栏，调用各 Controller 注册命令
- `src/controllers/` - 6 个功能控制器模块：
  - `cssController.ts` - CSS 生成命令 + hover/definition providers
  - `navigationController.ts` - 路径查找、接口定义、Mock 数据
  - `toolboxController.ts` - JSON→TS、单位/颜色/时间戳转换、编解码、SVG、正则、片段、占位图、console
  - `translationController.ts` - 中文变量自动翻译监听器
  - `aiController.ts` - Figma 转代码、令牌提取、API 代码生成、代码差异（含 streamToEditor）
  - `analysisController.ts` - A11y 检查、JSON Path、图片分析、CSS 冗余
  - `types.ts` - 共享 `ControllerDeps` 接口

**核心模块：**
- `src/cssTree.ts` - 从 HTML 文档树生成 CSS 结构（支持 CSS、SCSS、LESS）
- `src/examinecss.ts` - CSS 分析、悬停提示、跳转定义、Mock 数据生成、接口定义
- `src/selection.ts` - 文本选择工具（getText、removeVIfElements）和 AI class 定义生成（通过 `designToCode.callAI` 统一调用）
- `src/ToolboxSidebarProvider.ts` - Webview 侧边栏提供者，显示项目信息和工具列表
- `src/toolbox.ts` - 工具函数集合：JSON→TS 类型（含 Zod Schema 生成）、CSS 单位转换、颜色转换、时间戳转换、编解码、SVG 优化、占位图、console.log 管理（注释/高亮/切换）
- `src/RegexPanel.ts` - 正则可视化测试器 Webview Panel（Token 解析 + 捕获组高亮 + 常用模板库）
- `src/RegexVisualizer.ts` - 正则表达式解析器（纯函数，将正则解析为 Token 序列）
- `src/A11yChecker.ts` - HTML 无障碍检查，使用 `vscode.languages.createDiagnosticCollection` 原生诊断
- `src/JsonPathPanel.ts` - JSON Path 查询器 Webview Panel
- `src/ApiCodeGenerator.ts` - API 请求代码生成 prompt 构建
- `src/CodeDiffAnalyzer.ts` - 代码差异对比 prompt 构建
- `src/ImageAnalyzer.ts` - 图片资源分析（未使用/重复/大图扫描）
- `src/ImageAnalysisPanel.ts` - 图片分析报告 Webview Panel
- `src/CssRedundancyDetector.ts` - CSS 冗余检测（class 定义与引用交叉比对）
- `src/CssRedundancyReportPanel.ts` - CSS 冗余报告 Webview Panel（含全选/反选/批量删除）
- `src/SnippetManager.ts` - 代码片段管理器，使用 globalState 持久化（含标签、模板变量、使用频率追踪、导入导出 `.code-snippets` 格式）
- `src/ChineseToEnglish.ts` - 中文变量名本地翻译字典（480 单字 + 80 词组，最长匹配）+ camelCase 拼接函数，支持自定义词典和撤销黑名单
- `src/ChineseSnippetTrigger.ts` - 中文代码片段触发器，输入中文关键词（如"判断"）自动提示对应代码片段（150+ 关键词，16 分类），通过 CompletionItemProvider 注册到 js/ts/jsx/tsx/vue 语言
- `src/i18n/` - 国际化模块（`index.ts` 提供 `t()` 翻译函数，`zh-CN.ts` / `en.ts` 字符串映射）
- `src/FigmaTokenExtractor.ts` - Figma 设计令牌提取器（颜色/字体/圆角/间距），支持 CSS/SCSS/Tailwind 输出
- `src/designToCode.ts` - AI 设计转代码核心逻辑：Figma API 数据获取（含智能限流控制、文件系统持久化缓存、Retry-After 重试）、AI 流式调用、代码自检修复
- `src/DesignToCodePanel.ts` - 设计转代码结果展示 Webview Panel
- `src/WrapWithTag.ts` - 快速包裹标签（选中内容→输入标签名→自动包裹）
- `src/CssCompatHover.ts` - CSS 属性兼容性 Hover Provider（内置 caniuse 精简数据，覆盖 flex/grid/backdrop-filter/aspect-ratio 等 30+ 属性）
- `src/CssVariableExtractor.ts` - CSS 变量提取器（扫描硬编码颜色/字号，生成 `:root` 变量并替换引用）
- `src/LayoutVisualizerPanel.ts` - Flexbox/Grid 布局可视化 Webview Panel（实时调参预览 + CSS 代码生成）
- `src/DeadCodeDetector.ts` - 死代码检测（扫描未使用的函数/变量/导出）
- `src/GitBlameHover.ts` - Git Blame Hover Provider（hover 代码行显示 commit 信息）
- `src/QuickServer.ts` - 快捷静态服务器（Node.js http 模块，支持自定义端口）
- `src/NpmVersionHover.ts` - npm 依赖版本 Hover Provider（查询 npm registry，30 分钟缓存）
- `src/TodoBoardPanel.ts` - TODO 看板 Webview Panel（扫描工作区 TODO/FIXME/HACK 等注释，按标签分类展示）
- `src/ClipboardHistory.ts` - 剪贴板历史（每秒检测剪贴板变化，记录最近 50 条，QuickPick 选择粘贴）
- `src/EnvManagerPanel.ts` - 环境变量管理 Webview Panel（解析 .env 文件，可视化编辑/添加/删除）

**Webview (Vue 2)：**
- `src/webview/main.ts` - Vue 应用入口，初始化 VSCode API 桥接
- `src/webview/App.vue` - 根组件，包含 ProjectInfo 和 ToolboxList
- `src/webview/components/` - 侧边栏面板的 Vue 组件

### Webview Panel 打开方式
所有独立 Webview Panel（正则测试器、JSON Path 查询器、设计转代码结果、图片分析报告、CSS 冗余报告、布局可视化、TODO 看板、环境变量管理）统一使用 `ViewColumn.Beside` + `preserveFocus: true` 打开，即在当前编辑器右侧拆分，且不抢夺焦点。

### 关键依赖
- `document-tree` - HTML/Vue 模板解析，用于 CSS 结构生成
- `node-fetch` - AI 功能的 HTTP 请求
- `vue` 2.7 + `@vitejs/plugin-vue2` - Webview UI 框架
- `vscode` - VS Code 扩展 API

### 注册的命令
- `extension.generateCssTree` - 在新窗口中生成 CSS
- `extension.generateCssTreeNewlyOpened` - 在当前文档中生成 CSS（如果找到 `<style lang="less">` 则插入其中）
- `extension.addClassDefinition` - AI 驱动的 class 名称生成（支持 BEM/CSS Modules/Tailwind 规范选择）
- `extension.findLookModule` - 快速查找以 `~/` 或 `@/` 开头的组件路径
- `extension.interfaceDefinition` - 生成 dubbo 接口定义
- `extension.interfaceDefinitionFromArtifact` - 通过生成物批量生成 dubbo 接口定义
- `extension.generateMockDataAi` - 根据接口文档生成 Mock 数据
- `extension.jsonToTs` - JSON 转 TypeScript 类型定义（含 Zod Schema）
- `extension.cssUnitConvert` - CSS 单位批量转换（px/rem/vw）
- `extension.colorConvert` - 颜色格式转换（HEX/RGB/HSL）
- `extension.timestampConvert` - 时间戳与日期互转
- `extension.encodeDecode` - 编解码转换（URL/Base64/HTML实体）
- `extension.optimizeSvg` - SVG 优化压缩
- `extension.regexTester` - 正则可视化测试器（Token 解析 + 捕获组高亮 + 常用模板库）
- `extension.checkA11y` - HTML 无障碍（a11y）检查
- `extension.jsonPathQuery` - JSON Path 查询器
- `extension.generateApiCode` - API 请求代码生成（AI）
- `extension.compareCodeDiff` - 代码差异对比（AI）
- `extension.analyzeImages` - 图片资源分析
- `extension.detectCssRedundancy` - CSS 冗余检测
- `extension.saveSnippet` - 保存代码片段
- `extension.openSnippetManager` - 管理代码片段
- `extension.placeholderImage` - 插入占位图片
- `extension.insertConsoleLog` - 插入 console.log
- `extension.removeAllConsoleLogs` - 移除所有 console（log/warn/error）
- `extension.commentAllConsoleLogs` - 注释所有 console（带 [toolbox] 标记便于恢复）
- `extension.highlightConsoleLogs` - 高亮所有 console（3秒橙色标记）
- `extension.toggleConsoleLogs` - 切换 console 注释状态
- `extension.exportSnippets` - 导出代码片段为 `.code-snippets` 格式
- `extension.importSnippets` - 从 `.code-snippets` 文件导入代码片段
- `extension.figmaToCode` - Figma 链接转前端代码（流式 AI 输出）
- `extension.figmaExtractTokens` - Figma 设计令牌提取（CSS/SCSS/Tailwind）
- `extension.listChineseSnippets` - 中文代码片段列表（QuickPick 选择插入）
- `extension.wrapWithTag` - 快速包裹标签（选中内容→输入标签名如 div class="box"→自动包裹）
- `extension.extractCssVariable` - 提取 CSS 变量（扫描硬编码颜色/字号，生成 `:root` 变量并替换引用）
- `extension.layoutVisualizer` - Flexbox/Grid 布局可视化（Webview Panel，实时调参预览 + 复制 CSS）
- `extension.detectDeadCode` - 死代码检测（扫描当前文件未使用的函数/变量）
- `extension.startStaticServer` - 启动静态服务器（Node.js HTTP 服务器，可自定义端口）
- `extension.stopStaticServer` - 停止静态服务器
- `extension.todoBoard` - TODO 看板（扫描工作区 TODO/FIXME/HACK 注释，按标签分类展示）
- `extension.clipboardHistory` - 剪贴板历史（查看最近 50 条复制内容，选择粘贴）
- `extension.clearClipboardHistory` - 清空剪贴板历史
- `extension.envManager` - 环境变量管理（可视化管理 .env 文件，支持多环境）

### Hover Providers（自动触发，无需命令）
- **CSS 兼容性提示** — 在 CSS/LESS/SCSS/Vue 中 hover CSS 属性名，显示浏览器兼容性表格和 vendor prefix 建议（`CssCompatHover.ts`）
- **Git Blame 提示** — 在任意文件中 hover 代码行，显示最后一次 commit 信息（`GitBlameHover.ts`）
- **npm 版本查询** — 在 package.json 中 hover 包名，显示最新版本和是否过时（`NpmVersionHover.ts`）

### 语言支持
激活语言：`html`、`vue`、`css`、`less`、`scss`

为 `html` 和 `vue` 文件中的 CSS class 提供悬停提示和跳转定义功能。

### 右键菜单结构
右键菜单使用 VS Code submenu 机制，所有工具入口集中在「前端百宝箱 ▸」子菜单下，按功能分为 4 组：
- **CSS（1_css）**：生成 CSS 结构、生成 CSS 结构(当前页面)、AI 生成 class、单位转换、颜色转换、CSS 变量提取、CSS 冗余检测
- **代码（2_code）**：SVG 优化、编解码、包裹标签、保存片段、代码差异、死代码检测、AI 重命名
- **导航（3_nav）**：路径追踪、占位图片、剪贴板历史
- **Console（4_console）**：插入 console、移除所有、注释所有、切换注释

每个菜单项通过 `when` 条件按语言过滤，只在对应文件类型中显示。

### 配置选项
设置位于 `generateCssTree.*` 下：
- `cssFlavor` - CSS 预处理器类型（默认："sass"，选项：css、less、scss）
- `interiorTest` - 内部测试码
- `enableHover` - 启用 CSS class 悬停预览（默认：true）
- `enableGoToDefinition` - 启用 CSS class 跳转定义（默认：true）
- `remBase` - px 转 rem 的基准值（默认：16）
- `vwDesignWidth` - px 转 vw 的设计稿宽度（默认：375）
- `aiApiEndpoint` - AI API 端点地址（默认：智谱 BigModel）
- `aiApiKey` - AI API 密钥
- `aiModel` - AI 模型名称（默认：GLM-4.7）
- `figmaToken` - Figma 个人访问令牌
- `designOutputFormat` - 设计转代码输出格式（默认：vue，选项：html、vue、react、vue3、tailwind）
- `designAutoFix` - 设计转代码完成后自动检测修复（默认：true）
- `largeImageThreshold` - 大图检测阈值（默认：512000，即 500KB）
- `figmaMinRequestInterval` - Figma API 最小请求间隔（默认：10000，即 10 秒）。用于避免触发 Figma API 速率限制（HTTP 429），增大此值可降低限流风险，减小此值可能提高速度但增加限流风险
- `namingConvention` - AI 生成 class 名称的命名规范（默认：custom，选项：custom/bem/cssModules/tailwind）
- `autoTranslateVariable` - 是否开启中文变量名自动翻译为英文（默认：true）
- `autoTranslateUseAI` - 中文变量名翻译是否使用 AI（默认：false，使用本地 480 字字典）

### AI 集成
所有 AI 功能统一通过 `src/designToCode.ts` 中的 `callAI` / `callAIStream` 调用，配置读取自 `generateCssTree.*`（`aiApiEndpoint`、`aiApiKey`、`aiModel`），支持任意 OpenAI 协议兼容的 API。使用场景包括：
- Class 名称定义生成（`selection.ts` → `designToCode.callAI`，支持 BEM/CSS Modules/Tailwind 规范）
- Figma 设计稿转前端代码（流式输出 + 自动修复）
- API 请求代码生成（从 JSON 响应生成 axios/fetch 请求代码 + TS 类型）
- 代码差异对比（生成语义化 Markdown 差异说明）
- 中文变量名翻译（可选，默认使用本地字典 `ChineseToEnglish.ts`）

### 中文变量名自动翻译

在 js/ts/vue 文件中，监听 `onDidChangeTextDocument` 事件，检测 `const/let/var` 后的中文变量名：
- 默认使用 `src/ChineseToEnglish.ts` 中的本地字典（480 单字 + 80 词组，优先词组级最长匹配，零延迟）
- 支持自定义词典（`userDict` 参数）和撤销黑名单（`blacklist` 参数）
- 开启 `autoTranslateUseAI` 后使用 `callAI` 翻译，AI 失败自动 fallback 到本地字典
- 配置：`generateCssTree.autoTranslateVariable`（开关）、`generateCssTree.autoTranslateUseAI`（AI 模式）

### 中文代码片段触发器

在 js/ts/jsx/tsx/vue 文件中，输入中文关键词自动触发代码补全：
- 实现：`src/ChineseSnippetTrigger.ts`，通过 `CompletionItemProvider` 注册
- 150+ 中文关键词映射，16 个分类：条件判断、循环、函数、类与对象、异常处理、定时器、DOM 事件、Promise & Async、JSON & 数据、TypeScript、React、Vue、导入导出、注释、调试、常用工具、数组操作、字符串处理、请求/API、工具函数、表单处理、路由、存储、正则表达式、DOM 操作、测试、HTML/Vue 模板
- 支持两种使用方式：① 输入中文时自动补全 ② 命令面板 `extension.listChineseSnippets` 打开 QuickPick 列表
- 注册位置：`extension.ts` 中 `registerChineseSnippetTrigger()`

### Figma API 优化策略

为避免触发 Figma API 速率限制（HTTP 429），实现了以下优化：

1. **智能限流控制**
   - 最小请求间隔：默认 10 秒（可通过 `figmaMinRequestInterval` 配置）
   - 支持服务端 `Retry-After` 响应头自动等待
   - 指数退避重试策略（10s/20s/40s）

2. **文件系统持久化缓存**
   - 文件数据缓存：1 小时 TTL
   - 节点数据缓存：30 分钟 TTL
   - 缓存位置：`globalStorage/css-fast-establish/`
   - 启动时自动清理过期缓存

3. **智能数据获取策略**
   - 优先获取整个文件数据，然后提取指定节点
   - 减少对 Figma API 的直接调用
   - 后续请求优先使用缓存

4. **详细的 429 错误提示**
   - 显示配额重置时间
   - 提供当前配置值
   - 建议解决方案
