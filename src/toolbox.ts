/**
 * 工具箱模块 - 前端百宝箱新增工具函数
 */

// ===================== 1. JSON → TypeScript 类型生成 =====================

interface TypeDefinition {
  name: string;
  fields: { key: string; type: string }[];
}

export function jsonToTypeScript(jsonString: string, rootName: string = 'Root'): string {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return '// 无效的 JSON 格式';
  }

  const interfaces: TypeDefinition[] = [];

  function inferType(value: any, name: string): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    switch (typeof value) {
      case 'string':
        // 尝试检测特殊字符串格式
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'string'; // 日期格式
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object': {
        if (Array.isArray(value)) {
          return inferArrayType(value, name);
        }
        return inferObjectType(value, name);
      }
      default:
        return 'any';
    }
  }

  function inferArrayType(arr: any[], name: string): string {
    if (arr.length === 0) return 'any[]';

    const elementTypes = arr.map((item, i) => inferType(item, singularize(name) + 'Item'));
    const uniqueTypes = [...new Set(elementTypes)];

    if (uniqueTypes.length === 1) {
      return uniqueTypes[0] + '[]';
    }

    // 检查是否都是对象类型（需要合并接口）
    const objectTypes = uniqueTypes.filter(t => !['string', 'number', 'boolean', 'null', 'undefined', 'any'].includes(t));
    if (objectTypes.length > 1) {
      // 合并所有数组元素的字段
      const mergedFields = new Map<string, Set<string>>();
      for (const item of arr) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          for (const [key, val] of Object.entries(item)) {
            if (!mergedFields.has(key)) mergedFields.set(key, new Set());
            mergedFields.get(key)!.add(inferType(val, name + capitalize(key)));
          }
        }
      }
      const fields: { key: string; type: string }[] = [];
      for (const [key, types] of mergedFields) {
        const typeArr = [...types];
        fields.push({ key, type: typeArr.length === 1 ? typeArr[0] : typeArr.join(' | ') });
      }
      const interfaceName = singularize(name);
      interfaces.push({ name: interfaceName, fields });
      return interfaceName + '[]';
    }

    return '(' + uniqueTypes.join(' | ') + ')[]';
  }

  function inferObjectType(obj: any, name: string): string {
    const fields: { key: string; type: string }[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fieldType = inferType(value, name + capitalize(key));
      fields.push({ key, type: fieldType });
    }
    interfaces.push({ name, fields });
    return name;
  }

  // 生成主类型
  inferType(parsed, rootName);

  // 输出
  let output = '';
  for (const iface of interfaces) {
    output += `interface ${iface.name} {\n`;
    for (const field of iface.fields) {
      output += `  ${field.key}: ${field.type};\n`;
    }
    output += `}\n\n`;
  }

  return output.trim();
}

