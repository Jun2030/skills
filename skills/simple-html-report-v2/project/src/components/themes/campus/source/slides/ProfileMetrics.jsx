// 个人简介 + 成绩:左侧人像、姓名与基本信息,右侧一排关键数字、一张趋势折线图和一张课程成绩表。
// 适合奖学金 / 保研 / 评优答辩的「学业成绩」「个人简介」页。
import React from 'react';
import { useThemeStyle, enterDelay } from '../../../shared/style.jsx';
import { MediaSlot } from '../../../shared/MediaSlot.jsx';
import { safeArray, safeNumber, safeMax, safeMin, safeRatio, clamp } from '../../../chart-safety.mjs';
import { CampusFrame, TitleRow, CHAPTER_CONTROL } from '../kit/chrome.jsx';

const DEFAULTS = {
  chapterIndex: 1,
  infoCount: 4,
  statCount: 4,
  pointCount: 6,
  showCourses: true,
  courseCount: 6,
  images: [],
  sectionNo: '01',
  title: '学业成绩',
  name: '示例同学',
  info: [
    { label: '学院', text: '新闻与传播学院' },
    { label: '专业', text: '网络与新媒体' },
    { label: '年级', text: '2022 级本科' },
    { label: '政治面貌', text: '中共预备党员' },
    { label: '学生职务', text: '班长' },
  ],
  statsLabel: '学业表现',
  stats: [
    { value: '1', unit: '/186', label: '专业排名' },
    { value: '3.92', unit: '/4.0', label: '平均学分绩点' },
    { value: '92.6', unit: '分', label: '加权平均分' },
    { value: '612', unit: '分', label: '大学英语六级' },
  ],
  trendLabel: '成绩趋势',
  trendNote: '各学期平均学分绩点',
  trend: [
    { label: '大一上', value: 3.62 },
    { label: '大一下', value: 3.71 },
    { label: '大二上', value: 3.78 },
    { label: '大二下', value: 3.86 },
    { label: '大三上', value: 3.93 },
    { label: '大三下', value: 3.97 },
  ],
  courseHead: '课程名称',
  scoreHead: '成绩',
  courses: [
    { name: '传播学概论', score: '98' },
    { name: '数据新闻与可视化', score: '97' },
    { name: '新媒体研究方法', score: '96' },
    { name: '统计学原理', score: '96' },
    { name: '网络传播学', score: '95' },
    { name: '媒介经营与管理', score: '94' },
  ],
};

