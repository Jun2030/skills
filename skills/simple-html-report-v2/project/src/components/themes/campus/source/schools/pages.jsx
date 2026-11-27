// 各校封面 / 目录组件的汇总:每校一行,按约定表顺序。各校的 index.jsx 默认导出 { Cover, Toc, … }(见 docs/campus-schools.md)。
// 组件为 null 的学校退回通用封面 / 目录。新增学校时在这里加一行。
export { default as sjtu } from './sjtu/index.jsx';
export { default as scu } from './scu/index.jsx';
export { default as sysu } from './sysu/index.jsx';
export { default as henu } from './henu/index.jsx';
export { default as seu } from './seu/index.jsx';
export { default as thu } from './thu/index.jsx';
export { default as pku } from './pku/index.jsx';
export { default as zju } from './zju/index.jsx';
export { default as whu } from './whu/index.jsx';
export { default as xmu } from './xmu/index.jsx';
export { default as ynu } from './ynu/index.jsx';
export { default as neu } from './neu/index.jsx';
