import * as vscode from 'vscode';

const getText = function(): string | null {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage('No text editor active');
    return null;
  }

  const selection = editor.selection;

  if (!selection) {
    vscode.window.showErrorMessage('Nothing is selected');
    return null;
  }

  const selectedText = editor.document.getText(selection);

  if (!selectedText) {
    vscode.window.showErrorMessage('No selected text found');
    return null;
  }

  return selectedText;
};

const removeVIfElements = function(htmlString: string): string {
  let result = htmlString; 
  
  result = result.replace(/<template[^>]*>([\s\S]*?)<\/template>/g, '$1');
  
  return result;
};

export default {
  getText,
  removeVIfElements
};