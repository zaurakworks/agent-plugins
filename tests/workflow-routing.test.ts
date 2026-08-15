// 跨 Skill 路由与资产一致性的符合性检查。
// 运行：node tests/workflow-routing.test.ts   （Node 原生剥离 TypeScript 类型，无需构建）
//
// 它检查的是版本化来源，不是某台电脑上的安装状态；通过不代表任一运行端已经安装成功。

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { render as renderSkillsOverview } from '../scripts/skills-overview.ts';

type EdgeKind = 'drive' | 'return' | 'reference';

type SkillDecl = {
  plugin: string;
  drive?: string[];
  return?: string[];
  reference?: string[];
};

type ScenarioCheck = { skill: string; mustContain: string[]; mustNotContain?: string[] };
type Scenario = { id: string; title: string; checks: ScenarioCheck[] };

type FrictionRegistrationCase = {
  id: string;
  body: string;
  expectedValid: boolean;
};

type FrictionRegistrationProtocol = {
  cases: FrictionRegistrationCase[];
};

type Transition = { from: string; to: string; evidence: string };

type Lifecycle = {
  owner: string;
  factsOnlyMarker: string;
  decisionPhrasesReservedToOwner: string[];
  entry: string;
  terminalStates: string[];
  transitions: Transition[];
  ownerMustContain: string[];
};

type DecisionOutcome =
  | 'bind'
  | 'clarify'
  | 'no-authorization'
  | 'already-receipted'
  | 'correct-receipt';
type DecisionAction = 'approve' | 'conditional-approve' | 'reject' | 'select-option';

type DecisionExpected = {
  outcome: DecisionOutcome;
  targetDecisionId?: string;
  action?: DecisionAction;
  selection?: string;
  invalidatesReceipt?: boolean;
  createsAuthorization?: boolean;
  freezeAffectedPaths?: boolean;
};

type DecisionCase = {
  id: string;
  source?: string;
  receiptSource?: string;
  activeDecisionIds: string[];
  adjacentDecisionId?: string;
  receiptedDecisionIds?: string[];
  options: string[];
  reply: string;
  conditionEffect?: 'narrows' | 'expands';
  expected: DecisionExpected;
};

type OwnerAction = {
  id: string;
  current: boolean;
  explicit: boolean;
  consumed: boolean;
  kind: 'decision' | 'acceptance';
};

type NextExecution = {
  responsible: string;
  action: string;
  phase: 'ready' | 'in-progress' | 'none';
};

type WorkflowOwnerFacts = {
  currentOwnerActionIds: string[];
  closeAuthorizationRequestId?: string;
  closeSourceIssue: boolean;
};

type LedgerProjection = {
  waitingOwner: boolean;
  status: '待决定' | '验收中' | '就绪' | '进行中' | '完成';
};

type OwnerActionExpected = {
  workflowFacts: WorkflowOwnerFacts;
  ledgerProjection: LedgerProjection;
};

type OwnerActionCase = {
  id: string;
  actions: OwnerAction[];
  next: NextExecution;
  sourceIssueNumber?: number;
  sourceIssueComplete: boolean;
  closeAuthorized: boolean;
  closePreauthorizationSatisfied?: boolean;
  expected: OwnerActionExpected;
};

type DecisionProtocol = {
  owner: string;
  requestKinds: string[];
  receiptFields: string[];
  trustedPrincipalLogins: string[];
  principalCases: DecisionPrincipalCase[];
  cases: DecisionCase[];
  ownerActionCases: OwnerActionCase[];
};

type DecisionPrincipalCase = {
  id: string;
  repositoryOwnerLogin: string;
  explicitOwnerLogins: string[];
  author: { login: string; type: 'User' | 'Bot' | 'App' | 'Unknown' };
  expectedTrusted: boolean;
};

type RuntimeCatalogObservation = {
  runtime: 'normal-codex' | 'orca-codex' | 'claude-code';
  probeSkill: string;
  sourceUtf8Bytes: number;
  visibleUtf8Bytes: number;
  truncated: boolean;
  maxSafeUtf8Bytes: number;
  observedAt: string;
};

type DescriptionBudgetException = {
  skill: string;
  decision: string;
  reason: string;
};

type DescriptionBudget = {
  unit: 'utf8-bytes';
  maxUtf8Bytes: number;
  runtimeCatalogs: RuntimeCatalogObservation[];
  exceptions: DescriptionBudgetException[];
  baseline: {
    commit: string;
    over1000Utf8Bytes: number;
    longest: { skill: string; utf8Bytes: number };
  };
};

type DeliveryCase = {
  id: string;
  artifact: 'draft-pr' | 'issue-comment' | 'issue-body';
  selfContained: boolean;
  stableRemoteUrl: boolean;
  recoverableSnapshot?: boolean;
  expectedNext: 'review' | 'reclaim' | 'blocked';
};

type DraftReadyCase = {
  id: string;
  actor: 'pr-integration' | 'issue-delivery' | 'reviewer';
  contractCurrent: boolean;
  currentHeadBound: boolean;
  checksSatisfied: boolean;
  feedbackResolved: boolean;
  authorized: boolean;
  expected: 'ready' | 'stay-draft';
};

type DeliveryProtocol = {
  cases: DeliveryCase[];
  draftReadyCases: DraftReadyCase[];
};

type IssueTitleVerificationCase = {
  id: string;
  frozenExpectedIssueTitle: string;
  scriptedIssueTitle: string;
  actualIssueTitle: string;
  issueNumberVerified: boolean;
  nativeParentVerified: boolean;
  verifiedPlacementFields: string[];
  remoteWriteReadBackVerified: boolean;
  expected: 'continue' | 'stop-contract-gate' | 'stop-title-mismatch';
};

type TypedDispatchProtocol = { issueTitleCases: IssueTitleVerificationCase[] };

type IssueTypeMapping = {
  prefix: string;
  label: string;
  ledgerNode: '目标／诉求' | '能力缺口' | '计划／实验' | '交付任务';
  usesExecutionStatus: boolean;
};

type CompactionCase = {
  id: string;
  declaredOwner: string;
  actor: string;
  snapshotPersisted: boolean;
  snapshotVerified: boolean;
  snapshottedVersion: string;
  latestVersion: string;
  expected: 'write' | 'reject-not-owner' | 'reject-no-snapshot' | 'reject-stale';
};

type CompactionProtocol = { cases: CompactionCase[] };

type LifecycleEventKind =
  | 'comment-evidence'
  | 'body-maintenance'
  | 'pr-integration'
  | 'decision-consumption'
  | 'source-state-transition';

type LifecycleLocator = {
  key: string;
  sourceIssueId: string;
  sourceFactId: string;
  lifecycleIntent: string;
  projectItemId: string;
};

type LifecycleClosureFixture = {
  id: string;
  eventKind: LifecycleEventKind;
  executor: string;
  locator: LifecycleLocator;
  sourceFact: { id: string; sourceIssueState: string };
  nextResponsibility: { responsible: string; action: string; claimed: boolean };
  consumedOwnerActionId: string;
  parentEvidence: { conditionId: string; sourceFactId: string };
  projectProjection: { id: string; status: string; waitProjection: string | null };
  initialProjectProjection: { id: string; status: string; waitProjection: string | null };
  fault: { afterCommittedStep: 'parentEvidence'; error: 'EOF' };
  expectedRecoveryWrites: string[];
};

type HarvestCopiedPayload =
  | 'child-body'
  | 'step-by-step-process'
  | 'complete-evidence-table'
  | 'delivery-longform';

type HarvestReceiptCase = {
  id: string;
  writtenIssueId: string;
  contractTargetIssueId: string;
  stableLink: string;
  remoteState: string;
  recordedState: string;
  evidenceLevel: string;
  conditionMappings: { conditionId: string; sourceFactId: string }[];
  conclusion: string;
  copiedPayloads: HarvestCopiedPayload[];
  expected: 'accept' | 'reject';
};

type LifecycleClosureProtocol = {
  coveredEvents: { kind: LifecycleEventKind; stableIdentity: string }[];
  partialFailure: LifecycleClosureFixture;
  harvestReceiptBudget: { cases: HarvestReceiptCase[] };
};

type GateSampleKind = 'real-trigger' | 'preregistered';
type GateExpected =
  | 'verified-action'
  | 'unknown-reversible'
  | 'not-triggered'
  | 'continue-ordinary'
  | 'existing-owner-protocol'
  | 'evaluate-cf6'
  | 'owner-direct-or-ordinary';
type G1GateCase = {
  id: string;
  stage: 'G1';
  sampleKind: GateSampleKind;
  source: string;
  changesAction: boolean;
  probe: {
    available: boolean;
    lowCost: boolean;
    safe: boolean;
    readOnlyOrReversible: boolean;
    result: 'verified' | 'not-run';
  };
  ordinaryPath: string;
  expected: Extract<GateExpected, 'verified-action' | 'unknown-reversible' | 'not-triggered'>;
};
type DecisionDimension =
  | 'nextAction'
  | 'authorizationBoundary'
  | 'riskExposure'
  | 'resourceOrTotalCost'
  | 'irreversibleOrTimedOpportunity';
type G2GateCase = {
  id: string;
  stage: 'G2';
  sampleKind: GateSampleKind;
  source: string;
  ordinaryPath: string;
  differences: Record<DecisionDimension, boolean>;
  expected: Extract<GateExpected, 'continue-ordinary' | 'existing-owner-protocol'>;
};
type G3GateCase = {
  id: string;
  stage: 'G3';
  sampleKind: GateSampleKind;
  source: string;
  realBlock: boolean;
  alternativeAuthorization: boolean;
  valueExceedsReviewCost: boolean;
  expected: Extract<GateExpected, 'evaluate-cf6' | 'owner-direct-or-ordinary'>;
};
type PreActionGateCase = G1GateCase | G2GateCase | G3GateCase;
type PreActionGateProtocol = {
  owner: string;
  decisionDimensions: DecisionDimension[];
  cases: PreActionGateCase[];
};

type Manifest = {
  driver: string;
  skills: Record<string, SkillDecl>;
  lifecycle: Lifecycle;
  pluginVersions: Record<string, string>;
  descriptionBudget: DescriptionBudget;
  typedDispatchProtocol: TypedDispatchProtocol;
  deliveryProtocol: DeliveryProtocol;
  issueTypeMappings: IssueTypeMapping[];
  compactionProtocol: CompactionProtocol;
  lifecycleClosureProtocol: LifecycleClosureProtocol;
  preActionGateProtocol: PreActionGateProtocol;
  decisionProtocol: DecisionProtocol;
  frictionRegistrationProtocol: FrictionRegistrationProtocol;
  scenarios: Scenario[];
};

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const pluginsRoot = join(repoRoot, 'plugins');

