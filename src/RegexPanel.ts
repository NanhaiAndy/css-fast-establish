import * as vscode from 'vscode';

/**
 * 正则表达式测试器（可视化增强版） - Webview Panel
 */
export class RegexPanel {
  public static currentPanel: RegexPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getHtmlForWebview();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (RegexPanel.currentPanel) {
      RegexPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'regexTester',
      '正则可视化测试',
      column || vscode.ViewColumn.One,
      { enableScripts: true }
    );

    RegexPanel.currentPanel = new RegexPanel(panel, extensionUri);
  }

  private dispose() {
    RegexPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) x.dispose();
    }
  }

  private _getHtmlForWebview(): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>正则可视化测试</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    h1 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .input-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; margin-bottom: 6px; color: var(--vscode-descriptionForeground); }
    input[type="text"], textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 14px;
      outline: none;
    }
    input[type="text"]:focus, textarea:focus {
      border-color: #FF6900;
    }
    textarea { min-height: 100px; resize: vertical; }
    .flags { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .flags label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; margin-bottom: 0; }
    .flags input[type="checkbox"] { width: 16px; height: 16px; accent-color: #FF6900; }

    /* 可视化区域 */
    .visual-section { margin-bottom: 20px; }
    .visual-section h2 { font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--vscode-descriptionForeground); }
    .token-display {
      background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05));
      border-radius: 6px;
      padding: 10px 14px;
      font-family: 'Consolas', monospace;
      font-size: 15px;
      line-height: 1.8;
      min-height: 40px;
      word-break: break-all;
    }
    .token {
      padding: 2px 1px;
      border-radius: 3px;
      cursor: pointer;
      position: relative;
      transition: background 0.15s;
    }
    .token:hover { filter: brightness(1.3); }

    .legend {
      display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 12px;
    }
    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-color {
      width: 12px; height: 12px; border-radius: 2px;
    }

    /* 匹配结果 */
    .result-section { margin-top: 20px; }
    .result-section h2 { font-size: 15px; font-weight: 500; margin-bottom: 10px; }
    .match-info {
      background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05));
      border-radius: 6px;
      padding: 12px 16px;
      font-family: 'Consolas', monospace;
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-wrap;
      word-break: break-all;
      min-height: 40px;
    }
    .match-full { background: rgba(255, 105, 0, 0.25); border-radius: 2px; }
    .match-group { background: rgba(78, 201, 176, 0.3); border-radius: 2px; border-bottom: 2px solid #4ec9b0; }
    .match-count { color: #FF6900; font-weight: 500; }

    .group-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    .group-table th, .group-table td {
      text-align: left; padding: 6px 12px;
      border: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
    }
    .group-table th { background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05)); }
    .error { color: #f44747; }

    .tooltip {
      display: none;
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-input-border);
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      color: var(--vscode-editor-foreground);
    }
    .token:hover .tooltip { display: block; }
  </style>