const CSS = `
.cp-pm{flex:1;min-height:0;display:flex;gap:30px;}
.cp-pm-person{flex:0 0 360px;display:flex;flex-direction:column;}
.cp-pm-card{flex:1;min-height:0;display:flex;flex-direction:column;}
.cp-pm-photo{flex:1;min-height:0;padding:12px 12px 0;}
.cp-pm-photo .media-slot{border-radius:10px 10px 0 0!important;}
.cp-pm-name{position:relative;flex:none;display:flex;align-items:center;justify-content:center;height:72px;margin:0 12px 12px;background:var(--campus-fill-deep);color:var(--theme-on-accent);font-family:var(--theme-font-serif);font-weight:700;font-size:34px;letter-spacing:.24em;border-radius:0 0 10px 10px;}
.cp-pm-name-spark{position:absolute;left:50%;top:-5px;width:44px;height:10px;margin-left:-22px;border-radius:5px;background:var(--campus-spark);}
.cp-pm-info{flex:none;margin-top:16px;}
.cp-pm-info-row{display:flex;align-items:baseline;gap:16px;padding:9px 4px;border-bottom:1px dashed var(--campus-accent-line);}
.cp-pm-info-label{flex:none;width:96px;font-size:19px;color:var(--theme-faint);}
.cp-pm-info-value{flex:1;min-width:0;font-size:21px;font-weight:700;color:var(--theme-ink);}
.cp-pm-right{flex:1;min-width:0;display:flex;flex-direction:column;gap:24px;}
.cp-pm-stats{flex:none;display:flex;align-items:stretch;min-height:150px;}
.cp-pm-stats-label{flex:none;width:124px;display:flex;align-items:center;justify-content:center;padding:0 26px;background:var(--campus-fill-deep);color:var(--theme-on-accent);border-radius:var(--campus-radius) 0 0 var(--campus-radius);font-family:var(--theme-font-serif);font-weight:700;font-size:28px;line-height:1.3;letter-spacing:.08em;text-align:center;}
.cp-pm-stat{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:0 12px;}
.cp-pm-stat + .cp-pm-stat::before{content:'';position:absolute;left:0;top:34px;bottom:34px;width:1px;background:var(--campus-accent-line);}
.cp-pm-stat-num{display:flex;align-items:baseline;gap:4px;}
.cp-pm-stat-value{font-size:62px;}
.cp-pm-stat-unit{font-family:var(--theme-font-serif);font-weight:700;font-size:24px;color:var(--campus-accent-soft);}
.cp-pm-stat-label{display:flex;align-items:center;gap:8px;font-size:20px;color:var(--theme-muted);letter-spacing:.04em;}
.cp-pm-lower{flex:1;min-height:0;display:flex;gap:24px;}
.cp-pm-chart{flex:1;min-width:0;display:flex;flex-direction:column;padding:22px 26px 16px;}
.cp-pm-chart-note{flex:none;order:2;font-size:18px;color:var(--theme-faint);}
.cp-pm-chart .campus-label-row::after{order:1;}
.cp-pm-plot{position:relative;flex:1;min-height:0;margin:46px 10px 48px;}
.cp-pm-plot svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.cp-pm-grid line{stroke:var(--theme-line);stroke-width:1;vector-effect:non-scaling-stroke;}
.cp-pm-area{fill:rgb(var(--theme-accent-rgb) / .1);}
.cp-pm-line{fill:none;stroke:var(--theme-accent);stroke-width:5;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;}
.cp-pm-dot{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:var(--theme-surface);border:4px solid var(--theme-accent);}
.cp-pm-dot.is-last{width:28px;height:28px;margin:-14px 0 0 -14px;background:var(--campus-fill);border:4px solid var(--theme-surface);box-shadow:0 0 0 8px rgb(var(--theme-accent-rgb) / .16),0 6px 14px rgb(var(--theme-accent-rgb) / .35);}
.cp-pm-val{position:absolute;transform:translate(-50%,-100%);margin-top:-18px;font-family:var(--theme-font-serif);font-weight:700;font-size:22px;color:var(--theme-ink);white-space:nowrap;font-variant-numeric:lining-nums;}
.cp-pm-val.is-last{display:flex;align-items:center;height:34px;margin-top:-22px;padding:0 12px;border-radius:999px;background:var(--campus-fill);color:var(--theme-on-accent);font-size:24px;box-shadow:0 6px 14px rgb(var(--theme-accent-rgb) / .3);}
.cp-pm-xlabel{position:absolute;bottom:-40px;transform:translateX(-50%);font-size:18px;color:var(--theme-muted);white-space:nowrap;}
.cp-pm-courses{flex:0 0 430px;display:flex;flex-direction:column;}
.campus[data-campus-nav="rail"] .cp-pm-courses{flex-basis:380px;}
.cp-pm-course-head{display:flex;align-items:center;justify-content:space-between;}
.cp-pm-course-body{flex:1;min-height:0;display:flex;flex-direction:column;padding:6px 0;}
.cp-pm-course{flex:1 1 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:6px 22px;border-top:1px dashed var(--theme-line);}
.cp-pm-course:first-child{border-top:0;}
.cp-pm-course-name{display:flex;align-items:center;gap:12px;font-size:21px;color:var(--theme-ink);}
.cp-pm-course-score{font-size:28px;}
`;

