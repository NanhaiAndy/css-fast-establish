import * as vscode from 'vscode';
import { exec } from 'child_process';

interface BlameInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
}

function getBlame(filePath: string, line: number): Promise<BlameInfo | null> {
  return new Promise(resolve => {
    const cmd = `git blame --porcelain -L ${line},${line} "${filePath}"`;
    exec(cmd, { cwd: vscode.workspace.rootPath, timeout: 3000 }, (err, stdout) => {
      if (err || !stdout) { return resolve(null); }

      const hash = stdout.split('\n')[0]?.split(' ')[0] || '';
      const authorMatch = stdout.match(/^author (.+)$/m);
      const dateMatch = stdout.match(/^author-time (.+)$/m);
      const summaryMatch = stdout.match(/^summary (.+)$/m);

      if (!hash || hash.startsWith('0000000')) { return resolve(null); }

      resolve({
        hash: hash.substring(0, 7),
        author: authorMatch?.[1] || 'Unknown',
        date: dateMatch ? new Date(parseInt(dateMatch[1]) * 1000).toLocaleDateString('zh-CN') : '',
        message: summaryMatch?.[1] || '',
      });
    });
  });
}

export function registerGitBlameHover(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerHoverProvider(
    { scheme: 'file' },
    {
      async provideHover(document: vscode.TextDocument, position: vscode.Position) {
        if (!vscode.workspace.rootPath) { return; }

        const filePath = document.uri.fsPath;
        const line = position.line + 1;

        const info = await getBlame(filePath, line);
        if (!info) { return; }

        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendMarkdown(`**提交记录-Git Blame**\n\n`);
        md.appendMarkdown(`\`${info.hash}\` ${info.author} · ${info.date}\n\n`);
        md.appendMarkdown(`> ${info.message}`);

        return new vscode.Hover(md);
      },
    }
  );
  context.subscriptions.push(provider);
}
