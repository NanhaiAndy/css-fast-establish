import * as vscode from 'vscode';
import designToCode from './designToCode';

const getText = function(): string | null {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage('没有激活文本编辑器');
    return null;
  }

  const selection = editor.selection;

  if (!selection) {
    vscode.window.showErrorMessage('请先框选中HTML代码，再选择生成对应的CSS结构');
    return null;
  }

  const selectedText = editor.document.getText(selection);

  if (!selectedText) {
    vscode.window.showErrorMessage('请先框选中HTML代码，再选择生成对应的CSS结构');
    return null;
  }

  return selectedText;
};

const removeVIfElements = function(htmlString: string): string {
  let result = htmlString;

  result = result.replace(/<template[^>]*>([\s\S]*?)<\/template>/g, '$1');

  return result;
};

// 通过AI实现定义class定义（使用 generateCssTree.* 配置）
const aiClassDefinition = async function(htmlString: string, convention?: string): Promise<string> {
  let conventionGuide = '';
  switch (convention) {
    case 'bem':
      conventionGuide = '\n命名规范：使用 BEM 命名法，格式为 block__element--modifier，例如：nav__item--active、header__logo、card__title';
      break;
    case 'cssModules':
      conventionGuide = '\n命名规范：使用 CSS Modules 风格的 camelCase 命名，例如：container、headerTitle、navItem、btnPrimary';
      break;
    case 'tailwind':
      conventionGuide = '\n命名规范：尽量使用 Tailwind CSS 工具类替代自定义 class，如需要自定义 class 则使用 camelCase 短命名，优先使用 flex、grid、gap-4、p-4、text-lg 等工具类';
      break;
    default:
      conventionGuide = '\n命名规范：使用语义化的英文 class 名称';
      break;
  }

  const messages = [
    {
      "role": "system",
      "content": "通过html结构以及备注生成对应class定义或className定义" + conventionGuide
    },
    {
      "role": "user",
      "content": `请根据这些html结构以及备注生成对应class定义或className定义:${htmlString}，生成完成后请返回有class定义或className定义的完整html结构，请勿返回其他内容。`
    }
  ];

  try {
    vscode.window.showInformationMessage('请稍等待正在通过AI生成class名称定义中...');
    const result = await designToCode.callAI(messages);
    return designToCode.removeCodeBlockMarkers(result);
  } catch (error) {
    vscode.window.showErrorMessage(`AI生成class名称失败: ${error}`);
    return htmlString;
  }
};

// 移除字符串前后的代码块标记
const removeCodeBlockMarkers = function(text: string): string {
  // 移除开头的 ```html 或 ```HTML（不区分大小写）
  let result = text.replace(/^```(?:html|HTML)\s*/i, '');
  // 移除结尾的 ```
  result = result.replace(/\s*```$/, '');
  return result;
};

export default {
  getText,
  removeVIfElements,
  aiClassDefinition,
  removeCodeBlockMarkers
};