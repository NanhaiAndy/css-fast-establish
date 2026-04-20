import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pathModule from 'path';

interface UnusedClass {
  className: string;
  file: string;
  line: number;
  context: string;
}

interface ClassLocation {
  file: string;
  line: number;
  context: string;
  originalClassName: string;
}

interface RedundancyResult {
  totalDefined: number;
  totalUsed: number;
  unusedClasses: UnusedClass[];
  scanTime: number;
}

// 提取 CSS/LESS/SCSS 中的 class 定义
function extractCssClasses(content: string, filePath: string): Array<{ className: string; line: number; context: string }> {
  const classes: Array<{ className: string; line: number; context: string }> = [];
  const lines = content.split('\n');

  // 匹配 .className { 或 .className, 或 .className:  但排除 :: 和 :
  const classPattern = /\.([a-zA-Z_][\w-]*)(?=\s*[{,:])/g;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    let match;
    while ((match = classPattern.exec(line)) !== null) {
      const className = match[1];
      // 排除 CSS 伪元素和伪类修饰符
      if (/^:|::$/.test(className)) continue;
      // 排除纯数字
      if (/^\d+$/.test(className)) continue;
      // 排除 CSS 关键字
      if (/^(root|host|container|keyframes|media|supports|font-face|import|charset|layer)$/.test(className)) continue;

      classes.push({
        className,
        line: lineIdx + 1,
        context: line.trim().substring(0, 60)
      });
    }
    // 重置 lastIndex 以避免全局正则的状态问题
    classPattern.lastIndex = 0;
  }

  return classes;
}

// 提取 Vue SFC 中的 <style> 块及其在原始文件中的位置
function extractVueStyleBlocksWithPosition(content: string): Array<{ cssContent: string; startLine: number }> {
  const result: Array<{ cssContent: string; startLine: number }> = [];
  const regex = /<style[\s\S]*?>([\s\S]*?)<\/style>/gi;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    // 找到 <style...> 标签的结束位置
    const openingTagEndIndex = match.index + match[0].indexOf('>') + 1;
    
    // 计算从文件开头到 <style> 内容开始有多少行
    const textBeforeContent = content.substring(0, openingTagEndIndex);
    const linesBeforeContent = textBeforeContent.split('\n');
    const startLine = linesBeforeContent.length; // 这是 <style> 内容第一行的行号
    
    result.push({
      cssContent: match[1],
      startLine: startLine
    });
  }
  
  return result;
}

// 提取 Vue SFC 中的 <style> 块（旧版本，保持兼容）
function extractVueStyleBlocks(content: string): string {
  const styleBlocks: string[] = [];
  const regex = /<style[\s\S]*?>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    styleBlocks.push(match[1]);
  }
  return styleBlocks.join('\n');
}

