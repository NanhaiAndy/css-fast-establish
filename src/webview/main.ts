import Vue from 'vue';
import App from './App.vue';

// 声明全局 window 类型
declare global {
  interface Window {
    VSCODE_INITIAL_DATA?: {
      isCompanyNetwork: boolean;
      projectInfo: any;
    };
  }
}

// 声明 VSCode API
declare const acquireVsCodeApi: () => {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

// 初始化 VSCode API
const vscode = acquireVsCodeApi();

// 将 VSCode API 挂载到 Vue 原型上
Vue.prototype.$vscode = vscode;

// 创建 Vue 实例
new Vue({
  render: (h) => h(App),
}).$mount('#app');
