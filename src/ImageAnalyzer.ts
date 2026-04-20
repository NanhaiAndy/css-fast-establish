import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pathModule from 'path';
import * as crypto from 'crypto';

const IMAGE_EXTENSIONS = '{png,jpg,jpeg,gif,svg,webp,ico,bmp}';
const EXCLUDE_PATTERN = '**/node_modules/**';
const LARGE_IMAGE_DEFAULT = 512000; // 500KB

interface ImageInfo {
  path: string;
  relativePath: string;
  size: number;
  hash: string;
}

interface ImageAnalysisResult {
  unusedImages: Array<{ relativePath: string; size: number; sizeFormatted: string }>;
  duplicateImages: Array<{ hash: string; files: string[]; size: number; sizeFormatted: string }>;
  largeImages: Array<{ relativePath: string; size: number; sizeFormatted: string }>;
  totalImages: number;
  scanTime: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 计算 SHA-256 hash，大文件只读前 64KB
function computeFileHash(filePath: string): string {
  const stat = fs.statSync(filePath);
  const hash = crypto.createHash('sha256');

  if (stat.size > 1024 * 1024) {
    // 大于 1MB，只读前 64KB
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(65536);
    fs.readSync(fd, buffer, 0, 65536, 0);
    fs.closeSync(fd);
    hash.update(buffer);
  } else {
    hash.update(fs.readFileSync(filePath));
  }

  return hash.digest('hex');
}

// 限制并发数
async function parallelLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;
  const executing: Promise<void>[] = [];

  async function runNext() {
    while (index < items.length) {
      const item = items[index++];
      executing.push(fn(item));
      if (executing.length >= limit) {
        await Promise.race(executing);
        // 清理已完成的
        for (let i = executing.length - 1; i >= 0; i--) {
          // 简单清理：在下一轮 runNext 中处理
        }
      }
    }
  }

  await runNext();
  await Promise.all(executing);
}

export async function analyze(
  progress?: vscode.Progress<{ message?: string; increment?: number }>,
  token?: vscode.CancellationToken
): Promise<ImageAnalysisResult | null> {
  const startTime = Date.now();

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('请先打开一个工作区');
    return null;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const userConfig = vscode.workspace.getConfiguration().get('generateCssTree') as any;
  const largeThreshold = userConfig.largeImageThreshold || LARGE_IMAGE_DEFAULT;

  // 1. 收集所有图片文件
  if (progress) progress.report({ message: '正在扫描图片文件...' });
  const imageUris = await vscode.workspace.findFiles(
    `**/*.${IMAGE_EXTENSIONS}`,
    `${EXCLUDE_PATTERN},**/.git/**,**/dist/**,**/build/**,**/.vscode-test/**`,
    5000
  );

  if (token?.isCancellationRequested) return null;
  if (imageUris.length === 0) {
    vscode.window.showInformationMessage('未找到图片文件');
    return null;
  }

  if (progress) progress.report({ message: `找到 ${imageUris.length} 个图片文件，正在分析...`, increment: 20 });

  // 2. 读取图片信息并计算 hash
  const images: ImageInfo[] = [];
  const BATCH_SIZE = 50;

  for (let i = 0; i < imageUris.length; i += BATCH_SIZE) {
    if (token?.isCancellationRequested) return null;

    const batch = imageUris.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (uri) => {
      try {
        const fsPath = uri.fsPath;
        const stat = fs.statSync(fsPath);
        const hash = computeFileHash(fsPath);
        images.push({
          path: fsPath,
          relativePath: pathModule.relative(workspaceRoot, fsPath),
          size: stat.size,
          hash
        });
      } catch {
        // 跳过无法读取的文件
      }
    });
    await Promise.all(promises);

    if (progress && i % 100 === 0) {
      progress.report({ message: `已分析 ${Math.min(i + BATCH_SIZE, imageUris.length)}/${imageUris.length} 个图片...`, increment: 30 * BATCH_SIZE / imageUris.length });
    }
  }

  // 3. 扫描代码中的图片引用
  if (progress) progress.report({ message: '正在扫描图片引用...' });
  const codeUris = await vscode.workspace.findFiles(
    `**/*.{vue,html,js,ts,jsx,tsx,css,less,scss,json,md}`,
    `${EXCLUDE_PATTERN}`,
    5000
  );

  // 收集所有被引用的图片文件名（basename）
  const referencedBasenames = new Set<string>();
  const referencedPaths = new Set<string>();

  for (let i = 0; i < codeUris.length; i++) {
    if (token?.isCancellationRequested) return null;

    try {
      const content = fs.readFileSync(codeUris[i].fsPath, 'utf-8');

      // 匹配各种图片引用模式
      const patterns = [
        /(?:src=["']([^"']+\.(?:png|jpe?g|gif|svg|webp|ico|bmp)))["']/gi,
        /(?:url\(["']?([^"')]+\.(?:png|jpe?g|gif|svg|webp|ico|bmp)))["']?\)/gi,
        /(?:import\s+.*?from\s+["']([^"']+\.(?:png|jpe?g|gif|svg|webp)))["']/gi,
        /(?:background(?:-image)?\s*:\s*url\(["']?([^"')]+\.(?:png|jpe?g|gif|svg|webp)))["']?\)/gi,
        /(?:["']([^"']+\.(?:png|jpe?g|gif|svg|webp|ico|bmp)))["']/gi,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const refPath = match[1];
          if (refPath) {
            // 提取 basename
            const basename = pathModule.basename(refPath).split('?')[0].split('#')[0];
            if (basename) {
              referencedBasenames.add(basename.toLowerCase());
            }
            referencedPaths.add(refPath.toLowerCase());
          }
        }
      }
    } catch {
      // 跳过无法读取的文件
    }

    if (progress && i % 200 === 0) {
      progress.report({ message: `已扫描 ${Math.min(i + 100, codeUris.length)}/${codeUris.length} 个代码文件...`, increment: 30 * 100 / codeUris.length });
    }
  }

  // 4. 分析结果
  // 未使用的图片
  const unusedImages = images
    .filter(img => {
      const basename = pathModule.basename(img.relativePath).toLowerCase();
      return !referencedBasenames.has(basename) && !referencedPaths.has(img.relativePath.toLowerCase());
    })
    .map(img => ({
      relativePath: img.relativePath.replace(/\\/g, '/'),
      size: img.size,
      sizeFormatted: formatSize(img.size)
    }));

  // 重复图片（基于 hash）
  const hashMap = new Map<string, ImageInfo[]>();
  for (const img of images) {
    const existing = hashMap.get(img.hash) || [];
    existing.push(img);
    hashMap.set(img.hash, existing);
  }

  const duplicateImages = Array.from(hashMap.entries())
    .filter(([, files]) => files.length > 1)
    .map(([hash, files]) => ({
      hash,
      files: files.map(f => f.relativePath.replace(/\\/g, '/')),
      size: files[0].size,
      sizeFormatted: formatSize(files[0].size)
    }));

  // 大图片
  const largeImages = images
    .filter(img => img.size > largeThreshold)
    .map(img => ({
      relativePath: img.relativePath.replace(/\\/g, '/'),
      size: img.size,
      sizeFormatted: formatSize(img.size)
    }))
    .sort((a, b) => b.size - a.size);

  return {
    unusedImages,
    duplicateImages,
    largeImages,
    totalImages: images.length,
    scanTime: Date.now() - startTime
  };
}

export { formatSize };
