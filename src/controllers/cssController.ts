import * as vscode from 'vscode';
import documentTree from 'document-tree';

import selection from '../selection';
import generateCssTree from '../cssTree';
import examinecss from '../examinecss';
import { ControllerDeps } from './types';

interface InterfaceUserConfig {
  cssFlavor: string;
  interiorTest: string;
}

export function register(deps: ControllerDeps): void {
  const { context } = deps;

  // 新开窗口生成css结构
  const disposable = vscode.commands.registerCommand('extension.generateCssTree', async () => {
    const selectedText = selection.getText();
    if (!selectedText) {
      return;
    }

    const userConfig = vscode.workspace
      .getConfiguration()
      .get('generateCssTree') as InterfaceUserConfig;

    const isCss = userConfig.cssFlavor.toLowerCase() === 'css';

    const removeVIfElements = selection.removeVIfElements(selectedText);

    const tree = documentTree.generate(removeVIfElements);
    const cssTree = generateCssTree(tree, { isCss });

    // 如果没有找到<style>标签，保持原有逻辑
    const doc = await vscode.workspace.openTextDocument({
      content: cssTree,
      language: userConfig.cssFlavor
    });

    await vscode.window.showTextDocument(doc);

    // 生成完成提醒
    vscode.window.showInformationMessage('css结构生成完毕！');
  });

  context.subscriptions.push(disposable);

  // 当前页面生成css结构
  const disposableXk = vscode.commands.registerCommand('extension.generateCssTreeNewlyOpened', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selectedTextx = selection.getText();
    if (!selectedTextx) {
      return;
    }

    const userConfig = vscode.workspace
      .getConfiguration()
      .get('generateCssTree') as InterfaceUserConfig;

    const isCss = userConfig.cssFlavor.toLowerCase() === 'css';

    const removeVIfElements = selection.removeVIfElements(selectedTextx);

    const tree = documentTree.generate(removeVIfElements);
    const cssTree = generateCssTree(tree, { isCss });

    // 检查当前文件是否包含<style lang="less" scoped>
    const documentText = editor.document.getText();
    const styleTagRegex = /<style\s+lang=["']less["'](\s+scoped)?\s*>/i;
    let styleTagMatch = documentText.match(styleTagRegex);

    if (!styleTagMatch) {
      // 检查是否存在<style lang='less' scoped>
      const styleTagRegex2 = /<style\s+lang=["']less["'](\s+scoped)?\s*>/i;
      styleTagMatch = documentText.match(styleTagRegex2);
    }

    if (!styleTagMatch) {
      // 检查是否存在<style lang='less' scope type="text/less">
      const styleTagRegex3 = /<style\s+lang=["']less["'](\s+(?:scoped|scope))?\s+type=["']text\/less["']\s*>/i;
      styleTagMatch = documentText.match(styleTagRegex3);
    }

    if (styleTagMatch) {
      // 找到<style>标签的结束位置
      const styleEndIndex = documentText.indexOf('</style>', styleTagMatch.index!);
      if (styleEndIndex !== -1) {
        // 构造新的内容
        const newContent = documentText.substring(0, styleEndIndex) +
          '\n' + cssTree + '\n' +
          documentText.substring(styleEndIndex);

        // 替换整个文档内容
        await editor.edit(editBuilder => {
          const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(documentText.length)
          );
          editBuilder.replace(fullRange, newContent);
        });

        // 滚动到底部
        editor.revealRange(editor.document.lineAt(editor.document.lineCount - 1).range);

        // 生成完成提醒
        vscode.window.showInformationMessage('已在当前代码<style lang="less"下生成css结构！');
        return;
      }
    }

    // 如果没有找到<style>标签，保持原有逻辑
    const doc = await vscode.workspace.openTextDocument({
      content: cssTree,
      language: userConfig.cssFlavor
    });

    await vscode.window.showTextDocument(doc);

    // 生成完成提醒
    vscode.window.showInformationMessage('css结构生成完毕！');
  });

  context.subscriptions.push(disposableXk);

  // 选中的html结构生成class名称定义Ai识别
  const disposableClass = vscode.commands.registerCommand('extension.addClassDefinition', async () => {
    const userConfig = vscode.workspace
    .getConfiguration()
    .get('generateCssTree') as InterfaceUserConfig;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selectedTextx = selection.getText();
    if (!selectedTextx) {
      vscode.window.showErrorMessage('请先框选你需要生成class名称定义的html结构');
      return;
    }

    // 选择命名规范
    const conventionItems = [
      { label: '自定义（语义化英文）', value: 'custom', description: '由 AI 自由决定 class 命名' },
      { label: 'BEM 规范', value: 'bem', description: 'block__element--modifier' },
      { label: 'CSS Modules', value: 'cssModules', description: 'camelCase 风格' },
      { label: 'Tailwind 工具类', value: 'tailwind', description: '优先使用 Tailwind 工具类' },
    ];
    const namingConvention = (userConfig as any).namingConvention || 'custom';
    const chosen = await vscode.window.showQuickPick(conventionItems, {
      placeHolder: `选择命名规范（当前默认: ${namingConvention}）`
    });
    if (!chosen) return;

    const classNameHtml = await selection.aiClassDefinition(selectedTextx, chosen.value);

    // 如果有selectedTextx，就覆盖当前选中内容
    editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, classNameHtml);
      // 生成完成提醒
      vscode.window.showInformationMessage('class定义生成完毕！');
    });
  });

  context.subscriptions.push(disposableClass);

  // 监听鼠标移入class名称展示该class样式结构并可以跳转
  const hoverData = vscode.languages.registerHoverProvider(['html', 'vue'], {
    provideHover(document: vscode.TextDocument, position: vscode.Position) {
      const className = examinecss.getHoveredClassName(document, position);
      if (!className) return null;

      const cssContent = examinecss.findCssContentForClass(document, className);
      if (!cssContent) return null;

      return new vscode.Hover([
        '**该CSS的样式 `' + className + '`**',
        { language: 'css', value: cssContent }
      ]);
    }
  });

  context.subscriptions.push(hoverData);

  // 注册定义提供器（用于点击跳转）
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(['html', 'vue'], {
      provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
        const className = examinecss.getHoveredClassName(document, position);
        if (!className) return null;

        return examinecss.findDefinitionForClass(document, className);
      }
    })
  );

  // 注册值定义提供器（用于点击跳转到赋值位置）
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(['html', 'vue', 'javascript', 'typescript'], {
      async provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
        // 获取光标位置的文本范围
        const range = document.getWordRangeAtPosition(position);
        if (!range) return null;

        // 获取当前这行全部文本
        const lineText = document.lineAt(position.line).text;

        // lineText里面是否包含/components或者@/components
        if (lineText.includes('/components') || lineText.includes('@/components')) return null;
        // 获取当前单词（可能是变量名或属性值）
        const word = document.getText(range);
        // 判断这个word拿到的是一个不存在中文和数字的字符串
        if (/[\u4e00-\u9fa5]/.test(word)) return null;
        // 同时判断word里面字符串不包含前端这些标签比如div span 名称，避免消耗去找标签
        if (/^(<div>|<span>|<p>|<h1>|<h2>|<h3>|<h4>|<h5>|<h6>|<a>|<img>|<button>|<input>|<textarea>|<form>|<table>|<tr>|<td>|<th>|<ul>|<ol>|<li>|<dl>|<dt>|<dd>|<blockquote>|<pre>|<code>|<em>|<strong>)$/.test(word)) return null;

        // 尝试在整个工作空间搜索这个值的定义
        const locations = await examinecss.findValueDefinition(word, document);
        return locations.length > 0 ? locations : null;
      }
    })
  );
}
