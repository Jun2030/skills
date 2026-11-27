// 封面:没有选学校(brand.school)时是通用封面;选了已实现定制设计的学校时,整页改由学校组件绘制
// (source/schools/dispatch.jsx),props 是一套「够各校映射」的通用封面字段。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { CampusFrame, CampusBrand, useCampusBrand } from '../kit/chrome.jsx';
import { renderSchoolCover, schoolRootAttrs } from '../schools/dispatch.jsx';
import { charCount } from '../schools/kit.jsx';
import { TEMP_COVER_DEFAULTS, schoolCoverProps } from './temp-cover-defaults.mjs';

const DEFAULTS = TEMP_COVER_DEFAULTS;

const CSS = `
.cp-cover{position:absolute;inset:0;display:flex;}
.cp-cover-main{flex:1;min-width:0;display:flex;flex-direction:column;padding:28px 96px 0 var(--campus-pad-x);}
.cp-cover-top{height:72px;display:flex;align-items:center;}
.cp-cover-body{position:relative;flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 0 60px 52px;margin:110px 0 150px;}
.cp-cover-bar{position:absolute;left:0;top:0;bottom:0;width:9px;border-radius:5px;background:var(--campus-fill-bar);}
.cp-cover-kicker{align-self:flex-start;}
.cp-cover-title{margin-top:34px;font-family:var(--theme-font-serif);font-weight:700;font-size:112px;line-height:1.16;letter-spacing:.06em;color:var(--theme-accent);text-wrap:balance;}
.cp-cover-sub{margin-top:28px;font-size:36px;line-height:1.5;color:var(--theme-ink);letter-spacing:.08em;}
.cp-cover-side{position:relative;flex:0 0 520px;display:flex;flex-direction:column;justify-content:flex-end;padding:0 72px 96px;background:var(--campus-fill-deep);color:var(--theme-on-accent);overflow:hidden;}
.cp-cover-orb{position:absolute;border-radius:50%;border:2px solid rgb(255 255 255 / .12);pointer-events:none;}
.cp-cover-spark{position:relative;width:72px;height:6px;margin-bottom:34px;border-radius:3px;background:var(--campus-spark);}
.cp-cover-meta-item{position:relative;padding:26px 0;border-top:1px solid var(--campus-on-accent-line);}
.cp-cover-meta-item:last-child{border-bottom:1px solid var(--campus-on-accent-line);}
.cp-cover-meta-label{font-size:19px;font-weight:600;letter-spacing:.24em;color:var(--campus-on-accent-muted);}
.cp-cover-meta-value{margin-top:10px;font-family:var(--theme-font-serif);font-size:36px;font-weight:700;letter-spacing:.08em;}
`;

/**
 * 通用封面主标题字号:18 字以内保持 112px(原样);更长的题目按视觉字数逐级缩小,保证 40 字在标题区内折成 3–4 行不溢出
 * (标题区宽约 1170px,字距 .06em;112px 每行约 9 字、96px 约 11 字、84px 约 12.5 字、72px 约 14.5 字)。
 * 18 字以内不写内联样式,渲染产物与放宽预算之前一致。
 */
function coverTitleSize(title) {
  const n = charCount(String(title ?? '').replace(/\n/g, ''));
  if (n <= 18) return null;
  const size = n <= 24 ? 96 : n <= 32 ? 84 : 72;
  return { fontSize: size, lineHeight: 1.18 };
}

export function TempCover(props) {
  useThemeStyle('campus-temp-cover-style', CSS);
  const brand = useCampusBrand();
  const p = { ...DEFAULTS, ...props };
  const school = renderSchoolCover(brand, schoolCoverProps(p));
  if (school) return school;
  // goal 写了真实题目却没写副标题时,不把「副标题：一句话说明…」这句占位说明留在封面上
  const subtitle = p.subtitle === DEFAULTS.subtitle && p.title !== DEFAULTS.title ? '' : String(p.subtitle ?? '').trim();
  const extraMeta = [
    { key: 'advisor', label: p.advisorLabel, value: p.advisor },
    { key: 'unit', label: p.unitLabel, value: p.unit },
  ].filter(item => String(item.value ?? '').trim());
  return (
    <CampusFrame layout="bleed">
      <div className="cp-cover">
        <div className="cp-cover-main">
          <div className="cp-cover-top campus-fade" style={enterDelay(0)}><CampusBrand /></div>
          <div className="cp-cover-body">
            <div className="cp-cover-bar" aria-hidden="true" />
            <div className="cp-cover-kicker campus-chip campus-rise" style={enterDelay(1)}>{p.kicker}</div>
            <h1 className="cp-cover-title campus-rise" style={{ ...enterDelay(2), ...coverTitleSize(p.title) }}>{p.title}</h1>
            {subtitle && <p className="cp-cover-sub campus-rise" style={enterDelay(3)}>{subtitle}</p>}
          </div>
        </div>
        <aside className="cp-cover-side campus-fade" style={enterDelay(1)}>
          <div className="cp-cover-orb" aria-hidden="true" style={{ right: -160, top: -120, width: 520, height: 520 }} />
          <div className="cp-cover-orb" aria-hidden="true" style={{ right: -40, top: 20, width: 300, height: 300 }} />
          <div className="cp-cover-spark" aria-hidden="true" />
          <div className="cp-cover-meta-item campus-rise" style={enterDelay(4)}>
            <div className="cp-cover-meta-label">{p.presenterLabel}</div>
            <div className="cp-cover-meta-value">{p.presenter}</div>
          </div>
          {extraMeta.map((item, i) => (
            <div className="cp-cover-meta-item campus-rise" style={enterDelay(5 + i)} key={item.key}>
              <div className="cp-cover-meta-label">{item.label}</div>
              <div className="cp-cover-meta-value">{item.value}</div>
            </div>
          ))}
          <div className="cp-cover-meta-item campus-rise" style={enterDelay(5 + extraMeta.length)}>
            <div className="cp-cover-meta-label">{p.dateLabel}</div>
            <div className="cp-cover-meta-value">{p.date}</div>
          </div>
        </aside>
      </div>
    </CampusFrame>
  );
}

// 学校定制封面的导出标记(data-campus-native-*)写在页面根节点上,由 withCampusBase 调用
TempCover.campusRootAttrs = (props, brand) => schoolRootAttrs('cover', schoolCoverProps({ ...DEFAULTS, ...props }), brand);

TempCover.META = {
  id: 'temp-cover',
  label: '封面(临时)',
  roles: ['cover'],
  defaults: DEFAULTS,
  // title:真实论文题目常见 20–35 字,预算 40 字(通用封面按字数自动缩字号、折成 2–4 行;学校封面按长度自动选长标题版 / 关键词版)
  copyBudgets: { title: 40, keyword: 8, titleEn: 60, advisor: 16, unit: 24, motto: 24 },
  controls: [
    {
      key: 'coverVariant', type: 'select', label: '学校封面版式', default: 'auto',
      description: '选了学校时生效:自动按标题长度选原版 / 长标题版 / 关键词大字版,也可以手动指定(这所学校没有的版式按自动处理)。',
      options: [
        { value: 'auto', label: '自动' },
        { value: 'default', label: '原版' },
        { value: 'long_title', label: '长标题版' },
        { value: 'keyword', label: '关键词大字版' },
      ],
    },
  ],
};
