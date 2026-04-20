import * as assert from 'assert';
import * as toolbox from '../toolbox';

suite('Toolbox Tests', () => {

  // ==================== JSON → TypeScript ====================
  suite('jsonToTypeScript', () => {
    test('simple object', () => {
      const result = toolbox.jsonToTypeScript('{"name":"张三","age":25}', 'User');
      assert.ok(result.includes('interface User'));
      assert.ok(result.includes('name: string'));
      assert.ok(result.includes('age: number'));
    });

    test('nested object', () => {
      const json = '{"user":{"name":"张三","address":{"city":"北京"}}}';
      const result = toolbox.jsonToTypeScript(json, 'Root');
      assert.ok(result.includes('interface Root'));
      assert.ok(result.includes('interface RootUser'));
      assert.ok(result.includes('city: string'));
    });

    test('array of objects', () => {
      const json = '[{"id":1,"name":"a"},{"id":2,"name":"b"}]';
      const result = toolbox.jsonToTypeScript(json, 'List');
      assert.ok(result.includes('number'));
      assert.ok(result.includes('string'));
    });

    test('empty array returns empty', () => {
      const result = toolbox.jsonToTypeScript('[]', 'Empty');
      assert.strictEqual(result, '');
    });

    test('primitive types', () => {
      const json = '{"str":"hello","num":42,"flag":true,"nil":null}';
      const result = toolbox.jsonToTypeScript(json, 'Types');
      assert.ok(result.includes('str: string'));
      assert.ok(result.includes('num: number'));
      assert.ok(result.includes('flag: boolean'));
      assert.ok(result.includes('nil: null'));
    });

    test('invalid JSON', () => {
      const result = toolbox.jsonToTypeScript('not json', 'Root');
      assert.ok(result.includes('无效的 JSON'));
    });
  });

  suite('generateZodSchema', () => {
    test('simple object', () => {
      const result = toolbox.generateZodSchema('{"name":"张三","age":25}', 'User');
      assert.ok(result.includes("import { z } from 'zod'"));
      assert.ok(result.includes('z.string()'));
      assert.ok(result.includes('z.number()'));
      assert.ok(result.includes('UserSchema'));
    });

    test('invalid JSON returns error', () => {
      const result = toolbox.generateZodSchema('{bad}', 'Root');
      assert.ok(result.includes('无效的 JSON'));
    });
  });

  // ==================== CSS 单位转换 ====================
  suite('convertCssUnits', () => {
    test('px → rem', () => {
      const result = toolbox.convertCssUnits('font-size: 16px; margin: 32px;', 'px2rem', 16);
      assert.ok(result.includes('1rem'));
      assert.ok(result.includes('2rem'));
    });

    test('px → rem non-integer', () => {
      const result = toolbox.convertCssUnits('padding: 15px;', 'px2rem', 16);
      assert.ok(result.includes('rem'));
      assert.ok(!result.includes('15px'));
    });

    test('rem → px', () => {
      const result = toolbox.convertCssUnits('margin: 2rem;', 'rem2px', 16);
      assert.ok(result.includes('32px'));
    });

    test('px → vw', () => {
      const result = toolbox.convertCssUnits('width: 375px;', 'px2vw', 16, 375);
      assert.ok(result.includes('100vw'));
    });

    test('vw → px', () => {
      const result = toolbox.convertCssUnits('width: 50vw;', 'vw2px', 16, 375);
      assert.ok(result.includes('187.5px'));
    });

    test('ignores non-matching units', () => {
      const result = toolbox.convertCssUnits('color: red;', 'px2rem', 16);
      assert.strictEqual(result, 'color: red;');
    });

    test('only converts matching unit type', () => {
      const result = toolbox.convertCssUnits('margin: 16px 1rem;', 'px2rem', 16);
      assert.ok(result.includes('1rem')); // px converted
    });
  });

  // ==================== 颜色格式转换 ====================
  suite('detectColorFormat', () => {
    test('hex3', () => {
      assert.strictEqual(toolbox.detectColorFormat('#fff'), 'hex3');
    });
    test('hex6', () => {
      assert.strictEqual(toolbox.detectColorFormat('#ffffff'), 'hex6');
    });
    test('hex8', () => {
      assert.strictEqual(toolbox.detectColorFormat('#ffffffaa'), 'hex8');
    });
    test('rgb', () => {
      assert.strictEqual(toolbox.detectColorFormat('rgb(255, 0, 0)'), 'rgb');
    });
    test('rgba', () => {
      assert.strictEqual(toolbox.detectColorFormat('rgba(255, 0, 0, 0.5)'), 'rgba');
    });
    test('hsl', () => {
      assert.strictEqual(toolbox.detectColorFormat('hsl(0, 100%, 50%)'), 'hsl');
    });
    test('invalid', () => {
      assert.strictEqual(toolbox.detectColorFormat('notacolor'), null);
    });
  });

  suite('parseColor', () => {
    test('hex3', () => {
      const c = toolbox.parseColor('#f00');
      assert.deepStrictEqual(c, { r: 255, g: 0, b: 0, a: 1 });
    });
    test('hex6', () => {
      const c = toolbox.parseColor('#00ff00');
      assert.deepStrictEqual(c, { r: 0, g: 255, b: 0, a: 1 });
    });
    test('rgb', () => {
      const c = toolbox.parseColor('rgb(0, 0, 255)');
      assert.deepStrictEqual(c, { r: 0, g: 0, b: 255, a: 1 });
    });
    test('rgba', () => {
      const c = toolbox.parseColor('rgba(255, 0, 0, 0.5)');
      assert.strictEqual(c!.a, 0.5);
    });
    test('invalid returns null', () => {
      assert.strictEqual(toolbox.parseColor('notacolor'), null);
    });
  });

  suite('colorToFormat', () => {
    test('to hex', () => {
      const result = toolbox.colorToFormat({ r: 255, g: 0, b: 0, a: 1 }, 'hex');
      assert.strictEqual(result, '#ff0000');
    });
    test('to rgb', () => {
      const result = toolbox.colorToFormat({ r: 255, g: 128, b: 0, a: 1 }, 'rgb');
      assert.strictEqual(result, 'rgb(255, 128, 0)');
    });
    test('to rgba', () => {
      const result = toolbox.colorToFormat({ r: 0, g: 0, b: 255, a: 0.5 }, 'rgba');
      assert.strictEqual(result, 'rgba(0, 0, 255, 0.5)');
    });
    test('to hsl', () => {
      const result = toolbox.colorToFormat({ r: 255, g: 0, b: 0, a: 1 }, 'hsl');
      assert.ok(result.startsWith('hsl('));
      assert.ok(result.includes('100%'));
    });
  });

  // ==================== 时间戳转换 ====================
  suite('isTimestamp', () => {
    test('10-digit', () => {
      assert.strictEqual(toolbox.isTimestamp('1700000000'), true);
    });
    test('13-digit', () => {
      assert.strictEqual(toolbox.isTimestamp('1700000000000'), true);
    });
    test('invalid', () => {
      assert.strictEqual(toolbox.isTimestamp('abc'), false);
    });
    test('9-digit', () => {
      assert.strictEqual(toolbox.isTimestamp('170000000'), false);
    });
  });

  suite('timestampToDate', () => {
    test('10-digit seconds', () => {
      const result = toolbox.timestampToDate('1700000000');
      assert.ok(result.includes('2023'));
      assert.ok(result.match(/^\d{4}-\d{2}-\d{2}/));
    });
    test('13-digit milliseconds', () => {
      const result = toolbox.timestampToDate('1700000000000');
      assert.ok(result.includes('2023'));
    });
  });

  suite('dateToTimestamp', () => {
    test('valid date', () => {
      const result = toolbox.dateToTimestamp('2024-01-01 00:00:00');
      assert.ok(!result.seconds.includes('无效'));
      assert.ok(parseInt(result.milliseconds) > 0);
    });
    test('invalid date', () => {
      const result = toolbox.dateToTimestamp('notadate');
      assert.strictEqual(result.seconds, '无效日期');
    });
  });

  // ==================== 编解码 ====================
  suite('urlEncode/Decode', () => {
    test('encode', () => {
      assert.strictEqual(toolbox.urlEncode('hello world'), 'hello%20world');
    });
    test('decode', () => {
      assert.strictEqual(toolbox.urlDecode('hello%20world'), 'hello world');
    });
    test('encode Chinese', () => {
      const encoded = toolbox.urlEncode('你好');
      assert.ok(!encoded.includes('你好'));
      assert.strictEqual(toolbox.urlDecode(encoded), '你好');
    });
  });

  suite('base64Encode/Decode', () => {
    test('roundtrip', () => {
      const encoded = toolbox.base64Encode('hello world');
      assert.strictEqual(toolbox.base64Decode(encoded), 'hello world');
    });
  });

  suite('htmlEntityEncode/Decode', () => {
    test('encode', () => {
      assert.strictEqual(toolbox.htmlEntityEncode('<div>&'), '&lt;div&gt;&amp;');
    });
    test('decode', () => {
      assert.strictEqual(toolbox.htmlEntityDecode('&lt;div&gt;'), '<div>');
    });
    test('roundtrip', () => {
      const original = '<p class="test">&\'</p>';
      const encoded = toolbox.htmlEntityEncode(original);
      assert.strictEqual(toolbox.htmlEntityDecode(encoded), original);
    });
  });

  // ==================== SVG 优化 ====================
  suite('optimizeSvg', () => {
    test('removes XML declaration', () => {
      const svg = '<?xml version="1.0"?><svg></svg>';
      assert.ok(!toolbox.optimizeSvg(svg).includes('<?xml'));
    });

    test('removes comments', () => {
      const svg = '<svg><!-- comment --></svg>';
      assert.ok(!toolbox.optimizeSvg(svg).includes('<!--'));
    });

    test('removes metadata', () => {
      const svg = '<svg><metadata>data</metadata></svg>';
      assert.ok(!toolbox.optimizeSvg(svg).includes('metadata'));
    });

    test('compresses whitespace', () => {
      const svg = '<svg>  <rect />  </svg>';
      assert.ok(toolbox.optimizeSvg(svg).indexOf('  ') === -1);
    });

    test('preserves svg content', () => {
      const svg = '<svg><rect x="0" y="0" width="100" height="100"/></svg>';
      const result = toolbox.optimizeSvg(svg);
      assert.ok(result.includes('rect'));
      assert.ok(result.includes('100'));
    });
  });

  // ==================== Console.log 管理 ====================
  suite('generateConsoleLog', () => {
    test('basic', () => {
      const result = toolbox.generateConsoleLog('myVar');
      assert.strictEqual(result, "console.log('myVar:', myVar);");
    });
  });

  suite('removeAllConsoleLogs', () => {
    test('removes console.log', () => {
      const code = 'const a = 1;\nconsole.log("debug");\nconst b = 2;';
      const { result, count } = toolbox.removeAllConsoleLogs(code);
      assert.strictEqual(count, 1);
      assert.ok(!result.includes('console.log'));
    });

    test('removes console.warn and console.error', () => {
      const code = 'console.warn("warn");\nconsole.error("err");';
      const { count } = toolbox.removeAllConsoleLogs(code);
      assert.strictEqual(count, 2);
    });

    test('preserves non-console code', () => {
      const code = 'const x = 1;\nconsole.log("x");\nreturn x;';
      const { result } = toolbox.removeAllConsoleLogs(code);
      assert.ok(result.includes('const x = 1'));
      assert.ok(result.includes('return x'));
    });
  });

  suite('findAllConsoleLogs', () => {
    test('finds all console statements', () => {
      const code = 'console.log("a");\nconst x = 1;\nconsole.error("b");';
      const found = toolbox.findAllConsoleLogs(code);
      assert.strictEqual(found.length, 2);
      assert.strictEqual(found[0].line, 0);
      assert.strictEqual(found[1].line, 2);
    });

    test('returns empty for no console', () => {
      const code = 'const x = 1;\nreturn x;';
      const found = toolbox.findAllConsoleLogs(code);
      assert.strictEqual(found.length, 0);
    });
  });

  suite('commentAllConsoleLogs', () => {
    test('comments console statements', () => {
      const code = '  console.log("debug");';
      const { result, count } = toolbox.commentAllConsoleLogs(code);
      assert.strictEqual(count, 1);
      assert.ok(result.includes('// [toolbox]'));
    });
  });

  suite('toggleConsoleLogs', () => {
    test('comments uncommented and uncomments commented', () => {
      const code = 'console.log("a");\n// [toolbox] console.log("b");';
      const { result, count } = toolbox.toggleConsoleLogs(code);
      assert.ok(count >= 1);
    });
  });

  // ==================== 占位图 ====================
  suite('generatePlaceholderTag', () => {
    test('basic', () => {
      const tag = toolbox.generatePlaceholderTag(200, 100);
      assert.ok(tag.includes('200x100'));
      assert.ok(tag.includes('<img'));
    });

    test('with text', () => {
      const tag = toolbox.generatePlaceholderTag(200, 100, 'Hello');
      assert.ok(tag.includes('Hello'));
    });
  });
});
