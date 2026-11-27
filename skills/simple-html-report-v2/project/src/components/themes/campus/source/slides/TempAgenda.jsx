// 目录:没有选学校(brand.school)时是通用目录;选了已实现定制设计的学校时,整页改由学校组件绘制
// (source/schools/dispatch.jsx)。条目数决定学校目录用哪一版(2–6 项)。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { safeArray, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, CampusBrand, CampusPageNumber, useCampusBrand } from '../kit/chrome.jsx';
import { renderSchoolToc, schoolRootAttrs } from '../schools/dispatch.jsx';

const DEFAULTS = {
  itemCount: 4,
  title: '汇报结构',
  subtitle: 'BRIEFING MAP',
  // 目录引言:只用于部分学校定制目录,留空不显示
  lead: '',
  // 条目:no 编号、title 标题、note 英文小标、desc 一句说明(desc 通用目录写了才显示)
  items: [
    { no: '01', title: '现状扫描', note: 'SITUATION', desc: '' },
    { no: '02', title: '关键进展', note: 'PROGRESS', desc: '' },
    { no: '03', title: '风险判断', note: 'RISK', desc: '' },
    { no: '04', title: '行动计划', note: 'ACTION', desc: '' },
    { no: '05', title: '补充证据', note: 'EVIDENCE', desc: '' },
    { no: '06', title: '结语', note: 'CLOSING', desc: '' },
  ],
};

const CSS = `
.cp-agenda{position:absolute;inset:0;display:flex;}
.cp-agenda-side{position:relative;flex:0 0 640px;display:flex;flex-direction:column;padding:28px 72px 40px var(--campus-pad-x);background:var(--campus-fill-deep);color:var(--theme-on-accent);overflow:hidden;}
.cp-agenda-orb{position:absolute;border-radius:50%;border:2px solid rgb(255 255 255 / .1);pointer-events:none;}
.cp-agenda-top{height:72px;display:flex;align-items:center;}
.cp-agenda-head{flex:1;display:flex;flex-direction:column;justify-content:center;}
.cp-agenda-title{font-family:var(--theme-font-serif);font-weight:700;font-size:150px;line-height:1.05;letter-spacing:.12em;}
.cp-agenda-sub{margin-top:22px;font-size:26px;font-weight:600;letter-spacing:.5em;color:var(--campus-on-accent-muted);}
.cp-agenda-rule{width:96px;height:6px;margin-top:40px;border-radius:3px;background:var(--campus-spark);}
.cp-agenda-list{flex:1;min-width:0;display:grid;grid-template-columns:1fr 1fr;align-content:center;gap:0 72px;padding:0 var(--campus-pad-x) 0 96px;}
.cp-agenda-item{display:flex;align-items:center;gap:30px;padding:32px 0;border-bottom:1px dashed var(--campus-accent-line);}
.cp-agenda-no{flex:none;display:grid;place-items:center;width:104px;height:104px;border-radius:30px;background:var(--campus-fill);color:var(--theme-on-accent);box-shadow:var(--campus-shadow-lift);font-size:52px;}
.cp-agenda-item-title{font-family:var(--theme-font-serif);font-weight:700;font-size:40px;line-height:1.2;letter-spacing:.06em;}
.cp-agenda-item-note{margin-top:8px;font-size:16px;font-weight:600;letter-spacing:.24em;color:var(--theme-faint);}
.cp-agenda-item-desc{margin-top:8px;font-size:19px;line-height:1.5;color:var(--theme-muted);}
.cp-agenda-foot{height:30px;display:flex;align-items:center;}
`;

export function TempAgenda(props) {
  useThemeStyle('campus-temp-agenda-style', CSS);
  const brand = useCampusBrand();
  const p = { ...DEFAULTS, ...props };
  const school = renderSchoolToc(brand, p, safeArray(p.items));
  if (school) return school;
  const items = safeArray(p.items).slice(0, clamp(p.itemCount, 2, 6));
  return (
    <CampusFrame layout="bleed">
      <div className="cp-agenda">
        <section className="cp-agenda-side">
          <div className="cp-agenda-orb" aria-hidden="true" style={{ right: -180, bottom: -160, width: 560, height: 560 }} />
          <div className="cp-agenda-orb" aria-hidden="true" style={{ right: -60, bottom: -40, width: 320, height: 320 }} />
          <div className="cp-agenda-top campus-fade" style={enterDelay(0)}><CampusBrand tone="inverse" /></div>
          <div className="cp-agenda-head">
            <h2 className="cp-agenda-title campus-rise" style={enterDelay(1)}>{p.title}</h2>
            <div className="cp-agenda-sub campus-rise" style={enterDelay(2)}>{p.subtitle}</div>
            <div className="cp-agenda-rule campus-draw" style={enterDelay(3)} />
          </div>
          <div className="cp-agenda-foot"><CampusPageNumber tone="inverse" /></div>
        </section>
        <div className="cp-agenda-list">
          {items.map((item, i) => (
            <div className="cp-agenda-item campus-rise" style={enterDelay(2 + i)} key={i}>
              <div className="cp-agenda-no campus-num">{item?.no}</div>
              <div>
                <div className="cp-agenda-item-title">{item?.title}</div>
                <div className="cp-agenda-item-note">{item?.note}</div>
                {String(item?.desc ?? '').trim() ? <div className="cp-agenda-item-desc">{item.desc}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CampusFrame>
  );
}

// 学校定制目录的导出标记(data-campus-native-*)写在页面根节点上,由 withCampusBase 调用
TempAgenda.campusRootAttrs = (props, brand) => schoolRootAttrs('toc', { ...DEFAULTS, ...props }, brand);

TempAgenda.META = {
  id: 'temp-agenda',
  label: '目录(临时)',
  roles: ['breakdown'],
  defaults: DEFAULTS,
  copyBudgets: { lead: 40, 'items[].desc': 20 },
  controls: [
    { key: 'itemCount', type: 'number', label: '条目数量', default: 4, min: 2, max: 6, description: '目录显示的条目数量。' },
  ],
};