// 提取 HTML/Vue 模板中的 class 引用
function extractUsedClasses(content: string): Set<string> {
  const usedClasses = new Set<string>();

  // 提取 <template> 块（Vue 文件）
  let templateContent = content;
  const templateMatch = content.match(/<template[\s\S]*?>([\s\S]*?)<\/template>/gi);
  if (templateMatch) {
    templateContent = templateMatch.map(m => m).join('\n');
  }

  // class="xxx" 或 class='xxx'
  const classAttrPattern = /(?:class|className)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = classAttrPattern.exec(templateContent)) !== null) {
    const value = match[1];
    // 分割 class（处理动态绑定残留和空格分隔）
    const classes = value.split(/[\s,]+/).filter(c => {
      // 排除 Vue 动态绑定语法
      if (c.startsWith('{') || c.startsWith('[') || c.startsWith(':') || c.startsWith('(')) return false;
      if (c.includes('{{') || c.includes('}}')) return false;
      // 排除纯表达式
      if (/^[\w$]+\s*[=<>!]=/.test(c)) return false;
      return /^[a-zA-Z_][\w-]*$/.test(c);
    });
    classes.forEach(c => usedClasses.add(c));
  }

  // :class="..." 中的字符串字面量
  const dynamicClassPattern = /(?:\:class|v-bind\:class)\s*=\s*["']([^"']+)["']/gi;
  while ((match = dynamicClassPattern.exec(templateContent)) !== null) {
    const value = match[1];
    // 提取字符串字面量中的 class 名
    const stringLiteralPattern = /['"]([a-zA-Z_][\w-]*)['"]/g;
    let strMatch;
    while ((strMatch = stringLiteralPattern.exec(value)) !== null) {
      usedClasses.add(strMatch[1]);
    }
  }

  // classList.add / classList.toggle / classList.remove 中的参数
  const classListPattern = /classList\.(?:add|toggle|remove)\s*\(\s*['"]([^'"]+)['"]/gi;
  while ((match = classListPattern.exec(templateContent)) !== null) {
    usedClasses.add(match[1]);
  }

  return usedClasses;
}

// 提取 JS/TS 中的 class 引用（className 赋值、字符串拼接等）
function extractUsedClassesFromJS(content: string): Set<string> {
  const usedClasses = new Set<string>();
  const patterns = [
    /className\s*[:=]\s*["']([^"']+)["']/gi,
    /class\s*[:=]\s*["']([^"']+)["']/gi,
    /classList\.(?:add|toggle|remove)\s*\(\s*['"]([^'"]+)['"]/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const value = match[1];
      value.split(/[\s,]+/).filter(c => /^[a-zA-Z_][\w-]*$/.test(c)).forEach(c => usedClasses.add(c));
    }
  }
  return usedClasses;
}

export async function detect(
  scope: 'file' | 'workspace',
  progress?: vscode.Progress<{ message?: string; increment?: number }>,
  token?: vscode.CancellationToken
): Promise<RedundancyResult | null> {
  const startTime = Date.now();

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return null;
  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  // 收集所有已定义的 class
  const allDefinedClasses = new Map<string, ClassLocation[]>();

  if (scope === 'file') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return null;
    const doc = editor.document;

    if (doc.languageId === 'vue') {
      // 对于Vue文件，需要正确计算style块中的行号
      const styleBlocks = extractVueStyleBlocksWithPosition(doc.getText());
      for (const block of styleBlocks) {
        const classes = extractCssClasses(block.cssContent, doc.uri.fsPath);
        for (const cls of classes) {
          const key = cls.className.toLowerCase();
          const existing = allDefinedClasses.get(key) || [];
          // 关键修复：将相对行号转换为绝对行号
          const absoluteLine = block.startLine + cls.line - 1;
          existing.push({ 
            file: doc.uri.fsPath, 
            line: absoluteLine, 
            context: cls.context, 
            originalClassName: cls.className 
          });
          allDefinedClasses.set(key, existing);
        }
      }
    } else {
      const cssContent = doc.getText();
      const classes = extractCssClasses(cssContent, doc.uri.fsPath);
      for (const cls of classes) {
        const key = cls.className.toLowerCase();
        const existing = allDefinedClasses.get(key) || [];
        existing.push({ file: doc.uri.fsPath, line: cls.line, context: cls.context, originalClassName: cls.className });
        allDefinedClasses.set(key, existing);
      }
    }

    // 收集当前文件的 class 引用
    const usedClasses = new Set<string>();
    if (doc.languageId === 'vue') {
      const templateMatch = doc.getText().match(/<template[\s\S]*?>([\s\S]*?)<\/template>/gi);
      if (templateMatch) {
        templateMatch.forEach(m => {
          extractUsedClasses(m).forEach(c => usedClasses.add(c.toLowerCase()));
        });
      }
    } else if (['html', 'jsx', 'tsx'].includes(doc.languageId)) {
      extractUsedClasses(doc.getText()).forEach(c => usedClasses.add(c.toLowerCase()));
    }

    // 同时扫描同目录下的模板文件
    const fileDir = pathModule.dirname(doc.uri.fsPath);
    try {
      const filesInDir = fs.readdirSync(fileDir);
      for (const f of filesInDir) {
        if (/\.(vue|html|jsx|tsx)$/.test(f)) {
          try {
            const content = fs.readFileSync(pathModule.join(fileDir, f), 'utf-8');
            extractUsedClasses(content).forEach(c => usedClasses.add(c.toLowerCase()));
          } catch {}
        }
      }
    } catch {}

    // 查找未使用的 class
    const unusedClasses: UnusedClass[] = [];
    for (const [key, locations] of allDefinedClasses) {
      if (!usedClasses.has(key)) {
        for (const loc of locations) {
          unusedClasses.push({
            className: loc.originalClassName,
            file: loc.file,
            line: loc.line,
            context: loc.context
          });
        }
      }
    }

    return {
      totalDefined: allDefinedClasses.size,
      totalUsed: usedClasses.size,
      unusedClasses,
      scanTime: Date.now() - startTime
    };
  }

  // 工作区模式
  if (progress) progress.report({ message: '正在扫描 CSS 文件...' });

  // 1. 收集所有 CSS/LESS/SCSS 文件
  const cssUris = await vscode.workspace.findFiles(
    '**/*.{css,less,scss}',
    '**/node_modules/**',
    3000
  );
  const vueUris = await vscode.workspace.findFiles(
    '**/*.vue',
    '**/node_modules/**',
    3000
  );

  // 2. 提取所有 class 定义
  const allUris = [...cssUris, ...vueUris];
  for (let i = 0; i < allUris.length; i++) {
    if (token?.isCancellationRequested) return null;
    try {
      const content = fs.readFileSync(allUris[i].fsPath, 'utf-8');
      
      if (allUris[i].fsPath.endsWith('.vue')) {
        // 对于Vue文件，需要正确计算style块中的行号
        const styleBlocks = extractVueStyleBlocksWithPosition(content);
        for (const block of styleBlocks) {
          const classes = extractCssClasses(block.cssContent, allUris[i].fsPath);
          for (const cls of classes) {
            const key = cls.className.toLowerCase();
            const existing = allDefinedClasses.get(key) || [];
            // 关键修复：将相对行号转换为绝对行号
            const absoluteLine = block.startLine + cls.line - 1;
            existing.push({
              file: pathModule.relative(workspaceRoot, allUris[i].fsPath).replace(/\\/g, '/'),
              line: absoluteLine,
              context: cls.context,
              originalClassName: cls.className
            });
            allDefinedClasses.set(key, existing);
          }
        }
      } else {
        // 对于普通CSS/LESS/SCSS文件，直接使用内容
        const classes = extractCssClasses(content, allUris[i].fsPath);
        for (const cls of classes) {
          const key = cls.className.toLowerCase();
          const existing = allDefinedClasses.get(key) || [];
          existing.push({
            file: pathModule.relative(workspaceRoot, allUris[i].fsPath).replace(/\\/g, '/'),
            line: cls.line,
            context: cls.context,
            originalClassName: cls.className
          });
          allDefinedClasses.set(key, existing);
        }
      }
    } catch {}

    if (progress && i % 100 === 0) {
      progress.report({ message: `已扫描 ${i}/${allUris.length} 个样式文件...`, increment: 30 * 100 / allUris.length });
    }
  }

  // 3. 收集所有模板文件中的 class 引用
  if (progress) progress.report({ message: '正在扫描模板引用...' });
  const templateUris = await vscode.workspace.findFiles(
    '**/*.{vue,html,jsx,tsx}',
    '**/node_modules/**',
    3000
  );

  const allUsedClasses = new Set<string>();
  for (let i = 0; i < templateUris.length; i++) {
    if (token?.isCancellationRequested) return null;
    try {
      const content = fs.readFileSync(templateUris[i].fsPath, 'utf-8');
      extractUsedClasses(content).forEach(c => allUsedClasses.add(c.toLowerCase()));
    } catch {}

    if (progress && i % 200 === 0) {
      progress.report({ message: `已扫描 ${i}/${templateUris.length} 个模板文件...`, increment: 30 * 200 / templateUris.length });
    }
  }

  // 也扫描 JS/TS 文件
  const jsUris = await vscode.workspace.findFiles(
    '**/*.{js,ts}',
    '**/node_modules/**',
    1000
  );
  for (let i = 0; i < jsUris.length; i++) {
    if (token?.isCancellationRequested) return null;
    try {
      const content = fs.readFileSync(jsUris[i].fsPath, 'utf-8');
      extractUsedClassesFromJS(content).forEach(c => allUsedClasses.add(c.toLowerCase()));
    } catch {}
  }

  // 4. 找出未使用的 class
  const unusedClasses: UnusedClass[] = [];
  for (const [key, locations] of allDefinedClasses) {
    if (!allUsedClasses.has(key)) {
      for (const loc of locations) {
        unusedClasses.push({
          className: loc.originalClassName,
          file: loc.file,
          line: loc.line,
          context: loc.context
        });
      }
    }
  }

  return {
    totalDefined: allDefinedClasses.size,
    totalUsed: allUsedClasses.size,
    unusedClasses,
    scanTime: Date.now() - startTime
  };
}