// 生成 Zod Schema
export function generateZodSchema(jsonString: string, rootName: string = 'Root'): string {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return '// 无效的 JSON 格式';
  }

  const interfaces: TypeDefinition[] = [];

  function inferType(value: any, name: string): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    switch (typeof value) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'object': {
        if (Array.isArray(value)) return inferArrayType(value, name);
        return inferObjectType(value, name);
      }
      default: return 'any';
    }
  }

  function inferArrayType(arr: any[], name: string): string {
    if (arr.length === 0) return 'any[]';
    const elementTypes = arr.map((item) => inferType(item, singularize(name) + 'Item'));
    const uniqueTypes = [...new Set(elementTypes)];
    if (uniqueTypes.length === 1) return uniqueTypes[0] + '[]';
    const objectTypes = uniqueTypes.filter(t => !['string', 'number', 'boolean', 'null', 'undefined', 'any'].includes(t));
    if (objectTypes.length > 1) {
      const mergedFields = new Map<string, Set<string>>();
      for (const item of arr) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          for (const [key, val] of Object.entries(item)) {
            if (!mergedFields.has(key)) mergedFields.set(key, new Set());
            mergedFields.get(key)!.add(inferType(val, name + capitalize(key)));
          }
        }
      }
      const fields: { key: string; type: string }[] = [];
      for (const [key, types] of mergedFields) {
        const typeArr = [...types];
        fields.push({ key, type: typeArr.length === 1 ? typeArr[0] : typeArr.join(' | ') });
      }
      interfaces.push({ name: singularize(name), fields });
      return singularize(name) + '[]';
    }
    return '(' + uniqueTypes.join(' | ') + ')[]';
  }

  function inferObjectType(obj: any, name: string): string {
    const fields: { key: string; type: string }[] = [];
    for (const [key, value] of Object.entries(obj)) {
      fields.push({ key, type: inferType(value, name + capitalize(key)) });
    }
    interfaces.push({ name, fields });
    return name;
  }

  inferType(parsed, rootName);

  // 类型 → Zod 映射
  function typeToZod(type: string): string {
    if (type === 'string') return 'z.string()';
    if (type === 'number') return 'z.number()';
    if (type === 'boolean') return 'z.boolean()';
    if (type === 'null' || type === 'undefined') return 'z.null()';
    if (type === 'any') return 'z.any()';
    // 联合类型
    if (type.includes('|')) {
      return type.split('|').map(t => t.trim()).map(typeToZod).join(', ') ;
    }
    // 数组类型
    if (type.endsWith('[]')) {
      const elementType = type.slice(0, -2);
      if (elementType === 'any') return 'z.array(z.any())';
      if (['string', 'number', 'boolean'].includes(elementType)) {
        return `z.array(${typeToZod(elementType)})`;
      }
      // 对象数组 - 引用 schema
      return `z.array(${elementType}Schema)`;
    }
    // 对象类型 - 引用 schema
    return `${type}Schema`;
  }

  let output = "import { z } from 'zod';\n\n";

  for (const iface of interfaces) {
    const fieldsStr = iface.fields.map(f => {
      const zodType = typeToZod(f.type);
      // 处理联合类型包裹
      if (f.type.includes('|')) {
        return `  ${f.key}: z.union([${zodType}])`;
      }
      // 可选字段（如果类型包含 null）
      if (f.type.includes('null')) {
        return `  ${f.key}: ${zodType}.optional()`;
      }
      return `  ${f.key}: ${zodType}`;
    }).join(',\n');

    output += `export const ${iface.name}Schema = z.object({\n${fieldsStr}\n});\n\n`;

    // 生成推断的 TS 类型
    output += `export type ${iface.name} = z.infer<typeof ${iface.name}Schema>;\n\n`;
  }

  return output.trim();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function singularize(s: string): string {
  if (s.endsWith('ies')) return s.slice(0, -3) + 'y';
  if (s.endsWith('ses') || s.endsWith('s')) return s.slice(0, -1);
  return s + 'Item';
}

// ===================== 2. CSS 单位转换 =====================

export function convertCssUnits(
  cssText: string,
  direction: 'px2rem' | 'px2vw' | 'rem2px' | 'vw2px',
  remBase: number = 16,
  vwDesignWidth: number = 375
): string {
  return cssText.replace(/(\d+(?:\.\d+)?)(px|rem|vw)/g, (match, valueStr, unit) => {
    const value = parseFloat(valueStr);
    switch (direction) {
      case 'px2rem':
        if (unit !== 'px') return match;
        return (value / remBase).toFixed(value % remBase === 0 ? 0 : 4).replace(/\.?0+$/, '') + 'rem';
      case 'px2vw':
        if (unit !== 'px') return match;
        return (value / vwDesignWidth * 100).toFixed(4).replace(/\.?0+$/, '') + 'vw';
      case 'rem2px':
        if (unit !== 'rem') return match;
        return (value * remBase).toFixed(value * remBase % 1 === 0 ? 0 : 2).replace(/\.?0+$/, '') + 'px';
      case 'vw2px':
        if (unit !== 'vw') return match;
        return (value * vwDesignWidth / 100).toFixed(2).replace(/\.?0+$/, '') + 'px';
      default:
        return match;
    }
  });
}

// ===================== 3. 颜色格式转换 =====================

interface RGBA { r: number; g: number; b: number; a: number; }

