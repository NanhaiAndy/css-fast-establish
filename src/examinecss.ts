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

// Aimock数据生成判断
const generateMockDataJudge = function(textContent: String) {
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

  return textContent
}

// 纯代码生成多层mock数据
const generateMockDataMultiLayer = function(textContent: string): { [key: string]: any } | null {
  // 按制表符分割成tokens
  const rawTokens = textContent.split(/\t/).map(t => t.trim()).filter(t => t.length > 0);

  if (rawTokens.length < 3) {
    vscode.window.showInformationMessage('生成mock数据失败，结构不对，请按照官方接口文档进行复制');
    return null;
  }

  // 解析所有类型定义和字段
  const typeMap = new Map<string, Array<{ fieldName: string; fieldType: string; required: string }>>();
  let currentTypeName = '__root__';
  let currentFields: Array<{ fieldName: string; fieldType: string; required: string }> = [];

  // 从token中提取字段名（去掉前面的中文描述）
  function extractFieldName(token: string): string {
    const cleaned = token.replace(/└─/g, '').trim();
    // 如果末尾有英文字段名（前面有中文或空格描述），提取最后一个英文词
    const match = cleaned.match(/\s+([a-zA-Z][a-zA-Z0-9_<>]*)\s*$/);
    if (match) {
      return match[1];
    }
    return cleaned;
  }

  let i = 0;
  while (i < rawTokens.length) {
    // 检查是否是类型头（后面跟着 类型、可否为空）
    if (i + 2 < rawTokens.length && rawTokens[i + 1] === '类型' && rawTokens[i + 2] === '可否为空') {
      // 保存当前类型的字段
      if (currentFields.length > 0) {
        typeMap.set(currentTypeName, currentFields);
      }
      // 开始新类型定义
      currentTypeName = extractFieldName(rawTokens[i]);
      currentFields = [];

      // 跳过类型头（类型名、类型、可否为空）
      i += 3;
      // 处理「说明」token，可能包含第一个字段名
      if (i < rawTokens.length) {
        const descToken = rawTokens[i];
        if (descToken.startsWith('说明')) {
          const rest = descToken.substring(2).trim();
          if (rest && /^[a-zA-Z]/.test(rest)) {
            // 说明后面跟着字段名，把它作为当前token重新解析
            rawTokens[i] = rest;
            // 不递增i，下一轮处理这个字段名
          } else {
            i += 1;
          }
        } else {
          i += 1;
        }
      }
      continue;
    }

    // 普通字段：提取字段名、类型、是否必填
    if (i + 2 < rawTokens.length) {
      const fieldName = extractFieldName(rawTokens[i]);
      const fieldType = rawTokens[i + 1].trim();
      const required = rawTokens[i + 2].trim();

      if (fieldName && fieldType && !fieldType.includes('…')) {
        currentFields.push({ fieldName, fieldType, required });
      }
      // 跳过 name、type、required，下一个token是描述（包含下一个字段名）
      i += 3;
    } else {
      break;
    }
  }

  // 保存最后一个类型
  if (currentFields.length > 0) {
    typeMap.set(currentTypeName, currentFields);
  }

  // 生成mock数据
  const rootFields = typeMap.get('__root__');
  if (!rootFields || rootFields.length === 0) {
    vscode.window.showInformationMessage('生成mock数据失败，未识别到根字段');
    return null;
  }

  return generateMockObject(rootFields, typeMap, 0, new Set());
}

// 根据字段定义生成mock对象
function generateMockObject(fields: Array<{ fieldName: string; fieldType: string; required: string }>, typeMap: Map<string, Array<{ fieldName: string; fieldType: string; required: string }>>, depth: number, visitedTypes: Set<string>): { [key: string]: any } {
  if (depth > 5) return {};

  const result: { [key: string]: any } = {};

  for (const { fieldName, fieldType } of fields) {
    result[fieldName] = generateMockValue(fieldName, fieldType, typeMap, depth, visitedTypes);
  }

  return result;
}

