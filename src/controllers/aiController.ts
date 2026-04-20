import * as vscode from 'vscode';

import selection from '../selection';
import designToCode from '../designToCode';
import apiCodeGenerator from '../ApiCodeGenerator';
import codeDiffAnalyzer from '../CodeDiffAnalyzer';
import { extractDesignTokens, formatDesignTokens } from '../FigmaTokenExtractor';
import { ControllerDeps } from './types';

export function register(deps: ControllerDeps): void {
  const { context } = deps;

  // ==================== AI设计转代码（流式输出） ====================

  // 流式写入编辑器的通用方法
  const streamToEditor = async function (
    messages: Array<any>,
    outputFormat: string,
    statusMessage: string
  ): Promise<void> {
    const userConfig = vscode.workspace.getConfiguration().get('generateCssTree') as any;
    const autoFix = userConfig.designAutoFix !== false;

    // 根据格式创建文件并打开
    const language = designToCode.getOutputLanguage(outputFormat);
    const doc = await vscode.workspace.openTextDocument({ content: '', language: language });
    const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);

    vscode.window.setStatusBarMessage(statusMessage, 30000);

    try {
      // 流式写入缓冲
      let lastPos = new vscode.Position(0, 0);
      let pendingText = '';
      let flushTimer: NodeJS.Timeout | null = null;

      const flush = async () => {
        if (!pendingText) { return; }
        const textToInsert = pendingText;
        pendingText = '';
        flushTimer = null;

        try {
          await editor.edit(editBuilder => {
            editBuilder.insert(lastPos, textToInsert);
          });
          // 更新位置到文档末尾
          const lastLine = doc.lineCount - 1;
          lastPos = doc.lineAt(lastLine).range.end;
          // 滚动到底部
          editor.revealRange(new vscode.Range(lastPos, lastPos));
        } catch {
          // 编辑器可能暂时不可用，放回缓冲
          pendingText = textToInsert + pendingText;
        }
      };

      // 带缓冲的流式回调：积攒小块再批量写入
      const onChunk = (text: string) => {
        pendingText += text;
        if (text.includes('\n') || pendingText.length >= 8) {
          if (flushTimer) { clearTimeout(flushTimer); }
          flush();
        } else if (!flushTimer) {
          flushTimer = setTimeout(() => flush(), 60);
        }
      };

      // 执行流式调用
      const fullText = await designToCode.callAIStream(messages, onChunk);

      // 确保缓冲全部写入
      if (flushTimer) { clearTimeout(flushTimer); }
      await flush();

      // 清理 markdown 代码块标记
      const cleanedCode = designToCode.removeCodeBlockMarkers(fullText);
      if (cleanedCode !== fullText) {
        const fullRange = new vscode.Range(
          doc.lineAt(0).range.start,
          doc.lineAt(doc.lineCount - 1).range.end
        );
        await editor.edit(editBuilder => {
          editBuilder.replace(fullRange, cleanedCode);
        });
      }

      vscode.window.setStatusBarMessage('代码生成完成', 3000);

      // 自检修复
      if (autoFix) {
        const currentText = doc.getText();
        const issues = designToCode.checkCodeIssues(currentText, outputFormat);
        if (issues.length > 0) {
          vscode.window.setStatusBarMessage(`发现 ${issues.length} 个问题，正在自动修复...`, 30000);
          try {
            const fixedCode = await designToCode.callAIFix(currentText, issues, outputFormat);
            const cleanedFix = designToCode.removeCodeBlockMarkers(fixedCode);
            const fullRange = new vscode.Range(
              doc.lineAt(0).range.start,
              doc.lineAt(doc.lineCount - 1).range.end
            );
            await editor.edit(editBuilder => {
              editBuilder.replace(fullRange, cleanedFix);
            });
            vscode.window.setStatusBarMessage('代码已自动修复', 3000);
          } catch (fixError) {
            vscode.window.showWarningMessage(`自动修复失败: ${fixError}，请手动检查代码`);
          }
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`AI生成失败: ${error}`);
    }
  };

  // 11. Figma链接 → 前端代码（流式）
  const figmaToCodeCmd = vscode.commands.registerCommand('extension.figmaToCode', async () => {
    const figmaUrl = await vscode.window.showInputBox({
      placeHolder: '请输入Figma文件链接，例如: https://www.figma.com/file/xxx/Design?node-id=1-2',
      prompt: '从Figma中复制选中组件的链接粘贴到此处'
    });
    if (!figmaUrl) { return; }

    const userConfig = vscode.workspace.getConfiguration().get('generateCssTree') as any;
    const figmaToken = userConfig.figmaToken as string;
    const outputFormat = userConfig.designOutputFormat || 'html';

    if (!figmaToken) {
      vscode.window.showErrorMessage('请先在设置中配置Figma 个人访问令牌 Token (generateCssTree.figmaToken)');
      return;
    }

    const parsed = designToCode.parseFigmaUrl(figmaUrl);
    if (!parsed) {
      vscode.window.showErrorMessage('无法解析Figma链接，请确认链接格式正确（支持 /file/ 或 /design/ 路径格式）');
      return;
    }

    vscode.window.showInformationMessage('正在从Figma获取设计数据...');

    try {
      const nodeData = await designToCode.fetchFigmaNodeData(parsed.fileKey, parsed.nodeId, figmaToken);
      const prompt = designToCode.figmaDataToPrompt(nodeData);
      const messages = designToCode.buildFigmaMessages(prompt, outputFormat);

      await streamToEditor(messages, outputFormat, '正在通过AI将Figma设计转为代码...');
    } catch (error) {
      vscode.window.showErrorMessage(`Figma转代码失败: ${error}`);
    }
  });
  context.subscriptions.push(figmaToCodeCmd);

  // 11b. Figma 设计令牌提取
  const figmaExtractTokensCmd = vscode.commands.registerCommand('extension.figmaExtractTokens', async () => {
    const figmaUrl = await vscode.window.showInputBox({
      placeHolder: '请输入Figma文件链接',
      prompt: '从Figma中复制文件链接粘贴到此处，提取颜色/字体/圆角/间距等设计令牌'
    });
    if (!figmaUrl) return;

    const userConfig = vscode.workspace.getConfiguration().get('generateCssTree') as any;
    const figmaToken = userConfig.figmaToken as string;
    if (!figmaToken) {
      vscode.window.showErrorMessage('请先在设置中配置 Figma Token (generateCssTree.figmaToken)');
      return;
    }

    const parsed = designToCode.parseFigmaUrl(figmaUrl);
    if (!parsed) {
      vscode.window.showErrorMessage('无法解析 Figma 链接，请确认格式正确');
      return;
    }

    const formatPick = await vscode.window.showQuickPick([
      { label: 'CSS Variables', value: 'css' as const, description: ':root { --color-1: #xxx; }' },
      { label: 'SCSS Variables', value: 'scss' as const, description: '$color-1: #xxx;' },
      { label: 'Tailwind Config', value: 'tailwind' as const, description: 'module.exports = { theme: { ... } }' },
    ], { placeHolder: '选择输出格式' });
    if (!formatPick) return;

    try {
      vscode.window.showInformationMessage('正在从 Figma 获取设计数据...');
      const fileData = await designToCode.fetchFigmaFileData(parsed.fileKey, figmaToken);

      const tokens = extractDesignTokens(fileData);
      const totalTokens = tokens.colors.length + tokens.fonts.length + tokens.radii.length + tokens.spacings.length;

      if (totalTokens === 0) {
        vscode.window.showWarningMessage('未从该 Figma 文件中提取到设计令牌');
        return;
      }

      const output = formatDesignTokens(tokens, formatPick.value);

      const langMap: Record<string, string> = { css: 'css', scss: 'scss', tailwind: 'javascript' };
      const doc = await vscode.workspace.openTextDocument({
        content: output,
        language: langMap[formatPick.value]
      });
      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage(
        `设计令牌提取完成：${tokens.colors.length} 个颜色、${tokens.fonts.length} 个字体、${tokens.radii.length} 个圆角、${tokens.spacings.length} 个间距`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`令牌提取失败: ${error}`);
    }
  });
  context.subscriptions.push(figmaExtractTokensCmd);

  // 14. API 请求代码生成（AI）
  const generateApiCodeCmd = vscode.commands.registerCommand('extension.generateApiCode', async () => {
    let jsonText = selection.getText();

    if (!jsonText) {
      const input = await vscode.window.showInputBox({
        placeHolder: '请粘贴 API 响应 JSON 数据',
        prompt: '选中 JSON 数据或直接粘贴，自动生成 axios/fetch 请求代码 + TS 类型'
      });
      if (!input) return;
      jsonText = input;
    }

    try {
      JSON.parse(jsonText);
    } catch {
      vscode.window.showErrorMessage('请输入有效的 JSON 数据');
      return;
    }

    const library = await vscode.window.showQuickPick([
      { label: 'Axios', value: 'axios', description: '使用 axios 发送请求' },
      { label: 'Fetch', value: 'fetch', description: '使用原生 fetch API' }
    ], { placeHolder: '选择请求库' });
    if (!library) return;

    const apiUrl = await vscode.window.showInputBox({
      placeHolder: 'API 端点 URL（可选，如 /api/users）',
      prompt: '留空则自动推断'
    });

    const messages = apiCodeGenerator.buildApiCodeMessages({
      jsonResponse: jsonText,
      url: apiUrl || undefined,
      requestLibrary: library.value as 'axios' | 'fetch'
    });

    await streamToEditor(messages, 'typescript', '正在通过AI生成API请求代码...');
  });
  context.subscriptions.push(generateApiCodeCmd);

  // 15. 代码差异对比（AI）
  const compareCodeDiffCmd = vscode.commands.registerCommand('extension.compareCodeDiff', async () => {
    let codeA = selection.getText();

    if (!codeA) {
      const inputA = await vscode.window.showInputBox({
        placeHolder: '粘贴第一段代码（原代码）',
        prompt: '如果没有选中文本，请在此粘贴代码'
      });
      if (!inputA) return;
      codeA = inputA;
    }

    const source = await vscode.window.showQuickPick([
      { label: '从剪贴板获取', value: 'clipboard' },
      { label: '手动输入', value: 'input' }
    ], { placeHolder: '获取第二段代码的方式' });
    if (!source) return;

    let codeB = '';
    if (source.value === 'clipboard') {
      codeB = await vscode.env.clipboard.readText();
      if (!codeB.trim()) {
        vscode.window.showErrorMessage('剪贴板为空');
        return;
      }
    } else {
      const inputB = await vscode.window.showInputBox({
        placeHolder: '粘贴第二段代码（新代码）',
        prompt: '请粘贴要对比的代码'
      });
      if (!inputB) return;
      codeB = inputB;
    }

    const editor = vscode.window.activeTextEditor;
    const language = editor?.document.languageId || '';

    const contextDesc = await vscode.window.showInputBox({
      placeHolder: '补充上下文（可选，如 PR 标题）'
    });

    const messages = codeDiffAnalyzer.buildDiffMessages({
      codeA, codeB, language, context: contextDesc || undefined
    });

    await streamToEditor(messages, 'markdown', '正在通过AI分析代码差异...');
  });
  context.subscriptions.push(compareCodeDiffCmd);
}
