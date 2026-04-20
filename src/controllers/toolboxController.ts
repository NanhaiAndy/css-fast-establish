import * as vscode from 'vscode';

import selection from '../selection';
import * as toolbox from '../toolbox';
import { RegexPanel } from '../RegexPanel';
import { ControllerDeps } from './types';

export function register(deps: ControllerDeps): void {
  const { context, snippetManager } = deps;

  // 1. JSON → TypeScript 类型生成
  const jsonToTsCmd = vscode.commands.registerCommand('extension.jsonToTs', async () => {
    let text = selection.getText();
    if (!text) {
      // 尝试从剪贴板读取
      try {
        const clipboardText = await vscode.env.clipboard.readText();
        if (clipboardText && clipboardText.trim().startsWith('{')) {
          const pick = await vscode.window.showQuickPick([
            { label: '从剪贴板获取 JSON', value: 'clipboard', detail: clipboardText.substring(0, 80) + (clipboardText.length > 80 ? '...' : '') },
            { label: '手动输入 JSON', value: 'input' }
          ], { placeHolder: '选择 JSON 数据来源' });
          if (!pick) return;
          if (pick.value === 'clipboard') {
            text = clipboardText;
          } else {
            const input = await vscode.window.showInputBox({
              placeHolder: '请粘贴 JSON 数据',
              prompt: '输入 JSON 数据以生成 TypeScript 类型定义'
            });
            if (!input) return;
            text = input;
          }
        } else {
          const input = await vscode.window.showInputBox({
            placeHolder: '请粘贴 JSON 数据',
            prompt: '输入 JSON 数据以生成 TypeScript 类型定义'
          });
          if (!input) return;
          text = input;
        }
      } catch {
        const input = await vscode.window.showInputBox({
          placeHolder: '请粘贴 JSON 数据',
          prompt: '输入 JSON 数据以生成 TypeScript 类型定义'
        });
        if (!input) return;
        text = input;
      }
    }

    // 选择生成模式
    const modePick = await vscode.window.showQuickPick([
      { label: 'TypeScript 类型', value: 'ts', description: '仅生成 interface 定义' },
      { label: 'TypeScript + Zod Schema', value: 'zod', description: '生成 interface + Zod 校验 schema' },
    ], { placeHolder: '选择生成模式' });
    if (!modePick) return;

    try {
      JSON.parse(text);
    } catch {
      vscode.window.showErrorMessage('请输入有效的 JSON 数据');
      return;
    }

    const rootName = await vscode.window.showInputBox({
      placeHolder: 'Root',
      prompt: '根类型名称（默认: Root）'
    }) || 'Root';

    const tsResult = modePick.value === 'zod'
      ? toolbox.generateZodSchema(text, rootName)
      : toolbox.jsonToTypeScript(text, rootName);

    const doc = await vscode.workspace.openTextDocument({
      content: tsResult,
      language: 'typescript'
    });
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(modePick.value === 'zod' ? 'TypeScript + Zod Schema 生成完毕！' : 'TypeScript 类型生成完毕！');
  });
  context.subscriptions.push(jsonToTsCmd);

  // 2. CSS 单位批量转换
  const cssUnitConvertCmd = vscode.commands.registerCommand('extension.cssUnitConvert', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selectedText = selection.getText();
    if (!selectedText) {
      vscode.window.showErrorMessage('请先选中需要转换的 CSS 代码');
      return;
    }

    const directionItems = [
      { label: 'px → rem', description: '将 px 转换为 rem', value: 'px2rem' as const },
      { label: 'px → vw', description: '将 px 转换为 vw', value: 'px2vw' as const },
      { label: 'rem → px', description: '将 rem 转换为 px', value: 'rem2px' as const },
      { label: 'vw → px', description: '将 vw 转换为 px', value: 'vw2px' as const }
    ];

    const chosen = await vscode.window.showQuickPick(directionItems, {
      placeHolder: '选择转换方向'
    });
    if (!chosen) return;

    const userConfig = vscode.workspace.getConfiguration().get('generateCssTree') as any;
    const remBase = userConfig.remBase || 16;
    const vwDesignWidth = userConfig.vwDesignWidth || 375;

    const result = toolbox.convertCssUnits(selectedText, chosen.value, remBase, vwDesignWidth);

    await editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, result);
    });
    vscode.window.showInformationMessage(`CSS 单位转换完成 (${chosen.label})！`);
  });
  context.subscriptions.push(cssUnitConvertCmd);

  // 3. 颜色格式转换
  const colorConvertCmd = vscode.commands.registerCommand('extension.colorConvert', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selectedText = selection.getText();
    if (!selectedText) {
      vscode.window.showErrorMessage('请先选中一个颜色值');
      return;
    }

    const currentFormat = toolbox.detectColorFormat(selectedText);
    if (!currentFormat) {
      vscode.window.showErrorMessage('无法识别的颜色格式，支持: HEX、RGB、RGBA、HSL、HSLA');
      return;
    }

    const color = toolbox.parseColor(selectedText);
    if (!color) {
      vscode.window.showErrorMessage('颜色解析失败');
      return;
    }

    const formatItems = [
      { label: 'HEX', value: 'hex' },
      { label: 'RGB', value: 'rgb' },
      { label: 'RGBA', value: 'rgba' },
      { label: 'HSL', value: 'hsl' },
      { label: 'HSLA', value: 'hsla' }
    ].filter(f => !currentFormat.startsWith(f.value));

    const chosen = await vscode.window.showQuickPick(formatItems, {
      placeHolder: `当前格式: ${currentFormat}，选择目标格式`
    });
    if (!chosen) return;

    const result = toolbox.colorToFormat(color, chosen.value);
    await editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, result);
    });
    vscode.window.showInformationMessage(`颜色转换完成: ${result}`);
  });
  context.subscriptions.push(colorConvertCmd);

  // 4. 时间戳 ↔ 日期转换
  const timestampConvertCmd = vscode.commands.registerCommand('extension.timestampConvert', async () => {
    let text = selection.getText();

    if (!text) {
      const input = await vscode.window.showInputBox({
        placeHolder: '输入时间戳或日期字符串',
        prompt: '支持 10/13 位时间戳或日期格式如 2024-01-01 12:00:00'
      });
      if (!input) return;
      text = input;
    }

    text = text.trim();

    if (toolbox.isTimestamp(text)) {
      const result = toolbox.timestampToDate(text);
      vscode.window.showInformationMessage(`时间戳 → 日期: ${result}`);
      await vscode.env.clipboard.writeText(result);
      vscode.window.showInformationMessage('结果已复制到剪贴板');
    } else {
      // 尝试作为日期解析
      const result = toolbox.dateToTimestamp(text);
      if (result.seconds === '无效日期') {
        vscode.window.showErrorMessage('无法识别的格式，请输入时间戳或日期字符串');
        return;
      }
      const output = `秒: ${result.seconds}  毫秒: ${result.milliseconds}`;
      vscode.window.showInformationMessage(`日期 → 时间戳: ${output}`);
      await vscode.env.clipboard.writeText(result.milliseconds);
    }
  });
  context.subscriptions.push(timestampConvertCmd);

  // 5. 编码/解码转换
  const encodeDecodeCmd = vscode.commands.registerCommand('extension.encodeDecode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selectedText = selection.getText();
    if (!selectedText) {
      vscode.window.showErrorMessage('请先选中需要编解码的文本');
      return;
    }

    const operations = [
      { label: 'URL 编码', description: 'encodeURIComponent', fn: toolbox.urlEncode },
      { label: 'URL 解码', description: 'decodeURIComponent', fn: toolbox.urlDecode },
      { label: 'Base64 编码', description: '文本 → Base64', fn: toolbox.base64Encode },
      { label: 'Base64 解码', description: 'Base64 → 文本', fn: toolbox.base64Decode },
      { label: 'HTML 实体编码', description: '< > & " → 实体', fn: toolbox.htmlEntityEncode },
      { label: 'HTML 实体解码', description: '实体 → 字符', fn: toolbox.htmlEntityDecode }
    ];

    const chosen = await vscode.window.showQuickPick(operations, {
      placeHolder: '选择编解码操作'
    });
    if (!chosen) return;

    const result = chosen.fn(selectedText);
    await editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, result);
    });
    vscode.window.showInformationMessage(`${chosen.label}完成！`);
  });
  context.subscriptions.push(encodeDecodeCmd);

  // 6. SVG 优化压缩
  const optimizeSvgCmd = vscode.commands.registerCommand('extension.optimizeSvg', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selectedText = selection.getText();
    if (!selectedText || !selectedText.includes('<svg')) {
      vscode.window.showErrorMessage('请先选中 SVG 代码');
      return;
    }

    const result = toolbox.optimizeSvg(selectedText);
    await editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, result);
    });
    vscode.window.showInformationMessage('SVG 优化完成！');
  });
  context.subscriptions.push(optimizeSvgCmd);

  // 7. 正则表达式测试
  const regexTesterCmd = vscode.commands.registerCommand('extension.regexTester', () => {
    RegexPanel.createOrShow(context.extensionUri);
  });
  context.subscriptions.push(regexTesterCmd);

  // 8. 保存代码片段
  const saveSnippetCmd = vscode.commands.registerCommand('extension.saveSnippet', async () => {
    await snippetManager.saveSnippet();
  });
  context.subscriptions.push(saveSnippetCmd);

  // 8. 管理代码片段
  const manageSnippetsCmd = vscode.commands.registerCommand('extension.openSnippetManager', async () => {
    await snippetManager.manageSnippets();
  });
  context.subscriptions.push(manageSnippetsCmd);

  // 8b. 导出代码片段
  const exportSnippetsCmd = vscode.commands.registerCommand('extension.exportSnippets', async () => {
    await snippetManager.exportSnippets();
  });
  context.subscriptions.push(exportSnippetsCmd);

  // 8c. 导入代码片段
  const importSnippetsCmd = vscode.commands.registerCommand('extension.importSnippets', async () => {
    await snippetManager.importSnippets();
  });
  context.subscriptions.push(importSnippetsCmd);

  // 9. 插入占位图片
  const placeholderImageCmd = vscode.commands.registerCommand('extension.placeholderImage', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const sizeItems = [
      { label: '200×200', description: '正方形小图', w: 200, h: 200 },
      { label: '300×200', description: '横幅', w: 300, h: 200 },
      { label: '400×300', description: '中等尺寸', w: 400, h: 300 },
      { label: '800×600', description: '大图', w: 800, h: 600 },
      { label: '1024×768', description: '超大图', w: 1024, h: 768 },
      { label: '自定义尺寸', description: '输入自定义宽高', w: 0, h: 0 }
    ];

    const chosen = await vscode.window.showQuickPick(sizeItems, {
      placeHolder: '选择占位图尺寸'
    });
    if (!chosen) return;

    let width = chosen.w;
    let height = chosen.h;

    if (width === 0) {
      const customSize = await vscode.window.showInputBox({
        placeHolder: '输入尺寸，格式: 宽x高，如 300x200'
      });
      if (!customSize) return;
      const parts = customSize.toLowerCase().split('x');
      if (parts.length !== 2) {
        vscode.window.showErrorMessage('格式错误，请使用 宽x高 格式');
        return;
      }
      width = parseInt(parts[0]);
      height = parseInt(parts[1]);
      if (isNaN(width) || isNaN(height)) {
        vscode.window.showErrorMessage('请输入有效数字');
        return;
      }
    }

    const tag = toolbox.generatePlaceholderTag(width, height);
    await editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, tag);
    });
    vscode.window.showInformationMessage(`占位图 ${width}×${height} 已插入`);
  });
  context.subscriptions.push(placeholderImageCmd);

  // 10. 插入 console.log
  const insertConsoleLogCmd = vscode.commands.registerCommand('extension.insertConsoleLog', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const position = editor.selection.active;
    const range = editor.document.getWordRangeAtPosition(position);
    if (!range) {
      vscode.window.showErrorMessage('请将光标放在变量名上');
      return;
    }

    const word = editor.document.getText(range);
    const logStatement = toolbox.generateConsoleLog(word);

    // 在当前行下方插入
    const line = editor.document.lineAt(position.line);
    const indent = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);
    const insertPosition = new vscode.Position(position.line + 1, 0);

    await editor.edit(editBuilder => {
      editBuilder.insert(insertPosition, indent + logStatement + '\n');
    });
  });
  context.subscriptions.push(insertConsoleLogCmd);

  // 10. 移除所有 console.log
  const removeAllConsoleLogsCmd = vscode.commands.registerCommand('extension.removeAllConsoleLogs', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const documentText = editor.document.getText();
    const { result, count } = toolbox.removeAllConsoleLogs(documentText);

    if (count === 0) {
      vscode.window.showInformationMessage('当前文件没有 console.log/warn/error');
      return;
    }

    await editor.edit(editBuilder => {
      const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(documentText.length)
      );
      editBuilder.replace(fullRange, result);
    });
    vscode.window.showInformationMessage(`已移除 ${count} 个 console 语句`);
  });
  context.subscriptions.push(removeAllConsoleLogsCmd);

  // 10b. 注释所有 console
  const commentAllConsoleLogsCmd = vscode.commands.registerCommand('extension.commentAllConsoleLogs', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const documentText = editor.document.getText();
    const { result, count } = toolbox.commentAllConsoleLogs(documentText);

    if (count === 0) {
      vscode.window.showInformationMessage('当前文件没有 console 语句需要注释');
      return;
    }

    await editor.edit(editBuilder => {
      const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(documentText.length)
      );
      editBuilder.replace(fullRange, result);
    });
    vscode.window.showInformationMessage(`已注释 ${count} 个 console 语句`);
  });
  context.subscriptions.push(commentAllConsoleLogsCmd);

  // 10c. 高亮所有 console
  const highlightConsoleLogsCmd = vscode.commands.registerCommand('extension.highlightConsoleLogs', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const consoleLogs = toolbox.findAllConsoleLogs(editor.document.getText());

    if (consoleLogs.length === 0) {
      vscode.window.showInformationMessage('当前文件没有 console 语句');
      return;
    }

    // 创建装饰器类型
    const decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 105, 0, 0.15)',
      borderColor: 'rgba(255, 105, 0, 0.6)',
      borderWidth: '1px',
      borderStyle: 'solid',
      overviewRulerColor: 'rgba(255, 105, 0, 0.8)',
      overviewRulerLane: vscode.OverviewRulerLane.Full,
    });

    const ranges = consoleLogs.map(log =>
      editor.document.lineAt(log.line).range
    );

    editor.setDecorations(decorationType, ranges);

    // 3秒后自动清除
    setTimeout(() => {
      decorationType.dispose();
    }, 3000);

    vscode.window.showInformationMessage(`已高亮 ${consoleLogs.length} 个 console 语句（3秒后自动消失）`);
  });
  context.subscriptions.push(highlightConsoleLogsCmd);

  // 10d. 切换 console 注释状态
  const toggleConsoleLogsCmd = vscode.commands.registerCommand('extension.toggleConsoleLogs', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const documentText = editor.document.getText();
    const { result, count } = toolbox.toggleConsoleLogs(documentText);

    if (count === 0) {
      vscode.window.showInformationMessage('当前文件没有 console 语句');
      return;
    }

    await editor.edit(editBuilder => {
      const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(documentText.length)
      );
      editBuilder.replace(fullRange, result);
    });
    vscode.window.showInformationMessage(`已切换 ${count} 个 console 语句的注释状态`);
  });
  context.subscriptions.push(toggleConsoleLogsCmd);
}
