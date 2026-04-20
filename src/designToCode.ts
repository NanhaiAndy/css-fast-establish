import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';

interface AIResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

// 移除字符串前后的代码块标记
const removeCodeBlockMarkers = function (text: string): string {
	let result = text.replace(/^```(?:html|vue|jsx|tsx|css|scss|less|typescript|javascript)\s*/i, '');
	result = result.replace(/\s*```$/, '');
	return result;
};

// ==================== 辅助函数 ====================

// 格式 → 文件扩展名
const getOutputExt = function (outputFormat: string): string {
	const map: { [key: string]: string } = {
		html: '.html',
		vue: '.vue',
		vue3: '.vue',
		react: '.jsx',
		tailwind: '.html'
	};
	return map[outputFormat] || '.html';
};

// 格式 → VS Code 语言ID
const getOutputLanguage = function (outputFormat: string): string {
	const map: { [key: string]: string } = {
		html: 'html',
		vue: 'vue',
		vue3: 'vue',
		react: 'javascriptreact',
		tailwind: 'html'
	};
	return map[outputFormat] || 'html';
};

// 检查代码是否有明显问题
const checkCodeIssues = function (code: string, outputFormat: string): string[] {
	const issues: string[] = [];
	const trimmed = code.trim();

	if (!trimmed) {
		issues.push('生成的代码为空');
		return issues;
	}

	// Vue SFC 检查
	if (outputFormat === 'vue' || outputFormat === 'vue3') {
		if (!trimmed.includes('<template')) {
			issues.push('Vue组件缺少 <template> 标签');
		}
		if (trimmed.includes('<template') && !trimmed.includes('</template>')) {
			issues.push('Vue组件 <template> 标签未闭合');
		}
		if (trimmed.includes('<style') && !trimmed.includes('</style>')) {
			issues.push('Vue组件 <style> 标签未闭合');
		}
		if (trimmed.includes('<script') && !trimmed.includes('</script>')) {
			issues.push('Vue组件 <script> 标签未闭合');
		}
	}

	// HTML 检查
	if (outputFormat === 'html' || outputFormat === 'tailwind') {
		if (!trimmed.includes('<html') && !trimmed.includes('<div') && !trimmed.includes('<body')) {
			issues.push('HTML缺少基本结构标签');
		}
	}

	// 通用检查 — 未闭合的大括号
	const openBraces = (trimmed.match(/\{/g) || []).length;
	const closeBraces = (trimmed.match(/\}/g) || []).length;
	if (Math.abs(openBraces - closeBraces) > 1) {
		issues.push('CSS/JS 大括号不匹配');
	}

	// 检查是否包含 markdown 代码块标记（AI 幻觉）
	if (trimmed.startsWith('```') || trimmed.endsWith('```')) {
		issues.push('代码中包含多余的 markdown 标记');
	}

	return issues;
};

// ==================== AI 调用 ====================

// 读取 AI 配置
const getAIConfig = function () {
	const userConfig = vscode.workspace.getConfiguration().get('generateCssTree') as any;
	return {
		apiEndpoint: userConfig.aiApiEndpoint || 'https://openai.qiniu.com/v1/chat/completions',
		apiKey: userConfig.aiApiKey || '',
		model: userConfig.aiModel || 'deepseek/deepseek-v3.2-251201'
	};
};

