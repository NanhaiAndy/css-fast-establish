interface ApiCodeOptions {
  jsonResponse: string;
  method?: string;
  url?: string;
  requestLibrary: 'axios' | 'fetch';
}

function buildApiCodeMessages(options: ApiCodeOptions): Array<{ role: string; content: string }> {
  const method = options.method || 'GET';

  const systemPrompt = `你是一位专业的前端开发工程师。请根据以下API响应数据，生成完整的请求代码。

要求:
1. 使用 ${options.requestLibrary} 发送请求
2. 生成完整的 TypeScript 代码，包括接口类型定义（interface）
3. 代码应包含: 响应数据类型定义、请求参数接口、请求函数封装、调用示例、错误处理
4. 请求方法: ${method}
5. ${options.url ? `API端点: ${options.url}` : '请推断合理的API端点路径'}
6. 函数命名应语义化（如 fetchUserList、createOrder 等）
7. 代码结构清晰，可直接复制使用
8. 只输出代码，不要输出解释文字`;

  const userContent = `API响应数据:\n\`\`\`json\n${options.jsonResponse}\n\`\`\``;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];
}

export default {
  buildApiCodeMessages
};
