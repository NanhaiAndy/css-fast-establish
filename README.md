[中文](README.md) | [English](README.en.md)

# 前端百宝箱

用于前端开发的辅助工具，集成多个功能，帮助前端开发人员提高效率，减少重复工作，提升开发质量。

## 1.功能一览

### CSS & HTML 工具
- 框选对应前端模板代码生成 CSS 样式结构（支持 CSS/LESS/SCSS）
- 显示该 class 对应的 css 结构（鼠标悬停预览）
- 点击对应 class 名，自动定位到该 class 名所对应的 css 结构位置
- 点击对应属性值，快速定位到该值定义位置或赋值位置
- AI 实现语义化 class 命名定义（支持 BEM / CSS Modules / Tailwind 规范选择）
- CSS 冗余检测报告支持全选/反选/批量删除未使用的 class
- **CSS 兼容性提示** — hover CSS 属性名自动显示浏览器兼容性和 vendor prefix 建议
- **CSS 变量提取** — 扫描硬编码颜色/字号，一键提取为 `:root` CSS 变量
- **快速包裹标签** — 选中内容输入标签名（支持属性），自动包裹

### 接口 & 数据工具
- 根据接口名称 api 生成 dubbo 接口定义
- 根据接口文档结构生成多层级 Mock 数据（纯代码生成，无需 AI）
- **JSON 转 TypeScript 类型** — 选中 JSON 或粘贴 JSON，自动生成 TypeScript interface 定义，支持生成 Zod Schema 校验代码
- **时间戳/日期转换** — 时间戳与日期字符串双向转换，结果自动复制到剪贴板

### 转换工具
- **CSS 单位批量转换** — 选中 CSS 代码，一键 px↔rem、px↔vw 互转，支持自定义基准值
- **颜色格式转换** — 选中颜色值，在 HEX / RGB / RGBA / HSL / HSLA 之间互转
- **编码/解码转换** — 支持 URL 编码/解码、Base64 编码/解码、HTML 实体编码/解码
- **SVG 优化压缩** — 移除注释、metadata、冗余属性，压缩 SVG 代码体积

### AI 设计转代码
- **Figma 链接转前端代码** — 粘贴 Figma 组件链接，自动获取设计数据并通过 AI 流式生成 HTML/Vue/React/Tailwind 代码（含智能限流和持久化缓存，大幅降低 API 限流风险）
- **AI 自检修复** — 生成完成后自动检测代码问题（标签未闭合、结构缺失等）并调用 AI 修复
- **流式输出** — AI 生成过程实时写入编辑器，无需等待全部完成
- **API 请求代码生成** — 选中 JSON 响应数据，选择 axios/fetch，AI 自动生成完整的 TypeScript 请求代码 + 类型定义
- **代码差异对比** — 选中两段代码，AI 生成语义化的 Markdown 差异说明，适用于 PR 描述