// 工作区可能是 CRLF 检出（core.autocrlf=true），索引里是 LF；断言统一在 LF 上进行。
const read = (path: string): string => readFileSync(path, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');

// 合同落点匹配忽略 Markdown 粗体和句末标点；排版调整不应让语义断言误报。
const contractText = (text: string): string =>
  text.replace(/\*\*/g, '').replace(/[。！？；](?=\s|$)/gu, '');
const containsContractText = (text: string, needle: string): boolean =>
  contractText(text).includes(contractText(needle));

const manifest: Manifest = JSON.parse(read(join(here, 'workflow-routing.json')));

const directories = (path: string): string[] =>
  readdirSync(path).filter((entry) => statSync(join(path, entry)).isDirectory());

// ---------- 1. 发现真实资产，并与声明逐条比对 ----------

const pluginNames = directories(pluginsRoot);
const skillFile = new Map<string, string>();
const skillPlugin = new Map<string, string>();

for (const plugin of pluginNames) {
  const skillsRoot = join(pluginsRoot, plugin, 'skills');
  for (const skill of directories(skillsRoot)) {
    assert.ok(!skillFile.has(skill), `Skill 名重复，无法唯一路由：${skill}`);
    skillFile.set(skill, join(skillsRoot, skill, 'SKILL.md'));
    skillPlugin.set(skill, plugin);
    read(join(skillsRoot, skill, 'SKILL.md'));
    read(join(skillsRoot, skill, 'agents', 'openai.yaml'));
  }
}

const declared = Object.keys(manifest.skills);
assert.deepEqual(
  [...skillFile.keys()].sort(),
  [...declared].sort(),
  '仓库中的 Skill 与 tests/workflow-routing.json 声明不一致',
);

const body = new Map<string, string>();
for (const [skill, path] of skillFile) body.set(skill, read(path));

// issue-workflow 的日常核心只保留无条件路径；罕见协议必须由核心的明确触发回指加载。
const issueWorkflowRoot = join(
  pluginsRoot,
  'github-collaboration',
  'skills',
  'issue-workflow',
);
const issueWorkflowReferencePaths = {
  remoteAccess: join(issueWorkflowRoot, 'references', 'remote-access-recovery.md'),
  naturalContinuation: join(issueWorkflowRoot, 'references', 'natural-continuation.md'),
  ownerDecision: join(issueWorkflowRoot, 'references', 'owner-decision-protocol.md'),
  lifecycleClosure: join(issueWorkflowRoot, 'references', 'lifecycle-closure.md'),
} as const;
const issueWorkflowReferences = Object.fromEntries(
  Object.entries(issueWorkflowReferencePaths).map(([name, path]) => [name, read(path)]),
) as Record<keyof typeof issueWorkflowReferencePaths, string>;

const contractBody = new Map(body);
contractBody.set(
  'issue-workflow',
  [body.get('issue-workflow')!, ...Object.values(issueWorkflowReferences)].join('\n'),
);
contractBody.set(
  'operating-ledger-maintenance',
  [body.get('operating-ledger-maintenance')!, issueWorkflowReferences.lifecycleClosure].join('\n'),
);

for (const reference of [
  './references/remote-access-recovery.md',
  './references/natural-continuation.md',
  './references/owner-decision-protocol.md',
  './references/lifecycle-closure.md',
]) {
  assert.ok(
    body.get('issue-workflow')!.includes(reference),
    `issue-workflow 核心缺少按需加载指引 ${reference}`,
  );
}
for (const trigger of [
  '候选失败、所需语义变化、认证／写权限不明或所有候选都缺一项语义时，**继续前必须完整读取**',
  '恢复父级、分类、建候选／子项或派发前必须完整读取',
  '形成、转呈、解析、修正或消费决定以前，**必须完整读取**',
  '作出任何远端收口写入前必须完整读取',
]) {
  assert.ok(
    body.get('issue-workflow')!.includes(trigger),
    `issue-workflow 核心缺少按需 reference 的前置触发 ${trigger}`,
  );
}
assert.ok(
  body.get('operating-ledger-maintenance')!.includes(
    '../issue-workflow/references/lifecycle-closure.md',
  ),
  'operating-ledger-maintenance 未回指生命周期唯一正文',
);
assert.ok(
  body
    .get('operating-ledger-maintenance')!
    .includes('处理部分失败或重入以前，**必须完整读取**'),
  'operating-ledger-maintenance 缺少共享生命周期 reference 的写前触发',
);

for (const movedHeading of [
  '#### 授权主体先于文本解析',
  '### 生命周期事件的同批次收口',
  '## 可执行子 Issue 的七项准入',
  '## 禁止降级与精确停写',
]) {
  assert.ok(
    !body.get('issue-workflow')!.includes(movedHeading),
    `issue-workflow 日常核心仍承载罕用重段 ${movedHeading}`,
  );
}
for (const duplicatedMarker of [
  '**来源事实在先**',
  '**父级证据随后**',
  '**Project 投影最后**',
  '**四面回读与单一回执**',
]) {
  assert.ok(
    !body.get('operating-ledger-maintenance')!.includes(duplicatedMarker),
    `operating-ledger-maintenance 仍双写生命周期正文 ${duplicatedMarker}`,
  );
  assert.ok(
    issueWorkflowReferences.lifecycleClosure.includes(duplicatedMarker),
    `生命周期唯一 reference 缺少 ${duplicatedMarker}`,
  );
}
assert.ok(
  Buffer.byteLength(body.get('issue-workflow')!, 'utf8') < 30_000,
  'issue-workflow 日常核心未收敛到 30KB 以下',
);

// 高损失安全门可以移层，但不得丢义。
for (const marker of [
  '格式为 `<Issue 号>-<局部编号>`',
  '主体类型必须是 GitHub `User`',
  '`author.login` 必须等于当前权威／Issue 合同明示的负责人账号',
]) {
  assert.ok(issueWorkflowReferences.ownerDecision.includes(marker), `决定 reference 缺少安全门 ${marker}`);
}
for (const marker of ['每个事件只有一个远端执行者', '只补确实缺失的步骤']) {
  assert.ok(issueWorkflowReferences.lifecycleClosure.includes(marker), `生命周期 reference 缺少安全门 ${marker}`);
}
for (const marker of ['正文排他所有权', '正文恢复快照', '最终写正文以前']) {
  assert.ok(body.get('issue-contract-compaction')!.includes(marker), `合同压缩缺少写前门 ${marker}`);
}
for (const marker of ['精确 current head', '当前 head 所需验证已经通过']) {
  assert.ok(body.get('pr-integration')!.includes(marker), `PR 整合缺少当前 head 门 ${marker}`);
}

const convergenceResearchUrl =
  'https://github.com/Eridanus117/agent-control/issues/178#issuecomment-5267420521';
for (const reference of [issueWorkflowReferences.ownerDecision, issueWorkflowReferences.lifecycleClosure]) {
  assert.ok(reference.includes(convergenceResearchUrl), '历史动机未压缩到统一调研链接');
}
for (const historicalNarrative of [
  '这种东西不应该 AI 自己先调研一下吗',
  'board 我点进去 issue',
  '被替代的默认行为',
]) {
  assert.ok(
    !contractBody.get('issue-workflow')!.includes(historicalNarrative),
    `执行正文仍保留历史动机长段 ${historicalNarrative}`,
  );
}

// ---------- 1.25. 迭代回执保持单一承载、十字段与按需路由 ----------

const iterationReceiptPath = join(
  pluginsRoot,
  'self-improvement',
  'skills',
  'self-improvement',
  'references',
  'iteration-receipt.md',
);
const iterationReceipt = read(iterationReceiptPath);
const iterationReceiptFields = [
  'trigger',
  'object',
  'finding',
  'route',
  'authority',
  'validation',
  'landing',
  'acceptance',
  'recheck',
  'roi',
];

for (const field of iterationReceiptFields) {
  assert.ok(iterationReceipt.includes(`\`${field}\``), `迭代回执缺少字段 ${field}`);
}
const declaredIterationReceiptFields = [...iterationReceipt.matchAll(/^\| `([a-z_]+)`（[^|]+） \|/gmu)]
  .map((match) => match[1]);
assert.deepEqual(
  declaredIterationReceiptFields,
  iterationReceiptFields,
  '迭代回执的最小字段必须忠实于 #135 的十项原集且顺序稳定',
);
for (const [field, requiredSemantics] of Object.entries({
  object: ['父目标', '基线'],
  validation: ['预注册判据', '实际运行', '未运行', '回退'],
  acceptance: ['父目标贡献', '能力回退', '当前证据等级'],
  roi: ['返工', '总周期', '负责人注意力', '维护税', '高／中／低', '不伪造'],
})) {
  const row = iterationReceipt.split(/\r?\n/u).find((line) => line.startsWith('| `' + field + '`（')) ?? '';
  for (const semantic of requiredSemantics) {
    assert.ok(row.includes(semantic), `迭代回执字段 ${field} 缺少语义「${semantic}」`);
  }
}
for (const skill of ['adaptive-problem-solving', 'knowledge-maintenance', 'orchestrated-collaboration']) {
  for (const field of iterationReceiptFields) {
    assert.ok(
      !body.get(skill)!.includes(`\`${field}\``),
      `${skill} 不应复制迭代回执字段 ${field}`,
    );
  }
}
assert.ok(
  body.get('self-improvement')!.includes('./references/iteration-receipt.md'),
  'self-improvement 未承载迭代回执 reference',
);
assert.ok(
  body.get('adaptive-problem-solving')!.includes('其 `references/iteration-receipt.md`'),
  'APS 未按需引用迭代回执',
);
assert.ok(
  body.get('adaptive-problem-solving')!.includes('第一轮发现仍是候选'),
  'APS 攻防段未保留“发现先裁决”的证据边界',
);
assert.ok(
  body.get('knowledge-maintenance')!.includes('其 `references/iteration-receipt.md`'),
  'knowledge-maintenance 未按需引用迭代回执',
);
assert.ok(
  !body.get('orchestrated-collaboration')!.includes('iteration-receipt.md'),
  'orchestrated-collaboration 不应成为迭代回执的第二承载面',
);
for (const needle of [
  'APS）仍是唯一任务内控制器',
  '当前 Issue',
  '自然里程碑',
  '不建立数据库、独立登记表、定时器',
  '当前回执评论的排他写入所有权',
  '字段解释只在本文件维护',
]) {
  assert.ok(iterationReceipt.includes(needle), `迭代回执缺少边界「${needle}」`);
}

// ---------- 1.5. APS 方法登记面保持可发现、完整且不越过证据／同意门 ----------

const methodRegistryRoot = join(
  pluginsRoot,
  'adaptive-problem-solving',
  'skills',
  'adaptive-problem-solving',
  'references',
  'method-registry',
);
const methodRegistryReadme = read(join(methodRegistryRoot, 'README.md'));
const methodIndex = read(join(methodRegistryRoot, 'INDEX.md'));
const methodCardsRoot = join(methodRegistryRoot, 'cards');
const methodCardFiles = readdirSync(methodCardsRoot)
  .filter((entry) => entry.endsWith('.md'))
  .sort();

assert.ok(
  methodCardFiles.length >= 25 && methodCardFiles.length <= 40,
  `方法卡数量必须保持在 25–40 张，当前为 ${methodCardFiles.length}`,
);
assert.equal(methodCardFiles.length, 30, 'README 与首批方法卡清单约定为 30 张');

const requiredMethodCardHeadings = [
  '## 身份与来源',
  '## 目的与类型',
  '## 进入条件',
  '## 硬门与禁用',
  '## 执行定义',
  '## 成本画像',
  '## 风险与回退',
  '## 组合关系',
  '## 控制规则',
  '## 有效性证据',
  '## 维护',
];
const sourceLevels = ['本次直接验证', '一手来源核验', '二手转述', '未核验推断'];
const methodIds = new Set<string>();
const evidenceDistribution = new Map<string, number>();

for (const file of methodCardFiles) {
  const text = read(join(methodCardsRoot, file));
  for (const heading of requiredMethodCardHeadings) {
    assert.ok(text.includes(heading), `${file}: 缺少必填字段组「${heading}」`);
  }
  assert.ok(text.length >= 1_000, `${file}: 卡片过短，未达到可独立复核的完整度`);

  const methodId = /- `method_id`：`([a-z0-9-]+)`/.exec(text)?.[1];
  assert.ok(methodId, `${file}: 缺少合法 method_id`);
  assert.equal(file, `${methodId}.md`, `${file}: 文件名必须与 method_id 一致`);
  assert.ok(!methodIds.has(methodId), `${file}: method_id 重复：${methodId}`);
  methodIds.add(methodId);

  assert.ok(text.includes('许可／私域：'), `${file}: 缺少许可／私域边界`);
  assert.ok(text.includes('明示同意：'), `${file}: 缺少明示同意门`);
  assert.ok(text.includes('授权：'), `${file}: 缺少授权门`);
  assert.ok(text.includes('风险／写入所有权：'), `${file}: 缺少风险／写入所有权门`);
  assert.ok(text.includes('不适用：'), `${file}: 缺少禁用条件`);
  assert.ok(text.includes('选择级别：'), `${file}: 缺少选择资格`);
  for (const field of [
    '墙钟：',
    'Token／工具调用：',
    '协调 Agent：',
    '负责人问询：',
    '维护成本：',
    '可逆性：',
    '失败门：',
    '恢复路径：',
    '前序：',
    '后序：',
    '冲突：',
    '最多组合深度：',
    '继续：',
    '降级：',
    '升级：',
    '换路：',
    '退出：',
    '翻转条件：',
    '成功样本：',
    '失败样本：',
    '未知：',
    '失效条件：',
    '下次最少复核：',
    '替代者：',
  ]) {
    assert.ok(text.includes(field), `${file}: 缺少必填字段「${field}」`);
  }

  const sourceLine = /^- 来源等级：(.+?)；能力证据等级：/m.exec(text)?.[1] ?? '';
  assert.ok(
    sourceLevels.some((level) => sourceLine.includes(level)),
    `${file}: 来源等级必须来自登记面四档`,
  );
  const evidenceLevel = /能力证据等级：(M[0-4]) /.exec(text)?.[1];
  assert.ok(evidenceLevel, `${file}: 缺少 M0–M4 能力证据等级`);
  evidenceDistribution.set(evidenceLevel, (evidenceDistribution.get(evidenceLevel) ?? 0) + 1);

  assert.ok(methodIndex.includes(methodId), `${file}: INDEX.md 未发现该卡`);
}

assert.equal(evidenceDistribution.get('M0'), 18, '首批方法卡必须如实保持 18 张 M0');
assert.equal(evidenceDistribution.get('M1'), 12, '首批方法卡必须如实保持 12 张 M1');
for (const level of ['M2', 'M3', 'M4']) {
  assert.equal(evidenceDistribution.get(level) ?? 0, 0, `首批方法卡没有 ${level} 证据`);
}
assert.ok(methodRegistryReadme.includes('18 张为 M0、12 张为 M1'), '登记面 README 未说明证据分布');
assert.ok(methodIndex.includes('M0 18 张、M1 12 张'), '登记面 INDEX 未说明证据分布');

for (const type of ['P1 问题定义型', 'P2 价值／授权型', 'P3 证据缺口型', 'P4 假设脆弱型', 'P5 多案取舍型']) {
  assert.ok(methodIndex.includes(type), `INDEX.md 缺少 ${type} 映射`);
}
for (const boundary of [
  '授权或决定权尚未成立则先归 P2',
  '事实齐全、转为攻击明确模型时换 P4',
  '失败已经发生且瓶颈转为纠正行为、防止复发时换 P7',
  'P6 可直接首跳',
]) {
  assert.ok(methodIndex.includes(boundary), `INDEX.md 缺少实证校准边界「${boundary}」`);
}

const redTeamCard = read(join(methodCardsRoot, 'red-team-analysis.md'));
assert.ok(redTeamCard.includes('能力证据等级：M1 当前交付验收'), 'red-team-analysis 未升为 M1');
assert.ok(
  redTeamCard.includes('issues/92#issuecomment-5258711541'),
  'red-team-analysis 未链接真实任务样本',
);
const multiPerspectiveCard = read(join(methodCardsRoot, 'multi-perspective-adversarial-review.md'));
const adaptiveSkillBody = body.get('adaptive-problem-solving')!;
assert.ok(
  Buffer.byteLength(adaptiveSkillBody, 'utf8') <= 22_850,
  '65-D1=A 要求 APS 主 Skill 以置换方式实施，LF 规范化后不得超过 22850 UTF-8 字节基线',
);
assert.ok(
  adaptiveSkillBody.includes('下文是唯一执行定义') &&
    adaptiveSkillBody.includes('第一轮至少两个独立攻击视角') &&
    adaptiveSkillBody.includes('第二轮至少两个未参与者') &&
    adaptiveSkillBody.includes('下限为四个独立 Agent／Session'),
  'APS 路线 4 必须独占执行定义，并固定两个攻击者＋两个裁决者的四 Agent 下限',
);
assert.ok(
  multiPerspectiveCard.includes('能力证据等级：M0 实现完成') &&
    multiPerspectiveCard.includes('/issues/66') &&
    multiPerspectiveCard.includes('未达到当前至少两名裁决者的下限') &&
    multiPerspectiveCard.includes('本卡不复制轮次、评论结构、裁决或停止步骤'),
  'multi-perspective-adversarial-review 必须如实保留 M0，并只指向 APS 执行定义',
);
const problemModelingCard = read(join(methodCardsRoot, 'aps-problem-modeling.md'));
assert.ok(
  problemModelingCard.includes('不能用发现错误代替新合同'),
  'aps-problem-modeling 未补上攻防发现后的回建模桥',
);
const roiOptionsCard = read(join(methodCardsRoot, 'aps-roi-options.md'));
assert.ok(
  roiOptionsCard.includes('不仅字段齐全') && roiOptionsCard.includes('总周期、有用吞吐与负责人注意力'),
  'aps-roi-options 未校准代理指标验收',
);
const comparativeExperimentCard = read(join(methodCardsRoot, 'comparative-experiment.md'));
assert.ok(
    comparativeExperimentCard.includes('能力证据等级：M1 当前交付验收') &&
    comparativeExperimentCard.includes('issues/98#issuecomment-5259163307') &&
    comparativeExperimentCard.includes('issues/102#issuecomment-5259493468') &&
    comparativeExperimentCard.includes('issues/102#issuecomment-5259500823') &&
    comparativeExperimentCard.includes('技术检索方法的可控对照与规模压力实验这一相同边界'),
  'comparative-experiment 未以两次真实检索对照样本有界升为 M1',
);
assert.ok(
  roiOptionsCard.includes('能力证据等级：M1 当前交付验收') &&
    roiOptionsCard.includes('issues/112#issuecomment-5261062363') &&
    roiOptionsCard.includes('issues/112#issuecomment-5261160382') &&
    roiOptionsCard.includes('是否真的需要负责人改变现状') &&
    roiOptionsCard.includes('运行底座依赖的有界产品与实施取舍这一相同边界'),
  'aps-roi-options 未把真实 ROI 使用与负责人注意力纠偏一并有界升为 M1',
);
const devilsAdvocacyCard = read(join(methodCardsRoot, 'devils-advocacy.md'));
assert.ok(
  devilsAdvocacyCard.includes('能力证据等级：M1 当前交付验收') &&
    devilsAdvocacyCard.includes('issues/109#issuecomment-5260729739') &&
    devilsAdvocacyCard.includes('issues/109#issuecomment-5260909104') &&
    devilsAdvocacyCard.includes('Agent 系统高影响产品决定的反方论证这一相同边界'),
  'devils-advocacy 未以真实决定面和负责人复核有界升为 M1',
);
const goalQuestionMetricCard = read(join(methodCardsRoot, 'goal-question-metric.md'));
assert.ok(
  goalQuestionMetricCard.includes('能力证据等级：M1 当前交付验收') &&
    goalQuestionMetricCard.includes('issues/79#issuecomment-5258121023') &&
    goalQuestionMetricCard.includes('issues/79#issuecomment-5258166941') &&
    goalQuestionMetricCard.includes('Agent 系统运营指标的人工低成本基线与复核这一相同边界'),
  'goal-question-metric 未以真实运营指标任务和负责人复核有界升为 M1',
);
const qualityOfInformationCard = read(join(methodCardsRoot, 'quality-of-information-check.md'));
assert.ok(
  qualityOfInformationCard.includes('能力证据等级：M1 当前交付验收') &&
    qualityOfInformationCard.includes('issues/67#issuecomment-5257206600') &&
    qualityOfInformationCard.includes('issues/99#issuecomment-5259308470') &&
    qualityOfInformationCard.includes('issues/120#issuecomment-5261274463') &&
    qualityOfInformationCard.includes('资源驱动的多来源投入判断这一相同边界'),
  'quality-of-information-check 未以资源测量、规则形成与交付证据有界升为 M1',
);
const outsideInThinkingCard = read(join(methodCardsRoot, 'outside-in-thinking.md'));
assert.ok(
  outsideInThinkingCard.includes('能力证据等级：M1 当前交付验收') &&
    outsideInThinkingCard.includes('issues/129#issuecomment-5261790288') &&
    outsideInThinkingCard.includes('issues/130#issuecomment-5262242274') &&
    outsideInThinkingCard.includes('知识产品的外部使用方与运行环境约束分析这一相同边界'),
  'outside-in-thinking 未以知识复用与覆盖缺口两项跨任务证据有界升为 M1',
);
const pairedObservationCard = read(join(methodCardsRoot, 'paired-observation.md'));
assert.ok(
  pairedObservationCard.includes('能力证据等级：M1 当前交付验收') &&
    pairedObservationCard.includes('issues/44#issuecomment-5256536380') &&
    pairedObservationCard.includes('0b34d59769372d4e3a6ea020211522ab6c8852911eb7e637c4175fb5d6d57eea') &&
    pairedObservationCard.includes('精确版本目录与文本 Skill 的 LF 规范化安装验收这一相同边界'),
  'paired-observation 未以两批三端指纹配对与假不一致纠偏有界升为 M1',
);
const indicatorsSignpostsCard = read(join(methodCardsRoot, 'indicators-signposts.md'));
assert.ok(
  indicatorsSignpostsCard.includes('能力证据等级：M1 当前交付验收') &&
    indicatorsSignpostsCard.includes('issues/131#issuecomment-5261878604') &&
    indicatorsSignpostsCard.includes('issues/125') &&
    indicatorsSignpostsCard.includes('issues/127') &&
    indicatorsSignpostsCard.includes('GitHub Issue 来源事实与经营 Project 生命周期投影重评这一相同边界'),
  'indicators-signposts 未以来源事实与经营投影的一致／漂移样本有界升为 M1',
);
const whatIfAnalysisCard = read(join(methodCardsRoot, 'what-if-analysis.md'));
const highImpactLowProbabilityCard = read(join(methodCardsRoot, 'high-impact-low-probability.md'));
assert.ok(
  whatIfAnalysisCard.includes('能力证据等级：M0 实现完成') &&
    highImpactLowProbabilityCard.includes('能力证据等级：M0 实现完成'),
  '单次显式复核与事后重放不得把 what-if-analysis 或 high-impact-low-probability 硬升为 M1',
);
const cardLinks = [...methodIndex.matchAll(/\]\((\.\/cards\/[^)]+\.md)\)/g)].map(
  (match) => match[1],
);
assert.ok(cardLinks.length >= methodCardFiles.length, 'INDEX.md 必须至少链接每张方法卡一次');
const uniqueCardLinks = new Set(cardLinks);
for (const link of uniqueCardLinks) {
  assert.ok(statSync(join(methodRegistryRoot, link.slice(2))).isFile(), `INDEX.md 存在失效链接：${link}`);
}
assert.deepEqual(
  [...uniqueCardLinks].map((link) => link.slice('./cards/'.length)).sort(),
  methodCardFiles,
  'INDEX.md 必须精确覆盖全部方法卡',
);
assert.ok(
  statSync(join(methodRegistryRoot, 'README.md')).isFile() &&
    statSync(join(methodRegistryRoot, 'INDEX.md')).isFile(),
  'APS 按需读取入口必须同时存在登记说明与类型索引',
);