// 构造请求 URL 和 options
const buildRequestOptions = function (endpoint: string, apiKey: string, postData: string) {
	let normalizedEndpoint = endpoint.replace(/\/+$/, '');
	if (!normalizedEndpoint.endsWith('/chat/completions')) {
		normalizedEndpoint += '/chat/completions';
	}

	const url = new URL(normalizedEndpoint);
	const protocol = url.protocol === 'https:' ? https : http;

	const options = {
		hostname: url.hostname,
		port: url.port || (url.protocol === 'https:' ? 443 : 80),
		path: url.pathname + url.search,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`,
			'Content-Length': Buffer.byteLength(postData)
		}
	};

	return { protocol, options };
};

// 流式调用（SSE），支持模型覆盖参数
const callAIStreamWithModel = async function (
	messages: Array<any>,
	onChunk: (text: string) => void,
	modelOverride?: string
): Promise<string> {
	const config = getAIConfig();

	if (!config.apiKey) {
		throw new Error('请先在设置中配置AI API Key (generateCssTree.aiApiKey)');
	}

	const model = modelOverride || config.model;
	const postData = JSON.stringify({ model, messages, stream: true });
	const { protocol, options } = buildRequestOptions(config.apiEndpoint, config.apiKey, postData);

	return new Promise<string>((resolve, reject) => {
		const req = protocol.request(options, (res) => {
			if (res.statusCode !== 200) {
				let errorData = '';
				res.on('data', (chunk: string | Buffer) => { errorData += chunk; });
				res.on('end', () => {
					reject(new Error(`API请求失败: ${res.statusCode} ${res.statusMessage}\n${errorData.substring(0, 500)}`));
				});
				return;
			}

			let fullText = '';
			let buffer = '';

			res.on('data', (chunk: string | Buffer) => {
				buffer += chunk.toString();
				// 按行分割处理 SSE
				const lines = buffer.split('\n');
				// 最后一行可能不完整，保留
				buffer = lines.pop() || '';

				for (const line of lines) {
					const trimmedLine = line.trim();
					if (!trimmedLine || !trimmedLine.startsWith('data:')) {
						continue;
					}

					const dataStr = trimmedLine.slice(5).trim();
					if (dataStr === '[DONE]') {
						resolve(fullText);
						return;
					}

					try {
						const parsed = JSON.parse(dataStr);
						const delta = parsed.choices?.[0]?.delta?.content;
						if (delta) {
							fullText += delta;
							onChunk(delta);
						}
					} catch {
						// 忽略解析失败的行
					}
				}
			});

			res.on('end', () => {
				// 处理 buffer 中剩余数据
				if (buffer.trim()) {
					const trimmedLine = buffer.trim();
					if (trimmedLine.startsWith('data:')) {
						const dataStr = trimmedLine.slice(5).trim();
						if (dataStr !== '[DONE]') {
							try {
								const parsed = JSON.parse(dataStr);
								const delta = parsed.choices?.[0]?.delta?.content;
								if (delta) {
									fullText += delta;
									onChunk(delta);
								}
							} catch {
								// 忽略
							}
						}
					}
				}
				resolve(fullText);
			});

			res.on('error', (error: Error) => {
				reject(error);
			});
		});

		req.on('error', (error: Error) => {
			reject(error);
		});

		req.write(postData);
		req.end();
	});
};

// 非流式调用（保留兼容）
const callAI = async function (messages: Array<any>): Promise<string> {
	const config = getAIConfig();

	if (!config.apiKey) {
		throw new Error('请先在设置中配置AI API Key (generateCssTree.aiApiKey)');
	}

	const postData = JSON.stringify({ model: config.model, messages, stream: false });
	const { protocol, options } = buildRequestOptions(config.apiEndpoint, config.apiKey, postData);

	const responsePromise = new Promise<{ statusCode: number | undefined; statusMessage: string; data: string }>((resolve, reject) => {
		const req = protocol.request(options, (res) => {
			let data = '';
			res.on('data', (chunk: string | Buffer) => {
				data += chunk;
			});
			res.on('end', () => {
				resolve({
					statusCode: res.statusCode,
					statusMessage: res.statusMessage || '',
					data: data
				});
			});
		});
		req.on('error', (error: Error) => {
			reject(error);
		});
		req.write(postData);
		req.end();
	});

	const response = await responsePromise;

	if (response.statusCode !== 200) {
		throw new Error(`API请求失败: ${response.statusCode} ${response.statusMessage}\n${response.data.substring(0, 500)}`);
	}

	const data = JSON.parse(response.data) as AIResponse;
	return data.choices[0].message.content;
};

// 流式调用（SSE）
const callAIStream = async function (
	messages: Array<any>,
	onChunk: (text: string) => void
): Promise<string> {
	const config = getAIConfig();

	if (!config.apiKey) {
		throw new Error('请先在设置中配置AI API Key (generateCssTree.aiApiKey)');
	}

	const postData = JSON.stringify({ model: config.model, messages, stream: true });
	const { protocol, options } = buildRequestOptions(config.apiEndpoint, config.apiKey, postData);

	return new Promise<string>((resolve, reject) => {
		const req = protocol.request(options, (res) => {
			if (res.statusCode !== 200) {
				let errorData = '';
				res.on('data', (chunk: string | Buffer) => { errorData += chunk; });
				res.on('end', () => {
					reject(new Error(`API请求失败: ${res.statusCode} ${res.statusMessage}\n${errorData.substring(0, 500)}`));
				});
				return;
			}

			let fullText = '';
			let buffer = '';

			res.on('data', (chunk: string | Buffer) => {
				buffer += chunk.toString();
				// 按行分割处理 SSE
				const lines = buffer.split('\n');
				// 最后一行可能不完整，保留
				buffer = lines.pop() || '';

				for (const line of lines) {
					const trimmedLine = line.trim();
					if (!trimmedLine || !trimmedLine.startsWith('data:')) {
						continue;
					}

					const dataStr = trimmedLine.slice(5).trim();
					if (dataStr === '[DONE]') {
						resolve(fullText);
						return;
					}

					try {
						const parsed = JSON.parse(dataStr);
						const delta = parsed.choices?.[0]?.delta?.content;
						if (delta) {
							fullText += delta;
							onChunk(delta);
						}
					} catch {
						// 忽略解析失败的行
					}
				}
			});

			res.on('end', () => {
				// 处理 buffer 中剩余数据
				if (buffer.trim()) {
					const trimmedLine = buffer.trim();
					if (trimmedLine.startsWith('data:')) {
						const dataStr = trimmedLine.slice(5).trim();
						if (dataStr !== '[DONE]') {
							try {
								const parsed = JSON.parse(dataStr);
								const delta = parsed.choices?.[0]?.delta?.content;
								if (delta) {
									fullText += delta;
									onChunk(delta);
								}
							} catch {
								// 忽略
							}
						}
					}
				}
				resolve(fullText);
			});

			res.on('error', (error: Error) => {
				reject(error);
			});
		});

		req.on('error', (error: Error) => {
			reject(error);
		});

		req.write(postData);
		req.end();
	});
};

// 自修复调用
const callAIFix = async function (originalCode: string, issues: string[], outputFormat: string): Promise<string> {
	const systemPrompt = `你是一位专业的前端开发工程师。以下是一段AI生成的${outputFormat}代码，存在一些问题需要修复。

需要修复的问题：
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

请直接输出修复后的完整代码，不要输出任何解释文字。`;

	const messages = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: originalCode }
	];

	return callAI(messages);
};

// ==================== Messages 构建 ====================

// Figma — 构造 Figma 数据转代码的 messages
const buildFigmaMessages = function (figmaNodeData: string, outputFormat: string): Array<any> {
	const systemPrompt = `你是一位专业的前端开发工程师。你需要根据Figma设计节点数据，生成高质量、语义化的前端代码。

设计数据是以树状结构描述的UI组件，每个节点包含：
- 类型（FRAME/TEXT/RECTANGLE/IMAGE等）
- 名称和位置尺寸（x, y, width, height）
- 样式信息（颜色、字体、边框、圆角等）
- 布局信息（Flexbox方向、间距等）

要求：
1. 严格按照设计数据中的尺寸、颜色、字体生成代码
2. 使用语义化的class命名
3. 现代CSS布局（Flexbox/Grid）
4. 输出格式为：${outputFormat}
5. 只输出代码，不要输出解释文字
6、精准还原设计稿效果，精确到1px；
7、整体使用flex布局实现；
8、保持页面主内容区域在不同浏览器视口中都是左右居中布局；
9、注意页面小图标的尺寸及与文字的合适间距，注意背景图标与文字的契合；
10、注意精准实现主内容区的布局效果；
11、仔细检查代码，主动修复存在的问题，直到网页预览效果跟设计稿效果一致为止；
12、不要自己新增功能和样式，完全按照设计稿来，不要重新设计
13、避免样式重叠，文字挤在一堆，或者调下来`;

	return [
		{ role: 'system', content: systemPrompt },
		{
			role: 'user',
			content: `以下是Figma设计节点数据：\n\n${figmaNodeData}\n\n请根据以上设计数据生成${outputFormat}代码。`
		}
	];
};

// ==================== Figma API ====================

// 解析 Figma URL → { fileKey, nodeId }
const parseFigmaUrl = function (figmaUrl: string): { fileKey: string; nodeId: string } | null {
	try {
		const url = new URL(figmaUrl);
		// 匹配 /file/{key}/ 或 /design/{key}/
		const match = url.pathname.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/);
		if (!match) {
			return null;
		}
		const fileKey = match[1];
		// node-id 参数，格式如 1-2 或 1:2
		let nodeId = url.searchParams.get('node-id');
		if (!nodeId) {
			return null;
		}
		return { fileKey, nodeId };
	} catch {
		return null;
	}
};

// ==================== Figma 文件系统缓存 ====================

// 获取缓存目录
const getCacheDir = function (): string {
	// 使用全局存储目录
	const globalStoragePath = path.join(vscode.env.appRoot, '..', '..', 'User', 'globalStorage', 'css-fast-establish');
	if (!fs.existsSync(globalStoragePath)) {
		fs.mkdirSync(globalStoragePath, { recursive: true });
	}
	return globalStoragePath;
};

// 读取缓存
const readCache = function (cacheKey: string): any | null {
	try {
		const cacheDir = getCacheDir();
		const cacheFile = path.join(cacheDir, `${cacheKey.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
		if (fs.existsSync(cacheFile)) {
			const data = fs.readFileSync(cacheFile, 'utf-8');
			const parsed = JSON.parse(data);
			// 检查是否过期
			if (Date.now() < parsed.expireAt) {
				return parsed.data;
			} else {
				// 删除过期缓存
				fs.unlinkSync(cacheFile);
			}
		}
	} catch (error) {
		console.warn('读取缓存失败:', error);
	}
	return null;
};

// 写入缓存
const writeCache = function (cacheKey: string, data: any, ttl: number): void {
	try {
		const cacheDir = getCacheDir();
		const cacheFile = path.join(cacheDir, `${cacheKey.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
		const cacheData = {
			data,
			expireAt: Date.now() + ttl
		};
		fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
	} catch (error) {
		console.warn('写入缓存失败:', error);
	}
};

// 清理过期缓存
const cleanExpiredCache = function (): void {
	try {
		const cacheDir = getCacheDir();
		if (!fs.existsSync(cacheDir)) return;

		const files = fs.readdirSync(cacheDir);
		const now = Date.now();

		for (const file of files) {
			if (!file.endsWith('.json')) continue;
			try {
				const cacheFile = path.join(cacheDir, file);
				const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
				if (now >= data.expireAt) {
					fs.unlinkSync(cacheFile);
				}
			} catch {
				// 删除损坏的缓存文件
				fs.unlinkSync(path.join(cacheDir, file));
			}
		}
	} catch (error) {
		console.warn('清理缓存失败:', error);
	}
};

// ==================== Figma API 限流控制 ====================

// Figma 请求频率控制器（可配置）
const figmaRateLimit = {
	lastRequestTime: 0,
	// 从配置读取最小间隔，默认 10 秒
	get minInterval(): number {
		const userConfig = vscode.workspace.getConfiguration('generateCssTree') as any;
		return userConfig.figmaMinRequestInterval || 10000;
	},
	// 响应头中的限流信息
	rateLimitRemaining: -1,
	rateLimitReset: 0,

	async waitForSlot(): Promise<void> {
		const now = Date.now();
		const elapsed = now - figmaRateLimit.lastRequestTime;
		const waitMs = figmaRateLimit.minInterval - elapsed;

		if (waitMs > 0) {
			vscode.window.setStatusBarMessage(`Figma API请求间隔保护，等待${Math.ceil(waitMs / 1000)}秒...`, waitMs);
			await new Promise(resolve => setTimeout(resolve, waitMs));
		}

		// 如果服务端告知剩余配额为 0，等到重置时间
		if (figmaRateLimit.rateLimitRemaining === 0 && figmaRateLimit.rateLimitReset > 0) {
			const resetWait = figmaRateLimit.rateLimitReset * 1000 - Date.now();
			if (resetWait > 0) {
				vscode.window.setStatusBarMessage(`Figma API配额已满，等待${Math.ceil(resetWait / 1000)}秒后重置...`, resetWait);
				await new Promise(resolve => setTimeout(resolve, resetWait));
			}
		}

		figmaRateLimit.lastRequestTime = Date.now();
	},

	updateFromHeaders(headers: any): void {
		if (headers['x-ratelimit-remaining'] !== undefined) {
			figmaRateLimit.rateLimitRemaining = parseInt(headers['x-ratelimit-remaining'], 10);
		}
		if (headers['x-ratelimit-reset'] !== undefined) {
			figmaRateLimit.rateLimitReset = parseInt(headers['x-ratelimit-reset'], 10);
		}
	}
};

// Figma 缓存配置
const FIGMA_FILE_CACHE_TTL = 60 * 60 * 1000; // 1 小时（文件缓存）
const FIGMA_NODE_CACHE_TTL = 30 * 60 * 1000; // 30 分钟（节点缓存）

// 启动时清理过期缓存
cleanExpiredCache();

// Figma REST API 获取整个文件数据（带缓存 + 智能限流 + Retry-After + 重试）
const fetchFigmaFileData = async function (fileKey: string, token: string): Promise<any> {
	// 检查文件系统缓存
	const cacheKey = `file:${fileKey}`;
	const cached = readCache(cacheKey);
	if (cached) {
		vscode.window.setStatusBarMessage('从缓存加载Figma文件数据', 2000);
		return cached;
	}

	// 请求前等待限流槽位
	await figmaRateLimit.waitForSlot();

	const apiUrl = `https://api.figma.com/v1/files/${fileKey}`;
	const url = new URL(apiUrl);

	const options = {
		hostname: url.hostname,
		port: 443,
		path: url.pathname + url.search,
		method: 'GET',
		headers: {
			'X-Figma-Token': token
		}
	};

	const doRequest = (): Promise<{ statusCode: number | undefined; statusMessage: string; data: string; headers: any }> => {
		return new Promise((resolve, reject) => {
			const req = https.request(options, (res) => {
				let data = '';
				res.on('data', (chunk: string | Buffer) => {
					data += chunk;
				});
				res.on('end', () => {
					resolve({
						statusCode: res.statusCode,
						statusMessage: res.statusMessage || '',
						data: data,
						headers: res.headers
					});
				});
			});
			req.on('error', (error: Error) => {
				reject(error);
			});
			req.end();
		});
	};

	const maxRetries = 3;
	let response = await doRequest();
	figmaRateLimit.updateFromHeaders(response.headers);

	// 429 限流自动重试，指数退避 10s/20s/40s，优先使用 Retry-After
	for (let attempt = 1; attempt <= maxRetries && response.statusCode === 429; attempt++) {
		let waitMs = 10000 * Math.pow(2, attempt - 1); // 10s, 20s, 40s
		// 优先使用服务端返回的 Retry-After
		const retryAfter = response.headers['retry-after'];
		if (retryAfter) {
			const retryMs = parseFloat(retryAfter) * 1000;
			if (retryMs > 0) {
				waitMs = retryMs;
			}
		}
		vscode.window.setStatusBarMessage(`Figma API限流，${Math.ceil(waitMs / 1000)}秒后第${attempt}次重试...`, waitMs);
		await new Promise(resolve => setTimeout(resolve, waitMs));
		figmaRateLimit.lastRequestTime = Date.now();
		response = await doRequest();
		figmaRateLimit.updateFromHeaders(response.headers);
	}

	if (response.statusCode !== 200) {
		if (response.statusCode === 403) {
			throw new Error('Figma Token 无效或已过期，请检查 generateCssTree.figmaToken 配置');
		}
		if (response.statusCode === 429) {
			throw new Error(`Figma API请求过于频繁，已重试${maxRetries}次仍被限流，请稍后再试`);
		}
		if (response.statusCode === 404) {
			throw new Error('Figma 文件未找到，请确认链接正确且有访问权限');
		}
		throw new Error(`Figma API请求失败: ${response.statusCode} ${response.statusMessage}`);
	}

	const data = JSON.parse(response.data);
	// 写入文件系统缓存
	writeCache(cacheKey, data, FIGMA_FILE_CACHE_TTL);

	return data;
};

// Figma REST API 获取节点数据（带缓存 + 智能限流 + Retry-After + 重试）
const fetchFigmaNodeData = async function (fileKey: string, nodeId: string, token: string): Promise<any> {
	// 检查文件系统缓存
	const cacheKey = `${fileKey}:${nodeId}`;
	const cached = readCache(cacheKey);
	if (cached) {
		vscode.window.setStatusBarMessage('从缓存加载Figma节点数据', 2000);
		return cached;
	}

	try {
		// 策略1：先尝试获取整个文件数据，然后从中提取指定节点
		vscode.window.setStatusBarMessage('正在从Figma获取完整文件数据...', 5000);
		const fileData = await fetchFigmaFileData(fileKey, token);
		
		// 从文件数据中查找指定节点
		const findNodeById = (node: any, targetId: string): any => {
			if (!node) return null;
			
			// Figma API 返回的节点 ID 格式可能是 "1:2" 或 "1-2"，需要统一处理
			const normalizeId = (id: string) => id.replace(/-/g, ':');
			const normalizedTargetId = normalizeId(targetId);
			const normalizedNodeId = normalizeId(node.id);
			
			if (normalizedNodeId === normalizedTargetId) {
				return node;
			}
			
			// 递归搜索子节点
			if (node.children) {
				for (const child of node.children) {
					const found = findNodeById(child, targetId);
					if (found) return found;
				}
			}
			
			return null;
		};
		
		const targetNode = findNodeById(fileData.document, nodeId);
		
		if (targetNode) {
			// 构造与 nodes 端点相同的返回格式
			const result = {
				nodes: {
					[nodeId]: {
						document: targetNode
					}
				}
			};
			// 写入缓存
			writeCache(cacheKey, result, FIGMA_NODE_CACHE_TTL);
			vscode.window.setStatusBarMessage('已从文件数据中提取节点', 3000);
			return result;
		} else {
			throw new Error(`在文件中未找到节点 ${nodeId}`);
		}
	} catch (error) {
		// 策略2：如果获取整个文件失败，回退到原来的节点请求方式
		console.warn('获取整个文件数据失败，回退到节点请求方式:', error);
		vscode.window.setStatusBarMessage('正在从Figma获取节点数据...', 5000);
		
		// 请求前等待限流槽位
		await figmaRateLimit.waitForSlot();

		const apiUrl = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`;
		const url = new URL(apiUrl);

		const options = {
			hostname: url.hostname,
			port: 443,
			path: url.pathname + url.search,
			method: 'GET',
			headers: {
				'X-Figma-Token': token
			}
		};

		const doRequest = (): Promise<{ statusCode: number | undefined; statusMessage: string; data: string; headers: any }> => {
			return new Promise((resolve, reject) => {
				const req = https.request(options, (res) => {
					let data = '';
					res.on('data', (chunk: string | Buffer) => {
						data += chunk;
					});
					res.on('end', () => {
						resolve({
							statusCode: res.statusCode,
							statusMessage: res.statusMessage || '',
							data: data,
							headers: res.headers
						});
					});
				});
				req.on('error', (error: Error) => {
					reject(error);
				});
				req.end();
			});
		};

		const maxRetries = 3;
		let response = await doRequest();
		figmaRateLimit.updateFromHeaders(response.headers);

		// 429 限流自动重试，指数退避 10s/20s/40s，优先使用 Retry-After
		for (let attempt = 1; attempt <= maxRetries && response.statusCode === 429; attempt++) {
			let waitMs = 10000 * Math.pow(2, attempt - 1); // 10s, 20s, 40s
			// 优先使用服务端返回的 Retry-After
			const retryAfter = response.headers['retry-after'];
			if (retryAfter) {
				const retryMs = parseFloat(retryAfter) * 1000;
				if (retryMs > 0) {
					waitMs = retryMs;
				}
			}
			vscode.window.setStatusBarMessage(`Figma API限流，${Math.ceil(waitMs / 1000)}秒后第${attempt}次重试...`, waitMs);
			await new Promise(resolve => setTimeout(resolve, waitMs));
			figmaRateLimit.lastRequestTime = Date.now();
			response = await doRequest();
			figmaRateLimit.updateFromHeaders(response.headers);
		}

		if (response.statusCode !== 200) {
			if (response.statusCode === 403) {
				throw new Error('Figma Token 无效或已过期，请检查 generateCssTree.figmaToken 配置');
			}
			if (response.statusCode === 429) {
				const reset = figmaRateLimit.rateLimitReset;
				const resetDate = reset > 0 ? new Date(reset * 1000).toLocaleString('zh-CN') : '未知';
				throw new Error(
					`Figma API 请求过于频繁 (HTTP 429: ${response.statusMessage})\n` +
					`已自动重试 ${maxRetries} 次仍被限流。\n\n` +
					`建议解决方案：\n` +
					`1. 等待配额重置（预计: ${resetDate}）\n` +
					`2. 在设置中增加 figmaMinRequestInterval (当前: ${figmaRateLimit.minInterval}ms)\n` +
					`3. 后续请求会使用缓存，减少 API 调用`
				);
			}
			if (response.statusCode === 404) {
				throw new Error('Figma 文件或节点未找到，请确认链接正确且有访问权限');
			}
			throw new Error(`Figma API请求失败: ${response.statusCode} ${response.statusMessage}`);
		}

		const data = JSON.parse(response.data);
		// 写入文件系统缓存
		writeCache(cacheKey, data, FIGMA_FILE_CACHE_TTL);

		return data;
	}
};

// ==================== Figma 数据处理 ====================

// 提取颜色值
const extractColor = function (fills: any[]): string {
	if (!fills || !Array.isArray(fills) || fills.length === 0) {
		return '';
	}
	const fill = fills.find((f: any) => f.type === 'SOLID' && f.visible !== false);
	if (!fill || !fill.color) {
		return '';
	}
	const { r, g, b } = fill.color;
	const a = fill.opacity !== undefined ? fill.opacity : 1;
	const hex = '#' + [r, g, b].map((v: number) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
	if (a < 1) {
		return `${hex} (opacity: ${a.toFixed(2)})`;
	}
	return hex;
};

// 提取文本样式
const extractTextStyle = function (style: any): string {
	if (!style) { return ''; }
	const parts: string[] = [];
	if (style.fontFamily) { parts.push(style.fontFamily); }
	if (style.fontSize) { parts.push(`${style.fontSize}px`); }
	if (style.fontWeight) { parts.push(`weight:${style.fontWeight}`); }
	if (style.lineHeightPx) { parts.push(`lineHeight:${style.lineHeightPx}px`); }
	if (style.letterSpacing) { parts.push(`letterSpacing:${style.letterSpacing}px`); }
	return parts.join('/');
};

// 提取布局信息
const extractLayout = function (node: any): string {
	const parts: string[] = [];
	if (node.layoutMode && node.layoutMode !== 'NONE') {
		parts.push(`layout:${node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'}`);
	}
	if (node.itemSpacing) { parts.push(`gap:${node.itemSpacing}`); }
	if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
		const pl = node.paddingLeft || 0;
		const pr = node.paddingRight || 0;
		const pt = node.paddingTop || 0;
		const pb = node.paddingBottom || 0;
		parts.push(`padding:${pt} ${pr} ${pb} ${pl}`);
	}
	if (node.primaryAxisAlignItems) { parts.push(`align:${node.primaryAxisAlignItems}`); }
	if (node.counterAxisAlignItems) { parts.push(`justify:${node.counterAxisAlignItems}`); }
	return parts.join(', ');
};

// Figma 节点树 → 结构化文本 prompt（递归）
const figmaNodeToText = function (node: any, depth: number = 0, maxDepth: number = 10): string {
	if (!node || depth > maxDepth) { return ''; }

	const indent = '  '.repeat(depth);
	const nodeType = node.type || 'UNKNOWN';
	const nodeName = node.name || '';

	const parts: string[] = [`${nodeType}`];
	if (nodeName) { parts.push(`"${nodeName}"`); }

	// 边界框
	const bbox = node.absoluteBoundingBox;
	if (bbox) {
		parts.push(`(${bbox.x || 0}, ${bbox.y || 0}, ${bbox.width || 0}, ${bbox.height || 0})`);
	}

	// 样式信息
	const styles: string[] = [];
	const bgColor = extractColor(node.fills);
	if (bgColor) { styles.push(`bg:${bgColor}`); }
	const strokeColor = extractColor(node.strokes);
	if (strokeColor) { styles.push(`stroke:${strokeColor}`); }
	if (node.cornerRadius) { styles.push(`radius:${node.cornerRadius}`); }
	if (node.opacity !== undefined && node.opacity < 1) { styles.push(`opacity:${node.opacity}`); }

	// 布局信息
	const layout = extractLayout(node);
	if (layout) { styles.push(layout); }

	// 文本节点特殊处理
	if (nodeType === 'TEXT' && node.characters) {
		const textStyle = extractTextStyle(node.style);
		if (textStyle) { styles.push(`font:${textStyle}`); }
		const textColor = extractColor(node.fills);
		if (textColor) { styles.push(`color:${textColor}`); }
		styles.push(`content:"${node.characters}"`);
	}

	if (styles.length > 0) {
		parts.push(styles.join(' '));
	}

	let result = `${indent}${parts.join(' ')}\n`;

	// 递归子节点
	if (node.children) {
		for (const child of node.children) {
			result += figmaNodeToText(child, depth + 1, maxDepth);
		}
	}

	return result;
};

// Figma API 返回数据 → 结构化文本 prompt
const figmaDataToPrompt = function (apiResponse: any): string {
	const nodes = apiResponse.nodes;
	if (!nodes) {
		return '无法获取 Figma 节点数据';
	}

	let result = '';
	for (const nodeId of Object.keys(nodes)) {
		const nodeData = nodes[nodeId];
		if (nodeData.document) {
			result += figmaNodeToText(nodeData.document, 0);
		}
	}

	if (result.length > 50000) {
		result = result.substring(0, 50000) + '\n... (数据过长已截断)';
	}

	return result;
};

export default {
	callAI,
	callAIStream,
	callAIStreamWithModel,
	callAIFix,
	buildFigmaMessages,
	parseFigmaUrl,
	fetchFigmaNodeData,
	fetchFigmaFileData,
	figmaDataToPrompt,
	removeCodeBlockMarkers,
	getOutputExt,
	getOutputLanguage,
	checkCodeIssues
};
