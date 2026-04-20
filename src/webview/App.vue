<template>
  <div class="toolbox-container">
    <!-- 项目信息区域 -->
    <ProjectInfo
      :project-info="projectInfo"
      :is-company-network="isCompanyNetwork"
      @copy-name="handleCopyName"
      @examine-project="handleExamineProject"
    />

    <!-- 工具箱列表 -->
    <ToolboxList @command="handleCommand" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ProjectInfo from './components/ProjectInfo.vue';
import ToolboxList from './components/ToolboxList.vue';

@Component({
  components: {
    ProjectInfo,
    ToolboxList
  }
})
export default class App extends Vue {
  // 从 window 获取初始数据
  public isCompanyNetwork = (globalThis as any).VSCODE_INITIAL_DATA?.isCompanyNetwork || false;
  public projectInfo: any = (globalThis as any).VSCODE_INITIAL_DATA?.projectInfo || {};

  // 监听来自扩展的消息
  mounted() {
    (globalThis as any).addEventListener('message', this.handleMessage);
  }

  beforeDestroy() {
    (globalThis as any).removeEventListener('message', this.handleMessage);
  }

  handleMessage(event: any) {
    const message = event.data;
    switch (message.type) {
      case 'updateProjectInfo':
        this.projectInfo = message.data;
        break;
    }
  }

  handleCommand(command: string) {
    (this as any).$vscode.postMessage({
      type: 'command',
      command: command
    });
  }

  handleCopyName(data: any) {
    (this as any).$vscode.postMessage({
      type: 'copyName',
      data: data
    });
  }

  handleExamineProject(data: any) {
    (this as any).$vscode.postMessage({
      type: 'examineProject',
      data: data
    });
  }
}
</script>

<style>
/* 全局样式 - 小米风格 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
</style>

<style scoped>
.toolbox-container {
  padding: 20px 16px;
  height: 100%;
  overflow-y: auto;
}
</style>
