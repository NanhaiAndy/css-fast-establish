import * as vscode from 'vscode';

// 常用 CSS 属性兼容性数据（基于 caniuse 精简版）
const COMPAT_DATA: Record<string, {
  support: Record<string, string>;
  note?: string;
  prefix?: Record<string, string[]>;
}> = {
  'display': {
    support: { flex: 'IE11部分支持', grid: 'IE11部分支持', flow: '较新' },
    note: 'flex/grid 值在旧浏览器中需要前缀',
  },
  'flex': {
    support: { Chrome: '29+', Firefox: '28+', Safari: '9+', Edge: '12+', 'IE': '11部分' },
    prefix: { webkit: ['-webkit-flex'] },
  },
  'flex-direction': {
    support: { Chrome: '29+', Firefox: '28+', Safari: '9+', Edge: '12+', 'IE': '11部分' },
  },
  'flex-wrap': {
    support: { Chrome: '29+', Firefox: '28+', Safari: '9+', Edge: '12+', 'IE': '11部分' },
  },
  'justify-content': {
    support: { Chrome: '29+', Firefox: '28+', Safari: '9+', Edge: '12+', 'IE': '11部分' },
    prefix: { webkit: ['-webkit-justify-content'] },
  },
  'align-items': {
    support: { Chrome: '29+', Firefox: '28+', Safari: '9+', Edge: '12+', 'IE': '11部分' },
  },
  'align-self': {
    support: { Chrome: '29+', Firefox: '28+', Safari: '9+', Edge: '12+', 'IE': '11部分' },
  },
  'order': {
    support: { Chrome: '29+', Firefox: '28+', Safari: '9+', Edge: '12+', 'IE': '11部分' },
  },
  'gap': {
    support: { Chrome: '66+', Firefox: '61+', Safari: '12+', Edge: '79+' },
    note: 'flex gap 在 Safari 14.1+ 才支持',
  },
  'grid-template-columns': {
    support: { Chrome: '57+', Firefox: '52+', Safari: '10.1+', Edge: '16+' },
  },
  'grid-template-rows': {
    support: { Chrome: '57+', Firefox: '52+', Safari: '10.1+', Edge: '16+' },
  },
  'grid-area': {
    support: { Chrome: '57+', Firefox: '52+', Safari: '10.1+', Edge: '16+' },
  },
  'place-items': {
    support: { Chrome: '59+', Firefox: '45+', Safari: '11+', Edge: '79+' },
  },
  'place-content': {
    support: { Chrome: '59+', Firefox: '45+', Safari: '11+', Edge: '79+' },
  },
  'backdrop-filter': {
    support: { Chrome: '76+', Firefox: '103+', Safari: '9+', Edge: '17+' },
    prefix: { webkit: ['-webkit-backdrop-filter'] },
    note: 'Firefox 103+ 才无前缀支持',
  },
  'mask': {
    support: { Chrome: '120+', Firefox: '53+', Safari: '15.4+', Edge: '120+' },
    prefix: { webkit: ['-webkit-mask'] },
    note: 'Safari 需要 -webkit- 前缀',
  },
  'clip-path': {
    support: { Chrome: '55+', Firefox: '54+', Safari: '13.1+', Edge: '79+' },
    prefix: { webkit: ['-webkit-clip-path'] },
  },
  'aspect-ratio': {
    support: { Chrome: '88+', Firefox: '89+', Safari: '15+', Edge: '88+' },
    note: '较新的属性，旧浏览器不支持',
  },
  'container': {
    support: { Chrome: '105+', Firefox: '110+', Safari: '16+', Edge: '105+' },
    note: 'Container Queries，较新的属性',
  },
  'content-visibility': {
    support: { Chrome: '85+', Firefox: '不支持', Safari: '18+', Edge: '85+' },
    note: 'Firefox 目前不支持',
  },
  'has': {
    support: { Chrome: '105+', Firefox: '121+', Safari: '15.4+', Edge: '105+' },
    note: ':has() 选择器兼容性',
  },
  'accent-color': {
    support: { Chrome: '93+', Firefox: '92+', Safari: '15.4+', Edge: '93+' },
  },
  'scroll-snap-type': {
    support: { Chrome: '69+', Firefox: '68+', Safari: '11+', Edge: '79+' },
    prefix: { webkit: ['-webkit-scroll-snap-type'] },
  },
  'overscroll-behavior': {
    support: { Chrome: '63+', Firefox: '59+', Safari: '16+', Edge: '18+' },
    note: 'Safari 16+ 才支持',
  },
  'touch-action': {
    support: { Chrome: '36+', Firefox: '52+', Safari: '13+', Edge: '12+' },
  },
  'user-select': {
    support: { Chrome: '54+', Firefox: '69+', Safari: '3+', Edge: '79+' },
    prefix: { webkit: ['-webkit-user-select'], moz: ['-moz-user-select'] },
  },
  'appearance': {
    support: { Chrome: '84+', Firefox: '80+', Safari: '15.4+', Edge: '84+' },
    prefix: { webkit: ['-webkit-appearance'], moz: ['-moz-appearance'] },
  },
  'writing-mode': {
    support: { Chrome: '48+', Firefox: '41+', Safari: '11+', Edge: '12+' },
    prefix: { webkit: ['-webkit-writing-mode'] },
  },
  'text-orientation': {
    support: { Chrome: '48+', Firefox: '41+', Safari: '11+', Edge: '12+' },
  },
  'inset': {
    support: { Chrome: '87+', Firefox: '66+', Safari: '14.1+', Edge: '87+' },
    note: 'inset 简写属性较新',
  },
  'color-mix': {
    support: { Chrome: '111+', Firefox: '113+', Safari: '16.2+', Edge: '111+' },
    note: 'CSS 颜色混合函数，非常新',
  },
  'text-wrap': {
    support: { Chrome: '114+', Firefox: '121+', Safari: '17.4+', Edge: '114+' },
    note: 'text-wrap: balance/pretty 较新',
  },
  'view-transition-name': {
    support: { Chrome: '111+', Firefox: '不支持', Safari: '18+', Edge: '111+' },
    note: 'View Transitions API',
  },
  'animation-timeline': {
    support: { Chrome: '115+', Firefox: '不支持', Safari: '不支持', Edge: '115+' },
    note: 'Scroll-driven animations，实验性',
  },
};

