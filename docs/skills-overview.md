<!-- 生成产物：node scripts/skills-overview.ts --write。不要手改；
     三句话的来源是 tests/workflow-routing.json 的 skillOverview。 -->

# Skill 选型面

写给负责人：每个 Skill 替你做什么、什么时候会用到、你怎么看出它在起作用，
以及它花掉多少复杂度预算。**行为的唯一来源仍是各自的 `SKILL.md`**，本页不承载行为。

当前 12 个 Skill，共 208,420 字节，占复杂度预算 99.7%。

| Skill | 版本 | 体积 | 占预算 | 上次复核 |
| --- | --- | ---: | ---: | --- |
| [issue-workflow](#issue-workflow) | 0.3.18 | 60.1 KB | 29.5% | 2026-08-15 |
| [adaptive-problem-solving](#adaptive-problem-solving) | 0.2.11 | 22.0 KB | 10.8% | 2026-08-15 |
| [orchestrated-collaboration](#orchestrated-collaboration) | 0.2.6 | 21.2 KB | 10.4% | 2026-08-15 |
| [self-improvement](#self-improvement) | 0.1.6 | 16.3 KB | 8.0% | 2026-08-15 |
| [pr-integration](#pr-integration) | 0.3.18 | 15.6 KB | 7.7% | 2026-08-15 |
| [issue-delivery](#issue-delivery) | 0.3.18 | 15.2 KB | 7.4% | 2026-08-15 |
| [objective-to-issues](#objective-to-issues) | 0.3.18 | 13.0 KB | 6.4% | 2026-08-15 |
| [operating-ledger-maintenance](#operating-ledger-maintenance) | 0.3.18 | 11.5 KB | 5.6% | 2026-08-15 |
| [resource-observability](#resource-observability) | 0.2.4 | 9.7 KB | 4.8% | 2026-08-15 |
| [issue-contract-compaction](#issue-contract-compaction) | 0.3.18 | 8.6 KB | 4.2% | 2026-08-15 |
| [knowledge-maintenance](#knowledge-maintenance) | 0.1.3 | 6.3 KB | 3.1% | 2026-08-15 |
| [grilling](#grilling) | 0.1.2 | 3.9 KB | 1.9% | 2026-08-15 |

## issue-workflow

**它替你做什么** 让任何一个 Session 只凭远端 Issue 就知道自己该干什么、干到哪、能不能关。

**什么时候用** 手上有明确 Issue 时。没有 Issue 时它不挑活，会退回经营总账。

**你怎么知道它在起作用** Issue 上出现状态判定与关闭回执，且全链只有它一处作出这个判定。

**什么会让它失效** 方法登记面的证据等级分布与登记面 README 声明不符；或三端 description 可见预算的实测基线（2026-08-11 测得 1000 UTF-8 字节）被新的实测推翻。

所属 Plugin `github-collaboration` `0.3.18`｜体积 60.1 KB（占预算 29.5%）｜上次复核 2026-08-15｜正文 [`plugins/github-collaboration/skills/issue-workflow/SKILL.md`](../plugins/github-collaboration/skills/issue-workflow/SKILL.md)

## adaptive-problem-solving

**它替你做什么** 问题求解治理：选方法、控成本、该退出就退出，别在一条路上耗死。

**什么时候用** 第一次实质路径选择、进展停滞、范围明显扩大或要交接验收时。

**你怎么知道它在起作用** 方向变了会明确说出来；没变就直接继续，不额外汇报。

**什么会让它失效** 方法登记面的证据等级分布与正文声明不符，或三端 description 实测可见预算低于 1000 UTF-8 字节。

所属 Plugin `adaptive-problem-solving` `0.2.11`｜体积 22.0 KB（占预算 10.8%）｜上次复核 2026-08-15｜正文 [`plugins/adaptive-problem-solving/skills/adaptive-problem-solving/SKILL.md`](../plugins/adaptive-problem-solving/skills/adaptive-problem-solving/SKILL.md)

## orchestrated-collaboration

**它替你做什么** 多 Agent、多 Session 时的写入所有权、派发合同与独立验收。

**什么时候用** 已授权的多席协作或共享写入碰撞。单 Session 不触发。

**你怎么知道它在起作用** Issue 上出现类型化派发合同，以及与实施者不同的独立验收回执。

**什么会让它失效** 所选协调后端（当前 orca orchestration）的 Run／Task／Dispatch 语义或标准释放回执格式变化，使派发合同与收口判据无法从执行事实判定。

所属 Plugin `orchestrated-collaboration` `0.2.6`｜体积 21.2 KB（占预算 10.4%）｜上次复核 2026-08-15｜正文 [`plugins/orchestrated-collaboration/skills/orchestrated-collaboration/SKILL.md`](../plugins/orchestrated-collaboration/skills/orchestrated-collaboration/SKILL.md)

## self-improvement

**它替你做什么** 把一次纠正变成系统改进，并判断该改入口、改 Skill 还是只记任务。

**什么时候用** 你指出漂移、误解，或同类错误复发时。一次性小错不触发。

**你怎么知道它在起作用** 纠正落到某个持久载体，而不只是当次口头改了。

**什么会让它失效** 入口、Skill、任务记录三个改进承载面之一消失或职责变更，使路由判据指向不存在的去向。

所属 Plugin `self-improvement` `0.1.6`｜体积 16.3 KB（占预算 8.0%）｜上次复核 2026-08-15｜正文 [`plugins/self-improvement/skills/self-improvement/SKILL.md`](../plugins/self-improvement/skills/self-improvement/SKILL.md)

## pr-integration

**它替你做什么** 分支维护与合并前核对，防止把冲突或落后的分支合进主干。

**什么时候用** 要合并，或分支落后于主干时。

**你怎么知道它在起作用** 合并前有冲突逐项处理与相称验证，合并后只做 fast-forward。

**什么会让它失效** 分支保护、合并策略或 force-push 的 lease 保护语义变化，使正文的分支维护步骤不再安全。

所属 Plugin `github-collaboration` `0.3.18`｜体积 15.6 KB（占预算 7.7%）｜上次复核 2026-08-15｜正文 [`plugins/github-collaboration/skills/pr-integration/SKILL.md`](../plugins/github-collaboration/skills/pr-integration/SKILL.md)

## issue-delivery

**它替你做什么** 叶子 Issue 出 PR 前的工程检查与 PR 现状快照，避免拿没跑过的东西当交付。

**什么时候用** 手上的叶子 Issue 要出 PR 时。

**你怎么知道它在起作用** PR 描述里有覆盖维度、实际运行了什么、以及剩余验证缺口。

**什么会让它失效** PR 创建、审阅请求或必需检查的语义变化，使交付前核对无法只从远端事实判定。

所属 Plugin `github-collaboration` `0.3.18`｜体积 15.2 KB（占预算 7.4%）｜上次复核 2026-08-15｜正文 [`plugins/github-collaboration/skills/issue-delivery/SKILL.md`](../plugins/github-collaboration/skills/issue-delivery/SKILL.md)

## objective-to-issues

**它替你做什么** 新建 Issue 一次到位：七类前缀、类型与领域标签、父级、运营台条目同批完成。

**什么时候用** 要新建 Issue 时。

**你怎么知道它在起作用** 新 Issue 建出来就带类型、领域、父级和运营台条目，不需要事后补。

**什么会让它失效** 七类标题前缀闭集、两个 label 维度或经营总账 Project 的字段定义被负责人修改，使创建骨架的硬校验与实际仓库不符。

所属 Plugin `github-collaboration` `0.3.18`｜体积 13.0 KB（占预算 6.4%）｜上次复核 2026-08-15｜正文 [`plugins/github-collaboration/skills/objective-to-issues/SKILL.md`](../plugins/github-collaboration/skills/objective-to-issues/SKILL.md)

## operating-ledger-maintenance

**它替你做什么** 维护经营总账，把诉求、候选、决定、交付与证据分开记，不混成一锅。

**什么时候用** 出现值得跨 Session 保留的诉求、决定或证据变化时；或你要看总账时。

**你怎么知道它在起作用** 总账上诉求状态、执行状态与证据等级三者分开，不互相冒充。

**什么会让它失效** agent-control/authority/10-operating-ledger.md 的事项结构或状态分级变化，使维护动作指向不存在的字段。

所属 Plugin `github-collaboration` `0.3.18`｜体积 11.5 KB（占预算 5.6%）｜上次复核 2026-08-15｜正文 [`plugins/github-collaboration/skills/operating-ledger-maintenance/SKILL.md`](../plugins/github-collaboration/skills/operating-ledger-maintenance/SKILL.md)

## resource-observability

**它替你做什么** 分开看两件事：账户还剩多少额度何时恢复，和这次工作实际花了多少。

**什么时候用** 准备扩大并发、资源接近耗尽，或你问额度时。

**你怎么知道它在起作用** 给出带时间戳的读数；取不到就明说未知，不猜。

**什么会让它失效** agent-control/authority/05-resource-operations.md 的 R1–R6 规则变化，或额度与产能观测面不再可读。

所属 Plugin `resource-observability` `0.2.4`｜体积 9.7 KB（占预算 4.8%）｜上次复核 2026-08-15｜正文 [`plugins/resource-observability/skills/resource-observability/SKILL.md`](../plugins/resource-observability/skills/resource-observability/SKILL.md)

## issue-contract-compaction

**它替你做什么** 把长 Issue 压成能恢复的合同，不丢授权、状态与未收口关系。

**什么时候用** Issue 评论长到影响新 Session 恢复时。

**你怎么知道它在起作用** 恢复的 Session 读到的是压缩后的合同，而不是从头读全部历史。

**什么会让它失效** GitHub 返回的时间标量精度或字段序列化形态变化，使「优先比较原始序列化标量」不再能区分真实变更。

所属 Plugin `github-collaboration` `0.3.18`｜体积 8.6 KB（占预算 4.2%）｜上次复核 2026-08-15｜正文 [`plugins/github-collaboration/skills/issue-contract-compaction/SKILL.md`](../plugins/github-collaboration/skills/issue-contract-compaction/SKILL.md)

## knowledge-maintenance

**它替你做什么** 知识准入：价值门、可信门、失效条件与下次最少复核步骤。

**什么时候用** 多来源调研、可重复实验，或结论会影响权威与重要决定时。

**你怎么知道它在起作用** 写下的知识带失效条件和下次复核步骤，做不到复核就退出当前知识。

**什么会让它失效** agent-control/authority/01-knowledge.md 的两道准入门或可信门八项条件发生变化。

所属 Plugin `knowledge-maintenance` `0.1.3`｜体积 6.3 KB（占预算 3.1%）｜上次复核 2026-08-15｜正文 [`plugins/knowledge-maintenance/skills/knowledge-maintenance/SKILL.md`](../plugins/knowledge-maintenance/skills/knowledge-maintenance/SKILL.md)

## grilling

**它替你做什么** 用结构化追问压力测试一个计划或决定，把没想清楚的地方逼出来。

**什么时候用** 你直接要求，或明确接受建议时。它不会因为任务复杂就自动开始。

**你怎么知道它在起作用** 你会被连续追问，且随时可以喊停或换普通路径。

**什么会让它失效** 明示同意门被取消，或运行端改为按关键词自动进入长期盘问。

所属 Plugin `grilling` `0.1.2`｜体积 3.9 KB（占预算 1.9%）｜上次复核 2026-08-15｜正文 [`plugins/grilling/skills/grilling/SKILL.md`](../plugins/grilling/skills/grilling/SKILL.md)
