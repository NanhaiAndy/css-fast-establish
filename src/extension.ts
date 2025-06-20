import * as vscode from 'vscode';
import documentTree from 'document-tree';

import selection from './selection';
import generateCssTree from './cssTree';
import examinecss from './examinecss';

interface InterfaceUserConfig {
  cssFlavor: string;
}

export function activate(context: vscode.ExtensionContext) {
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

    const tree = documentTree.generate(selectedText);
    const cssTree = generateCssTree(tree, { isCss });

    // 如果没有找到<style>标签，保持原有逻辑
    const doc = await vscode.workspace.openTextDocument({
      content: cssTree,
      language: userConfig.cssFlavor
    });

    await vscode.window.showTextDocument(doc);
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

    const tree = documentTree.generate(selectedTextx);
    const cssTree = generateCssTree(tree, { isCss });

    // 检查当前文件是否包含<style lang="less" scoped>
    const documentText = editor.document.getText();
    const styleTagRegex = /<style\s+lang="less"(\s+scoped)?\s*>/i;
    const styleTagMatch = documentText.match(styleTagRegex);

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
        return;
      }
    }

    // 如果没有找到<style>标签，保持原有逻辑
    const doc = await vscode.workspace.openTextDocument({
      content: cssTree,
      language: userConfig.cssFlavor
    });

    await vscode.window.showTextDocument(doc);
  });

  context.subscriptions.push(disposableXk);

  // 监听鼠标移入class名称展示该class样式结构并可以跳转
  const hoverData = vscode.languages.registerHoverProvider(['html', 'vue'], {
    provideHover(document, position, token) {
      const className = examinecss.getHoveredClassName(document, position);
      if (!className) return null;

      const cssContent = examinecss.findCssContentForClass(document, className);
      if (!cssContent) return null;

      return new vscode.Hover([
        '**该CSS的样式 `' + className + '`**',
        { language: 'css', value: cssContent }
      ]);
    }
  })

  context.subscriptions.push(hoverData);

  // 注册定义提供器（用于点击跳转）
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(['html', 'vue'], {
      provideDefinition(document, position, token) {
        const className = examinecss.getHoveredClassName(document, position);
        if (!className) return null;

        return examinecss.findDefinitionForClass(document, className);
      }
    })
  );
}

export function deactivate() {}
