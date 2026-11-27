// 多段图组:2–4 段并排,每段 = 阶段标签 + 段名 + 一张图 + 1–2 条要点,段与段之间有渐变箭头圆钮;
// 可切换「等宽并排」与「最后一段放大」(最后一段是最终形态 / 实物,卡头换成渐变并挂小旗)。
// 适合硬件「原理图 → PCB → 实物」、系统结构的阶段演进、方案迭代前后对比。图片按原比例显示,不裁切。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, ConclusionBar, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { useStructureStyle, LinkDot, PickTag } from '../kit/structure.jsx';
import { useDiagramStyle, NumBadge } from '../kit/diagram.jsx';

const DEFAULTS = {
  chapterIndex: 3,
  stageCount: 3,
  layoutMode: 'emphasis',
  showConclusion: true,
  images: [],
  sectionNo: '3.2',
  title: '系统结构的三阶段演进',
  finalTag: '最终架构',
  stages: [
    { no: '1', kicker: '第一阶段', name: '单机直装', bullets: ['CentOS 7 上直接运行 MySQL、MongoDB 和 Tomcat', '组件共用一台主机，互相影响'] },
    { no: '2', kicker: '第二阶段', name: '容器化部署', bullets: ['三个组件分别放入各自的 Docker 容器', '交付部署更快，迁移扩展更轻松'] },
    { no: '3', kicker: '第三阶段', name: '负载均衡集群', bullets: ['Nginx 容器把请求分发到 3 个 Tomcat 容器', '后端连接 MongoDB、MySQL 容器'] },
    { no: '4', kicker: '第四阶段', name: '第四段名称', bullets: ['在这里写这一段的要点', '每段 1–2 条'] },
  ],
  conclusionLabel: '演进结果',
  conclusion: '负载均衡 + Docker 容器化：并发与容灾能力较强，扩展时只需增加容器。',
};

const CSS = `
.cp-g2-sf{flex:1;min-height:0;display:flex;align-items:stretch;}
.cp-g2-sf-seg{position:relative;min-width:0;display:flex;flex-direction:column;}
.cp-g2-sf-card{flex:1;min-height:0;display:flex;flex-direction:column;}
/* 卡头:编号徽标 + 阶段小字 + 段名;重点段换渐变 */
.cp-g2-sf-head{flex:none;position:relative;display:flex;align-items:center;gap:14px;min-height:78px;padding:12px 22px;border-radius:var(--campus-radius) var(--campus-radius) 0 0;background:var(--campus-accent-wash);border-bottom:1px solid var(--campus-card-edge);}
.cp-g2-sf-head-text{min-width:0;display:flex;flex-direction:column;gap:4px;}
.cp-g2-sf-kicker{font-size:18px;line-height:1.1;font-weight:700;letter-spacing:.12em;color:var(--campus-accent-soft);}
.cp-g2-sf-name{font-family:var(--theme-font-serif);font-weight:700;font-size:27px;line-height:1.2;letter-spacing:.04em;color:var(--theme-ink);}
.cp-g2-sf-seg.is-hero .cp-g2-sf-head{background:var(--campus-fill-deep);border-bottom-color:transparent;}
.cp-g2-sf-seg.is-hero .cp-g2-sf-kicker{color:var(--campus-on-accent-muted);}
.cp-g2-sf-seg.is-hero .cp-g2-sf-name{color:var(--theme-on-accent);}
.cp-g2-sf-seg.is-hero .cp-g2-sf-card::before{border:2px solid rgb(var(--theme-accent-rgb) / .45);box-shadow:0 20px 44px rgb(var(--theme-accent-rgb) / .2);}
.cp-g2-sf-pick{position:absolute;z-index:4;top:-16px;right:18px;}
/* 图:浅底相框,图片按原比例放在里面 */
.cp-g2-sf-media{flex:1;min-height:0;margin:16px 18px 0;padding:8px;border-radius:12px;background:var(--campus-paper);border:1px solid var(--campus-card-edge);}
.cp-g2-sf-media .media-slot{border-radius:8px!important;}
/* 要点 */
.cp-g2-sf-points{flex:none;display:flex;flex-direction:column;gap:8px;padding:16px 24px 20px;}
.cp-g2-sf-point{display:flex;align-items:baseline;gap:12px;}
.cp-g2-sf-point .campus-mark{transform:translateY(-3px) rotate(45deg);}
.cp-g2-sf-point-text{min-width:0;font-size:21px;line-height:1.5;color:var(--theme-ink);text-wrap:pretty;}
.cp-g2-sf-point:nth-child(2) .cp-g2-sf-point-text{color:var(--theme-muted);}
.cp-g2-sf.is-4 .cp-g2-sf-point-text{font-size:20px;line-height:1.45;}
.cp-g2-sf.is-4 .cp-g2-sf-name{font-size:24px;}
/* 段间箭头 */
.cp-g2-sf-link{flex:none;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.cp-g2-sf-link-line{position:absolute;left:50%;top:22%;bottom:22%;width:0;border-left:2px dashed var(--campus-accent-line);}
.cp-g2-sf-link .campus-link-dot{position:relative;z-index:1;box-shadow:0 0 0 8px var(--theme-bg),0 8px 18px rgb(var(--theme-accent-rgb) / .3);}
`;