const grillingCard = read(join(methodCardsRoot, 'grilling-decision-tree.md'));
assert.ok(grillingCard.includes('明示同意：**必须**'), 'grilling 方法卡必须保留明示同意硬门');
assert.ok(
  grillingCard.includes('索引命中、M1 或 Agent 偏好均不是同意'),
  'grilling 方法卡不得让类型或证据映射替代同意',
);
const selfImprovementLoopCard = read(join(methodCardsRoot, 'self-improvement-loop.md'));
const selfImprovementSkillBody = body.get('self-improvement')!;
const abstractLoopTrigger =
  '多轮讨论持续增加概念，却没有减少关键不确定性、形成决定或产出可检验资产';
assert.ok(
  selfImprovementSkillBody.includes(abstractLoopTrigger),
  'self-improvement Skill 必须保留系统入口批准的抽象循环直接触发信号',
);
assert.ok(
  selfImprovementLoopCard.includes('能力证据等级：M0 实现完成') &&
    selfImprovementLoopCard.includes('选择级别：M0；') &&
    selfImprovementLoopCard.includes(abstractLoopTrigger) &&
    selfImprovementLoopCard.includes('直接触发 `self-improvement` Skill') &&
    selfImprovementLoopCard.includes('该入口授权不表示成熟度升级'),
  'self-improvement-loop 的选择资格必须与直接触发入口一致，并保持 M0',
);

// ---------- 1.6. 协作形态登记面保持按需、完整且不形成第二个控制器 ----------

const collaborationShapeRoot = join(
  pluginsRoot,
  'orchestrated-collaboration',
  'skills',
  'orchestrated-collaboration',
  'references',
  'collaboration-shapes',
);
const collaborationShapeIndex = read(join(collaborationShapeRoot, 'INDEX.md'));
const collaborationShapeFiles = readdirSync(collaborationShapeRoot)
  .filter((entry) => /^cf-[0-7]\.md$/u.test(entry))
  .sort();

assert.deepEqual(
  collaborationShapeFiles,
  Array.from({ length: 8 }, (_, index) => `cf-${index}.md`),
  '协作形态登记面必须精确包含 CF-0 至 CF-7 八张卡',
);

const collaborationShapeIds = new Set<string>();
for (const file of collaborationShapeFiles) {
  const text = read(join(collaborationShapeRoot, file));
  for (const heading of requiredMethodCardHeadings) {
    assert.ok(text.includes(heading), `${file}: 缺少对齐方法登记面的字段组「${heading}」`);
  }
  assert.ok(text.length >= 900, `${file}: 卡片过短，无法独立复核进入、成本与失败门`);

  const shapeId = /- `shape_id`：`(CF-[0-7])`/u.exec(text)?.[1];
  assert.ok(shapeId, `${file}: 缺少合法 shape_id`);
  assert.equal(file, `${shapeId.toLowerCase()}.md`, `${file}: 文件名必须与 shape_id 一致`);
  assert.ok(!collaborationShapeIds.has(shapeId), `${file}: shape_id 重复：${shapeId}`);
  collaborationShapeIds.add(shapeId);

  for (const field of [
    '许可／私域：',
    '明示同意：',
    '授权：',
    '风险／写入所有权：',
    '不适用：',
    '墙钟：',
    'Token／工具调用：',
    '协调 Agent：',
    '负责人问询：',
    '维护成本：',
    '可逆性：',
    '失败门：',
    '恢复路径：',
    '前序：',
    '后序：',
    '冲突：',
    '最多组合深度：',
    '继续：',
    '降级：',
    '升级：',
    '换路：',
    '退出：',
    '翻转条件：',
    '成功样本：',
    '失败样本：',
    '未知：',
    '失效条件：',
    '下次最少复核：',
    '替代者：',
    '选择级别：',
  ]) {
    assert.ok(text.includes(field), `${file}: 缺少必填字段「${field}」`);
  }

  const sourceLine = /^- 来源等级：(.+?)；能力证据等级：/mu.exec(text)?.[1] ?? '';
  assert.ok(
    sourceLevels.some((level) => sourceLine.includes(level)),
    `${file}: 来源等级必须来自登记面四档`,
  );
  assert.match(text, /能力证据等级：M[0-4] /u, `${file}: 缺少 M0–M4 能力证据等级`);
  assert.ok(collaborationShapeIndex.includes(`./${file}`), `${file}: INDEX.md 未链接该卡`);
}

const collaborationShapeLinks = [
  ...collaborationShapeIndex.matchAll(/\]\((\.\/cf-[0-7]\.md)\)/gu),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(collaborationShapeLinks)].map((link) => link.slice(2)).sort(),
  collaborationShapeFiles,
  '协作形态 INDEX.md 必须精确覆盖八张卡',
);

const cf6 = read(join(collaborationShapeRoot, 'cf-6.md'));
assert.ok(cf6.includes('版本：`0.2.1`') && cf6.includes('能力证据等级：M0'), 'CF-6 0.2.1 必须保留 M0');
for (const mechanism of ['席位身份联合类型', '机械映射', '先密封后公开', '状态机与时间盒']) {
  assert.ok(cf6.includes(mechanism), `CF-6 缺少四机制之一：${mechanism}`);
}
assert.ok(cf6.includes('verified=false') && cf6.includes('issuecomment-5258662798'), 'CF-6 必须登记 #90 反向绑定拒绝门');
assert.ok(Buffer.byteLength(cf6, 'utf8') <= 6_000, 'CF-6 0.2.1 必须保持在已批 5–6 KB 目标内');
for (const path of [
  join(pluginsRoot, 'orchestrated-collaboration', 'scripts', 'verify-three-party-review.ts'),
  join(pluginsRoot, 'orchestrated-collaboration', 'tests', 'verify-three-party-review.test.ts'),
  join(pluginsRoot, 'orchestrated-collaboration', 'tests', 'fixtures', 'three-party-review-compliant.json'),
  join(pluginsRoot, 'orchestrated-collaboration', 'tests', 'fixtures', 'issue-90-reverse-binding.json'),
]) {
  assert.ok(statSync(path).isFile(), `CF-6 0.2.1 缺少验证资产：${path}`);
}

// ---------- 1.75. P1-1 行动前双门预注册夹具 ----------

const gateProtocol = manifest.preActionGateProtocol;
const decisionDimensions: DecisionDimension[] = [
  'nextAction',
  'authorizationBoundary',
  'riskExposure',
  'resourceOrTotalCost',
  'irreversibleOrTimedOpportunity',
];
assert.equal(gateProtocol.owner, 'adaptive-problem-solving', 'G1／G2／G3 必须由 APS 唯一承载');
assert.deepEqual(gateProtocol.decisionDimensions, decisionDimensions, 'G2 必须预注册且仅包含五维反事实');

