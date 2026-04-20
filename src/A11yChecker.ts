import * as vscode from 'vscode';

let diagnosticCollection: vscode.DiagnosticCollection | undefined;

interface A11yRule {
  pattern: RegExp;
  message: string;
  severity: vscode.DiagnosticSeverity;
  // 是否需要处理 Vue SFC <template> 块
  vueOnly?: boolean;
}

const rules: A11yRule[] = [
  // img 缺少 alt（不匹配已有 alt 的情况）
  {
    pattern: /<img\b(?![^>]*\balt\s*=\s*[^'"][^>]*)(?![^>]*\balt\s*=\s*"[^"]*")(?![^>]*\balt\s*=\s*'[^']*')[^>]*\/?>/gi,
    message: 'img 标签缺少 alt 属性',
    severity: vscode.DiagnosticSeverity.Warning
  },
  // img alt 为空字符串
  {
    pattern: /<img\b[^>]*\balt\s*=\s*(""|'')\s*[^>]*\/?>/gi,
    message: 'img 标签 alt 属性为空，如果是装饰性图片建议添加 aria-hidden="true"',
    severity: vscode.DiagnosticSeverity.Hint
  },
  // button 内容为空
  {
    pattern: /<button\b[^>]*>\s*<\/button>/gi,
    message: 'button 标签内容为空，请添加文本或 aria-label',
    severity: vscode.DiagnosticSeverity.Warning
  },
  // input 缺少 label 关联（无 id 且无 aria-label）
  {
    pattern: /<input\b(?![^>]*\bid\s*=\s*['"])(?![^>]*\baria-label\s*=\s*['"])(?![^>]*\baria-labelledby\s*=\s*['"])[^>]*\/?>/gi,
    message: 'input 缺少关联的 label（通过 id 关联或 aria-label）',
    severity: vscode.DiagnosticSeverity.Warning
  },
  // a 缺少 href
  {
    pattern: /<a\b(?![^>]*\bhref\s*=\s*['"][^'"]*['"])(?![^>]*\brole\s*=\s*["']button["'])[^>]*>/gi,
    message: 'a 标签缺少 href 属性，如果作为按钮使用请添加 role="button"',
    severity: vscode.DiagnosticSeverity.Warning
  },
  // table 缺少 th
  {
    pattern: /<table\b[^>]*>[\s\S]*?<\/table>/gi,
    message: '',
    severity: vscode.DiagnosticSeverity.Warning,
    vueOnly: true
  },
  // iframe 缺少 title
  {
    pattern: /<iframe\b(?![^>]*\btitle\s*=\s*['"][^'"]*['"])[^>]*>/gi,
    message: 'iframe 缺少 title 属性',
    severity: vscode.DiagnosticSeverity.Warning
  },
];

// html 缺少 lang 属性（单独处理，只在文件开头匹配）
const htmlLangPattern = /^<html(?![^>]*\blang\s*=\s*['"][^'"]*['"])/gim;

function extractVueTemplateContent(text: string): { templateContent: string; templateOffset: number } | null {
  const match = text.match(/<template[\s\S]*?>([\s\S]*?)<\/template>/);
  if (!match || match.index === undefined) return null;
  return {
    templateContent: match[1],
    templateOffset: match.index + match[0].indexOf('>') + 1
  };
}

function runA11yCheck(document: vscode.TextDocument): vscode.Diagnostic[] {
  const text = document.getText();
  const langId = document.languageId;

  // 只检查 HTML/Vue 文件
  if (!['html', 'vue'].includes(langId)) return [];

  const diagnostics: vscode.Diagnostic[] = [];

  // 对于 Vue 文件，只检查 <template> 块
  let checkText = text;
  let offset = 0;
  if (langId === 'vue') {
    const template = extractVueTemplateContent(text);
    if (!template) return [];
    checkText = template.templateContent;
    offset = template.templateOffset;
  }

  // html 缺少 lang（只在完整 HTML 文件中检查）
  const langMatch = htmlLangPattern.exec(checkText);
  if (langMatch) {
    const startPos = document.positionAt(offset + langMatch.index);
    const endPos = document.positionAt(offset + langMatch.index + langMatch[0].length);
    const diag = new vscode.Diagnostic(
      new vscode.Range(startPos, endPos),
      '<html> 标签缺少 lang 属性',
      vscode.DiagnosticSeverity.Warning
    );
    diag.source = '前端百宝箱 a11y';
    diagnostics.push(diag);
  }

  // table 缺少 th（特殊规则）
  const tablePattern = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  while ((tableMatch = tablePattern.exec(checkText)) !== null) {
    const tableContent = tableMatch[0];
    if (!/<th[\s>]/i.test(tableContent)) {
      const startPos = document.positionAt(offset + tableMatch.index);
      const endPos = document.positionAt(offset + tableMatch.index + tableMatch[0].length);
      const diag = new vscode.Diagnostic(
        new vscode.Range(startPos, endPos),
        '表格缺少 <th> 表头单元格',
        vscode.DiagnosticSeverity.Warning
      );
      diag.source = '前端百宝箱 a11y';
      diagnostics.push(diag);
    }
  }

  // 通用规则检查
  for (const rule of rules) {
    if (rule.vueOnly) continue; // table 规则已单独处理

    let match;
    // 重置 lastIndex
    rule.pattern.lastIndex = 0;
    while ((match = rule.pattern.exec(checkText)) !== null) {
      const startPos = document.positionAt(offset + match.index);
      const endPos = document.positionAt(offset + match.index + match[0].length);
      const diag = new vscode.Diagnostic(
        new vscode.Range(startPos, endPos),
        rule.message,
        rule.severity
      );
      diag.source = '前端百宝箱 a11y';
      diagnostics.push(diag);
    }
  }

  return diagnostics;
}

export function activateA11yChecker(context: vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('a11y');
  context.subscriptions.push(diagnosticCollection);

  // 手动检查命令
  const checkCmd = vscode.commands.registerCommand('extension.checkA11y', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('请先打开一个 HTML 或 Vue 文件');
      return;
    }
    const diagnostics = runA11yCheck(editor.document);
    diagnosticCollection!.set(editor.document.uri, diagnostics);

    if (diagnostics.length === 0) {
      vscode.window.showInformationMessage('未发现无障碍问题');
    } else {
      vscode.window.showInformationMessage(`发现 ${diagnostics.length} 个无障碍问题，已标记在编辑器中`);
    }
  });
  context.subscriptions.push(checkCmd);

  // 切换编辑器时自动检查
  const onChangeEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor && ['html', 'vue'].includes(editor.document.languageId)) {
      const diagnostics = runA11yCheck(editor.document);
      diagnosticCollection!.set(editor.document.uri, diagnostics);
    } else if (editor) {
      diagnosticCollection!.clear();
    }
  });
  context.subscriptions.push(onChangeEditor);

  // 保存时自动检查
  const onSave = vscode.workspace.onDidSaveTextDocument(doc => {
    if (['html', 'vue'].includes(doc.languageId)) {
      const diagnostics = runA11yCheck(doc);
      diagnosticCollection!.set(doc.uri, diagnostics);
    }
  });
  context.subscriptions.push(onSave);
}
