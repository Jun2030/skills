import React from 'react';
import {
  normalizePublicControls,
} from '../../control-naming.mjs';
import { validateDeclaredRoles } from '../../page-roles.mjs';

const PAGE_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * 新主题标准(docs/theme-standard.md)的页面登记入口。每个页面组件在自己身上声明 META:
 *
 *   Page.META = {
 *     id: 'section-divider',        // 稳定的页面 ID(kebab-case)。页面 key、文案 ID 都由它派生,发布后不要改
 *     label: '章节过渡',             // 给人看的名字
 *     roles: ['transition'],        // 页面承担的角色,取自 src/page-roles.mjs 的词表
 *     defaults: { ... },            // 全部可见文案与数据的默认值(字面量)
 *     controls: [ ... ],            // 可选:页面属性面板的结构开关
 *     numberBounds: { ... },        // 可选:进入几何计算的数值字段的硬边界
 *     copyBudgets: { body: 96 },    // 可选:文案路径 → 版面能容纳的最大字数(全角计 1,半角计 0.5)
 *   };
 *
 * 页面 key = `<themeKey>_<id 的下划线形式>`,与页面在清单里的顺序无关:调整顺序、插入新页都不会
 * 改变已有页面的 key。pageNumber 只用于展示排序。
 *
 * 12 套旧主题仍经下方的 normalizeRuntimePages 登记(key 为 `themeXX_pageNNN`),两者并存;
 * 是否按新标准处理一个页面,统一由 src/theme-standard.mjs 判定。
 */
export function definePages(pageComponents, { themeKey, wrap = Component => Component }) {
  if (!themeKey) throw new Error('definePages: 缺少 themeKey');
  const seen = new Set();
  return (pageComponents || []).map((Component, index) => {
    const meta = Component?.META;
    const name = Component?.displayName || Component?.name || `第 ${index + 1} 个页面`;
    if (typeof Component !== 'function' || !meta) throw new Error(`definePages(${themeKey}): ${name} 必须是带 META 声明的组件`);
    const { id, label, roles, defaults, controls = [], numberBounds, copyBudgets } = meta;
    if (!PAGE_ID_PATTERN.test(String(id || ''))) throw new Error(`definePages(${themeKey}): ${name} 的 META.id "${id}" 必须是 kebab-case`);
    if (seen.has(id)) throw new Error(`definePages(${themeKey}): 页面 ID "${id}" 重复`);
    seen.add(id);
    if (!label) throw new Error(`definePages(${themeKey}): 页面 "${id}" 缺少 META.label`);
    const roleErrors = validateDeclaredRoles(roles);
    if (roleErrors.length) throw new Error(`definePages(${themeKey}): 页面 "${id}" ${roleErrors.join(';')}`);
    if (!defaults || typeof defaults !== 'object') throw new Error(`definePages(${themeKey}): 页面 "${id}" 缺少 META.defaults`);
    const defaultProps = { ...defaults };
    return {
      key: `${themeKey}_${id.replaceAll('-', '_')}`,
      themeKey,
      pageNumber: index + 1,
      layout: `${themeKey}-${id}`.toUpperCase(),
      slot: id,
      label,
      roles: [...roles],
      Component: wrap(Component),
      controls: normalizeControls(controls, defaultProps, { standard: true }),
      defaultProps,
      ...(numberBounds ? { numberBounds } : {}),
      ...(copyBudgets ? { copyBudgets: validateCopyBudgets(copyBudgets, `definePages(${themeKey}): 页面 "${id}"`) } : {}),
    };
  });
}

function validateCopyBudgets(copyBudgets, where) {
  for (const [pathName, maxChars] of Object.entries(copyBudgets)) {
    if (!Number.isFinite(maxChars) || maxChars <= 0) throw new Error(`${where} 的 META.copyBudgets["${pathName}"] 必须是正数`);
  }
  return { ...copyBudgets };
}

export function normalizeRuntimePages(rawPages, { themeKey, layoutPrefix, keepTextControls = false }) {
  return (rawPages || []).map((entry, index) => {
    const pageNumber = index + 1;
    const meta = entry.meta || {};
    const slot = entry.slot || entry.id || entry.key || meta.id || `page${pageNumber}`;
    const defaultProps = {
      ...(entry.defaultProps || entry.defaults || {}),
      ...(entry.initial || entry.initialProps || {}),
    };
    return {
      key: `${themeKey}_page${String(pageNumber).padStart(3, '0')}`,
      themeKey,
      pageNumber,
      layout: `${layoutPrefix}-${String(pageNumber).padStart(3, '0')}`,
      slot,
      label: entry.label || entry.name || entry.title || meta.label || meta.title || slot,
      Component: entry.Component || entry.component || entry.Comp || entry.C,
      controls: normalizeControls(entry.controls || entry.spec?.controls || meta.controls || [], defaultProps, { keepTextControls }),
      defaultProps,
      staticHtml: entry.staticHtml || false,
      bgClass: entry.bgClass || entry.backgroundClass || '',
      // Explicit, page-declared hard domains for array-item fields consumed directly as
      // chart/SVG geometry (fixed-axis scale, normalized position, rank index, ...). Forwarded
      // straight through to createContract() in src/prop-contract-core.mjs; see that file for
      // the "arrayKey[].field" -> {min,max,semantics} shape.
      ...((entry.numberBounds || entry.spec?.numberBounds || meta.numberBounds)
        ? { numberBounds: entry.numberBounds || entry.spec?.numberBounds || meta.numberBounds }
        : {}),
    };
  });
}

