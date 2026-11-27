#!/usr/bin/env node
import {
  compactJson,
  inspectLayout,
} from './skill-workflow-utils.mjs';

const { layouts, compact, brief } = parseCliLayouts(process.argv.slice(2));

if (!layouts.length) {
  printUsage();
  process.exit(2);
}

const results = [];
const unknown = [];
for (const layout of layouts) {
  const result = inspectLayout(layout, { compact: compact || brief });
  if (result) results.push(result);
  else unknown.push(layout);
}

if (unknown.length) {
  console.error(`Unknown layout(s): ${unknown.join(', ')}`);
  process.exit(1);
}

if (brief) {
  process.stdout.write(`${results.map(briefLayout).join('\n\n')}\n`);
} else {
  process.stdout.write(compactJson(results.length === 1 ? results[0] : { layouts: results }));
}

// 非文字字段标出类型(数字 / 布尔 / 对象 / 数组),文字字段不标
function typeNote(type) {
  if (type === 'number') return ':数字';
  if (type === 'boolean') return ':布尔';
  if (Array.isArray(type)) return ':数组';
  if (type && typeof type === 'object') return `:对象{${Object.keys(type).join(',')}}`;
  return '';
}

// --brief:一页一小段纯文本,只留写 props 要用的东西——字段名(括号里是字数上限)、数组每项的键和数量控件、开关 / 选项、图片位。
function briefLayout(info) {
  const budgets = info.copyBudgets || {};
  const limit = key => (budgets[key]?.maxChars ? `(${budgets[key].maxChars})` : '');
  const arrays = new Map((info.arrayMeta || []).map(item => [item.key, item]));
  const shapes = info.propShapes || {};
  const scalar = [];
  const arrayLines = [];
  for (const [key, shape] of Object.entries(shapes)) {
    if (Array.isArray(shape)) {
      const meta = arrays.get(key) || {};
      const range = meta.min != null && meta.max != null ? `${meta.min}–${meta.max} 条` : '';
      const count = meta.countKey ? `数量控件 ${meta.countKey}` : '';
      const item = shape[0];
      const fields = item && typeof item === 'object'
        ? `{${Object.entries(item).map(([field, type]) => `${field}${typeNote(type)}${limit(`${key}[].${field}`)}`).join(', ')}}`
        : `${typeof item === 'string' ? '字符串' : JSON.stringify(item)}${limit(`${key}[]`)}`;
      arrayLines.push(`  ${key}[] ${[range, count].filter(Boolean).join(', ')}: ${fields}`);
    } else if (shape && typeof shape === 'object') {
      // 对象字段:写成 {"key": {...}},括号里列出它的子字段
      scalar.push(`${key}{${Object.entries(shape).map(([field, type]) => `${field}${typeNote(type)}${limit(`${key}.${field}`)}`).join(', ')}}`);
    } else {
      scalar.push(`${key}${typeNote(shape)}${limit(key)}`);
    }
  }
  const countKeys = new Set((info.arrayMeta || []).map(item => item.countKey).filter(Boolean));
  const controls = (info.controls || []).filter(control => !countKeys.has(control.key)).map(control => {
    const key = control.publicKey || control.key;
    if (control.type === 'toggle') return `${key}(开关,默认${control.default ? '开' : '关'}:${control.label})`;
    if (control.type === 'range') return `${key}(${control.min}–${control.max},默认 ${control.default}:${control.label})`;
    const options = (control.options || []).map(option => (typeof option === 'object' ? option.value : option)).filter(value => value != null);
    return `${key}(${options.length ? options.join('|') : control.type},默认 ${control.default}:${control.label})`;
  });
  const hint = mediaOffHint(info.controls || []);
  const media = (info.mediaSlots || []).map(slot => `${slot.field} 最多 ${slot.maxCount ?? slot.max ?? '若干'} 张(${(slot.accepts || []).join('/')});${hint}`);
  return [
    `${info.layout} — ${info.label || ''}${info.roles?.length ? ` [${info.roles.join(', ')}]` : ''}`,
    scalar.length ? `文字: ${scalar.join(' ')}` : '',
    arrayLines.length ? `数组:\n${arrayLines.join('\n')}` : '',
    controls.length ? `控件: ${controls.join(' ')}` : '',
    media.length ? `图片: ${media.join('; ')}` : '',
  ].filter(Boolean).join('\n');
}

// 没有图片时怎么处理图位:按这一页实际有的控件说,不给所有图片页套同一句(有的页根本没有关图位的开关)。
function mediaOffHint(controls) {
  const keyOf = control => control.publicKey || control.key;
  const optionValues = control => (control.options || []).map(option => (typeof option === 'object' ? option.value : option));
  if (controls.some(control => keyOf(control) === 'mediaMode' && optionValues(control).includes('auto'))) {
    return '没写图片时自动原生绘制,不用管图位';
  }
  const offs = [];
  for (const control of controls) {
    const key = keyOf(control);
    if (control.type === 'toggle' && /^show(Photo|Photos|Images?)$/.test(key)) offs.push(`"${key}": false`);
    else if (/image|media/i.test(key) && optionValues(control).includes('none')) offs.push(`"${key}": "none"`);
  }
  if (offs.length) return `没有图片时写 ${offs.join(' / ')} 关掉图位`;
  return '这页的图位关不掉,没有图片时不要选这页(换对照表里同类的无图页面)';
}

function parseCliLayouts(argv) {
  const result = { layouts: [], compact: false, brief: false };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--help' || item === '-h') {
      printUsage();
      process.exit(0);
    }
    if (item === '--compact') {
      result.compact = true;
      continue;
    }
    if (item === '--brief') {
      result.brief = true;
      continue;
    }
    if (item === '--layout') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        console.error('--layout requires a layout value');
        process.exit(2);
      }
      result.layouts.push(...splitLayoutArg(next));
      index += 1;
      continue;
    }
    if (item.startsWith('--layout=')) {
      result.layouts.push(...splitLayoutArg(item.slice('--layout='.length)));
      continue;
    }
    if (item.startsWith('--')) {
      console.error(`Unknown option "${item}"`);
      process.exit(2);
    }
    result.layouts.push(...splitLayoutArg(item));
  }
  return {
    ...result,
    layouts: [...new Set(result.layouts.filter(Boolean))],
  };
}

function splitLayoutArg(value) {
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

function printUsage() {
  console.error('Usage: node scripts/inspect-layout.mjs [--compact | --brief] [--layout <layout>] <layout...>');
  console.error('Examples:');
  console.error('  node scripts/inspect-layout.mjs theme01_page020');
  console.error('  node scripts/inspect-layout.mjs --layout theme01_page020 --layout theme01_page031');
}