export function ProfileMetrics(props) {
  useThemeStyle('campus-profile-metrics-style', CSS);
  const p = { ...DEFAULTS, ...props };
  const info = safeArray(p.info).slice(0, clamp(p.infoCount, 2, 5));
  const stats = safeArray(p.stats).slice(0, clamp(p.statCount, 2, 4));
  const trend = safeArray(p.trend).slice(0, clamp(p.pointCount, 2, 6));
  const courses = p.showCourses ? safeArray(p.courses).slice(0, clamp(p.courseCount, 3, 6)) : [];

  const values = trend.map(point => safeNumber(point?.value, 0));
  const hi = safeMax(values, 1);
  const lo = safeMin(values, 0);
  const span = hi - lo;
  const yMin = lo - (span > 0 ? span * 0.45 : 1);
  const yMax = hi + (span > 0 ? span * 0.15 : 1);
  const last = trend.length - 1;
  const points = values.map((value, i) => ({
    x: clamp(4 + safeRatio(i, last, 0.5) * 92, 0, 100),
    y: clamp(100 - safeRatio(value - yMin, yMax - yMin, 0.5) * 100, 0, 100),
  }));
  const line = points.map(pt => `${pt.x},${pt.y}`).join(' ');
  const area = points.length ? `${points[0].x},100 ${line} ${points[points.length - 1].x},100` : '';

  return (
    <CampusFrame chapterIndex={p.chapterIndex}>
      <TitleRow no={p.sectionNo} title={p.title} className="campus-rise" style={enterDelay(0)} />
      <div className="cp-pm">
        <section className="cp-pm-person campus-rise" style={enterDelay(1)}>
          <div className="cp-pm-card campus-card">
            <div className="cp-pm-photo">
              <MediaSlot id="profile-metrics-portrait" fit="cover" radius={10} placeholder="个人照片" />
            </div>
            <div className="cp-pm-name"><div className="cp-pm-name-spark" aria-hidden="true" /><div>{p.name}</div></div>
          </div>
          <div className="cp-pm-info">
            {info.map((item, i) => (
              <div className="cp-pm-info-row" key={i}>
                <div className="cp-pm-info-label">{item?.label}</div>
                <div className="cp-pm-info-value">{item?.text}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="cp-pm-right">
          <div className="cp-pm-stats campus-card campus-rise" style={enterDelay(2)}>
            <div className="cp-pm-stats-label">{p.statsLabel}</div>
            {stats.map((stat, i) => (
              <div className="cp-pm-stat" key={i}>
                <div className="cp-pm-stat-num">
                  <div className="cp-pm-stat-value campus-num">{stat?.value}</div>
                  <div className="cp-pm-stat-unit">{stat?.unit}</div>
                </div>
                <div className="cp-pm-stat-label">{stat?.label}</div>
              </div>
            ))}
          </div>
          <div className="cp-pm-lower">
            <div className="cp-pm-chart campus-card campus-rise" style={enterDelay(3)}>
              <div className="campus-label-row">
                <div className="campus-chip">{p.trendLabel}</div>
                <div className="cp-pm-chart-note">{p.trendNote}</div>
              </div>
              <div className="cp-pm-plot">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <g className="cp-pm-grid">
                    <line x1="0" x2="100" y1="0" y2="0" />
                    <line x1="0" x2="100" y1="33.33" y2="33.33" />
                    <line x1="0" x2="100" y1="66.67" y2="66.67" />
                    <line x1="0" x2="100" y1="100" y2="100" />
                  </g>
                  {area && <polygon className="cp-pm-area campus-fade" style={enterDelay(5)} points={area} />}
                  {line && <polyline className="cp-pm-line campus-draw" style={enterDelay(4)} points={line} />}
                </svg>
                {points.map((pt, i) => (
                  <React.Fragment key={i}>
                    <div className={`cp-pm-dot${i === last ? ' is-last' : ''}`} style={{ left: `${pt.x}%`, top: `${pt.y}%` }} />
                    <div className={`cp-pm-val${i === last ? ' is-last' : ''}`} style={{ left: `${pt.x}%`, top: `${pt.y}%` }}>{trend[i]?.value}</div>
                    <div className="cp-pm-xlabel" style={{ left: `${pt.x}%` }}>{trend[i]?.label}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            {courses.length > 0 && (
              <div className="cp-pm-courses campus-card campus-rise" style={enterDelay(4)}>
                <div className="campus-card-head cp-pm-course-head">
                  <div>{p.courseHead}</div>
                  <div>{p.scoreHead}</div>
                </div>
                <div className="cp-pm-course-body">
                  {courses.map((course, i) => (
                    <div className="cp-pm-course" key={i}>
                      <div className="cp-pm-course-name"><div className="campus-mark" aria-hidden="true" /><div>{course?.name}</div></div>
                      <div className="cp-pm-course-score campus-num">{course?.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </CampusFrame>
  );
}

ProfileMetrics.META = {
  id: 'profile-metrics',
  label: '个人简介 · 人像配关键数字与成绩趋势',
  roles: ['case', 'metrics', 'trend'],
  defaults: DEFAULTS,
  controls: [
    { ...CHAPTER_CONTROL },
    { key: 'infoCount', type: 'number', label: '基本信息条数', default: 4, min: 2, max: 5, description: '姓名下方的基本信息条数。' },
    { key: 'statCount', type: 'number', label: '关键数字数量', default: 4, min: 2, max: 4, description: '右上方一排关键数字的数量。' },
    { key: 'pointCount', type: 'number', label: '趋势图数据点', default: 6, min: 2, max: 6, description: '趋势折线图的数据点数量。' },
    { key: 'showCourses', type: 'toggle', label: '课程成绩表', default: true, description: '右下方的课程成绩表。' },
    { key: 'courseCount', type: 'number', label: '课程行数', default: 6, min: 3, max: 6, description: '课程成绩表的行数。' },
  ],
  numberBounds: { 'trend[].value': { min: 0, max: 1000000000, semantics: 'magnitude' } },
};
