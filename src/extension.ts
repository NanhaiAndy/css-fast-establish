import * as vscode from 'vscode';

import examinecss from './examinecss';
import { ToolboxSidebarProvider } from './ToolboxSidebarProvider';
import { SnippetManager } from './SnippetManager';
import { registerChineseSnippetTrigger } from './ChineseSnippetTrigger';
import { wrapWithTag } from './WrapWithTag';
import { registerCssCompatHover } from './CssCompatHover';
import { extractCssVariable } from './CssVariableExtractor';
import { LayoutVisualizerPanel } from './LayoutVisualizerPanel';
import { detectDeadCode } from './DeadCodeDetector';
import { registerGitBlameHover } from './GitBlameHover';
import { startStaticServer, stopServer } from './QuickServer';
import { registerNpmVersionHover } from './NpmVersionHover';
import { TodoBoardPanel } from './TodoBoardPanel';
import { initClipboardHistory, showClipboardHistory, clearClipboardHistory } from './ClipboardHistory';
import { EnvManagerPanel } from './EnvManagerPanel';

import { register as registerCss } from './controllers/cssController';
import { register as registerNavigation } from './controllers/navigationController';
import { register as registerToolbox } from './controllers/toolboxController';
import { register as registerTranslation } from './controllers/translationController';
import { register as registerAi } from './controllers/aiController';
import { register as registerAnalysis } from './controllers/analysisController';

export async function activate(context: vscode.ExtensionContext) {
  // 注册工具箱侧边栏视图
  const wifiName = await examinecss.getWifiName();
  let isCompanyNetwork = false;
  if (wifiName && (wifiName.includes('ZBJ') || wifiName.includes('ZBJ-6F'))) {
    isCompanyNetwork = true;
  }
  const toolboxSidebarProvider = new ToolboxSidebarProvider(context, isCompanyNetwork);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(ToolboxSidebarProvider.viewType, toolboxSidebarProvider));

  const snippetManager = new SnippetManager(context);

  const deps = { context, snippetManager, isCompanyNetwork };

  registerCss(deps);
  registerNavigation(deps);
  registerToolbox(deps);
  registerTranslation(deps);
  registerAi(deps);
  registerAnalysis(deps);

  // 注册中文代码片段触发器
  context.subscriptions.push(...registerChineseSnippetTrigger());

  // ========== 新功能注册 ==========

  // 快速包裹标签
  context.subscriptions.push(vscode.commands.registerCommand('extension.wrapWithTag', wrapWithTag));

  // CSS 兼容性 hover
  registerCssCompatHover(context);

  // CSS 变量提取
  context.subscriptions.push(vscode.commands.registerCommand('extension.extractCssVariable', extractCssVariable));

  // Flexbox/Grid 布局可视化
  context.subscriptions.push(vscode.commands.registerCommand('extension.layoutVisualizer', () => {
    LayoutVisualizerPanel.createOrShow(context.extensionUri);
  }));

  // 死代码检测
  context.subscriptions.push(vscode.commands.registerCommand('extension.detectDeadCode', detectDeadCode));

  // Git blame hover
  registerGitBlameHover(context);

  // 快捷静态服务器
  context.subscriptions.push(vscode.commands.registerCommand('extension.startStaticServer', startStaticServer));
  context.subscriptions.push(vscode.commands.registerCommand('extension.stopStaticServer', stopServer));

  // npm 版本 hover
  registerNpmVersionHover(context);

  // TODO 看板
  context.subscriptions.push(vscode.commands.registerCommand('extension.todoBoard', () => {
    const rootPath = vscode.workspace.rootPath || (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
    if (!rootPath) {
      vscode.window.showErrorMessage('请先打开一个工作区');
      return;
    }
    TodoBoardPanel.createOrShow(context.extensionUri, rootPath);
  }));

  // 剪贴板历史
  initClipboardHistory(context);
  context.subscriptions.push(vscode.commands.registerCommand('extension.clipboardHistory', showClipboardHistory));
  context.subscriptions.push(vscode.commands.registerCommand('extension.clearClipboardHistory', clearClipboardHistory));

  // 环境变量管理
  context.subscriptions.push(vscode.commands.registerCommand('extension.envManager', () => {
    const rootPath = vscode.workspace.rootPath || (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
    if (!rootPath) {
      vscode.window.showErrorMessage('请先打开一个工作区');
      return;
    }
    EnvManagerPanel.createOrShow(context.extensionUri, rootPath);
  }));
}

export function deactivate() {
  stopServer();
}
