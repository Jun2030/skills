// 数据库设计(ER 图):2–4 张实体表卡横排,表卡是渐变表头(表名 + 中文名)+ 字段行(字段名 / 类型 / 说明,主键、外键带小标记);
// 表卡之间用连线标出关系:连线从外键所在的字段行连到被引用的字段行,两端按关系文字(1 : N、N : M)自动画「一」竖线或「多」鸦爪,
// 中间是关系胶囊;不相邻的两张表从上方绕行。底部可选一句设计说明。
// 几何按外壳的正文区尺寸计算(useCampusLayout):表卡窄时字段说明换到第二行。已有现成 ER 图时可切到「改用图片」。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, safeNumber, safeDenominator, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL, TITLE_ROW_SPACE, CONCLUSION_SPACE, useCampusLayout } from '../kit/chrome.jsx';
import { useDiagramStyle, WireLayer, WireTag, DiagramImage, diagramMediaControls, isImageMode, tagWidth, r1 } from '../kit/diagram.jsx';

const f = (mark, name, datatype, note) => ({ mark, name, datatype, note });
const DEFAULTS = {
  chapterIndex: 3,
  mediaMode: 'auto',
  tableCount: 4,
  fieldCount: 6,
  relationCount: 3,
  showLegend: true,
  showConclusion: true,
  sectionNo: '3.4',
  title: '系统数据库设计（MySQL）',
  legend: [
    { mark: 'PK', text: '主键' },
    { mark: 'FK', text: '外键' },
  ],
  tables: [
    { name: 'user', label: '用户表', fields: [f('PK', 'id', 'int', '用户编号'), f('', 'username', 'varchar', '用户名'), f('', 'password', 'char(32)', 'MD5 密文'), f('', 'role', 'tinyint', '学生 / 管理员'), f('', 'status', 'tinyint', '审核状态'), f('', 'avatar', 'varchar', '头像 CDN 地址'), f('', 'created_at', 'datetime', '注册时间'), f('', 'login_at', 'datetime', '最近登录')] },
    { name: 'paper', label: '试卷表', fields: [f('PK', 'id', 'int', '试卷编号'), f('FK', 'user_id', 'int', '作答用户'), f('', 'mongo_id', 'char(24)', '详细内容存 MongoDB'), f('', 'score', 'int', '得分'), f('', 'state', 'tinyint', '是否已关闭'), f('', 'mode', 'tinyint', '练习 / 考试'), f('', 'started_at', 'datetime', '开考时间'), f('', 'submit_at', 'datetime', '交卷时间')] },
    { name: 'question', label: '试题表', fields: [f('PK', 'id', 'int', '试题编号'), f('FK', 'tag_id', 'int', '所属标签'), f('', 'kind', 'tinyint', '单选 / 多选 / 编程'), f('', 'content', 'text', '题干'), f('', 'answer', 'text', '参考答案'), f('', 'rate', 'float', '正确率'), f('', 'level', 'tinyint', '难度'), f('', 'updated_at', 'datetime', '更新时间')] },
    { name: 'tag', label: '标签表', fields: [f('PK', 'id', 'int', '标签编号'), f('', 'name', 'varchar', 'Java、MySQL 等'), f('FK', 'parent_id', 'int', '上级标签'), f('', 'total', 'int', '试题数量'), f('', 'sort', 'int', '排序'), f('', 'status', 'tinyint', '是否启用'), f('', 'created_at', 'datetime', '创建时间'), f('', 'remark', 'varchar', '备注')] },
  ],
  relations: [
    { from: 1, fromField: 1, to: 2, toField: 2, label: '1 : N', verb: '作答' },
    { from: 2, fromField: 0, to: 3, toField: 0, label: 'N : M', verb: '组卷' },
    { from: 3, fromField: 2, to: 4, toField: 1, label: 'N : 1', verb: '归类' },
  ],
  imageCaption: '图 3-5 MySQL 四张表的结构与关系',
  conclusionLabel: '设计说明',
  conclusion: 'MySQL 存用户、试卷、试题、标签四张表，作答详情存 MongoDB，表里只留索引（表与字段为示例）。',
};

