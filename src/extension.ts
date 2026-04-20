import * as vscode from 'vscode';

import examinecss from './examinecss';
import { ToolboxSidebarProvider } from './ToolboxSidebarProvider';
import { SnippetManager } from './SnippetManager';
import { registerChineseSnippetTrigger } from './ChineseSnippetTrigger';

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
}

export function deactivate() {}
