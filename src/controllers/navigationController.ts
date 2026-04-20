import * as vscode from 'vscode';

import selection from '../selection';
import examinecss from '../examinecss';
import { ControllerDeps } from './types';

export function register(deps: ControllerDeps): void {
  const { context } = deps;

  // 快速查询components的文件
  const cxfindLookModule = vscode.commands.registerCommand('extension.findLookModule', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const lineText = selection.getText();
    if (!lineText) {
      vscode.window.showErrorMessage('请先框选你需要查找的路径,路径必须包含~/或@/前缀');
      return;
    }

    if (lineText.includes('~/') || lineText.includes('@/')) {
        // 获取文本里面的from 后面的内容
        let from = lineText.match(/from\s+['"]([^'"]+)['"]/);
        if (!from) {
          from = ['', lineText]
        }
        // 得到文件路径，全局搜索这个文件，如果搜索到点击就打开对应文件
        // 去掉sitelj里面的~和@符号
        const fromj = from[1].replace(/~|@/g, '');
        // 获取fromj内容里面第一个/后面的内容
        const firstSlashIndex = fromj.indexOf('/');
        if (firstSlashIndex === -1) return null;
        let fromjNamex = fromj.substring(firstSlashIndex + 1);
        // 获取fromjNamex内容里面第一个/前面的内容
        const secondSlashIndex = fromjNamex.indexOf('/', firstSlashIndex + 1);
        if (secondSlashIndex === -1) return null;
        let fromjNamemm = fromjNamex.substring(firstSlashIndex, secondSlashIndex);
        // 获取fromj内容里面最后一个/后面的内容
        const mknr = fromjNamex.match(/.*\/(.*)/)
        if (!mknr) return null;
        let fromjName = mknr[1];

        // 修复：获取工作区根路径
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          return null;
        }
        const workspaceRoot = workspaceFolders[0];
        // 在fsPath这个路径下搜索fromjName这个文件
        // 修改搜索模式，使用更精确的glob模式
        // 判断fromjName是否存在.vue
        if (fromjName.includes('.vue')) {
          // 删除fromjName里面的.vue
          fromjName = fromjName.replace('.vue', '');
        }
        if (fromjName.includes('.js')) {
          // 删除fromjName里面的.vue
          fromjName = fromjName.replace('.js', '');
        }
        if (fromjName.includes('.png')) {
          // 删除fromjName里面的.vue
          fromjName = fromjName.replace('.png', '');
        }
        if (fromjName.includes('.jpg')) {
          // 删除fromjName里面的.vue
          fromjName = fromjName.replace('.jpg', '');
        }
        if (fromjName.includes('.jpeg')) {
          // 删除fromjName里面的.vue
          fromjName = fromjName.replace('.jpeg', '');
        }

        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(workspaceRoot, `**/${fromjName}{,.vue,.ts,.js,.jsx,.tsx,.png,.jpg,.jpeg}`) // 支持常见文件扩展名
        );
        if (files.length === 0) {
          // 提示
          vscode.window.showErrorMessage('抱歉，没有找到对应的路径，无法定位(ˉ▽ˉ；)...,路径必须包含~/或@/前缀');
          return null;
        }

        // 如果找到多个文件，可以优先选择components目录下的文件
        let targetFile = files[0];
        if (files.length > 1) {
          // 优先选择路径中包含 'components' 的文件
          const componentFile = files.find(file => file.path.toLowerCase().includes('/'+fromjNamemm+'/'));
          if (componentFile) {
            targetFile = componentFile;
          }
        }

        // 打开这个文件
        vscode.workspace.openTextDocument(targetFile).then(doc => {
          vscode.window.showTextDocument(doc);
          vscode.window.showInformationMessage('已定位到该文件');
          return null;
        });

    } else {
      vscode.window.showErrorMessage('抱歉，没有找到对应的路径，无法定位(ˉ▽ˉ；)...路径必须包含~/或@/前缀');
    }
  });

  context.subscriptions.push(cxfindLookModule);

  // dubbo接口生成
  const interfaceDefinition = vscode.commands.registerCommand('extension.interfaceDefinition', async () => {
    // 弹出一个输入框
    const connectorName = await vscode.window.showInputBox({
        placeHolder: '请填入接口项目名.服务名.方法名，示例：java-xxx-xxx-api.WorksOrderService.createOrder'
      });

      if (!connectorName) {
        return;
      }

      // 解析connectorName里面的内容，通过.来
      const parts = connectorName.split('.');
      if (parts.length < 3) {
        vscode.window.showErrorMessage(`接口名称格式不正确，需要至少3段（项目名.服务名.方法名），当前只有 ${parts.length} 段。示例：java-xxx-xxx-api.WorksOrderService.createOrder`);
        return;
      }
      const [projectName, apiName, methodName] = parts;
      if (!projectName) {
        vscode.window.showErrorMessage('项目名不能为空，请检查输入格式');
        return;
      }
      if (!apiName) {
        vscode.window.showErrorMessage('服务名不能为空，请检查输入格式');
        return;
      }
      if (!methodName) {
        vscode.window.showErrorMessage('方法名不能为空，请检查输入格式');
        return;
      }

      // 选择请求方式
      const requestPick = await vscode.window.showQuickPick(['GET', 'POST'], {
        placeHolder: '请选择请求方式'
      });

      if (!requestPick) {
        return;
      }

      const request = requestPick.toLowerCase();

      // 生成接口定义
      examinecss.portDefinitionModule(connectorName, request);
  });

  context.subscriptions.push(interfaceDefinition);

  // 通过生成物批量生成dubbo接口定义
  const interfaceFromArtifact = vscode.commands.registerCommand('extension.interfaceDefinitionFromArtifact', async () => {
    await examinecss.interfaceDefinitionFromArtifact();
  });

  context.subscriptions.push(interfaceFromArtifact);

  // 生成mock数据
  const disposableMockAi = vscode.commands.registerCommand('extension.generateMockDataAi', async () => {
    // 弹出一个输入框
    const textContent = await vscode.window.showInputBox({
      placeHolder: '请填入在接口文档复制的接口结构'
    });

    if (!textContent) {
      return;
    }

    const mockData = examinecss.generateMockDataMultiLayer(textContent);
    if (!mockData) {
      return;
    }

    // 把mockData插入到光标处
    vscode.commands.executeCommand('editor.action.insertLineAfter').then(() => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, `const mockData = ${JSON.stringify(mockData, null, 2)}`);
        });
        // 生成完成提醒
        vscode.window.showInformationMessage('mock数据生成完成！');
    });
  });

  context.subscriptions.push(disposableMockAi);
}
