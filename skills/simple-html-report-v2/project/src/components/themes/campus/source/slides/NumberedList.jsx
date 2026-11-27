// 纵向编号清单:3–6 条通栏编号条目(左侧悬挂书签式编号 + 标题 + 说明),右侧可选一栏补充说明(如研究假设)。
// 适合研究问题、研究假设、主要任务、注意事项。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';
import { IndexCard } from '../kit/parts.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  itemCount: 4,
  showAside: true,
  asideCount: 3,
  sectionNo: '1.5',
  title: '研究问题与研究假设',
  items: [
    { no: 'RQ1', title: '数据如何进入内容生产', desc: '研究对象以哪些指标评估作品？评估结论如何反馈到选题、制作与复盘环节？' },
    { no: 'RQ2', title: '矩阵如何分工协同', desc: '各子账号承担什么职能？矩阵布局如何实现用户覆盖、风险分散与相互导流？' },
    { no: 'RQ3', title: '信任如何累积与转化', desc: '真诚沟通与长期输出如何累积观众信任？信任又如何为自有品牌提供背书？' },
    { no: 'RQ4', title: '机制能否被复制', desc: '这套机制中哪些部分依赖头部资源，哪些可以被中小创作者借鉴？' },
    { no: 'RQ5', title: '第五个研究问题', desc: '在这里写第五个研究问题的具体表述。' },
    { no: 'RQ6', title: '第六个研究问题', desc: '在这里写第六个研究问题的具体表述。' },
  ],
  asideLabel: '研究假设',
  asideItems: [
    { label: 'H1', text: '数据评估越深入生产流程，作品表现的稳定性越高。' },
    { label: 'H2', text: '矩阵化布局能显著降低单一账号的流量波动风险。' },
    { label: 'H3', text: '观众信任度与自有品牌的转化意愿正相关。' },
    { label: 'H4', text: '在这里写第四条研究假设。' },
  ],
  asideNote: '假设将在第三章结合案例资料逐一检验。',
};

const CSS = `
.cp-nl{flex:1;min-height:0;display:flex;gap:30px;}
.cp-nl-list{flex:1;min-width:0;display:grid;grid-auto-rows:minmax(0,1fr);row-gap:18px;padding-top:6px;}
.cp-nl-list .campus-ncard.is-side{padding-left:126px;}
.cp-nl-list .campus-ncard-strip{width:80px;}
.cp-nl-list .campus-ncard-strip .campus-ncard-no{font-size:27px;letter-spacing:.02em;}
.cp-nl-list .campus-ncard-title{font-size:30px;}
.cp-nl-list .campus-index-card-desc{font-size:22px;}
.cp-nl-list.is-5 .campus-ncard-title,.cp-nl-list.is-6 .campus-ncard-title{font-size:26px;}
.cp-nl-list.is-5 .campus-ncard.is-side,.cp-nl-list.is-6 .campus-ncard.is-side{padding-left:116px;}
.cp-nl-list.is-5 .campus-ncard-strip,.cp-nl-list.is-6 .campus-ncard-strip{width:72px;}
.cp-nl-list.is-5 .campus-ncard-strip .campus-ncard-no,.cp-nl-list.is-6 .campus-ncard-strip .campus-ncard-no{font-size:24px;}
.cp-nl-aside{flex:0 0 520px;display:flex;flex-direction:column;}
.campus[data-campus-nav="rail"] .cp-nl-aside{flex-basis:470px;}
.cp-nl-aside-body{flex:1;min-height:0;display:flex;flex-direction:column;padding:10px 28px 22px;}
.cp-nl-aside-items{flex:1;min-height:0;display:grid;grid-auto-rows:minmax(0,1fr);}
.cp-nl-aside-item{display:flex;align-items:center;gap:20px;border-bottom:1px dashed var(--campus-accent-line);}
.cp-nl-aside-item:last-child{border-bottom:0;}
.cp-nl-aside-item .campus-seal{min-width:60px;}
.cp-nl-aside-text{font-size:22px;line-height:1.6;color:var(--theme-ink);text-wrap:pretty;}
.cp-nl-aside-note{flex:none;display:flex;align-items:center;gap:12px;margin-top:8px;padding:14px 18px;font-size:19px;line-height:1.5;color:var(--theme-muted);}
`;

export function NumberedList(props) {
  useThemeStyle('campus-numbered-list-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const items = safeArray(p.items).slice(0, clamp(p.itemCount, 3, 6));
  const asideItems = safeArray(p.asideItems).slice(0, clamp(p.asideCount, 2, 4));
  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-nl">
        <div className={`cp-nl-list is-${items.length}`}>
          {items.map((item, i) => (
            <IndexCard className="campus-rise" style={enterDelay(1 + i)} key={i} no={item?.no} title={item?.title} desc={item?.desc} compact={items.length >= 5} />
          ))}
        </div>
        {p.showAside && (
          <aside className="cp-nl-aside campus-card campus-rise" style={enterDelay(3)}>
            <div className="campus-card-head">{p.asideLabel}</div>
            <div className="cp-nl-aside-body">
              <div className="cp-nl-aside-items">
                {asideItems.map((item, i) => (
                  <div className="cp-nl-aside-item" key={i}>
                    <div className="campus-seal is-soft">{item?.label}</div>
                    <p className="cp-nl-aside-text">{item?.text}</p>
                  </div>
                ))}
              </div>
              <div className="cp-nl-aside-note campus-wash"><div className="campus-mark is-spark" aria-hidden="true" /><p>{p.asideNote}</p></div>
            </div>
          </aside>
        )}
      </div>
    </CampusFrame>
  );
}

NumberedList.META = {
  id: 'numbered-list',
  label: '编号清单 · 通栏条目配补充栏',
  roles: ['breakdown', 'statement', 'context'],
  defaults: DEFAULTS,
  copyBudgets: { 'items[].title': 14, 'items[].desc': 44, 'asideItems[].text': 30, asideNote: 24 },
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'itemCount', type: 'number', label: '条目数量', default: 4, min: 3, max: 6, description: '左侧编号条目的数量。' },
    { key: 'showAside', type: 'toggle', label: '右侧补充栏', default: true, description: '右侧的补充说明栏(如研究假设)。' },
    { key: 'asideCount', type: 'number', label: '补充栏条数', default: 3, min: 2, max: 4, description: '右侧补充栏的条目数。' },
  ],
};
