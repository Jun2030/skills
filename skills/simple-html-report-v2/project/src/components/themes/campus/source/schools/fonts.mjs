// 学校定制页随稿打包的展示字体(woff2,由 scripts/campus-schools/extract-assets.py --fonts 从设计交付包的 字体/ 生成)。
// family 与设计模板里的字体名一致(导出侧和文档按这个名字对应);中文字体是 GB2312 常用字子集。
// 页面经 kit.jsx 的 useSchoolFonts([...family]) 按需注入 @font-face,只在用到的学校页面生效。
// 新增字体:在提取脚本的 FONT_PLAN 加一行、重跑 --fonts,再在下面登记(多个模板字体名可以指向同一个文件)。
export const SCHOOL_FONT_DIR = 'assets/schools/_fonts';

export const SCHOOL_FONTS = Object.freeze({
  'Ma Shan Zheng': { file: 'MaShanZheng-Regular.woff2', weight: 400 },
  'Alimama DongFangDaKai': { file: 'AlimamaDongFangDaKai-Regular.woff2', weight: 400 },
  'Alimama ShuHeiTi': { file: 'Alimama-ShuHeiTi-Bold.woff2', weight: 700 },
  'Source Han Serif CN Heavy': { file: 'SourceHanSerifCN-Heavy.woff2', weight: 900 },
  'Source Han Serif SC Heavy': { file: 'SourceHanSerifCN-Heavy.woff2', weight: 900 },
  '思源宋体 CN Heavy': { file: 'SourceHanSerifCN-Heavy.woff2', weight: 900 },
  'Source Han Serif CN SemiBold': { file: 'SourceHanSerifCN-SemiBold.woff2', weight: 600 },
  'Source Han Serif CN Medium': { file: 'SourceHanSerifCN-Medium.woff2', weight: 500 },
  'Source Han Serif CN': { file: 'SourceHanSerifCN-Regular.woff2', weight: 400 },
  'Source Han Serif CN Light': { file: 'SourceHanSerifCN-Light.woff2', weight: 300 },
  '寒蝉锦书宋 Heavy': { file: 'ChillJinshuSong-Heavy.woff2', weight: 900 },
  '寒蝉锦书宋 Bold': { file: 'ChillJinshuSong-Bold.woff2', weight: 700 },
  '寒蝉锦书宋 Medium': { file: 'ChillJinshuSong-Medium.woff2', weight: 500 },
  'LXGW WenKai': { file: 'LXGWWenKai-Regular.woff2', weight: 400 },
  '思源黑体 CN Heavy': { file: 'SourceHanSansCN-Heavy.woff2', weight: 900 },
  'Source Han Sans CN Heavy': { file: 'SourceHanSansCN-Heavy.woff2', weight: 900 },
  Cinzel: { file: 'Cinzel-Regular.woff2', weight: 400, bold: 'Cinzel-Bold.woff2' },
  'Playfair Display Black': { file: 'PlayfairDisplay-Black.woff2', weight: 900 },
  'D-DIN': { file: 'D-DIN.woff2', weight: 400 },
  'Cutive Mono': { file: 'CutiveMono-Regular.woff2', weight: 400 },
});

/**
 * 页面上没有打包的模板字体(正文 / 小字)用现有字体栈里的系统字体代替。
 * 写 CSS 时用 schoolFontStack('Source Han Serif CN Heavy') 得到「打包字体 + 同类回退」的完整 font-family。
 */
export const SCHOOL_FONT_FALLBACK = Object.freeze({
  serif: "'Source Han Serif SC','Noto Serif SC','Songti SC','STSong','SimSun',serif",
  sans: "'Source Han Sans SC','Noto Sans SC','PingFang SC','Microsoft YaHei',system-ui,sans-serif",
  latinSerif: "'Times New Roman','Newsreader',serif",
});

const SERIF_HINT = /serif|宋|Song|Ma Shan|DaKai|WenKai|楷|Cinzel|Playfair/i;

/** 模板字体名 → CSS font-family(打包了就把它放在最前面,再接同类系统字体)。 */
export function schoolFontStack(family, kind) {
  const fallback = SCHOOL_FONT_FALLBACK[kind || (SERIF_HINT.test(family) ? 'serif' : 'sans')];
  return SCHOOL_FONTS[family] ? `'${family}',${fallback}` : fallback;
}

/** 一组模板字体名 → @font-face CSS(只含已打包的)。 */
export function schoolFontFaceCss(families) {
  return [...new Set(families)].filter(family => SCHOOL_FONTS[family]).map(family => {
    const font = SCHOOL_FONTS[family];
    const faces = [`@font-face{font-family:'${family}';src:url('${SCHOOL_FONT_DIR}/${font.file}') format('woff2');font-weight:${font.bold ? 400 : '100 900'};font-style:normal;font-display:block;}`];
    if (font.bold) faces.push(`@font-face{font-family:'${family}';src:url('${SCHOOL_FONT_DIR}/${font.bold}') format('woff2');font-weight:700;font-style:normal;font-display:block;}`);
    return faces.join('');
  }).join('\n');
}
