// campus 主题的唯一登记入口:主题信息 + 页面清单都在这里声明,
// metadata.js / generated-metadata.js / layout-manifest.json 均由它生成,不要手改生成物。
import { definePages } from '../runtime-helpers.jsx';
import { withCampusBase } from './source/kit/base.jsx';
import { CAMPUS_DECK_STYLES } from './source/kit/deck-styles.mjs';
import { TempCover } from './source/slides/TempCover.jsx';
import { TempAgenda } from './source/slides/TempAgenda.jsx';
import { ChapterOpener } from './source/slides/ChapterOpener.jsx';
import { LeadQuotesSubject } from './source/slides/LeadQuotesSubject.jsx';
import { ParallelColumns } from './source/slides/ParallelColumns.jsx';
import { MethodRoadmap } from './source/slides/MethodRoadmap.jsx';
import { PairedRows } from './source/slides/PairedRows.jsx';
import { DataTable } from './source/slides/DataTable.jsx';
import { ProfileMetrics } from './source/slides/ProfileMetrics.jsx';
import { HonorWall } from './source/slides/HonorWall.jsx';
import { TimelineMilestones } from './source/slides/TimelineMilestones.jsx';
import { GanttSchedule } from './source/slides/GanttSchedule.jsx';
import { LayerPyramid } from './source/slides/LayerPyramid.jsx';
import { CycleLoop } from './source/slides/CycleLoop.jsx';
import { HubSpokes } from './source/slides/HubSpokes.jsx';
import { QuadrantMatrix } from './source/slides/QuadrantMatrix.jsx';
import { VersusCompare } from './source/slides/VersusCompare.jsx';
import { BarChartInsight } from './source/slides/BarChartInsight.jsx';
import { LineChartCompare } from './source/slides/LineChartCompare.jsx';
import { DonutBreakdown } from './source/slides/DonutBreakdown.jsx';
import { MetricGrid } from './source/slides/MetricGrid.jsx';
import { ImageTextSplit } from './source/slides/ImageTextSplit.jsx';
import { FigureGallery } from './source/slides/FigureGallery.jsx';
import { KeyStatement } from './source/slides/KeyStatement.jsx';
import { NumberedList } from './source/slides/NumberedList.jsx';
import { SummaryOutlook } from './source/slides/SummaryOutlook.jsx';
import { QaResponse } from './source/slides/QaResponse.jsx';
import { ProjectCards } from './source/slides/ProjectCards.jsx';
import { PracticeCollage } from './source/slides/PracticeCollage.jsx';
import { RadarProfile } from './source/slides/RadarProfile.jsx';
import { FuturePlan } from './source/slides/FuturePlan.jsx';
import { TeamMembers } from './source/slides/TeamMembers.jsx';
import { TempClosing } from './source/slides/TempClosing.jsx';
// —— 证据型页面(evidence 组):多图网格、结论式大图、界面截图网格、实验对比、公式 + 符号说明 ——
import { FigureMatrix } from './source/slides/FigureMatrix.jsx';
import { FindingFigure } from './source/slides/FindingFigure.jsx';
import { ScreenshotGrid } from './source/slides/ScreenshotGrid.jsx';
import { ExperimentCompare } from './source/slides/ExperimentCompare.jsx';
import { FormulaNotes } from './source/slides/FormulaNotes.jsx';
// —— 结构图与事务表(structure 组)新增页面 ——
import { LayerArchitecture } from './source/slides/LayerArchitecture.jsx';
import { TreeStructure } from './source/slides/TreeStructure.jsx';
import { FlowChain } from './source/slides/FlowChain.jsx';
import { StatusTable } from './source/slides/StatusTable.jsx';
import { OptionMatrix } from './source/slides/OptionMatrix.jsx';
import { PaperCard } from './source/slides/PaperCard.jsx';
import { PaperIntro } from './source/slides/PaperIntro.jsx';
import { LiteratureTable } from './source/slides/LiteratureTable.jsx';
import { ReviewComments } from './source/slides/ReviewComments.jsx';
// —— 特色页 A 组(feature-a):立体柱、大数字、舞台卡片、环形轨道、卷轴图文 ——
import { ShowcaseBars } from './source/slides/ShowcaseBars.jsx';
import { BigNumeral } from './source/slides/BigNumeral.jsx';
import { StageCards } from './source/slides/StageCards.jsx';
import { OrbitRing } from './source/slides/OrbitRing.jsx';
import { ScrollStory } from './source/slides/ScrollStory.jsx';
// —— 特色页 B 组(feature-b):双色立体环、六边形飞轮、分段箭头环、数字球气泡、六边形分支、斜切立体标签卡 ——
import { DuoRing } from './source/slides/DuoRing.jsx';
import { HexFlywheel } from './source/slides/HexFlywheel.jsx';
import { ArrowRing } from './source/slides/ArrowRing.jsx';
import { OrbBubbles } from './source/slides/OrbBubbles.jsx';
import { HexBranch } from './source/slides/HexBranch.jsx';
import { SlantCards } from './source/slides/SlantCards.jsx';
// ── g1 叙述页(narrative 组):研究背景配图、意义卡、国内外现状、问题→工作映射、目标与内容、创新点、论文结构、参考文献、致谢 ──
import { BackgroundFigure } from './source/slides/BackgroundFigure.jsx';
import { SignificanceCards } from './source/slides/SignificanceCards.jsx';
import { DomesticAbroad } from './source/slides/DomesticAbroad.jsx';
import { ProblemWorkMap } from './source/slides/ProblemWorkMap.jsx';
import { ObjectiveContents } from './source/slides/ObjectiveContents.jsx';
import { InnovationPoints } from './source/slides/InnovationPoints.jsx';
import { ThesisStructure } from './source/slides/ThesisStructure.jsx';
import { ReferencesList } from './source/slides/ReferencesList.jsx';
import { Acknowledgement } from './source/slides/Acknowledgement.jsx';
// ── g2 图示型页面(diagram 组):模型管线、技术路线、泳道流程、判定流程、ER 图、变量模型、标注示意图、多段图组 ──
import { ModelPipeline } from './source/slides/ModelPipeline.jsx';
import { TechRoute } from './source/slides/TechRoute.jsx';
import { SwimlaneFlow } from './source/slides/SwimlaneFlow.jsx';
import { DecisionFlow } from './source/slides/DecisionFlow.jsx';
import { ErSchema } from './source/slides/ErSchema.jsx';
import { VariableModel } from './source/slides/VariableModel.jsx';
import { AnnotatedFigure } from './source/slides/AnnotatedFigure.jsx';
import { StageFigures } from './source/slides/StageFigures.jsx';
// ── g3 数据与实验页:实验设置表、曲线小图网格、消融表、测试用例表、问卷结果、统计表、前后对比、矩阵热力图 ──
import { SetupTables } from './source/slides/SetupTables.jsx';
import { CurveGrid } from './source/slides/CurveGrid.jsx';
import { FigurePoints } from './source/slides/FigurePoints.jsx';
import { AblationTable } from './source/slides/AblationTable.jsx';
import { TestCases } from './source/slides/TestCases.jsx';
import { SurveyBars } from './source/slides/SurveyBars.jsx';
import { StatsTable } from './source/slides/StatsTable.jsx';
import { BeforeAfter } from './source/slides/BeforeAfter.jsx';
import { HeatmapMatrix } from './source/slides/HeatmapMatrix.jsx';
// ── g4 事务与论证页(开题 / 申报 / 结题 / 经管类研究内容) ──
import { ScheduleTable } from './source/slides/ScheduleTable.jsx';
import { AchievementList } from './source/slides/AchievementList.jsx';
import { ExpectedOutcomes } from './source/slides/ExpectedOutcomes.jsx';
import { Feasibility } from './source/slides/Feasibility.jsx';
import { BudgetTable } from './source/slides/BudgetTable.jsx';
import { TeamLead } from './source/slides/TeamLead.jsx';
import { TimelineFigures } from './source/slides/TimelineFigures.jsx';
import { CaseStudy } from './source/slides/CaseStudy.jsx';
import { CauseCountermeasure } from './source/slides/CauseCountermeasure.jsx';
// ── g5 特色页 C 组(递进与路径):立体领奖台、蜿蜒道路、层叠山峰、立体靶心、立体漏斗、立体拼图 ──
import { PodiumRank } from './source/slides/PodiumRank.jsx';
import { RoadJourney } from './source/slides/RoadJourney.jsx';
import { MountainPeaks } from './source/slides/MountainPeaks.jsx';
import { TargetFocus } from './source/slides/TargetFocus.jsx';
import { FunnelLayers } from './source/slides/FunnelLayers.jsx';
import { PuzzlePieces } from './source/slides/PuzzlePieces.jsx';
// ── g6 特色页 D 组(feature-d · 对比与聚合):立体天平、齿轮联动、等距积木、扇形展开卡、立体勋章、立体书 ──
import { BalanceScale } from './source/slides/BalanceScale.jsx';
import { GearLinkage } from './source/slides/GearLinkage.jsx';
import { IsoBlocks } from './source/slides/IsoBlocks.jsx';
import { FanSpread } from './source/slides/FanSpread.jsx';
import { MedalRibbons } from './source/slides/MedalRibbons.jsx';
import { OpenBook } from './source/slides/OpenBook.jsx';

