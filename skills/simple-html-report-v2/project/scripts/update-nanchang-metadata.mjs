import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GENERATED_THEME_PACKS, GENERATED_THEME_PAGES } from '../src/components/themes/generated-metadata.js';
import { formatGeneratedMetadataModule } from '../src/generated-metadata-writer.mjs';

const root = new URL('../', import.meta.url);
const output = fileURLToPath(new URL('../src/components/themes/generated-metadata.js', import.meta.url));
const manifestOutput = fileURLToPath(new URL('../layout-manifest.json', import.meta.url));
const accentPresets = [
  { value: '#00D9C6', label: '霓虹青' },
  { value: '#0A6BFF', label: '赣江蓝' },
  { value: '#FFB84A', label: '赤金' },
  { value: '#F25555', label: '朱红' },
  { value: '#8B5CF6', label: '夜紫' },
  { value: '#38BDF8', label: '天际蓝' },
];
const accentGuard = {
  brightFactor: 1.3,
  minContrast: 4.5,
  minLightness: 0.2,
  minSaturation: 0.12,
  neutralHue: 214,
  neutralSaturation: 0.22,
};
const identity = {
  key: 'identity',
  type: 'group',
  label: '汇报信息',
  description: '汇报品牌、LOGO、主题色整份演示稿统一,改一处所有页面立即生效。',
  fields: [
    { key: 'name', type: 'text', section: '名称', label: '中文品牌名', default: '南昌项目汇报', maxLength: 24, description: '页眉、封面、目录、结语上的汇报品牌名。' },
    { key: 'nameEn', type: 'text', section: '名称', label: '英文副标', default: 'NANCHANG PROJECT BRIEFING', maxLength: 64, description: '写在中文品牌名下方的英文副标。' },
    { key: 'headerNote', type: 'text', section: '名称', label: '页眉短标', default: 'CITY SIGNAL · PROJECT BRIEFING', maxLength: 48, follows: 'name', description: '页眉右侧的小型场景标签。' },
    { key: 'footerNote', type: 'text', section: '名称', label: '页脚说明', default: '南昌主题 · 项目汇报', maxLength: 48, follows: 'name', description: '每页左下角的说明文字。' },
    { key: 'logo', type: 'image', section: '品牌标记', label: '品牌 LOGO', accept: 'image/png,image/jpeg,image/svg+xml,image/webp', description: '使用用户提供的品牌或项目 LOGO；不会联网下载。' },
    { key: 'mark', type: 'text', section: '品牌标记', label: '文字标记', default: '昌', maxLength: 2, follows: { key: 'name', rule: 'initial' }, when: { logo: false }, description: '没有 LOGO 时圆形标记里的文字。' },
    { key: 'logoHasName', type: 'toggle', section: '品牌标记', label: 'LOGO 已包含品牌名', default: false, when: { logo: true }, auto: { image: 'logo', minAspect: 2.2 }, description: '横向组合标打开此项，页眉只显示 LOGO。' },
    { key: 'logoPlate', type: 'toggle', section: '品牌标记', label: '深色页眉上加白底', default: true, when: { logo: true }, plate: 'logo', description: '给浅色 LOGO 垫一块白色底板。' },
    { key: 'accent', type: 'color', section: '主题色', label: '主题色', default: '#00D9C6', presets: accentPresets, guard: accentGuard, description: '高亮色、图表色阶和局部光晕由主题色派生。' },
  ],
};

function transform(value) {
  if (typeof value === 'string') {
    return value
      .replaceAll('校色', '主题色')
      .replaceAll('学校信息', '汇报信息')
      .replaceAll('学校名称', '汇报品牌名')
      .replaceAll('学院名称', '部门/项目组')
      .replaceAll('学校 LOGO', '品牌 LOGO')
      .replaceAll('学校封面版式', '封面版式')
      .replaceAll('选了学校时生效', '南昌主题下生效')
      .replaceAll('校徽', '文字标记')
      .replaceAll('校园照片', '城市照片')
      .replaceAll('白色页眉', '深色页眉');
  }
  if (Array.isArray(value)) return value.map(transform);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, transform(item)]));
  return value;
}

const themes = GENERATED_THEME_PACKS.map(theme => {
  if (theme.key !== 'campus') return theme;
  const deckStyles = transform(theme.deckStyles || []).filter(item => item.key !== 'identity');
  return {
    ...theme,
    displayName: '南昌炫酷汇报版',
    label: '南昌炫酷汇报版',
    name: '南昌炫酷汇报版',
    scenario: '项目汇报、业务复盘、方案评审、区域分析、管理简报',
    audience: '项目负责人、业务团队、管理层、区域协作团队',
    deckStyles: [identity, ...deckStyles],
  };
});

const pages = GENERATED_THEME_PAGES.map(page => {
  if (page.themeKey !== 'campus') return page;
  const next = transform(page);
  if (next.key === 'campus_temp_cover') {
    next.defaultProps = {
      ...next.defaultProps,
      kicker: '项目汇报',
      subtitle: '副标题：一句话说明这次汇报的判断与动作',
      presenterLabel: '汇报人',
      presenter: '姓名',
      advisorLabel: '协作方',
      advisor: '',
      unitLabel: '部门 / 项目组',
      unit: '',
      dateLabel: '日期',
      date: '2026 年 11 月',
    };
  }
  if (next.key === 'campus_temp_agenda') {
    next.defaultProps = {
      ...next.defaultProps,
      title: '汇报结构',
      subtitle: 'BRIEFING MAP',
      items: [
        { no: '01', title: '现状扫描', note: 'SITUATION', desc: '' },
        { no: '02', title: '关键进展', note: 'PROGRESS', desc: '' },
        { no: '03', title: '风险判断', note: 'RISK', desc: '' },
        { no: '04', title: '行动计划', note: 'ACTION', desc: '' },
        { no: '05', title: '补充证据', note: 'EVIDENCE', desc: '' },
        { no: '06', title: '结语', note: 'CLOSING', desc: '' },
      ],
    };
  }
  if (next.key === 'campus_temp_closing') {
    next.defaultProps = {
      ...next.defaultProps,
      subtitle: '下一步，我们继续向前',
      contact: '汇报人 · 项目组',
    };
  }
  return next;
});

fs.writeFileSync(output, formatGeneratedMetadataModule(themes, pages), 'utf8');
const manifest = JSON.parse(fs.readFileSync(manifestOutput, 'utf8'));
for (const [key, layout] of Object.entries(manifest.layouts || {})) {
  if (key.startsWith('campus_')) manifest.layouts[key] = transform(layout);
}
fs.writeFileSync(manifestOutput, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`updated ${output}`);

