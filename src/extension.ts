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

  // 生成mock数据
  const disposableMock = vscode.commands.registerCommand('extension.generateMockData', async () => {
    // 弹出一个输入框
    const textContent = await vscode.window.showInputBox({
      placeHolder: '请填入在接口文档复制的接口结构'
    });

    if (!textContent) {
      return;
    }

    // 弹出二个输入框
    const quantity = await vscode.window.showInputBox({
      placeHolder: '请填入需要生成多少条数据(一条是对象，多条是数组)'
    });

    if (!quantity) {
      return;
    }

    const quantityg = parseInt(quantity);

    examinecss.generateMockData(textContent, quantityg)
  });

  context.subscriptions.push(disposableMock);

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

  // 注册值定义提供器（用于点击跳转到赋值位置）
context.subscriptions.push(
  vscode.languages.registerDefinitionProvider(['html', 'vue', 'javascript', 'typescript'], {
    async provideDefinition(document, position, token) {
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

export function deactivate() {}