// 根据字段类型生成mock值
function generateMockValue(fieldName: string, fieldType: string, typeMap: Map<string, Array<{ fieldName: string; fieldType: string; required: string }>>, depth: number, visitedTypes: Set<string>): any {
  // 处理List<XXX>类型
  const listMatch = fieldType.match(/^List<(.+)>$/);
  if (listMatch) {
    const innerType = listMatch[1];
    // 如果内部类型有定义
    if (typeMap.has(innerType)) {
      // 自引用检测：如果已经访问过该类型，返回空数组
      if (visitedTypes.has(innerType)) {
        return [];
      }
      const count = Math.floor(Math.random() * 2) + 1;
      const innerFields = typeMap.get(innerType)!;
      const newVisited = new Set(visitedTypes);
      newVisited.add(innerType);
      return Array.from({ length: count }, () => generateMockObject(innerFields, typeMap, depth + 1, newVisited));
    }
    // 内部类型没有定义，生成基本值
    const item = generateMockValue(fieldName, innerType, typeMap, depth, visitedTypes);
    return [item];
  }

  // 检查是否有对应类型定义
  if (typeMap.has(fieldType)) {
    // 自引用检测
    if (visitedTypes.has(fieldType)) {
      return {};
    }
    const fields = typeMap.get(fieldType)!;
    const newVisited = new Set(visitedTypes);
    newVisited.add(fieldType);
    return generateMockObject(fields, typeMap, depth + 1, newVisited);
  }

  // 基本类型处理
  switch (fieldType) {
    case 'String':
      if (fieldName.includes('name') || fieldName.includes('Name')) {
        return generateRandomChineseName(3);
      }
      if (fieldName.includes('url') || fieldName.includes('Url') || fieldName.endsWith('Url')) {
        return generateRandomWebsiteLink();
      }
      if (fieldName.includes('Mobile') || fieldName.includes('mobile') || fieldName.includes('Phone') || fieldName.includes('phone')) {
        return '13800138000';
      }
      return generateRandomText(12);

    case 'Integer':
    case 'int':
      return generateRandomNumber(0, 100);

    case 'Long':
    case 'long':
      return generateRandomNumber(1000000, 999999999);

    case 'Boolean':
    case 'boolean':
      return Math.random() < 0.5;

    case 'Date':
      return generateRandomTimestamp();

    case 'Double':
    case 'double':
    case 'Float':
    case 'float':
      return parseFloat((Math.random() * 10000).toFixed(6));

    default:
      // 未知自定义类型，尝试从typeMap查找
      if (typeMap.has(fieldType)) {
        const newVisited = new Set(visitedTypes);
        newVisited.add(fieldType);
        return generateMockObject(typeMap.get(fieldType)!, typeMap, depth + 1, newVisited);
      }
      return generateRandomText(12);
  }
}