const resolveGateCase = (fixture: PreActionGateCase): GateExpected => {
  assert.match(fixture.source, /^https:\/\/github\.com\/Eridanus117\/agent-control\/(?:issues\/\d+(?:#issuecomment-\d+)?)$/u, `${fixture.id}: 缺少稳定真实来源`);
  if (fixture.stage === 'G1') {
    assert.ok(fixture.ordinaryPath.trim(), `${fixture.id}: G1 缺少普通或可回退路径`);
    if (!fixture.changesAction) return 'not-triggered';
    const mustProbe =
      fixture.probe.available &&
      fixture.probe.lowCost &&
      fixture.probe.safe &&
      fixture.probe.readOnlyOrReversible;
    if (mustProbe) {
      assert.equal(fixture.probe.result, 'verified', `${fixture.id}: 低成本安全直接探针可得时必须实测`);
      return 'verified-action';
    }
    assert.equal(fixture.probe.result, 'not-run', `${fixture.id}: 不合格探针不得运行并冒充直接证据`);
    return 'unknown-reversible';
  }
  if (fixture.stage === 'G2') {
    assert.ok(fixture.ordinaryPath.trim(), `${fixture.id}: G2 必须先写无回复普通路径`);
    assert.deepEqual(
      Object.keys(fixture.differences),
      decisionDimensions,
      `${fixture.id}: G2 五维缺失、增项或乱序`,
    );
    for (const dimension of decisionDimensions) {
      assert.equal(typeof fixture.differences[dimension], 'boolean', `${fixture.id}: ${dimension} 不是布尔差异`);
    }
    return decisionDimensions.some((dimension) => fixture.differences[dimension])
      ? 'existing-owner-protocol'
      : 'continue-ordinary';
  }
  for (const field of ['realBlock', 'alternativeAuthorization', 'valueExceedsReviewCost'] as const) {
    assert.equal(typeof fixture[field], 'boolean', `${fixture.id}: G3 缺少 ${field}`);
  }
  return fixture.realBlock && fixture.alternativeAuthorization && fixture.valueExceedsReviewCost
    ? 'evaluate-cf6'
    : 'owner-direct-or-ordinary';
};

const gateCaseIds = gateProtocol.cases.map((fixture) => fixture.id);
assert.equal(new Set(gateCaseIds).size, gateCaseIds.length, 'P1-1 夹具 id 重复');
for (const required of [
  'g1-network-capability-real-probe',
  'g1-permission-probe-needs-new-authority',
  'g1-background-fact-does-not-trigger',
  'g2-default-path-isomorphic-real-trigger',
  'g2-product-boundary-enters-owner-protocol',
  'g2-timed-opportunity-enters-owner-protocol',
  'g3-real-block-with-authorization-and-positive-value',
  'g3-missing-alternative-authorization',
  'g3-review-cost-exceeds-value',
]) {
  assert.ok(gateCaseIds.includes(required), `P1-1 缺少代表夹具 ${required}`);
}
for (const fixture of gateProtocol.cases) {
  assert.equal(resolveGateCase(fixture), fixture.expected, `${fixture.id}: 行动前门结果不符`);
}
assert.deepEqual(
  [...new Set(gateProtocol.cases.filter((fixture) => fixture.sampleKind === 'real-trigger').map((fixture) => fixture.stage))].sort(),
  ['G1', 'G2'],
  '真实触发必须同时覆盖联网能力实测与默认路径同构决定请求',
);

const g1Verified = structuredClone(
  gateProtocol.cases.find((fixture): fixture is G1GateCase => fixture.id === 'g1-network-capability-real-probe')!,
);
g1Verified.probe.result = 'not-run';
assert.throws(() => resolveGateCase(g1Verified), /必须实测/u, '删除 G1 实测强制点时负向变异必须失败');
const g1Unknown = structuredClone(
  gateProtocol.cases.find((fixture): fixture is G1GateCase => fixture.id === 'g1-permission-probe-needs-new-authority')!,
);
g1Unknown.ordinaryPath = '';
assert.throws(() => resolveGateCase(g1Unknown), /可回退路径/u, '删除 G1 未知后的可回退路径时必须失败');

const g2Same = gateProtocol.cases.find(
  (fixture): fixture is G2GateCase => fixture.id === 'g2-default-path-isomorphic-real-trigger',
)!;
for (const dimension of decisionDimensions) {
  const mutated = structuredClone(g2Same) as G2GateCase;
  delete (mutated.differences as Partial<Record<DecisionDimension, boolean>>)[dimension];
  assert.throws(() => resolveGateCase(mutated), /G2 五维缺失/u, `删除 G2 ${dimension} 时负向变异必须失败`);
}
const g2WithoutOrdinaryPath = structuredClone(g2Same);
g2WithoutOrdinaryPath.ordinaryPath = '';
assert.throws(() => resolveGateCase(g2WithoutOrdinaryPath), /无回复普通路径/u, '删除 G2 普通路径时必须失败');

const g3Eligible = gateProtocol.cases.find(
  (fixture): fixture is G3GateCase => fixture.id === 'g3-real-block-with-authorization-and-positive-value',
)!;
for (const field of ['realBlock', 'alternativeAuthorization', 'valueExceedsReviewCost'] as const) {
  const mutated = structuredClone(g3Eligible);
  mutated[field] = false;
  assert.equal(resolveGateCase(mutated), 'owner-direct-or-ordinary', `G3 ${field}=false 时不得评估 CF-6`);
}
const g3WithoutAuthorization = structuredClone(g3Eligible) as G3GateCase;
delete (g3WithoutAuthorization as Partial<G3GateCase>).alternativeAuthorization;
assert.throws(() => resolveGateCase(g3WithoutAuthorization), /G3 缺少 alternativeAuthorization/u, '删除 G3 替代授权字段时必须失败');

const gateHeading = '### 行动前事实与决定价值双门';
assert.deepEqual(
  [...body.entries()].filter(([, text]) => text.includes(gateHeading)).map(([skill]) => skill),
  ['adaptive-problem-solving'],
  '行动前门不得在负责人协议或经营投影形成第三承载面',
);
assert.ok(
  cf6.includes('先完整读取 `adaptive-problem-solving` 第八节“行动前事实与决定价值双门”') &&
    !cf6.includes('下一动作、授权边界、风险暴露、资源投入或总成本、不可逆或有时限的机会'),
  'CF-6 必须只路由到 APS G3，不复制五维与经济判据',
);
const p02LifecycleSection = body.get('orchestrated-collaboration')!.split('## 八、处理交付并独立验收')[1];
for (const marker of ['**G1｜实测或未知。**', '**G2｜无回复五维反事实。**', '**G3｜三方审阅经济门。**']) {
  assert.deepEqual(
    [...body.entries()].filter(([, text]) => text.includes(marker)).map(([skill]) => skill),
    ['adaptive-problem-solving'],
    `P1-1 规范正文 ${marker} 只能存在于 APS`,
  );
  assert.ok(!p02LifecycleSection.includes(marker), `P1-1 不得侵入 P0-2 可重入收口段：${marker}`);
}
assert.ok(Buffer.byteLength(adaptiveSkillBody, 'utf8') <= 22_848, 'P1-1 必须守住 APS 0.2.8 的 22848 字节正文基线');
assert.ok(
  Buffer.byteLength(body.get('orchestrated-collaboration')!, 'utf8') <= 21_823,
  'P1-1 路由必须守住 P0-2 落地后的 orchestrated-collaboration 21823 字节正文基线',
);

const cf5Card = read(join(collaborationShapeRoot, 'cf-5.md'));
assert.ok(
  cf5Card.includes('至少四个独立 Agent／Session') &&
    cf5Card.includes('角色拓扑与所有权') &&
    cf5Card.includes('交付适配') &&
    cf5Card.includes('APS 路线 4') &&
    cf5Card.includes('能力证据等级：M0 实现完成') &&
    collaborationShapeIndex.includes('| M0 | 高影响模型反证 |'),
  'CF-5 必须只承载与 APS 下限一致的角色拓扑、所有权和交付适配',
);
assert.ok(
  !cf5Card.includes('逐项尝试反证') && !cf5Card.includes('确认、存疑、驳回与最小补证清单'),
  'CF-5 不得复制 APS 的裁决步骤与输出定义',
);

const collaborationSkillBody = body.get('orchestrated-collaboration')!;
for (const rule of ['**五项输入**', '**一层拓扑**', '**按需叠加**', '**CF-0 退出**']) {
  assert.ok(collaborationSkillBody.includes(rule), `orchestrated-collaboration 缺少四规则之一：${rule}`);
}
assert.ok(
  collaborationSkillBody.includes('./references/collaboration-shapes/INDEX.md') &&
    collaborationSkillBody.includes('不自动选型'),
  '主 Skill 必须可发现八卡且保持人工选择',
);
assert.ok(
  Buffer.byteLength(collaborationSkillBody, 'utf8') <= 21_841,
  '94-D1=C 与 120-D1=C 要求主 Skill 以置换方式实施，LF 规范化后不得超过 21841 UTF-8 字节基线',
);
const typedDispatchSection = collaborationSkillBody.slice(
  collaborationSkillBody.indexOf('### 类型化放置合同'),
  collaborationSkillBody.indexOf('## 六、派发前后都核对状态'),
);
const typedDispatchFieldNames = ['contractRepo', 'executionRepo', 'worktree', 'ownedPaths', 'delivery'];
assert.deepEqual(
  [...typedDispatchSection.matchAll(/^- `([^`]+)`：/gmu)].map((match) => match[1]),
  typedDispatchFieldNames,
  '类型化派发合同必须且只能声明五个稳定放置字段',
);
assert.ok(
  typedDispatchSection.includes('Issue 编号、父级、唯一交付形态或五字段任一缺失、歧义、冲突即停止创建 Task') &&
    collaborationSkillBody.includes('活动 Dispatch 缺一即停') &&
    collaborationSkillBody.includes('Worker 启动后以自身 Task／Dispatch 重读同一 Dispatch'),
  'Task、Dispatch 与 Worker 三个阶段必须共享缺失即停和同一身份核对门',
);
const resolveIssueTitleVerification = (
  fixture: IssueTitleVerificationCase,
): IssueTitleVerificationCase['expected'] => {
  const commonGatesPass =
    fixture.issueNumberVerified &&
    fixture.nativeParentVerified &&
    fixture.verifiedPlacementFields.length === typedDispatchFieldNames.length &&
    fixture.verifiedPlacementFields.every((field, index) => field === typedDispatchFieldNames[index]) &&
    fixture.remoteWriteReadBackVerified &&
    fixture.scriptedIssueTitle === fixture.actualIssueTitle;
  if (!commonGatesPass) return 'stop-contract-gate';
  return fixture.frozenExpectedIssueTitle === fixture.actualIssueTitle
    ? 'continue'
    : 'stop-title-mismatch';
};
const p03ToP01TitleCase = manifest.typedDispatchProtocol.issueTitleCases.find(
  (fixture) => fixture.id === 'p03-title-mistransmitted-as-p01',
);
assert.ok(p03ToP01TitleCase, '类型化派发协议缺少 P0-3→P0-1 标题错传负向夹具');
assert.deepEqual(
  [
    p03ToP01TitleCase.issueNumberVerified,
    p03ToP01TitleCase.nativeParentVerified,
    p03ToP01TitleCase.verifiedPlacementFields.length === typedDispatchFieldNames.length &&
      p03ToP01TitleCase.verifiedPlacementFields.every(
        (field, index) => field === typedDispatchFieldNames[index],
      ),
    p03ToP01TitleCase.remoteWriteReadBackVerified,
    p03ToP01TitleCase.scriptedIssueTitle === p03ToP01TitleCase.actualIssueTitle,
  ],
  [true, true, true, true, true],
  '负向夹具必须让 Issue 编号、父级、五字段与一般写后回读全部通过',
);
assert.match(p03ToP01TitleCase.frozenExpectedIssueTitle, /P0-3/u);
assert.match(p03ToP01TitleCase.actualIssueTitle, /P0-1/u);
assert.equal(
  resolveIssueTitleVerification(p03ToP01TitleCase),
  'stop-title-mismatch',
  '独立冻结的期望 Issue 标题必须捕获 P0-3→P0-1 错传',
);
for (const gate of [
  '**R1｜价值门。**',
  '**R2｜就绪队列与排他所有权。**',
  '**R3｜资源新鲜度。**',
  '**R4｜额度只作加速条件。**',
  '**R5｜验收容量与实验干扰。**',
  '**R6｜加派、维持或减派。**',
]) {
  assert.ok(collaborationSkillBody.includes(gate), `orchestrated-collaboration 缺少资源投入门：${gate}`);
}
assert.ok(
  collaborationSkillBody.includes('agent-control/blob/main/authority/05-resource-operations.md') &&
    collaborationSkillBody.includes('不复制证据历史或动态阈值'),
  '资源投入动作层必须引用 authority/05 的唯一原则源，且不得复制证据历史或动态阈值',
);
assert.ok(
  !collaborationSkillBody.includes('### 协调循环的三条规则'),
  'R1–R6 必须置换旧三条散规则，不能并列形成第二套投入判断',
);
const successionRouteTarget = /\[K12（协调者压缩存续与继任协议）\]\(([^)]+)\)/u.exec(
  collaborationSkillBody,
)?.[1];
assert.ok(successionRouteTarget, 'orchestrated-collaboration 必须给出 K12 的可解析链接');
const successionRouteUrl = new URL(successionRouteTarget);
assert.equal(successionRouteUrl.protocol, 'https:', 'K12 路由必须跨安装目录和工作区解析');
assert.equal(successionRouteUrl.hostname, 'github.com', 'K12 路由必须使用稳定 GitHub 来源');
// 2026-08-15 迁仓：`Eridanus117/agent-control` 已冻结只读，其 knowledge/ 会与当前
// 权威漂移。旧断言把期望值钉在那个仓上，等于让测试主动锁定一份会变陈旧的来源——
// 这比链接失效更糟：404 是响的，陈旧权威是哑的。改钉当前仓。
assert.equal(
  successionRouteUrl.pathname,
  '/zaurakworks/agent-control/blob/main/knowledge/coordinator-succession-protocol.md',
  'K12 路由必须指向 agent-control 当前知识包，不得依赖调用方工作目录，也不得指向已冻结的老仓',
);
const collaborationFrontmatter = collaborationSkillBody.slice(
  4,
  collaborationSkillBody.indexOf('\n---\n', 4),
);
const collaborationDescription = collaborationFrontmatter
  .slice(collaborationFrontmatter.indexOf('description:') + 'description:'.length)
  .replace(/^\s*[>|][-+]?\s*/u, '')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .join(' ');
assert.ok(
  Buffer.byteLength(collaborationDescription, 'utf8') < 989,
  '关联 agent-control#181（常驻规则面分层收敛）要求描述置换旧 989 UTF-8 字节正文并保留触发语义',
);

const descriptionExceptions = new Map<string, DescriptionBudgetException>();
for (const exception of manifest.descriptionBudget.exceptions) {
  assert.ok(declared.includes(exception.skill), `${exception.skill}: description 预算例外指向未知 Skill`);
  assert.ok(!descriptionExceptions.has(exception.skill), `${exception.skill}: description 预算例外重复`);
  assert.match(exception.decision, /^\d+-D[A-Za-z0-9-]*$/u, `${exception.skill}: 预算例外缺少稳定决定编号`);
  assert.ok(exception.reason.trim().length > 0, `${exception.skill}: 预算例外缺少原因`);
  descriptionExceptions.set(exception.skill, exception);
}

const requiredDescriptionTriggers = new Map<string, string[]>([
  ['adaptive-problem-solving', ['问题含糊', '波次／里程碑反思', '高成本或难回退', '恢复／交接／验收／长期收口', '上下文', 'Agent 组合', '低风险易回退']],
  ['issue-contract-compaction', ['正文已不能代表当前合同', '排他所有权', '远端快照', '写前再读远端', '不改变范围、决定或授权']],
  ['issue-delivery', ['已就绪 GitHub Issue', '可独立核验交付物', 'Draft PR', '证据评论', '实际运行、未运行', '不判生命周期']],
  ['issue-workflow', ['Issue 子树', '明确父级缺口', '负责人短回复', '可信负责人', '当前、明确、未消费', '登记知识候选', '独占生命周期判定', '不扫队列', '产品决定', '写入所有权']],
  ['objective-to-issues', ['长程目标已对齐', 'GitHub 写入已授权', '父／子 Issue 图', '依赖、所有权、交付合同与决定门', '普通单 PR']],
  ['operating-ledger-maintenance', ['跨 Session 保留', '分开维护执行、诉求和证据状态', '当前、明确、未消费', '下一责任人与动作', '普通任务、轮询、自动派发、未授权写入或历史迁移']],
  ['pr-integration', ['当前 head', 'required／optional checks', 'Draft → ready', 'lease', '明确授权才合并', '不判生命周期']],
  ['grilling', ['用户直接要求', '明确接受建议', '复杂性、关键词或 Agent 偏好不构成同意']],
  ['knowledge-maintenance', ['多来源调研', '可重复实验', '权威／Agent 配置／重要决定', '复用、复核、更新当前知识', '价值门和可信门', '低成本一次性事实']],
  ['orchestrated-collaboration', ['明确要求多 Agent／多 Session／跨 Provider 协作', '已授权委派', '共享写入碰撞', '排他所有权', '唯一协调者', '只冻结重叠', '协调者参与高价值多交付件能力的拆分或设计', '未参与者复核父目标', '动态读 orchestration 指南', '不要因复杂、额度或空闲 Agent 擅自并行', '不把试用变成长期依赖']],
  ['resource-observability', ['账户额度', '重置时间', '重置券', '单 Session Token', '启动、并行、降级、延后或停止', 'Orca 账户快照', '固定 ccusage', '轮询、自动调度／消费权益']],
  ['self-improvement', ['Agent 漂移、误解、重复犯错', '任务经验固化为系统改进', '讨论只增概念', '只暂停依赖被推翻假设的路径', '重锚原问题', '持久记录纠正', '入口提示词或 Skill', '普通一次性错误']],
]);

// ---------- 2. 每个 SKILL.md 的必需字段 ----------

for (const [skill, text] of body) {
  assert.ok(text.startsWith('---\n'), `${skill}: 缺少 frontmatter`);
  const end = text.indexOf('\n---\n', 4);
  assert.ok(end > 0, `${skill}: frontmatter 未闭合`);
  const frontmatter = text.slice(4, end);

  const name = /^name:\s*(\S+)\s*$/m.exec(frontmatter)?.[1];
  assert.equal(name, skill, `${skill}: frontmatter name 必须等于目录名`);

  const descriptionAt = frontmatter.indexOf('description:');
  assert.ok(descriptionAt >= 0, `${skill}: 缺少 description`);
  const description = frontmatter.slice(descriptionAt + 'description:'.length);
  assert.ok(/[一-鿿]{10,}/.test(description), `${skill}: description 缺少中文触发说明`);
  assert.ok(/[A-Za-z][A-Za-z ,.'’\-]{40,}/.test(description), `${skill}: description 缺少英文触发说明`);

  // 三端运行目录都把 description 当成单个 UTF-8 字段投递。共同预算按实测安全阈值的
  // 最小值确定；按字符计数会让中文 description 在达到字符上限以前先越过字节上限。
  const deliveredDescription = description
    .replace(/^\s*[>|][-+]?\s*/, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
  const deliveredDescriptionBytes = Buffer.byteLength(deliveredDescription, 'utf8');
  const triggerMarkers = requiredDescriptionTriggers.get(skill);
  assert.ok(triggerMarkers, `${skill}: 缺少 description 触发守恒断言`);
  for (const marker of triggerMarkers) {
    assert.ok(deliveredDescription.includes(marker), `${skill}: description 丢失触发／边界语义「${marker}」`);
  }
  const exception = descriptionExceptions.get(skill);
  if (exception) {
    assert.ok(
      deliveredDescriptionBytes > manifest.descriptionBudget.maxUtf8Bytes,
      `${skill}: 已低于共同预算，必须删除过期例外`,
    );
  } else {
    assert.ok(
      deliveredDescriptionBytes <= manifest.descriptionBudget.maxUtf8Bytes,
      `${skill}: description 折叠后 ${deliveredDescriptionBytes} UTF-8 字节，超过三端共同预算 ${manifest.descriptionBudget.maxUtf8Bytes} 字节，尾部触发语义会被静默截断`,
    );
  }

  assert.equal(
    manifest.skills[skill].plugin,
    skillPlugin.get(skill),
    `${skill}: 声明的 Plugin 与实际位置不符`,
  );
}

assert.equal(manifest.descriptionBudget.unit, 'utf8-bytes', 'description 预算量纲必须是 UTF-8 字节');
assert.ok(
  !descriptionExceptions.has('adaptive-problem-solving'),
  '70-D 决定已消费时 adaptive-problem-solving 的 description 预算例外必须消失',
);
assert.deepEqual(
  manifest.descriptionBudget.baseline,
  {
    commit: 'ea0ba26055a4509cd6efee7422f947ded31605e5',
    over1000Utf8Bytes: 7,
    longest: { skill: 'orchestrated-collaboration', utf8Bytes: 1906 },
  },
  'description 预算基线必须保留 #66 的 7/12 与最长 1906 字节证据',
);
const runtimeCatalogs = manifest.descriptionBudget.runtimeCatalogs;
assert.deepEqual(
  runtimeCatalogs.map((entry) => entry.runtime).sort(),
  ['claude-code', 'normal-codex', 'orca-codex'],
  'description 预算必须有普通 Codex、Orca Codex 与 Claude 三端目录回显',
);
for (const observation of runtimeCatalogs) {
  assert.match(observation.observedAt, /^\d{4}-\d{2}-\d{2}$/u, `${observation.runtime}: observedAt 非日期`);
  assert.ok(observation.maxSafeUtf8Bytes > 0, `${observation.runtime}: 缺少正数 UTF-8 安全阈值`);
  assert.equal(observation.probeSkill, 'orchestrated-collaboration', `${observation.runtime}: 三端必须回显同一探针`);
  assert.equal(observation.sourceUtf8Bytes, 1906, `${observation.runtime}: 探针源码字节基线不一致`);
  assert.equal(
    observation.truncated,
    observation.visibleUtf8Bytes < observation.sourceUtf8Bytes,
    `${observation.runtime}: 截断标志与目录可见字节不一致`,
  );
  assert.ok(
    observation.maxSafeUtf8Bytes <= observation.visibleUtf8Bytes,
    `${observation.runtime}: 安全阈值不能高于实测可见前缀`,
  );
}
assert.equal(
  manifest.descriptionBudget.maxUtf8Bytes,
  Math.min(...runtimeCatalogs.map((entry) => entry.maxSafeUtf8Bytes)),
  '共同 description 预算必须等于三端实测安全阈值的最小值',
);

// ---------- 3. 路由边必须与正文逐条对应 ----------

const edgesOf = (skill: string): Map<string, EdgeKind> => {
  const decl = manifest.skills[skill];
  const map = new Map<string, EdgeKind>();
  for (const kind of ['drive', 'return', 'reference'] as EdgeKind[]) {
    for (const target of decl[kind] ?? []) {
      assert.ok(declared.includes(target), `${skill} -> ${target}: 目标 Skill 未声明`);
      assert.notEqual(target, skill, `${skill}: 不能声明指向自己的边`);
      assert.ok(!map.has(target), `${skill} -> ${target}: 同一目标声明了多种边`);
      map.set(target, kind);
    }
  }
  return map;
};

for (const skill of declared) {
  const text = body.get(skill)!;
  const mentioned = declared.filter((other) => other !== skill && text.includes(other)).sort();
  const edges = [...edgesOf(skill).keys()].sort();
  assert.deepEqual(
    edges,
    mentioned,
    `${skill}: 声明的路由边与正文实际引用不一致（声明=${edges.join(',') || '空'}；正文=${mentioned.join(',') || '空'}）`,
  );
}

// ---------- 4. 唯一驱动者、无环、返回边只指向驱动者 ----------

assert.ok(declared.includes(manifest.driver), '声明的 driver 不存在');

for (const skill of declared) {
  for (const target of manifest.skills[skill].return ?? []) {
    assert.equal(target, manifest.driver, `${skill} -> ${target}: return 边只允许指向驱动者`);
  }
}

const state = new Map<string, 'visiting' | 'done'>();
const walk = (skill: string, path: string[]): void => {
  if (state.get(skill) === 'done') return;
  assert.notEqual(state.get(skill), 'visiting', `drive 边存在环：${[...path, skill].join(' -> ')}`);
  state.set(skill, 'visiting');
  for (const target of manifest.skills[skill].drive ?? []) walk(target, [...path, skill]);
  state.set(skill, 'done');
};
for (const skill of declared) walk(skill, []);

// 声明会把控制权交回驱动者的段 Skill，必须真的能被驱动者驱动到，否则是断开的状态机。
const drivenFromDriver = new Set<string>();
const collect = (skill: string): void => {
  for (const target of manifest.skills[skill].drive ?? []) {
    if (drivenFromDriver.has(target)) continue;
    drivenFromDriver.add(target);
    collect(target);
  }
};
collect(manifest.driver);
for (const skill of declared) {
  if ((manifest.skills[skill].return ?? []).length > 0) {
    assert.ok(drivenFromDriver.has(skill), `${skill}: 声明了返回边，却不在驱动者的可达范围内`);
  }
}

// ---------- 5. 生命周期判定只属于驱动者 ----------
//
// 「唯一生命周期决定者」不是靠 manifest 里命名一个 driver 就成立的。真正要防的是：
// 某个段 Skill 自己重做一遍父级完成判定，于是链上出现两套会给出不同结论的状态机。
// 注意区分两件事：段调用（drive 边）转移的是执行，生命周期决定权不随它转移；只有
// 下面的 owner 能决定状态。断言按「谁能作出状态判定」和「状态机本身是否闭合」两条
// 展开，而不是检查名称是否出现。

const lifecycle = manifest.lifecycle;
assert.equal(lifecycle.owner, manifest.driver, 'lifecycle.owner 必须就是 driver');

const ownerBody = contractBody.get(lifecycle.owner)!;
for (const needle of lifecycle.ownerMustContain) {
  assert.ok(ownerBody.includes(needle), `${lifecycle.owner}: 缺少生命周期归属声明「${needle}」`);
}

// 声明了 return 边的就是段 Skill：它把控制权交回驱动者，因此不得自己判定状态。
const segments = declared.filter((skill) => (manifest.skills[skill].return ?? []).length > 0);
assert.ok(segments.length > 0, '没有任何段 Skill 声明返回边，唯一驱动者无从谈起');

for (const skill of segments) {
  const text = body.get(skill)!;
  assert.ok(
    text.includes(lifecycle.factsOnlyMarker),
    `${skill}: 段 Skill 必须声明「${lifecycle.factsOnlyMarker}」`,
  );
  assert.ok(
    !(manifest.skills[skill].drive ?? []).includes(lifecycle.owner),
    `${skill}: 段 Skill 不能 drive 驱动者，只能 return`,
  );
}

for (const skill of declared) {
  if (skill === lifecycle.owner) continue;
  for (const phrase of lifecycle.decisionPhrasesReservedToOwner) {
    assert.ok(
      !body.get(skill)!.includes(phrase),
      `${skill}: 出现了只属于驱动者的状态判定「${phrase}」——这是第二套完成状态机`,
    );
  }
}

// 状态机本身：每条转移在驱动者正文中都要有证据，且不能有死角或不可达状态。
const states = new Set<string>([lifecycle.entry]);
for (const transition of lifecycle.transitions) {
  states.add(transition.from);
  states.add(transition.to);
  assert.ok(
    containsContractText(ownerBody, transition.evidence),
    `${transition.from} -> ${transition.to}: 驱动者正文缺少证据「${transition.evidence}」`,
  );
}
for (const state of lifecycle.terminalStates) {
  assert.ok(states.has(state), `终止状态 ${state} 没有出现在任何转移中`);
}

const hasIncoming = new Set(lifecycle.transitions.map((transition) => transition.to));
const hasOutgoing = new Set(lifecycle.transitions.map((transition) => transition.from));
for (const state of states) {
  if (state !== lifecycle.entry) {
    assert.ok(hasIncoming.has(state), `状态 ${state} 不可达`);
  }
  if (!lifecycle.terminalStates.includes(state)) {
    assert.ok(hasOutgoing.has(state), `状态 ${state} 是死角：既非终止状态又没有出边`);
  }
}
for (const state of lifecycle.terminalStates) {
  assert.ok(!hasOutgoing.has(state), `终止状态 ${state} 不应再有出边`);
}

// ---------- 5.5. 生命周期事件复用既有收口，部分失败由真实恢复函数补缺 ----------

type LifecycleClosureStep =
  | 'sourceFact'
  | 'nextResponsibility'
  | 'parentEvidence'
  | 'projectProjection'
  | 'fourSurfaceReread';

type LifecycleReceipt = {
  locatorKey: string;
  missing: LifecycleClosureStep[];
  readback?: Record<'sourceFact' | 'nextResponsibility' | 'parentEvidence' | 'projectProjection', true>;
};

type LifecycleRemote = {
  sourceFacts: LifecycleClosureFixture['sourceFact'][];
  nextResponsibilities: (LifecycleClosureFixture['nextResponsibility'] & { locatorKey: string })[];
  consumedOwnerActionIds: string[];
  parentEvidence: LifecycleClosureFixture['parentEvidence'][];
  projectItems: LifecycleClosureFixture['projectProjection'][];
  receipts: LifecycleReceipt[];
  writes: string[];
  faultUsed: boolean;
};

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const missingLifecycleClosureSteps = (
  fixture: LifecycleClosureFixture,
  remote: LifecycleRemote,
): LifecycleClosureStep[] => {
  const missing: LifecycleClosureStep[] = [];
  if (!remote.sourceFacts.some((value) => sameValue(value, fixture.sourceFact))) {
    missing.push('sourceFact');
  }
  if (
    !remote.consumedOwnerActionIds.includes(fixture.consumedOwnerActionId) ||
    !remote.nextResponsibilities.some((value) =>
      value.locatorKey === fixture.locator.key &&
      sameValue(
        { responsible: value.responsible, action: value.action, claimed: value.claimed },
        fixture.nextResponsibility,
      ))
  ) {
    missing.push('nextResponsibility');
  }
  if (!remote.parentEvidence.some((value) => sameValue(value, fixture.parentEvidence))) {
    missing.push('parentEvidence');
  }
  if (!remote.projectItems.some((value) => sameValue(value, fixture.projectProjection))) {
    missing.push('projectProjection');
  }
  const receipt = remote.receipts.find((value) => value.locatorKey === fixture.locator.key);
  if (!receipt?.readback || !Object.values(receipt.readback).every((value) => value === true)) {
    missing.push('fourSurfaceReread');
  }
  return missing;
};

const recoverLifecycleClosure = (
  fixture: LifecycleClosureFixture,
  remote: LifecycleRemote,
  executor: string,
  injectFault: boolean,
): void => {
  assert.equal(executor, fixture.executor, `${fixture.id}: 只有合同指定的唯一远端执行者可以补缺`);
  assert.equal(
    [
      fixture.locator.sourceIssueId,
      fixture.locator.sourceFactId,
      fixture.locator.lifecycleIntent,
      fixture.locator.projectItemId,
    ].join('|'),
    fixture.locator.key,
    `${fixture.id}: 恢复定位符必须完全派生自稳定远端身份`,
  );

  let receipt = remote.receipts.find((value) => value.locatorKey === fixture.locator.key);
  if (!receipt) {
    receipt = { locatorKey: fixture.locator.key, missing: [] };
    remote.receipts.push(receipt);
    remote.writes.push('receipt');
  }
  receipt.missing = missingLifecycleClosureSteps(fixture, remote);
  const needsFourSurfaceReread = receipt.missing.includes('fourSurfaceReread');

  if (receipt.missing.includes('sourceFact')) {
    remote.sourceFacts.push(structuredClone(fixture.sourceFact));
    remote.writes.push('sourceFact');
  }
  if (receipt.missing.includes('nextResponsibility')) {
    if (!remote.consumedOwnerActionIds.includes(fixture.consumedOwnerActionId)) {
      remote.consumedOwnerActionIds.push(fixture.consumedOwnerActionId);
      remote.writes.push('ownerActionConsumption');
    }
    remote.nextResponsibilities.push({
      locatorKey: fixture.locator.key,
      ...structuredClone(fixture.nextResponsibility),
    });
    remote.writes.push('nextResponsibility');
  }
  if (receipt.missing.includes('parentEvidence')) {
    remote.parentEvidence.push(structuredClone(fixture.parentEvidence));
    remote.writes.push('parentEvidence');
    if (injectFault && !remote.faultUsed && fixture.fault.afterCommittedStep === 'parentEvidence') {
      remote.faultUsed = true;
      receipt.missing = missingLifecycleClosureSteps(fixture, remote);
      throw new Error(fixture.fault.error);
    }
  }
  if (missingLifecycleClosureSteps(fixture, remote).includes('projectProjection')) {
    const projectIndex = remote.projectItems.findIndex((value) => value.id === fixture.locator.projectItemId);
    assert.notEqual(projectIndex, -1, `${fixture.id}: Project item 身份必须沿原对象恢复`);
    remote.projectItems[projectIndex] = structuredClone(fixture.projectProjection);
    remote.writes.push('projectProjection');
  }

  const remainingSurfaces = missingLifecycleClosureSteps(fixture, remote)
    .filter((step) => step !== 'fourSurfaceReread');
  assert.deepEqual(remainingSurfaces, [], `${fixture.id}: 四面回读前仍有未补齐远端事实`);
  if (needsFourSurfaceReread) {
    receipt.readback = {
      sourceFact: true,
      nextResponsibility: true,
      parentEvidence: true,
      projectProjection: true,
    };
    remote.writes.push('fourSurfaceReread');
  }
  receipt.missing = [];
};

const assertLifecycleClosureComplete = (
  fixture: LifecycleClosureFixture,
  remote: LifecycleRemote,
): void => {
  assert.deepEqual(
    missingLifecycleClosureSteps(fixture, remote),
    [],
    `${fixture.id}: 生命周期事件未达到四面一致`,
  );
};

const resolveHarvestReceiptCase = (fixture: HarvestReceiptCase): HarvestReceiptCase['expected'] => {
  const semanticSentences = fixture.conclusion
    .trim()
    .split(/[。！？!?]+/u)
    .map((value) => value.trim())
    .filter(Boolean);
  const completeConditionMappings =
    fixture.conditionMappings.length > 0 &&
    fixture.conditionMappings.every(
      ({ conditionId, sourceFactId }) => conditionId.trim() && sourceFactId.trim(),
    );
  const keepsOnlySemanticIndex = fixture.copiedPayloads.length === 0;
  const fieldsAreRecoverable =
    fixture.writtenIssueId.trim() &&
    fixture.contractTargetIssueId.trim() &&
    /^https:\/\//u.test(fixture.stableLink) &&
    fixture.remoteState === fixture.recordedState &&
    fixture.evidenceLevel.trim() &&
    completeConditionMappings &&
    semanticSentences.length === 1;

  return fieldsAreRecoverable && keepsOnlySemanticIndex ? 'accept' : 'reject';
};

const closureProtocol = manifest.lifecycleClosureProtocol;
assert.deepEqual(
  closureProtocol.coveredEvents.map((value) => value.kind).sort(),
  [
    'body-maintenance',
    'comment-evidence',
    'decision-consumption',
    'pr-integration',
    'source-state-transition',
  ],
  '通用收口必须覆盖全部相关生命周期来源事件',
);
for (const event of closureProtocol.coveredEvents) {
  assert.ok(event.stableIdentity.trim(), `${event.kind}: 缺少稳定远端事件身份`);
}

const partialFailure = closureProtocol.partialFailure;
const partialRemote: LifecycleRemote = {
  sourceFacts: [],
  nextResponsibilities: [],
  consumedOwnerActionIds: [],
  parentEvidence: [],
  projectItems: [structuredClone(partialFailure.initialProjectProjection)],
  receipts: [],
  writes: [],
  faultUsed: false,
};
assert.throws(
  () => recoverLifecycleClosure(partialFailure, partialRemote, partialFailure.executor, true),
  /EOF/u,
  '夹具必须模拟“父级证据已落盘但调用返回 EOF”',
);
assert.equal(partialRemote.parentEvidence.length, 1, 'EOF 后父级证据应当已真实落盘');
assert.deepEqual(
  missingLifecycleClosureSteps(partialFailure, partialRemote),
  ['projectProjection', 'fourSurfaceReread'],
  'EOF 后必须从远端后态识别真实缺段',
);
assert.deepEqual(
  partialRemote.receipts[0].missing,
  ['projectProjection', 'fourSurfaceReread'],
  'EOF 后同一回执必须记录真实远端后态的缺段',
);
const countsAfterFailure = {
  sourceFacts: partialRemote.sourceFacts.length,
  nextResponsibilities: partialRemote.nextResponsibilities.length,
  consumedOwnerActionIds: partialRemote.consumedOwnerActionIds.length,
  parentEvidence: partialRemote.parentEvidence.length,
  projectItems: partialRemote.projectItems.length,
  receipts: partialRemote.receipts.length,
};
const writesBeforeRecovery = partialRemote.writes.length;
recoverLifecycleClosure(partialFailure, partialRemote, partialFailure.executor, false);
assertLifecycleClosureComplete(partialFailure, partialRemote);
assert.deepEqual(
  partialRemote.writes.slice(writesBeforeRecovery),
  partialFailure.expectedRecoveryWrites,
  '恢复必须只补 Project 投影与最终四面回读',
);
assert.deepEqual(
  {
    sourceFacts: partialRemote.sourceFacts.length,
    nextResponsibilities: partialRemote.nextResponsibilities.length,
    consumedOwnerActionIds: partialRemote.consumedOwnerActionIds.length,
    parentEvidence: partialRemote.parentEvidence.length,
    projectItems: partialRemote.projectItems.length,
    receipts: partialRemote.receipts.length,
  },
  countsAfterFailure,
  '恢复不得重复来源事实、负责人动作、父级证据、Project item 或回执',
);
const writesAfterRecovery = partialRemote.writes.length;
recoverLifecycleClosure(partialFailure, partialRemote, partialFailure.executor, false);
assert.equal(partialRemote.writes.length, writesAfterRecovery, '已经四面一致时再次重入不得产生远端写入');
assert.throws(
  () => recoverLifecycleClosure(partialFailure, partialRemote, 'second-writer', false),
  /唯一远端执行者/u,
  '第二个物理写入者必须被拒绝',
);

for (const step of [
  'sourceFact',
  'nextResponsibility',
  'parentEvidence',
  'projectProjection',
  'fourSurfaceReread',
] as const) {
  const mutated = structuredClone(partialRemote);
  if (step === 'sourceFact') mutated.sourceFacts = [];
  if (step === 'nextResponsibility') {
    mutated.nextResponsibilities = [];
    mutated.consumedOwnerActionIds = [];
  }
  if (step === 'parentEvidence') mutated.parentEvidence = [];
  if (step === 'projectProjection') mutated.projectItems = [structuredClone(partialFailure.initialProjectProjection)];
  if (step === 'fourSurfaceReread') delete mutated.receipts[0].readback;
  assert.throws(
    () => assertLifecycleClosureComplete(partialFailure, mutated),
    /未达到四面一致/u,
    `删除 ${step} 强制点时夹具必须失败`,
  );
}

for (const marker of [
  '评论／证据、正文、PR、决定与来源状态迁移均进入本段',
  '每个事件只有一个远端执行者',
  '来源事实 → 下一责任人／动作 → 父级证据（顶层叶子为自身证据）→ Project 投影 → 四面回读',
  '只补远端确实缺失的步骤',
]) {
  assert.ok(ownerBody.includes(marker), `issue-workflow 缺少通用收口强制点「${marker}」`);
}

for (const marker of [
  '向回收对象写入最小增量证据',
  '已远端核验的当前状态',
  '`conditionId` 与 `sourceFactId` 的对应关系',
  '足以判断成功条件的一句话结论',
  '只链接、不跨 Issue 复制',
]) {
  assert.ok(
    issueWorkflowReferences.lifecycleClosure.includes(marker),
    `生命周期 reference 缺少父级证据语义预算「${marker}」`,
  );
}
for (const supersededLayoutRule of ['### 关闭前收割与父级证据厚度', '每个子项限一行']) {
  assert.ok(
    !issueWorkflowReferences.lifecycleClosure.includes(supersededLayoutRule),
    `生命周期 reference 仍保留不可执行的排版预算「${supersededLayoutRule}」`,
  );
}

const harvestReceiptCases = closureProtocol.harvestReceiptBudget.cases;
const harvestReceiptCaseIds = harvestReceiptCases.map(({ id }) => id);
for (const requiredCaseId of [
  'routine-parent-evidence-keeps-current-state-and-condition-mapping',
  'terminal-parent-evidence-records-verified-terminal-state',
  'single-physical-line-overweight-copy-is-rejected',
  'missing-condition-to-source-fact-mapping-is-rejected',
  'unverified-terminal-state-is-rejected',
]) {
  assert.ok(harvestReceiptCaseIds.includes(requiredCaseId), `父级证据夹具缺少 ${requiredCaseId}`);
}
for (const fixture of harvestReceiptCases) {
  assert.equal(resolveHarvestReceiptCase(fixture), fixture.expected, `${fixture.id}: 语义预算判定不符`);
}

const multilineSemanticReceipt = harvestReceiptCases.find(
  ({ id }) => id === 'routine-parent-evidence-keeps-current-state-and-condition-mapping',
)!;
assert.ok(multilineSemanticReceipt.conclusion.includes('\n'), '正例必须证明物理换行不构成排版预算');
assert.equal(
  resolveHarvestReceiptCase(multilineSemanticReceipt),
  'accept',
  '合规语义记录不能因为物理换行被拒绝',
);

const overweightReceipt = harvestReceiptCases.find(
  ({ id }) => id === 'single-physical-line-overweight-copy-is-rejected',
)!;
assert.ok(!overweightReceipt.conclusion.includes('\n'), '超厚反例必须保持单物理行以反证旧排版预算');
assert.equal(resolveHarvestReceiptCase(overweightReceipt), 'reject', '单物理行超厚回执必须失败');
assert.equal(
  resolveHarvestReceiptCase({
    ...structuredClone(multilineSemanticReceipt),
    copiedPayloads: ['child-body', 'step-by-step-process', 'complete-evidence-table'],
  }),
  'reject',
  '向合规正例注入子项正文、过程或完整证据表后必须失败',
);

for (const [skill, baselineBytes] of [
  ['issue-workflow', 47_144],
  ['operating-ledger-maintenance', 14_926],
  ['orchestrated-collaboration', 21_839],
] as const) {
  assert.ok(
    Buffer.byteLength(body.get(skill)!, 'utf8') <= baselineBytes,
    `${skill}: P0-2 必须以原位置换守住实施前正文 ${baselineBytes} UTF-8 字节基线`,
  );
}
assert.ok(
  !body.get('orchestrated-collaboration')!.includes('lifecycle-event-reentry.md'),
  'orchestrated-collaboration 不得再承载第三套可重入事务 reference',
);

// 自然续接必须从统一入口可达，并在同一状态机内返回父模式或落到明确终止态。
assert.ok(
  lifecycle.transitions.some(
    (transition) => transition.from === 'classify' && transition.to === 'natural-continuation',
  ),
  '判定入口缺少 natural-continuation 分支',
);
const naturalContinuationTargets = lifecycle.transitions
  .filter((transition) => transition.from === 'natural-continuation')
  .map((transition) => transition.to);
for (const required of [
  'parent',
  'exit-no-issue',
  'exit-natural',
  'record-evidence',
  'candidate',
  'decision-needed',
]) {
  assert.ok(
    naturalContinuationTargets.includes(required),
    `自然续接缺少 ${required} 出口`,
  );
}

// 顶层叶子必须有终点：回收按授权先进入关闭前蒸馏，也能在没有关闭授权时明确停止。
const reclaimTargets = lifecycle.transitions
  .filter((transition) => transition.from === 'reclaim')
  .map((transition) => transition.to);
for (const required of ['distill', 'stop']) {
  assert.ok(reclaimTargets.includes(required), `回收缺少 ${required} 出口：无父级叶子没有终点`);
}
const distillTargets = lifecycle.transitions
  .filter((transition) => transition.from === 'distill')
  .map((transition) => transition.to);
for (const required of ['close', 'stop']) {
  assert.ok(distillTargets.includes(required), `关闭前蒸馏缺少 ${required} 出口`);
}

// ---------- 6. 非 PR 交付、类型映射与压缩竞态夹具 ----------

const resolveDeliveryCase = (fixture: DeliveryCase): DeliveryCase['expectedNext'] => {
  if (!fixture.selfContained || !fixture.stableRemoteUrl) return 'blocked';
  if (fixture.artifact === 'draft-pr') return 'review';
  if (fixture.artifact === 'issue-body' && fixture.recoverableSnapshot !== true) return 'blocked';
  return 'reclaim';
};

const deliveryCaseIds = manifest.deliveryProtocol.cases.map((fixture) => fixture.id);
for (const required of [
  'code-change-draft-pr-enters-review',
  'comment-evidence-contract-enters-reclaim',
  'comment-without-stable-url-is-blocked',
  'body-maintenance-needs-recoverable-snapshot',
]) {
  assert.ok(deliveryCaseIds.includes(required), `交付协议缺少 ${required} 场景`);
}
for (const fixture of manifest.deliveryProtocol.cases) {
  assert.equal(resolveDeliveryCase(fixture), fixture.expectedNext, `${fixture.id}: 交付出口不符`);
}

const resolveDraftReadyCase = (fixture: DraftReadyCase): DraftReadyCase['expected'] =>
  fixture.actor === 'pr-integration' &&
  fixture.contractCurrent &&
  fixture.currentHeadBound &&
  fixture.checksSatisfied &&
  fixture.feedbackResolved &&
  fixture.authorized
    ? 'ready'
    : 'stay-draft';

const draftReadyCaseIds = manifest.deliveryProtocol.draftReadyCases.map((fixture) => fixture.id);
for (const required of [
  'integrator-promotes-after-all-gates',
  'delivery-author-cannot-promote',
  'missing-current-head-keeps-draft',
  'missing-ready-authorization-keeps-draft',
]) {
  assert.ok(draftReadyCaseIds.includes(required), `Draft → ready 协议缺少 ${required} 场景`);
}
for (const fixture of manifest.deliveryProtocol.draftReadyCases) {
  assert.equal(resolveDraftReadyCase(fixture), fixture.expected, `${fixture.id}: Draft → ready 结果不符`);
}

const expectedIssueTypeMappings: IssueTypeMapping[] = [
  { prefix: '目标：', label: '类型/目标', ledgerNode: '目标／诉求', usesExecutionStatus: false },
  { prefix: '诉求：', label: '类型/诉求', ledgerNode: '目标／诉求', usesExecutionStatus: false },
  { prefix: '交付：', label: '类型/交付', ledgerNode: '交付任务', usesExecutionStatus: true },
  { prefix: '实验：', label: '类型/实验', ledgerNode: '计划／实验', usesExecutionStatus: true },
  { prefix: '调研：', label: '类型/调研', ledgerNode: '计划／实验', usesExecutionStatus: true },
  { prefix: '摩擦：', label: '类型/摩擦', ledgerNode: '能力缺口', usesExecutionStatus: false },
  { prefix: '方案：', label: '类型/方案', ledgerNode: '计划／实验', usesExecutionStatus: true },
];
assert.deepEqual(manifest.issueTypeMappings, expectedIssueTypeMappings, '七类 Issue 到四种经营节点的映射不唯一');
assert.equal(new Set(manifest.issueTypeMappings.map((entry) => entry.prefix)).size, 7, 'Issue 前缀映射重复');
assert.equal(new Set(manifest.issueTypeMappings.map((entry) => entry.label)).size, 7, 'Issue label 映射重复');
assert.deepEqual(
  [...new Set(manifest.issueTypeMappings.map((entry) => entry.ledgerNode))].sort(),
  ['交付任务', '目标／诉求', '能力缺口', '计划／实验'].sort(),
  'Issue 类型映射必须恰好落到四种经营节点',
);

const objectiveBody = body.get('objective-to-issues')!;
for (const mapping of manifest.issueTypeMappings) {
  assert.ok(
    objectiveBody.includes(`| \`${mapping.prefix}\` | \`${mapping.label}\` | ${mapping.ledgerNode} | ${mapping.usesExecutionStatus ? '是' : '否'} |`),
    `${mapping.prefix}: objective-to-issues 缺少唯一映射表行`,
  );
}
for (const invariant of [
  '原生 sub-issue 关系只表达父子分解，不表示前置顺序或硬阻塞',
  '真实硬依赖必须使用 GitHub 原生 blocked-by／blocking 边表达',
  '正文只保留为何构成硬依赖的理由',
  '当前是否就绪从远端关系、授权与未决决定动态判定',
]) {
  assert.ok(objectiveBody.includes(invariant), `objective-to-issues 缺少依赖表达不变量：${invariant}`);
}
for (const forbidden of [
  'blocked-by 依赖、当前是否就绪及就绪条件',
  '保留清晰正文和阻塞状态',
]) {
  assert.ok(!objectiveBody.includes(forbidden), `objective-to-issues 不得保留冲突的依赖表述：${forbidden}`);
}
assert.ok(
  body.get('operating-ledger-maintenance')!.includes('只在 `objective-to-issues` 第三节“七类创建类型到四种经营节点的唯一映射”表维护'),
  'operating-ledger-maintenance 必须引用唯一类型映射表',
);

const resolveCompactionCase = (fixture: CompactionCase): CompactionCase['expected'] => {
  if (fixture.actor !== fixture.declaredOwner) return 'reject-not-owner';
  if (!fixture.snapshotPersisted || !fixture.snapshotVerified) return 'reject-no-snapshot';
  if (fixture.snapshottedVersion !== fixture.latestVersion) return 'reject-stale';
  return 'write';
};

const compactionCaseIds = manifest.compactionProtocol.cases.map((fixture) => fixture.id);
for (const required of [
  'owner-writes-from-verified-snapshot',
  'second-writer-is-rejected',
  'missing-snapshot-is-rejected',
  'version-change-after-snapshot-is-rejected',
]) {
  assert.ok(compactionCaseIds.includes(required), `正文压缩协议缺少 ${required} 场景`);
}
for (const fixture of manifest.compactionProtocol.cases) {
  assert.equal(resolveCompactionCase(fixture), fixture.expected, `${fixture.id}: 正文压缩竞态结果不符`);
}

// ---------- 7. 决定短回复必须先绑定可信主体，再绑定唯一合同 ----------

const decisionProtocol = manifest.decisionProtocol;
assert.equal(decisionProtocol.owner, manifest.driver, '决定协议必须由生命周期驱动者拥有');
assert.deepEqual(
  [...decisionProtocol.requestKinds].sort(),
  ['authorization-gate', 'product-tradeoff'],
  '决定请求必须区分普通授权门与产品取舍',
);
for (const field of ['已授权', '未授权', '下一责任人', '下一动作', '纠正入口']) {
  assert.ok(decisionProtocol.receiptFields.includes(field), `决定回执缺少 ${field}`);
}

const isTrustedDecisionPrincipal = (fixture: DecisionPrincipalCase): boolean =>
  fixture.author.type === 'User' &&
  (fixture.author.login === fixture.repositoryOwnerLogin ||
    fixture.explicitOwnerLogins.includes(fixture.author.login));

const principalCaseIds = decisionProtocol.principalCases.map((fixture) => fixture.id);
assert.deepEqual(
  [...new Set(decisionProtocol.trustedPrincipalLogins)].sort(),
  ['Eridanus117', 'explicit-owner'],
  '授权主体清单必须只包含仓库所有者与合同明示负责人夹具',
);
for (const required of [
  'repository-owner-user-is-trusted',
  'explicit-owner-user-is-trusted',
  'bot-cannot-authorize',
  'app-cannot-authorize',
  'other-user-cannot-authorize',
]) {
  assert.ok(principalCaseIds.includes(required), `授权主体协议缺少 ${required} 场景`);
}
for (const fixture of decisionProtocol.principalCases) {
  if (fixture.expectedTrusted) {
    assert.ok(
      decisionProtocol.trustedPrincipalLogins.includes(fixture.author.login),
      `${fixture.id}: 可信夹具必须列入授权主体清单`,
    );
  }
  assert.equal(
    isTrustedDecisionPrincipal(fixture),
    fixture.expectedTrusted,
    `${fixture.id}: 授权主体身份判定不符`,
  );
}

const unquotedReply = (value: string): string => {
  const lines: string[] = [];
  let inQuote = false;
  for (const line of value.split('\n')) {
    if (/^\s*>/u.test(line)) {
      inQuote = true;
      continue;
    }
    if (inQuote) {
      if (line.trim() === '') inQuote = false;
      continue;
    }
    lines.push(line);
  }
  return lines.join('\n').trim();
};

const resolveDecisionCase = (fixture: DecisionCase): DecisionExpected => {
  const reply = unquotedReply(fixture.reply);
  if (!reply) return { outcome: 'no-authorization' };

  const active = fixture.activeDecisionIds;
  const receipted = new Set(fixture.receiptedDecisionIds ?? []);
  const explicit = /^(批准|否决|修改|澄清|修正)\s+([0-9]+-[A-Za-z0-9-]+)(?:[：:，,]\s*(.+))?$/u.exec(reply);
  if (explicit) {
    const [, verb, targetDecisionId, condition] = explicit;
    if (verb === '修正') {
      if (!condition || !receipted.has(targetDecisionId)) return { outcome: 'clarify' };
      return {
        outcome: 'correct-receipt',
        targetDecisionId,
        invalidatesReceipt: true,
        createsAuthorization: false,
        freezeAffectedPaths: true,
      };
    }
    if (!active.includes(targetDecisionId)) return { outcome: 'clarify' };
    if (receipted.has(targetDecisionId)) {
      return { outcome: 'already-receipted', targetDecisionId };
    }
    if (verb === '澄清' || verb === '修改') return { outcome: 'no-authorization' };
    if (verb === '否决') {
      return { outcome: 'bind', targetDecisionId, action: 'reject' };
    }
    if (condition) {
      if (fixture.conditionEffect !== 'narrows') return { outcome: 'clarify' };
      return { outcome: 'bind', targetDecisionId, action: 'conditional-approve' };
    }
    return { outcome: 'bind', targetDecisionId, action: 'approve' };
  }

  const uniquelyAdjacent =
    active.length === 1 && active[0] === fixture.adjacentDecisionId;
  if (reply === '同意') {
    if (!uniquelyAdjacent) return { outcome: 'clarify' };
    const targetDecisionId = active[0];
    if (receipted.has(targetDecisionId)) {
      return { outcome: 'already-receipted', targetDecisionId };
    }
    return { outcome: 'bind', targetDecisionId, action: 'approve' };
  }

  if (/^[A-Z]$/u.test(reply)) {
    if (!uniquelyAdjacent || !fixture.options.includes(reply)) return { outcome: 'clarify' };
    const targetDecisionId = active[0];
    if (receipted.has(targetDecisionId)) {
      return { outcome: 'already-receipted', targetDecisionId };
    }
    return {
      outcome: 'bind',
      targetDecisionId,
      action: 'select-option',
      selection: reply,
    };
  }

  return { outcome: 'no-authorization' };
};

const decisionCaseIds = decisionProtocol.cases.map((fixture) => fixture.id);
assert.equal(new Set(decisionCaseIds).size, decisionCaseIds.length, '决定协议场景 id 重复');
for (const required of [
  'unique-option-b',
  'unique-agree-after-quote',
  'multiple-decisions-make-agree-ambiguous',
  'parallel-same-format-groups-forbid-adjacency',
  'quoted-approval-is-context-only',
  'quoted-lazy-continuation-is-context-only',
  'conditional-approval-narrows-scope',
  'conditional-approval-cannot-expand-scope',
  'modification-proposes-boundary-without-authorizing',
  'correction-supersedes-existing-receipt',
  'correction-without-existing-receipt-does-not-authorize',
  'receipt-prevents-repeat',
]) {
  assert.ok(decisionCaseIds.includes(required), `决定协议缺少 ${required} 场景`);
}
const realShortReply = decisionProtocol.cases.find((fixture) => fixture.id === 'unique-option-b')!;
assert.match(realShortReply.source ?? '', /\/agent-control\/issues\/16#issuecomment-/u);
assert.match(realShortReply.receiptSource ?? '', /\/agent-control\/issues\/16#issuecomment-/u);
for (const fixture of decisionProtocol.cases) {
  for (const decisionId of [
    ...fixture.activeDecisionIds,
    ...(fixture.receiptedDecisionIds ?? []),
  ]) {
    assert.match(
      decisionId,
      /^\d+-[A-Za-z0-9-]+$/u,
      `${fixture.id}: 决定编号必须带 Issue 号前缀`,
    );
  }
  assert.deepEqual(
    resolveDecisionCase(fixture),
    fixture.expected,
    `${fixture.id}: 自然回复解析结果不符`,
  );
}

const resolveOwnerActionCase = (fixture: OwnerActionCase): OwnerActionExpected => {
  assert.ok(fixture.next.responsible.trim(), `${fixture.id}: 缺少下一责任人`);
  assert.ok(fixture.next.action.trim(), `${fixture.id}: 缺少下一动作`);

  const currentOwnerActions = fixture.actions.filter(
    (action) => action.current && action.explicit && !action.consumed,
  );
  const closeSourceIssue =
    fixture.sourceIssueComplete &&
    (fixture.closeAuthorized || fixture.closePreauthorizationSatisfied === true);
  let closeAuthorizationRequestId: string | undefined;
  if (fixture.sourceIssueComplete && !closeSourceIssue && currentOwnerActions.length === 0) {
    assert.ok(fixture.sourceIssueNumber, `${fixture.id}: 缺少稳定关闭请求所需的来源 Issue 编号`);
    closeAuthorizationRequestId = `${fixture.sourceIssueNumber}-CLOSE`;
    assert.equal(fixture.next.responsible, '负责人', `${fixture.id}: 关闭授权请求的下一责任人必须是负责人`);
    assert.ok(
      fixture.next.action.includes(closeAuthorizationRequestId),
      `${fixture.id}: 下一动作必须携带稳定关闭请求编号`,
    );
    currentOwnerActions.push({
      id: closeAuthorizationRequestId,
      current: true,
      explicit: true,
      consumed: false,
      kind: 'decision',
    });
  }

  const workflowFacts: WorkflowOwnerFacts = {
    currentOwnerActionIds: currentOwnerActions.map((action) => action.id),
    ...(closeAuthorizationRequestId ? { closeAuthorizationRequestId } : {}),
    closeSourceIssue,
  };

  let status: LedgerProjection['status'];
  if (closeSourceIssue) {
    assert.equal(currentOwnerActions.length, 0, `${fixture.id}: 关闭来源 Issue 时不能遗留负责人动作`);
    status = '完成';
  } else if (currentOwnerActions.length > 0) {
    status = currentOwnerActions.some((action) => action.kind === 'acceptance') ? '验收中' : '待决定';
  } else if (fixture.next.phase === 'ready') {
    status = '就绪';
  } else {
    assert.equal(fixture.next.phase, 'in-progress', `${fixture.id}: 非等待、未关闭事项必须有真实执行状态`);
    status = '进行中';
  }

  return {
    workflowFacts,
    ledgerProjection: {
      waitingOwner: currentOwnerActions.length > 0,
      status,
    },
  };
};

const ownerActionCaseIds = decisionProtocol.ownerActionCases.map((fixture) => fixture.id);
assert.equal(new Set(ownerActionCaseIds).size, ownerActionCaseIds.length, '负责人动作场景 id 重复');
for (const required of [
  'consumed-decision-clears-waiting',
  'unconsumed-owner-action-keeps-waiting',
  'unconsumed-owner-decision-keeps-waiting',
  'executor-only-next-action-is-not-waiting',
  'superseded-or-implicit-action-does-not-wait',
  'authorized-complete-source-closes',
  'preauthorized-complete-source-closes',
  'complete-source-without-close-authorization-requests-close',
]) {
  assert.ok(ownerActionCaseIds.includes(required), `负责人动作协议缺少 ${required} 场景`);
}
for (const fixture of decisionProtocol.ownerActionCases) {
  for (const action of fixture.actions) {
    assert.match(action.id, /^\d+-[A-Za-z0-9-]+$/u, `${fixture.id}: 负责人动作编号必须带 Issue 号前缀`);
  }
  assert.deepEqual(
    resolveOwnerActionCase(fixture),
    fixture.expected,
    `${fixture.id}: 等待负责人／收口投影结果不符`,
  );
}

const ownerProjectionSection = issueWorkflowReferences.lifecycleClosure
  .split('#### 等待负责人只投影当前未消费动作')[1]
  .split('#### 消费决定沿用通用收口')[0];
for (const projectFieldValue of ['`待决定`', '`验收中`', '`就绪`', '`进行中`', '`完成`']) {
  assert.ok(
    !ownerProjectionSection.includes(projectFieldValue),
    `issue-workflow 不得复制 Project 字段取值 ${projectFieldValue}`,
  );
}

// ---------- 7.5. 摩擦登记反事实钩子必须由活性行为正反例约束 ----------

// 注释和代码块都是非活性说明；它们不能替代实际会指导 Agent 的规则。
const activeMarkdownContract = (text: string): string =>
  contractText(
    text
      .replace(/<!--[\s\S]*?(?:-->|$)/gu, '')
      .replace(/```[\s\S]*?```/gu, '')
      .replace(/~~~[\s\S]*?~~~/gu, ''),
  );

const frictionRegistrationRequired = [
  '登记摩擦时必须回答「本坑可否被一次能力面调研提前排掉」',
  '把结论用一句话写入摩擦正文',
  '结论须指向对应工具',
  '只作为本节既有最小去向判断的证据',
  '调研候选仍按上述收件箱准入形成',
  '不另设欠账计数器',
  '不自动开工',
];

const frictionRegistrationOppositeRules = [
  /(?:无需|不必|可以不|允许不)回答/u,
  /(?:只|仅)(?:在)?评论/u,
  /结构性欠账/u,
  /欠账(?:累计|阈值)/u,
  /累计\s*(?:≥|>=|达到|两次)/u,
  /(?:允许|可以|应当|必须|将|会)自动(?:开工|启动|派发|进入(?:就绪|进行中))/u,
];

const validFrictionRegistrationContract = (text: string): boolean => {
  const active = activeMarkdownContract(text);
  return (
    frictionRegistrationRequired.every((needle) => active.includes(contractText(needle))) &&
    frictionRegistrationOppositeRules.every((rule) => !rule.test(active))
  );
};

const frictionRegistrationCaseIds = manifest.frictionRegistrationProtocol.cases.map(
  (fixture) => fixture.id,
);
assert.deepEqual(
  frictionRegistrationCaseIds,
  [
    'active-compliant-contract',
    'missing-friction-body-conclusion',
    'comment-anchors-with-live-violation',
    'opposite-live-rule-after-compliant-rule',
  ],
  '摩擦登记夹具必须同时覆盖合规正文、行为缺失、注释假锚点和相反活性规则',
);
assert.deepEqual(
  manifest.frictionRegistrationProtocol.cases.map((fixture) => fixture.expectedValid),
  [true, false, false, false],
  '摩擦登记夹具必须保持一项正例和三项会失败的反例',
);
for (const fixture of manifest.frictionRegistrationProtocol.cases) {
  assert.equal(
    validFrictionRegistrationContract(fixture.body),
    fixture.expectedValid,
    `${fixture.id}: 违例正文必须失败且合规正文必须通过`,
  );
}
assert.ok(
  validFrictionRegistrationContract(contractBody.get('operating-ledger-maintenance')!),
  '经营总账摩擦登记正文必须通过行为性反事实钩子检查',
);

// ---------- 7.6. 验收场景必须在正文中有可定位的落点 ----------
//
// `mustContain` 断言规则确实存在；`mustNotContain` 断言规则没有用会过期的方式表达。
// 后者用于「后端中立」这类只能反向证明的约束：正文写死某个客户端的命令，规则就会随
// 那个客户端的接口一起过期，因此把它作为失败条件而不是评审口头约定。

const scenarioIds = manifest.scenarios.map((scenario) => scenario.id);
assert.equal(new Set(scenarioIds).size, scenarioIds.length, '场景 id 重复');
assert.ok(scenarioIds.length >= 5, '验收场景少于 Issue 要求的覆盖面');

for (const scenario of manifest.scenarios) {
  assert.ok(scenario.checks.length > 0, `${scenario.id}: 没有任何落点`);
  for (const check of scenario.checks) {
    const text = contractBody.get(check.skill);
    assert.ok(text, `${scenario.id}: 未知 Skill ${check.skill}`);
    for (const needle of check.mustContain) {
      assert.ok(
        containsContractText(text, needle),
        `${scenario.id} / ${check.skill}: 缺少「${needle}」`,
      );
    }
    for (const needle of check.mustNotContain ?? []) {
      assert.ok(!text.includes(needle), `${scenario.id} / ${check.skill}: 不应出现「${needle}」`);
    }
  }
}

// RFC 3339 原始标量经宿主本地化后可能表示不同；投影规则只接受原始标量，并保留源精度。
const rfc3339 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/;
const normalizedGithubInstant = (value: string, side: 'before' | 'after'): [bigint, string] => {
  const match = rfc3339.exec(value);
  assert.ok(match, `${side} 必须是 GitHub 原始 RFC 3339 标量`);
  const [, year, month, day, hour, minute, second, fraction = '', offset] = match;
  const epochMilliseconds = Date.parse(
    `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`,
  );
  assert.ok(Number.isFinite(epochMilliseconds), `${side} 必须是有效的 RFC 3339 时刻`);
  return [BigInt(epochMilliseconds / 1000), fraction.replace(/0+$/, '')];
};
const sameGithubInstant = (before: string, after: string): boolean => {
  const normalizedBefore = normalizedGithubInstant(before, 'before');
  const normalizedAfter = normalizedGithubInstant(after, 'after');
  if (before === after) return true;
  return (
    normalizedBefore[0] === normalizedAfter[0] &&
    normalizedBefore[1] === normalizedAfter[1]
  );
};

const githubTimestamp = '2026-08-11T00:32:14Z';
assert.equal(
  JSON.parse(`{"updatedAt":"${githubTimestamp}"}`).updatedAt,
  githubTimestamp,
  '原始序列化标量快照必须保留 GitHub 返回值',
);
assert.ok(
  sameGithubInstant(githubTimestamp, '2026-08-11T00:32:14.000Z'),
  '同一瞬间的合法 RFC 3339 表示不应被误判为远端变化',
);
assert.ok(
  sameGithubInstant(githubTimestamp, '2026-08-10T20:32:14-04:00'),
  '带明确偏移量的等价 RFC 3339 表示应规范化为同一瞬间',
);
assert.throws(
  () => sameGithubInstant(githubTimestamp, '8/10/2026 8:32:14 PM'),
  /after 必须是 GitHub 原始 RFC 3339 标量/,
  '本地文化 DateTime 字符串不能进入一致性判断',
);
assert.throws(
  () => sameGithubInstant('8/10/2026 8:32:14 PM', '8/10/2026 8:32:14 PM'),
  /before 必须是 GitHub 原始 RFC 3339 标量/,
  '两个相同的本地文化 DateTime 字符串也必须在 equality 短路前失败',
);
assert.equal(
  sameGithubInstant('2026-08-11T00:32:14.1234567Z', '2026-08-11T00:32:14.1239999Z'),
  false,
  '规范化不得因宿主毫秒精度上限把不同源精度误判为同一瞬间',
);

// ---------- 8. 两端 manifest、版本与发现目录一致 ----------

for (const plugin of pluginNames) {
  const expected = manifest.pluginVersions[plugin];
  assert.ok(expected, `${plugin}: tests/workflow-routing.json 未记录版本`);
  for (const directory of ['.claude-plugin', '.codex-plugin']) {
    const metadata = JSON.parse(read(join(pluginsRoot, plugin, directory, 'plugin.json')));
    assert.equal(metadata.name, plugin, `${plugin}/${directory}: name 与目录名不符`);
    assert.equal(metadata.version, expected, `${plugin}/${directory}: 版本与声明不符`);
  }
  const claude = JSON.parse(read(join(pluginsRoot, plugin, '.claude-plugin', 'plugin.json')));
  const codex = JSON.parse(read(join(pluginsRoot, plugin, '.codex-plugin', 'plugin.json')));
  assert.equal(claude.version, codex.version, `${plugin}: 两端版本不一致`);
  assert.equal(claude.description, codex.description, `${plugin}: 两端描述不一致`);
}

const claudeMarketplace = JSON.parse(read(join(repoRoot, '.claude-plugin', 'marketplace.json')));
const codexMarketplace = JSON.parse(read(join(repoRoot, '.agents', 'plugins', 'marketplace.json')));

const claudeListed = claudeMarketplace.plugins.map((entry: { name: string }) => entry.name).sort();
const codexListed = codexMarketplace.plugins.map((entry: { name: string }) => entry.name).sort();
assert.deepEqual(claudeListed, [...pluginNames].sort(), 'Claude 发现目录与实际 Plugin 不一致');
assert.deepEqual(codexListed, [...pluginNames].sort(), 'Codex 发现目录与实际 Plugin 不一致');

for (const entry of claudeMarketplace.plugins as { name: string; source: string }[]) {
  assert.equal(entry.source, `./plugins/${entry.name}`, `${entry.name}: Claude 发现目录 source 路径不正确`);
}
for (const entry of codexMarketplace.plugins as { name: string; source: { path: string } }[]) {
  assert.equal(entry.source.path, `./plugins/${entry.name}`, `${entry.name}: Codex 发现目录 source 路径不正确`);
}

type MarketplaceEntry = { name: string; version?: string; description?: string };
const claudeEntries = claudeMarketplace.plugins as MarketplaceEntry[];
const codexEntries = codexMarketplace.plugins as MarketplaceEntry[];
for (const plugin of pluginNames) {
  const expected = manifest.pluginVersions[plugin];
  const claudeEntry = claudeEntries.find((entry) => entry.name === plugin);
  const codexEntry = codexEntries.find((entry) => entry.name === plugin);
  assert.ok(claudeEntry, `${plugin}: Claude Marketplace 缺少条目`);
  assert.ok(codexEntry, `${plugin}: Codex Marketplace 缺少条目`);
  assert.equal(claudeEntry.version, expected, `${plugin}: Claude Marketplace 版本与声明不一致`);
  assert.equal(codexEntry.version, expected, `${plugin}: Codex Marketplace 版本与声明不一致`);
}

const claudeGithub = claudeEntries.find(
  (entry) => entry.name === 'github-collaboration',
)!;
const codexGithub = codexEntries.find(
  (entry) => entry.name === 'github-collaboration',
)!;
const githubManifest = JSON.parse(
  read(join(pluginsRoot, 'github-collaboration', '.codex-plugin', 'plugin.json')),
);
assert.equal(
  claudeGithub.description,
  githubManifest.description,
  'github-collaboration: Claude Marketplace 描述与 manifest 不一致',
);
assert.equal(
  codexGithub.description,
  githubManifest.description,
  'github-collaboration: Codex Marketplace 描述与 manifest 不一致',
);
// ---------- 8.5 生命周期声明与复杂度预算（docs/lifecycle.md）----------

// 知识有失效条件、最少复核步骤，做不到就退出当前知识；Skill 一直没有这一层，
// 发布即永远有效。下面把「必须声明」这一半变成机械门：CI 只能判定声明是否存在
// 且非空，判定不了内容是否真实——后者归复核本身。

type SkillLifecycleEntry = {
  invalidatedWhen: string;
  minimalRecheck: string;
  lastVerified: string | null;
  suspect: boolean;
  suspectReason?: string;
  suspectSince?: string;
};

const skillLifecycle = manifest.skillLifecycle?.entries as
  | Record<string, SkillLifecycleEntry>
  | undefined;
assert.ok(skillLifecycle, 'tests/workflow-routing.json 缺少 skillLifecycle.entries');
assert.deepEqual(
  Object.keys(skillLifecycle).sort(),
  [...declared].sort(),
  'skillLifecycle 必须恰好覆盖全部 Skill：新增 Skill 必须同时声明失效条件与最少复核步骤',
);
for (const [skill, entry] of Object.entries(skillLifecycle)) {
  // 长度下限不是形式主义：「过时了」「重新读一遍」这类占位串通不过一句可执行的动作描述。
  assert.ok(
    typeof entry.invalidatedWhen === 'string' && entry.invalidatedWhen.trim().length >= 20,
    `${skill}: 必须声明可观察的失效条件`,
  );
  assert.ok(
    typeof entry.minimalRecheck === 'string' && entry.minimalRecheck.trim().length >= 20,
    `${skill}: 必须声明别人能照做的最少复核步骤`,
  );
  assert.ok(
    entry.lastVerified === null || /^\d{4}-\d{2}-\d{2}$/.test(entry.lastVerified),
    `${skill}: lastVerified 必须是 null 或 YYYY-MM-DD`,
  );
  assert.equal(typeof entry.suspect, 'boolean', `${skill}: suspect 必须是布尔`);
  if (entry.suspect) {
    // 标记为存疑却说不出哪条失效条件命中、什么时候命中的，等于没标记。
    assert.ok(
      entry.suspectReason && entry.suspectReason.trim().length >= 10,
      `${skill}: suspect 为真时必须写明命中了哪一条失效条件`,
    );
    assert.ok(
      entry.suspectSince && /^\d{4}-\d{2}-\d{2}$/.test(entry.suspectSince),
      `${skill}: suspect 为真时必须写明命中日期`,
    );
  }
}

// 两个 Skill 声明出一模一样的失效条件，几乎只有两种来源：复制粘贴没改，或者某次
// 批量改写把别人的值覆盖了过来。2026-08-15 真发生过后者——一个按名字定位的改写脚本
// 把三对编辑全落到了同一条上，issue-workflow 的声明被 adaptive-problem-solving 的
// 覆盖，而目标三条一条没改到。生成的选型面把它显示出来才被发现。这道断言让它下次
// 在 CI 就撞上。
const invalidationTexts = new Map<string, string>();
for (const [skill, entry] of Object.entries(skillLifecycle)) {
  const previous = invalidationTexts.get(entry.invalidatedWhen);
  assert.ok(
    !previous,
    `${skill} 与 ${previous} 的失效条件逐字相同：要么是复制粘贴没改，要么是某次改写覆盖了别人的值`,
  );
  invalidationTexts.set(entry.invalidatedWhen, skill);
}

const budget = manifest.complexityBudget as {
  unit: string;
  maxSkills: number;
  corpusMaxUtf8Bytes: number;
};
assert.ok(budget, 'tests/workflow-routing.json 缺少 complexityBudget');
assert.equal(budget.unit, 'utf8-bytes', '复杂度预算量纲必须是 UTF-8 字节');
assert.ok(
  declared.length <= budget.maxSkills,
  `Skill 数量 ${declared.length} 超过上限 ${budget.maxSkills}：新增必须同时给出被退役的对象，或由负责人批准提高上限并在 Issue 留下理由`,
);

// 语料 = 会被当作 Skill 加载进上下文的字节。同时覆盖 references/，否则把正文挪进
// references 就能绕过预算。docs/ 与 README 写给人看，不计入。
let corpusBytes = 0;
for (const plugin of pluginNames) {
  const skillsRoot = join(pluginsRoot, plugin, 'skills');
  if (!existsSync(skillsRoot)) continue;
  for (const skill of directories(skillsRoot)) {
    corpusBytes += Buffer.byteLength(read(join(skillsRoot, skill, 'SKILL.md')), 'utf8');
    const referencesRoot = join(skillsRoot, skill, 'references');
    if (!existsSync(referencesRoot)) continue;
    for (const file of readdirSync(referencesRoot)) {
      if (file.endsWith('.md')) {
        corpusBytes += Buffer.byteLength(read(join(referencesRoot, file)), 'utf8');
      }
    }
  }
}
assert.ok(
  corpusBytes <= budget.corpusMaxUtf8Bytes,
  `Skill 语料 ${corpusBytes} UTF-8 字节，超过上限 ${budget.corpusMaxUtf8Bytes}：正确动作是给出被压缩或退役的对象，不是把数字改大`,
);

// ---------- 8.6 选型面是生成产物，不能与来源漂移 ----------

// docs/skills-overview.md 写给负责人。它由 scripts/skills-overview.ts 从
// pluginVersions、skillLifecycle、skillOverview 与实测字节生成。这里重新生成
// 一次并与提交在仓里的文件比对——文档一旦能被手改就会漂，而这正是
// docs/lifecycle.md 要防的东西，选型面自己也得守这条。
assert.deepEqual(
  Object.keys(manifest.skillOverview.entries).sort(),
  [...declared].sort(),
  'skillOverview 必须恰好覆盖全部 Skill：新增 Skill 必须同时给出写给负责人的三句话',
);
for (const [skill, entry] of Object.entries(
  manifest.skillOverview.entries as Record<string, Record<string, string>>,
)) {
  for (const field of ['forYou', 'whenToUse', 'workingSignals']) {
    assert.ok(
      typeof entry[field] === 'string' && entry[field].trim().length >= 10,
      `${skill}: 选型面缺少 ${field}`,
    );
  }
}
const overviewPath = join(repoRoot, 'docs', 'skills-overview.md');
assert.ok(existsSync(overviewPath), 'docs/skills-overview.md 必须存在');
assert.equal(
  read(overviewPath),
  renderSkillsOverview(),
  'docs/skills-overview.md 与来源不一致：它是生成产物，请跑 node scripts/skills-overview.ts --write，不要手改',
);

// ---------- 9. README 的版本总览不能落后于 manifest ----------

// 只钉「仓库目前包含…」这一句总览。README 其余段落是历史叙述，记录某个版本当时做了
// 什么，不随新版本改写。原实现对全文做 includes：一旦某个历史段落写出同样的
// `插件` `版本` 形态——第 15 行「`adaptive-problem-solving` `0.2.10` 与
// `orchestrated-collaboration` `0.2.4`」已是先例——总览行落后也检测不出来。
const readme = read(join(repoRoot, 'README.md'));
const overviewLines = readme.split('\n').filter((line) => line.includes('仓库目前包含'));
assert.equal(overviewLines.length, 1, 'README 必须有且只有一句「仓库目前包含…」的版本总览');
const overview = overviewLines[0];
for (const [plugin, version] of Object.entries(manifest.pluginVersions)) {
  assert.ok(
    overview.includes(`\`${plugin}\` \`${version}\``),
    `README 版本总览未记录 ${plugin} ${version}`,
  );
}
// 总览多列一个已删除的 Plugin 时，上面的逐项检查不会失败；用数量兜住。
const overviewPairs = overview.match(/`[a-z][a-z-]*` `\d+\.\d+\.\d+`/g) ?? [];
assert.equal(
  overviewPairs.length,
  pluginNames.length,
  `README 版本总览列出 ${overviewPairs.length} 个 Plugin，实际 ${pluginNames.length} 个`,
);
for (const skill of declared) {
  assert.ok(readme.includes(skill), `README 未提及 Skill ${skill}`);
}

console.log(`PASS: ${declared.length} 个 Skill、${pluginNames.length} 个 Plugin、${manifest.scenarios.length} 个验收场景`);
