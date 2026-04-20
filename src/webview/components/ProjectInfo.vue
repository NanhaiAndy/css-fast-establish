<template>
  <div class="publish-section">
    <div class="section-header">
      <h2 class="section-title">项目信息</h2>
      <div class="section-line"></div>
    </div>

    <div class="publish-form">
      <!-- 工程名称卡片 -->
      <div class="info-card">
        <div class="card-inner">
          <div class="card-header">
            <svg class="card-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M6 6H10M6 8H10M6 10H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span class="card-label">项目名称</span>
          </div>
          <div class="card-value">{{ projectInfo.projectName || '加载中...' }}</div>
        </div>
      </div>

      <!-- 分支名卡片 -->
      <div class="info-card">
        <div class="card-inner">
          <div class="card-header">
            <svg class="card-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V14M8 2L5 5M8 2L11 5M8 14L5 11M8 14L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="card-label">当前分支</span>
            <button @click="handleCopy" class="copy-button">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2H7.5C8.05228 2 8.5 2.44772 8.5 3V9C8.5 9.55228 8.05228 10 7.5 10H4.5C3.94772 10 3.5 9.55228 3.5 9V3C3.5 2.44772 3.94772 2 4.5 2Z" stroke="currentColor" stroke-width="1"/>
                <path d="M8.5 5H9.5C10.0523 5 10.5 5.44772 10.5 6V10C10.5 10.5523 10.0523 11 9.5 11H6.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
              </svg>
              <span class="copy-text">复制</span>
            </button>
          </div>
          <div class="input-wrapper">
            <input
              type="text"
              v-model="localBranchName"
              class="mi-input"
              placeholder="初始化中..."
              disabled
            />
          </div>
        </div>
      </div>

      <!-- 提交信息卡片 -->
      <div class="info-card">
        <div class="card-inner">
          <div class="card-header">
            <svg class="card-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="6" r="2.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M3 13C3 10.7909 4.79086 9 7 9H9C11.2091 9 13 10.7909 13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span class="card-label">最近提交</span>
          </div>
          <div class="commit-grid">
            <div class="commit-cell">
              <svg class="cell-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="5" r="2.5" stroke="currentColor" stroke-width="1"/>
                <path d="M2 12C2 9.79086 3.79086 8 6 8H8C10.2091 8 12 9.79086 12 12" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
              </svg>
              <div class="cell-content">
                <span class="cell-label">提交人</span>
                <span class="cell-value">{{ projectInfo.lastCommitAuthor || '未知' }}</span>
              </div>
            </div>
            <div class="commit-cell">
              <svg class="cell-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1"/>
                <path d="M7 4V7L9 9" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
              </svg>
              <div class="cell-content">
                <span class="cell-label">时间</span>
                <span class="cell-value">{{ projectInfo.lastCommitDate || '未知' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息卡片 -->
      <div class="info-card stats-card">
        <div class="card-inner">
          <div class="stats-display">
            <div class="stats-number">{{ projectInfo.totalCommits || '0' }}</div>
            <div class="stats-label">项目总提交次数</div>
          </div>
        </div>
      </div>
    </div>

    <div class="button-container" v-if="isCompanyNetwork">
      <button @click="handleExamine" class="mi-button">
        <span class="button-text">查看项目详情</span>
        <svg class="button-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7H11M11 7L8 4M11 7L8 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

@Component
export default class ProjectInfo extends Vue {
  @Prop() public projectInfo!: any;
  @Prop() public isCompanyNetwork!: boolean;

  public localBranchName = '';

  @Watch('projectInfo', { immediate: true })
  onProjectInfoChanged(val: any) {
    if (val && val.branchName) {
      this.localBranchName = val.branchName;
    }
  }

  handleCopy() {
    this.$emit('copy-name', {
      projectName: this.projectInfo.projectName,
      branchName: this.localBranchName
    });
  }

  handleExamine() {
    this.$emit('examine-project', {
      projectName: this.projectInfo.projectName,
      branchName: this.localBranchName
    });
  }
}
</script>

<style scoped>
.publish-section {
  margin-bottom: 20px;
}

/* 标题区域 - 小米风格 */
.section-header {
  margin-bottom: 24px;
  padding: 0 4px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--vscode-foreground);
  letter-spacing: -0.3px;
}

.section-line {
  height: 2px;
  background: linear-gradient(90deg, #FF6900 0%, rgba(255, 105, 0, 0.3) 100%);
  border-radius: 1px;
}

/* 表单容器 */
.publish-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 信息卡片 - 小米风格 */
.info-card {
  background: var(--vscode-editor-background);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.info-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.card-inner {
  padding: 16px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.card-icon {
  color: #FF6900;
  flex-shrink: 0;
}

.card-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--vscode-descriptionForeground);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

/* 值显示 */
.card-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--vscode-foreground);
  word-break: break-all;
  padding: 10px 14px;
  background: var(--vscode-textCodeBlock-background);
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* 输入框 */
.input-wrapper {
  position: relative;
}

.mi-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  font-family: 'Consolas', 'Monaco', monospace;
}

.mi-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 复制按钮 */
.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin-left: auto;
  background: transparent;
  color: #FF6900;
  border: 1px solid #FF6900;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background: #FF6900;
  color: #fff;
}

.copy-button svg {
  flex-shrink: 0;
}

.copy-text {
  font-weight: 500;
}

/* 提交网格 */
.commit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.commit-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--vscode-textCodeBlock-background);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.commit-cell:hover {
  background: var(--vscode-editor-selectionBackground);
}

.cell-icon {
  color: var(--vscode-descriptionForeground);
  flex-shrink: 0;
}

.cell-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cell-label {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  font-weight: 500;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.cell-value {
  font-size: 12px;
  color: var(--vscode-foreground);
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 统计显示 */
.stats-display {
  text-align: center;
  padding: 20px 16px;
}

.stats-number {
  font-size: 42px;
  font-weight: 300;
  color: #FF6900;
  margin-bottom: 4px;
  letter-spacing: -1px;
}

.stats-label {
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* 按钮容器 */
.button-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.mi-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 32px;
  background: #FF6900;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 140px;
}

.mi-button:hover {
  background: #E55D00;
}

.mi-button:active {
  transform: scale(0.98);
}

.mi-button .button-text {
  font-weight: 500;
}

.button-arrow {
  transition: transform 0.2s ease;
}

.mi-button:hover .button-arrow {
  transform: translateX(4px);
}
</style>
