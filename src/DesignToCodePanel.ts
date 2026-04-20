import * as vscode from 'vscode';

/**
 * 设计转代码 - 结果展示 Webview Panel
 */
export class DesignToCodePanel {
	public static currentPanel: DesignToCodePanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];
	private _generatedCode: string;

	private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri, generatedCode: string, language: string) {
		this._panel = panel;
		this._generatedCode = generatedCode;
		this._panel.webview.html = this._getHtmlForWebview(generatedCode, language);

		this._panel.webview.onDidReceiveMessage(
			(message: any) => {
				switch (message.type) {
					case 'copy':
						vscode.env.clipboard.writeText(this._generatedCode);
						vscode.window.showInformationMessage('代码已复制到剪贴板');
						break;
					case 'insert':
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							editor.edit(editBuilder => {
								editBuilder.insert(editor.selection.active, this._generatedCode);
							});
							vscode.window.showInformationMessage('代码已插入到编辑器');
						} else {
							vscode.window.showWarningMessage('没有激活的编辑器');
						}
						break;
					case 'openNew':
						vscode.workspace.openTextDocument({
							content: this._generatedCode,
							language: language
						}).then(doc => {
							vscode.window.showTextDocument(doc);
						});
						break;
				}
			},
			null,
			this._disposables
		);

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public static createOrShow(extensionUri: vscode.Uri, generatedCode: string, language: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (DesignToCodePanel.currentPanel) {
			DesignToCodePanel.currentPanel._generatedCode = generatedCode;
			DesignToCodePanel.currentPanel._panel.webview.html =
				DesignToCodePanel.currentPanel._getHtmlForWebview(generatedCode, language);
			DesignToCodePanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'designToCode',
			'设计转代码结果',
			column || vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		DesignToCodePanel.currentPanel = new DesignToCodePanel(panel, extensionUri, generatedCode, language);
	}

	private dispose() {
		DesignToCodePanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) { x.dispose(); }
		}
	}

	private _getHtmlForWebview(code: string, language: string): string {
		const nonce = getNonce();
		const escapedCode = escapeHtml(code);
		const langLabel = { html: 'HTML', vue: 'Vue', react: 'React JSX', vue3: 'Vue 3', tailwind: 'Tailwind CSS' }[language] || language;

		return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>设计转代码 - ${langLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .header h1 {
      font-size: 16px;
      font-weight: 600;
    }
    .header .lang-tag {
      font-size: 12px;
      padding: 2px 10px;
      border-radius: 10px;
      background: rgba(255, 105, 0, 0.1);
      color: #FF6900;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }
    .btn {
      padding: 6px 16px;
      border-radius: 4px;
      border: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
      background: var(--vscode-button-secondaryBackground, rgba(255,255,255,0.1));
      color: var(--vscode-button-secondaryForeground);
      cursor: pointer;
      font-size: 13px;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, rgba(255,255,255,0.15));
    }
    .btn-primary {
      background: #FF6900;
      border-color: #FF6900;
      color: #fff;
    }
    .btn-primary:hover {
      background: #e55d00;
    }
    .code-container {
      background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05));
      border-radius: 6px;
      padding: 16px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 70vh;
      overflow-y: auto;
    }
    .code-container::-webkit-scrollbar { width: 6px; }
    .code-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
    .code-container::-webkit-scrollbar-track { background: transparent; }
  </style>
</head>
<body>
  <div class="header">
    <h1>设计转代码结果</h1>
    <span class="lang-tag">${langLabel}</span>
  </div>

  <div class="actions">
    <button class="btn btn-primary" id="copyBtn">复制代码</button>
    <button class="btn" id="insertBtn">插入到编辑器</button>
    <button class="btn" id="openNewBtn">在新窗口打开</button>
  </div>

  <div class="code-container">${escapedCode}</div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    document.getElementById('copyBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'copy' });
    });
    document.getElementById('insertBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'insert' });
    });
    document.getElementById('openNewBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'openNew' });
    });
  </script>
</body>
</html>`;
	}
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
