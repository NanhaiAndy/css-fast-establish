// 正则表达式解析器 — 将正则解析为 Token 序列

export interface RegexToken {
  type: 'literal' | 'charset' | 'group' | 'quantifier' | 'anchor' | 'escape' | 'alternation' | 'backreference' | 'lookaround' | 'dot' | 'shorthand';
  text: string;
  description: string;
  start: number;
  end: number;
  color: string;
}

const TOKEN_COLORS: Record<string, string> = {
  literal: '#4ec9b0',
  charset: '#6a9955',
  group: '#dcdcaa',
  quantifier: '#c586c0',
  anchor: '#f44747',
  escape: '#569cd6',
  alternation: '#ce9178',
  backreference: '#b5cea8',
  lookaround: '#9cdcfe',
  dot: '#569cd6',
  shorthand: '#6a9955',
};

function getColor(type: string): string {
  return TOKEN_COLORS[type] || '#d4d4d4';
}

// 解析正则为 Token 序列
export function parseRegex(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    // 转义字符
    if (ch === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      const shorthandMap: Record<string, string> = {
        'd': '数字 [0-9]', 'D': '非数字 [^0-9]',
        'w': '单词字符 [a-zA-Z0-9_]', 'W': '非单词字符',
        's': '空白字符', 'S': '非空白字符',
        'b': '单词边界', 'B': '非单词边界',
        'n': '换行符', 'r': '回车符', 't': '制表符',
      };

      if (shorthandMap[next]) {
        tokens.push({
          type: 'shorthand', text: `\\${next}`,
          description: shorthandMap[next],
          start: i, end: i + 2,
          color: getColor('shorthand')
        });
      } else if (/^[1-9]$/.test(next)) {
        tokens.push({
          type: 'backreference', text: `\\${next}`,
          description: `反向引用第 ${next} 组`,
          start: i, end: i + 2,
          color: getColor('backreference')
        });
      } else {
        tokens.push({
          type: 'escape', text: `\\${next}`,
          description: `转义 ${next}`,
          start: i, end: i + 2,
          color: getColor('escape')
        });
      }
      i += 2;
      continue;
    }

    // 锚点
    if (ch === '^') {
      tokens.push({ type: 'anchor', text: '^', description: '行首', start: i, end: i + 1, color: getColor('anchor') });
      i++; continue;
    }
    if (ch === '$') {
      tokens.push({ type: 'anchor', text: '$', description: '行尾', start: i, end: i + 1, color: getColor('anchor') });
      i++; continue;
    }

    // 点号
    if (ch === '.') {
      tokens.push({ type: 'dot', text: '.', description: '匹配任意字符（除换行符）', start: i, end: i + 1, color: getColor('dot') });
      i++; continue;
    }

    // 分支
    if (ch === '|') {
      tokens.push({ type: 'alternation', text: '|', description: '或（分支）', start: i, end: i + 1, color: getColor('alternation') });
      i++; continue;
    }

    // 量词
    if (ch === '*' || ch === '+' || ch === '?') {
      let text = ch;
      let end = i + 1;
      let desc = '';
      if (ch === '*') desc = '0 次或多次';
      else if (ch === '+') desc = '1 次或多次';
      else if (ch === '?') desc = '0 次或 1 次';

      // 非贪婪标记
      if (pattern[end] === '?') {
        text += '?'; end++;
        desc += '（非贪婪）';
      }

      tokens.push({ type: 'quantifier', text, description: desc, start: i, end, color: getColor('quantifier') });
      i = end; continue;
    }

    // 花括号量词 {n} {n,} {n,m}
    if (ch === '{') {
      const closeIdx = pattern.indexOf('}', i);
      if (closeIdx !== -1) {
        const quantContent = pattern.substring(i, closeIdx + 1);
        const desc = `量词 ${quantContent}`;
        tokens.push({ type: 'quantifier', text: quantContent, description: desc, start: i, end: closeIdx + 1, color: getColor('quantifier') });
        i = closeIdx + 1;
        // 检查非贪婪
        if (pattern[i] === '?') {
          const prev = tokens[tokens.length - 1];
          prev.text += '?';
          prev.description += '（非贪婪）';
          prev.end = i + 1;
          i++;
        }
        continue;
      }
    }

    // 字符集 [...]
    if (ch === '[') {
      const closeIdx = findCharsetEnd(pattern, i);
      if (closeIdx !== -1) {
        let text = pattern.substring(i, closeIdx + 1);
        let desc = '字符集 ';
        if (text.startsWith('[^')) desc = '排除字符集 ';
        desc += text;
        tokens.push({ type: 'charset', text, description: desc, start: i, end: closeIdx + 1, color: getColor('charset') });
        i = closeIdx + 1;
        continue;
      }
    }

    // 捕获组 / 非捕获组 / 断言
    if (ch === '(') {
      const closeIdx = findGroupEnd(pattern, i);
      if (closeIdx !== -1) {
        const groupContent = pattern.substring(i, closeIdx + 1);

        // 判断组类型
        if (groupContent.startsWith('(?=')) {
          tokens.push({ type: 'lookaround', text: groupContent, description: `正向先行断言`, start: i, end: closeIdx + 1, color: getColor('lookaround') });
        } else if (groupContent.startsWith('(?!')) {
          tokens.push({ type: 'lookaround', text: groupContent, description: `负向先行断言`, start: i, end: closeIdx + 1, color: getColor('lookaround') });
        } else if (groupContent.startsWith('(?<=') || groupContent.startsWith('(?<!')) {
          const isPositive = groupContent.startsWith('(?<=');
          tokens.push({ type: 'lookaround', text: groupContent, description: isPositive ? '正向后行断言' : '负向后行断言', start: i, end: closeIdx + 1, color: getColor('lookaround') });
        } else if (groupContent.startsWith('(?:')) {
          tokens.push({ type: 'group', text: groupContent, description: '非捕获组', start: i, end: closeIdx + 1, color: getColor('group') });
        } else if (groupContent.startsWith('(?<')) {
          // 命名捕获组 (?<name>...)
          const nameMatch = groupContent.match(/^\(\?<([^>]+)>/);
          const name = nameMatch ? nameMatch[1] : '?';
          tokens.push({ type: 'group', text: groupContent, description: `命名捕获组 "${name}"`, start: i, end: closeIdx + 1, color: getColor('group') });
        } else {
          tokens.push({ type: 'group', text: groupContent, description: '捕获组', start: i, end: closeIdx + 1, color: getColor('group') });
        }
        i = closeIdx + 1;
        continue;
      }
    }

    // 普通字面量
    tokens.push({ type: 'literal', text: ch, description: `字面量 "${ch}"`, start: i, end: i + 1, color: getColor('literal') });
    i++;
  }

  return tokens;
}

