/**
 * Figma 设计令牌提取器
 * 从 Figma 文件数据中提取颜色、字体、圆角、间距等设计令牌
 */

export interface DesignTokens {
  colors: Array<{ name: string; value: string }>;
  fonts: Array<{ family: string; size: number; weight: number }>;
  radii: number[];
  spacings: number[];
}

/**
 * 从 Figma 文件数据中递归提取设计令牌
 */
export function extractDesignTokens(figmaData: any): DesignTokens {
  const colors = new Map<string, string>();
  const fontsSet = new Map<string, { family: string; size: number; weight: number }>();
  const radiiSet = new Set<number>();
  const spacingsSet = new Set<number>();

  function walk(node: any) {
    if (!node || typeof node !== 'object') return;

    // 提取颜色（fills 和 strokes）
    extractColorsFromFills(node.fills, colors);
    extractColorsFromFills(node.strokes, colors);

    // 提取圆角
    if (node.cornerRadius && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
      radiiSet.add(node.cornerRadius);
    }
    if (node.rectangleCornerRadii && Array.isArray(node.rectangleCornerRadii)) {
      for (const r of node.rectangleCornerRadii) {
        if (r > 0) radiiSet.add(r);
      }
    }

    // 提取字体信息（TEXT 节点）
    if (node.type === 'TEXT' && node.style) {
      const family = node.style.fontFamily || '';
      const size = node.style.fontSize || 0;
      const weight = node.style.fontWeight || 400;
      if (family && size > 0) {
        const key = `${family}-${size}-${weight}`;
        if (!fontsSet.has(key)) {
          fontsSet.set(key, { family, size, weight });
        }
      }
    }

    // 提取间距
    if (node.itemSpacing && typeof node.itemSpacing === 'number' && node.itemSpacing > 0) {
      spacingsSet.add(node.itemSpacing);
    }
    if (node.paddingLeft && node.paddingLeft > 0) spacingsSet.add(node.paddingLeft);
    if (node.paddingRight && node.paddingRight > 0) spacingsSet.add(node.paddingRight);
    if (node.paddingTop && node.paddingTop > 0) spacingsSet.add(node.paddingTop);
    if (node.paddingBottom && node.paddingBottom > 0) spacingsSet.add(node.paddingBottom);

    // 递归子节点
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  // 从 document 节点开始遍历
  if (figmaData.document) {
    walk(figmaData.document);
  }

  // 排序
  const colorList = Array.from(colors.entries()).map(([name, value]) => ({ name, value }));
  const fontList = Array.from(fontsSet.values()).sort((a, b) => a.size - b.size);
  const radiiList = Array.from(radiiSet).sort((a, b) => a - b);
  const spacingList = Array.from(spacingsSet).sort((a, b) => a - b);

  return {
    colors: colorList,
    fonts: fontList,
    radii: radiiList,
    spacings: spacingList
  };
}

function extractColorsFromFills(fills: any[], colorMap: Map<string, string>) {
  if (!Array.isArray(fills)) return;
  for (const fill of fills) {
    if (fill.type === 'SOLID' && fill.visible !== false && fill.color) {
      const { r, g, b } = fill.color;
      const hex = '#' + [r, g, b]
        .map((v: number) => Math.round(v * 255).toString(16).padStart(2, '0'))
        .join('');
      if (!colorMap.has(hex)) {
        colorMap.set(hex, hex);
      }
    }
  }
}

/**
 * 格式化为 CSS Variables
 */
export function formatTokensAsCss(tokens: DesignTokens): string {
  let output = ':root {\n';

  // 颜色
  tokens.colors.forEach((c, i) => {
    output += `  /* Color ${i + 1} */\n  --color-${i + 1}: ${c.value};\n`;
  });

  // 字体
  output += '\n  /* Font Sizes */\n';
  const uniqueSizes = [...new Set(tokens.fonts.map(f => f.size))].sort((a, b) => a - b);
  uniqueSizes.forEach((size, i) => {
    output += `  --font-size-${i + 1}: ${size}px;\n`;
  });

  // 圆角
  if (tokens.radii.length > 0) {
    output += '\n  /* Border Radius */\n';
    tokens.radii.forEach((r, i) => {
      output += `  --radius-${i + 1}: ${r}px;\n`;
    });
  }

  // 间距
  if (tokens.spacings.length > 0) {
    output += '\n  /* Spacing */\n';
    tokens.spacings.forEach((s, i) => {
      output += `  --spacing-${i + 1}: ${s}px;\n`;
    });
  }

  output += '}\n';
  return output;
}

/**
 * 格式化为 SCSS Variables
 */
export function formatTokensAsScss(tokens: DesignTokens): string {
  let output = '// Design Tokens\n\n';

  output += '// Colors\n';
  tokens.colors.forEach((c, i) => {
    output += `$color-${i + 1}: ${c.value};\n`;
  });

  output += '\n// Font Sizes\n';
  const uniqueSizes = [...new Set(tokens.fonts.map(f => f.size))].sort((a, b) => a - b);
  uniqueSizes.forEach((size, i) => {
    output += `$font-size-${i + 1}: ${size}px;\n`;
  });

  if (tokens.radii.length > 0) {
    output += '\n// Border Radius\n';
    tokens.radii.forEach((r, i) => {
      output += `$radius-${i + 1}: ${r}px;\n`;
    });
  }

  if (tokens.spacings.length > 0) {
    output += '\n// Spacing\n';
    tokens.spacings.forEach((s, i) => {
      output += `$spacing-${i + 1}: ${s}px;\n`;
    });
  }

  return output;
}

/**
 * 格式化为 Tailwind Config
 */
export function formatTokensAsTailwind(tokens: DesignTokens): string {
  const colorsObj: Record<string, string> = {};
  tokens.colors.forEach((c, i) => {
    colorsObj[`token-${i + 1}`] = c.value;
  });

  const uniqueSizes = [...new Set(tokens.fonts.map(f => f.size))].sort((a, b) => a - b);
  const fontSizeObj: Record<string, string> = {};
  uniqueSizes.forEach((size, i) => {
    fontSizeObj[`token-${i + 1}`] = `${size}px`;
  });

  const radiiObj: Record<string, string> = {};
  tokens.radii.forEach((r, i) => {
    radiiObj[`token-${i + 1}`] = `${r}px`;
  });

  const spacingObj: Record<string, string> = {};
  tokens.spacings.forEach((s, i) => {
    spacingObj[`token-${i + 1}`] = `${s}px`;
  });

  let output = '// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n';

  output += '      colors: ' + JSON.stringify(colorsObj, null, 8).split('\n').map((l, i) => i === 0 ? l : '      ' + l).join('\n') + ',\n';
  output += '      fontSize: ' + JSON.stringify(fontSizeObj, null, 8).split('\n').map((l, i) => i === 0 ? l : '      ' + l).join('\n') + ',\n';

  if (Object.keys(radiiObj).length > 0) {
    output += '      borderRadius: ' + JSON.stringify(radiiObj, null, 8).split('\n').map((l, i) => i === 0 ? l : '      ' + l).join('\n') + ',\n';
  }
  if (Object.keys(spacingObj).length > 0) {
    output += '      spacing: ' + JSON.stringify(spacingObj, null, 8).split('\n').map((l, i) => i === 0 ? l : '      ' + l).join('\n') + ',\n';
  }

  output += '    }\n  }\n}\n';
  return output;
}

/**
 * 按格式输出设计令牌
 */
export function formatDesignTokens(tokens: DesignTokens, format: 'css' | 'scss' | 'tailwind'): string {
  switch (format) {
    case 'css': return formatTokensAsCss(tokens);
    case 'scss': return formatTokensAsScss(tokens);
    case 'tailwind': return formatTokensAsTailwind(tokens);
    default: return formatTokensAsCss(tokens);
  }
}
