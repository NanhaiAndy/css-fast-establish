import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

interface PackageInfo {
  latest: string;
  description: string;
  weeklyDownloads?: number;
  lastPublish?: string;
}

const cache = new Map<string, { info: PackageInfo; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function fetchPackageInfo(name: string): Promise<PackageInfo | null> {
  return new Promise(resolve => {
    const cached = cache.get(name);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return resolve(cached.info);
    }

    const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
    const client = url.startsWith('https') ? https : http;

    client.get(url, { timeout: 5000 }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { return resolve(null); }

          const distTags = json['dist-tags'] || {};
          const latest = distTags.latest || '';
          const time = json.time || {};
          const lastPublish = time[latest] ? new Date(time[latest]).toLocaleDateString('zh-CN') : '';

          const info: PackageInfo = {
            latest,
            description: json.description || '',
            lastPublish,
          };

          cache.set(name, { info, ts: Date.now() });
          resolve(info);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null))
      .on('timeout', () => resolve(null));
  });
}

export function registerNpmVersionHover(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerHoverProvider(
    { language: 'json', pattern: '**/package.json' },
    {
      async provideHover(document: vscode.TextDocument, position: vscode.Position) {
        const lineText = document.lineAt(position.line).text.trim();

        // match "package-name": "version"
        const match = lineText.match(/^"([^@"][^"]+)":\s*"([^"]*)"/);
        if (!match) { return; }

        const [, name] = match;

        const info = await fetchPackageInfo(name);
        if (!info || !info.latest) { return; }

        const currentVersion = match[2].replace(/^[~^>=<]*/, '');
        const isOutdated = currentVersion !== info.latest;

        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendMarkdown(`**${name}**\n\n`);
        if (info.description) {
          md.appendMarkdown(`${info.description}\n\n`);
        }
        md.appendMarkdown(`最新版本: \`${info.latest}\``);
        if (isOutdated) {
          md.appendMarkdown(` ⚠️ 当前 \`${currentVersion}\` 已过时`);
        }
        if (info.lastPublish) {
          md.appendMarkdown(`\n\n最后发布: ${info.lastPublish}`);
        }

        return new vscode.Hover(md);
      },
    }
  );
  context.subscriptions.push(provider);
}
