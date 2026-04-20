import * as vscode from 'vscode';

/**
 * 代码片段管理器 - 使用 globalState 持久化
 */

interface Snippet {
  id: string;
  name: string;
  language: string;
  code: string;
  createdAt: number;
  tags?: string[];
  useCount?: number;
  lastUsed?: number;
}

const STORAGE_KEY = 'frontendToolboxSnippets';

// 模板变量正则：${N:default}
const TEMPLATE_VAR_PATTERN = /\$\{(\d+):([^}]*)\}/g;

export class SnippetManager {
  constructor(private context: vscode.ExtensionContext) {}

  private getSnippets(): Snippet[] {
    return this.context.globalState.get<Snippet[]>(STORAGE_KEY, []);
  }

  private async saveSnippets(snippets: Snippet[]): Promise<void> {
    await this.context.globalState.update(STORAGE_KEY, snippets);
  }

  /**
   * 追踪片段使用次数和最后使用时间
   */
  private async trackUsage(snippetId: string): Promise<void> {
    const snippets = this.getSnippets();
    const snippet = snippets.find(s => s.id === snippetId);
    if (snippet) {
      snippet.useCount = (snippet.useCount || 0) + 1;
      snippet.lastUsed = Date.now();
      await this.saveSnippets(snippets);
    }
  }

