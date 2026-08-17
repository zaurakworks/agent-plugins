# agent-plugins

`agent-plugins` 是公开的 Codex／Claude Plugin 源码仓，保存可版本化、可审阅、可回滚的 Plugin、Skill、双端发现清单和来源符合性检查。仓库内容只证明源码状态；不证明任何机器已经安装或正在使用它。

## 开始工作

- 本仓变更只由负责人当前指令，或本仓公开、自足且经明确激活的 Issue／PR 合同授权；当前入口清理见 [Issue #11](https://github.com/zaurakworks/agent-plugins/issues/11)。
- 先读本 README、对应 Plugin manifest 与合同明确引用的文档。私有旧仓链接、迁移前编号和发布记录只作可选历史来源，不能成为理解、复现或授权的前提。
- 开发、来源验证和本机安装是三个独立状态：修改源码不会自动安装，测试通过也不证明运行端生效。安装与卸载始终由使用者在目标运行端明确执行。

## 发布记录（历史）

本批按[关联 agent-control#258（决定块权威模板落地）修正事件](https://github.com/Eridanus117/agent-control/issues/258#issuecomment-5293496974)补齐关联 agent-plugins#77（决定块三句权威模板）遗漏的发布身份：`github-collaboration` 提升到 `0.3.16`，两端 manifest、两份 Marketplace、符合性版本声明与 README 版本总览同步更新；运行端重装与三端指纹验收必须在本版进入 `main` 后另行完成，不能由源仓合并推定。

本批发布同步覆盖[关联 #75（资源观测方案 A 自然决策闭环）](https://github.com/Eridanus117/agent-plugins/pull/75)与[关联 #76（GitHub 原生硬依赖边规范）](https://github.com/Eridanus117/agent-plugins/pull/76)：`resource-observability` 与 `github-collaboration` 各提升一个 patch 版本，两端 manifest、两份 Marketplace、符合性版本声明与 README 版本总览保持一致。

本批发布同步覆盖[关联 #73（关闭前收割回执减重）](https://github.com/Eridanus117/agent-plugins/pull/73)与[关联 #74（摩擦能力面调研反事实）](https://github.com/Eridanus117/agent-plugins/pull/74)：`github-collaboration` 提升一个 patch 版本，两端 manifest、两份 Marketplace、符合性版本声明与 README 版本总览保持一致。

本批发布同步覆盖[关联 agent-plugins#68（APS 卡片暴露合同修复）](https://github.com/Eridanus117/agent-plugins/pull/68)、[关联 agent-plugins#70（12 个 Skill 常驻描述瘦身）](https://github.com/Eridanus117/agent-plugins/pull/70)与[关联 agent-plugins#71（issue-workflow 核心与按需引用拆层）](https://github.com/Eridanus117/agent-plugins/pull/71)：七个内容有变的 Plugin 均提升一个 patch 版本，两端 manifest、两份 Marketplace、符合性版本声明与 README 版本总览保持一致；本批不执行本机安装。

`adaptive-problem-solving` `0.2.10` 与 `orchestrated-collaboration` `0.2.4` 按[关联 agent-control#147（P1-1 行动前事实与决定价值双门）](https://github.com/Eridanus117/agent-control/issues/147)实施三道最小强制门：G1 对会改变行动的能力／权限／网络／版本／资源主张执行“实测或未知”，有低成本安全探针则实测，否则明示未知；G2 以负责人无回复时的下一动作、授权、风险、成本和不可逆／时限机会五项差异决定是否进入现有负责人协议；G3 只在真实阻塞、替代授权与正 ROI 同时成立时评估 CF-6。唯一规范正文收敛在 APS 第八节，与 `0.2.8` 的关键节点反思节律共段；协作主 Skill 与 CF-6 卡只路由，P0-2 可重入收口段保持原义，不形成第三承载面或第二状态机。

守恒对象是“凭印象接受负向能力主张”“问题重要即可请求负责人”“已有三席即可升级”三项隐含默认，以及 APS 各节和协作进入段的重复说明；压缩后 APS 主正文按 LF 规范化为 22825 UTF-8 字节（不高于 `0.2.8` 的 22848），协作主正文为 21777 字节（不高于 P0-2 落地后的 21823），CF-6 为 5994 字节，两个 description 均继续满足三端共同的 1000 UTF-8 字节门。现有 TypeScript 符合性测试新增行动前预注册夹具和[关联 agent-control#136（今夜自治运行的反向反思）](https://github.com/Eridanus117/agent-control/issues/136)真实触发来源；实现不新增脚本、自动化、状态字段或授权。

`orchestrated-collaboration` `0.2.2` 按[关联 #140（P0-3 类型化派发与写后核验门）](https://github.com/Eridanus117/agent-control/issues/140)把派发骨架类型化：Task 创建前核对 `contractRepo`、`executionRepo`、`worktree`、`ownedPaths`、`delivery`，其中 `contractRepo` 冻结建项前的期望 Issue 标题／语义标识；Issue 编号、原生父级、唯一交付形态或字段断言缺失即停；Dispatch 建立与 Worker 启动后分别以同一稳定身份核对实际仓库和 worktree。远端写入统一以回读后态为准，创建 Issue 后回读实际标题并与冻结值断言，已生效不重写、证明确实缺失才沿原身份幂等补齐、未知则只读查证并停止新增写入；本版只保存跨后端协议与失败分支，不复制 Orca 动态命令，也不产生自动派发、安装或合并权限。

`orchestrated-collaboration` `0.2.1` 按[关联 #128（资源投入规则两层承载落地）](https://github.com/Eridanus117/agent-control/issues/128)落实 120-D1=C：引用 `authority/05-resource-operations.md` 作为资源投入唯一原则源，以 R1–R6 就地置换“完成即扫描解锁／无依赖工作不伪串行／灵活使用产能”三条散规则，依次执行价值门、就绪队列与排他所有权、资源新鲜度、额度加速条件、验收容量与实验干扰、加派／维持／停止新增派发；不复制证据历史或动态阈值，不新增轮询、自动派发、自动停止或权益消费权限。

本批按 clean-slate 迁仓修正发布身份：仓库所有权由 `Eridanus117` 迁至 `zaurakworks`，七个 Plugin 的 `author.name` 与 `repository` 字段、两份 Marketplace（Claude 与 Codex）、符合性版本声明与 README 版本总览同步更新，七个 Plugin 各递增一个修订号。**运行端重装与三端指纹验收必须在本版进入 `main` 后另行完成，不能由源仓合并推定。**

以下发布记录保留迁移前编号以便仓库维护者溯源；其中私有链接对公共协作者不可用，只是可选历史来源。当前行为、贡献要求和验收必须在本仓公开内容中自足表达。

仓库目前包含八个可安装 Plugin：`grilling` `0.1.2`、`self-improvement` `0.1.7`、`skill-maintenance` `0.1.0`、`knowledge-maintenance` `0.1.3`、`orchestrated-collaboration` `0.2.6`、`adaptive-problem-solving` `0.2.12`、`github-collaboration` `0.3.18` 与 `resource-observability` `0.2.4`。

`self-improvement` `0.1.4` 按[关联 agent-control#139（P0-1 迭代回执地基）](https://github.com/Eridanus117/agent-control/issues/139)承载一份按需读取的十字段迭代回执协议；`adaptive-problem-solving` `0.2.9` 在阶段合同与攻防裁决需要跨 Session 恢复时引用该协议，`knowledge-maintenance` `0.1.1` 只回填知识出口证据。回执寄生于当前 Issue 的同一条自足评论与自然里程碑，不建数据库、独立登记表或定时器；APS 继续是唯一任务内控制器，Issue 生命周期与知识准入仍各归现有机制，`orchestrated-collaboration` 不成为第二承载面。

`adaptive-problem-solving` `0.2.5` 复核两组真实决策与运营证据：`devils-advocacy` 由三方审阅机制方案中的最强可信反方、普通路径、翻转条件和负责人决定回执，在 Agent 系统高影响产品决定边界升为 M1；`goal-question-metric` 由系统运营指标基线的目标—问题—指标链及负责人选择，在人工低成本基线与复核边界升为 M1。登记面分布同步为 M0 22 张、M1 8 张；只有相似形状而没有完整执行链或卡片级复核的其他候选保持 M0，不外推为产品采用或长期依赖。

`adaptive-problem-solving` `0.2.3` 消费已完成的 70-D 裁决：以双语等义置换将 description 从 1508 压到 997 UTF-8 字节，不依赖运行端截断；符合性清单删除过期预算例外，并显式断言决定消费后该例外必须消失。方法登记面的首批基线提交水位同步修正为实际引入该资产的 `a11176f`。

`grilling` 用结构化问题压力测试计划、决定或想法。Agent 可以发现它，但只有用户直接要求，或明确接受一次建议后，才能开始问询；用户可以继续普通任务、拒绝、降级或退出。它与期待的完整“升级思考”仍有差距，不代表最终方法，也不代表未来只能使用这一种方法。

`self-improvement` 在用户指出 Agent 漂移、误解或重复犯错，或者讨论陷入只增加抽象却没有减少不确定性的循环时，帮助 Agent 停止旧路径、保存纠正、诊断断点，用最小可逆资产检验高层判断，并把值得复用的行为改进放到系统提示词或 Skill。它是完整元方法能力的第一个窄切片，不代表知识、多 Agent 或整个元方法领域都被做成了 Skill。

`self-improvement` `0.1.7` 把承载位置已确定为 Skill 的纠正交给 `skill-maintenance`，自己只负责停止漂移、诊断根因、判断长期价值和选择持久载体，不再复制来源盘点、预算、版本、clean cutover 或审查协议。

`skill-maintenance` `0.1.0` 在明确创建、审计、修正、拆分、升级、迁移或退役 Skill 时进入：先绑定当前行为合同与授权，预注册行为判据，再同步主合同、按需 reference、全部调用者、双端发现入口、版本、生成物和复杂度预算；安全门零回退，调用者 clean cutover，方案／实施同源时必须独立审查。它不维护普通业务代码，也不替 `self-improvement` 决定一次纠正应该落到哪里。

`knowledge-maintenance` 在多来源调研、可重复实验或重要决定前，先复用仍成立的当前知识，只补查变化、冲突和缺口；新结论逐条通过价值门与可信门后才能进入当前知识。它不保存原始会话，不替代研发记忆，也不决定知识平台、私域结构或知识图谱。

`orchestrated-collaboration` 在已获授权的多 Agent、多 Session 或共享写入碰撞中，区分用户目标、必要约束与 Agent 假设，建立唯一协调者、写入所有权、可追踪交付、独立验收和结果综合。`0.1.2` 增加共享写入前置检查：只有仍在线的协调者和明确资源范围共同成立时才视为占用，重叠 Session 在写入前必须加入协调、隔离或退回只读。`0.1.3` 补上同源盲区：协调者参与了高价值、多 PR 的 Agent 系统能力或工作流替代的拆分或方案设计时，综合前必须由另一个未参与拆分和实现的 Agent 做父目标级只读复核，子 PR 的 Peer Review 不能替代它；详细检查项来自 `adaptive-problem-solving`，普通单 PR、低风险、容易回退的任务不强制增加这一层。`0.1.5` 优先高层受监督生命周期，并为派发完成后的资源收口给出可达且安全的判据：先读取标准释放回执，再按对象是否被回执覆盖并确认释放、回执是否要求必须执行的恢复动作、四项证明是否齐全逐个处置，不声称这些情形互斥或穷尽；标准释放未覆盖的残留 worktree，以及释放不适用或未文档且没有恢复要求的对象，都在远端持久化、干净工作树、唯一精确身份与删除连带影响四项证明齐全后才可以精确显式收口，回执要求恢复动作或任一证明缺失时一律保留，不强制删除。`0.1.6` 按 [`agent-control#44 实施已批准决定`](https://github.com/Eridanus117/agent-control/issues/44) 的 D1 精确化 Orca 运行面语义：Orca TUI 是观察面，供人观察和输入，不承载协调状态、也不是编排协议；`orca orchestration` 才是执行事实与协调后端，Run、Task、Dispatch、持久消息和交付来源链的执行事实以它为准，不以界面上看到的画面为准。被替代的表述是「Orca TUI 只作为观察和输入界面」——它只说明 TUI 不是什么，没有指明执行事实由哪个面承载。该精确化不解禁任何自动化，也不把 Orca 升级为长期依赖。它使用当前任务已经选择的真实协调后端；选择 Orca 时动态读取 orchestration 及所需终端／worktree 指南。Skill 不替系统决定长期依赖、Fork／维护还是自建协调产品，也不新建审查平台或评分系统。`0.1.7` 在协调者职责处并入两条经负责人两次实证纠偏的协调循环规则：每处理完一次交付、合并或验收，立即重新扫描任务图并派发因此解除依赖的切片，不等催促或整批收口；已有对齐工作池且资源充裕时，不得以在途任务未收口为由推迟无依赖的新工作，推迟必须指出真实依赖边、写入冲突或协调净收益为负。两条规则不扩大授权，派发仍要满足既有核对与写入所有权分区。`0.1.8` 删除 Skill 内对共享单点六类的改写，改为只引用 `agent-control/authority/04-collaboration.md` 的唯一规范源；同时把 description 压到三端共同的 1000 UTF-8 字节预算内，保留授权协作、碰撞处理、父目标复核与 Orca 动态指南路由。`0.1.9` 按 [`agent-control#80 协作方法资产化`](https://github.com/Eridanus117/agent-control/issues/80) 把五张波次回执验证过的协调方法固化为派发合同骨架、`input_accepted` 后的终端落点与提交核对、GitHub 报错后的先核验再重试，以及“产能数字是手段”的弹性用量规则；这些规则只保存跨后端语义，不复制 Orca 命令，也不新增轮询或调度。`0.1.10` 按 [关联 agent-control#94（协作形态选择模型调研）](https://github.com/Eridanus117/agent-control/issues/94) 的 94-D1=C，把第一节原有进入信号与收益散述合并置换为四条人工选择规则：用五项输入选一层执行拓扑，按需叠加质量机制与阶段承载，CF-0 直接退回普通路径；八张形态卡放在 Skill 自有 `references/`，保留样本水位、失败门和降级出口。主 Skill 不净增，description 保持不变；该版不自动选型、不复制 Orca 命令，也不产生新的授权或长期平台承诺。`0.1.11` 按 [关联 agent-control#97（继任协议承载实施）](https://github.com/Eridanus117/agent-control/issues/97) 的 95-D1=E，复用共享写入前置检查在接管场景的既有触发，把“创建或绑定 Run”的泛化条目精确置换为 K12 知识路由与双协调停止门；动态命令继续来自运行时指南。description 保持 989 UTF-8 字节，主 Skill 按 LF 规范化保持 21841 UTF-8 字节；该版不执行接管、不建调度器，也不产生新的长期依赖。`0.1.12` 按 [关联 #105（K12 继任协议停门与可发现性修复）](https://github.com/Eridanus117/agent-control/issues/105) 的 C10，把依赖当前目录的裸跨仓路径置换为指向 K12 当前版本的绝对 GitHub 链接，并压缩同段第 2、6 条维持主 Skill 体积上限；符合性检查同时要求该路由是可跨工作区解析的 HTTPS URL。95-D1=E 承载决定、双协调停止门、description、动态命令来源与不接管边界均不变。`0.2.0` 按[关联 #110（三方审阅机制修复实施）](https://github.com/Eridanus117/agent-control/issues/110)把 CF-6 就地替换为席位联合类型、机械映射、先密封后公开和状态机／时间盒四机制，并降回 M0；新增 TypeScript 只读验证器与正负夹具，历史 #90 反向绑定样本必须判失败。oc 主 Skill 与 description 均零改动；不改 #44 授权记录、不消费决定，C3 保持 A。

`adaptive-problem-solving` 是问题求解治理的薄控制循环：先恢复原始问题和当前阶段，识别最值得发力的瓶颈，比较普通处理与方法介入的价值，再选择、组合、升级、降级或退出方法，同时检查模型、推理强度、工具、上下文和协作配置。`0.1.1` 增加阶段结束与最终验收的父目标、能力回退、证据等级和负责人可见 ROI 检查；`0.1.2` 进一步要求：如果声称某项 Agent 能力能在以后或跨 Session 重复运行，必须存在持久触发、可执行行为载体、真实运行入口和可发现性证据，不能只凭页面、文件或脚本建成就宣布能力完成。关键节点检查只是入口；它不把六类方法都复制成 Skill，也不取代知识、任务状态、研发记忆或 `self-improvement`。`0.1.3` 增加“最小实验／产品最小闭环”判据表与 ROI 默认优化目标（总周期、有用吞吐和负责人注意力，不是最小改动量）。`0.1.4` 把两条路线从控制文本补成可执行资产：路线 4（攻防／反证）获得实战两次复用后固化的多视角攻防形状——轻量前置为单 Session 已失败假定预演，重型形状按角色分区、每人一条自足评论、必答结构、事实推断分开、上限时间与交叉裁决的构件表执行，以轮为推进单位并带明确启动与停止判据；路线 6（最小实验）获得预注册实验卡与收口卡字段对，成功判据开始前写死、开始后只可作废重登，解释结果前先排除测量与触发系统故障。`0.1.5` 为受限调研补上研究—选项—计划的证据分区：影响决定的主张区分本次直接验证、一手来源核验、二手转述与未核验推断，选项比较带出架构适配、假设和验证含义，计划显式保留验证面、未运行项、失败门、开放问题与完成定义；它不建立固定文件链，也不把来源核验等级混同为产品证据等级。`0.2.0` 新增按需读取的方法登记面：P1–P5 类型索引把主瓶颈映射到少量候选卡，30 张首批卡完整登记进入／退出、成本、硬门、组合、回退和两套证据等级，其中 29 张为 M0、1 张为 M1；M0 不进入默认触发，`grilling` 的明示同意门不因索引命中而改变。控制器仍只保留归型与选择规则，具体执行资产、任务样本、私域原文和权威各留原载体。同版把未经总体 ROI 比较的“渐进默认”列为与“最小 diff 默认”同类的偏差：渐进是选项，不是天然正确路线。`0.2.1` 复核两个真实任务样本，把 `premortem` 与 `key-assumptions-check` 从 M0 升为 M1，登记面分布同步为 M0 27 张、M1 3 张；两张卡都保留“只可在相同边界下建议”的选择资格，并把样本暴露的授权保护、证据锚点、状态分级与下一复核面落入卡片。`0.2.2` 复核红队实战，把 `red-team-analysis` 在私域迁移链路只读安全审查边界升为 M1，登记面分布同步为 M0 26 张、M1 4 张；同版用 21 个真实决策时刻校准 P2／P5、P3／P4 与 P4／P7 的阶段边界，正式给 P6 增加可直接首跳的补充出口，并补上攻防发现后的 P1 回建模桥、ROI 代理指标验收和后续样本介入前水位。`0.2.3` 把 description 压到三端共同的 1000 UTF-8 字节预算内，并修正登记面基线水位。`0.2.4` 以两组真实任务证据把 `comparative-experiment` 与 `aps-roi-options` 有界升为 M1，同时把后者不必要升级负责人决定的失败样本写回方法卡；证据分布变为 M0 24 张、M1 6 张，其他候选不因任务形状相似而追认使用。`0.2.5` 以负责人直接复核的三方机制决定面与运营指标基线，把 `devils-advocacy`、`goal-question-metric` 分别在原窄边界升为 M1；证据分布变为 M0 22 张、M1 8 张，未见完整执行链的其他候选保持 M0。`0.2.7` 复核两批显式方法卡实战，把 `quality-of-information-check`、`outside-in-thinking`、`paired-observation` 与 `indicators-signposts` 各自在资源投入、知识产品外部约束、精确版本三端指纹及 Issue／Project 投影重评的窄边界升为 M1，登记面分布变为 M0 18 张、M1 12 张；`what-if-analysis` 仍缺第二项范围匹配任务，`high-impact-low-probability` 仍缺事前自然运行，两者保持 M0。该版以四张卡的旧 M0 证据占位与登记面旧分布水位支付新增依据，不改方法执行定义，也不外推为 M2、产品采用或长期依赖。`0.2.8` 按[关联 agent-control#65（周期性自我反思能力设计）](https://github.com/Eridanus117/agent-control/issues/65)的 65-D1=A，把三波有效样本常规化到 APS 既有关键节点控制段：真实工作波次为常规周期，无波次长任务在重要阶段结束取样，事件信号即时旁路，连续两波成本高于收益即退回按需；不建日历调度或自动化。选择 APS 是因为它已承载当前任务的关键节点方向控制；`self-improvement` 继续只承载跨任务行为改进与按需迭代回执。置换／压缩对象是第八节原四节点、五问和固定复盘说明；主 Skill 按 LF 规范化由 22850 降至 22848 UTF-8 字节，description 由 997 降至 991 UTF-8 字节。

`adaptive-problem-solving` `0.2.12` 将主 `SKILL.md` 收敛为进入／退出、问题恢复、类型路由、共用安全门指针与结果返回；受限调研、攻防、最小实验、G1–G3 和长程验收分别移入命中条件明确的 `references/`。主控制合同从 22,537 UTF-8 字节降为 8,812 字节，五份分支协议与主合同合计仍低于拆分前基线；未命中分支不加载，授权、同意、写入所有权、M0／M1 选择资格、攻防四席下限和产品证据等级不变。

`github-collaboration` 是 GitHub 持久协作主干的轻量工作流 Plugin。`0.3.0` 起，它的入口是 `issue-workflow`：任何一个 Session 只用远端事实就能判断自己在一棵 Issue 子树里的角色——叶子 Issue 端到端交付并按风险进入审查与整合，父 Issue 在当前授权内维护子图、选择下一切片并决定自己执行还是派发，交付结束后回到父级逐条找证据；没有可执行子项而父级成功条件仍未满足时，补规划、报告阻塞或提出一次负责人决定，不用空队列宣称完成。手上没有具体 Issue 时它不挑活、不遍历仓库队列，而是退回经营总账与未满足诉求，经 `adaptive-problem-solving` 形成有界 Issue 后再进入。它是这条链上的唯一驱动者：段 Skill 只把结果返回给它，不反向驱动，也不自建第二套状态机。`0.3.1` 在它的恢复路径前面补上远端访问能力的选择规则：先确定本次需要哪些 GitHub 语义（正文与评论、原生父／子关系、PR 当前 head、写权限），再在实际可用且已认证的候选里选一个能表达它们的。某个命令行客户端不在 `PATH`、某个集成没连上，只证明那一个候选不可用，不构成阻塞；只有所有候选都无法表达某项语义时，才精确报告缺口并只冻结受影响的读写。规则按语义而不是按客户端名表达，因此不保存会过期的命令清单，也不因为某个候选这次好用就把它变成长期依赖；安装工具、改 `PATH`、读写凭据和降级到未认证抓取始终不在其中。`0.3.2` 增加在线任务自然发现父级缺口后的有边界续接：只对明确开放且授权有效的父级恢复，按退出／记录证据／候选／可执行子项分类，全部准入和限流通过后才建立至多一个原生子 Issue，并复用现有建图、派发和回收段；发现者回写父级后退出，不保留永久协调职责。合同压缩同时改为优先比较原始序列化标量或稳定快照；必须解析时间时使用 UTC 或带明确偏移量的绝对时刻语义，`DateTimeOffset` 只是部分宿主中的示例，且规范化不得降低源精度，避免本地文化时间表示产生假陈旧或因精度丢失产生假一致。`0.3.3` 增加负责人决定协议：区分普通授权门和真实产品取舍，短请求必须携带 Agent 推荐、证据／置信度、最强可信反方、翻转条件、普通路径成本与稳定编号；只有显式编号或唯一紧邻决定才能绑定 `B`／“同意”等自然短回复，Markdown 引用块不产生授权，带条件批准只能缩小范围。无歧义后写回分列已授权、未授权、下一责任人、下一动作与纠正入口的决定回执，后续 Session 直接恢复该回执而不重复询问同一门；只有当前、明确且尚未消费的负责人动作才投影为“等待负责人”，消费决定时同闭环清除旧等待、切换到下一真实执行状态，并按授权关闭已经满足成功条件的来源 Issue。补充行为仍保持 `github-collaboration 0.3.3`，不新增 Project 字段。`0.3.4` 给这套决定协议补上审阅面语言规范：写给负责人看的决定请求、决定回执和收口总结按信、达、雅三条同时成立的标准写——保留正式概念名与完整上下文而不用生活化比喻替代术语，决定编号与选项代号首次出现即在同一句内联说明、正文自足，行文书面且在开头或结尾给出一段可以独立支撑决定的总览；术语堆砌与过度直白同为偏差，判据是负责人能否只凭这段文字作出这次决定。规范只约束表达，不改变决定权归属、请求分类和解析规则，也不成为推迟决定请求的新门。同一版本把 `issue-workflow` 的 description 从 1999 字符压缩到当时的 1536 字符口径内并保留全部触发语义——运行端按单个字段读取，超出部分不报错而是被静默截断，尾部的“不要用它做什么”会直接消失；该版符合性检查沿用了字符计数，`0.3.9` 已以三端共同的 1000 UTF-8 字节口径替换。`0.3.5` 给决定回执并入三行决策日志推荐字段：预期结果（执行后预计观察到什么、何时可检验）、粗粒度置信（高／中／低，不伪造精确概率）、翻转条件（什么事实会推翻本决定）；翻转条件同时成为“命中翻转条件才重开决定”的判据来源，服务“预期 vs 实际”的回看闭环。三字段是推荐而不是新的门，缺失不阻塞消费决定。`0.3.6` 交付 Skill 维护批次三：关闭门消费负责人批准的三条件预授权谓词，满足远端证据、无未收口关系且对象属于交付／实验／摩擦类时带规则来源回执收口，目标与诉求层、父目标、产品取舍和授权边界类仍走决定门；决定编号统一为 Issue 号前缀，显式前缀优先，两组同格式编号并存时不再按唯一紧邻消费；协调者转呈含决定请求的交付前核对备选（含维持现状）、逐项比较、推荐与置信、最强可信反方和翻转条件，缺项退回重构。三项分别替代“一律逐次询问关闭”“裸局部编号依赖评论邻接”“已有请求文字即可转呈”的旧默认；授权与动机来源见 [`agent-control#44`](https://github.com/Eridanus117/agent-control/issues/44#issuecomment-5255408590)、[错绑定波次回执](https://github.com/Eridanus117/agent-control/issues/44#issuecomment-5255737976) 与 [决定请求撤回回执](https://github.com/Eridanus117/agent-control/issues/9#issuecomment-5255799405)。`0.3.7` 把本仓缺少的通用工程检查并入现有交付链：按改动相关性覆盖正确性与边界输入、异步与错误路径、API 与兼容性、测试真实性、IO／数据／迁移、安全与资源等维度，并统一记录实际运行、未运行、剩余验证缺口和开放问题；PR 快照精确区分 Draft、review decision／request、required／optional checks、冲突与 merge state，以及顶层／inline 的人和自动化反馈，查询失败不冒充 CI 状态。分支维护要求干净工作树、动态 remote／upstream、fetch 后 rebase、逐项处理冲突、相称验证和 lease 保护更新，合并后只 fast-forward 同步默认分支并复核 commit。`issue-workflow` 同时按 [9-D2 批准回执](https://github.com/Eridanus117/agent-control/issues/9#issuecomment-5255912747) 增加关闭前蒸馏检查：评论中有可复用结论时先把候选及来源交给 `knowledge-maintenance` 留下可恢复去向，再关闭；该检查只防遗漏，不替知识流程执行价值门或可信门。三组吸收需求均来自 [#44 吸收清单](https://github.com/Eridanus117/agent-control/issues/44#issuecomment-5256023899)，本仓仅按能力合同独立实现，不引入卸载市场插件的文本、固定目录或状态标记。`0.3.8` 把负责人批准的 Issue 治理收敛为全插件唯一共享创建骨架：七类中文标题前缀闭集、匹配的类型 label 与唯一领域 label、自足中文正文、安全的 `关联 #N` 引用、原生 sub-issue、经营总账 Project 与实际执行状态写入在同一创建批次完成并远端复核；Project 条目值只用 `updateProjectV2ItemFieldValue`，禁止以具有全量替换语义的 `updateProjectV2Field` 修改字段定义。该骨架替代“新 Issue 不默认加入 label／Project”的旧默认，只约束创建动作，不改变既有准入、限流和唯一生命周期状态机，也不新增轮询或自动化。

`github-collaboration` `0.3.9` 落地 [`agent-control#66 多视角攻防审计`](https://github.com/Eridanus117/agent-control/issues/66) Skill 批裁决：决定消费在文本解析前绑定仓库所有者或合同明示负责人账号，Bot、GitHub App 与其他用户不产生授权；叶子以“可独立核验交付物”而非 PR 判定，代码交付走 Draft PR，调研／审计／只读证据走自足评论并直接回收，Draft → ready 只由 `pr-integration` 在五项门齐全后执行；七类 Issue 创建类型通过 `objective-to-issues` 唯一映射到四种经营节点，`operating-ledger-maintenance` 只引用该表；合同压缩新增正文排他所有权和包含完整旧正文的远端恢复快照；`issue-delivery` 只引用 `authority/04-collaboration.md` 的共享单点规范源，并在入口级发布不变量落地前引用现行 `关联 #N` 安全规则。符合性测试把旧的 1536 字符口径替换为三端共同的 **1000 UTF-8 字节**门，并加入身份、评论交付、类型映射、Draft → ready 与双写入者竞态夹具；按合同未修改 `adaptive-problem-solving` 与 `self-improvement`，前者的既有超限由 70-D 显式留给后继裁决。`0.3.10` 把负责人可见面中的 Issue、PR 与决定编号统一为首次出现附中文短题，并让安全关联规则与符合性场景使用同一语义。`0.3.11` 消费 [`agent-control#66 L2-F3 收口补证`](https://github.com/Eridanus117/agent-control/issues/66#issuecomment-5257964613)：需要同时写来源 Issue 与经营 Project 的决定收口批由 `operating-ledger-maintenance` 充当唯一远端执行者，顺序固定为来源在先、Project 投影随后、双对象重读、更新单一稳定回执；`issue-workflow` 只提供生命周期判定与目标事实，部分失败按稳定定位符只补缺失步骤。`0.3.12` 为已经进入 `main` 的[关联 #67（决定面三律补丁）](https://github.com/Eridanus117/agent-plugins/pull/67)补齐发布身份：短决定请求必须自足、活动请求置顶于来源 Issue 正文、逐选项显式列出负责人的时间与参与成本；同时同步 Claude／Codex Plugin manifest、两端 Marketplace 与版本化符合性声明，使内容变化、可安装版本和回退取证重新一一对应。

其余 Skill 各自承担一段：`issue-contract-compaction` 把变长的讨论收敛回可交接正文，写前要求正文排他所有权与远端恢复快照；`issue-delivery` 按合同交付 Draft PR 或自足评论／证据；`pr-integration` 绑定当前 head 验收并独占 Draft → ready 动作，再把合并后的远端事实交回唯一驱动者；`objective-to-issues` 建立或增量维护父／子 Issue 图并拥有七类到四节点的唯一映射；`operating-ledger-maintenance` 引用该映射，分开维护执行状态、诉求状态和证据等级。全链共用一张三级风险表：低风险保持轻量，已有预授权不重复索要批准，只有方向、共享状态、难回退或高价值父目标才要求未参与实现者的独立复核。多 Agent 的活跃派发仍交给 `orchestrated-collaboration` 与当前真实后端，Plugin 不复制 Orca 命令，也不把 GitHub 或 Orca 固化为永久依赖。

`resource-observability` 在用户询问账户容量、重置时间、Codex 重置券或单 Session Token，或者高成本／多 Agent 工作需要资源决定时，按需组合两种现有来源：账户层读取 `orca account list --json`，会话层通过固定 `ccusage` `20.0.19` 生成 Token 回执。Skill 只保留负责人需要的窗口、时间、权益、来源和失败，不输出账户标识、凭据、原始正文、路径或 stderr。`0.2.1` 将会话薄门面和直接耦合的验证资产迁移到 TypeScript，由 Node 直接运行 `.ts` 源码，保持原协议、退出码、超时、输出上限、Windows npm shim 和脱敏边界。该门面只服务会话协议，不代表完整产品。它不建设监控、轮询、自动停止、计费推断或调度，也不自动消费重置券；Orca 只是当前可替换来源，不因此成为长期依赖。

仓库分别维护两端的原生发现清单：Codex 使用 `.agents/plugins/marketplace.json`，Claude 使用 `.claude-plugin/marketplace.json`。Plugin 正文可以共享，但不能因为两端都叫 Marketplace 就假设清单格式相同。

本仓当前需求与授权只来自负责人当前明确指令，或本仓公开、自足且经明确激活的 Issue／PR。旧 Issue、私有历史和既有研究默认只作待核验来源，不能自行恢复工作。

## 安装 `grilling`

先克隆本仓，然后把仓库根目录作为本地 Marketplace 添加。下面的 `<repo-root>` 是本仓的绝对路径。

Codex：

```powershell
codex plugin marketplace add "<repo-root>" --json
codex plugin add grilling@agent-plugins --json
```

显式入口为 `$grilling`。

Claude：

```powershell
claude plugin marketplace add "<repo-root>"
claude plugin install grilling@agent-plugins --scope user
```

显式入口为 `/grilling:grilling`。

移除时先卸载 Plugin，再移除 Marketplace：

```powershell
codex plugin remove grilling@agent-plugins --json
codex plugin marketplace remove agent-plugins --json

claude plugin uninstall grilling@agent-plugins --scope user
claude plugin marketplace remove agent-plugins
```

原生 Windows 的 Codex `elevated` sandbox 在首次初始化或 marker 不兼容时可能触发 UAC；请在确认程序来自本机 Codex 后完成提升。本仓曾在无人处理 UAC 时只对受阻测试命令临时使用 `windows.sandbox="unelevated"`，随后在可处理 UAC 时确认 `elevated` 最小探针恢复正常。持久配置没有被降低，也没有关闭沙箱；若以后必须临时回退，优先只覆盖单条命令，因为 `unelevated` 的隔离强度低于 `elevated`。

安装 `self-improvement` 时使用同一个 Marketplace：

```powershell
codex plugin add self-improvement@agent-plugins --json
claude plugin install self-improvement@agent-plugins --scope user
```

安装 `skill-maintenance` 时也使用同一个 Marketplace：

```powershell
codex plugin add skill-maintenance@agent-plugins --json
claude plugin install skill-maintenance@agent-plugins --scope user
```

安装 `knowledge-maintenance` 时也使用同一个 Marketplace：

```powershell
codex plugin add knowledge-maintenance@agent-plugins --json
claude plugin install knowledge-maintenance@agent-plugins --scope user
```

安装 `orchestrated-collaboration`：

```powershell
codex plugin add orchestrated-collaboration@agent-plugins --json
claude plugin install orchestrated-collaboration@agent-plugins --scope user
```

安装 `adaptive-problem-solving`：

```powershell
codex plugin add adaptive-problem-solving@agent-plugins --json
claude plugin install adaptive-problem-solving@agent-plugins --scope user
```

安装 `github-collaboration`：

```powershell
codex plugin add github-collaboration@agent-plugins --json
claude plugin install github-collaboration@agent-plugins --scope user
```

安装 `resource-observability`：

```powershell
codex plugin add resource-observability@agent-plugins --json
claude plugin install resource-observability@agent-plugins --scope user
```

显式入口是 Codex 的 `$resource-observability` 与 Claude 的 `/resource-observability:resource-observability`。账户层由 Skill 调用 `orca account list --json` 并只整理 Claude／Codex 窗口与 Codex 重置券；会话层继续使用内置 TypeScript CLI 的 `session --provider codex|claude --id <id> --json|--summary`，JSON 标准输出恰好一个回执且自带 `summary_zh`。Node 直接运行该 `.ts` 入口，CLI 默认调用 `ccusage` 并固定验证 `20.0.19`，测试或非标准安装可用显式 `--ccusage-command`。当前仓库交付不自动安装、升级或移除 Orca、Node 或 `ccusage`；账户来源不可用时明确失败，不读取凭据或改走内部 HTTP。

`github-collaboration` 的显式入口在 Codex 是 `$issue-workflow`、`$issue-contract-compaction`、`$issue-delivery`、`$pr-integration`、`$objective-to-issues` 与 `$operating-ledger-maintenance`；在 Claude 是同名的 `/github-collaboration:<skill>`，其中主入口的完整标识为 `/github-collaboration:issue-workflow`。本仓只提供可安装骨架；修改仓库不会自动安装或升级任何用户级 Plugin。

## 检查

```powershell
node tests/workflow-routing.test.ts
node plugins/orchestrated-collaboration/tests/verify-three-party-review.test.ts
```

它检查版本化来源本身：每个 Skill 的必需字段、双语触发说明与 1000 UTF-8 字节预算（含稳定决定编号约束的显式例外），跨 Skill 路由和唯一驱动者，可信授权主体、非 PR 交付、Draft → ready、七类到四节点映射、正文压缩竞态等夹具，验收场景正文落点，以及两端 Plugin 清单、发现目录和 README 版本是否一致。通过只说明来源资产自洽，不代表任一运行端已经安装成功，也不代表方法在真实任务中产生收益。

## 这个仓负责什么

- 保存可版本化、可追溯、可回滚的方法 Plugin 资产；
- 记录上游来源、许可证和本地修改；
- 如实分开 Codex 与 Claude 的运行端差异；
- 规定各层验证证据能说明什么、不能说明什么。

这个仓不取代：

- 使用本仓 Plugin 的项目合同、任务授权与产品政策；
- 判断内容能否成为可信知识的知识库门槛；
- 某台电脑上的安装缓存和用户配置。

## 从这里开始

- 当前目标、授权和边界：读取本仓公开、自足且经负责人明确激活的 Issue／PR；没有明确合同则只做当前请求的最小范围；
- 当前可安装内容：读取本 README 和对应 Plugin manifest；
- `issue-workflow` 的三种模式、验收场景走读和当前证据等级：[`docs/issue-workflow-walkthrough.md`](docs/issue-workflow-walkthrough.md)；
- **每个 Skill 替你做什么、什么时候用、花掉多少复杂度预算：[`docs/skills-overview.md`](docs/skills-overview.md)**（生成产物，符合性测试钉住它不会漂）；
- 「装了才算数」的部署方式、Skill 的失效条件、最少复核、退役路径与复杂度预算：[`docs/lifecycle.md`](docs/lifecycle.md)。其中「必须声明失效条件与最少复核步骤」「数量与语料总量不得净增」由本仓 CI 强制；
- [方法资产模型](docs/asset-model.md)、[符合性检查](docs/conformance.md)、旧 Issue 和 `codex-work`：只作为历史或待核验材料，不默认指导新工作。

不要从旧交付顺序、私有历史或开放状态自行恢复工作。跨仓项目调用本仓 Plugin 时，以调用方公开合同和本仓当前可用接口的交集为边界。