// 找到字符集 ] 的结束位置（处理嵌套和转义）
function findCharsetEnd(pattern: string, start: number): number {
  let i = start + 1;
  if (i < pattern.length && pattern[i] === '^') i++;
  // 第一个 ] 在字符集开头是字面量
  if (i < pattern.length && pattern[i] === ']') i++;

  while (i < pattern.length) {
    if (pattern[i] === '\\' && i + 1 < pattern.length) {
      i += 2; continue;
    }
    if (pattern[i] === ']') return i;
    i++;
  }
  return -1;
}

// 找到组 ) 的结束位置（处理嵌套和转义）
function findGroupEnd(pattern: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < pattern.length) {
    if (pattern[i] === '\\' && i + 1 < pattern.length) {
      i += 2; continue;
    }
    if (pattern[i] === '[') {
      const end = findCharsetEnd(pattern, i);
      i = end !== -1 ? end + 1 : i + 1;
      continue;
    }
    if (pattern[i] === '(') { depth++; }
    if (pattern[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

// 分析匹配结果 — 捕获组信息
export interface MatchResult {
  fullMatch: string;
  start: number;
  end: number;
  groups: Array<{
    value: string;
    start: number;
    end: number;
  }>;
}

export function analyzeMatches(regex: RegExp, testStr: string): MatchResult[] {
  const results: MatchResult[] = [];
  let match;
  const flags = regex.flags;

  if (!flags.includes('g')) {
    regex = new RegExp(regex.source, flags + 'g');
  }

  while ((match = regex.exec(testStr)) !== null) {
    const groups: MatchResult['groups'] = [];
    for (let i = 1; i < match.length; i++) {
      if (match[i] !== undefined) {
        groups.push({
          value: match[i],
          start: match.index + (match[0].indexOf(match[i]) !== -1 ? match[0].indexOf(match[i]) : 0),
          end: 0,
        });
        groups[groups.length - 1].end = groups[groups.length - 1].start + match[i].length;
      }
    }
    results.push({
      fullMatch: match[0],
      start: match.index,
      end: match.index + match[0].length,
      groups
    });
    if (match[0].length === 0) regex.lastIndex++;
  }
  return results;
}
