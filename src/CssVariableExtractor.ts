import * as vscode from 'vscode';

interface ExtractableValue {
  value: string;
  fullMatch: string;
  line: number;
  startCol: number;
  property: string;
  type: 'color' | 'size';
}

const COLOR_PATTERN = /(?:^|[\s;{}])color\s*:\s*([^;{}]+)/gi;
const BG_COLOR_PATTERN = /background(?:-color)?\s*:\s*([^;{}]+)/gi;
const BORDER_COLOR_PATTERN = /border(?:-(?:top|right|bottom|left))?-color\s*:\s*([^;{}]+)/gi;
const FONT_SIZE_PATTERN = /font-size\s*:\s*([^;{}]+)/gi;

const COLOR_VALUE = /#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/;
const SIZE_VALUE = /(\d+(?:\.\d+)?)(px|rem|em|vh|vw)/;

export async function extractCssVariable(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const document = editor.document;
  const text = document.getText();
  const langId = document.languageId;

  // find CSS blocks
  let cssText = text;
  let cssOffset = 0;

  if (langId === 'vue') {
    const styleMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      cssText = styleMatch[1];
      cssOffset = text.indexOf(styleMatch[0]) + styleMatch[0].indexOf('>') + 1;
    }
  }

  const extractable: ExtractableValue[] = [];

  // find colors
  const colorProps = [
    { regex: COLOR_PATTERN, prop: 'color' },
    { regex: BG_COLOR_PATTERN, prop: 'background-color' },
    { regex: BORDER_COLOR_PATTERN, prop: 'border-color' },
  ];

  for (const { regex, prop } of colorProps) {
    let match;
    const r = new RegExp(regex.source, regex.flags);
    while ((match = r.exec(cssText)) !== null) {
      const valueStr = match[1].trim();
      const colorMatch = valueStr.match(COLOR_VALUE);
      if (colorMatch) {
        const line = cssText.substring(0, match.index).split('\n').length - 1;
        extractable.push({
          value: colorMatch[0],
          fullMatch: match[0],
          line,
          startCol: match.index - cssText.split('\n').slice(0, line).join('\n').length - 1,
          property: prop,
          type: 'color',
        });
      }
    }
  }

  // find font sizes
  let match;
  const fsRegex = new RegExp(FONT_SIZE_PATTERN.source, FONT_SIZE_PATTERN.flags);
  while ((match = fsRegex.exec(cssText)) !== null) {
    const valueStr = match[1].trim();
    const sizeMatch = valueStr.match(SIZE_VALUE);
    if (sizeMatch) {
      const line = cssText.substring(0, match.index).split('\n').length - 1;
      extractable.push({
        value: sizeMatch[0],
        fullMatch: match[0],
        line,
        startCol: match.index - cssText.split('\n').slice(0, line).join('\n').length - 1,
        property: 'font-size',
        type: 'size',
      });
    }
  }

  if (extractable.length === 0) {
    vscode.window.showInformationMessage('未找到可提取的硬编码颜色或字号');
    return;
  }

  // deduplicate by value
  const uniqueMap = new Map<string, ExtractableValue[]>();
  for (const item of extractable) {
    if (!uniqueMap.has(item.value)) {
      uniqueMap.set(item.value, []);
    }
    uniqueMap.get(item.value)!.push(item);
  }

  const items = Array.from(uniqueMap.entries()).map(([value, items]) => ({
    label: value,
    description: `${items.length} 处使用 · ${items[0].property}`,
    detail: items.map(i => `行 ${i.line + 1}: ${i.property}`).join('\n'),
    value,
    count: items.length,
  }));

  const chosen = await vscode.window.showQuickPick(items, {
    placeHolder: '选择要提取为 CSS 变量的值（可多选）',
    canPickMany: true,
  });

  if (!chosen || chosen.length === 0) { return; }

  const varNameInput = await vscode.window.showInputBox({
    placeHolder: '输入变量名前缀（如不填则自动生成）',
    prompt: '变量将生成在 :root 中，如 --color-primary',
  });

  if (varNameInput === undefined) { return; } // cancelled

  // generate variable names
  const varMap = new Map<string, string>();
  const colorIdx = { v: 1 };
  const sizeIdx = { v: 1 };

  for (const item of chosen) {
    const entries = uniqueMap.get(item.value)!;
    const type = entries[0].type;
    let varName: string;

    if (varNameInput) {
      varName = type === 'color'
        ? `--${varNameInput}-${colorIdx.v++}`
        : `--${varNameInput}-${sizeIdx.v++}`;
    } else {
      varName = type === 'color'
        ? `--color-${colorIdx.v++}`
        : `--size-${sizeIdx.v++}`;
    }
    varMap.set(item.value, varName);
  }

  // build :root block
  let rootBlock = ':root {\n';
  for (const [value, varName] of varMap) {
    rootBlock += `  ${varName}: ${value};\n`;
  }
  rootBlock += '}\n\n';

  // replace values in CSS
  let newCssText = cssText;
  for (const [value, varName] of varMap) {
    // replace each occurrence
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    newCssText = newCssText.replace(
      new RegExp(escaped, 'g'),
      `var(${varName})`
    );
  }

  // insert :root at the beginning of CSS block
  const fullOffset = cssOffset;
  const edit = new vscode.WorkspaceEdit();
  const startPos = document.positionAt(fullOffset);

  const fullText = document.getText();
  const newText = fullText.substring(0, fullOffset) + rootBlock + newCssText + fullText.substring(fullOffset + cssText.length);

  edit.replace(
    document.uri,
    new vscode.Range(
      document.positionAt(0),
      document.positionAt(fullText.length)
    ),
    newText
  );

  await vscode.workspace.applyEdit(edit);
  vscode.window.showInformationMessage(`已提取 ${varMap.size} 个 CSS 变量`);
}