const GAP_MIN = 120;       // 表卡之间的最小间距(放鸦爪 + 关系胶囊)
const HEAD_H = 72;
const CHANNEL = 64;        // 不相邻关系的上方绕行通道高度
const WIDE_AT = 420;       // 表卡宽于它时字段说明与字段名同行

const CSS = `
.cp-g2-er{position:relative;flex:1;min-height:0;}
.cp-g2-er-card{position:absolute;isolation:isolate;display:flex;flex-direction:column;border-radius:var(--campus-radius);}
.cp-g2-er-card::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--theme-surface);border:1px solid var(--campus-card-edge);box-shadow:var(--campus-shadow);}
/* 表头:渐变 + 表名(衬线)+ 中文名胶囊 + 网格小图标 */
.cp-g2-er-head{position:relative;flex:none;display:flex;align-items:center;gap:12px;padding:0 18px;border-radius:var(--campus-radius) var(--campus-radius) 0 0;background:var(--campus-fill-deep);color:var(--theme-on-accent);overflow:hidden;}
.cp-g2-er-icon{flex:none;display:grid;grid-template-columns:repeat(3,7px);grid-template-rows:repeat(3,5px);gap:2px;padding:6px;border-radius:8px;background:var(--campus-on-accent-glass);}
.cp-g2-er-icon > div{background:rgb(255 255 255 / .85);border-radius:1px;}
.cp-g2-er-icon > div:nth-child(-n+3){background:var(--campus-spark);}
.cp-g2-er-name{min-width:0;font-family:var(--theme-font-serif);font-weight:700;font-size:27px;line-height:1.1;letter-spacing:.02em;white-space:nowrap;overflow:hidden;}
.cp-g2-er-label{flex:none;margin-left:auto;display:flex;align-items:center;height:30px;padding:0 12px;border-radius:999px;background:var(--campus-on-accent-glass);font-size:18px;line-height:1;font-weight:700;letter-spacing:.06em;white-space:nowrap;}
.cp-g2-er-orb{position:absolute;right:-30px;top:-46px;width:110px;height:110px;border-radius:50%;background:rgb(255 255 255 / .07);pointer-events:none;}
/* 字段行 */
.cp-g2-er-row{position:relative;flex:none;display:grid;grid-template-columns:40px minmax(0,1.05fr) auto minmax(0,1.2fr);align-items:center;column-gap:10px;padding:0 16px 0 12px;border-top:1px solid var(--theme-line);}
.cp-g2-er-row:nth-child(even){background:var(--campus-accent-wash);}
.cp-g2-er-row:last-child{border-radius:0 0 var(--campus-radius) var(--campus-radius);}
.cp-g2-er-row.is-key{background:rgb(var(--theme-accent-rgb) / .08);}
.cp-g2-er-mark{justify-self:start;display:flex;align-items:center;justify-content:center;height:24px;min-width:34px;padding:0 6px;border-radius:6px;font-family:var(--theme-font-serif);font-weight:700;font-size:14px;line-height:1;letter-spacing:.04em;}
.cp-g2-er-mark.is-pk{background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:0 0 0 2px var(--campus-spark-soft);}
.cp-g2-er-mark.is-fk{background:var(--theme-surface);color:var(--theme-accent);border:1.5px solid var(--theme-accent);}
.cp-g2-er-mark.is-none{opacity:0;}
.cp-g2-er-fname{min-width:0;font-size:21px;line-height:1.25;font-weight:700;color:var(--theme-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cp-g2-er-row.is-key .cp-g2-er-fname{color:var(--theme-accent);}
.cp-g2-er-type{justify-self:start;display:flex;align-items:center;height:26px;padding:0 9px;border-radius:6px;background:var(--campus-neutral-wash);color:var(--theme-muted);font-size:16px;line-height:1;font-weight:600;white-space:nowrap;}
.cp-g2-er-note{min-width:0;font-size:18px;line-height:1.3;color:var(--theme-muted);text-wrap:pretty;}
/* 窄卡:说明换到第二行 */
.cp-g2-er.is-narrow .cp-g2-er-row{grid-template-columns:40px minmax(0,1fr) auto;grid-template-rows:auto auto;row-gap:2px;align-content:center;}
.cp-g2-er.is-narrow .cp-g2-er-note{grid-column:2 / 4;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cp-g2-er.is-narrow .cp-g2-er-name{font-size:25px;}
/* 关系胶囊下的动词 */
.cp-g2-er-media{flex:1;min-height:0;display:flex;}
.cp-g2-er-legend{flex:none;display:flex;align-items:center;gap:10px;}
.cp-g2-er-legend-text{margin-right:12px;font-size:18px;line-height:1;color:var(--theme-muted);white-space:nowrap;}
`;