### 开发辅助
- **正则可视化测试** — 打开可视化面板，实时输入正则 + 测试文本，高亮匹配并展示捕获组；新增 Token 彩色解析、捕获组高亮标注、11 个常用正则模板（邮箱/手机号/URL/身份证/IP 等）
- **JSON Path 查询器** — 打开可视化面板，输入 JSON 数据和路径表达式（如 `data.list[0].name`），实时预览匹配结果
- **HTML 无障碍（a11y）检查** — 自动检测 HTML/Vue 文件中的无障碍问题（img 缺 alt、button 空、input 缺 label 等），切换编辑器和保存时自动检查，VS Code 原生波浪线提示
- **图片资源分析** — 扫描工作区中未使用的图片、重复图片（基于文件 hash）、超大图片，生成可视化分析报告，提供格式转换建议（PNG→WebP 预估节省 ~30%）
- **CSS 冗余检测** — 扫描未被模板引用的 CSS class 定义，支持当前文件和整个工作区两种模式，生成可视化报告，支持批量删除冗余 class
- **代码片段收集** — 选中代码保存为可复用片段，支持标签分类、模板变量（`${1:default}` 语法）、使用频率排序，数据持久化
- **占位图片生成** — 快速选择尺寸，插入占位图 `<img>` 标签
- **Console.log 管理** — 光标放在变量上快速插入 console.log，一键移除/注释/高亮/切换所有 console.log 和 console.warn（保留 console.error 用于错误处理）
- 引入组件路径快捷跳转，框选路径右键追踪，自动搜索定位组件文件（支持 `@/` 和 `~/` 前缀）
- **中文变量名自动转英文** — 输入 `const/let/var` 后跟中文变量名自动翻译为英文 camelCase（如 `const 用户名` → `const userName`），本地 480 单字 + 80 词组字典，优先词组级最长匹配，零延迟，可选 AI 模式
- **中文代码片段** — 输入中文关键词自动展开代码片段（如输入 `判断` → `if (condition) { }`），覆盖条件判断、循环、函数、请求/API、数组操作、字符串处理、DOM 操作、存储、正则、测试、Vue/React 模板等 16 个分类，共 150+ 个关键词
- **代码片段导入导出** — 支持导出为 VS Code `.code-snippets` 格式，支持导入（自动去重合并）
- **Figma 设计令牌提取** — 从 Figma 文件提取颜色、字体、圆角、间距等设计令牌，输出 CSS Variables / SCSS Variables / Tailwind Config

### 新增工具（v2.0.1）
- **Flexbox/Grid 布局可视化** — 实时调参预览布局效果，一键复制 CSS 代码
- **死代码检测** — 检测当前文件未使用的函数和变量
- **Git Blame 行内提示** — hover 代码行显示最后一次 commit 信息
- **快捷静态服务器** — 一键启动本地 HTTP 静态服务器
- **npm 版本查询** — hover package.json 包名显示最新版本
- **TODO 看板** — 扫描工作区 TODO/FIXME/HACK 注释，按标签分类展示
- **剪贴板历史** — 自动记录最近 50 条复制内容，快速粘贴
- **环境变量管理** — 可视化管理 .env 文件，支持多环境

### 侧边栏面板
- 查看当前项目信息（分支、提交记录、负责人等）
- 工具功能列表，点击即可执行

