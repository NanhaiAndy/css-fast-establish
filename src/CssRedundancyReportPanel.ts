import * as vscode from 'vscode';
import * as pathModule from 'path';

interface UnusedClass {
  className: string;
  file: string;
  line: number;
  context: string;
}

interface RedundancyData {
  totalDefined: number;
  totalUsed: number;
  unusedClasses: UnusedClass[];
  scanTime: number;
}

export class CssRedundancyReportPanel {
  public static currentPanel: CssRedundancyReportPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _currentData: RedundancyData;
  private _detectScope: 'file' | 'workspace';

  private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri, data: RedundancyData, scope: 'file' | 'workspace' = 'workspace') {
    this._panel = panel;
    this._currentData = data;
    this._detectScope = scope;
    this._panel.webview.html = this._getHtmlForWebview(data);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // 添加消息处理器
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'deleteMultiple':
            const confirm = await vscode.window.showWarningMessage(
              `确定删除选中的 ${message.items.length} 个冗余 class？此操作不可撤销。`,
              { modal: true },
              '确定删除'
            );
            if (confirm === '确定删除') {
              await this.deleteClasses(message.items);
              // 删除成功后自动刷新报告
              await this.refreshReport();
            }
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private async deleteClasses(items: Array<{ file: string; line: number; className: string; context: string }>): Promise<void> {
    // 按文件分组
    const fileGroups = new Map<string, Array<{ line: number; className: string; context: string }>>();
    for (const item of items) {
      const existing = fileGroups.get(item.file) || [];
      existing.push({ line: item.line, className: item.className, context: item.context });
      fileGroups.set(item.file, existing);
    }

    let totalDeleted = 0;
    let skipped = 0;
    const skipReasons: string[] = [];

    for (const [filePath, deletions] of fileGroups) {
      try {
        // 将相对路径解析为绝对路径
        let absolutePath = filePath;
        if (!pathModule.isAbsolute(filePath)) {
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
          if (workspaceRoot) {
            absolutePath = pathModule.join(workspaceRoot, filePath);
          }
        }
        
        console.log(`[CSS Redundancy] 尝试删除文件: ${absolutePath}`);
        console.log(`[CSS Redundancy] 待删除项数量: ${deletions.length}`);
        
        const uri = vscode.Uri.file(absolutePath);
        let doc = await vscode.workspace.openTextDocument(uri);
        let editor = await vscode.window.showTextDocument(doc, { preserveFocus: true });

        // 按行号降序排列避免偏移
        deletions.sort((a, b) => b.line - a.line);

        // 逐个删除，每次删除后重新加载文档以获取最新内容
        for (let i = 0; i < deletions.length; i++) {
          const del = deletions[i];
          
          // 每次删除前重新加载文档，确保获取最新内容
          if (i > 0) {
            doc = await vscode.workspace.openTextDocument(uri);
            editor = await vscode.window.showTextDocument(doc, { preserveFocus: true });
          }
          
          console.log(`[CSS Redundancy] 尝试删除 class: ${del.className}, 预期行号: ${del.line}`);
          console.log(`[CSS Redundancy] Context: "${del.context}"`);
          
          // 策略A: 优先使用 context 进行精确匹配找到起始行
          let deleted = false;
          let targetLineNum = -1;
          
          if (del.context) {
            const contextTrimmed = del.context.trim();
            // 在整个文档中搜索匹配的 context
            for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
              const lineText = doc.lineAt(lineNum).text;
              if (lineText.trim() === contextTrimmed) {
                console.log(`[CSS Redundancy] ✓ 通过 context 精确匹配找到目标，实际行号: ${lineNum + 1}`);
                targetLineNum = lineNum;
                break;
              }
            }
          }
          
          // 策略B: 如果 context 匹配失败，尝试在预期行号附近搜索 className
          if (targetLineNum === -1) {
            const searchRange = 5; // 在预期行号前后5行范围内搜索
            const startLine = Math.max(0, del.line - 1 - searchRange);
            const endLine = Math.min(doc.lineCount, del.line - 1 + searchRange);
            
            const escapedClassName = del.className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const classPattern = new RegExp(`\\.\\s*${escapedClassName}(?=\\s*[{,:])`, 'i');
            
            console.log(`[CSS Redundancy] 在行 ${startLine + 1}-${endLine + 1} 范围内搜索 class: ${del.className}`);
            
            for (let lineNum = startLine; lineNum < endLine; lineNum++) {
              const lineText = doc.lineAt(lineNum).text;
              if (classPattern.test(lineText)) {
                console.log(`[CSS Redundancy] ✓ 在行 ${lineNum + 1} 找到匹配的 class`);
                targetLineNum = lineNum;
                break;
              }
            }
          }
          
          // 找到目标行后，计算需要删除的完整范围
          if (targetLineNum !== -1) {
            const deleteRange = this.calculateDeleteRange(doc, targetLineNum);
            console.log(`[CSS Redundancy] 删除范围: 行 ${deleteRange.start + 1} - ${deleteRange.end + 1}`);
            
            // 删除从 start 到 end 的所有行
            const startRange = doc.lineAt(deleteRange.start).range;
            const endRange = doc.lineAt(deleteRange.end).range;
            const fullRange = new vscode.Range(
              startRange.start,
              endRange.end
            );
            
            await editor.edit(editBuilder => {
              editBuilder.delete(fullRange);
            });
            
            totalDeleted++;
            deleted = true;
          }
          
          if (!deleted) {
            const reason = `无法找到 class "${del.className}" (预期行 ${del.line})`;
            console.log(`[CSS Redundancy] ✗ ${reason}`);
            skipReasons.push(reason);
            skipped++;
          }
        }
      } catch (error) {
        const reason = `处理文件 ${filePath} 时出错: ${error}`;
        console.error(`[CSS Redundancy] ✗ ${reason}`);
        skipReasons.push(reason);
        skipped += deletions.length;
      }
    }

    if (totalDeleted > 0) {
      vscode.window.showInformationMessage(`已删除 ${totalDeleted} 个冗余 class${skipped > 0 ? `，跳过 ${skipped} 个` : ''}`);
    }
    if (totalDeleted === 0) {
      const detail = skipReasons.length > 0 ? `\n\n跳过原因:\n${skipReasons.join('\n')}` : '';
      vscode.window.showWarningMessage(`没有成功删除任何 class（${skipped} 个跳过）${detail}`);
    }
  }

  /**
   * 计算需要删除的完整 CSS 规则范围
   * 从选择器行开始，找到对应的闭合括号
   */
  private calculateDeleteRange(doc: vscode.TextDocument, startLine: number): { start: number; end: number } {
    let braceCount = 0;
    let foundOpening = false;
    let endLine = startLine;
    
    // 从起始行开始查找闭合括号
    for (let i = startLine; i < doc.lineCount; i++) {
      const lineText = doc.lineAt(i).text;
      
      // 统计花括号
      for (const char of lineText) {
        if (char === '{') {
          braceCount++;
          foundOpening = true;
        } else if (char === '}') {
          braceCount--;
        }
      }
      
      // 如果找到了开括号并且所有括号都闭合了
      if (foundOpening && braceCount <= 0) {
        endLine = i;
        break;
      }
    }
    
    // 检查是否需要删除前面的空行或注释
    let actualStart = startLine;
    if (startLine > 0) {
      // 向前查找，如果有注释或空行，也一并删除
      for (let i = startLine - 1; i >= 0; i--) {
        const lineText = doc.lineAt(i).text.trim();
        if (lineText === '' || lineText.startsWith('//') || lineText.startsWith('/*')) {
          actualStart = i;
        } else {
          break;
        }
      }
    }
    
    // 检查后面是否有空行，也一并删除
    let actualEnd = endLine;
    if (endLine < doc.lineCount - 1) {
      const nextLineText = doc.lineAt(endLine + 1).text.trim();
      if (nextLineText === '') {
        actualEnd = endLine + 1;
      }
    }
    
    return { start: actualStart, end: actualEnd };
  }

  /**
   * 刷新报告 - 重新运行检测并更新Webview
   */
  private async refreshReport(): Promise<void> {
    try {
      // 显示加载提示
      this._panel.webview.html = this._getLoadingHtml();
      
      // 重新导入检测器
      const { detect } = await import('./CssRedundancyDetector');
      
      // 重新运行检测
      const result = await detect(this._detectScope);
      
      if (result) {
        this._currentData = result;
        // 更新Webview内容
        this._panel.webview.html = this._getHtmlForWebview(result);
        
        // 显示成功消息
        vscode.window.showInformationMessage('报告已刷新');
      } else {
        vscode.window.showWarningMessage('无法重新扫描，请手动刷新');
        // 恢复原来的内容
        this._panel.webview.html = this._getHtmlForWebview(this._currentData);
      }
    } catch (error) {
      console.error('[CSS Redundancy] 刷新报告失败:', error);
      vscode.window.showErrorMessage(`刷新报告失败: ${error}`);
      // 恢复原来的内容
      this._panel.webview.html = this._getHtmlForWebview(this._currentData);
    }
  }

  /**
   * 生成加载中的HTML
   */
  private _getLoadingHtml(): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>CSS 冗余检测</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .loading {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,105,0,0.2);
      border-top-color: #FF6900;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <div class="loading-text">正在重新扫描...</div>
  </div>
