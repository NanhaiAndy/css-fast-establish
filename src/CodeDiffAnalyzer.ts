interface DiffOptions {
  codeA: string;
  codeB: string;
  language?: string;
  context?: string;
}

function buildDiffMessages(options: DiffOptions): Array<{ role: string; content: string }> {
  const systemPrompt = `你是一位经验丰富的技术负责人。请对比以下两段代码，生成语义化的差异说明。

要求:
1. 使用中文描述
2. 按照"变更类型"分类（新增功能、修改逻辑、重构优化、Bug修复、破坏性变更等）
3. 每个变更点说明: 变了什么、为什么变、可能的影响
4. 如果发现潜在问题（如性能、安全、兼容性），请标注"注意"
5. 最后给出总结和风险等级（低/中/高）
6. 输出格式适合直接粘贴到 PR 描述中，使用 Markdown 格式

输出模板:
## 变更概要
[1-2句话总结]

## 详细变更

### [变更类型1]
- **位置**: [描述]
- **内容**: [具体变更]
- **影响**: [可能的影响]

### [变更类型2]
...

## 注意事项
[潜在问题和建议]

## 风险等级: [低/中/高]`;

  const userContent = `代码A（原代码）:\n\`\`\`${options.language || ''}\n${options.codeA}\n\`\`\`\n\n代码B（新代码）:\n\`\`\`${options.language || ''}\n${options.codeB}\n\`\`\``;

  if (options.context) {
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent + `\n\n额外上下文: ${options.context}` }
    ];
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];
}

export default {
  buildDiffMessages
};
