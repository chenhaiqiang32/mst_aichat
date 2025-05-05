/// <reference types="react-scripts" />
// src/global.d.ts
export {}; // 确保文件是模块

declare global {
  interface Window {
    config: {
      project_id?: string;
      // 可以添加其他可能的属性
    };
  }
}