//接口定义生成
const portDefinitionModule = async function(connectorName: String, request: String) {
  const [projectName, apiName, methodName] = connectorName.split('.');
  const workspaceRoot = vscode.workspace.workspaceFolders![0].uri;
  const fs = require('fs');
  const pathModule = require('path');

  try {
    // ========== 生成 schema 文件 ==========
    // 先在当前项目下的app目录下的schema目录下查找是否有和projectName名字一个目录
    const foundFiles = await vscode.workspace.findFiles(`app/schema/${projectName}`, '**/node_modules/**', 1);

    let newDirPath = '';

    if (foundFiles.length === 0) {
      // 确保 app/schema 目录存在
      const schemaPath = pathModule.join(workspaceRoot.fsPath, 'app', 'schema');
      fs.mkdirSync(schemaPath, { recursive: true });

      // 创建 projectName 目录
      newDirPath = pathModule.join(schemaPath, projectName);
      if (!fs.existsSync(newDirPath)) {
        fs.mkdirSync(newDirPath);
      }
    } else {
      newDirPath = pathModule.dirname(foundFiles[0].fsPath);
    }

    // 在目录下创建或更新js文件
    const fileName = `${apiName}.js`;
    const filePath = pathModule.join(newDirPath, fileName);

    const methodContent = `${methodName}:[{
    packageName: '${projectName}',
    service: '${apiName}',
    apiName: '${methodName}',
    method: '${request}',
    dubboMethodName: '${methodName}',
    action: '${projectName}/${apiName}/${methodName}'
  }]`;

    if (!fs.existsSync(filePath)) {
      // 如果文件不存在，创建新文件
      const fileContent = `module.exports = {
  ${methodContent},
}
`;
      fs.writeFileSync(filePath, fileContent);
    } else {
      // 如果文件存在，在module.exports中添加新的方法
      let fileContent = fs.readFileSync(filePath, 'utf8');

      // 检查是否已存在同名方法
      if (!fileContent.includes(`${methodName}:[{`)) {
        // 在 }; 前插入新方法
        const closingIndex = fileContent.lastIndexOf('};');
        if (closingIndex !== -1) {
          const before = fileContent.substring(0, closingIndex);
          fileContent = before + `  ${methodContent},\n};`;
          fs.writeFileSync(filePath, fileContent);
        }
      }
    }

    // ========== 生成 routes 文件 ==========
    const foundFilesMl = await vscode.workspace.findFiles(`app/routes/${projectName}`, '**/node_modules/**', 1);
    let newDirPathQb = '';

    if (foundFilesMl.length === 0) {
      // 确保 app/routes 目录存在
      const routesPath = pathModule.join(workspaceRoot.fsPath, 'app', 'routes');
      fs.mkdirSync(routesPath, { recursive: true });

      // 创建 projectName 目录
      newDirPathQb = pathModule.join(routesPath, projectName);
      if (!fs.existsSync(newDirPathQb)) {
        fs.mkdirSync(newDirPathQb);
      }
    } else {
      newDirPathQb = pathModule.dirname(foundFilesMl[0].fsPath);
    }

    // 在目录下创建或更新js文件
    const fileNamex = `${apiName}.js`;
    const filePathx = pathModule.join(newDirPathQb, fileNamex);

    // apiName 首字母小写
    const apiNamex = apiName.charAt(0).toLowerCase() + apiName.slice(1);

    const routeCode = `UA.${request === 'get' ? 'onGet':'onPost'}('/api/${apiName}/${methodName}', function (req, res) {
  dubboApi.${apiNamex}.${methodName}.${request}({
    data: {
      ...${request === 'get' ? 'req.query':'req.body'}
    }
  }).then(rs => {
    res.send(rs)
  }).catch(err => {
    console.error('${methodName}:' + err.description || JSON.stringify(err))
  })
})`;

    if (!fs.existsSync(filePathx)) {
      // 如果不存在，创建新文件并写入内容
      const fileContent = `const dubboApi = require('@dubbo/${projectName}')

${routeCode}
`;
      fs.writeFileSync(filePathx, fileContent);
    } else {
      // 如果存在，将代码插入到文件末尾
      let existingContent = fs.readFileSync(filePathx, 'utf8');
      const importStatement = `const dubboApi = require('@dubbo/${projectName}')`;

      // 如果还没有引入语句，则添加到顶部
      if (!existingContent.includes(importStatement)) {
        existingContent = importStatement + '\n\n' + existingContent;
      }

      // 确保代码不会重复添加
      if (!existingContent.includes(`'/api/${apiName}/${methodName}'`)) {
        // 在文件末尾追加路由代码
        existingContent = existingContent.trimEnd() + '\n\n' + routeCode + '\n';
      }

      fs.writeFileSync(filePathx, existingContent);
    }

    // 生成完成提醒
    vscode.window.showInformationMessage('已在schema和routes目录下生成接口定义！有调整请自行调整！');
  } catch (err: any) {
    vscode.window.showErrorMessage(`接口定义生成失败: ${err.message || err}`);
  }
}

  // 添加获取 WiFi 名称的函数
  const getWifiName = async function(): Promise<string | null> {
    try {
      // 这里根据不同的操作系统使用不同的命令获取 WiFi 名称
      const os = require('os');
      const platform = os.platform();
      let command: string;
  
      if (platform === 'win32') {
        // Windows 系统
        command = 'netsh wlan show interfaces | findstr "SSID"';
      } else if (platform === 'darwin') {
        // macOS 系统
        command = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep "SSID"';
      } else {
        // Linux 系统
        command = 'iwgetid -r';
      }
  
      const { execSync } = require('child_process');
      const stdout = execSync(command, { encoding: 'utf8' });
      return stdout.trim();
    } catch (error) {
      console.error('获取 WiFi 名称失败:', error);
      return null;
    }
  }