export function registerCssCompatHover(context: vscode.ExtensionContext): void {
  const selector = [
    { language: 'css' },
    { language: 'less' },
    { language: 'scss' },
    { language: 'vue' },
  ];

  const provider = vscode.languages.registerHoverProvider(selector, {
    provideHover(document: vscode.TextDocument, position: vscode.Position) {
      const range = document.getWordRangeAtPosition(position, /[\w-]+/);
      if (!range) { return; }

      const word = document.getText(range);

      // check if the word is actually a CSS property (before a colon)
      const line = document.lineAt(position.line).text;
      const linePrefix = line.substring(0, range.start.character);
      const lineSuffix = line.substring(range.end.character);

      // Must be at property position: beginning of line (with optional whitespace) and followed by :
      if (!linePrefix.match(/^\s*$/) || !lineSuffix.match(/^\s*:/)) {
        return;
      }

      const data = COMPAT_DATA[word];
      if (!data) { return; }

      const md = new vscode.MarkdownString();
      md.isTrusted = true;
      md.appendMarkdown(`**${word}** 兼容性\n\n`);

      if (data.support) {
        md.appendMarkdown('| 浏览器 | 版本 |\n|---|---|\n');
        for (const [browser, version] of Object.entries(data.support)) {
          md.appendMarkdown(`| ${browser} | ${version} |\n`);
        }
      }

      if (data.prefix) {
        md.appendMarkdown('\n**前缀:**\n');
        for (const [, prefixes] of Object.entries(data.prefix)) {
          for (const p of prefixes) {
            md.appendMarkdown(`- \`${p}\`\n`);
          }
        }
      }

      if (data.note) {
        md.appendMarkdown(`\n> ${data.note}`);
      }

      return new vscode.Hover(md, range);
    },
  });

  context.subscriptions.push(provider);
}
