// 系统分层架构图:3–5 条横向层带,层名在左侧渐变色块里(越往下越深),每层 2–6 个组件小框;
// 层间用双向箭头 + 胶囊标注调用方式;右侧可选一根贯穿各层的支撑栏(运维、安全等)和逐层要点。
// 原生 HTML 绘制,文字全部是独立文本元素。适合系统总体架构、技术架构、感知—边缘—云—应用这类分层结构。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useStructureStyle, DuplexArrow } from '../kit/structure.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  layerCount: 4,
  showLinks: true,
  showSide: true,
  showNotes: true,
  showConclusion: true,
  sectionNo: '3.3',
  title: '系统总体架构',
  layers: [
    { no: '01', name: '表现层', en: 'PRESENTATION', chips: ['学生前台', '管理后台', '验证码服务', 'CDN 头像存储'], link: 'HTTP 请求 · Cookie 身份验证', note: 'B/S 模式，学生与管理员通过浏览器访问；登录注册接入第三方验证码并做二次验证。' },
    { no: '02', name: '接入层', en: 'GATEWAY', chips: ['Nginx 容器', 'Tomcat 容器 1', 'Tomcat 容器 2', 'Tomcat 容器 3'], link: '请求分发 · 负载均衡', note: 'Nginx 容器把请求分发到 3 个 Tomcat 容器，提升并发与容灾能力。' },
    { no: '03', name: '业务层', en: 'SERVICE', chips: ['在线测试', '试卷管理', '试题管理', '用户管理', '数据分析'], link: 'MyBatis · 数据访问', note: '基于 Spring Boot、SpringMVC 与 MyBatis 实现，学生 4 个、管理员 5 个功能模块。' },
    { no: '04', name: '数据层', en: 'DATA', chips: ['MySQL', 'MongoDB', 'RabbitMQ'], link: '容器化部署', note: 'MySQL 存用户、试题、标签、试卷 4 张表；MongoDB 存详细试卷与测试用例。' },
    { no: '05', name: '基础设施', en: 'INFRASTRUCTURE', chips: ['CentOS 7', 'Docker 引擎', '容器管理平台'], link: '', note: '所有组件运行在 CentOS 7 上的 Docker 容器中，统一由管理平台管理。' },
  ],
  sideTitle: '持续集成与运维',
  sideItems: ['Jenkins 打包', '发布测试', '发布监控', '邮件告警', 'Docker 管理'],
  conclusionLabel: '架构特点',
  conclusion: '负载均衡 + Docker 容器化：并发与容灾能力较强，扩展时只需增加容器。',
};

const LINK_H = 50;
const MAX_ROW = 190;   // 层带高度上限:层数少时整组纵向居中,不把组件框拉得过高

