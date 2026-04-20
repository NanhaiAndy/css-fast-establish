import * as vscode from 'vscode';
import * as zhCN from './zh-CN';
import * as en from './en';

let currentStrings: Record<string, string>;

export function initI18n(): void {
  const lang = vscode.env.language || 'zh-CN';
  currentStrings = lang.startsWith('zh') ? zhCN.strings : en.strings;
}

export function t(key: string, ...args: (string | number)[]): string {
  let str = currentStrings[key] || key;
  args.forEach((arg, i) => {
    str = str.replace(`{${i}}`, String(arg));
  });
  return str;
}