export function StageFigures(props) {
  useStructureStyle();
  useDiagramStyle();
  useThemeStyle('campus-stage-figures-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const stages = safeArray(p.stages).slice(0, clamp(p.stageCount, 2, 4));
  const n = stages.length;
  const hero = p.layoutMode === 'emphasis';
  const linkW = n >= 4 ? 58 : 72;
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className={`cp-g2-sf is-${n}`}>
        {stages.map((s, i) => {
          const isHero = hero && i === n - 1;
          const grow = isHero ? (n >= 4 ? 1.45 : 1.6) : 1;
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <div className="cp-g2-sf-link campus-fade" style={{ width: linkW, ...enterDelay(2 + i) }} aria-hidden="true">
                  <div className="cp-g2-sf-link-line" />
                  <LinkDot size={46} />
                </div>
              ) : null}
              <section className={`cp-g2-sf-seg${isHero ? ' is-hero' : ''} campus-rise`} style={{ flex: `${grow} 1 0`, ...enterDelay(1 + i) }}>
                <div className="cp-g2-sf-card campus-card">
                  <div className="cp-g2-sf-head">
                    <NumBadge no={s?.no} size={46} tone={isHero ? 'ring' : 'fill'} spark={isHero} />
                    <div className="cp-g2-sf-head-text">
                      <div className="cp-g2-sf-kicker">{s?.kicker}</div>
                      <div className="cp-g2-sf-name">{s?.name}</div>
                    </div>
                  </div>
                  <div className="cp-g2-sf-media">
                    <MediaSlot id={`stage-figures-${i}`} fit="contain" radius={8} placeholder={s?.kicker ? `${s.kicker}图` : '阶段图'} />
                  </div>
                  <div className="cp-g2-sf-points">
                    {safeArray(s?.bullets).slice(0, 2).map((b, j) => (
                      <div className="cp-g2-sf-point" key={j}>
                        <div className={`campus-mark${j === 0 && isHero ? ' is-spark' : ''}`} aria-hidden="true" />
                        <p className="cp-g2-sf-point-text">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {isHero && p.finalTag ? <PickTag label={p.finalTag} className="cp-g2-sf-pick" /> : null}
              </section>
            </React.Fragment>
          );
        })}
      </div>
      {p.showConclusion && <ConclusionBar label={p.conclusionLabel} text={p.conclusion} className="campus-rise" style={enterDelay(9)} />}
    </CampusFrame>
  );
}

StageFigures.META = {
  id: 'stage-figures',
  label: '多段图组 · 阶段并排配箭头(可放大最后一段)',
  roles: ['image', 'trend', 'process'],
  defaults: DEFAULTS,
  copyBudgets: {
    title: 22,
    finalTag: 5,
    'stages[].no': 2,
    'stages[].kicker': 5,
    'stages[].name': 7,
    'stages[].bullets[]': 22,
    conclusionLabel: 4,
    conclusion: 44,
  },
  controls: [
    { ...CHAPTER_CONTROL, default: 3 },
    { key: 'stageCount', type: 'number', label: '段数', default: 3, min: 2, max: 4, countArrays: ['stages'], description: '并排的段数(每段一张图,images 按段的顺序对应);图按原比例显示在段内,不裁切。每段 bullets 写 1–2 条要点。' },
    { key: 'layoutMode', type: 'radio', label: '排法', default: 'emphasis', options: [{ value: 'equal', label: '等宽并排' }, { value: 'emphasis', label: '最后一段放大' }], description: '等宽并排;或把最后一段放大(最终形态 / 实物),卡头换成渐变并挂 finalTag 小旗。' },
    { key: 'showConclusion', type: 'toggle', label: '底部结论条', default: true, description: '页面底部的校色结论条。' },
  ],
};