// 通过生成物批量生成接口定义
const interfaceDefinitionFromArtifact = async function() {
  const fs = require('fs');
  const pathModule = require('path');
  const os = require('os');
  const { execSync } = require('child_process');

  // 1. 输入 git 生成物地址
  const gitUrl = await vscode.window.showInputBox({
    placeHolder: '请填入生成物地址，示例：https://git.xxx.la/xxx/xxx-api.git#分支名（#分支名可选）',
    ignoreFocusOut: true
  });
  if (!gitUrl) { return; }

  // 解析 URL 和分支
  const cleanUrl = gitUrl.replace(/^git\+/, '');
  const hashIndex = cleanUrl.lastIndexOf('#');
  const repoUrl = hashIndex !== -1 ? cleanUrl.substring(0, hashIndex) : cleanUrl;
  const branch = hashIndex !== -1 ? cleanUrl.substring(hashIndex + 1) : '';

  // 2. 克隆到临时目录
  const tempDir = pathModule.join(os.tmpdir(), `dubbo-artifact-${Date.now()}`);
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '正在拉取生成物...',
    cancellable: false
  }, async () => {
    const cloneCmd = `git clone --depth 1${branch ? ' -b ' + branch : ''} ${repoUrl} "${tempDir}"`;
    execSync(cloneCmd, { stdio: 'pipe' });
  });

  try {
    // 3. 解析 package.json 获取项目名
    const pkgPath = pathModule.join(tempDir, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      vscode.window.showErrorMessage('未找到 package.json，请确认是否为有效的 dubbo 生成物仓库');
      return;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const projectName = pkg.name ? pkg.name.replace(/^@dubbo\//, '') : '';
    if (!projectName) {
      vscode.window.showErrorMessage('package.json 中未找到有效的 name 字段');
      return;
    }

    // 4. 解析 index.js 获取服务列表
    const indexPath = pathModule.join(tempDir, 'index.js');
    if (!fs.existsSync(indexPath)) {
      vscode.window.showErrorMessage('未找到 index.js，请确认生成物结构');
      return;
    }
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const apiMatch = indexContent.match(/module\.exports\.api\s*=\s*\{([\s\S]*?)\};/);
    if (!apiMatch) {
      vscode.window.showErrorMessage('index.js 中未找到 module.exports.api 定义');
      return;
    }
    const serviceMatches = [...apiMatch[1].matchAll(/"?(\w+)"?\s*:\s*require\s*\(\s*["']([^"']+)["']\s*\)/g)];
    const services = serviceMatches.map(m => ({ name: m[1], requirePath: m[2] }));
    if (services.length === 0) {
      vscode.window.showErrorMessage('未解析到任何服务');
      return;
    }

    // 5. 选择服务
    const selectedService = await vscode.window.showQuickPick(
      services.map(s => s.name),
      { placeHolder: `项目: ${projectName}，请选择要生成的服务` }
    );
    if (!selectedService) { return; }

    const serviceInfo = services.find(s => s.name === selectedService)!;

    // 6. 解析服务文件获取方法列表
    const serviceFilePath = pathModule.join(tempDir, serviceInfo.requirePath) + '.js';
    // 也尝试不带 .js 的路径（require 路径可能不含扩展名）
    const resolvedServicePath = fs.existsSync(serviceFilePath) ? serviceFilePath : serviceFilePath.replace(/\.js$/, '');
    const actualServicePath = fs.existsSync(resolvedServicePath) ? resolvedServicePath : serviceFilePath + '.js';

    if (!fs.existsSync(actualServicePath)) {
      vscode.window.showErrorMessage(`未找到服务文件: ${serviceInfo.requirePath}`);
      return;
    }
    const serviceContent = fs.readFileSync(actualServicePath, 'utf8');
    const paramsMatch = serviceContent.match(/params\s*:\s*\{([\s\S]*?)\n\s*\}\s*\}/);
    if (!paramsMatch) {
      vscode.window.showErrorMessage(`未在 ${selectedService} 中找到 params 定义`);
      return;
    }
    const methodMatches = [...paramsMatch[1].matchAll(/^\s+(\w+)\s*:\s*\{/gm)];
    const methods = methodMatches.map(m => m[1]).filter(k => !k.startsWith('$'));
    if (methods.length === 0) {
      vscode.window.showErrorMessage(`${selectedService} 中未解析到任何方法`);
      return;
    }

    // 7. 多选要生成的方法
    const quickPick = vscode.window.createQuickPick();
    quickPick.canSelectMany = true;
    quickPick.placeholder = '请勾选要生成的方法（已全选）';
    quickPick.items = methods.map(m => ({ label: m }));
    quickPick.selectedItems = quickPick.items as vscode.QuickPickItem[];
    const selectedMethods = await new Promise<vscode.QuickPickItem[] | undefined>((resolve) => {
      quickPick.onDidAccept(() => {
        resolve(quickPick.selectedItems.length > 0 ? [...quickPick.selectedItems] : undefined);
        quickPick.hide();
      });
      quickPick.onDidHide(() => resolve(undefined));
      quickPick.show();
    });
    if (!selectedMethods) { return; }

    // 8. 逐个选择请求方式
    const requestMap: { [method: string]: string } = {};
    for (const methodItem of selectedMethods) {
      const methodName = methodItem.label;
      const req = await vscode.window.showQuickPick(['GET', 'POST'], {
        placeHolder: `请选择 ${methodName} 的请求方式`
      });
      if (!req) { return; }
      requestMap[methodName] = req.toLowerCase();
    }

    // 9. 批量生成
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri;
    let generated = 0;
    let skipped = 0;
    const skippedMethods: string[] = [];

    for (const methodName of Object.keys(requestMap)) {
      const request = requestMap[methodName];
      const apiName = selectedService;
      const connectorName = `${projectName}.${apiName}.${methodName}`;

      // 检查是否已存在（schema 文件）
      const schemaDir = pathModule.join(workspaceRoot.fsPath, 'app', 'schema', projectName);
      const schemaFilePath = pathModule.join(schemaDir, `${apiName}.js`);
      if (fs.existsSync(schemaFilePath)) {
        const content = fs.readFileSync(schemaFilePath, 'utf8');
        if (content.includes(`${methodName}:[{`)) {
          skippedMethods.push(methodName);
          skipped++;
          continue;
        }
      }

      await portDefinitionModule(connectorName, request);
      generated++;
    }

    // 10. 更新项目 package.json 添加 @dubbo 依赖
    const projectPkgPath = pathModule.join(workspaceRoot.fsPath, 'package.json');
    if (fs.existsSync(projectPkgPath)) {
      try {
        const projectPkg = JSON.parse(fs.readFileSync(projectPkgPath, 'utf8'));
        if (!projectPkg.dependencies) {
          projectPkg.dependencies = {};
        }

        const dubboPkgName = `@dubbo/${projectName}`;
        const dubboPkgValue = `git+${cleanUrl}`;
        const existingValue = projectPkg.dependencies[dubboPkgName];

        // 判断操作类型：新增、替换、跳过
        if (!existingValue) {
          // 不存在，新增
          projectPkg.dependencies[dubboPkgName] = dubboPkgValue;
          fs.writeFileSync(projectPkgPath, JSON.stringify(projectPkg, null, 2) + '\n');
          vscode.window.showInformationMessage(`已添加依赖: ${dubboPkgName}`);
        } else if (existingValue !== dubboPkgValue) {
          // 已存在但值不同，替换
          projectPkg.dependencies[dubboPkgName] = dubboPkgValue;
          fs.writeFileSync(projectPkgPath, JSON.stringify(projectPkg, null, 2) + '\n');
          vscode.window.showInformationMessage(`已更新依赖: ${dubboPkgName}\n原值: ${existingValue}\n新值: ${dubboPkgValue}`);
        }
        // 值相同则跳过，不做任何操作
      } catch (err: any) {
        vscode.window.showWarningMessage(`更新 package.json 失败: ${err.message}`);
      }
    }

    // 生成结果提示
    let message = `生成完毕！共生成 ${generated} 个接口`;
    if (skipped > 0) {
      message += `，跳过 ${skipped} 个已存在的方法: ${skippedMethods.join(', ')}`;
    }
    vscode.window.showInformationMessage(message);

  } finally {
    // 清理临时目录
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // 忽略清理失败
    }
  }
};

export default {
  findValueDefinition,
  getHoveredClassName,
  findCssContentForClass,
  generateRandomText,
  generateRandomNumber,
  generateRandomTimestamp,
  generateRandomChineseName,
  generateRandomWebsiteLink,
  generateMockDataJudge,
  generateMockDataMultiLayer,
  findDefinitionForClass,
  portDefinitionModule,
  getWifiName,
  interfaceDefinitionFromArtifact
};