import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface TodoItem {
  text: string;
  file: string;
  line: number;
  tag: 'TODO' | 'FIXME' | 'HACK' | 'XXX' | 'NOTE' | 'BUG';
  priority?: string;
}

const TODO_PATTERN = /\/\/\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)(?:\(([^)]+)\))?\s*[:：]?\s*(.+)/gi;

function scanFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  const skipDirs = ['node_modules', '.git', 'dist', 'out', 'build', '.vscode', 'webview-dist', '__tests__'];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!skipDirs.includes(entry.name)) {
          results.push(...scanFiles(full, exts));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (exts.includes(ext)) {
          results.push(full);
        }
      }
    }
  } catch {
    // permission denied etc.
  }
  return results;
}

function scanTodos(rootPath: string): TodoItem[] {
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.css', '.less', '.scss', '.html', '.py', '.java', '.go'];
  const files = scanFiles(rootPath, exts);
  const todos: TodoItem[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(rootPath, file).replace(/\\/g, '/');

      for (let i = 0; i < lines.length; i++) {
        let match;
        const regex = new RegExp(TODO_PATTERN.source, TODO_PATTERN.flags);
        while ((match = regex.exec(lines[i])) !== null) {
          todos.push({
            tag: match[1] as TodoItem['tag'],
            priority: match[2] || undefined,
            text: match[3].trim(),
            file: relativePath,
            line: i + 1,
          });
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  return todos;
}

export class TodoBoardPanel {
  public static currentPanel: TodoBoardPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri, rootPath: string) {
    this._panel = panel;

    const todos = scanTodos(rootPath);
    this._panel.webview.html = this._getHtmlForWebview(todos);

    this._panel.webview.onDidReceiveMessage(
      (message: any) => {
        if (message.type === 'openFile') {
          const filePath = path.join(rootPath, message.file);
          const line = message.line;
          vscode.workspace.openTextDocument(filePath).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
              const pos = new vscode.Position(line - 1, 0);
              editor.selection = new vscode.Selection(pos, pos);
              editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
            });
          });
        } else if (message.type === 'refresh') {
          const newTodos = scanTodos(rootPath);
          this._panel.webview.html = this._getHtmlForWebview(newTodos);
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, rootPath: string) {
    if (TodoBoardPanel.currentPanel) {
      TodoBoardPanel.currentPanel._panel.reveal(undefined, true);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'todoBoard',
      'TODO 看板',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true }
    );

    TodoBoardPanel.currentPanel = new TodoBoardPanel(panel, extensionUri, rootPath);
  }

  private dispose() {
    TodoBoardPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) { x.dispose(); }
    }
  }

  private _getHtmlForWebview(todos: TodoItem[]): string {
    const groups: Record<string, TodoItem[]> = {
      TODO: [], FIXME: [], HACK: [], XXX: [], NOTE: [], BUG: [],
    };
    for (const t of todos) {
      groups[t.tag]?.push(t);
    }

    const tagColors: Record<string, string> = {
      TODO: '#5b9bd5', FIXME: '#ed7d31', HACK: '#a855f7',
      XXX: '#ffc000', NOTE: '#70ad47', BUG: '#ef4444',
    };

    let cardsHtml = '';
    for (const [tag, items] of Object.entries(groups)) {
      const color = tagColors[tag] || '#999';
      const itemsHtml = items.map(item => `
        <div class="todo-item" onclick="openFile('${item.file}', ${item.line})">
          <div class="todo-text">${escapeHtml(item.text)}</div>
          <div class="todo-meta">
            <span class="todo-file">${item.file}:${item.line}</span>
            ${item.priority ? '<span class="todo-priority">(' + escapeHtml(item.priority) + ')</span>' : ''}
          </div>
        </div>`).join('');

      cardsHtml += `
        <div class="column">
          <div class="column-header" style="border-top: 3px solid ${color}">
            <span class="column-tag" style="color:${color}">${tag}</span>
            <span class="column-count">${items.length}</span>
          </div>
          <div class="column-items">${itemsHtml || '<div class="empty">暂无</div>'}</div>
        </div>`;
    }

    const totalCount = todos.length;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, sans-serif; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 16px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .header h2 { font-size: 15px; }
  .stats { font-size: 12px; color: var(--vscode-descriptionForeground); }
  .refresh-btn {
    padding: 4px 12px; font-size: 12px; cursor: pointer;
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
    border: none; border-radius: 3px;
  }
  .refresh-btn:hover { background: var(--vscode-button-hoverBackground); }
  .board { display: flex; gap: 12px; overflow-x: auto; min-height: 300px; }
  .column { flex: 0 0 260px; background: var(--vscode-textBlockQuote-background); border-radius: 6px; padding: 0; }
  .column-header {
    padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid var(--vscode-panel-border);
  }
  .column-tag { font-weight: 700; font-size: 13px; }
  .column-count { font-size: 11px; color: var(--vscode-descriptionForeground); background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 1px 6px; border-radius: 8px; }
  .column-items { padding: 8px; display: flex; flex-direction: column; gap: 6px; max-height: 70vh; overflow-y: auto; }
  .todo-item {
    padding: 8px 10px; border-radius: 4px; cursor: pointer;
    background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border);
    transition: border-color 0.15s;
  }
  .todo-item:hover { border-color: var(--vscode-focusBorder); }
  .todo-text { font-size: 12px; margin-bottom: 4px; line-height: 1.4; }
  .todo-meta { font-size: 11px; color: var(--vscode-descriptionForeground); }
  .todo-file { margin-right: 6px; }
  .todo-priority { color: var(--vscode-notificationsInfoIcon-foreground); }
  .empty { text-align: center; padding: 20px; color: var(--vscode-descriptionForeground); font-size: 12px; }
</style>
</head>
<body>
<div class="header">
  <h2>TODO 看板</h2>
  <div>
    <span class="stats">共 ${totalCount} 项</span>
    <button class="refresh-btn" onclick="refresh()" style="margin-left:12px">刷新</button>
  </div>
</div>
<div class="board">${cardsHtml}</div>
<script>
const vscode = acquireVsCodeApi();
function openFile(file, line) { vscode.postMessage({ type: 'openFile', file, line }); }
function refresh() { vscode.postMessage({ type: 'refresh' }); }
</script>
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