/** 「1 : N」→ 两端的基数类型:one(一条竖线)/ many(鸦爪)。 */
function ends(label) {
  const parts = String(label ?? '').split(/[:：]/).map(s => s.trim().toUpperCase());
  const kind = s => (/^(N|M|\*|多|N\+|0\.\.\*|1\.\.\*)$/.test(s) ? 'many' : 'one');
  return [kind(parts[0] || '1'), kind(parts[1] || '1')];
}

/**
 * 端点符号的 SVG 路径:(x, y) 是连线接到表卡边缘的点;dir = 1 表示线从边缘向右伸出(左端在卡片右缘),-1 向左,
 * 'up' 表示线从表卡上沿向上伸出(上方绕行的关系)。
 */
function endMark(kind, x, y, dir) {
  if (dir === 'up') {
    const flip = endMark(kind, y, x, -1);
    // 交换坐标轴:把水平版的 (x, y) 对调成竖直版
    return flip.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, a, b) => `${b} ${a}`);
  }
  const d = dir;
  if (kind === 'many') {
    const tip = x + d * 22;
    return `M ${r1(tip)} ${r1(y)} L ${r1(x)} ${r1(y - 11)} M ${r1(tip)} ${r1(y)} L ${r1(x)} ${r1(y)} M ${r1(tip)} ${r1(y)} L ${r1(x)} ${r1(y + 11)} M ${r1(x + d * 30)} ${r1(y - 10)} L ${r1(x + d * 30)} ${r1(y + 10)}`;
  }
  return `M ${r1(x + d * 16)} ${r1(y - 11)} L ${r1(x + d * 16)} ${r1(y + 11)} M ${r1(x + d * 24)} ${r1(y - 11)} L ${r1(x + d * 24)} ${r1(y + 11)}`;
}