const CSS = `
.cp-la{flex:1;min-height:0;display:grid;column-gap:20px;align-content:center;}
/* 层名色块:右缘带一个指向层带的小尖角;形状元素不含文字 */
.cp-la-name{position:relative;isolation:isolate;grid-column:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:0 26px 0 12px;color:var(--theme-on-accent);text-align:center;}
.cp-la-name-shape{position:absolute;inset:0;z-index:-1;border-radius:var(--campus-radius) 0 0 var(--campus-radius);background:var(--campus-fill-deep);clip-path:polygon(0 0,calc(100% - 16px) 0,100% 50%,calc(100% - 16px) 100%,0 100%);}
.cp-la-name-shade{position:absolute;inset:0;z-index:-1;border-radius:var(--campus-radius) 0 0 var(--campus-radius);clip-path:polygon(0 0,calc(100% - 16px) 0,100% 50%,calc(100% - 16px) 100%,0 100%);}
/* 越往下的层叠一层越深的黑色遮罩 */
.cp-la-name-shade.is-s1{background:rgb(0 0 0 / .07);}
.cp-la-name-shade.is-s2{background:rgb(0 0 0 / .14);}
.cp-la-name-shade.is-s3{background:rgb(0 0 0 / .21);}
.cp-la-name-shade.is-s4{background:rgb(0 0 0 / .28);}
.cp-la-no{font-family:var(--theme-font-serif);font-weight:700;font-size:20px;line-height:1;color:var(--campus-spark);font-variant-numeric:lining-nums;}
.cp-la-label{font-family:var(--theme-font-serif);font-weight:700;font-size:30px;line-height:1.15;letter-spacing:.1em;text-wrap:balance;}
.cp-la-en{font-size:13px;line-height:1.2;font-weight:600;letter-spacing:.16em;color:var(--campus-on-accent-muted);}
/* 层带:白卡,左侧贴着层名色块;组件小框等宽排开 */
.cp-la-band{grid-column:2;min-width:0;min-height:0;display:flex;align-items:stretch;gap:14px;padding:14px 16px;border-radius:0 var(--campus-radius) var(--campus-radius) 0;margin-left:-10px;}
.cp-la-band::before{border-left:0;}
.cp-la-item{position:relative;flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;padding:10px 12px 8px;border-radius:12px;background:var(--campus-wash);border:1px solid var(--campus-accent-line);text-align:center;}
.cp-la-item-cap{position:absolute;left:50%;top:0;width:34px;height:4px;margin-left:-17px;border-radius:0 0 3px 3px;background:var(--campus-fill);}
.cp-la-item-text{font-size:22px;line-height:1.3;font-weight:700;color:var(--theme-ink);text-wrap:balance;overflow-wrap:anywhere;}
/* 层间连接:层名列里一段竖向渐变连接条,层带列里「双向箭头 + 胶囊标注」 */
.cp-la-gap{grid-column:1;position:relative;}
.cp-la-gap-bar{position:absolute;left:calc(50% - 13px);top:-4px;bottom:-4px;width:10px;background:var(--campus-fill-bar);opacity:.35;border-radius:5px;}
.cp-la-link{grid-column:2;min-width:0;display:flex;align-items:center;justify-content:center;gap:14px;color:var(--theme-accent);}
.cp-la-link-pill{max-width:72%;padding:6px 18px;border-radius:999px;background:var(--theme-surface);border:1.5px solid var(--campus-accent-line);box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .1);font-size:18px;line-height:1.3;font-weight:700;letter-spacing:.04em;color:var(--theme-accent);text-align:center;white-space:nowrap;}
/* 支撑栏:贯穿全部层,顶部渐变卡头 + 竖排条目 */
.cp-la-side{grid-column:3;grid-row:1 / -1;min-height:0;display:flex;flex-direction:column;}
.cp-la-side-head{flex:none;display:flex;align-items:center;justify-content:center;min-height:84px;padding:12px 14px;background:var(--campus-fill-deep);border-radius:var(--campus-radius) var(--campus-radius) 0 0;color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:23px;line-height:1.3;letter-spacing:.06em;text-align:center;text-wrap:balance;}
.cp-la-side-list{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-evenly;gap:10px;padding:16px 14px;}
.cp-la-side-item{position:relative;padding:10px 8px;border-radius:10px;background:var(--campus-accent-wash);border:1px solid var(--campus-accent-line);font-size:20px;line-height:1.3;font-weight:700;color:var(--theme-ink);text-align:center;text-wrap:balance;}
.cp-la-side-item + .cp-la-side-item::before{content:'';position:absolute;left:50%;top:-11px;height:10px;width:0;border-left:2px dotted var(--campus-accent-line);}
/* 逐层要点:一张贯穿全部行的白卡,用 subgrid 让每条要点与它的层对齐 */
.cp-la-notes{grid-row:1 / -1;min-height:0;display:grid;grid-template-rows:subgrid;padding:0 26px 0 24px;}
.cp-la-notes-rail{position:absolute;left:30px;top:0;width:68px;height:6px;border-radius:0 0 4px 4px;background:var(--campus-fill);}
.cp-la-note{min-height:0;display:flex;align-items:center;gap:16px;}
.cp-la-note .campus-seal{min-width:42px;height:42px;font-size:21px;}
.cp-la-note-text{font-size:21px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;}
.cp-la-note-gap{border-top:1px dashed var(--campus-accent-line);align-self:center;}
.cp-la.is-5 .cp-la-label{font-size:27px;}
.cp-la.is-5 .cp-la-name{gap:4px;}
.cp-la.is-5 .cp-la-en{font-size:12px;}
.cp-la.is-5 .cp-la-item-text{font-size:21px;}
.cp-la.is-5 .cp-la-band{padding:10px 14px;}
.campus[data-campus-nav="rail"] .cp-la-side-head{font-size:21px;}
`;