</body>
</html>`;
  }

  public static createOrShow(extensionUri: vscode.Uri, data: RedundancyData, scope: 'file' | 'workspace' = 'workspace') {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (CssRedundancyReportPanel.currentPanel) {
      CssRedundancyReportPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'cssRedundancy',
      'CSS 冗余检测报告',
      column || vscode.ViewColumn.One,
      { enableScripts: true }
    );

    CssRedundancyReportPanel.currentPanel = new CssRedundancyReportPanel(panel, extensionUri, data, scope);
  }

  private dispose() {
    CssRedundancyReportPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) x.dispose();
    }
  }

  private _getHtmlForWebview(data: RedundancyData): string {
    const nonce = getNonce();
    const usageRate = data.totalDefined > 0
      ? ((data.totalUsed / data.totalDefined) * 100).toFixed(1)
      : '100';

    // 按文件分组
    const fileGroups = new Map<string, UnusedClass[]>();
    for (const cls of data.unusedClasses) {
      const existing = fileGroups.get(cls.file) || [];
      existing.push(cls);
      fileGroups.set(cls.file, existing);
    }

    const fileSections = Array.from(fileGroups.entries())
      .map(([file, classes]) =>
        `<div class="file-section">
          <div class="file-header">${escapeHtml(file)} <span class="badge">${classes.length}</span></div>
          <div class="class-list">
            ${classes.map(cls =>
              `<div class="class-item">
                <input type="checkbox" class="class-checkbox" data-file="${escapeHtml(cls.file)}" data-line="${cls.line}" data-name="${escapeHtml(cls.className)}" data-context="${escapeHtml(cls.context)}" />
                <code class="class-name">.${escapeHtml(cls.className)}</code>
                <span class="class-line">行 ${cls.line}</span>
                <span class="class-context">${escapeHtml(cls.context)}</span>
              </div>`
            ).join('')}
          </div>
        </div>`
      ).join('');

    const emptyMsg = data.unusedClasses.length === 0
      ? '<div class="success-msg">所有 CSS class 都已被引用</div>'
      : '';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>CSS 冗余检测</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    h1 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .summary {
      display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .summary-card {
      background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05));
      border-radius: 8px; padding: 12px 20px; text-align: center; min-width: 120px;
    }
    .summary-card .num { font-size: 24px; font-weight: 700; color: #FF6900; }
    .summary-card .label { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 4px; }
    .usage-bar { margin-bottom: 20px; }
    .usage-bar-bg {
      height: 8px; background: var(--vscode-input-border, rgba(255,255,255,0.1));
      border-radius: 4px; overflow: hidden;
    }
    .usage-bar-fill {
      height: 100%; background: #FF6900; border-radius: 4px;
      transition: width 0.3s ease;
    }
    .usage-label {
      font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 6px;
    }
    .file-section { margin-bottom: 16px; }
    .file-header {
      font-size: 13px; font-weight: 600; padding: 8px 12px;
      background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05));
      border-radius: 6px 6px 0 0;
    }
    .badge {
      background: rgba(255,105,0,0.15); color: #FF6900; padding: 1px 8px;
      border-radius: 10px; font-size: 11px; font-weight: 500; margin-left: 8px;
    }
    .class-list { padding: 4px 0; }
    .class-item {
      display: flex; align-items: center; gap: 12px;
      padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .class-name {
      font-family: 'Consolas', monospace; font-size: 13px;
      background: rgba(255,105,0,0.1); color: #FF6900;
      padding: 2px 8px; border-radius: 3px; min-width: 80px;
    }
    .class-line { font-size: 12px; color: var(--vscode-descriptionForeground); white-space: nowrap; }
    .class-context {
      font-family: 'Consolas', monospace; font-size: 12px;
      color: var(--vscode-descriptionForeground); overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }
    .success-msg {
      text-align: center; padding: 32px; color: #4ec9b0; font-size: 15px; font-weight: 500;
    }
    .scan-time { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 8px; }
    .action-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .action-btn {
      padding: 6px 16px; border: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
      border-radius: 4px; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
      font-size: 13px; cursor: pointer; outline: none;
    }
    .action-btn:hover { background: rgba(255,105,0,0.15); border-color: #FF6900; }
    .action-btn.danger { border-color: #f44747; color: #f44747; }
    .action-btn.danger:hover { background: rgba(244,71,71,0.15); }
    .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .class-item { display: flex; align-items: center; gap: 8px; }
    .class-item input[type="checkbox"] { width: 16px; height: 16px; accent-color: #FF6900; cursor: pointer; }
    .class-item.checked { background: rgba(255,105,0,0.08); }
  </style>
</head>
<body>
  <h1>CSS 冗余检测报告</h1>
  <div class="summary">
    <div class="summary-card">
      <div class="num">${data.totalDefined}</div>
      <div class="label">CSS class 总数</div>
    </div>
    <div class="summary-card">
      <div class="num" style="color: #4ec9b0">${data.totalUsed}</div>
      <div class="label">已引用</div>
    </div>
    <div class="summary-card">
      <div class="num" style="color: ${data.unusedClasses.length > 0 ? '#f44747' : '#4ec9b0'}">${data.unusedClasses.length}</div>
      <div class="label">未使用（冗余）</div>
    </div>
    <div class="summary-card">
      <div class="num">${usageRate}%</div>
      <div class="label">使用率</div>
    </div>
  </div>

  <div class="usage-bar">
    <div class="usage-label">CSS 使用率 ${usageRate}%</div>
    <div class="usage-bar-bg">
      <div class="usage-bar-fill" style="width: ${usageRate}%"></div>
    </div>
  </div>

  ${data.unusedClasses.length > 0 ? `
  <div class="action-bar">
    <button class="action-btn" id="selectAllBtn">全选</button>
    <button class="action-btn" id="invertBtn">反选</button>
    <button class="action-btn danger" id="deleteBtn" disabled>批量删除选中</button>
    <span id="selectedCount" style="font-size:12px;color:var(--vscode-descriptionForeground);line-height:32px;">已选 0 项</span>
  </div>` : ''}

  ${emptyMsg}
  ${fileSections}

  <div class="scan-time">扫描完成，耗时 ${(data.scanTime / 1000).toFixed(1)}s</div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const checkboxes = document.querySelectorAll('.class-checkbox');
    const deleteBtn = document.getElementById('deleteBtn');
    const selectedCount = document.getElementById('selectedCount');

    function updateCount() {
      const checked = document.querySelectorAll('.class-checkbox:checked').length;
      if (selectedCount) selectedCount.textContent = '已选 ' + checked + ' 项';
      if (deleteBtn) deleteBtn.disabled = checked === 0;
    }

    checkboxes.forEach(cb => {
      cb.addEventListener('change', function() {
        this.closest('.class-item').classList.toggle('checked', this.checked);
        updateCount();
      });
    });

    function selectAll() {
      checkboxes.forEach(cb => { cb.checked = true; cb.closest('.class-item').classList.add('checked'); });
      updateCount();
    }

    function invertSelection() {
      checkboxes.forEach(cb => { cb.checked = !cb.checked; cb.closest('.class-item').classList.toggle('checked', cb.checked); });
      updateCount();
    }

    function deleteSelected() {
      const checked = document.querySelectorAll('.class-checkbox:checked');
      if (checked.length === 0) return;

      const items = Array.from(checked).map(cb => ({
        file: cb.getAttribute('data-file'),
        line: parseInt(cb.getAttribute('data-line')),
        className: cb.getAttribute('data-name'),
        context: cb.getAttribute('data-context')
      }));

      vscode.postMessage({ type: 'deleteMultiple', items });
    }

    // 绑定按钮事件（CSP nonce 策略不允许内联 onclick）
    document.getElementById('selectAllBtn')?.addEventListener('click', selectAll);
    document.getElementById('invertBtn')?.addEventListener('click', invertSelection);
    document.getElementById('deleteBtn')?.addEventListener('click', deleteSelected);
  </script>
</body>
</html>`;
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
