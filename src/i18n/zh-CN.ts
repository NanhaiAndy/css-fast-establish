export const strings: Record<string, string> = {
  // CSS Generation
  'cssGenerated': 'css结构生成完毕！',
  'cssGeneratedInStyle': '已在当前代码<style lang="less"下生成css结构！',

  // Class Definition
  'selectHtmlForClass': '请先框选你需要生成class名称定义的html结构',
  'classDefGenerated': 'class定义生成完毕！',

  // Naming Convention
  'selectNamingConvention': '选择命名规范（当前默认: {0}）',

  // Path Finder
  'selectPathToFind': '请先框选你需要查找的路径,路径必须包含~/或@/前缀',
  'pathNotFound': '抱歉，没有找到对应的路径，无法定位(ˉ▽ˉ；)...,路径必须包含~/或@/前缀',
  'pathMustHavePrefix': '抱歉，没有找到对应的路径，无法定位(ˉ▽ˉ；)...路径必须包含~/或@/前缀',
  'fileLocated': '已定位到该文件',

  // Interface Definition
  'interfacePlaceholder': '请填入接口项目名.服务名.方法名，示例：java-xxx-xxx-api.WorksOrderService.createOrder',
  'interfaceFormatError': '接口名称格式不正确，需要至少3段（项目名.服务名.方法名），当前只有 {0} 段。示例：java-xxx-xxx-api.WorksOrderService.createOrder',
  'projectNameEmpty': '项目名不能为空，请检查输入格式',
  'serviceNameEmpty': '服务名不能为空，请检查输入格式',
  'methodNameEmpty': '方法名不能为空，请检查输入格式',
  'selectRequestMethod': '请选择请求方式',

  // Mock Data
  'mockPlaceholder': '请填入在接口文档复制的接口结构',
  'mockGenerated': 'mock数据生成完成！',

  // JSON to TypeScript
  'selectJsonOrInput': '选择 JSON 数据来源',
  'fromJsonClipboard': '从剪贴板获取 JSON',
  'manualInputJson': '手动输入 JSON',
  'pasteJsonPlaceholder': '请粘贴 JSON 数据',
  'pasteJsonPrompt': '输入 JSON 数据以生成 TypeScript 类型定义',
  'selectGenMode': '选择生成模式',
  'tsTypeOnly': 'TypeScript 类型',
  'tsTypeOnlyDesc': '仅生成 interface 定义',
  'tsZodSchema': 'TypeScript + Zod Schema',
  'tsZodSchemaDesc': '生成 interface + Zod 校验 schema',
  'invalidJson': '请输入有效的 JSON 数据',
  'rootTypeName': '根类型名称（默认: Root）',
  'tsGenerated': 'TypeScript 类型生成完毕！',
  'zodGenerated': 'TypeScript + Zod Schema 生成完毕！',

  // CSS Unit Conversion
  'selectCssToConvert': '请先选中需要转换的 CSS 代码',
  'selectConvertDirection': '选择转换方向',
  'cssUnitConverted': 'CSS 单位转换完成 ({0})！',

  // Color Conversion
  'selectColorValue': '请先选中一个颜色值',
  'unrecognizedColor': '无法识别的颜色格式，支持: HEX、RGB、RGBA、HSL、HSLA',
  'colorParseFailed': '颜色解析失败',
  'currentFormat': '当前格式: {0}，选择目标格式',
  'colorConverted': '颜色转换完成: {0}',

  // Timestamp
  'timestampPlaceholder': '输入时间戳或日期字符串',
  'timestampPrompt': '支持 10/13 位时间戳或日期格式如 2024-01-01 12:00:00',
  'timestampToDate': '时间戳 → 日期: {0}',
  'copiedToClipboard': '结果已复制到剪贴板',
  'dateToTimestamp': '日期 → 时间戳: {0}',
  'unrecognizedTimestamp': '无法识别的格式，请输入时间戳或日期字符串',
  'invalidDate': '无效日期',

  // Encode/Decode
  'selectTextForEncode': '请先选中需要编解码的文本',
  'selectEncodeOp': '选择编解码操作',
  'encodeComplete': '{0}完成！',

  // SVG Optimize
  'selectSvgCode': '请先选中 SVG 代码',
  'svgOptimized': 'SVG 优化完成！',

  // Snippet
  'selectCodeToSave': '请先选中需要保存的代码片段',
  'snippetNamePlaceholder': '请输入片段名称',
  'snippetNamePrompt': '为这段代码起一个便于识别的名称',
  'snippetTagPlaceholder': '标签（可选，逗号分隔，如: utils,react）',
  'snippetSaved': '片段 "{0}" 保存成功！',
  'noSnippets': '暂无保存的代码片段，可以通过右键菜单"保存代码片段"来添加',
  'selectSnippetAction': '选择一个片段（点击插入，右键可删除）',
  'insertAtCursor': '插入到当前光标位置',
  'copyToClipboard': '复制到剪贴板',
  'deleteSnippet': '删除此片段',
  'snippetInserted': '片段 "{0}" 已插入',
  'snippetCopied': '片段 "{0}" 已复制到剪贴板',
  'snippetDeleted': '片段 "{0}" 已删除',
  'noSnippetsShort': '暂无保存的代码片段',
  'selectSnippetToInsert': '选择要插入的代码片段',
  'noSnippetsToExport': '暂无代码片段可导出',
  'exportSnippetsTitle': '导出代码片段',
  'exportedCount': '已导出 {0} 个代码片段',
  'importSnippetsTitle': '导入代码片段',
  'invalidSnippetFile': '无效的 snippet 文件格式',
  'importedCount': '已导入 {0} 个代码片段',
  'skippedExisting': '，跳过 {0} 个已存在的片段',
  'importFailed': '导入失败: {0}',

  // Placeholder Image
  'customSizePlaceholder': '输入尺寸，格式: 宽x高，如 300x200',
  'sizeFormatError': '格式错误，请使用 宽x高 格式',
  'invalidNumber': '请输入有效数字',
  'placeholderInserted': '占位图 {0}×{1} 已插入',

  // Console.log
  'putCursorOnVar': '请将光标放在变量名上',
  'noConsoleLogs': '当前文件没有 console.log/warn/error',
  'removedConsoles': '已移除 {0} 个 console 语句',
  'noConsolesToComment': '当前文件没有 console 语句需要注释',
  'commentedConsoles': '已注释 {0} 个 console 语句',
  'noConsoleStatements': '当前文件没有 console 语句',
  'highlightedConsoles': '已高亮 {0} 个 console 语句（3秒后自动消失）',
  'noConsolesToToggle': '当前文件没有 console 语句',
  'toggledConsoles': '已切换 {0} 个 console 语句的注释状态',

  // Figma
  'figmaUrlPlaceholder': '请输入Figma文件链接，例如: https://www.figma.com/file/xxx/Design?node-id=1-2',
  'figmaUrlPrompt': '从Figma中复制选中组件的链接粘贴到此处',
  'figmaTokenRequired': '请先在设置中配置Figma 个人访问令牌 Token (generateCssTree.figmaToken)',
  'figmaUrlInvalid': '无法解析Figma链接，请确认链接格式正确（支持 /file/ 或 /design/ 路径格式）',
  'figmaFetching': '正在从Figma获取设计数据...',
  'figmaFailed': 'Figma转代码失败: {0}',
  'figmaTokenUrlPlaceholder': '请输入Figma文件链接',
  'figmaTokenUrlPrompt': '从Figma中复制文件链接粘贴到此处，提取颜色/字体/圆角/间距等设计令牌',
  'figmaTokenRequiredShort': '请先在设置中配置 Figma Token (generateCssTree.figmaToken)',
  'figmaUrlInvalidShort': '无法解析 Figma 链接，请确认格式正确',
  'figmaTokenOutputFormat': '选择输出格式',
  'figmaFetchingTokens': '正在从 Figma 获取设计数据...',
  'figmaNoTokens': '未从该 Figma 文件中提取到设计令牌',
  'figmaTokensExtracted': '设计令牌提取完成：{0} 个颜色、{1} 个字体、{2} 个圆角、{3} 个间距',
  'figmaTokenFailed': '令牌提取失败: {0}',

  // AI / Streaming
  'aiGenerating': '正在通过AI将Figma设计转为代码...',
  'aiGeneratingApi': '正在通过AI生成API请求代码...',
  'aiGeneratingDiff': '正在通过AI分析代码差异...',
  'codeGenerated': '代码生成完成',
  'autoFixing': '发现 {0} 个问题，正在自动修复...',
  'autoFixFailed': '自动修复失败: {0}，请手动检查代码',
  'autoFixed': '代码已自动修复',
  'aiGenerateFailed': 'AI生成失败: {0}',

  // API Code Gen
  'apiJsonPlaceholder': '请粘贴 API 响应 JSON 数据',
  'apiJsonPrompt': '选中 JSON 数据或直接粘贴，自动生成 axios/fetch 请求代码 + TS 类型',
  'selectRequestLibrary': '选择请求库',
  'useAxios': '使用 axios 发送请求',
  'useFetch': '使用原生 fetch API',
  'apiUrlPlaceholder': 'API 端点 URL（可选，如 /api/users）',
  'apiUrlPrompt': '留空则自动推断',

  // Code Diff
  'pasteCodeA': '粘贴第一段代码（原代码）',
  'pasteCodeAPrompt': '如果没有选中文本，请在此粘贴代码',
  'getCodeBSource': '获取第二段代码的方式',
  'fromClipboard': '从剪贴板获取',
  'manualInput': '手动输入',
  'pasteCodeB': '粘贴第二段代码（新代码）',
  'pasteCodeBPrompt': '请粘贴要对比的代码',
  'clipboardEmpty': '剪贴板为空',
  'diffContextPlaceholder': '补充上下文（可选，如 PR 标题）',

  // Image Analysis
  'analyzingImages': '正在分析图片资源...',

  // CSS Redundancy
  'selectScanScope': '选择扫描范围',
  'currentFile': '当前文件',
  'entireWorkspace': '整个工作区',
  'detectingCssRedundancy': '正在检测CSS冗余...',

  // Chinese Translation
  'translateVarMsg': '{0} → {1}',

  // Regex Panel
  'regexPanelTitle': '正则可视化测试',
};
