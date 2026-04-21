import * as vscode from 'vscode';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

let server: http.Server | null = null;
let serverPort = 0;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
};

export async function startStaticServer(): Promise<void> {
  if (server) {
    const action = await vscode.window.showInformationMessage(
      `静态服务器已在运行: http://localhost:${serverPort}`,
      '打开浏览器',
      '停止服务器'
    );
    if (action === '打开浏览器') {
      vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${serverPort}`));
    } else if (action === '停止服务器') {
      stopServer();
    }
    return;
  }

  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    vscode.window.showErrorMessage('请先打开一个工作区');
    return;
  }

  const rootPath = folders[0].uri.fsPath;

  const portInput = await vscode.window.showInputBox({
    placeHolder: '8080',
    prompt: '输入端口号（默认 8080）',
    validateInput: v => {
      if (v && (isNaN(Number(v)) || Number(v) < 1 || Number(v) > 65535)) {
        return '请输入 1-65535 之间的端口号';
      }
      return null;
    }
  });

  const port = portInput ? parseInt(portInput) : 8080;

  server = http.createServer((req, res) => {
    let urlPath = req.url?.split('?')[0] || '/';
    if (urlPath === '/') { urlPath = '/index.html'; }

    const filePath = path.join(rootPath, decodeURIComponent(urlPath));

    if (!filePath.startsWith(rootPath)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      vscode.window.showErrorMessage(`端口 ${port} 已被占用，请换个端口`);
      server = null;
    }
  });

  server.listen(port, () => {
    serverPort = port;
    const action = vscode.window.showInformationMessage(
      `静态服务器已启动: http://localhost:${port}`,
      '打开浏览器',
      '停止服务器'
    );
    action.then(choice => {
      if (choice === '打开浏览器') {
        vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${port}`));
      } else if (choice === '停止服务器') {
        stopServer();
      }
    });
  });
}

export function stopServer(): void {
  if (server) {
    server.close();
    server = null;
    serverPort = 0;
    vscode.window.showInformationMessage('静态服务器已停止');
  }
}
