// 临时结语页:只为让一份 deck 有完整的结尾,不是正式设计;正式结语页接入后删除本页。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { CampusFrame, CampusBrand } from '../kit/chrome.jsx';

const DEFAULTS = {
  kicker: 'THANK YOU',
  title: '谢谢聆听',
  subtitle: '下一步，我们继续向前',
  contact: '汇报人 · 项目组',
};

const CSS = `
.cp-closing{position:absolute;inset:0;display:flex;flex-direction:column;padding:28px var(--campus-pad-x) 0;background:var(--campus-fill-deep);color:var(--theme-on-accent);overflow:hidden;}
.cp-closing-orb{position:absolute;border-radius:50%;border:2px solid rgb(255 255 255 / .1);pointer-events:none;}
.cp-closing-top{height:72px;display:flex;align-items:center;}
.cp-closing-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-bottom:40px;}
.cp-closing-kicker{font-size:24px;font-weight:600;letter-spacing:.5em;color:var(--campus-on-accent-muted);}
.cp-closing-title{margin-top:30px;font-family:var(--theme-font-serif);font-weight:700;font-size:156px;line-height:1.1;letter-spacing:.16em;}
.cp-closing-rule{width:110px;height:6px;margin:44px 0 38px;border-radius:3px;background:var(--campus-spark);}
.cp-closing-sub{font-size:36px;letter-spacing:.14em;}
.cp-closing-contact{margin-top:26px;font-size:24px;letter-spacing:.18em;color:var(--campus-on-accent-muted);}
.cp-closing-frame{position:absolute;inset:132px 80px 60px;border:1px solid var(--campus-on-accent-line);border-radius:var(--campus-radius-lg);pointer-events:none;}
.cp-closing-frame::before{content:'';position:absolute;inset:10px;border:1px solid var(--campus-on-accent-line);border-radius:16px;}
`;

// 结语大字按字数缩小:6 个字以内用设计字号,更长时缩到一行排得下,不让最后一个字单独掉到第二行
function closingTitleSize(title) {
  const count = Array.from(String(title ?? '').trim()).length;
  if (count <= 6) return {};
  return { fontSize: `${Math.min(156, Math.max(84, Math.floor(1120 / count)))}px` };
}

export function TempClosing(props) {
  useThemeStyle('campus-temp-closing-style', CSS);
  const p = { ...DEFAULTS, ...props };
  return (
    <CampusFrame layout="bleed">
      <div className="cp-closing">
        <div className="cp-closing-orb" aria-hidden="true" style={{ left: -220, bottom: -260, width: 700, height: 700 }} />
        <div className="cp-closing-orb" aria-hidden="true" style={{ right: -160, top: -200, width: 560, height: 560 }} />
        <div className="cp-closing-top campus-fade" style={enterDelay(0)}><CampusBrand tone="inverse" /></div>
        <div className="cp-closing-main">
          <div className="cp-closing-kicker campus-rise" style={enterDelay(1)}>{p.kicker}</div>
          <h2 className="cp-closing-title campus-rise" style={{ ...enterDelay(2), ...closingTitleSize(p.title) }}>{p.title}</h2>
          <div className="cp-closing-rule campus-draw" style={enterDelay(3)} />
          <p className="cp-closing-sub campus-rise" style={enterDelay(3)}>{p.subtitle}</p>
          <div className="cp-closing-contact campus-rise" style={enterDelay(4)}>{p.contact}</div>
        </div>
        <div className="cp-closing-frame campus-fade" style={enterDelay(2)} />
      </div>
    </CampusFrame>
  );
}

TempClosing.META = {
  id: 'temp-closing',
  label: '结语(临时)',
  roles: ['closing'],
  defaults: DEFAULTS,
};