export function ErSchema(props) {
  useDiagramStyle();
  useThemeStyle('campus-er-schema-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const { bodyW, bodyH } = useCampusLayout();
  const image = isImageMode(p);
  const tables = safeArray(p.tables).slice(0, clamp(p.tableCount, 2, 4));
  const T = tables.length;
  const fieldCount = clamp(p.fieldCount, 3, 8);
  const rels = safeArray(p.relations).slice(0, clamp(p.relationCount, 0, 3))
    .map(rel => ({
      rel,
      a: clamp(Math.round(safeNumber(rel?.from, 1)), 1, 4),
      b: clamp(Math.round(safeNumber(rel?.to, 2)), 1, 4),
      fa: clamp(Math.round(safeNumber(rel?.fromField, 0)), 0, 8),
      fb: clamp(Math.round(safeNumber(rel?.toField, 0)), 0, 8),
    }))
    .filter(r => r.a <= T && r.b <= T && r.a !== r.b);

  const W = bodyW;
  const H = bodyH - TITLE_ROW_SPACE - (p.showConclusion ? CONCLUSION_SPACE : 0);
  const hasChannel = rels.some(r => Math.abs(r.a - r.b) > 1);
  const gap = clamp(W * 0.082, GAP_MIN, 170);
  const cardW = Math.min(620, (W - (T - 1) * gap) / safeDenominator(T, 1));
  const x0 = (W - (T * cardW + (T - 1) * gap)) / 2;
  const narrow = cardW < WIDE_AT;
  const rowsOf = t => safeArray(t?.fields).slice(0, fieldCount).filter(fl => fl?.name);
  const maxRows = Math.max(1, ...tables.map(t => rowsOf(t).length));
  const top0 = hasChannel ? CHANNEL : 0;
  const rowH = clamp((H - top0 - HEAD_H - 8) / maxRows, 40, narrow ? 80 : maxRows <= 4 ? 74 : 60);
  const cardH = t => HEAD_H + rowsOf(t).length * rowH;
  const blockH = HEAD_H + maxRows * rowH;
  const y0 = top0 + Math.max(0, (H - top0 - blockH) / 2);
  const cardX = i => x0 + i * (cardW + gap);
  const rowY = (ti, fi) => (fi <= 0 ? y0 + HEAD_H / 2 : y0 + HEAD_H + (Math.min(fi, rowsOf(tables[ti - 1]).length) - 0.5) * rowH);

  const wires = [];
  const marks = [];
  const tags = [];
  rels.forEach((r, k) => {
    const [ka, kb] = ends(r.rel?.label);
    if (Math.abs(r.a - r.b) === 1) {
      const left = r.a < r.b ? r : { ...r, a: r.b, b: r.a, fa: r.fb, fb: r.fa };
      const kl = r.a < r.b ? ka : kb;
      const kr = r.a < r.b ? kb : ka;
      const xa = cardX(left.a - 1) + cardW;
      const xb = cardX(left.b - 1);
      const ya = rowY(left.a, left.fa);
      const yb = rowY(left.b, left.fb);
      const xm = (xa + xb) / 2;
      wires.push({ points: [[xa, ya], [xm, ya], [xm, yb], [xb, yb]], kind: 'main', head: false, radius: 14 });
      marks.push(endMark(kl, xa, ya, 1), endMark(kr, xb, yb, -1));
      tags.push({ x: xm, y: (ya + yb) / 2, label: r.rel?.label, verb: r.rel?.verb });
      return;
    }
    // 不相邻:从两张表的表头上方绕行
    const ia = Math.min(r.a, r.b);
    const ib = Math.max(r.a, r.b);
    const xa = cardX(ia - 1) + cardW * 0.7;
    const xb = cardX(ib - 1) + cardW * 0.3;
    const yc = y0 - CHANNEL * 0.55 - k * 6;
    wires.push({ points: [[xa, y0], [xa, yc], [xb, yc], [xb, y0]], kind: 'sub', head: false, radius: 14 });
    const kTop = r.a < r.b ? [ka, kb] : [kb, ka];
    marks.push(endMark(kTop[0], xa, y0, 'up'), endMark(kTop[1], xb, y0, 'up'));
    tags.push({ x: (xa + xb) / 2, y: yc, label: r.rel?.label, verb: r.rel?.verb, above: true });
  });

  const diagram = (
    <div className={`cp-g2-er cp-g2-stage${narrow ? ' is-narrow' : ''}`} style={{ width: W, height: r1(H) }}>
      <WireLayer W={W} H={H} wires={wires} className="campus-fade" style={enterDelay(4)} />
      <svg className="cp-g2-wires campus-fade" style={{ width: W, height: r1(H), ...enterDelay(4) }} width={W} height={r1(H)} viewBox={`0 0 ${W} ${r1(H)}`} aria-hidden="true">
        {marks.filter(Boolean).map((d, k) => <path key={k} className="cp-g2-wire is-main" d={d} />)}
      </svg>
      {tables.map((t, i) => {
        const rows = rowsOf(t);
        return (
          <div key={i} className="cp-g2-er-card campus-rise" style={{ left: r1(cardX(i)), top: r1(y0), width: r1(cardW), height: r1(cardH(t)), ...enterDelay(1 + i) }}>
            <div className="cp-g2-er-head" style={{ height: HEAD_H }}>
              <div className="cp-g2-er-orb" aria-hidden="true" />
              <div className="cp-g2-er-icon" aria-hidden="true">{Array.from({ length: 9 }, (_, k) => <div key={k} />)}</div>
              <div className="cp-g2-er-name">{t?.name}</div>
              <div className="cp-g2-er-label">{t?.label}</div>
            </div>
            {rows.map((fl, j) => {
              const mark = String(fl?.mark ?? '').trim();
              const kind = /^PK$/i.test(mark) ? 'pk' : mark ? 'fk' : 'none';
              return (
                <div key={j} className={`cp-g2-er-row${kind !== 'none' ? ' is-key' : ''}`} style={{ height: r1(rowH) }}>
                  <div className={`cp-g2-er-mark is-${kind}`}>{mark}</div>
                  <div className="cp-g2-er-fname">{fl?.name}</div>
                  <div className="cp-g2-er-type">{fl?.datatype}</div>
                  <div className="cp-g2-er-note">{fl?.note}</div>
                </div>
              );
            })}
          </div>
        );
      })}
      {tags.map((t, k) => (
        <React.Fragment key={k}>
          <WireTag x={t.x} y={t.y} text={t.label} tone="solid" className="campus-fade" style={enterDelay(6)} />
          {t.verb ? (
            <WireTag
              x={t.above ? t.x + tagWidth(t.label) / 2 + tagWidth(t.verb) / 2 + 6 : t.x}
              y={t.above ? t.y : t.y - 42}
              text={t.verb}
              tone="ghost"
              small
              className="campus-fade"
              style={enterDelay(6)}
            />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );

  const legend = p.showLegend ? (
    <div className="cp-g2-er-legend">
      {safeArray(p.legend).slice(0, 2).map((item, i) => (
        <React.Fragment key={i}>
          <div className={`cp-g2-er-mark is-${i === 0 ? 'pk' : 'fk'}`}>{item?.mark}</div>
          <div className="cp-g2-er-legend-text">{item?.text}</div>
        </React.Fragment>
      ))}
    </div>
  ) : null;

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} aside={image ? null : legend} className="campus-rise" style={enterDelay(0)} />
      {image ? (
        <div className="cp-g2-er-media campus-rise" style={enterDelay(1)}>
          <DiagramImage id="er-schema-image" placeholder="ER 图 / 表结构图" caption={p.imageCaption} />
        </div>
      ) : diagram}
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(10)} />}
    </CampusFrame>
  );
}

ErSchema.META = {
  id: 'er-schema',
  label: '数据库设计 · 实体表卡与关系连线',
  roles: ['relationship', 'context'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 22,
    'legend[].mark': 2,
    'legend[].text': 4,
    'tables[].name': 12,
    'tables[].label': 5,
    'tables[].fields[].mark': 2,
    'tables[].fields[].name': 12,
    'tables[].fields[].datatype': 10,
    'tables[].fields[].note': 10,
    'relations[].label': 6,
    'relations[].verb': 4,
    imageCaption: 30,
    conclusionLabel: 4,
    conclusion: 48,
  },
  numberBounds: {
    'relations[].from': { min: 1, max: 4, semantics: 'index' },
    'relations[].to': { min: 1, max: 4, semantics: 'index' },
    'relations[].fromField': { min: 0, max: 8, semantics: 'index' },
    'relations[].toField': { min: 0, max: 8, semantics: 'index' },
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    ...diagramMediaControls('ER 图'),
    { key: 'tableCount', type: 'number', label: '表的数量', default: 4, min: 2, max: 4, countArrays: ['tables'], description: '横排的实体表卡数。表名 name 写英文表名,label 写中文名;表卡窄时字段说明自动换到字段名下方。' },
    { key: 'fieldCount', type: 'number', label: '字段行数', default: 6, min: 3, max: 8, countArrays: ['tables[].fields'], description: '每张表的字段行数,各表 fields 的条数都写成这个数;某张表字段较少时,把多出来的字段 name 留空即不显示(表卡随之变短)。mark 写 PK(主键)或 FK(外键),普通字段留空;datatype 是字段类型。' },
    { key: 'relationCount', type: 'number', label: '关系连线数', default: 3, min: 0, max: 3, countArrays: ['relations'], description: '表与表之间的关系连线。from / to 是表的序号(1 起);fromField / toField 是连线接在第几个字段行(0 = 接在表头);label 写基数(1 : N、N : 1、N : M、1 : 1),两端自动画「一」竖线或「多」鸦爪;verb 是关系名。不相邻的两张表从上方绕行。' },
    { key: 'showLegend', type: 'toggle', label: '主外键图例', default: true, description: '标题行右侧的 PK / FK 图例。' },
    { key: 'showConclusion', type: 'toggle', label: '底部设计说明', default: true, description: '页面底部的校色设计说明条。' },
  ],
};
