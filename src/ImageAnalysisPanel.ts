import * as vscode from 'vscode';
import { formatSize } from './ImageAnalyzer';

interface AnalysisData {
  unusedImages: Array<{ relativePath: string; size: number; sizeFormatted: string }>;
  duplicateImages: Array<{ hash: string; files: string[]; size: number; sizeFormatted: string }>;
  largeImages: Array<{ relativePath: string; size: number; sizeFormatted: string }>;
  totalImages: number;
  scanTime: number;
}

export class ImageAnalysisPanel {
  public static currentPanel: ImageAnalysisPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _data: AnalysisData | undefined;

  private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri, data: AnalysisData) {
    this._panel = panel;
    this._data = data;
    this._panel.webview.html = this._getHtmlForWebview(data);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'openFile':
            // 暂不实现文件打开，可后续扩展
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(extensionUri: vscode.Uri, data: AnalysisData) {
    if (ImageAnalysisPanel.currentPanel) {
      ImageAnalysisPanel.currentPanel._panel.reveal(undefined, true);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'imageAnalysis',
      '图片资源分析',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true }
    );

    ImageAnalysisPanel.currentPanel = new ImageAnalysisPanel(panel, extensionUri, data);
  }

  private dispose() {
    ImageAnalysisPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) x.dispose();
    }
  }

  private _getHtmlForWebview(data: AnalysisData): string {
    const nonce = getNonce();

    const totalIssues = data.unusedImages.length + data.duplicateImages.length + data.largeImages.length;

    const unusedHtml = data.unusedImages.length > 0
      ? data.unusedImages.map(img => {
        const suggestion = getFormatSuggestion(img.relativePath, img.size);
        return `<div class="report-item">
          <div class="item-info">
            <div class="item-path">${escapeHtml(img.relativePath)}</div>
            ${suggestion ? `<div class="item-suggestion">${suggestion}</div>` : ''}
          </div>
          <div class="item-meta">${img.sizeFormatted}</div>
        </div>`;
      }).join('')
      : '<div class="empty-msg">未发现未使用的图片</div>';

    const duplicateHtml = data.duplicateImages.length > 0
      ? data.duplicateImages.map(group =>
        `<div class="report-group">
          <div class="group-header">重复文件组 (${group.files.length} 个, ${group.sizeFormatted})</div>
          ${group.files.map(f => `<div class="report-item"><div class="item-path">${escapeHtml(f)}</div></div>`).join('')}
        </div>`
      ).join('')
      : '<div class="empty-msg">未发现重复图片</div>';

    const largeHtml = data.largeImages.length > 0
      ? data.largeImages.map(img => {
        const suggestion = getFormatSuggestion(img.relativePath, img.size);
        return `<div class="report-item">
          <div class="item-info">
            <div class="item-path">${escapeHtml(img.relativePath)}</div>
            ${suggestion ? `<div class="item-suggestion">${suggestion}</div>` : ''}
            <div class="item-tools">压缩工具: tinypng.com / squoosh.app</div>
          </div>
          <div class="item-meta size-warn">${img.sizeFormatted}</div>
        </div>`;
      }).join('')
      : '<div class="empty-msg">未发现超大图片</div>';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>图片资源分析</title>
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
    .section { margin-bottom: 24px; }
    .section-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
    }
    .section-header .badge {
      background: rgba(255,105,0,0.15); color: #FF6900; padding: 2px 8px;
      border-radius: 10px; font-size: 12px; font-weight: 500;
    }
    .report-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 12px; border-radius: 4px; margin-bottom: 4px;
      background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.03));
    }
    .item-path {
      font-family: 'Consolas', monospace; font-size: 13px; word-break: break-all;
    }
    .item-meta { font-size: 12px; color: var(--vscode-descriptionForeground); white-space: nowrap; margin-left: 12px; }
    .size-warn { color: #f44747; font-weight: 500; }
    .empty-msg { color: var(--vscode-descriptionForeground); font-size: 13px; padding: 8px 0; }
    .report-group { margin-bottom: 12px; }
    .group-header { font-size: 13px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; padding-left: 8px; }
    .scan-time { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 8px; }
    .item-info { flex: 1; min-width: 0; }
    .item-suggestion { font-size: 11px; color: #4ec9b0; margin-top: 2px; }
    .item-tools { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
  </style>
</head>
<body>
  <h1>图片资源分析报告</h1>
  <div class="summary">
    <div class="summary-card">
      <div class="num">${data.totalImages}</div>
      <div class="label">图片总数</div>
    </div>
    <div class="summary-card">
      <div class="num" style="color: ${data.unusedImages.length > 0 ? '#f44747' : '#4ec9b0'}">${data.unusedImages.length}</div>
      <div class="label">未使用</div>
    </div>
    <div class="summary-card">
      <div class="num" style="color: ${data.duplicateImages.length > 0 ? '#f44747' : '#4ec9b0'}">${data.duplicateImages.length}</div>
      <div class="label">重复组</div>
    </div>
    <div class="summary-card">
      <div class="num" style="color: ${data.largeImages.length > 0 ? '#f44747' : '#4ec9b0'}">${data.largeImages.length}</div>
      <div class="label">超大图片</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">未使用的图片 <span class="badge">${data.unusedImages.length}</span></div>
    ${unusedHtml}
  </div>

  <div class="section">
    <div class="section-header">重复图片 <span class="badge">${data.duplicateImages.length}</span></div>
    ${duplicateHtml}
  </div>

  <div class="section">
    <div class="section-header">超大图片 <span class="badge">${data.largeImages.length}</span></div>
    ${largeHtml}
  </div>

  <div class="scan-time">扫描完成，耗时 ${(data.scanTime / 1000).toFixed(1)}s</div>
</body>
</html>`;
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getFormatSuggestion(relativePath: string, size: number): string {
  const ext = relativePath.split('.').pop()?.toLowerCase() || '';
  const formatSizeEstimate = (bytes: number, ratio: number) => {
    const estimated = bytes * ratio;
    if (estimated < 1024) return estimated.toFixed(0) + 'B';
    if (estimated < 1024 * 1024) return (estimated / 1024).toFixed(1) + 'KB';
    return (estimated / (1024 * 1024)).toFixed(1) + 'MB';
  };

  switch (ext) {
    case 'png':
      return `建议转为 WebP（预估节省 ~30%，约 ${formatSizeEstimate(size, 0.7)}）`;
    case 'jpg':
    case 'jpeg':
      return `建议转为 WebP（预估节省 ~25%，约 ${formatSizeEstimate(size, 0.75)}）`;
    case 'gif':
      return `建议转为 WebP/AVIF 动图（体积更小）`;
    case 'bmp':
      return `建议转为 PNG/WebP（BMP 无压缩，体积过大）`;
    case 'webp':
      return '';
    case 'svg':
      return '';
    case 'ico':
      return `建议使用 SVG + favicon 替代`;
    default:
      return '';
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
