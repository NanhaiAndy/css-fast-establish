import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import fetch from 'node-fetch';

/**
 * 工具箱侧边栏提供者
 */
export class ToolboxSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'toolbox-webview';

    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    // 存储表单数据
    private _formData: any = {};
    // 缓存项目信息
    private _cachedProjectInfo: any = null;
    // 记录上次获取信息的工作区路径
    private _lastWorkspacePath: string | null = null;

    constructor(private readonly context: vscode.ExtensionContext, private readonly isCompanyNetwork: boolean = false) {
        this._extensionUri = context.extensionUri || vscode.Uri.file(context.extensionPath);
        
        // 监听工作区变化，以便在工作区改变时清除缓存
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this._cachedProjectInfo = null;
            this._lastWorkspacePath = null;
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri,
                this._extensionUri.with({ path: this._extensionUri.path + '/webview-dist' })
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 监听webview可见性变化
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                // 当webview变为可见时，恢复数据
                // this.restoreFormData();
                // 更新项目信息
                this.updateProjectInfo();
            }
        }, null, this.context.subscriptions);

        // 当webview可见时，获取项目和分支信息
        if (webviewView.visible) {
            this.updateProjectInfo();
        }

        webviewView.webview.onDidReceiveMessage(async (data: any) => {
            switch (data.type) {
                case 'command':
                    vscode.commands.executeCommand(data.command);
                    break;
                case 'saveFormData':
                    // 保存表单数据
                    this._formData = data.data;
                    break;
                case 'showMessage':
                    vscode.window.showInformationMessage(data.message);
                    break;
                case 'examineProject':
                    // 查看项目
                    const projectData = data.data;
                    const url = `https://devops.zbj.com/#/project-detail-app?engineName=${projectData.projectName}`
                    // 打开浏览器
                    vscode.env.openExternal(vscode.Uri.parse(url));
                    break;
                case 'copyName':
                    // 查看内容
                    const branchData = data.data;
                    // 复制
                    const name = branchData.projectName + ':' + branchData.branchName;
                    vscode.env.clipboard.writeText(name);
                    vscode.window.showInformationMessage('复制成功！');
                    break;
            }
        });
    }

    /**
     * 恢复表单数据
     */
    private restoreFormData() {
        if (!this._view) {
            return;
        }

        this._view.webview.postMessage({
            type: 'restoreFormData',
            data: this._formData
        });
    }

    /**
     * 更新项目信息显示
     */
    private async updateProjectInfo() {
        if (!this._view) {
            return;
        }

        // 获取当前工作区路径
        const currentWorkspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || null;
        
        // 检查是否需要重新获取数据
        // if (this._cachedProjectInfo && this._lastWorkspacePath === currentWorkspacePath) {
        //     // 使用缓存的数据
        //     this._view.webview.postMessage({
        //         type: 'updateProjectInfo',
        //         data: this._cachedProjectInfo
        //     });
        //     return;
        // }

        // 获取项目名称
        let projectName = '未知项目';
        const folders = vscode.workspace.workspaceFolders;
        if (folders && folders.length > 0) {
            projectName = path.basename(folders[0].uri.fsPath);
        }

        // 获取Git分支名称
        let branchName = '未知分支';
        try {
            const gitBranch = await this.executeCommand('git rev-parse --abbrev-ref HEAD');
            if (gitBranch) {
                branchName = gitBranch.trim();
            }
        } catch (error) {
            console.error('获取Git分支失败:', error);
        }

        // 获取最近一次提交的作者和时间
        let lastCommitAuthor = '未知作者';
        let lastCommitDate = '未知时间';
        try {
            const commitInfo = await this.executeCommand('git log -1 --pretty=format:"%an|%ad" --date=iso');
            if (commitInfo) {
                const [author, date] = commitInfo.trim().split('|');
                lastCommitAuthor = author || lastCommitAuthor;
                lastCommitDate = date || lastCommitDate;
            }
        } catch (error) {
            console.error('获取最近提交信息失败:', error);
        }

        // 获取项目负责人（默认为最近提交者）
        let projectOwner = lastCommitAuthor;
        try {
            const ownerInfo = await this.executeCommand('git log --pretty=format:"%an|%ae" --reverse | head -1');
            if (ownerInfo) {
                const [ownerName, ownerEmail] = ownerInfo.trim().split('|');
                projectOwner = ownerName || projectOwner;
            }
        } catch (error) {
            console.error('获取项目负责人失败:', error);
        }

        // 获取项目创建时间（第一次提交的时间）
        let projectCreatedDate = '未知时间';
        try {
            const createdInfo = await this.executeCommand('git log --reverse --pretty=format:"%ad" --date=iso | head -1');
            if (createdInfo) {
                projectCreatedDate = createdInfo.trim() || projectCreatedDate;
            }
        } catch (error) {
            console.error('获取项目创建时间失败:', error);
        }

        // 获取总提交次数
        let totalCommits = '未知次数';
        try {
            const commitCount = await this.executeCommand('git rev-list --count HEAD');
            if (commitCount) {
                totalCommits = commitCount.trim() || totalCommits;
            }
        } catch (error) {
            console.error('获取总提交次数失败:', error);
        }

        // 获取当前用户的提交次数
        let currentUserCommits = '未知次数';
        try {
            // 获取当前用户的邮箱
            const userEmail = await this.executeCommand('git config user.email');
            if (userEmail) {
                const email = userEmail.trim();
                // 使用邮箱查询提交次数
                const userCommitCount = await this.executeCommand(`git shortlog -s -n --all --email | grep -i "${email}" | awk '{print $1}'`);
                if (userCommitCount && userCommitCount.trim() !== '') {
                    currentUserCommits = userCommitCount.trim();
                } else {
                    // 如果通过邮箱没找到，尝试使用用户名
                    const userName = await this.executeCommand('git config user.name');
                    if (userName) {
                        const name = userName.trim();
                        const userCommitCountByName = await this.executeCommand(`git shortlog -s -n --all --committer | grep -i "${name}" | awk '{print $1}'`);
                        if (userCommitCountByName && userCommitCountByName.trim() !== '') {
                            currentUserCommits = userCommitCountByName.trim();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('获取当前用户提交次数失败:', error);
        }

        // 缓存项目信息和工作区路径
        this._cachedProjectInfo = {
            projectName: projectName,
            branchName: branchName,
            lastCommitAuthor: lastCommitAuthor,
            lastCommitDate: lastCommitDate,
            projectOwner: projectOwner,
            projectCreatedDate: projectCreatedDate,
            totalCommits: totalCommits,
            currentUserCommits: currentUserCommits
        };
        this._lastWorkspacePath = currentWorkspacePath;

        // 发送消息到webview更新UI
        this._view.webview.postMessage({
            type: 'updateProjectInfo',
            data: this._cachedProjectInfo
        });
    }

    /**
     * 计算目录大小
     * @param path 目录路径
     * @returns 目录大小（字节）
     */
    private getDirSize(path: string): number {
        const fs = require('fs');
        const stats = fs.statSync(path);
        if (stats.isFile()) {
            return stats.size;
        } else if (stats.isDirectory()) {
            const items = fs.readdirSync(path);
            return items.reduce((total: number, item: any) => {
                return total + this.getDirSize(`${path}/${item}`);
            }, 0);
        }
        return 0;
    }

    /**
     * 格式化字节大小
     * @param bytes 字节数
     * @param decimals 保留小数位数
     * @returns 格式化后的大小字符串
     */
    private formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * 执行命令
     * @param command 命令
     * @returns Promise<string>
     */
    private executeCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
            cp.exec(command, { cwd: workspaceFolder }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // 获取构建产物的 URI
        const scriptUri = webview.asWebviewUri(
            this._extensionUri.with({ path: this._extensionUri.path + '/webview-dist/index.js' })
        );

        const styleUri = webview.asWebviewUri(
            this._extensionUri.with({ path: this._extensionUri.path + '/webview-dist/index.css' })
        );

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        // 使用兼容方式获取cspSource
        const cspSource = webview.cspSource || this._extensionUri.toString();

        // 初始化数据（传递给 Vue）
        const initialData = {
            isCompanyNetwork: this.isCompanyNetwork,
            projectInfo: this._cachedProjectInfo || {}
        };

        return `<!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">

                <!--
                    Use a content security policy to only allow loading images from https or from our extension directory,
                    and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} https:; script-src 'nonce-${nonce}';">

                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>前端百宝箱</title>
            </head>
            <body>
                <div id="app"></div>
                <script nonce="${nonce}">
                    // 将初始数据传递给 Vue
                    window.VSCODE_INITIAL_DATA = ${JSON.stringify(initialData)};
                </script>
                <script src="${scriptUri}" nonce="${nonce}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}