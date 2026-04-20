<template>
  <div class="toolbox-content">
    <!-- 快捷工具 -->
    <div class="section-group">
      <div class="group-header">
        <span class="group-title">快捷工具</span>
        <div class="group-line"></div>
      </div>
      <div class="tools-grid">
        <div
          class="grid-item"
          :class="{ disabled: tool.disabled }"
          v-for="tool in tools"
          :key="tool.id"
          @click="handleClick(tool)"
          :title="tool.description"
        >
          <div class="grid-icon">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" v-html="getIcon(tool.id)"></svg>
          </div>
          <span class="grid-title">{{ tool.title }}</span>
        </div>
      </div>
    </div>

    <!-- 数据生成器 -->
    <div class="section-group">
      <div class="group-header">
        <span class="group-title">数据生成</span>
        <div class="group-line"></div>
      </div>
      <div class="tools-grid">
        <div
          class="grid-item"
          :class="{ disabled: tool.disabled }"
          v-for="tool in mockTools"
          :key="tool.id"
          @click="handleClick(tool)"
          :title="tool.description"
        >
          <div class="grid-icon">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" v-html="getIcon(tool.id)"></svg>
          </div>
          <span class="grid-title">{{ tool.title }}</span>
        </div>
      </div>
    </div>

    <!-- 转换工具 -->
    <div class="section-group">
      <div class="group-header">
        <span class="group-title">转换工具</span>
        <div class="group-line"></div>
      </div>
      <div class="tools-grid">
        <div
          class="grid-item"
          :class="{ disabled: tool.disabled }"
          v-for="tool in convertTools"
          :key="tool.id"
          @click="handleClick(tool)"
          :title="tool.description"
        >
          <div class="grid-icon">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" v-html="getIcon(tool.id)"></svg>
          </div>
          <span class="grid-title">{{ tool.title }}</span>
        </div>
      </div>
    </div>

    <!-- 开发辅助 -->
    <div class="section-group">
      <div class="group-header">
        <span class="group-title">开发辅助</span>
        <div class="group-line"></div>
      </div>
      <div class="tools-grid">
        <div
          class="grid-item"
          :class="{ disabled: tool.disabled }"
          v-for="tool in devTools"
          :key="tool.id"
          @click="handleClick(tool)"
          :title="tool.description"
        >
          <div class="grid-icon">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" v-html="getIcon(tool.id)"></svg>
          </div>
          <span class="grid-title">{{ tool.title }}</span>
        </div>
      </div>
    </div>

    <!-- AI设计转代码 -->
    <div class="section-group">
      <div class="group-header">
        <span class="group-title">AI设计转代码</span>
        <div class="group-line"></div>
      </div>
      <div class="tools-grid">
        <div
          class="grid-item"
          v-for="tool in designTools"
          :key="tool.id"
          @click="handleClick(tool)"
          :title="tool.description"
        >
          <div class="grid-icon">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" v-html="getIcon(tool.id)"></svg>
          </div>
          <span class="grid-title">{{ tool.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

interface Tool {
  id: string;
  icon: string;
  title: string;
  description: string;
  command?: string;
  disabled?: boolean;
}

@Component
export default class ToolboxList extends Vue {
  public tools: Tool[] = [
    {
      id: 'dubbo',
      icon: '',
      title: 'Dubbo接口定义',
      description: '生成Dubbo接口定义代码',
      command: 'extension.interfaceDefinition'
    },
    {
      id: 'dubbo-batch',
      icon: '',
      title: '批量生成Dubbo接口',
      description: '通过生成物地址批量生成Dubbo接口定义',
      command: 'extension.interfaceDefinitionFromArtifact'
    },
    {
      id: 'css-tree',
      icon: '',
      title: '生成CSS结构',
      description: '从选中的HTML生成对应的CSS结构',
      disabled: true
    },
    {
      id: 'ai-class',
      icon: '',
      title: 'AI生成class名称',
      description: '智能生成语义化的class名称',
      disabled: true
    },
    {
      id: 'css-view',
      icon: '',
      title: '查看css样式',
      description: '鼠标移入对应class名称查看样式',
      disabled: true
    },
    {
      id: 'attr-location',
      icon: '',
      title: '属性定位',
      description: '鼠标移入对应属性名Ctrl+鼠标左键快速定位',
      disabled: true
    },
    {
      id: 'path-tracking',
      icon: '',
      title: '路径追踪',
      description: '框选~/或@/前缀路径，鼠标右键执行路径追踪，打开文件',
      disabled: true
    }
  ];

  public mockTools: Tool[] = [
    {
      id: 'mock-data-ai',
      icon: '',
      title: 'Mock数据生成',
      description: '根据接口文档格式生成Mock数据',
      command: 'extension.generateMockDataAi'
    }
  ];

  public convertTools: Tool[] = [
    {
      id: 'json-to-ts',
      icon: '',
      title: 'JSON转TS类型',
      description: '将JSON数据转为TypeScript类型定义',
      command: 'extension.jsonToTs'
    },
    {
      id: 'css-unit',
      icon: '',
      title: 'CSS单位转换',
      description: 'px/rem/vw批量互转',
      command: 'extension.cssUnitConvert'
    },
    {
      id: 'color-convert',
      icon: '',
      title: '颜色格式转换',
      description: 'HEX/RGB/HSL互转',
      command: 'extension.colorConvert'
    },
    {
      id: 'timestamp',
      icon: '',
      title: '时间戳转换',
      description: '时间戳与日期字符串互转',
      command: 'extension.timestampConvert'
    },
    {
      id: 'encode-decode',
      icon: '',
      title: '编解码转换',
      description: 'URL/Base64/HTML实体编解码',
      command: 'extension.encodeDecode'
    },
    {
      id: 'svg-optimize',
      icon: '',
      title: 'SVG优化压缩',
      description: '移除冗余属性，压缩SVG代码',
      command: 'extension.optimizeSvg'
    }
  ];

  public devTools: Tool[] = [
    {
      id: 'regex-tester',
      icon: '',
      title: '正则可视化测试',
      description: '可视化测试正则并高亮匹配与捕获组',
      command: 'extension.regexTester'
    },
    {
      id: 'json-path-query',
      icon: '',
      title: 'JSON Path查询',
      description: '输入JSON数据和路径表达式，实时预览匹配结果',
      command: 'extension.jsonPathQuery'
    },
    {
      id: 'a11y-check',
      icon: '',
      title: 'a11y检查',
      description: '检查HTML无障碍问题',
      command: 'extension.checkA11y'
    },
    {
      id: 'image-analyze',
      icon: '',
      title: '图片资源分析',
      description: '扫描未使用、重复、超大图片',
      command: 'extension.analyzeImages'
    },
    {
      id: 'css-redundancy',
      icon: '',
      title: 'CSS冗余检测',
      description: '扫描未使用的CSS class定义',
      command: 'extension.detectCssRedundancy'
    },
    {
      id: 'snippet-save',
      icon: '',
      title: '保存代码片段',
      description: '选中代码保存为可复用片段',
      command: 'extension.saveSnippet'
    },
    {
      id: 'snippet-manage',
      icon: '',
      title: '管理代码片段',
      description: '查看、插入、删除已保存片段',
      command: 'extension.openSnippetManager'
    },
    {
      id: 'snippet-export',
      icon: '',
      title: '导出代码片段',
      description: '导出为VS Code .code-snippets格式文件',
      command: 'extension.exportSnippets'
    },
    {
      id: 'snippet-import',
      icon: '',
      title: '导入代码片段',
      description: '从.code-snippets文件导入片段',
      command: 'extension.importSnippets'
    },
    {
      id: 'placeholder-img',
      icon: '',
      title: '占位图片',
      description: '快速插入占位图标签',
      command: 'extension.placeholderImage'
    },
    {
      id: 'console-insert',
      icon: '',
      title: '插入console.log',
      description: '在变量下方快速插入调试日志',
      command: 'extension.insertConsoleLog'
    },
    {
      id: 'console-remove',
      icon: '',
      title: '移除所有console',
      description: '一键清理文件中全部调试日志',
      command: 'extension.removeAllConsoleLogs'
    },
    {
      id: 'console-comment',
      icon: '',
      title: '注释所有console',
      description: '注释所有console日志（带标记便于恢复）',
      command: 'extension.commentAllConsoleLogs'
    },
    {
      id: 'console-highlight',
      icon: '',
      title: '高亮所有console',
      description: '高亮所有console日志3秒',
      command: 'extension.highlightConsoleLogs'
    },
    {
      id: 'console-toggle',
      icon: '',
      title: '切换console',
      description: '切换console注释状态',
      command: 'extension.toggleConsoleLogs'
    },
    {
      id: 'chinese-var-translate',
      icon: '',
      title: '中文变量转英文',
      description: '输入const/let后跟中文变量名自动翻译为英文',
      disabled: true
    },
    {
      id: 'chinese-snippet',
      icon: '',
      title: '中文代码片段',
      description: '输入中文关键词自动展开代码片段（如"判断"→if语句）',
      command: 'extension.listChineseSnippets'
    }
  ];

  public designTools: Tool[] = [
    {
      id: 'figma-to-code',
      icon: '',
      title: 'Figma转代码',
      description: '输入Figma链接，AI生成前端代码（待完善）',
      command: 'extension.figmaToCode'
    },
    {
      id: 'figma-token-extract',
      icon: '',
      title: 'Figma设计令牌',
      description: '从Figma文件提取颜色、字体、圆角等设计令牌',
      command: 'extension.figmaExtractTokens'
    },
    {
      id: 'api-code-gen',
      icon: '',
      title: 'API代码生成',
      description: '从JSON响应生成axios/fetch请求代码',
      command: 'extension.generateApiCode'
    },
    {
      id: 'code-diff',
      icon: '',
      title: '代码差异对比',
      description: 'AI生成语义化差异说明',
      command: 'extension.compareCodeDiff'
    }
  ];

  getIcon(id: string): string {
    const icons: { [key: string]: string } = {
      'dubbo': '<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M9 6V9L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      'dubbo-batch': '<rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="3" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="10" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M10 12H15M12.5 9.5V14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      'css-tree': '<path d="M9 3V15M9 3L6 6M9 3L12 6M9 15L6 12M9 15L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      'ai-class': '<rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 8L10 10L12 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      'css-view': '<path d="M3 9C3 9 5 6 9 6C13 6 15 9 15 9C15 9 13 12 9 12C5 12 3 9 3 9Z" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.5"/>',
      'attr-location': '<path d="M9 2L14 7L9 16L4 7L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/>',
      'path-tracking': '<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M9 5V9H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      'mock-data': '<rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="3" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="10" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="10" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>',
      'mock-data-ai': '<path d="M9 3L3 6V12L9 15L15 12V6L9 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 6L9 9L15 6M9 9V15" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
      'json-to-ts': '<path d="M5 3H13L10 9H14L7 15L9 10H5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
      'css-unit': '<path d="M3 9H15M3 5H15M3 13H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 3V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      'color-convert': '<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M9 3V15" stroke="currentColor" stroke-width="1.5"/><path d="M9 3C7 5 6 7 6 9C6 11 7 13 9 15" stroke="currentColor" stroke-width="1.5"/><path d="M9 3C11 5 12 7 12 9C12 11 11 13 9 15" stroke="currentColor" stroke-width="1.5"/>',
      'timestamp': '<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M9 6V9L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 2H15V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      'encode-decode': '<path d="M3 9L6 6L9 9M6 6V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 9L12 12L9 9M12 12V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      'svg-optimize': '<path d="M3 3H15V15H3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 6L12 12M12 6L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      'regex-tester': '<path d="M3 5H15M3 9H15M3 13H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="5" cy="5" r="1.5" fill="currentColor"/><circle cx="7" cy="9" r="1.5" fill="currentColor"/>',
      'snippet-save': '<path d="M3 3H15V15H3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 7H12M6 10H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 3H15V6H3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
      'snippet-manage': '<path d="M3 3H15V15H3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 7H12M6 10H12M6 13H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      'placeholder-img': '<rect x="3" y="4" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" stroke-width="1"/><path d="M3 12L7 9L10 11L13 8L15 10" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
      'console-insert': '<path d="M4 4H14V14H4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 8L8 10L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      'console-remove': '<path d="M4 4H14V14H4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 8L8 10L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 2L16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      'figma-to-code': '<path d="M6 2C4.34 2 3 3.34 3 5C3 6.66 4.34 8 6 8C4.34 8 3 9.34 3 11C3 12.66 4.34 14 6 14C7.66 14 9 12.66 9 11V5C9 3.34 7.66 2 6 2ZM6 8H12C13.66 8 15 6.66 15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5M9 8V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11C15 9.34 13.66 8 12 8" stroke="currentColor" stroke-width="1.5"/>',
      'json-path-query': '<path d="M3 5H15M3 9H15M3 13H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 3V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="9" r="2" fill="currentColor"/>',
      'a11y-check': '<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M9 5V9L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 5L14 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="14" cy="2.5" r="1" fill="currentColor"/>',
      'image-analyze': '<rect x="3" y="4" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" stroke-width="1"/><path d="M3 12L7 9L10 11L13 8L15 10" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 2L14 4M14 2L12 4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
      'css-redundancy': '<path d="M4 4H14V14H4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 7H11M7 10H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 8L16 6M16 6V9M16 6H13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
      'snippet-export': '<path d="M3 3H15V15H3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 7H12M6 10H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 12L13 15M13 15L16 12M13 15V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      'snippet-import': '<path d="M3 3H15V15H3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 7H12M6 10H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 15L7 12M7 12L4 15M7 12V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      'console-comment': '<path d="M4 4H14V14H4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 8L8 10L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M6 4L10 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="8" r="2" fill="currentColor"/>',
      'console-highlight': '<path d="M4 4H14V14H4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 8L8 10L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="14" cy="4" r="1.5" fill="currentColor"/><circle cx="14" cy="8" r="1.5" fill="currentColor"/><circle cx="14" cy="12" r="1.5" fill="currentColor"/>',
      'console-toggle': '<path d="M4 4H14V14H4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 8L8 10L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 6L6 4L9 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 10L6 12L9 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
      'chinese-var-translate': '<path d="M3 5H6M3 9H9M3 13H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 5L12 9M12 9L10 7M12 9L14 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11L12 15M12 15L10 13M12 15L14 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      'chinese-snippet': '<path d="M4 3H14V7H4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 9H10M4 12H8M4 15H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="13" cy="14" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M13 11.5V12.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
      'figma-token-extract': '<path d="M6 2C4.34 2 3 3.34 3 5C3 6.66 4.34 8 6 8C4.34 8 3 9.34 3 11C3 12.66 4.34 14 6 14C7.66 14 9 12.66 9 11V5C9 3.34 7.66 2 6 2ZM6 8H12C13.66 8 15 6.66 15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5M9 8V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11C15 9.34 13.66 8 12 8" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="11" r="1" fill="currentColor"/>',
      'api-code-gen': '<path d="M3 6H10M3 9H12M3 12H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13 5L15 7L13 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 9V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      'code-diff': '<path d="M3 6L7 3L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 3V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15 12L11 15L7 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 15V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
    };
    return icons[id] || '<rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>';
  }

  handleClick(tool: Tool) {
    if (tool.disabled) {
      (this as any).$vscode.postMessage({
        type: 'showMessage',
        message: '该功能暂未开放'
      });
      return;
    }

    if (tool.command) {
      this.$emit('command', tool.command);
    }
  }
}
</script>

<style scoped>
.toolbox-content {
  margin-top: 20px;
}

/* ===== 分组区域 ===== */
.section-group {
  margin-top: 20px;
}

.section-group:first-child {
  margin-top: 0;
}

.group-header {
  margin-bottom: 10px;
  padding: 0 2px;
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground);
}

.group-line {
  height: 1px;
  margin-top: 6px;
  background: linear-gradient(90deg, rgba(255, 105, 0, 0.3) 0%, rgba(255, 105, 0, 0.05) 100%);
}

/* ===== 双列网格 ===== */
.tools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 6px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.18s ease;
  background: var(--vscode-editor-background);
  position: relative;
}

.grid-item:hover:not(.disabled) {
  border-color: #FF6900;
  background: rgba(255, 105, 0, 0.04);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.grid-item.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.grid-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 105, 0, 0.08);
  border-radius: 8px;
  color: #FF6900;
  transition: all 0.18s ease;
}

.grid-item:hover:not(.disabled) .grid-icon {
  background: rgba(255, 105, 0, 0.15);
  transform: scale(1.08);
}

.grid-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--vscode-foreground);
  text-align: center;
  line-height: 1.3;
  word-break: break-all;
  max-width: 100%;
}
</style>
