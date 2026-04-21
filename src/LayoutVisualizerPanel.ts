import * as vscode from 'vscode';

export class LayoutVisualizerPanel {
  public static currentPanel: LayoutVisualizerPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getHtmlForWebview();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message: any) => {
        switch (message.type) {
          case 'copy':
            vscode.env.clipboard.writeText(message.code);
            vscode.window.showInformationMessage('CSS 已复制到剪贴板');
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    if (LayoutVisualizerPanel.currentPanel) {
      LayoutVisualizerPanel.currentPanel._panel.reveal(undefined, true);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'layoutVisualizer',
      'Flexbox / Grid 布局可视化',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true }
    );

    LayoutVisualizerPanel.currentPanel = new LayoutVisualizerPanel(panel, extensionUri);
  }

  private dispose() {
    LayoutVisualizerPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) { x.dispose(); }
    }
  }

  private _getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, sans-serif; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 16px; }
  h2 { margin-bottom: 12px; font-size: 16px; }
  .section { margin-bottom: 24px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; }
  .controls { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center; }
  label { font-size: 12px; color: var(--vscode-descriptionForeground); }
  select, input[type="number"] {
    background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 4px 8px; font-size: 12px;
  }
  select:focus, input:focus { outline: 1px solid var(--vscode-focusBorder); }
  .box {
    display: flex; gap: 8px; min-height: 180px; padding: 12px;
    background: var(--vscode-textBlockQuote-background); border-radius: 4px;
    border: 2px dashed var(--vscode-panel-border);
    transition: all 0.3s ease;
  }
  .box.grid-mode { display: grid; }
  .item {
    display: flex; align-items: center; justify-content: center;
    min-width: 50px; min-height: 50px; padding: 8px;
    border-radius: 4px; font-size: 14px; font-weight: 600;
    transition: all 0.3s ease; cursor: pointer; user-select: none;
  }
  .item:hover { transform: scale(1.05); }
  .item:nth-child(1) { background: #5b9bd5; color: #fff; }
  .item:nth-child(2) { background: #70ad47; color: #fff; }
  .item:nth-child(3) { background: #ffc000; color: #333; }
  .item:nth-child(4) { background: #ed7d31; color: #fff; }
  .item:nth-child(5) { background: #a855f7; color: #fff; }
  .item:nth-child(6) { background: #ec4899; color: #fff; }
  .code-block {
    margin-top: 8px; padding: 8px 12px; font-family: monospace; font-size: 12px;
    background: var(--vscode-textCodeBlock-background); border-radius: 4px;
    white-space: pre-wrap; word-break: break-all; position: relative;
  }
  .copy-btn {
    position: absolute; top: 4px; right: 4px; padding: 2px 8px; font-size: 11px;
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
    border: none; border-radius: 3px; cursor: pointer;
  }
  .copy-btn:hover { background: var(--vscode-button-hoverBackground); }
  .tabs { display: flex; gap: 0; margin-bottom: 0; }
  .tab {
    padding: 8px 20px; font-size: 13px; cursor: pointer; border: 1px solid var(--vscode-panel-border);
    background: var(--vscode-tab-inactiveBackground); border-bottom: none;
  }
  .tab.active { background: var(--vscode-tab-activeBackground); font-weight: 600; border-bottom: 2px solid var(--vscode-focusBorder); }
  .tab:first-child { border-radius: 6px 0 0 0; }
  .tab:last-child { border-radius: 0 6px 0 0; }
</style>
</head>
<body>

<div class="tabs">
  <div class="tab active" onclick="switchTab('flex')">Flexbox</div>
  <div class="tab" onclick="switchTab('grid')">Grid</div>
</div>

<div id="flexSection" class="section" style="border-top-left-radius: 0;">
  <div class="controls">
    <label>方向</label>
    <select id="flexDirection" onchange="updateFlex()">
      <option value="row">row →</option>
      <option value="row-reverse">row-reverse ←</option>
      <option value="column">column ↓</option>
      <option value="column-reverse">column-reverse ↑</option>
    </select>
    <label>主轴</label>
    <select id="justifyContent" onchange="updateFlex()">
      <option value="flex-start">flex-start</option>
      <option value="center">center</option>
      <option value="flex-end">flex-end</option>
      <option value="space-between">space-between</option>
      <option value="space-around">space-around</option>
      <option value="space-evenly">space-evenly</option>
    </select>
    <label>交叉轴</label>
    <select id="alignItems" onchange="updateFlex()">
      <option value="stretch">stretch</option>
      <option value="flex-start">flex-start</option>
      <option value="center">center</option>
      <option value="flex-end">flex-end</option>
    </select>
    <label>换行</label>
    <select id="flexWrap" onchange="updateFlex()">
      <option value="nowrap">nowrap</option>
      <option value="wrap">wrap</option>
      <option value="wrap-reverse">wrap-reverse</option>
    </select>
    <label>间距</label>
    <select id="flexGap" onchange="updateFlex()">
      <option value="0px">0</option>
      <option value="8px">8px</option>
      <option value="16px" selected>16px</option>
      <option value="24px">24px</option>
    </select>
    <label>子项</label>
    <input type="number" id="flexItems" value="4" min="1" max="6" style="width:50px" onchange="updateFlex()">
  </div>
  <div class="box" id="flexBox">
    <div class="item">1</div><div class="item">2</div><div class="item">3</div><div class="item">4</div>
  </div>
  <div class="code-block" id="flexCode">
    <button class="copy-btn" onclick="copyCode('flexCode')">复制</button>
  </div>
</div>

<div id="gridSection" class="section" style="display:none;">
  <div class="controls">
    <label>列数</label>
    <input type="number" id="gridCols" value="3" min="1" max="6" style="width:50px" onchange="updateGrid()">
    <label>行数</label>
    <input type="number" id="gridRows" value="2" min="1" max="6" style="width:50px" onchange="updateGrid()">
    <label>列宽</label>
    <select id="gridColSize" onchange="updateGrid()">
      <option value="1fr">1fr</option>
      <option value="auto">auto</option>
      <option value="minmax(100px,1fr)">minmax(100px,1fr)</option>
      <option value="repeat(auto-fit, minmax(100px,1fr))">auto-fit</option>
    </select>
    <label>间距</label>
    <select id="gridGap" onchange="updateGrid()">
      <option value="0px">0</option>
      <option value="8px">8px</option>
      <option value="16px" selected>16px</option>
      <option value="24px">24px</option>
    </select>
    <label>对齐</label>
    <select id="gridAlign" onchange="updateGrid()">
      <option value="stretch">stretch</option>
      <option value="start">start</option>
      <option value="center">center</option>
      <option value="end">end</option>
    </select>
  </div>
  <div class="box grid-mode" id="gridBox">
    <div class="item">1</div><div class="item">2</div><div class="item">3</div>
    <div class="item">4</div><div class="item">5</div><div class="item">6</div>
  </div>
  <div class="code-block" id="gridCode">
    <button class="copy-btn" onclick="copyCode('gridCode')">复制</button>
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();

function switchTab(type) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', (type === 'flex' && i === 0) || (type === 'grid' && i === 1));
  });
  document.getElementById('flexSection').style.display = type === 'flex' ? '' : 'none';
  document.getElementById('gridSection').style.display = type === 'grid' ? '' : 'none';
}

function updateFlex() {
  const dir = document.getElementById('flexDirection').value;
  const jc = document.getElementById('justifyContent').value;
  const ai = document.getElementById('alignItems').value;
  const wrap = document.getElementById('flexWrap').value;
  const gap = document.getElementById('flexGap').value;
  const count = parseInt(document.getElementById('flexItems').value) || 4;

  const box = document.getElementById('flexBox');
  box.style.flexDirection = dir;
  box.style.justifyContent = jc;
  box.style.alignItems = ai;
  box.style.flexWrap = wrap;
  box.style.gap = gap;

  box.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    const item = document.createElement('div');
    item.className = 'item';
    item.textContent = i;
    box.appendChild(item);
  }

  const code = \`.container {
  display: flex;
  flex-direction: \${dir};
  justify-content: \${jc};
  align-items: \${ai};
  flex-wrap: \${wrap};
  gap: \${gap};
}\`;
  document.getElementById('flexCode').textContent = code;
  document.getElementById('flexCode').insertAdjacentHTML('afterbegin', '<button class="copy-btn" onclick="copyCode(\'flexCode\')">复制</button>');
}

function updateGrid() {
  const cols = parseInt(document.getElementById('gridCols').value) || 3;
  const rows = parseInt(document.getElementById('gridRows').value) || 2;
  const colSize = document.getElementById('gridColSize').value;
  const gap = document.getElementById('gridGap').value;
  const align = document.getElementById('gridAlign').value;

  const box = document.getElementById('gridBox');
  const templateCols = colSize.includes('auto-fit')
    ? colSize
    : Array(cols).fill(colSize).join(' ');
  box.style.gridTemplateColumns = templateCols;
  box.style.gridTemplateRows = Array(rows).fill('1fr').join(' ');
  box.style.gap = gap;
  box.style.alignItems = align;

  const total = cols * rows;
  box.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const item = document.createElement('div');
    item.className = 'item';
    item.textContent = i;
    box.appendChild(item);
  }

  const code = \`.container {
  display: grid;
  grid-template-columns: \${templateCols};
  grid-template-rows: \${Array(rows).fill('1fr').join(' ')};
  gap: \${gap};
  align-items: \${align};
}\`;
  document.getElementById('gridCode').textContent = code;
  document.getElementById('gridCode').insertAdjacentHTML('afterbegin', '<button class="copy-btn" onclick="copyCode(\'gridCode\')">复制</button>');
}

function copyCode(id) {
  const el = document.getElementById(id);
  const text = el.textContent.replace('复制', '').trim();
  vscode.postMessage({ type: 'copy', code: text });
}

updateFlex();
updateGrid();
</script>
</body>
</html>`;
  }
}
