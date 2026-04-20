/**
 * 中文代码片段触发器
 * 输入中文关键词（如"判断"）→ 自动提示对应代码片段
 */

import * as vscode from 'vscode';

interface ChineseSnippet {
  keyword: string;
  label: string;
  description: string;
  code: string;
  languages: string[];
}

/**
 * 中文关键词 → 代码片段映射
 */
const CHINESE_SNIPPETS: ChineseSnippet[] = [
  // 条件判断
  {
    keyword: '判断',
    label: 'if 判断',
    description: 'if 条件判断语句',
    code: 'if (${1:condition}) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '否则',
    label: 'else 否则',
    description: 'else 否则分支',
    code: 'else {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '否则如果',
    label: 'else if',
    description: 'else if 条件分支',
    code: 'else if (${1:condition}) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '三元',
    label: '三元表达式',
    description: '条件三元运算符',
    code: '${1:condition} ? ${2:trueValue} : ${3:falseValue}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '开关',
    label: 'switch 开关',
    description: 'switch 多分支选择',
    code: 'switch (${1:expression}) {\n  case ${2:value}:\n    ${0}\n    break;\n  default:\n    break;\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // 循环
  {
    keyword: '循环',
    label: 'for 循环',
    description: '基础 for 循环',
    code: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '遍历',
    label: 'for...of 遍历',
    description: 'for...of 数组遍历',
    code: 'for (const ${1:item} of ${2:array}) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '键遍历',
    label: 'for...in 键遍历',
    description: 'for...in 对象键遍历',
    code: 'for (const ${1:key} in ${2:object}) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '当',
    label: 'while 当循环',
    description: 'while 条件循环',
    code: 'while (${1:condition}) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '做',
    label: 'do...while',
    description: 'do...while 先执行后判断',
    code: 'do {\n  ${0}\n} while (${1:condition});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: 'forEach',
    label: 'forEach 遍历',
    description: '数组 forEach 方法',
    code: '${1:array}.forEach((${2:item}) => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '映射',
    label: 'map 映射',
    description: '数组 map 转换',
    code: '${1:array}.map((${2:item}) => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '过滤',
    label: 'filter 过滤',
    description: '数组 filter 过滤',
    code: '${1:array}.filter((${2:item}) => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '查找',
    label: 'find 查找',
    description: '数组 find 查找',
    code: '${1:array}.find((${2:item}) => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '归约',
    label: 'reduce 归约',
    description: '数组 reduce 累计',
    code: '${1:array}.reduce((${2:acc}, ${3:item}) => {\n  ${0}\n}, ${4:initialValue});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // 函数
  {
    keyword: '函数',
    label: 'function 函数',
    description: '命名函数声明',
    code: 'function ${1:name}(${2:params}) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '箭头',
    label: '箭头函数',
    description: '箭头函数表达式',
    code: 'const ${1:name} = (${2:params}) => {\n  ${0}\n};',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '匿名',
    label: '匿名函数',
    description: '匿名函数',
    code: 'function (${1:params}) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '异步',
    label: 'async 异步函数',
    description: 'async 异步函数',
    code: 'async function ${1:name}(${2:params}) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '箭头异步',
    label: 'async 箭头函数',
    description: '异步箭头函数',
    code: 'const ${1:name} = async (${2:params}) => {\n  ${0}\n};',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '立即',
    label: 'IIFE 立即执行',
    description: '立即执行函数表达式',
    code: '(function () {\n  ${0}\n})();',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // 类与对象
  {
    keyword: '类',
    label: 'class 类',
    description: 'ES6 class 类定义',
    code: 'class ${1:ClassName} {\n  constructor(${2:params}) {\n    ${0}\n  }\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '对象',
    label: '对象字面量',
    description: '对象字面量',
    code: 'const ${1:name} = {\n  ${2:key}: ${3:value},\n};',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '解构',
    label: '解构赋值',
    description: '对象/数组解构',
    code: 'const { ${1:prop1}, ${2:prop2} } = ${3:object};',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '展开',
    label: '展开运算符',
    description: '对象/数组展开',
    code: 'const ${1:newObj} = { ...${2:oldObj} };',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // 异常处理
  {
    keyword: '尝试',
    label: 'try-catch 尝试',
    description: 'try-catch 异常捕获',
    code: 'try {\n  ${0}\n} catch (${1:error}) {\n  // handle error\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '抛出',
    label: 'throw 抛出',
    description: 'throw 抛出异常',
    code: 'throw new ${1:Error}(${2:message});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '最终',
    label: 'finally 最终',
    description: 'finally 最终执行',
    code: 'try {\n  ${0}\n} finally {\n  // cleanup\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // 定时器
  {
    keyword: '定时器',
    label: 'setTimeout 定时器',
    description: '延时执行',
    code: 'setTimeout(() => {\n  ${0}\n}, ${1:1000});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '间隔',
    label: 'setInterval 间隔',
    description: '定时重复执行',
    code: 'setInterval(() => {\n  ${0}\n}, ${1:1000});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '延时',
    label: 'sleep 延时',
    description: 'Promise 延时函数',
    code: 'const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));\nawait sleep(${1:1000});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // DOM 事件
  {
    keyword: '监听',
    label: 'addEventListener 监听',
    description: '事件监听器',
    code: '${1:element}.addEventListener(\'${2:event}\', (${3:event}) => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '移除监听',
    label: 'removeEventListener',
    description: '移除事件监听',
    code: '${1:element}.removeEventListener(\'${2:event}\', ${3:handler});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '点击',
    label: 'click 点击事件',
    description: '点击事件处理',
    code: '${1:element}.addEventListener(\'click\', (${2:event}) => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '提交',
    label: 'submit 提交事件',
    description: '表单提交事件',
    code: '${1:form}.addEventListener(\'submit\', (${2:event}) => {\n  ${2:event}.preventDefault();\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '输入',
    label: 'input 输入事件',
    description: '输入框输入事件',
    code: '${1:input}.addEventListener(\'input\', (${2:event}) => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '加载',
    label: 'load 加载事件',
    description: '资源加载完成',
    code: 'window.addEventListener(\'load\', () => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '滚动',
    label: 'scroll 滚动事件',
    description: '滚动事件',
    code: 'window.addEventListener(\'scroll\', () => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '调整',
    label: 'resize 调整事件',
    description: '窗口调整大小',
    code: 'window.addEventListener(\'resize\', () => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // Promise & Async
  {
    keyword: '承诺',
    label: 'Promise 承诺',
    description: 'Promise 对象',
    code: 'new Promise((resolve, reject) => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '等待',
    label: 'await 等待',
    description: 'await 异步等待',
    code: 'const ${1:result} = await ${2:promise};',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '全等',
    label: 'Promise.all',
    description: '并行执行多个 Promise',
    code: 'const ${1:results} = await Promise.all([${2:promise1}, ${3:promise2}]);',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '竞速',
    label: 'Promise.race',
    description: '返回最快完成的 Promise',
    code: 'const ${1:result} = await Promise.race([${2:promise1}, ${3:promise2}]);',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // JSON & 数据
  {
    keyword: '解析',
    label: 'JSON.parse',
    description: '解析 JSON 字符串',
    code: 'const ${1:data} = JSON.parse(${2:jsonString});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '序列化',
    label: 'JSON.stringify',
    description: '序列化为 JSON',
    code: 'const ${1:json} = JSON.stringify(${2:object});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // TypeScript 专用
  {
    keyword: '接口',
    label: 'interface 接口',
    description: 'TypeScript 接口定义',
    code: 'interface ${1:Name} {\n  ${2:prop}: ${3:type};\n}',
    languages: ['typescript', 'typescriptreact', 'vue']
  },
  {
    keyword: '类型',
    label: 'type 类型别名',
    description: 'TypeScript 类型别名',
    code: 'type ${1:Name} = ${2:type};',
    languages: ['typescript', 'typescriptreact', 'vue']
  },
  {
    keyword: '枚举',
    label: 'enum 枚举',
    description: 'TypeScript 枚举',
    code: 'enum ${1:Name} {\n  ${2:Key} = ${3:value},\n}',
    languages: ['typescript', 'typescriptreact', 'vue']
  },
  {
    keyword: '泛型',
    label: '泛型函数',
    description: '泛型函数定义',
    code: 'function ${1:name}<${2:T}>(${3:param}: ${2:T}): ${2:T} {\n  ${0}\n}',
    languages: ['typescript', 'typescriptreact', 'vue']
  },

  // React 专用
  {
    keyword: '组件',
    label: 'React 组件',
    description: 'React 函数组件',
    code: 'function ${1:ComponentName}({ ${2:props} }) {\n  return (\n    <div>\n      ${0}\n    </div>\n  );\n}',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '效应',
    label: 'useEffect 效应',
    description: 'React useEffect Hook',
    code: 'useEffect(() => {\n  ${0}\n}, [${2:deps}]);',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '状态',
    label: 'useState 状态',
    description: 'React useState Hook',
    code: 'const [${1:state}, ${1:state}Set] = useState(${2:initialValue});',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '引用',
    label: 'useRef 引用',
    description: 'React useRef Hook',
    code: 'const ${1:ref} = useRef(${2:initialValue});',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '回调',
    label: 'useCallback 回调',
    description: 'React useCallback Hook',
    code: 'const ${1:callback} = useCallback(() => {\n  ${0}\n}, [${2:deps}]);',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '记忆',
    label: 'useMemo 记忆',
    description: 'React useMemo Hook',
    code: 'const ${1:memoizedValue} = useMemo(() => {\n  ${0}\n}, [${2:deps}]);',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '上下文',
    label: 'useContext 上下文',
    description: 'React useContext Hook',
    code: 'const ${1:value} = useContext(${2:MyContext});',
    languages: ['javascriptreact', 'typescriptreact']
  },

  // Vue 专用
  {
    keyword: '响应',
    label: 'ref 响应式',
    description: 'Vue ref 响应式引用',
    code: 'const ${1:ref} = ref(${2:initialValue});',
    languages: ['vue']
  },
  {
    keyword: '计算',
    label: 'computed 计算属性',
    description: 'Vue computed 计算属性',
    code: 'const ${1:computed} = computed(() => {\n  ${0}\n});',
    languages: ['vue']
  },
  {
    keyword: '监听属性',
    label: 'watch 监听',
    description: 'Vue watch 监听器',
    code: 'watch(${1:source}, (${2:newVal}, ${3:oldVal}) => {\n  ${0}\n});',
    languages: ['vue']
  },
  {
    keyword: '周期',
    label: 'onMounted 生命周期',
    description: 'Vue onMounted 生命周期',
    code: 'onMounted(() => {\n  ${0}\n});',
    languages: ['vue']
  },

  // 导入导出
  {
    keyword: '导入',
    label: 'import 导入',
    description: 'ES6 import 导入',
    code: 'import { ${1:name} } from \'${2:module}\';',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '默认导入',
    label: '默认导入',
    description: '导入默认导出',
    code: 'import ${1:name} from \'${2:module}\';',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '导出',
    label: 'export 导出',
    description: 'ES6 export 导出',
    code: 'export { ${1:name} };',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '默认导出',
    label: '默认导出',
    description: '默认导出声明',
    code: 'export default ${1:name};',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // 注释
  {
    keyword: '单注',
    label: '单行注释',
    description: '// 单行注释',
    code: '// ${0:comment}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '多注',
    label: '多行注释',
    description: '/* 多行注释 */',
    code: '/*\n * ${0:comment}\n */',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '文档',
    label: 'JSDoc 文档注释',
    description: 'JSDoc 格式文档注释',
    code: '/**\n * ${0:description}\n * @param {Type} param - description\n * @returns {Type} description\n */',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // 调试
  {
    keyword: '日志',
    label: 'console.log',
    description: '控制台日志输出',
    code: 'console.log(${1:value});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '警告',
    label: 'console.warn',
    description: '控制台警告',
    code: 'console.warn(${1:message});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '错误',
    label: 'console.error',
    description: '控制台错误',
    code: 'console.error(${1:error});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '表格',
    label: 'console.table',
    description: '表格形式输出',
    code: 'console.table(${1:data});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // 常用工具
  {
    keyword: '深拷',
    label: '深拷贝',
    description: 'JSON 深拷贝',
    code: 'const ${1:copy} = JSON.parse(JSON.stringify(${2:original}));',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '去重',
    label: '数组去重',
    description: '数组去重',
    code: 'const ${1:unique} = [...new Set(${2:array})];',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '判断空',
    label: '判空',
    description: '判断是否为空',
    code: 'if (!${1:value} || ${1:value}.length === 0) {\n  ${0}\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // ========== 数组操作（补全） ==========
  {
    keyword: '合并',
    label: '数组合并',
    description: '展开符合并两个数组',
    code: 'const ${1:merged} = [...${2:arr1}, ...${3:arr2}];',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '切片',
    label: 'array.slice',
    description: '数组切片',
    code: 'const ${1:sliced} = ${2:array}.slice(${3:start}, ${4:end});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '拼接',
    label: 'array.join',
    description: '数组拼接为字符串',
    code: 'const ${1:joined} = ${2:array}.join(\'${3:, }\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '排序',
    label: 'array.sort',
    description: '数组排序',
    code: '${1:array}.sort((${2:a}, ${3:b}) => ${2:a} - ${3:b});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '反转',
    label: 'array.reverse',
    description: '数组反转',
    code: 'const ${1:reversed} = [...${2:array}].reverse();',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '扁平化',
    label: 'array.flat',
    description: '多维数组扁平化',
    code: 'const ${1:flat} = ${2:array}.flat(${3:Infinity});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '包含',
    label: 'array.includes',
    description: '判断数组是否包含某元素',
    code: 'const ${1:has} = ${2:array}.includes(${3:item});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '查找索引',
    label: 'array.findIndex',
    description: '查找满足条件的元素索引',
    code: 'const ${1:index} = ${2:array}.findIndex((${3:item}) => ${0});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '每个',
    label: 'array.every',
    description: '判断是否全部满足条件',
    code: 'const ${1:allMatch} = ${2:array}.every((${3:item}) => ${0});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '某个',
    label: 'array.some',
    description: '判断是否任一满足条件',
    code: 'const ${1:anyMatch} = ${2:array}.some((${3:item}) => ${0});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // ========== 字符串处理 ==========
  {
    keyword: '转大写',
    label: 'toUpperCase',
    description: '字符串转大写',
    code: '${1:str}.toUpperCase()',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '转小写',
    label: 'toLowerCase',
    description: '字符串转小写',
    code: '${1:str}.toLowerCase()',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '首字母大写',
    label: '首字母大写',
    description: '字符串首字母大写',
    code: '${1:str}.charAt(0).toUpperCase() + ${1:str}.slice(1)',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '修剪',
    label: 'trim',
    description: '去除首尾空白',
    code: '${1:str}.trim()',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '替换',
    label: 'replace',
    description: '字符串替换',
    code: '${1:str}.replace(${2:/pattern/g}, ${3:\'replacement\'});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '分割',
    label: 'split',
    description: '字符串分割为数组',
    code: 'const ${1:parts} = ${2:str}.split(\'${3:, }\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '截取',
    label: 'substring',
    description: '字符串截取',
    code: '${1:str}.substring(${2:start}, ${3:end})',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '模板字符串',
    label: '模板字符串',
    description: '模板字面量插值',
    code: '`\${${1:variable}}`',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // ========== 请求 / API ==========
  {
    keyword: '获取',
    label: 'fetch GET',
    description: 'fetch GET 请求',
    code: 'const ${1:response} = await fetch(\'${2:url}\');\nconst ${3:data} = await ${1:response}.json();',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '发送数据',
    label: 'fetch POST',
    description: 'fetch POST 请求',
    code: 'const ${1:response} = await fetch(\'${2:url}\', {\n  method: \'POST\',\n  headers: { \'Content-Type\': \'application/json\' },\n  body: JSON.stringify(${3:data}),\n});\nconst ${4:result} = await ${1:response}.json();',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: 'GET',
    label: 'axios.get',
    description: 'axios GET 请求',
    code: 'const { data: ${1:data} } = await axios.get(\'${2:url}\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: 'POST',
    label: 'axios.post',
    description: 'axios POST 请求',
    code: 'const { data: ${1:data} } = await axios.post(\'${2:url}\', ${3:payload});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '上传',
    label: 'FormData 上传',
    description: 'FormData 文件上传',
    code: 'const ${1:formData} = new FormData();\n${1:formData}.append(\'${2:file}\', ${3:file});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // ========== 工具函数 ==========
  {
    keyword: '节流',
    label: '节流函数',
    description: 'throttle 节流（固定间隔执行）',
    code: 'function throttle(fn, delay) {\n  let timer = null;\n  return function (...args) {\n    if (timer) return;\n    timer = setTimeout(() => {\n      fn.apply(this, args);\n      timer = null;\n    }, delay);\n  };\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '防抖',
    label: '防抖函数',
    description: 'debounce 防抖（延迟到最后一次执行）',
    code: 'function debounce(fn, delay) {\n  let timer = null;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '随机数',
    label: '随机整数',
    description: '生成指定范围随机整数',
    code: 'Math.floor(Math.random() * ${1:max})',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: 'UUID',
    label: 'crypto.randomUUID',
    description: '生成 UUID',
    code: 'crypto.randomUUID()',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '格式化日期',
    label: '格式化日期',
    description: 'Date 转本地日期字符串',
    code: 'new Date(${1:timestamp}).toLocaleDateString(\'zh-CN\')',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '格式化JSON',
    label: 'JSON 格式化',
    description: '带缩进的 JSON 序列化',
    code: 'JSON.stringify(${1:obj}, null, 2)',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '柯里化',
    label: '柯里化',
    description: '函数柯里化',
    code: 'const ${1:curry} = (${2:fn}) => {\n  const curried = (...args) =>\n    args.length >= ${2:fn}.length\n      ? ${2:fn}(...args)\n      : (...more) => curried(...args, ...more);\n  return curried;\n};',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // ========== 表单处理 ==========
  {
    keyword: '受控输入',
    label: '受控输入',
    description: 'React 受控输入',
    code: '<input\n  value={${1:value}}\n  onChange={(e) => ${2:setValue}(e.target.value)}\n/>',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '阻止默认',
    label: 'preventDefault',
    description: '阻止默认行为',
    code: '${1:e}.preventDefault();',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '停止冒泡',
    label: 'stopPropagation',
    description: '阻止事件冒泡',
    code: '${1:e}.stopPropagation();',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '获取值',
    label: 'e.target.value',
    description: '从事件对象获取值',
    code: 'const ${1:value} = ${2:e}.target.value;',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '表单提交',
    label: 'onSubmit',
    description: 'React 表单提交处理',
    code: '<form onSubmit={${1:handleSubmit}}>\n  ${0}\n</form>',
    languages: ['javascriptreact', 'typescriptreact']
  },

  // ========== 路由 ==========
  {
    keyword: '路由跳转',
    label: 'useNavigate',
    description: 'React Router 路由跳转',
    code: 'const navigate = useNavigate();\nnavigate(\'${1:/path}\');',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '路由链接',
    label: 'Link',
    description: 'React Router 链接',
    code: '<Link to="${1:/path}">${0:链接文本}</Link>',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '路由参数',
    label: 'useParams',
    description: 'React Router 路由参数',
    code: 'const { ${1:id} } = useParams();',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '查询参数',
    label: 'useSearchParams',
    description: 'React Router 查询参数',
    code: 'const [${1:searchParams}, ${2:setSearchParams}] = useSearchParams();\nconst ${3:value} = ${1:searchParams}.get(\'${4:key}\');',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: 'Vue路由跳转',
    label: 'router.push',
    description: 'Vue Router 路由跳转',
    code: 'router.push(\'${1:/path}\');',
    languages: ['vue']
  },
  {
    keyword: 'Vue路由参数',
    label: '$route.params',
    description: 'Vue Router 获取路由参数',
    code: 'const ${1:id} = route.params.${1:id};',
    languages: ['vue']
  },

  // ========== 存储 ==========
  {
    keyword: '存储',
    label: 'localStorage.setItem',
    description: '本地存储写入',
    code: 'localStorage.setItem(\'${1:key}\', JSON.stringify(${2:value}));',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '读取',
    label: 'localStorage.getItem',
    description: '本地存储读取',
    code: 'const ${1:data} = JSON.parse(localStorage.getItem(\'${2:key}\') || \'null\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '删除',
    label: 'localStorage.removeItem',
    description: '本地存储删除',
    code: 'localStorage.removeItem(\'${1:key}\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '清空',
    label: 'localStorage.clear',
    description: '清空本地存储',
    code: 'localStorage.clear();',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '会话存储',
    label: 'sessionStorage.setItem',
    description: '会话存储写入',
    code: 'sessionStorage.setItem(\'${1:key}\', JSON.stringify(${2:value}));',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '会话读取',
    label: 'sessionStorage.getItem',
    description: '会话存储读取',
    code: 'const ${1:data} = JSON.parse(sessionStorage.getItem(\'${2:key}\') || \'null\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // ========== 正则表达式 ==========
  {
    keyword: '正则匹配',
    label: 'String.match',
    description: '字符串正则匹配',
    code: 'const ${1:matches} = ${2:str}.match(${3:/pattern/g});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '正则测试',
    label: 'RegExp.test',
    description: '正则测试是否匹配',
    code: 'const ${1:isMatch} = ${2:/pattern/}.test(${3:str});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '正则替换',
    label: 'String.replace',
    description: '正则全局替换',
    code: 'const ${1:result} = ${2:str}.replace(${3:/pattern/g}, ${4:\'replacement\'});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '邮箱正则',
    label: '邮箱验证',
    description: '常用邮箱正则',
    code: '/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${1:email})',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '手机正则',
    label: '手机号验证',
    description: '中国大陆手机号正则',
    code: '/^1[3-9]\\d{9}$/.test(${1:phone})',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '中文字正则',
    label: '中文字符检测',
    description: '检测是否包含中文字符',
    code: '/[\\u4e00-\\u9fa5]/.test(${1:str})',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: 'URL正则',
    label: 'URL 验证',
    description: 'URL 格式验证',
    code: '/^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+/.test(${1:url})',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // ========== DOM 操作 ==========
  {
    keyword: '获取元素',
    label: 'querySelector',
    description: '获取单个 DOM 元素',
    code: 'document.querySelector(\'${1:.selector}\')',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '获取全部',
    label: 'querySelectorAll',
    description: '获取所有匹配的 DOM 元素',
    code: 'document.querySelectorAll(\'${1:.selector}\')',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '创建元素',
    label: 'createElement',
    description: '创建 DOM 元素',
    code: 'const ${1:el} = document.createElement(\'${2:div}\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '设置内容',
    label: 'textContent',
    description: '设置元素文本内容',
    code: '${1:element}.textContent = ${2:\'text\'};',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '设置HTML',
    label: 'innerHTML',
    description: '设置元素 HTML',
    code: '${1:element}.innerHTML = ${2:\'<div></div>\'};',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '添加类名',
    label: 'classList.add',
    description: '添加 CSS 类名',
    code: '${1:element}.classList.add(\'${2:className}\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '移除类名',
    label: 'classList.remove',
    description: '移除 CSS 类名',
    code: '${1:element}.classList.remove(\'${2:className}\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '切换类名',
    label: 'classList.toggle',
    description: '切换 CSS 类名',
    code: '${1:element}.classList.toggle(\'${2:className}\');',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '获取属性',
    label: 'getAttribute',
    description: '获取元素属性值',
    code: '${1:element}.getAttribute(\'${2:attr}\')',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '设置属性',
    label: 'setAttribute',
    description: '设置元素属性',
    code: '${1:element}.setAttribute(\'${2:attr}\', ${3:\'value\'});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // ========== 测试相关 ==========
  {
    keyword: '测试套件',
    label: 'describe 测试套件',
    description: 'Jest/Vitest describe 块',
    code: 'describe(\'${1:模块名}\', () => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '测试用例',
    label: 'test 测试用例',
    description: 'Jest/Vitest test 块',
    code: 'test(\'${1:should ...}\', () => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '异步测试',
    label: 'async test',
    description: '异步测试用例',
    code: 'test(\'${1:should ...}\', async () => {\n  ${0}\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '期望',
    label: 'expect 断言',
    description: 'Jest/Vitest expect 断言',
    code: 'expect(${1:actual}).${2|toBe,toEqual,toStrictEqual,toBeTruthy,toBeFalsy,toBeNull,toBeUndefined,toContain,toHaveLength,toThrow,toHaveBeenCalled|}(${3:expected});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },
  {
    keyword: '模拟函数',
    label: 'jest.fn',
    description: 'Jest 模拟函数',
    code: 'const ${1:mockFn} = jest.fn();',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact']
  },
  {
    keyword: '模拟模块',
    label: 'jest.mock',
    description: 'Jest 模拟模块',
    code: 'jest.mock(\'${1:module}\', () => ({\n  ${0}\n}));',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact']
  },
  {
    keyword: '钩子函数',
    label: 'beforeEach / afterEach',
    description: '测试钩子函数',
    code: 'beforeEach(() => {\n  ${0}\n});\n\nafterEach(() => {\n  // cleanup\n});',
    languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue']
  },

  // ========== HTML / Vue 模板 ==========
  {
    keyword: '条件渲染',
    label: 'v-if 条件渲染',
    description: 'Vue v-if 条件渲染',
    code: '<div v-if="${1:condition}">\n  ${0}\n</div>',
    languages: ['vue']
  },
  {
    keyword: '否则渲染',
    label: 'v-else / v-else-if',
    description: 'Vue v-else 条件分支',
    code: '<div v-else-if="${1:condition}">\n  ${0}\n</div>\n<div v-else>\n  \n</div>',
    languages: ['vue']
  },
  {
    keyword: '列表渲染',
    label: 'v-for 列表渲染',
    description: 'Vue v-for 列表渲染',
    code: '<div v-for="${1:item} in ${2:list}" :key="${1:item}.id">\n  {{ ${1:item} }}\n</div>',
    languages: ['vue']
  },
  {
    keyword: '插槽',
    label: 'slot 插槽',
    description: 'Vue slot 插槽',
    code: '<slot>${0:默认内容}</slot>',
    languages: ['vue']
  },
  {
    keyword: '作用域插槽',
    label: '作用域插槽',
    description: 'Vue 作用域插槽',
    code: '<slot :${1:data}="${1:data}">${0}</slot>',
    languages: ['vue']
  },
  {
    keyword: '事件绑定',
    label: '@click 事件',
    description: 'Vue 事件绑定',
    code: '@click="${1:handler}"',
    languages: ['vue']
  },
  {
    keyword: '双向绑定',
    label: 'v-model 双向绑定',
    description: 'Vue v-model 双向绑定',
    code: 'v-model="${1:value}"',
    languages: ['vue']
  },
  {
    keyword: '计算属性模板',
    label: 'computed 模板',
    description: 'Vue Options API computed',
    code: 'computed: {\n  ${1:computedProp}() {\n    ${0}\n  },\n},',
    languages: ['vue']
  },
  {
    keyword: '方法',
    label: 'methods',
    description: 'Vue Options API methods',
    code: 'methods: {\n  ${1:methodName}() {\n    ${0}\n  },\n},',
    languages: ['vue']
  },
  {
    keyword: '生命周期',
    label: 'mounted 生命周期',
    description: 'Vue Options API mounted',
    code: 'mounted() {\n  ${0}\n},',
    languages: ['vue']
  },
  {
    keyword: '侦听器',
    label: 'watch 侦听器',
    description: 'Vue Options API watch',
    code: 'watch: {\n  ${1:prop}(${2:newVal}, ${3:oldVal}) {\n    ${0}\n  },\n},',
    languages: ['vue']
  },
  {
    keyword: 'Props',
    label: 'props 定义',
    description: 'Vue props 定义',
    code: 'props: {\n  ${1:propName}: {\n    type: ${2:String},\n    required: ${3:true},\n  },\n},',
    languages: ['vue']
  },
  {
    keyword: 'Emit',
    label: 'emit 事件',
    description: 'Vue emit 触发事件',
    code: 'this.\\$emit(\'${1:eventName}\', ${2:payload});',
    languages: ['vue']
  },
  {
    keyword: '条件渲染React',
    label: '条件渲染 &&',
    description: 'React 条件渲染',
    code: '{${1:condition} && (\n  <div>\n    ${0}\n  </div>\n)}',
    languages: ['javascriptreact', 'typescriptreact']
  },
  {
    keyword: '列表渲染React',
    label: '列表渲染 map',
    description: 'React 列表渲染',
    code: '{${1:list}.map((${2:item}) => (\n  <div key={${2:item}.id}>\n    ${0}\n  </div>\n))}',
    languages: ['javascriptreact', 'typescriptreact']
  },
];

/**
 * 中文代码片段 CompletionItemProvider
 */
export class ChineseSnippetProvider implements vscode.CompletionItemProvider {
  /**
   * 提供代码补全项
   */
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const languageId = document.languageId;

    // 获取光标前的文本（用于判断是否输入了中文关键词）
    const textBeforeCursor = document.getText(
      new vscode.Range(new vscode.Position(0, 0), position)
    );

    // 匹配最后一个"词"（连续的中文字符）
    const match = textBeforeCursor.match(/[\u4e00-\u9fa5]+$/);
    if (!match) {
      return; // 没有中文输入，不触发
    }

    const chineseInput = match[0];

    // 筛选匹配当前语言且关键词包含输入中文的片段
    const matchedSnippets = CHINESE_SNIPPETS.filter(
      snippet =>
        snippet.languages.includes(languageId) &&
        snippet.keyword.includes(chineseInput)
    );

    if (matchedSnippets.length === 0) {
      return;
    }

    // 转换为 CompletionItem
    const items = matchedSnippets.map(snippet => {
      const item = new vscode.CompletionItem(
        `${snippet.keyword} · ${snippet.label}`,
        vscode.CompletionItemKind.Snippet
      );
      item.detail = snippet.label;
      item.documentation = new vscode.MarkdownString(snippet.description);
      item.insertText = new vscode.SnippetString(snippet.code);
      item.sortText = `0_${snippet.keyword}`; // 优先排序
      return item;
    });

    return items;
  }
}

/**
 * 注册中文代码片段触发器
 */
export function registerChineseSnippetTrigger(): vscode.Disposable[] {
  const supportedLanguages = [
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
    'vue'
  ];

  const disposables = supportedLanguages.map(language =>
    vscode.languages.registerCompletionItemProvider(
      { language, scheme: 'file' },
      new ChineseSnippetProvider(),
      ...'的一是在不了有和人这中大为上个上我'.split('') // 中文触发字符
    )
  );

  // 注册命令：打开中文代码片段列表
  const listCommand = vscode.commands.registerCommand(
    'extension.listChineseSnippets',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const languageId = editor.document.languageId;

      // 筛选当前语言支持的片段
      const availableSnippets = CHINESE_SNIPPETS.filter(s =>
        s.languages.includes(languageId)
      );

      if (availableSnippets.length === 0) {
        vscode.window.showInformationMessage('当前语言暂无中文代码片段');
        return;
      }

      // 分类展示
      const categoryItems = availableSnippets.map(s => ({
        label: s.label,
        description: s.keyword,
        detail: s.code,
        snippet: s
      }));

      const selected = await vscode.window.showQuickPick(categoryItems, {
        placeHolder: `选择要插入的代码片段 (${languageId})`,
        matchOnDescription: true,
        matchOnDetail: true
      });

      if (selected) {
        await editor.edit(editBuilder => {
          editBuilder.insert(
            editor.selection.active,
            selected.snippet.code.replace(/\$\{0\}/g, '').replace(/\$\{\d+:([^}]*)\}/g, '$1')
          );
        });
      }
    }
  );

  return [...disposables, listCommand];
}