export function DeckPageNumber({
  page = '01',
  total = '01',
  pad = 2,
  totalPad = 2,
  separator = ' / ',
  accentStyle,
  currentStyle,
  totalStyle,
  className,
  style,
  as: Tag = 'span',
  ...rest
}) {
  return (
    <Tag
      {...rest}
      className={className}
      style={style}
      data-dashi-page-number="fraction"
      data-dashi-page-pad={pad}
      data-dashi-page-total-pad={totalPad}
      data-dashi-page-separator={separator}
      data-editable-skip="true"
    >
      <b data-dashi-page-current="" style={{ ...(accentStyle || {}), ...(currentStyle || {}) }}>{page}</b>
      <span data-dashi-page-separator="true">{separator}</span>
      <span data-dashi-page-total="" style={totalStyle}>{total}</span>
    </Tag>
  );
}

export function DeckPageCurrent({
  value = '01',
  pad = 2,
  className,
  style,
  as: Tag = 'span',
  ...rest
}) {
  return (
    <Tag
      {...rest}
      className={className}
      style={style}
      data-dashi-page-number="current"
      data-dashi-page-pad={pad}
      data-editable-skip="true"
    >
      <span data-dashi-page-current="">{value}</span>
    </Tag>
  );
}

const TEXT_CONTROL_TYPES = new Set(['text', 'string', 'input', 'url', 'email', 'textarea', 'multiline']);
const REMOVED_CONTROL_TYPES = new Set();
const EMPHASIS_CONTROL_KEYS = new Set([
  'activeIndex',
  'currentIndex',
  'emphasisIndex',
  'featureIndex',
  'focusCol',
  'focusIndex',
  'highlightCol',
  'highlightIndex',
  'highlightRowIndex',
]);

function normalizeControls(controls, defaults = {}, options = {}) {
  const baseControls = (controls || [])
    .filter(control => !isRemovedControl(control, options))
    .map(control => ({
      ...control,
      min: resolveControlValue(control?.min, defaults),
      max: resolveControlValue(control?.max, defaults),
    }));
  const countAwareControls = baseControls.map(control => materializeCountBounds(control, defaults));
  const normalizedControls = countAwareControls.map(control => materializeDerivedBounds(control, countAwareControls, defaults));
  return normalizePublicControls(normalizedControls, options.standard ? { standard: true } : {});
}

function isRemovedControl(control, options = {}) {
  const type = String(control?.type || '').toLowerCase();
  if (options.keepTextControls && TEXT_CONTROL_TYPES.has(type)) return false;
  return TEXT_CONTROL_TYPES.has(type) || REMOVED_CONTROL_TYPES.has(type);
}

function materializeCountBounds(control, defaults) {
  if (control?.max != null || !isOptionalQuantityControl(control)) return control;
  const derivedMax = resolveControlValue(control?.maxFrom, defaults);
  if (derivedMax == null) return control;
  return {
    ...control,
    max: derivedMax,
  };
}

function materializeDerivedBounds(control, controls, defaults) {
  if (control?.max != null) return control;

  if (isEmphasisControl(control)) {
    const linkedControl = resolveLinkedCountControl(controls, control);
    const linkedMax = Number(linkedControl?.max);
    if (Number.isFinite(linkedMax)) {
      const min = Number(control?.min ?? 0);
      return {
        ...control,
        max: resolveEmphasisLinkedMax(linkedMax, min),
        maxFromKey: control.maxFromKey || linkedControl.key,
      };
    }
  }

  const derivedMax = resolveControlValue(control?.maxFrom, defaults);
  if (derivedMax == null) return control;
  return {
    ...control,
    max: derivedMax,
  };
}

function isOptionalQuantityControl(control) {
  return String(control?.type || '').toLowerCase() === 'number'
    && (String(control?.key || '').toLowerCase().includes('count') || control?.key === 'columns');
}

function isEmphasisControl(control) {
  return String(control?.type || '').toLowerCase() === 'number'
    && EMPHASIS_CONTROL_KEYS.has(control?.key);
}

function resolveEmphasisLinkedMax(linkedMax, min) {
  return Math.max(min, linkedMax - (min === 0 ? 1 : 0));
}

function resolveLinkedCountControl(controls, emphasisControl) {
  if (!emphasisControl) return null;
  if (emphasisControl.maxFromKey) {
    return controls.find((control) => control.key === emphasisControl.maxFromKey) || null;
  }
  if (emphasisControl.key === 'focusCol' || emphasisControl.key === 'highlightCol') {
    return controls.find((control) => ['colCount', 'columnCount', 'columns'].includes(control.key)) || null;
  }
  if (emphasisControl.key === 'featureIndex') {
    return controls.find((control) => control.key === 'itemCount') || null;
  }
  return controls.find(isOptionalQuantityControl) || null;
}

function resolveControlValue(value, defaults) {
  if (typeof value === 'function') return value(defaults);
  return value;
}