export function detectColorFormat(text: string): string | null {
  const t = text.trim();
  if (/^#([0-9a-fA-F]{3})$/.test(t)) return 'hex3';
  if (/^#([0-9a-fA-F]{6})$/.test(t)) return 'hex6';
  if (/^#([0-9a-fA-F]{8})$/.test(t)) return 'hex8';
  if (/^rgba?\(\s*\d+/i.test(t)) return t.includes(',') && t.split(',').length === 4 ? 'rgba' : 'rgb';
  if (/^hsla?\(\s*\d+/i.test(t)) return t.includes(',') && t.split(',').length === 4 ? 'hsla' : 'hsl';
  return null;
}

export function parseColor(text: string): RGBA | null {
  const t = text.trim();

  // Hex formats
  const hexMatch = t.match(/^#([0-9a-fA-F]+)$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255
      };
    }
  }

  // rgb/rgba
  const rgbMatch = t.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
    };
  }

  // hsl/hsla
  const hslMatch = t.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+))?\s*\)$/i);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360;
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;
    const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;
    const rgb = hslToRgb(h, s, l);
    return { ...rgb, a };
  }

  return null;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function colorToFormat(color: RGBA, format: string): string {
  switch (format) {
    case 'hex':
      if (color.a === 1) {
        return '#' + [color.r, color.g, color.b].map(c => c.toString(16).padStart(2, '0')).join('');
      }
      return '#' + [color.r, color.g, color.b, Math.round(color.a * 255)].map(c => c.toString(16).padStart(2, '0')).join('');
    case 'rgb':
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
    case 'rgba':
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    case 'hsl': {
      const hsl = rgbToHsl(color.r, color.g, color.b);
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }
    case 'hsla': {
      const hsl = rgbToHsl(color.r, color.g, color.b);
      return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${color.a})`;
    }
    default:
      return colorToFormat(color, 'hex');
  }
}

// ===================== 4. 时间戳 ↔ 日期转换 =====================

export function isTimestamp(text: string): boolean {
  const trimmed = text.trim();
  return /^\d{10}$/.test(trimmed) || /^\d{13}$/.test(trimmed);
}

export function timestampToDate(tsStr: string): string {
  const ts = parseInt(tsStr.trim());
  // 13位毫秒，10位秒
  const date = new Date(ts.toString().length === 13 ? ts : ts * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function dateToTimestamp(dateStr: string): { seconds: string; milliseconds: string } {
  const date = new Date(dateStr.trim());
  if (isNaN(date.getTime())) {
    return { seconds: '无效日期', milliseconds: '无效日期' };
  }
  return {
    seconds: Math.floor(date.getTime() / 1000).toString(),
    milliseconds: date.getTime().toString()
  };
}

// ===================== 5. 编解码工具 =====================

export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

export function urlDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text; // 解码失败返回原文
  }
}

export function base64Encode(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}

export function base64Decode(text: string): string {
  return Buffer.from(text, 'base64').toString('utf-8');
}

export function htmlEntityEncode(text: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, c => entities[c]);
}

export function htmlEntityDecode(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&apos;': "'"
  };
  return text.replace(/&(?:amp|lt|gt|quot|#39|#x27|apos);/g, e => entities[e] || e);
}

// ===================== 6. SVG 优化 =====================

export function optimizeSvg(svg: string): string {
  let result = svg;

  // 移除 XML 声明
  result = result.replace(/<\?xml[^?]*\?>\s*/g, '');
  // 移除注释
  result = result.replace(/<!--[\s\S]*?-->/g, '');
  // 移除 metadata 标签
  result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  // 移除 title 和 desc
  result = result.replace(/<title[\s\S]*?<\/title>/gi, '');
  result = result.replace(/<desc[\s\S]*?<\/desc>/gi, '');
  // 移除 xmlns:xlink 和 xmlns:svg (嵌入 HTML 时不需要)
  result = result.replace(/\s*xmlns:xlink="[^"]*"/g, '');
  result = result.replace(/\s*xmlns:svg="[^"]*"/g, '');
  // 移除 Sketch/Adobe 工具属性
  result = result.replace(/\s*sketch:[^=]*="[^"]*"/g, '');
  result = result.replace(/\s*xmlns:sketch="[^"]*"/g, '');
  result = result.replace(/\s*xmlns:xhtml="[^"]*"/g, '');
  // 移除空白行
  result = result.replace(/\n\s*\n/g, '\n');
  // 压缩连续空白为单个空格
  result = result.replace(/\s{2,}/g, ' ');
  // 移除标签间空白
  result = result.replace(/>\s+</g, '><');
  // 移除首尾空白
  result = result.trim();

  return result;
}

// ===================== 9. 占位图片生成 =====================

export function generatePlaceholderTag(width: number, height: number, text?: string): string {
  let url = `https://placehold.co/${width}x${height}`;
  if (text) {
    url += `?text=${encodeURIComponent(text)}`;
  }
  return `<img src="${url}" alt="placeholder ${width}x${height}" />`;
}

// ===================== 10. Console.log 管理 =====================

export function generateConsoleLog(variableName: string): string {
  return `console.log('${variableName}:', ${variableName});`;
}

export function removeAllConsoleLogs(text: string): { result: string; count: number } {
  // 只移除 console.log 和 console.warn，保留 console.error 用于错误处理
  const singleLineRegex = /^\s*console\.(log|warn)\([^;]*\);\s*$/gm;
  // 匹配多行 console.log/warn（跨行参数）
  const multiLineRegex = /^\s*console\.(log|warn)\([\s\S]*?\);\s*$/gm;

  let count = 0;

  // 先统计数量
  const matches1 = text.match(singleLineRegex);
  if (matches1) count += matches1.length;

  // 替换多行的
  let result = text.replace(multiLineRegex, (match) => {
    return '';
  });

  // 清理空行
  result = result.replace(/\n{3,}/g, '\n\n');

  return { result, count };
}

// 注释所有 console.log/warn/error（带标记前缀便于后续恢复）
export function commentAllConsoleLogs(text: string): { result: string; count: number } {
  // 只注释 console.log 和 console.warn，保留 console.error 用于错误处理
  const multiLineRegex = /^\s*console\.(log|warn)\([\s\S]*?\);\s*$/gm;
  let count = 0;

  const result = text.replace(multiLineRegex, (match) => {
    count++;
    // 按行注释
    return match.split('\n').map(line => {
      const trimmed = line.trimStart();
      if (trimmed === '') return line;
      // 获取行的缩进
      const indent = line.substring(0, line.length - trimmed.length);
      if (trimmed.startsWith('// [toolbox] ')) return line; // 已经注释过
      return indent + '// [toolbox] ' + trimmed;
    }).join('\n');
  });

  return { result, count };
}

// 取消注释所有被 [toolbox] 标记的 console（支持 log/warn/error）
export function uncommentConsoleLogs(text: string): { result: string; count: number } {
  // 匹配 log/warn/error 以兼容旧数据（可能之前有注释过 console.error）
  const regex = /^(.*?)\/\/ \[toolbox\] (console\.(log|warn|error)\([\s\S]*?\);\s*)$/gm;
  let count = 0;

  const result = text.replace(regex, (_match, indent, code) => {
    count++;
    return indent + code;
  });

  return { result, count };
}

// 查找所有 console 语句的位置（用于高亮，只包括 log 和 warn）
export function findAllConsoleLogs(text: string): Array<{ line: number; text: string }> {
  const lines = text.split('\n');
  const results: Array<{ line: number; text: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    // 只匹配 console.log 和 console.warn
    if (/^\s*console\.(log|warn)\s*\(/.test(lines[i])) {
      results.push({ line: i, text: lines[i].trim() });
    }
  }

  return results;
}

// 切换 console 注释状态（注释的取消，未注释的注释，只处理 log 和 warn）
export function toggleConsoleLogs(text: string): { result: string; count: number } {
  let commentCount = 0;
  let uncommentCount = 0;

  // 先处理取消注释（匹配 log/warn/error 以兼容旧数据）
  const uncommentRegex = /^(.*?)\/\/ \[toolbox\] (console\.(log|warn|error)\([\s\S]*?\);\s*)$/gm;
  let result = text.replace(uncommentRegex, (_match, indent, code) => {
    uncommentCount++;
    return indent + code;
  });

  // 再处理注释（只注释 log 和 warn）
  const commentRegex = /^\s*console\.(log|warn)\([\s\S]*?\);\s*$/gm;
  result = result.replace(commentRegex, (match) => {
    commentCount++;
    return match.split('\n').map(line => {
      const trimmed = line.trimStart();
      if (trimmed === '') return line;
      const indent = line.substring(0, line.length - trimmed.length);
      return indent + '// [toolbox] ' + trimmed;
    }).join('\n');
  });

  return { result, count: commentCount + uncommentCount };
}
