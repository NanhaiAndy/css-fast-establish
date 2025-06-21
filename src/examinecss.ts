import * as vscode from 'vscode';

// 添加辅助函数来获取悬停的 class 名：

const getHoveredClassName = function(document: vscode.TextDocument, position: vscode.Position): string | null {
  const range = document.getWordRangeAtPosition(position, /class=["']([^"']+)["']/);
  if (!range) return null;

  const lineText = document.lineAt(position.line).text;
  const classAttrMatch = lineText.match(/class=["']([^"']+)["']/);
  if (!classAttrMatch) return null;

  // const allClasses = classAttrMatch[1].split(/\s+/);
  const wordRange = document.getWordRangeAtPosition(position, /\S+/);
  if (!wordRange) return null;

  // 这里是获取当前鼠标移动到那个位置的class
  const hoveredWord = document.getText(wordRange);
  // 新增：提取完整的class名称（处理 hoveredWord 可能是 'class="top-introduce-ye">' 的情况）但是同时也有这种情况出现'class="sign-stand-out'

  const classValueMatch = hoveredWord.match(/class=["']([^"']*)/);
  if (classValueMatch) {
    const actualClass = classValueMatch[1] || classValueMatch[2]; // 处理双引号或单引号
    const classes = actualClass.split(/\s+/).filter(Boolean); // 过滤空值
    // 找出当前光标位置具体对应哪个class
    const cursorOffset = position.character - wordRange.start.character;
    for (const cls of classes) {
      if (hoveredWord.includes(cls) && 
          cursorOffset >= hoveredWord.indexOf(cls) && 
          cursorOffset <= hoveredWord.indexOf(cls) + cls.length) {
          return cls;
      }
    }
  }
  // 走到这一步基本上都是class有多个的时候，并且选择中间或者最后一个的时候
  const actualHoveredWord = hoveredWord.replace(/^['"]|['"]$/g, '');
  return actualHoveredWord;
  // return allClasses.includes(actualHoveredWord) ? actualHoveredWord : actualHoveredWord;
}

// 添加查找 CSS 内容的函数：
const findCssContentForClass = function(document: vscode.TextDocument, className: string): string | null {
  const text = document.getText();
  const cssRegex = new RegExp(`\\.${className}\\s*{[^}]*}`, 'g');
  const matches = text.match(cssRegex);
  return matches ? matches.join('\n\n') : null;
}


//添加定位样式定义的函数：

const findDefinitionForClass = function(document: vscode.TextDocument, className: string): vscode.Definition {
  const text = document.getText();
  const cssRegex = new RegExp(`(\\.${className}\\s*{[^}]*})`);
  const match = cssRegex.exec(text);
  
  if (!match) return [];
  
  const startPos = document.positionAt(match.index);
  const endPos = document.positionAt(match.index + match[0].length);
  
  return new vscode.Location(
    document.uri,
    new vscode.Range(startPos, endPos)
  );
}

// 全局搜索对应赋值的变量
const findValueDefinition = async function(value: string, currentDocument: vscode.TextDocument): Promise<vscode.Location[]> {
  const locations: vscode.Location[] = [];
  
  // 搜索当前文件
  const currentDocText = currentDocument.getText();
  const regex = new RegExp(`\\b${value}\\b\\s*[=:]`, 'g');
  let match;
  
  while ((match = regex.exec(currentDocText)) !== null) {
    const pos = currentDocument.positionAt(match.index);
    locations.push(new vscode.Location(currentDocument.uri, pos));
  }
  
  // 搜索整个工作空间（目前有点问题，同时会导致搜索速度变慢卡顿，还是先实现当前页面查找赋值吧）
  // const workspaceFiles = await vscode.workspace.findFiles('**/*.{js,ts,vue,html}');
  // for (const file of workspaceFiles) {
  //   if (file.fsPath === currentDocument.uri.fsPath) continue; // 跳过当前文件
    
  //   const doc = await vscode.workspace.openTextDocument(file);
  //   const text = doc.getText();
  //   let match;
    
  //   while ((match = regex.exec(text)) !== null) {
  //     const pos = doc.positionAt(match.index);
  //     locations.push(new vscode.Location(file, pos));
  //   }
  // }
  
  return locations;
}

export default {
  findValueDefinition,
  getHoveredClassName,
  findCssContentForClass,
  findDefinitionForClass
};