import * as vscode from 'vscode';

interface DeadCodeItem {
  name: string;
  type: 'function' | 'variable' | 'export';
  line: number;
  file: string;
  usedCount: number;
}

function detectInFile(content: string, filePath: string): DeadCodeItem[] {
  const items: DeadCodeItem[] = [];

  // collect function declarations
  const funcRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|\w+\s*=>))/g;
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    const name = match[1] || match[2];
    if (!name) { continue; }

    const line = content.substring(0, match.index).split('\n').length;
    // count usages (skip the declaration itself)
    const usageRegex = new RegExp(`\\b${name}\\b`, 'g');
    let count = 0;
    let usageMatch;
    while ((usageMatch = usageRegex.exec(content)) !== null) {
      count++;
    }

    // if only used once (declaration itself) or not at all, it's potentially dead
    if (count <= 1) {
      items.push({ name, type: 'function', line, file: filePath, usedCount: count });
    }
  }

  // collect exported names that are never imported elsewhere
  const exportRegex = /export\s+(?:default\s+)?(?:function\s+)?(?:const\s+|let\s+|var\s+)?(\w+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    const name = match[1];
    if (!name || name === 'default') { continue; }

    const line = content.substring(0, match.index).split('\n').length;
    items.push({ name, type: 'export', line, file: filePath, usedCount: 0 });
  }

  return items;
}

export async function detectDeadCode(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const document = editor.document;
  const langId = document.languageId;

  if (!['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue'].includes(langId)) {
    vscode.window.showErrorMessage('请打开 JS/TS/Vue 文件');
    return;
  }

  const content = document.getText();
  const filePath = document.fileName;
  const fileName = filePath.split(/[/\\]/).pop() || '';

  const deadItems = detectInFile(content, fileName);

  if (deadItems.length === 0) {
    vscode.window.showInformationMessage('未检测到明显的死代码');
    return;
  }

  // deduplicate
  const seen = new Set<string>();
  const unique = deadItems.filter(item => {
    const key = `${item.name}:${item.line}`;
    if (seen.has(key)) { return false; }
    seen.add(key);
    return true;
  });

  const items = unique.map(item => ({
    label: item.name,
    description: `${item.type} · 行 ${item.line}`,
    detail: `使用次数: ${item.usedCount}（仅声明未调用）`,
    line: item.line,
  }));

  const chosen = await vscode.window.showQuickPick(items, {
    placeHolder: `检测到 ${unique.length} 个可能的死代码，点击跳转`,
    matchOnDescription: true,
  });

  if (chosen) {
    const pos = new vscode.Position(chosen.line - 1, 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos));
  }
}
