import * as vscode from 'vscode';

export async function wrapWithTag(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  if (!selectedText) {
    vscode.window.showErrorMessage('请先选中需要包裹的内容');
    return;
  }

  const input = await vscode.window.showInputBox({
    placeHolder: 'div',
    prompt: '输入标签名（支持属性，如 div class="box"）',
  });
  if (!input) { return; }

  const tagParts = input.trim().match(/^(\w[\w-]*)(.*)/s);
  if (!tagParts) {
    vscode.window.showErrorMessage('无效的标签名');
    return;
  }

  const tagName = tagParts[1];
  const attributes = tagParts[2].trim();

  const openTag = attributes ? `<${tagName} ${attributes}>` : `<${tagName}>`;
  const closeTag = `</${tagName}>`;

  await editor.edit(builder => {
    builder.replace(selection, `${openTag}${selectedText}${closeTag}`);
  });

  // 重新选中包裹后的内容
  const startPos = selection.start;
  const endPos = new vscode.Position(
    startPos.line + selectedText.split('\n').length - 1,
    selection.isSingleLine
      ? startPos.character + openTag.length + selectedText.length + closeTag.length
      : selectedText.split('\n').pop()!.length + closeTag.length
  );
  editor.selection = new vscode.Selection(
    new vscode.Position(startPos.line, startPos.character + openTag.length),
    endPos.character > closeTag.length
      ? new vscode.Position(endPos.line, endPos.line === startPos.line ? endPos.character - closeTag.length : endPos.character)
      : endPos
  );
}
