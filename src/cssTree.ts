import { InterfaceNode } from 'document-tree/lib/generate';

interface InterfaceHandledKeys {
  [key: string]: boolean;
}

const getCssKey = (node: InterfaceNode) => {
  // let cssKey = node.tagName;
  // 去掉cssKey这个字符串里面的相关标签比如dev，span标签这些
  let cssKey = ''
  const labelType = node.attributes.id || node.attributes.class || node.attributes.classname || '';
  // 如果当前这个节点标签没有设置任何名称或者id，那么就使用标签名
  if (!labelType) {
    cssKey = node.tagName
  }
  if (node.attributes.id) {
    cssKey += `#${node.attributes.id}`;
  }
  if (node.attributes.class) {
    cssKey += `.${node.attributes.class.split(' ').join('.')}`;
  }
  if (node.attributes.classname) {
    cssKey += `.${node.attributes.classname.split(' ').join('.')}`;
  }

  return cssKey;
};

const getUniqueNodes = (nodes: InterfaceNode[]) => {
  const handledKeys: InterfaceHandledKeys = {};

  return nodes.filter(childNode => {
    const childCssKey = getCssKey(childNode);

    // 这里要做一下处理特别是可能会把页面注释内容也当一个节点处理所以可能存在undefined的可能
    if (!childCssKey) {
      return false;
    }
    if (handledKeys[childCssKey]) {
      return false;
    }

    handledKeys[childCssKey] = true;

    return true;
  });
};

const parsePreprocessorNode = (node: InterfaceNode, level: number): string => {
  const cssKey = getCssKey(node);

  let spaceBefore = '';
  for (let i = 0; i < level; i += 1) {
    spaceBefore += '  ';
  }

  let cssTree = `${spaceBefore}${cssKey} {`;
  cssTree += '\n';
  cssTree += getUniqueNodes(node.children)
    .map(childNode => parsePreprocessorNode(childNode, level + 1))
    .join('\n\n');
  cssTree += '\n';
  cssTree += `${spaceBefore}}`;

  return cssTree;
};

const parseCssNode = (node: InterfaceNode, parentKey: string = ''): string => {
  const cssKey = getCssKey(node);

  let computedKey = '';
  if (parentKey) {
    computedKey += `${parentKey} `;
  }
  computedKey += cssKey;

  let cssTree = '';
  cssTree += `${computedKey} {\n\n}`;
  cssTree += '\n\n';
  cssTree += getUniqueNodes(node.children)
    .map(childNode => parseCssNode(childNode, computedKey))
    .join('\n\n');

  return cssTree;
};

const generate = (tree: InterfaceNode[], { isCss = false } = {}) => {
  const cssTree = getUniqueNodes(tree)
    .map(node => (isCss ? parseCssNode(node) : parsePreprocessorNode(node, 0)))
    .join('\n\n');

  return cssTree;
};

export default generate;
