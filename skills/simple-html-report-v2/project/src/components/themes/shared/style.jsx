// 主题组件注入样式的唯一方式:每段 CSS 以稳定 id 注入一次,所有页面实例共用。
// 页面在渲染时调用 useThemeStyle(id, css);样式只允许读主题 token(var(--theme-*) / var(--<themeKey>-*)),
// 不写颜色字面量,这样整份 deck 的色调才能由 token 统一调整。

export function useThemeStyle(id, css) {
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

/** 入场动画的错峰延迟:配合主题基座里读 --enter-delay 的动画类使用。 */
export const enterDelay = (index, step = 70) => ({ '--enter-delay': `${Math.max(0, index) * step}ms` });
