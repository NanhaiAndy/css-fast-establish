import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface EnvEntry {
  key: string;
  value: string;
  comment?: string;
  line: number;
}

interface EnvFile {
  name: string;
  path: string;
  entries: EnvEntry[];
}

function parseEnvFile(filePath: string): EnvEntry[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const entries: EnvEntry[] = [];
    let lastComment: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) {
        if (line.startsWith('#')) {
          lastComment = line.replace(/^#\s*/, '');
        }
        continue;
      }

      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) { continue; }

      const key = line.substring(0, eqIndex).trim();
      let value = line.substring(eqIndex + 1).trim();
      // remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      entries.push({ key, value, comment: lastComment, line: i });
      lastComment = undefined;
    }
    return entries;
  } catch {
    return [];
  }
}

function findEnvFiles(rootPath: string): EnvFile[] {
  const files: EnvFile[] = [];
  const envNames = ['.env', '.env.local', '.env.development', '.env.dev', '.env.staging', '.env.production', '.env.prod', '.env.test'];

  for (const name of envNames) {
    const filePath = path.join(rootPath, name);
    if (fs.existsSync(filePath)) {
      const entries = parseEnvFile(filePath);
      files.push({ name, path: filePath, entries });
    }
  }

  // also check for .env.xxx.local variants
  try {
    const allFiles = fs.readdirSync(rootPath);
    for (const f of allFiles) {
      if (f.startsWith('.env') && !envNames.includes(f) && !files.some(ef => ef.name === f)) {
        const filePath = path.join(rootPath, f);
        const entries = parseEnvFile(filePath);
        if (entries.length > 0) {
          files.push({ name: f, path: filePath, entries });
        }
      }
    }
  } catch {
    // ignore
  }

  return files;
}

function writeEnvFile(envFile: EnvFile): void {
  const lines: string[] = [];
  for (const entry of envFile.entries) {
    if (entry.comment) {
      lines.push(`# ${entry.comment}`);
    }
    const needsQuotes = entry.value.includes(' ') || entry.value.includes('#') || entry.value.includes('"');
    const value = needsQuotes ? `"${entry.value}"` : entry.value;
    lines.push(`${entry.key}=${value}`);
  }
  fs.writeFileSync(envFile.path, lines.join('\n'), 'utf-8');
}

export class EnvManagerPanel {
  public static currentPanel: EnvManagerPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _envFiles: EnvFile[] = [];
  private _rootPath: string;

