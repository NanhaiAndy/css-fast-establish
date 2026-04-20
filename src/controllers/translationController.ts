import * as vscode from 'vscode';

import designToCode from '../designToCode';
import { translateChineseToEnglish } from '../ChineseToEnglish';
import { ControllerDeps } from './types';

export function register(deps: ControllerDeps): void {
  const { context } = deps;

  const supportedLangs = ['javascript', 'typescript', 'vue', 'javascriptreact', 'typescriptreact'];
  // 防抖计时器
  let translateTimer: NodeJS.Timeout | null = null;

  const autoTranslateListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) return;

    // 读取配置
    const userConfig = vscode.workspace.getConfiguration().get('generateCssTree') as any;
    if (!userConfig.autoTranslateVariable) return;

    // 语言过滤
    if (!supportedLangs.includes(editor.document.languageId)) return;

    // 只处理用户输入（不是程序化修改）
    if (event.reason === vscode.TextDocumentChangeReason.Undo ||
        event.reason === vscode.TextDocumentChangeReason.Redo) return;

    for (const change of event.contentChanges) {
      if (!change.text) continue;

      // 获取变化所在行的完整文本
      const line = editor.document.lineAt(change.range.start.line);
      const lineText = line.text;

      // 匹配：const/let/var 后面跟着变量名（纯中文或中英文混合），必须出现 = 才触发翻译
      const varRegex = /^(.*?)\b(const|let|var)\s+([a-zA-Z_$]*[\u4e00-\u9fa5][\u4e00-\u9fa5_a-zA-Z0-9_$]*)\s*=/;
      const match = lineText.match(varRegex);
      if (!match) continue;

      const prefix = match[1];
      const keyword = match[2];     // const/let/var
      const varName = match[3];     // 变量名（可能是纯中文或混合）
      if (!varName || varName.length === 0) continue;

      // 将变量名按中文/英文边界分割成多个部分
      // 例如：测试zzz内容 → ["测试", "zzz", "内容"]
      const segments: Array<{ text: string; isChinese: boolean }> = [];
      let currentSegment = '';
      let currentIsChinese = false;

      for (let i = 0; i < varName.length; i++) {
        const char = varName[i];
        const isChinese = /[\u4e00-\u9fa5]/.test(char);

        if (i === 0) {
          currentSegment = char;
          currentIsChinese = isChinese;
        } else if (isChinese !== currentIsChinese) {
          segments.push({ text: currentSegment, isChinese: currentIsChinese });
          currentSegment = char;
          currentIsChinese = isChinese;
        } else {
          currentSegment += char;
        }
      }
      if (currentSegment) {
        segments.push({ text: currentSegment, isChinese: currentIsChinese });
      }

      if (translateTimer) clearTimeout(translateTimer);

      translateTimer = setTimeout(async () => {
        // 对每个中文段进行翻译
        const translatedSegments: string[] = [];
        const useAI = userConfig.autoTranslateUseAI === true;

        for (const segment of segments) {
          if (!segment.isChinese) {
            // 英文段保留原样（转为小写）
            translatedSegments.push(segment.text.toLowerCase());
            continue;
          }

          // 中文段翻译
          let translated = '';
          if (useAI) {
            try {
              const messages = [
                {
                  role: 'system',
                  content: '将中文变量名翻译为英文 camelCase 变量名。只返回变量名本身，不要任何解释。示例：用户名→userName，价格列表→priceList'
                },
                { role: 'user', content: segment.text }
              ];
              const aiResult = await designToCode.callAI(messages);
              translated = aiResult.trim().replace(/^`+|`+$/g, '').replace(/^['"]|['"]$/g, '');
              if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(translated)) {
                translated = '';
              }
            } catch {
              // AI 失败，fallback 到本地字典
            }
          }

          if (!translated) {
            translated = translateChineseToEnglish(segment.text);
          }

          if (!translated) return;
          translatedSegments.push(translated);
        }

        // 拼接成 camelCase，首字母小写
        let finalEnglishName = translatedSegments[0].toLowerCase();
        for (let i = 1; i < translatedSegments.length; i++) {
          const seg = translatedSegments[i];
          finalEnglishName += seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase();
        }

        // 计算变量名在当前行中的位置
        // 行文本可能有变化，重新读取
        if (editor.document.lineCount <= change.range.start.line) return;
        const currentLine = editor.document.lineAt(change.range.start.line);
        const currentText = currentLine.text;

        // 重新定位变量名
        const kwIndex = currentText.indexOf(keyword);
        if (kwIndex === -1) return;
        const nameStart = kwIndex + keyword.length + 1; // +1 是空格
        if (nameStart >= currentText.length) return;

        // 验证位置上的文本确实是原变量名
        const actualName = currentText.substring(nameStart, nameStart + varName.length);
        if (actualName !== varName) return;

        const startPos = new vscode.Position(change.range.start.line, nameStart);
        const endPos = new vscode.Position(change.range.start.line, nameStart + varName.length);
        const replaceRange = new vscode.Range(startPos, endPos);

        await editor.edit(editBuilder => {
          editBuilder.replace(replaceRange, finalEnglishName);
        });

        vscode.window.setStatusBarMessage(`${varName} → ${finalEnglishName}`, 3000);
      }, 300);
    }
  });
  context.subscriptions.push(autoTranslateListener);
}
