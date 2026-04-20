import * as vscode from 'vscode';

import { activateA11yChecker } from '../A11yChecker';
import { JsonPathPanel } from '../JsonPathPanel';
import * as imageAnalyzer from '../ImageAnalyzer';
import { ImageAnalysisPanel } from '../ImageAnalysisPanel';
import * as cssRedundancyDetector from '../CssRedundancyDetector';
import { CssRedundancyReportPanel } from '../CssRedundancyReportPanel';
import { ControllerDeps } from './types';

export function register(deps: ControllerDeps): void {
  const { context } = deps;

  // 12. HTML 无障碍（a11y）检查
  activateA11yChecker(context);

  // 13. JSON Path 查询器
  const jsonPathQueryCmd = vscode.commands.registerCommand('extension.jsonPathQuery', () => {
    JsonPathPanel.createOrShow(context.extensionUri);
  });
  context.subscriptions.push(jsonPathQueryCmd);

  // 16. 图片资源分析
  const analyzeImagesCmd = vscode.commands.registerCommand('extension.analyzeImages', async () => {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: '正在分析图片资源...',
      cancellable: true
    }, async (progress, token) => {
      const result = await imageAnalyzer.analyze(progress, token);
      if (result) {
        ImageAnalysisPanel.createOrShow(context.extensionUri, result);
      }
    });
  });
  context.subscriptions.push(analyzeImagesCmd);

  // 17. CSS 冗余检测
  const detectCssRedundancyCmd = vscode.commands.registerCommand('extension.detectCssRedundancy', async () => {
    const scope = await vscode.window.showQuickPick([
      { label: '当前文件', value: 'file' as const },
      { label: '整个工作区', value: 'workspace' as const }
    ], { placeHolder: '选择扫描范围' });
    if (!scope) return;

    if (scope.value === 'file') {
      const result = await cssRedundancyDetector.detect('file');
      if (result) {
        CssRedundancyReportPanel.createOrShow(context.extensionUri, result, 'file');
      }
    } else {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '正在检测CSS冗余...',
        cancellable: true
      }, async (progress, token) => {
        const result = await cssRedundancyDetector.detect('workspace', progress, token);
        if (result) {
          CssRedundancyReportPanel.createOrShow(context.extensionUri, result, 'workspace');
        }
      });
    }
  });
  context.subscriptions.push(detectCssRedundancyCmd);
}
