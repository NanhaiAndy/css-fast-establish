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

// 使用随机字符生成无意义文字
const generateRandomText = function(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// 随机生成数字
const generateRandomNumber = function(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机生成时间戳
const generateRandomTimestamp = function(): number {
  // 获取当前秒时间戳
  const timestamp = Math.floor(Date.now() / 1000);
  return timestamp;
}

// 随机生成一个中文名称
const generateRandomChineseName = function(length: number): string {
  const characters = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// 随机生成一个网站链接
const generateRandomWebsiteLink = function() {
  const websites = [
    'https://www.google.com',
    'https://www.bing.com',
    'https://www.yahoo.com',
    'https://www.baidu.com',
    'https://www.youtube.com',
    'https://www.facebook.com',
    'https://www.twitter.com',
    'https://www.instagram.com',
    'https://www.tiktok.com',
    'https://www.reddit.com',
    'https://www.wikipedia.org',
    'https://www.amazon.com',
    'https://www.netflix.com',
    'https://www.spotify.com',
    'https://www.pinterest.com',
    'https://www.twitch.tv',
    'https://www.linkedin.com',
    'https://www.imdb.com',
    'https://www.quora.com',
    'https://www.tumblr.com',
    'https://www.flickr.com',

  ]
  return websites[Math.floor(Math.random() * websites.length)]
}

// mock数据生成
const generateMockData = function(textContent: String, quantityg: number) { 
  // 在每行的字段名前添加制表符
  const processedInput = textContent.split('\t').map((line, index) => {
    // 在第一个制表符前添加一个制表符，即在字段名前添加制表符
    const firstTabIndex = line.split(' ').pop();
    return index === 0 ? firstTabIndex : '\t' + firstTabIndex;
  }).join('');

  // 通过input里面的\来分割字段
  const lines = processedInput.split('\t');

  // 只有一条就终止 或者 processedInput里面没有\t
  if (lines.length === 1 || !processedInput.includes('\t')) {
    // 弹窗提醒
    vscode.window.showInformationMessage('生成mock数据失败，结构不对，请按照官方接口文档进行复制');
    return null;
  }

  const structureList = [];
  for (let i = 0; i < lines.length; i += 3) {
    const fieldName = lines[i].trim();
    const gb = i+1
    if (gb === lines.length) {
      break;
    }
    // 字段类型
    const fieldType = lines[i+1].trim();
    // 是否必需
    const required = lines[i+2].trim();
    // 根据字段类型和描述设置默认值
    if (fieldName && fieldType) {
      structureList.push({
        fieldName,
        fieldType,
        required,
      })
    }
  }
  // mock数据
  const fieldsList: { [key: string]: any; }[] = [];
  for (let j = 0; j < quantityg; j++) {
    const result: { [key: string]: any } = {};
    for (let x = 0; x < structureList.length; x++) {
      const { fieldName, fieldType, required } = structureList[x];
      switch (fieldType) {
          case 'String':
              // 随机生成字符串
              let text = generateRandomText(12);
              // fieldName里面是否包含name或者Name
              if (fieldName.includes('name') || fieldName.includes('Name')) {
                // 随机生成名称
                text = generateRandomChineseName(3);
              } else if (fieldName.includes('url') || fieldName.includes('Url')) {
                // 随机生成一个网站链接
                text = generateRandomWebsiteLink();
              }
              result[fieldName] = text;
              break;
          case 'Integer':
              // 随机生成数字
              result[fieldName] = generateRandomNumber(0, 10);
              break;
          case 'Long':
              // 随机生成数字
              result[fieldName] = generateRandomNumber(1000000, 99999999);
              break;
          case 'Boolean':
              // 随机生成布尔值
              result[fieldName] = Math.random() < 0.5;
              break;
          case 'Date':
              // 随机生成时间戳
                result[fieldName] = generateRandomTimestamp();
              break;
          default:
              result[fieldName] = fieldName;
      }
    }
    // 在根据result里面的字段和类型生成数据
    fieldsList.push(result);
  }

  let outputData: { [key: string]: any; } | { [key: string]: any; }[] = fieldsList;
  if (fieldsList.length === 1) {
    outputData = fieldsList[0];
  }

  // 把fieldsList插入到光标处
  vscode.commands.executeCommand('editor.action.insertLineAfter').then(() => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, JSON.stringify(outputData, null, 2));
    });
  });
}



export default {
  findValueDefinition,
  getHoveredClassName,
  findCssContentForClass,
  generateRandomText,
  generateRandomNumber,
  generateRandomTimestamp,
  generateRandomChineseName,
  generateRandomWebsiteLink,
  generateMockData,
  findDefinitionForClass
};