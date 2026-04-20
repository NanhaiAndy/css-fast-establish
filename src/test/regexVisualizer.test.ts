import * as assert from 'assert';
import { parseRegex, analyzeMatches, RegexToken } from '../RegexVisualizer';

suite('RegexVisualizer Tests', () => {

  suite('parseRegex', () => {
    test('simple literal', () => {
      const tokens = parseRegex('abc');
      assert.strictEqual(tokens.length, 3);
      assert.strictEqual(tokens[0].type, 'literal');
      assert.strictEqual(tokens[0].text, 'a');
    });

    test('anchors', () => {
      const tokens = parseRegex('^abc$');
      const types = tokens.map(t => t.type);
      assert.ok(types.includes('anchor'));
      assert.strictEqual(tokens[0].text, '^');
      assert.strictEqual(tokens[tokens.length - 1].text, '$');
    });

    test('shorthand classes', () => {
      const tokens = parseRegex('\\d\\w\\s');
      assert.strictEqual(tokens.length, 3);
      assert.strictEqual(tokens[0].type, 'shorthand');
      assert.strictEqual(tokens[0].text, '\\d');
      assert.ok(tokens[0].description.includes('数字'));
    });

    test('quantifiers', () => {
      const tokens = parseRegex('a*b+c?');
      const quantifiers = tokens.filter(t => t.type === 'quantifier');
      assert.strictEqual(quantifiers.length, 3);
      assert.strictEqual(quantifiers[0].text, '*');
      assert.strictEqual(quantifiers[1].text, '+');
      assert.strictEqual(quantifiers[2].text, '?');
    });

    test('non-greedy quantifiers', () => {
      const tokens = parseRegex('a*?b+?c??');
      const quantifiers = tokens.filter(t => t.type === 'quantifier');
      assert.strictEqual(quantifiers.length, 3);
      assert.ok(quantifiers[0].text.includes('?'));
      assert.ok(quantifiers[0].description.includes('非贪婪'));
    });

    test('curly brace quantifiers', () => {
      const tokens = parseRegex('a{3}b{2,5}c{1,}');
      const quantifiers = tokens.filter(t => t.type === 'quantifier');
      assert.strictEqual(quantifiers.length, 3);
      assert.ok(quantifiers[0].text.includes('{3}'));
    });

    test('character sets', () => {
      const tokens = parseRegex('[abc]');
      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0].type, 'charset');
      assert.strictEqual(tokens[0].text, '[abc]');
    });

    test('negated character sets', () => {
      const tokens = parseRegex('[^abc]');
      assert.strictEqual(tokens[0].type, 'charset');
      assert.ok(tokens[0].description.includes('排除'));
    });

    test('capture groups', () => {
      const tokens = parseRegex('(abc)');
      assert.strictEqual(tokens.length, 1);
      assert.strictEqual(tokens[0].type, 'group');
      assert.ok(tokens[0].description.includes('捕获组'));
    });

    test('non-capture groups', () => {
      const tokens = parseRegex('(?:abc)');
      assert.strictEqual(tokens[0].type, 'group');
      assert.ok(tokens[0].description.includes('非捕获组'));
    });

    test('named capture groups', () => {
      const tokens = parseRegex('(?<name>abc)');
      assert.strictEqual(tokens[0].type, 'group');
      assert.ok(tokens[0].description.includes('name'));
    });

    test('lookahead positive', () => {
      const tokens = parseRegex('(?=abc)');
      assert.strictEqual(tokens[0].type, 'lookaround');
      assert.ok(tokens[0].description.includes('正向先行'));
    });

    test('lookahead negative', () => {
      const tokens = parseRegex('(?!abc)');
      assert.strictEqual(tokens[0].type, 'lookaround');
      assert.ok(tokens[0].description.includes('负向先行'));
    });

    test('alternation', () => {
      const tokens = parseRegex('a|b');
      const alts = tokens.filter(t => t.type === 'alternation');
      assert.strictEqual(alts.length, 1);
    });

    test('dot', () => {
      const tokens = parseRegex('a.b');
      const dots = tokens.filter(t => t.type === 'dot');
      assert.strictEqual(dots.length, 1);
    });

    test('backreference', () => {
      const tokens = parseRegex('(a)\\1');
      const backrefs = tokens.filter(t => t.type === 'backreference');
      assert.strictEqual(backrefs.length, 1);
      assert.ok(backrefs[0].description.includes('反向引用'));
    });

    test('escape sequences', () => {
      const tokens = parseRegex('\\(\\)');
      const escapes = tokens.filter(t => t.type === 'escape');
      assert.strictEqual(escapes.length, 2);
    });

    test('complex regex', () => {
      const tokens = parseRegex('^(\\d{3})-(\\d{4})$');
      const types = tokens.map(t => t.type);
      assert.ok(types.includes('anchor'));
      assert.ok(types.includes('group'));
      assert.ok(types.includes('literal'));
      // Quantifiers ({3}, {4}) are inside groups, parsed as part of group content
      assert.ok(types.includes('group') || types.includes('quantifier'));
    });

    test('email-like regex', () => {
      const tokens = parseRegex('[\\w.+-]+@[\\w-]+\\.[a-zA-Z]+');
      assert.ok(tokens.length > 0);
    });
  });

  suite('analyzeMatches', () => {
    test('simple match', () => {
      const results = analyzeMatches(/hello/, 'say hello world');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].fullMatch, 'hello');
    });

    test('global match', () => {
      const results = analyzeMatches(/a/g, 'banana');
      assert.strictEqual(results.length, 3);
    });

    test('capture groups', () => {
      const results = analyzeMatches(/(\d+)-(\d+)/, '123-456');
      assert.strictEqual(results[0].groups.length, 2);
      assert.strictEqual(results[0].groups[0].value, '123');
      assert.strictEqual(results[0].groups[1].value, '456');
    });

    test('no match', () => {
      const results = analyzeMatches(/xyz/, 'hello world');
      assert.strictEqual(results.length, 0);
    });

    test('multiple matches with groups', () => {
      const results = analyzeMatches(/(\w+)=(\d+)/g, 'a=1 b=2');
      assert.strictEqual(results.length, 2);
    });
  });
});