</head>
<body>
  <h1>正则可视化测试</h1>

  <div class="input-group" style="margin-bottom:8px">
    <label>常用模板</label>
    <select id="templateSelect" style="width:100%;padding:6px 10px;border:1px solid var(--vscode-input-border,rgba(255,255,255,0.1));border-radius:4px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);font-size:13px;outline:none;">
      <option value="">-- 选择常用正则模板 --</option>
    </select>
  </div>

  <div class="input-group">
    <label>正则表达式</label>
    <input type="text" id="pattern" placeholder="输入正则表达式，如: \\d+|([a-z]+)" />
  </div>

  <div class="flags">
    <label><input type="checkbox" id="flag-g" checked /> Global (g)</label>
    <label><input type="checkbox" id="flag-i" /> Ignore Case (i)</label>
    <label><input type="checkbox" id="flag-m" /> Multiline (m)</label>
    <label><input type="checkbox" id="flag-s" /> DotAll (s)</label>
  </div>

  <div class="visual-section">
    <h2>正则解析</h2>
    <div class="token-display" id="tokenDisplay">在上方输入正则表达式</div>
    <div class="legend" id="legend"></div>
  </div>

  <div class="input-group">
    <label>测试文本</label>
    <textarea id="testString" placeholder="输入需要测试的文本"></textarea>
  </div>

  <div class="result-section">
    <h2>匹配结果 <span id="matchCount"></span></h2>
    <div class="match-info" id="highlightedResult">在上方输入正则和测试文本开始测试</div>
  </div>

  <div class="result-section">
    <h2>捕获组详情</h2>
    <div id="groupDetails"></div>
  </div>

  <script nonce="${nonce}">
    const patternInput = document.getElementById('pattern');
    const testInput = document.getElementById('testString');
    const resultDiv = document.getElementById('highlightedResult');
    const matchCountSpan = document.getElementById('matchCount');
    const groupDetailsDiv = document.getElementById('groupDetails');
    const tokenDisplay = document.getElementById('tokenDisplay');
    const legendDiv = document.getElementById('legend');
    const templateSelect = document.getElementById('templateSelect');

    // 常用正则模板
    const templates = [
      { name: '邮箱地址', pattern: '^[\\\\w.-]+@[\\\\w.-]+\\\\.\\\\w+$', test: 'user@example.com\\nhello@test.org\\ninvalid-email', flags: 'gm' },
      { name: '手机号（中国）', pattern: '^1[3-9]\\\\d{9}$', test: '13800138000\\n19912345678\\n12345678901', flags: 'gm' },
      { name: 'URL 网址', pattern: 'https?://[\\\\w-]+(\\\\.[\\\\w-]+)+[\\\\w-.,@?^=%&:/~+#]*', test: 'https://example.com/path\\nhttp://test.org?a=1&b=2\\nftp://invalid', flags: 'g' },
      { name: '身份证号（中国）', pattern: '^\\\\d{17}[\\\\dXx]$', test: '110101199001011234\\n440106200012121234\\n1234567890', flags: 'gm' },
      { name: 'IP 地址', pattern: '\\\\b(?:(?:25[0-5]|2[0-4]\\\\d|[01]?\\\\d\\\\d?)\\\\.){3}(?:25[0-5]|2[0-4]\\\\d|[01]?\\\\d\\\\d?)\\\\b', test: '192.168.1.1\\n10.0.0.255\\n999.999.999.999', flags: 'g' },
      { name: '日期 YYYY-MM-DD', pattern: '\\\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\\\d|3[01])', test: '2024-01-15\\n2023-12-31\\n2024-13-01\\n2024-00-10', flags: 'g' },
      { name: '中文字符', pattern: '[\\\\u4e00-\\\\u9fa5]+', test: '你好world世界123', flags: 'g' },
      { name: 'HTML 标签', pattern: '<([a-z][a-z0-9]*)\\\\b[^>]*>(.*?)<\\\\/\\\\1>', test: '<div>content</div>\\n<span>hello</span>\\n<img src="a.jpg"/>', flags: 'gi' },
      { name: '密码强度（至少8位，含大小写和数字）', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\\\d)[a-zA-Z\\\\d]{8,}$', test: 'Abc12345\\nweak\\n12345678\\nAbcd1234', flags: 'gm' },
      { name: '十六进制颜色值', pattern: '#(?:[0-9a-fA-F]{3}){1,2}', test: '#fff\\n#FF6900\\n#4ec9b0\\n#gggggg\\n#aabbcc', flags: 'g' },
      { name: '车牌号（中国）', pattern: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤川青藏琼宁][A-Z][A-HJ-NP-Z0-9]{5}$', test: '京A12345\\n沪B67890\\n粤C11111\\nabc1234', flags: 'gm' },
    ];

    // 填充模板下拉框
    templates.forEach((t, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = t.name;
      templateSelect.appendChild(opt);
    });

    templateSelect.addEventListener('change', function() {
      const idx = parseInt(this.value);
      if (isNaN(idx)) return;
      const t = templates[idx];
      patternInput.value = t.pattern;
      testInput.value = t.test;
      // 设置 flags
      document.getElementById('flag-g').checked = t.flags.includes('g');
      document.getElementById('flag-i').checked = t.flags.includes('i');
      document.getElementById('flag-m').checked = t.flags.includes('m');
      document.getElementById('flag-s').checked = t.flags.includes('s');
      test();
    });

    function getFlags() {
      let flags = '';
      if (document.getElementById('flag-g').checked) flags += 'g';
      if (document.getElementById('flag-i').checked) flags += 'i';
      if (document.getElementById('flag-m').checked) flags += 'm';
      if (document.getElementById('flag-s').checked) flags += 's';
      return flags;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // 正则解析器（内联版本）
    function parseRegex(pattern) {
      const tokens = [];
      let i = 0;
      const colors = {
        literal: '#4ec9b0', charset: '#6a9955', group: '#dcdcaa',
        quantifier: '#c586c0', anchor: '#f44747', escape: '#569cd6',
        alternation: '#ce9178', backreference: '#b5cea8',
        lookaround: '#9cdcfe', dot: '#569cd6', shorthand: '#6a9955',
      };
      const shorthandMap = {
        'd': '数字 [0-9]', 'D': '非数字', 'w': '单词字符', 'W': '非单词字符',
        's': '空白字符', 'S': '非空白字符', 'b': '单词边界', 'B': '非单词边界',
        'n': '换行符', 'r': '回车符', 't': '制表符',
      };

      while (i < pattern.length) {
        const ch = pattern[i];
        if (ch === '\\\\' && i + 1 < pattern.length) {
          const next = pattern[i + 1];
          if (shorthandMap[next]) {
            tokens.push({ type: 'shorthand', text: '\\\\' + next, desc: shorthandMap[next], color: colors.shorthand, start: i, end: i + 2 });
          } else if (/^[1-9]$/.test(next)) {
            tokens.push({ type: 'backreference', text: '\\\\' + next, desc: '反向引用第' + next + '组', color: colors.backreference, start: i, end: i + 2 });
          } else {
            tokens.push({ type: 'escape', text: '\\\\' + next, desc: '转义 ' + next, color: colors.escape, start: i, end: i + 2 });
          }
          i += 2; continue;
        }
        if (ch === '^' || ch === '$') {
          tokens.push({ type: 'anchor', text: ch, desc: ch === '^' ? '行首' : '行尾', color: colors.anchor, start: i, end: i + 1 });
          i++; continue;
        }
        if (ch === '.') {
          tokens.push({ type: 'dot', text: '.', desc: '任意字符', color: colors.dot, start: i, end: i + 1 });
          i++; continue;
        }
        if (ch === '|') {
          tokens.push({ type: 'alternation', text: '|', desc: '或（分支）', color: colors.alternation, start: i, end: i + 1 });
          i++; continue;
        }
        if (ch === '*' || ch === '+' || ch === '?') {
          let desc = ch === '*' ? '0次或多次' : ch === '+' ? '1次或多次' : '0次或1次';
          let end = i + 1;
          if (pattern[end] === '?') { desc += '（非贪婪）'; end++; }
          tokens.push({ type: 'quantifier', text: pattern.substring(i, end), desc, color: colors.quantifier, start: i, end });
          i = end; continue;
        }
        if (ch === '{') {
          const ci = pattern.indexOf('}', i);
          if (ci !== -1) {
            let end = ci + 1;
            let desc = '量词 ' + pattern.substring(i, end);
            if (pattern[end] === '?') { desc += '（非贪婪）'; end++; }
            tokens.push({ type: 'quantifier', text: pattern.substring(i, end), desc, color: colors.quantifier, start: i, end });
            i = end; continue;
          }
        }
        if (ch === '[') {
          let j = i + 1;
          if (j < pattern.length && pattern[j] === '^') j++;
          if (j < pattern.length && pattern[j] === ']') j++;
          while (j < pattern.length) {
            if (pattern[j] === '\\\\' && j + 1 < pattern.length) { j += 2; continue; }
            if (pattern[j] === ']') break;
            j++;
          }
          if (j < pattern.length) {
            const text = pattern.substring(i, j + 1);
            tokens.push({ type: 'charset', text, desc: (text[1] === '^' ? '排除' : '') + '字符集', color: colors.charset, start: i, end: j + 1 });
            i = j + 1; continue;
          }
        }
        if (ch === '(') {
          let depth = 0, j = i;
          while (j < pattern.length) {
            if (pattern[j] === '\\\\' && j + 1 < pattern.length) { j += 2; continue; }
            if (pattern[j] === '[') {
              let k = j + 1;
              if (k < pattern.length && pattern[k] === '^') k++;
              while (k < pattern.length && pattern[k] !== ']') k++;
              j = k + 1; continue;
            }
            if (pattern[j] === '(') depth++;
            if (pattern[j] === ')') { depth--; if (depth === 0) break; }
            j++;
          }
          if (depth === 0) {
            const text = pattern.substring(i, j + 1);
            let desc = '捕获组';
            if (text.startsWith('(?=')) desc = '正向先行断言';
            else if (text.startsWith('(?!')) desc = '负向先行断言';
            else if (text.startsWith('(?<=') || text.startsWith('(?<!')) desc = text[3] === '=' ? '正向后行断言' : '负向后行断言';
            else if (text.startsWith('(?:')) desc = '非捕获组';
            else {
              const nm = text.match(/^\\(\\?<([^>]+)>/);
              if (nm) desc = '命名捕获组 "' + nm[1] + '"';
            }
            tokens.push({ type: 'group', text, desc, color: colors.group, start: i, end: j + 1 });
            i = j + 1; continue;
          }
        }
        tokens.push({ type: 'literal', text: ch, desc: '字面量 "' + ch + '"', color: colors.literal, start: i, end: i + 1 });
        i++;
      }
      return tokens;
    }

    function renderTokens(pattern) {
      if (!pattern) {
        tokenDisplay.innerHTML = '在上方输入正则表达式';
        legendDiv.innerHTML = '';
        return;
      }
      try {
        const tokens = parseRegex(pattern);
        tokenDisplay.innerHTML = tokens.map(t =>
          '<span class="token" style="background:' + t.color + '22;color:' + t.color + ';border-bottom:2px solid ' + t.color + '">' +
          escapeHtml(t.text) +
          '<span class="tooltip">' + escapeHtml(t.desc) + '</span></span>'
        ).join('');

        // 图例
        const typeNames = {
          literal: '字面量', charset: '字符集', group: '捕获组',
          quantifier: '量词', anchor: '锚点', escape: '转义',
          alternation: '分支', backreference: '反向引用',
          lookaround: '断言', dot: '点号', shorthand: '简写',
        };
        const seen = new Set();
        legendDiv.innerHTML = tokens
          .filter(t => { if (seen.has(t.type)) return false; seen.add(t.type); return true; })
          .map(t => '<span class="legend-item"><span class="legend-color" style="background:' + t.color + '"></span>' + (typeNames[t.type] || t.type) + '</span>')
          .join('');
      } catch (e) {
        tokenDisplay.innerHTML = '<span class="error">解析错误</span>';
        legendDiv.innerHTML = '';
      }
    }

    function test() {
      const pattern = patternInput.value;
      const testStr = testInput.value;
      const flags = getFlags();

      renderTokens(pattern);

      if (!pattern) {
        resultDiv.innerHTML = '请输入正则表达式';
        matchCountSpan.textContent = '';
        groupDetailsDiv.innerHTML = '';
        return;
      }

      try {
        const regex = new RegExp(pattern, flags);
        const results = [];
        let match;

        if (flags.includes('g')) {
          while ((match = regex.exec(testStr)) !== null) {
            results.push({ match: match[0], index: match.index, groups: Array.from(match), startIndices: [] });
            // 计算每个捕获组在完整匹配中的起始位置
            let tempRegex = new RegExp(pattern, flags.replace('g', ''));
            tempRegex.lastIndex = match.index;
            const detailMatch = tempRegex.exec(testStr);
            if (detailMatch) {
              for (let g = 1; g < detailMatch.length; g++) {
                results[results.length - 1].startIndices.push(match.index + match[0].indexOf(detailMatch[g]));
              }
            }
            if (match[0].length === 0) regex.lastIndex++;
          }
        } else {
          match = regex.exec(testStr);
          if (match) {
            results.push({ match: match[0], index: match.index, groups: Array.from(match), startIndices: [] });
          }
        }

        if (results.length === 0) {
          resultDiv.innerHTML = escapeHtml(testStr);
          matchCountSpan.textContent = '(无匹配)';
          groupDetailsDiv.innerHTML = '';
          return;
        }

        matchCountSpan.textContent = '(匹配 ' + results.length + ' 处)';

        // 高亮匹配（包含捕获组）
        let highlighted = '';
        let lastIndex = 0;
        for (const r of results) {
          // 未匹配部分
          highlighted += escapeHtml(testStr.slice(lastIndex, r.index));

          // 完整匹配 — 需要在其中标注捕获组
          const fullText = r.match;
          if (r.groups.length > 2) {
            // 有捕获组，在完整匹配中标注
            let fullHighlighted = '';
            let posInFull = 0;
            for (let g = 1; g < r.groups.length; g++) {
              const groupVal = r.groups[g];
              if (groupVal === undefined) continue;
              const groupStartInFull = fullText.indexOf(groupVal, posInFull);
              if (groupStartInFull === -1) continue;
              // 匹配前文本
              fullHighlighted += escapeHtml(fullText.slice(posInFull, groupStartInFull));
              fullHighlighted += '<span class="match-group">' + escapeHtml(groupVal) + '</span>';
              posInFull = groupStartInFull + groupVal.length;
            }
            // 剩余部分
            if (posInFull < fullText.length) {
              fullHighlighted += escapeHtml(fullText.slice(posInFull));
            }
            highlighted += '<span class="match-full">' + fullHighlighted + '</span>';
          } else {
            highlighted += '<span class="match-full">' + escapeHtml(fullText) + '</span>';
          }

          lastIndex = r.index + r.match.length;
        }
        highlighted += escapeHtml(testStr.slice(lastIndex));
        resultDiv.innerHTML = highlighted;

        // 捕获组表
        if (results.some(r => r.groups.length > 1)) {
          let tableHtml = '<table class="group-table"><tr><th>匹配</th><th>位置</th><th>完整匹配</th>';
          const maxGroups = Math.max(...results.map(r => r.groups.length - 1));
          for (let i = 1; i <= maxGroups; i++) {
            tableHtml += '<th>组 ' + i + '</th>';
          }
          tableHtml += '</tr>';
          results.forEach((r, idx) => {
            tableHtml += '<tr><td>' + (idx + 1) + '</td><td>' + r.index + '</td><td>' + escapeHtml(r.groups[0]) + '</td>';
            for (let i = 1; i <= maxGroups; i++) {
              tableHtml += '<td>' + (r.groups[i] !== undefined ? escapeHtml(r.groups[i]) : '-') + '</td>';
            }
            tableHtml += '</tr>';
          });
          tableHtml += '</table>';
          groupDetailsDiv.innerHTML = tableHtml;
        } else {
          groupDetailsDiv.innerHTML = '<div style="color:var(--vscode-descriptionForeground);font-size:13px;">无捕获组</div>';
        }

      } catch (e) {
        resultDiv.innerHTML = '<span class="error">正则表达式错误: ' + escapeHtml(e.message) + '</span>';
        matchCountSpan.textContent = '';
        groupDetailsDiv.innerHTML = '';
      }
    }

    patternInput.addEventListener('input', test);
    testInput.addEventListener('input', test);
    document.getElementById('flag-g').addEventListener('change', test);
    document.getElementById('flag-i').addEventListener('change', test);
    document.getElementById('flag-m').addEventListener('change', test);
    document.getElementById('flag-s').addEventListener('change', test);
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
