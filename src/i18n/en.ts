export const strings: Record<string, string> = {
  // CSS Generation
  'cssGenerated': 'CSS structure generated!',
  'cssGeneratedInStyle': 'CSS structure generated under <style lang="less">!',

  // Class Definition
  'selectHtmlForClass': 'Please select the HTML structure for class name generation',
  'classDefGenerated': 'Class definition generated!',

  // Naming Convention
  'selectNamingConvention': 'Select naming convention (current: {0})',

  // Path Finder
  'selectPathToFind': 'Please select a path containing ~/ or @/ prefix',
  'pathNotFound': 'Sorry, path not found. Path must contain ~/ or @/ prefix',
  'pathMustHavePrefix': 'Sorry, path not found. Path must contain ~/ or @/ prefix',
  'fileLocated': 'File located',

  // Interface Definition
  'interfacePlaceholder': 'Enter interface: project.service.method, e.g.: java-xxx-xxx-api.WorksOrderService.createOrder',
  'interfaceFormatError': 'Invalid format. Need at least 3 segments (project.service.method), got {0}. Example: java-xxx-xxx-api.WorksOrderService.createOrder',
  'projectNameEmpty': 'Project name cannot be empty',
  'serviceNameEmpty': 'Service name cannot be empty',
  'methodNameEmpty': 'Method name cannot be empty',
  'selectRequestMethod': 'Select request method',

  // Mock Data
  'mockPlaceholder': 'Paste the interface structure from API docs',
  'mockGenerated': 'Mock data generated!',

  // JSON to TypeScript
  'selectJsonOrInput': 'Select JSON data source',
  'fromJsonClipboard': 'Get from clipboard',
  'manualInputJson': 'Manual input',
  'pasteJsonPlaceholder': 'Paste JSON data',
  'pasteJsonPrompt': 'Enter JSON data to generate TypeScript types',
  'selectGenMode': 'Select generation mode',
  'tsTypeOnly': 'TypeScript Types',
  'tsTypeOnlyDesc': 'Generate interface definitions only',
  'tsZodSchema': 'TypeScript + Zod Schema',
  'tsZodSchemaDesc': 'Generate interface + Zod validation schema',
  'invalidJson': 'Please enter valid JSON data',
  'rootTypeName': 'Root type name (default: Root)',
  'tsGenerated': 'TypeScript types generated!',
  'zodGenerated': 'TypeScript + Zod Schema generated!',

  // CSS Unit Conversion
  'selectCssToConvert': 'Please select CSS code to convert',
  'selectConvertDirection': 'Select conversion direction',
  'cssUnitConverted': 'CSS unit conversion complete ({0})!',

  // Color Conversion
  'selectColorValue': 'Please select a color value',
  'unrecognizedColor': 'Unrecognized color format. Supports: HEX, RGB, RGBA, HSL, HSLA',
  'colorParseFailed': 'Color parsing failed',
  'currentFormat': 'Current format: {0}, select target format',
  'colorConverted': 'Color converted: {0}',

  // Timestamp
  'timestampPlaceholder': 'Enter timestamp or date string',
  'timestampPrompt': 'Supports 10/13-digit timestamps or dates like 2024-01-01 12:00:00',
  'timestampToDate': 'Timestamp → Date: {0}',
  'copiedToClipboard': 'Result copied to clipboard',
  'dateToTimestamp': 'Date → Timestamp: {0}',
  'unrecognizedTimestamp': 'Unrecognized format. Please enter a timestamp or date string',
  'invalidDate': 'Invalid date',
  'dateToTimestamp.seconds': 'seconds',
  'dateToTimestamp.milliseconds': 'milliseconds',

  // Encode/Decode
  'selectTextForEncode': 'Please select text to encode/decode',
  'selectEncodeOp': 'Select encode/decode operation',
  'encodeComplete': '{0} complete!',

  // SVG Optimize
  'selectSvgCode': 'Please select SVG code',
  'svgOptimized': 'SVG optimized!',

  // Snippet
  'selectCodeToSave': 'Please select code to save as snippet',
  'snippetNamePlaceholder': 'Enter snippet name',
  'snippetNamePrompt': 'Give this code snippet a recognizable name',
  'snippetTagPlaceholder': 'Tags (optional, comma-separated, e.g.: utils,react)',
  'snippetSaved': 'Snippet "{0}" saved!',
  'noSnippets': 'No saved snippets yet. Use "Save Code Snippet" from the context menu',
  'selectSnippetAction': 'Select a snippet (click to insert)',
  'insertAtCursor': 'Insert at cursor',
  'copyToClipboard': 'Copy to clipboard',
  'deleteSnippet': 'Delete snippet',
  'snippetInserted': 'Snippet "{0}" inserted',
  'snippetCopied': 'Snippet "{0}" copied to clipboard',
  'snippetDeleted': 'Snippet "{0}" deleted',
  'noSnippetsShort': 'No saved snippets',
  'selectSnippetToInsert': 'Select snippet to insert',
  'noSnippetsToExport': 'No snippets to export',
  'exportSnippetsTitle': 'Export Snippets',
  'exportedCount': 'Exported {0} snippets',
  'importSnippetsTitle': 'Import Snippets',
  'invalidSnippetFile': 'Invalid snippet file format',
  'importedCount': 'Imported {0} snippets',
  'skippedExisting': ', skipped {0} existing snippets',
  'importFailed': 'Import failed: {0}',

  // Placeholder Image
  'customSizePlaceholder': 'Enter size as WxH, e.g.: 300x200',
  'sizeFormatError': 'Invalid format. Use WxH format',
  'invalidNumber': 'Please enter valid numbers',
  'placeholderInserted': 'Placeholder {0}×{1} inserted',

  // Console.log
  'putCursorOnVar': 'Place cursor on a variable name',
  'noConsoleLogs': 'No console.log/warn/error found in current file',
  'removedConsoles': 'Removed {0} console statements',
  'noConsolesToComment': 'No console statements to comment',
  'commentedConsoles': 'Commented {0} console statements',
  'noConsoleStatements': 'No console statements found',
  'highlightedConsoles': 'Highlighted {0} console statements (auto-dismiss in 3s)',
  'noConsolesToToggle': 'No console statements found',
  'toggledConsoles': 'Toggled {0} console statements',

  // Figma
  'figmaUrlPlaceholder': 'Enter Figma link, e.g.: https://www.figma.com/file/xxx/Design?node-id=1-2',
  'figmaUrlPrompt': 'Copy the selected component link from Figma',
  'figmaTokenRequired': 'Please configure Figma Token in settings (generateCssTree.figmaToken)',
  'figmaUrlInvalid': 'Cannot parse Figma link. Ensure format is correct (/file/ or /design/)',
  'figmaFetching': 'Fetching design data from Figma...',
  'figmaFailed': 'Figma to code failed: {0}',
  'figmaTokenUrlPlaceholder': 'Enter Figma file link',
  'figmaTokenUrlPrompt': 'Paste Figma file link to extract colors/fonts/radii/spacing tokens',
  'figmaTokenRequiredShort': 'Please configure Figma Token (generateCssTree.figmaToken)',
  'figmaUrlInvalidShort': 'Cannot parse Figma link. Check format',
  'figmaTokenOutputFormat': 'Select output format',
  'figmaFetchingTokens': 'Fetching design data from Figma...',
  'figmaNoTokens': 'No design tokens extracted from Figma file',
  'figmaTokensExtracted': 'Tokens extracted: {0} colors, {1} fonts, {2} radii, {3} spacings',
  'figmaTokenFailed': 'Token extraction failed: {0}',

  // AI / Streaming
  'aiGenerating': 'Generating code from Figma design via AI...',
  'aiGeneratingApi': 'Generating API request code via AI...',
  'aiGeneratingDiff': 'Analyzing code diff via AI...',
  'codeGenerated': 'Code generation complete',
  'autoFixing': 'Found {0} issues, auto-fixing...',
  'autoFixFailed': 'Auto-fix failed: {0}. Please check manually',
  'autoFixed': 'Code auto-fixed',
  'aiGenerateFailed': 'AI generation failed: {0}',

  // API Code Gen
  'apiJsonPlaceholder': 'Paste API response JSON data',
  'apiJsonPrompt': 'Select JSON or paste directly to generate axios/fetch code + TS types',
  'selectRequestLibrary': 'Select request library',
  'useAxios': 'Use axios',
  'useFetch': 'Use native fetch API',
  'apiUrlPlaceholder': 'API endpoint URL (optional, e.g.: /api/users)',
  'apiUrlPrompt': 'Leave empty to auto-infer',

  // Code Diff
  'pasteCodeA': 'Paste original code',
  'pasteCodeAPrompt': 'Paste code here if no text is selected',
  'getCodeBSource': 'How to get the second code snippet',
  'fromClipboard': 'From clipboard',
  'manualInput': 'Manual input',
  'pasteCodeB': 'Paste new code',
  'pasteCodeBPrompt': 'Paste the code to compare',
  'clipboardEmpty': 'Clipboard is empty',
  'diffContextPlaceholder': 'Additional context (optional, e.g.: PR title)',

  // Image Analysis
  'analyzingImages': 'Analyzing image resources...',

  // CSS Redundancy
  'selectScanScope': 'Select scan scope',
  'currentFile': 'Current file',
  'entireWorkspace': 'Entire workspace',
  'detectingCssRedundancy': 'Detecting CSS redundancy...',

  // Chinese Translation
  'translateVarMsg': '{0} → {1}',

  // Regex Panel
  'regexPanelTitle': 'Regex Visual Tester',
};