  private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri, rootPath: string) {
    this._panel = panel;
    this._rootPath = rootPath;
    this._envFiles = findEnvFiles(rootPath);
    this._panel.webview.html = this._getHtmlForWebview();

    this._panel.webview.onDidReceiveMessage(
      async (message: any) => {
        switch (message.type) {
          case 'save':
            this.handleSave(message.fileIndex, message.entries);
            break;
          case 'add':
            this.handleAdd(message.fileIndex, message.key, message.value);
            break;
          case 'delete':
            this.handleDelete(message.fileIndex, message.keyIndex);
            break;
          case 'refresh':
            this._envFiles = findEnvFiles(this._rootPath);
            this._panel.webview.html = this._getHtmlForWebview();
            break;
          case 'copyValue':
            vscode.env.clipboard.writeText(message.value);
            vscode.window.showInformationMessage('已复制到剪贴板');
            break;
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, rootPath: string) {
    if (EnvManagerPanel.currentPanel) {
      EnvManagerPanel.currentPanel._panel.reveal(undefined, true);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'envManager',
      '环境变量管理',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true }
    );

    EnvManagerPanel.currentPanel = new EnvManagerPanel(panel, extensionUri, rootPath);
  }

  private handleSave(fileIndex: number, entries: { key: string; value: string }[]) {
    if (!this._envFiles[fileIndex]) { return; }
    const envFile = this._envFiles[fileIndex];
    envFile.entries = entries.map((e, i) => ({
      key: e.key,
      value: e.value,
      line: i,
    }));
    writeEnvFile(envFile);
    vscode.window.showInformationMessage(`${envFile.name} 已保存`);
  }

  private handleAdd(fileIndex: number, key: string, value: string) {
    if (!this._envFiles[fileIndex]) { return; }
    this._envFiles[fileIndex].entries.push({ key, value, line: 0 });
    writeEnvFile(this._envFiles[fileIndex]);
    this._panel.webview.html = this._getHtmlForWebview();
    vscode.window.showInformationMessage(`已添加 ${key}`);
  }

  private handleDelete(fileIndex: number, keyIndex: number) {
    if (!this._envFiles[fileIndex]) { return; }
    const removed = this._envFiles[fileIndex].entries.splice(keyIndex, 1);
    writeEnvFile(this._envFiles[fileIndex]);
    this._panel.webview.html = this._getHtmlForWebview();
    vscode.window.showInformationMessage(`已删除 ${removed[0]?.key}`);
  }

  private dispose() {
    EnvManagerPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) { x.dispose(); }
    }
  }

  private _getHtmlForWebview(): string {
    if (this._envFiles.length === 0) {
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;color:var(--vscode-editor-foreground);background:var(--vscode-editor-background);">
        <h3>未找到 .env 文件</h3><p style="color:var(--vscode-descriptionForeground);margin-top:8px">请在项目根目录创建 .env 文件</p></body></html>`;
    }

    const tabsHtml = this._envFiles.map((f, i) =>
      `<div class="tab ${i === 0 ? 'active' : ''}" onclick="switchEnv(${i})">${f.name}</div>`
    ).join('');

    const envPanesHtml = this._envFiles.map((f, i) => {
      const rowsHtml = f.entries.map((e, j) => `
        <div class="env-row">
          <input class="env-key" value="${escapeAttr(e.key)}" data-idx="${j}" />
          <span class="env-eq">=</span>
          <input class="env-value" value="${escapeAttr(e.value)}" data-idx="${j}" />
          <button class="btn-icon copy-btn" title="复制值" onclick="copyValue(${i}, ${j})">⧉</button>
          <button class="btn-icon del-btn" title="删除" onclick="deleteEntry(${i}, ${j})">✕</button>
        </div>`).join('');

      return `<div class="env-pane" id="pane-${i}" style="display:${i === 0 ? '' : 'none'}">
        <div class="env-rows">${rowsHtml}</div>
        <div class="env-actions">
          <button class="action-btn" onclick="addEntry(${i})">+ 添加变量</button>
          <button class="action-btn primary" onclick="saveEnv(${i})">保存</button>
        </div>
      </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, sans-serif; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 16px; }
  .tabs { display: flex; gap: 0; margin-bottom: 16px; flex-wrap: wrap; }
  .tab {
    padding: 6px 16px; font-size: 12px; cursor: pointer;
    border: 1px solid var(--vscode-panel-border); border-bottom: none;
    background: var(--vscode-tab-inactiveBackground);
  }
  .tab.active { background: var(--vscode-tab-activeBackground); font-weight: 600; }
  .tab:first-child { border-radius: 6px 0 0 0; }
  .env-pane { border: 1px solid var(--vscode-panel-border); border-radius: 0 6px 6px 6px; padding: 12px; }
  .env-rows { display: flex; flex-direction: column; gap: 6px; max-height: 60vh; overflow-y: auto; }
  .env-row { display: flex; gap: 6px; align-items: center; }
  .env-key, .env-value {
    padding: 4px 8px; font-size: 12px; font-family: monospace;
    background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border); border-radius: 3px;
  }
  .env-key { width: 180px; font-weight: 600; }
  .env-value { flex: 1; }
  .env-eq { color: var(--vscode-descriptionForeground); font-family: monospace; }
  .btn-icon {
    width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
    border: none; border-radius: 3px; cursor: pointer; font-size: 12px;
    background: transparent; color: var(--vscode-descriptionForeground);
  }
  .btn-icon:hover { background: var(--vscode-toolbar-hoverBackground); }
  .del-btn:hover { color: #ef4444; }
  .env-actions { display: flex; gap: 8px; margin-top: 12px; justify-content: flex-end; }
  .action-btn {
    padding: 6px 14px; font-size: 12px; cursor: pointer;
    background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);
    border: none; border-radius: 3px;
  }
  .action-btn.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .action-btn:hover { opacity: 0.9; }
</style>
</head>
<body>
<div class="tabs">${tabsHtml}</div>
${envPanesHtml}
<script>
const vscode = acquireVsCodeApi();
function switchEnv(idx) {
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('.env-pane').forEach((p, i) => p.style.display = i === idx ? '' : 'none');
}
function saveEnv(idx) {
  const pane = document.getElementById('pane-' + idx);
  const keys = pane.querySelectorAll('.env-key');
  const values = pane.querySelectorAll('.env-value');
  const entries = [];
  keys.forEach((k, i) => { entries.push({ key: k.value, value: values[i].value }); });
  vscode.postMessage({ type: 'save', fileIndex: idx, entries });
}
function addEntry(idx) {
  const key = prompt('变量名:');
  if (!key) return;
  const value = prompt('变量值:') || '';
  vscode.postMessage({ type: 'add', fileIndex: idx, key, value });
}
function deleteEntry(idx, keyIdx) {
  vscode.postMessage({ type: 'delete', fileIndex: idx, keyIndex: keyIdx });
}
function copyValue(idx, keyIdx) {
  const pane = document.getElementById('pane-' + idx);
  const values = pane.querySelectorAll('.env-value');
  vscode.postMessage({ type: 'copyValue', value: values[keyIdx]?.value || '' });
}
</script>
</body>
</html>`;
  }
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