![GIF](https://i.postimg.cc/RFkVkB6v/classaisc.gif)

## 2.如何使用

### 快速查看属性值定义赋值位置

1. 打开任意前端 html 代码文件
2. 鼠标移入对应代码里面的属性值
3. 通过 Ctrl+鼠标左键点击对应属性值，将自动跳转到该属性值定义位置或赋值位置，如果存在多个位置，则会以弹窗进行选择查看

### 快速生成 CSS 结构

![GIF](https://i.postimg.cc/jdrSvRYX/cssjg.gif)

1. 打开任意前端 html 代码文件
2. 选中需要生成 CSS 样式的代码片段
3. 鼠标右键选中快速生成 css 结构

### 查看 class 名称对应的 CSS 结构和跳转定位

![GIF](https://i.postimg.cc/5y8N1RLL/csslj.gif)

1. 打开任意前端 html 代码文件
2. 鼠标移入对应的 class 名称即可查看该 class 的样式结构
3. 通过 Ctrl+鼠标左键点击对应 class 名，将自动跳转到该 class 名所对应的 css 结构位置

### 根据 JSON 生成 TypeScript 类型

1. 选中 JSON 文本，或直接右键选择「JSON转TypeScript类型」
2. 如无选中文本，会弹出输入框供粘贴 JSON
3. 自动生成 TypeScript interface 定义，在新窗口中打开

### CSS 单位批量转换

1. 选中包含 px/rem/vw 的 CSS 代码
2. 右键选择「CSS单位批量转换」
3. 选择转换方向（px→rem、px→vw、rem→px、vw→px）
4. 自动替换选中代码中的单位值

### 颜色格式转换

1. 选中一个颜色值（如 `#ff6900`、`rgb(255,105,0)`）
2. 右键选择「颜色格式转换」
3. 选择目标格式，自动替换

### 编码/解码

1. 选中需要编解码的文本
2. 右键选择「编码/解码转换」
3. 选择操作类型（URL/Base64/HTML实体），自动替换

### 正则表达式测试

1. 从侧边栏或命令面板打开「正则可视化测试」
2. 在面板中输入正则表达式和测试文本
3. 查看正则 Token 彩色解析（字面量、字符集、捕获组、量词等），悬停查看说明
4. 实时查看匹配高亮和捕获组详情

### JSON Path 查询器

1. 从侧边栏或命令面板打开「JSON Path 查询器」
2. 在上方粘贴 JSON 数据
3. 在路径输入框中输入表达式（如 `data.list[0].name`）
4. 实时查看查询结果，支持复制

### HTML 无障碍检查

1. 打开 HTML 或 Vue 文件，扩展自动检查并标记问题
2. 也可以从侧边栏或右键菜单手动触发检查
3. 在编辑器中查看波浪线警告，在「问题」面板中查看完整列表

### 图片资源分析

1. 从侧边栏打开「图片资源分析」
2. 等待扫描完成（支持取消）
3. 查看报告：未使用图片、重复图片、超大图片

### CSS 冗余检测

1. 从侧边栏打开「CSS 冗余检测」
2. 选择扫描范围（当前文件 / 整个工作区）
3. 查看报告：按文件分组的未使用 class 定义

### API 请求代码生成

1. 选中 JSON 响应数据（或粘贴）
2. 右键选择「API请求代码生成」
3. 选择请求库（axios / fetch），可选输入 API 端点
4. AI 流式生成 TypeScript 请求代码 + 类型定义

### 代码差异对比

1. 选中第一段代码（原代码），右键选择「代码差异对比」
2. 选择获取第二段代码的方式（剪贴板 / 手动输入）
3. 可选输入补充上下文（如 PR 标题）
4. AI 流式生成 Markdown 格式的差异说明

### 代码片段收集

1. 选中代码，右键选择「保存代码片段」
2. 输入片段名称，可选输入标签（逗号分隔，如 `utils,react`）
3. 通过侧边栏「管理代码片段」查看、插入、复制或删除已保存的片段（按使用频率排序）
4. 片段中可使用模板变量（如 `${1:defaultValue}`），插入时弹出输入框填写
5. 支持导出为 `.code-snippets` 格式文件，支持从 `.code-snippets` 文件导入（自动去重合并）

### 根据接口文档生成 Mock 数据

![GIF](https://i.postimg.cc/wB3q3vD6/mock.gif)

1. 在接口文档中复制接口文档结构（支持多层级嵌套类型）
2. 鼠标右键点击打开菜单，选择「根据接口文档生成Mock数据」
3. 在输入框中粘贴复制的接口结构，回车确认
4. 自动生成多层级 Mock 数据并插入到光标位置

### Figma 链接转前端代码

1. 在 Figma 中右键组件 →「复制链接」
2. 在 VS Code 中右键选择「Figma链接转代码」
3. 粘贴链接并回车
4. 自动从 Figma API 获取设计数据，通过 AI 流式生成代码
5. 生成完成后自动检查代码质量并修复问题

> **智能限流与缓存**：扩展内置了智能限流控制（默认最小间隔 10 秒）和文件系统持久化缓存（文件数据缓存 1 小时，节点数据缓存 30 分钟），大幅降低触发 Figma API 速率限制（HTTP 429）的风险。同一文件/节点的重复请求将直接从缓存读取，零 API 调用。
>
> 首次使用需在设置中配置 `generateCssTree.figmaToken`（Figma 个人访问令牌）和 AI 相关配置（`aiApiEndpoint`、`aiApiKey`、`aiModel`）。如遇频繁限流，可在设置中增大 `figmaMinRequestInterval` 值。

### Figma 设计令牌提取

1. 从侧边栏或命令面板选择「Figma设计令牌提取」
2. 粘贴 Figma 文件链接
3. 选择输出格式（CSS Variables / SCSS Variables / Tailwind Config）
4. 自动从 Figma 文件中提取颜色、字体、圆角、间距等设计令牌并生成代码

### 中文变量名自动转英文

1. 在 js/ts/vue 文件中正常编写代码
2. 输入 `const 用户名` 或 `let 价格列表` 等中文变量名
3. 自动翻译为英文驼峰命名：`userName`、`priceList`
4. 底部状态栏提示翻译结果
5. 可在设置中关闭（`generateCssTree.autoTranslateVariable`）或开启 AI 翻译模式（`generateCssTree.autoTranslateUseAI`）

### 中文代码片段

1. 在 js/ts/jsx/tsx/vue 文件中输入中文关键词
2. 自动弹出代码补全提示，选择即可插入对应代码片段
3. 也可通过命令面板搜索「中文代码片段列表」查看所有可用片段

**支持的关键词分类（150+个）：**

| 分类 | 关键词示例 |
|------|-----------|
| 条件判断 | 判断 → `if`、否则 → `else`、三元 → `? :`、开关 → `switch` |
| 循环 | 循环 → `for`、遍历 → `for...of`、映射 → `map`、过滤 → `filter`、归约 → `reduce` |
| 函数 | 函数 → `function`、箭头 → `=>`、异步 → `async`、立即 → `IIFE` |
| 数组操作 | 合并、切片、排序、反转、扁平化、包含、查找索引、每个、某个 |
| 字符串处理 | 转大写、转小写、首字母大写、替换、分割、截取、模板字符串 |
| 请求/API | 获取 → `fetch GET`、发送数据 → `POST`、上传 → `FormData` |
| 工具函数 | 节流、防抖、随机数、UUID、格式化日期、柯里化 |
| DOM 操作 | 获取元素、创建元素、添加类名、切换类名、设置属性 |
| 存储 | 本地存储、本地读取、会话存储 |
| 正则表达式 | 正则匹配、正则测试、邮箱正则、手机正则、URL正则 |
| 测试 | 测试套件 → `describe`、测试用例 → `test`、期望 → `expect`、模拟函数 |
| Vue 模板 | 条件渲染 → `v-if`、列表渲染 → `v-for`、双向绑定 → `v-model`、插槽、Props |
| React 模板 | 组件、状态 → `useState`、效应 → `useEffect`、条件渲染React |

### 快速包裹标签

1. 选中需要包裹的内容
2. 右键 → 前端百宝箱 → 快速包裹标签
3. 输入标签名（如 `div class="box"` 或 `span`）
4. 自动包裹为 `<tag>选中内容</tag>`

### CSS 兼容性提示

1. 打开 CSS/LESS/SCSS/Vue 文件
2. 将鼠标悬停在 CSS 属性名上（如 `flex`、`gap`、`backdrop-filter`）
3. 自动显示浏览器兼容性表格和需要的 vendor prefix

### CSS 变量提取

1. 打开 CSS/Vue 文件，右键 → 前端百宝箱 → 提取CSS变量
2. 选择要提取的硬编码颜色或字号（可多选）
3. 输入变量名前缀（如不填则自动生成）
4. 自动在文件顶部生成 `:root` 变量并替换所有引用

### Flexbox/Grid 布局可视化

1. 从侧边栏或命令面板打开「Flexbox/Grid布局可视化」
2. 切换 Flexbox / Grid 标签页
3. 调整方向、对齐、间距等参数，实时预览布局效果
4. 点击「复制」按钮复制生成的 CSS 代码

### 死代码检测

1. 打开 JS/TS/Vue 文件，右键 → 前端百宝箱 → 死代码检测
2. 查看检测到的未使用函数/变量列表
3. 点击列表项跳转到对应代码位置

### Git Blame 提示

1. 在任意文件中，将鼠标悬停在代码行上
2. 自动显示最后一次 commit 的哈希、作者、日期和提交信息

### 快捷静态服务器

1. 从侧边栏或命令面板打开「启动静态服务器」
2. 输入端口号（默认 8080），回车
3. 点击「打开浏览器」预览页面
4. 需要停止时，再次执行命令选择「停止服务器」

### npm 版本查询

1. 打开 package.json 文件
2. 将鼠标悬停在依赖包名上
3. 自动显示最新版本号、描述、最后发布日期和是否过时

### TODO 看板

1. 从侧边栏或命令面板打开「TODO看板」
2. 自动扫描工作区所有 TODO/FIXME/HACK/XXX/NOTE/BUG 注释
3. 按标签分列展示，点击条目跳转到源文件对应行
4. 点击「刷新」按钮重新扫描

### 剪贴板历史

1. 正常复制代码或文本（扩展自动记录，最多 50 条）
2. 右键 → 前端百宝箱 → 剪贴板历史（或命令面板执行）
3. 从列表中选择要粘贴的内容，自动插入到光标位置

### 环境变量管理

1. 从侧边栏或命令面板打开「环境变量管理」
2. 自动识别项目根目录下的所有 .env 文件
3. 切换标签页选择要编辑的环境文件
4. 编辑值后点击「保存」，或点击「+ 添加变量」新增

![GIF](https://i.postimg.cc/wB3q3vD6/mock.gif)

1. 在接口文档中复制接口文档结构（支持多层级嵌套类型）
2. 鼠标右键点击打开菜单，选择「根据接口文档生成Mock数据」
3. 在输入框中粘贴复制的接口结构，回车确认
4. 自动生成多层级 Mock 数据并插入到光标位置

## 3.扩展设置

本扩展提供以下配置选项：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `generateCssTree.cssFlavor` | CSS 预处理器类型（`css` / `less` / `scss`） | `scss` |
| `generateCssTree.enableHover` | 启用 CSS class 悬停预览 | `true` |
| `generateCssTree.enableGoToDefinition` | 启用 CSS class 跳转定义 | `true` |
| `generateCssTree.remBase` | px 转 rem 的基准值（root font-size） | `16` |
| `generateCssTree.vwDesignWidth` | px 转 vw 的设计稿宽度 | `375` |
| `generateCssTree.aiApiEndpoint` | AI API 端点地址（OpenAI 协议兼容） | `https://open.bigmodel.cn/api/coding/paas/v4` |
| `generateCssTree.aiApiKey` | AI API 密钥 | `` |
| `generateCssTree.aiModel` | AI 模型名称 | `GLM-4.7` |
| `generateCssTree.figmaToken` | Figma 个人访问令牌 | `` |
| `generateCssTree.designOutputFormat` | 设计转代码输出格式（`html`/`vue`/`vue3`/`react`/`tailwind`） | `vue` |
| `generateCssTree.designAutoFix` | 设计转代码完成后自动检测并修复代码问题 | `true` |
| `generateCssTree.largeImageThreshold` | 大图检测阈值（字节） | `512000`（500KB） |
| `generateCssTree.figmaMinRequestInterval` | Figma API 最小请求间隔（毫秒），用于避免触发速率限制 | `10000`（10秒） |
| `generateCssTree.namingConvention` | AI 生成 class 名称的命名规范（`custom` / `bem` / `cssModules` / `tailwind`） | `custom` |
| `generateCssTree.autoTranslateVariable` | 输入 const/let/var 后自动将中文变量名翻译为英文驼峰 | `true` |
| `generateCssTree.autoTranslateUseAI` | 中文变量名翻译使用 AI（需要配置 AI API Key） | `false` |