export function LayerArchitecture(props) {
  useStructureStyle();
  useThemeStyle('campus-layer-architecture-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const layers = safeArray(p.layers).slice(0, clamp(p.layerCount, 3, 5));
  const n = Math.max(1, layers.length);
  const sideItems = safeArray(p.sideItems).slice(0, 6);
  const linkRow = p.showLinks ? `${LINK_H}px` : '18px';
  // 行:层带(等分剩余高度)与层间连接行交替
  const rows = layers.map((_, i) => (i < n - 1 ? `minmax(0,${MAX_ROW}px) ${linkRow}` : `minmax(0,${MAX_ROW}px)`)).join(' ');
  const cols = [
    '184px',
    'minmax(0,1fr)',
    p.showSide ? '150px' : null,
    p.showNotes ? 'minmax(0,.6fr)' : null,
  ].filter(Boolean).join(' ');
  const noteCol = p.showSide ? 4 : 3;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-la is-${n}${p.showNotes ? ' has-notes' : ''}`} style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}>
        {layers.map((layer, i) => {
          const row = i * 2 + 1;
          const items = safeArray(layer?.chips).slice(0, 6);
          return (
            <React.Fragment key={i}>
              <div className="cp-la-name campus-rise" style={{ gridRow: row, ...enterDelay(1 + i) }}>
                <div className="cp-la-name-shape" aria-hidden="true" />
                {i > 0 && <div className={`cp-la-name-shade is-s${Math.min(i, 4)}`} aria-hidden="true" />}
                <div className="cp-la-no">{layer?.no}</div>
                <div className="cp-la-label">{layer?.name}</div>
                <div className="cp-la-en">{layer?.en}</div>
              </div>
              <div className="cp-la-band campus-card campus-rise" style={{ gridRow: row, ...enterDelay(1 + i) }}>
                {items.map((item, j) => (
                  <div className="cp-la-item" key={j}>
                    <div className="cp-la-item-cap" aria-hidden="true" />
                    <div className="cp-la-item-text">{item}</div>
                  </div>
                ))}
              </div>
              {i < n - 1 && (
                <>
                  <div className="cp-la-gap" style={{ gridRow: row + 1 }} aria-hidden="true"><div className="cp-la-gap-bar" /></div>
                  {p.showLinks && (
                    <div className="cp-la-link campus-fade" style={{ gridRow: row + 1, ...enterDelay(2 + i) }}>
                      <DuplexArrow size={30} />
                      {layer?.link ? <div className="cp-la-link-pill">{layer.link}</div> : null}
                      <DuplexArrow size={30} />
                    </div>
                  )}
                </>
              )}
            </React.Fragment>
          );
        })}
        {p.showSide && (
          <aside className="cp-la-side campus-card campus-rise" style={enterDelay(2)}>
            <div className="cp-la-side-head">{p.sideTitle}</div>
            <div className="cp-la-side-list">
              {sideItems.map((item, i) => <div className="cp-la-side-item" key={i}>{item}</div>)}
            </div>
          </aside>
        )}
        {p.showNotes && (
          <div className="cp-la-notes campus-card campus-rise" style={{ gridColumn: noteCol, ...enterDelay(3) }}>
            <div className="cp-la-notes-rail" aria-hidden="true" />
            {layers.map((layer, i) => (
              <React.Fragment key={i}>
                <div className="cp-la-note" style={{ gridRow: i * 2 + 1 }}>
                  <div className="campus-seal is-soft">{layer?.no}</div>
                  <p className="cp-la-note-text">{layer?.note}</p>
                </div>
                {i < n - 1 && <div className="cp-la-note-gap" style={{ gridRow: i * 2 + 2 }} aria-hidden="true" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(8)} />}
    </CampusFrame>
  );
}

LayerArchitecture.META = {
  id: 'layer-architecture',
  label: '分层架构图 · 层带组件配逐层要点',
  roles: ['relationship', 'breakdown', 'context'],
  defaults: DEFAULTS,
  copyBudgets: {
    'layers[].no': 3,
    'layers[].name': 4,
    'layers[].en': 7,
    'layers[].chips[]': 8,
    'layers[].link': 14,
    'layers[].note': 40,
    sideTitle: 8,
    conclusionLabel: 4,
    'sideItems[]': 6,
    conclusion: 40,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'layerCount', type: 'number', label: '层数', default: 4, min: 3, max: 5, description: '横向层带的数量(自上而下);每层的组件小框按 chips 显示,最多 6 个。' },
    { key: 'showLinks', type: 'toggle', label: '层间标注', default: true, description: '相邻两层之间的双向箭头与调用方式标注(写在上一层的 link 里)。' },
    { key: 'showSide', type: 'toggle', label: '支撑栏', default: true, description: '层带右侧贯穿各层的支撑栏,放运维、安全这类横跨各层的能力。' },
    { key: 'showNotes', type: 'toggle', label: '逐层要点', default: true, description: '最右侧与各层对齐的一句话要点。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