export const theme = {
  key: 'campus',
  displayName: '南昌炫酷汇报版',
  label: '南昌炫酷汇报版',
  name: '南昌炫酷汇报版',
  scenario: '项目汇报、业务复盘、方案评审、区域分析、管理简报',
  audience: '项目负责人、业务团队、管理层、区域协作团队',
  mode: 'new',
  // 全稿级外观开关(导航样式 / 标题装饰 / 填充风格):预览工作台据此在右侧面板渲染「全稿外观」设置组。
  deckStyles: CAMPUS_DECK_STYLES,
};

// 清单顺序只影响展示排序;页面 key 由各页 META.id 决定,调整顺序或插入新页不会改变已有页面的 key。
export const runtimePages = definePages([
  TempCover,
  TempAgenda,
  ChapterOpener,
  LeadQuotesSubject,
  ParallelColumns,
  MethodRoadmap,
  PairedRows,
  DataTable,
  ProfileMetrics,
  HonorWall,
  TimelineMilestones,
  GanttSchedule,
  LayerPyramid,
  CycleLoop,
  HubSpokes,
  QuadrantMatrix,
  VersusCompare,
  BarChartInsight,
  LineChartCompare,
  DonutBreakdown,
  MetricGrid,
  ImageTextSplit,
  FigureGallery,
  KeyStatement,
  NumberedList,
  SummaryOutlook,
  QaResponse,
  ProjectCards,
  PracticeCollage,
  RadarProfile,
  FuturePlan,
  TeamMembers,
  // —— 证据型页面(evidence 组) ——
  FigureMatrix,
  FindingFigure,
  ScreenshotGrid,
  ExperimentCompare,
  FormulaNotes,
  // —— 结构图与事务表(structure 组)新增页面 ——
  LayerArchitecture,
  TreeStructure,
  FlowChain,
  StatusTable,
  OptionMatrix,
  PaperCard,
  PaperIntro,
  LiteratureTable,
  ReviewComments,
  // —— 特色页 A 组(feature-a) ——
  ShowcaseBars,
  BigNumeral,
  StageCards,
  OrbitRing,
  ScrollStory,
  // —— 特色页 B 组(feature-b) ——
  DuoRing,
  HexFlywheel,
  ArrowRing,
  OrbBubbles,
  HexBranch,
  SlantCards,
  // ── g1 叙述页(narrative 组) ──
  BackgroundFigure,
  SignificanceCards,
  DomesticAbroad,
  ProblemWorkMap,
  ObjectiveContents,
  InnovationPoints,
  ThesisStructure,
  ReferencesList,
  Acknowledgement,
  // ── g2 图示型页面(diagram 组) ──
  ModelPipeline,
  TechRoute,
  SwimlaneFlow,
  DecisionFlow,
  ErSchema,
  VariableModel,
  AnnotatedFigure,
  StageFigures,
  // ── g3 数据与实验页 ──
  SetupTables,
  CurveGrid,
  FigurePoints,
  AblationTable,
  TestCases,
  SurveyBars,
  StatsTable,
  BeforeAfter,
  HeatmapMatrix,
  // ── g4 事务与论证页 ──
  ScheduleTable,
  AchievementList,
  ExpectedOutcomes,
  Feasibility,
  BudgetTable,
  TeamLead,
  TimelineFigures,
  CaseStudy,
  CauseCountermeasure,
  // ── g5 特色页 C 组(递进与路径) ──
  PodiumRank,
  RoadJourney,
  MountainPeaks,
  TargetFocus,
  FunnelLayers,
  PuzzlePieces,
  // ── g6 特色页 D 组(feature-d · 对比与聚合) ──
  BalanceScale,
  GearLinkage,
  IsoBlocks,
  FanSpread,
  MedalRibbons,
  OpenBook,
  TempClosing,
], { themeKey: theme.key, wrap: withCampusBase });

