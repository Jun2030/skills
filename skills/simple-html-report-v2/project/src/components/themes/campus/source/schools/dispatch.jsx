// 封面 / 目录按学校分发:现有的 campus_temp_cover / campus_temp_agenda 两页在 brand.school 命中、且这所学校
// 已实现对应组件时,整页改由学校组件绘制(不套 CampusFrame 的页眉页脚),否则保持通用外观。
//
// 学校组件模块(source/schools/<key>/index.jsx 的默认导出):
//   Cover({ school, props, variant })          封面;props 是通用封面字段(TempCover 的 defaults + goal),variant 见 pickCoverVariant
//   Toc({ school, props, items, count })       目录;items 是截好的条目(title / desc / note(英文小标) / no),count = 条目数
//   coverClear?(props, variant) → [字段名]     模板里有、但网页版没有显示的文字框(导出时清空),写进根节点 data-campus-native-clear
//   tocClear?(props, count) → [字段名]
//   coverHide?(props, variant) → [形状名]      网页没显示、原生页上要隐藏的非文字形状(浙大空信息槽的图标),写进 data-campus-native-hide
//   coverBoxes?(props, variant) → {形状名: [x, y, w, h]}  网页改了位置 / 大小的模板形状(胶囊随文字加宽),写进 data-campus-native-boxes
//   tocNative?: false                          目录不是模板原生页(清华):根节点不带 data-campus-native-*,导出按普通页面
// 根节点标记(公共约定 §3)由这里算好,经 withCampusBase 写到页面根节点 .campus 上。
import React from 'react';
import { campusSchool } from './registry.mjs';
import { charCount, splitTitle } from './kit.jsx';
import * as SCHOOL_PAGES from './pages.jsx';

/** 学校组件模块;没有登记或没有实现对应页面时返回 null。 */
export function schoolModule(brand, page) {
  const school = campusSchool(brand?.school);
  if (!school) return null;
  const mod = SCHOOL_PAGES[school.key];
  const Component = page === 'cover' ? mod?.Cover : mod?.Toc;
  if (typeof Component !== 'function') return null;
  if (page === 'toc' && !school.toc && mod.tocNative !== false) return null;
  return { school, mod, Component };
}

/**
 * 封面变体:控件 coverVariant 指定了且这所学校支持就用它;'auto' 时按标题长度选
 * (参照设计交付包 README「选封面变体」与字段表的「约容纳」,上限写在 meta.mjs 的 titleCaps):
 *   标题一行放得下(≤ titleCaps.default 字)                    → default
 *   拆成两行后每行 ≤ titleCaps.long_title 字                    → long_title
 *   还放不下:有 keyword 版就用它(大字放关键词,完整题目放副标题),否则 long_title(字号自动缩小)
 */
export function pickCoverVariant(school, props) {
  const variants = school.coverVariants || ['default'];
  const forced = String(props?.coverVariant || 'auto');
  if (forced !== 'auto' && variants.includes(forced)) return forced;
  const caps = school.titleCaps || {};
  const title = String(props?.title ?? '').trim();
  const single = !title.includes('\n') && charCount(title) <= (caps.default ?? 8);
  if (single || variants.length === 1) return 'default';
  if (variants.includes('long_title')) {
    const perLine = caps.long_title ?? 12;
    const rows = splitTitle(title, perLine).split('\n');
    if (rows.length <= 2 && rows.every(row => charCount(row) <= perLine)) return 'long_title';
  }
  if (variants.includes('keyword')) return 'keyword';
  return variants.includes('long_title') ? 'long_title' : 'default';
}

/** 目录条目数:按这所学校支持的范围截取。 */
export function schoolTocCount(school, props) {
  const range = school.toc || { min: 2, max: 6 };
  const n = Math.round(Number(props?.itemCount));
  const count = Number.isFinite(n) ? n : range.default || range.min;
  return Math.min(range.max, Math.max(range.min, count));
}

/** 页面根节点上的导出标记(公共约定 §3)。不是学校页面时返回 null。 */
export function schoolRootAttrs(page, props, brand) {
  const found = schoolModule(brand, page);
  if (!found) return null;
  const { school, mod } = found;
  if (page === 'toc' && (mod.tocNative === false || !school.toc)) return { 'data-campus-school': school.key };
  let variant;
  let clear = [];
  let hide = [];
  let boxes = {};
  if (page === 'cover') {
    variant = pickCoverVariant(school, props);
    clear = typeof mod.coverClear === 'function' ? mod.coverClear(props, variant) || [] : [];
    hide = typeof mod.coverHide === 'function' ? mod.coverHide(props, variant) || [] : [];
    boxes = typeof mod.coverBoxes === 'function' ? mod.coverBoxes(props, variant) || {} : {};
  } else {
    const count = schoolTocCount(school, props);
    variant = String(count);
    clear = typeof mod.tocClear === 'function' ? mod.tocClear(props, count) || [] : [];
  }
  return {
    'data-campus-school': school.key,
    'data-campus-native-school': school.key,
    'data-campus-native-page': page,
    'data-campus-native-variant': variant,
    ...(clear.length ? { 'data-campus-native-clear': [...new Set(clear)].join('|') } : {}),
    ...(hide.length ? { 'data-campus-native-hide': [...new Set(hide)].join('|') } : {}),
    ...(Object.keys(boxes).length ? { 'data-campus-native-boxes': JSON.stringify(boxes) } : {}),
  };
}

/** 渲染学校封面;返回 null 表示没有学校组件(调用方画通用封面)。 */
export function renderSchoolCover(brand, props) {
  const found = schoolModule(brand, 'cover');
  if (!found) return null;
  const { school, Component } = found;
  return <Component school={school} props={props} variant={pickCoverVariant(school, props)} />;
}

/** 渲染学校目录;items 是通用目录条目数组。 */
export function renderSchoolToc(brand, props, items) {
  const found = schoolModule(brand, 'toc');
  if (!found) return null;
  const { school, Component } = found;
  const count = schoolTocCount(school, props);
  const list = Array.isArray(items) ? items.slice(0, count) : [];
  while (list.length < count) list.push({});
  return <Component school={school} props={props} items={list} count={count} />;
}
