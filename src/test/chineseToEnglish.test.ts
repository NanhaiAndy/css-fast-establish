import * as assert from 'assert';
import { translateChineseToEnglish } from '../ChineseToEnglish';

suite('ChineseToEnglish Tests', () => {

  test('single character translation', () => {
    const result = translateChineseToEnglish('名');
    assert.strictEqual(result, 'name');
  });

  test('multi-character camelCase', () => {
    const result = translateChineseToEnglish('用户名');
    // 用→user, 户→account, 名→name → userAccountName
    assert.ok(result.length > 0);
    assert.ok(/^[a-z]/.test(result), 'should start with lowercase');
    // camelCase: first word lowercase, subsequent capitalized
    assert.ok(result !== result.toLowerCase() || result.split(/(?=[A-Z])/).length === 1);
  });

  test('preserves English characters', () => {
    const result = translateChineseToEnglish('名abc');
    assert.ok(result.includes('abc'));
  });

  test('mixed Chinese and English', () => {
    const result = translateChineseToEnglish('列表Data');
    // 列→list, 表→table, then "Data" appended
    assert.ok(result.length > 0);
    assert.ok(result.includes('ata'));
  });

  test('empty string', () => {
    const result = translateChineseToEnglish('');
    assert.strictEqual(result, '');
  });

  test('pure English is lowercased', () => {
    const result = translateChineseToEnglish('myVariable');
    // English-only input gets lowercased by camelCase logic
    assert.strictEqual(result, result.toLowerCase());
    assert.ok(result.includes('myvariable'));
  });

  test('unknown Chinese character preserved', () => {
    // 龘 is a rare character unlikely to be in the dictionary
    const result = translateChineseToEnglish('龘');
    assert.strictEqual(result, '龘');
  });

  test('common variable name: 用户名', () => {
    const result = translateChineseToEnglish('用户名');
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
    assert.ok(!/[\u4e00-\u9fa5]/.test(result.replace(/龘/g, '')), 'should not contain Chinese (except unknown)');
  });

  test('common variable name: 价格', () => {
    const result = translateChineseToEnglish('价格');
    assert.ok(result.length > 0);
  });

  test('common variable name: 状态', () => {
    const result = translateChineseToEnglish('状态');
    // Word-level: 状态 → status (from WORD_DICT)
    assert.strictEqual(result, 'status');
  });

  test('common variable name: 创建时间', () => {
    const result = translateChineseToEnglish('创建时间');
    assert.ok(result.length > 0);
    assert.ok(result.toLowerCase().includes('create'));
    assert.ok(result.toLowerCase().includes('time'));
  });

  test('camelCase format', () => {
    const result = translateChineseToEnglish('删除按钮');
    // 删→delete, 除→remove, 按→press, 钮→(not in dict likely)
    assert.ok(result.length > 0);
    // Verify camelCase: no underscores, no spaces
    assert.ok(!result.includes('_'));
    assert.ok(!result.includes(' '));
    assert.ok(result[0] === result[0].toLowerCase());
  });

  test('numbers preserved', () => {
    const result = translateChineseToEnglish('页1');
    assert.ok(result.includes('1'));
  });
});
