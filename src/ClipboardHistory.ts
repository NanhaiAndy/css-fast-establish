import * as vscode from 'vscode';

interface ClipboardEntry {
  text: string;
  time: number;
  language: string;
}

const MAX_HISTORY = 50;
let history: ClipboardEntry[] = [];
let lastClipboardText = '';
let intervalTimer: ReturnType<typeof setInterval> | null = null;

function getLanguageLabel(text: string): string {
  if (text.match(/^\s*[\{\[]/) && (text.includes('"') || text.includes(':'))) { return 'JSON'; }
  if (text.match(/function\s|=>\s|const\s|let\s|var\s|import\s/)) { return 'JS/TS'; }
  if (text.match(/^[.#@]?[\w-]+\s*\{/m)) { return 'CSS'; }
  if (text.match(/<\w/)) { return 'HTML'; }
  if (text.match(/SELECT|INSERT|UPDATE|DELETE|CREATE\s/i)) { return 'SQL'; }
  return 'Text';
}

function startWatching(): void {
  if (intervalTimer) { return; }
  intervalTimer = setInterval(async () => {
    try {
      const text = await vscode.env.clipboard.readText();
      if (text && text !== lastClipboardText) {
        lastClipboardText = text;
        // skip duplicates
        if (history.length > 0 && history[0].text === text) { return; }
        history.unshift({
          text,
          time: Date.now(),
          language: getLanguageLabel(text),
        });
        if (history.length > MAX_HISTORY) { history.pop(); }
      }
    } catch {
      // ignore clipboard read errors
    }
  }, 1000);
}

export function initClipboardHistory(context: vscode.ExtensionContext): void {
  startWatching();
  context.subscriptions.push({
    dispose: () => {
      if (intervalTimer) { clearInterval(intervalTimer); }
    },
  });
}

export async function showClipboardHistory(): Promise<void> {
  if (history.length === 0) {
    vscode.window.showInformationMessage('剪贴板历史为空，复制一些内容后再试');
    return;
  }

  const items = history.map((entry, i) => {
    const preview = entry.text.replace(/\n/g, ' ').substring(0, 60);
    const timeStr = new Date(entry.time).toLocaleTimeString('zh-CN');
    return {
      label: preview + (entry.text.length > 60 ? '...' : ''),
      description: `[${entry.language}] ${timeStr}`,
      detail: entry.text.split('\n').slice(0, 3).join('\n'),
      index: i,
    };
  });

  const chosen = await vscode.window.showQuickPick(items, {
    placeHolder: '选择要粘贴的剪贴板历史项',
    matchOnDetail: true,
  });

  if (!chosen) { return; }

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    await editor.edit(builder => {
      builder.insert(editor.selection.active, history[chosen.index].text);
    });
  } else {
    await vscode.env.clipboard.writeText(history[chosen.index].text);
    vscode.window.showInformationMessage('已复制到剪贴板');
  }
}

export async function clearClipboardHistory(): Promise<void> {
  history = [];
  vscode.window.showInformationMessage('剪贴板历史已清空');
}