  /**
   * 解析模板变量并提示用户输入替换值
   * 模板格式：${N:default}，例如 ${1:defaultValue}
   */
  private async resolveTemplateVariables(code: string): Promise<string> {
    const matches: { full: string; index: number; defaultVal: string }[] = [];
    let match: RegExpExecArray | null;

    // 收集所有模板变量匹配
    const regex = new RegExp(TEMPLATE_VAR_PATTERN.source, 'g');
    while ((match = regex.exec(code)) !== null) {
      // 检查是否已存在相同占位符
      const existing = matches.find(m => m.full === match![0]);
      if (!existing) {
        matches.push({
          full: match[0],
          index: parseInt(match[1], 10),
          defaultVal: match[2]
        });
      }
    }

    if (matches.length === 0) {
      return code;
    }

    // 按 index 排序，依次提示用户
    matches.sort((a, b) => a.index - b.index);

    const replacements = new Map<string, string>();

    for (const m of matches) {
      const userInput = await vscode.window.showInputBox({
        placeHolder: `请输入变量 ${m.index} 的值`,
        prompt: `模板变量 \${${m.index}:${m.defaultVal || '无默认值'}}`,
        value: m.defaultVal
      });

      // 用户取消则使用默认值
      replacements.set(m.full, userInput !== undefined ? userInput : m.defaultVal);
    }

    // 替换所有模板变量
    let result = code;
    for (const [full, replacement] of replacements) {
      // 需要转义特殊正则字符
      const escaped = full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), replacement);
    }

    return result;
  }

  /**
   * 保存选中代码为片段
   */
  public async saveSnippet(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selectedText = editor.document.getText(editor.selection);
    if (!selectedText) {
      vscode.window.showErrorMessage('请先选中需要保存的代码片段');
      return;
    }

    const name = await vscode.window.showInputBox({
      placeHolder: '请输入片段名称',
      prompt: '为这段代码起一个便于识别的名称'
    });

    if (!name) return;

    // 可选的标签输入
    const tagsInput = await vscode.window.showInputBox({
      placeHolder: '标签（可选，多个标签用逗号分隔）',
      prompt: '例如: utils, react, hooks'
    });

    const tags: string[] | undefined = tagsInput
      ? tagsInput.split(/[,，]/).map(t => t.trim()).filter(t => t.length > 0)
      : undefined;

    const snippets = this.getSnippets();
    snippets.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      language: editor.document.languageId,
      code: selectedText,
      createdAt: Date.now(),
      ...(tags && tags.length > 0 ? { tags } : {})
    });

    await this.saveSnippets(snippets);
    vscode.window.showInformationMessage(`片段 "${name}" 保存成功！`);
  }

  /**
   * 打开片段管理器 - QuickPick 列表
   */
  public async manageSnippets(): Promise<void> {
    let snippets = this.getSnippets();

    if (snippets.length === 0) {
      vscode.window.showInformationMessage('暂无保存的代码片段，可以通过右键菜单"保存代码片段"来添加');
      return;
    }

    // 按 useCount 降序排序（使用次数多的排前面）
    const sorted = [...snippets].sort((a, b) => (b.useCount || 0) - (a.useCount || 0));

    const items = sorted.map(s => {
      const tagsStr = s.tags && s.tags.length > 0 ? ` · ${s.tags.join(', ')}` : '';
      return {
        label: s.name,
        description: `${s.language} · ${new Date(s.createdAt).toLocaleDateString()}${tagsStr}`,
        detail: s.code.length > 100 ? s.code.substring(0, 100) + '...' : s.code,
        snippet: s
      };
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: '选择一个片段（点击插入，右键可删除）',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selected) return;

    // 提供操作选择
    const action = await vscode.window.showQuickPick(
      [
        { label: '插入到当前光标位置', action: 'insert' },
        { label: '复制到剪贴板', action: 'copy' },
        { label: '删除此片段', action: 'delete' }
      ],
      { placeHolder: `片段: ${selected.label}` }
    );

    if (!action) return;

    switch (action.action) {
      case 'insert': {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const resolvedCode = await this.resolveTemplateVariables(selected.snippet.code);
          await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, resolvedCode);
          });
          await this.trackUsage(selected.snippet.id);
          vscode.window.showInformationMessage(`片段 "${selected.label}" 已插入`);
        }
        break;
      }
      case 'copy':
        const resolvedCode = await this.resolveTemplateVariables(selected.snippet.code);
        await vscode.env.clipboard.writeText(resolvedCode);
        await this.trackUsage(selected.snippet.id);
        vscode.window.showInformationMessage(`片段 "${selected.label}" 已复制到剪贴板`);
        break;
      case 'delete':
        const remaining = snippets.filter(s => s.id !== selected.snippet.id);
        await this.saveSnippets(remaining);
        vscode.window.showInformationMessage(`片段 "${selected.label}" 已删除`);
        break;
    }
  }

  /**
   * 快速插入片段 - 直接选择后插入
   */
  public async quickInsert(): Promise<void> {
    let snippets = this.getSnippets();

    if (snippets.length === 0) {
      vscode.window.showInformationMessage('暂无保存的代码片段');
      return;
    }

    // 按 useCount 降序排序（使用次数多的排前面）
    const sorted = [...snippets].sort((a, b) => (b.useCount || 0) - (a.useCount || 0));

    const items = sorted.map(s => ({
      label: s.name,
      description: s.language,
      detail: s.code.length > 80 ? s.code.substring(0, 80) + '...' : s.code,
      snippet: s
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: '选择要插入的代码片段',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selected) return;

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const resolvedCode = await this.resolveTemplateVariables(selected.snippet.code);
      await editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, resolvedCode);
      });
      await this.trackUsage(selected.snippet.id);
    }
  }

  /**
   * 导出代码片段为 VS Code .code-snippets 格式
   */
  public async exportSnippets(): Promise<void> {
    const snippets = this.getSnippets();

    if (snippets.length === 0) {
      vscode.window.showInformationMessage('暂无代码片段可导出');
      return;
    }

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file('frontend-toolbox-snippets.code-snippets'),
      filters: { 'VS Code Snippets': ['code-snippets'] },
      title: '导出代码片段'
    });

    if (!uri) return;

    // 转为 VS Code snippet 格式
    const vscodeSnippets: Record<string, { prefix: string; body: string[]; description: string; tags?: string[] }> = {};
    for (const s of snippets) {
      const prefix = s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');
      const entry: { prefix: string; body: string[]; description: string; tags?: string[] } = {
        prefix,
        body: s.code.split('\n'),
        description: `${s.language} 代码片段`
      };
      // 仅在 tags 存在且非空时包含
      if (s.tags && s.tags.length > 0) {
        entry.tags = s.tags;
      }
      vscodeSnippets[s.name] = entry;
    }

    const content = JSON.stringify(vscodeSnippets, null, 2);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
    vscode.window.showInformationMessage(`已导出 ${snippets.length} 个代码片段`);
  }

  /**
   * 从 .code-snippets 文件导入代码片段
   */
  public async importSnippets(): Promise<void> {
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectMany: false,
      filters: { 'VS Code Snippets': ['code-snippets', 'json'] },
      title: '导入代码片段'
    });

    if (!uris || uris.length === 0) return;

    try {
      const content = await vscode.workspace.fs.readFile(uris[0]);
      const parsed = JSON.parse(content.toString());

      if (typeof parsed !== 'object' || parsed === null) {
        vscode.window.showErrorMessage('无效的 snippet 文件格式');
        return;
      }

      const existing = this.getSnippets();
      const existingNames = new Set(existing.map(s => s.name));
      let imported = 0;
      let skipped = 0;

      for (const [name, snippetData] of Object.entries(parsed)) {
        const data = snippetData as any;
        if (!data || !data.body) continue;

        if (existingNames.has(name)) {
          skipped++;
          continue;
        }

        const code = Array.isArray(data.body) ? data.body.join('\n') : String(data.body);

        // 解析 tags（如果存在且为数组）
        const parsedTags: string[] | undefined = Array.isArray(data.tags) && data.tags.length > 0
          ? data.tags.map((t: any) => String(t)).filter((t: string) => t.length > 0)
          : undefined;

        existing.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          name,
          language: (data.description || '').replace(' 代码片段', '') || 'plaintext',
          code,
          createdAt: Date.now(),
          ...(parsedTags ? { tags: parsedTags } : {})
        });
        existingNames.add(name);
        imported++;
      }

      await this.saveSnippets(existing);

      let msg = `已导入 ${imported} 个代码片段`;
      if (skipped > 0) {
        msg += `，跳过 ${skipped} 个已存在的片段`;
      }
      vscode.window.showInformationMessage(msg);
    } catch (error) {
      vscode.window.showErrorMessage(`导入失败: ${error}`);
    }
  }
}
