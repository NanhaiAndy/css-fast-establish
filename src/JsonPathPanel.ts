import * as vscode from 'vscode';

export class JsonPathPanel {
  public static currentPanel: JsonPathPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getHtmlForWebview();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (JsonPathPanel.currentPanel) {
      JsonPathPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'jsonPathQuery',
      'JSON Path 查询器',
      column || vscode.ViewColumn.One,
      { enableScripts: true }
    );

    JsonPathPanel.currentPanel = new JsonPathPanel(panel, extensionUri);
  }

  private dispose() {
    JsonPathPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) x.dispose();
    }
  }

  private _getHtmlForWebview(): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSON Path 查询器</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    h1 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .input-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; margin-bottom: 6px; color: var(--vscode-descriptionForeground); }
    textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 14px;
      outline: none;
      resize: vertical;
    }
    textarea:focus { border-color: #FF6900; }
    .json-input { min-height: 150px; }
    .path-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 14px;
      outline: none;
    }
    .path-input:focus { border-color: #FF6900; }
    .result-section { margin-top: 20px; }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .result-header h2 { font-size: 15px; font-weight: 500; }
    .copy-btn {
      padding: 4px 12px;
      background: #FF6900;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .copy-btn:hover { background: #e55d00; }
    .path-hint {
      margin-top: 8px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .path-hint code {
      background: rgba(255,255,255,0.08);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: 'Consolas', monospace;
      font-size: 11px;
    }
    .result-content {
      background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05));
      border-radius: 6px;
      padding: 12px 16px;
      font-family: 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 400px;
      overflow-y: auto;
    }
    .error { color: #f44747; }
    .type-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 11px;
      margin-left: 8px;
      background: rgba(255, 105, 0, 0.15);
      color: #FF6900;
    }
    .path-tokens {
      margin-top: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .token {
      padding: 2px 8px;
      border-radius: 3px;
      font-family: 'Consolas', monospace;
      font-size: 12px;
      background: rgba(255, 105, 0, 0.1);
      color: #FF6900;
    }
  </style>
</head>
<body>
  <h1>JSON Path 查询器</h1>

  <div class="input-group">
    <label>JSON 数据</label>
    <textarea class="json-input" id="jsonInput" placeholder='粘贴 JSON 数据，如: { "data": { "list": [1, 2, 3] } }'></textarea>
  </div>

  <div class="input-group">
    <label>路径表达式</label>
    <input class="path-input" type="text" id="pathInput" placeholder="输入路径，如: data.list[0]" />
    <div class="path-hint">
      支持: <code>data.list[0].name</code> &nbsp; <code>users[2].address.city</code> &nbsp; <code>items</code>
    </div>
  </div>

  <div class="result-section">
    <div class="result-header">
      <h2>查询结果 <span id="typeBadge" class="type-badge"></span></h2>
      <button class="copy-btn" id="copyBtn" style="display:none">复制结果</button>
    </div>
    <div class="path-tokens" id="pathTokens"></div>
    <div class="result-content" id="resultContent">在上方输入 JSON 和路径表达式开始查询</div>
  </div>

  <script nonce="${nonce}">
    const jsonInput = document.getElementById('jsonInput');
    const pathInput = document.getElementById('pathInput');
    const resultContent = document.getElementById('resultContent');
    const typeBadge = document.getElementById('typeBadge');
    const copyBtn = document.getElementById('copyBtn');
    const pathTokens = document.getElementById('pathTokens');

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function getType(value) {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'Array[' + value.length + ']';
      return typeof value;
    }

    function parsePath(pathStr) {
      // 解析路径为 token 列表
      // 支持: data.list[0].name, [0], .name 等
      const tokens = [];
      let i = 0;
      while (i < pathStr.length) {
        // 跳过点号
        if (pathStr[i] === '.') {
          i++;
          continue;
        }
        // 数组索引
        if (pathStr[i] === '[') {
          const end = pathStr.indexOf(']', i);
          if (end === -1) break;
          const index = pathStr.substring(i + 1, end);
          tokens.push({ type: 'index', value: parseInt(index) });
          i = end + 1;
          continue;
        }
        // 属性名
        let name = '';
        while (i < pathStr.length && pathStr[i] !== '.' && pathStr[i] !== '[') {
          name += pathStr[i];
          i++;
        }
        if (name) {
          tokens.push({ type: 'property', value: name });
        }
      }
      return tokens;
    }

    function evaluatePath(jsonData, pathStr) {
      if (!pathStr.trim()) return { value: jsonData, found: true };
      const tokens = parsePath(pathStr);
      let current = jsonData;
      for (const token of tokens) {
        if (current === null || current === undefined) {
          return { value: undefined, found: false, failToken: token };
        }
        if (token.type === 'index') {
          if (!Array.isArray(current)) {
            return { value: undefined, found: false, failToken: token, reason: '期望 Array，得到 ' + getType(current) };
          }
          current = current[token.value];
        } else {
          if (typeof current !== 'object' || Array.isArray(current)) {
            return { value: undefined, found: false, failToken: token, reason: '期望 Object，得到 ' + getType(current) };
          }
          current = current[token.value];
        }
      }
      return { value: current, found: true };
    }

    function renderTokens(pathStr) {
      if (!pathStr.trim()) {
        pathTokens.innerHTML = '';
        return;
      }
      const tokens = parsePath(pathStr);
      pathTokens.innerHTML = tokens.map(t =>
        '<span class="token">' + escapeHtml(
          t.type === 'index' ? '[' + t.value + ']' : '.' + t.value
        ) + '</span>'
      ).join('');
    }

    function query() {
      const jsonStr = jsonInput.value.trim();
      const pathStr = pathInput.value.trim();

      if (!jsonStr) {
        resultContent.innerHTML = '请输入 JSON 数据';
        typeBadge.textContent = '';
        copyBtn.style.display = 'none';
        pathTokens.innerHTML = '';
        return;
      }

      let jsonData;
      try {
        jsonData = JSON.parse(jsonStr);
      } catch (e) {
        resultContent.innerHTML = '<span class="error">JSON 解析错误: ' + escapeHtml(e.message) + '</span>';
        typeBadge.textContent = '';
        copyBtn.style.display = 'none';
        pathTokens.innerHTML = '';
        return;
      }

      renderTokens(pathStr);

      const result = evaluatePath(jsonData, pathStr);

      if (!result.found) {
        let msg = '<span class="error">路径未找到';
        if (result.failToken) {
          msg += ' — 在 ' + escapeHtml(
            result.failToken.type === 'index' ? '[' + result.failToken.value + ']' : '.' + result.failToken.value
          );
          if (result.reason) {
            msg += ' (' + escapeHtml(result.reason) + ')';
          }
        }
        msg += '</span>';
        resultContent.innerHTML = msg;
        typeBadge.textContent = 'undefined';
        copyBtn.style.display = 'none';
        return;
      }

      const valueType = getType(result.value);
      typeBadge.textContent = valueType;

      if (result.value === undefined) {
        resultContent.innerHTML = '<span style="color:var(--vscode-descriptionForeground)">undefined</span>';
        copyBtn.style.display = 'none';
      } else if (typeof result.value === 'object') {
        const formatted = JSON.stringify(result.value, null, 2);
        resultContent.innerHTML = escapeHtml(formatted);
        copyBtn.style.display = 'inline-block';
      } else {
        resultContent.innerHTML = escapeHtml(String(result.value));
        copyBtn.style.display = 'inline-block';
      }
    }

    jsonInput.addEventListener('input', query);
    pathInput.addEventListener('input', query);

    copyBtn.addEventListener('click', () => {
      const jsonStr = jsonInput.value.trim();
      const pathStr = pathInput.value.trim();
      try {
        const jsonData = JSON.parse(jsonStr);
        const result = evaluatePath(jsonData, pathStr);
        const text = typeof result.value === 'object'
          ? JSON.stringify(result.value, null, 2)
          : String(result.value);
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = '已复制';
          setTimeout(() => { copyBtn.textContent = '复制结果'; }, 1500);
        });
      } catch {}
    });
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
