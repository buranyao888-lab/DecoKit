# DecoKit AI_HANDOFF.md

**项目：DecoKit-001 / 装修用量计算器**\
**当前阶段：MVP 开发执行（Codex：M1--M3）**\
**版本：v1.1**

## 1. 强制阅读顺序

任何 AI/开发者修改代码前必须依次阅读： 1. `AI_HANDOFF.md` 2. `PRD.md` 3.
`formulas.md` 4. `analytics.md` 5. `git status` 6. 近期 `git log` 7.
当前任务相关代码和测试

仓库冻结文档优先于聊天上下文和模型自身知识。

## 2. 产品目标

完成可提交微信审核的装修工具 MVP，用真实流量验证需求。

核心价值：**计算合理用量 → 对比商家/师傅建议量 →
给出中性、可解释的差异提示。**

## 3. MVP 冻结范围

仅包含：瓷砖、乳胶漆、地板、美缝剂、窗帘宽度、装修预算粗估，以及适用模块的报价对比、可信度/风险提示、基础分享。M4
再接正式埋点、CloudBase、广告；M5 处理发布所需事项。

## 4. 严禁自行增加

未经用户明确授权，不得增加 AI
装修顾问、登录/账户、会员、支付、社区、PDF/正式报价单、推荐系统、商家平台、聊天、新计算器、复杂
CMS、大规模重构或"为了以后扩展"的复杂架构。

## 5. 公式纪律

-   `formulas.md` 是计算逻辑唯一事实来源。
-   不得自行修改公式、默认参数、损耗率或风险分级。
-   不得让 LLM 参与核心计算。
-   默认参数集中定义，UI 不得复制另一套公式。
-   发现冲突/缺失时 STOP，请求决策。
-   核心公式必须有自动化测试。

## 6. Agent 分工

### Codex：M1--M3

当前授权：M1 Skeleton、M2 Calculator Engine、M3 UX / Compare /
Share。每个 Milestone 完成后必须 STOP 等待人工确认。

### CodeBuddy：M4--M5

后续负责 CloudBase / Analytics / Ads，以及 Privacy / Release / WeChat
Review。

Codex 不得提前实现 M4/M5。

## 7. M1 --- Skeleton

建立最小微信小程序工程骨架：首页、六个工具入口、六个最小页面、基础导航及当前必需公共结构。不引入
CloudBase、账户体系或过度抽象。

## 8. M2 --- Calculator Engine

严格根据 `formulas.md`
完成独立确定性计算引擎、输入校验、单位转换、六模块、集中默认参数、统一错误结构、自动化单元测试。预算只实现结构/配置接口，不得捏造城市价格。

验收：相同输入结果一致；异常输入不崩溃；单位/取整正确；核心测试全部通过。

## 9. M3 --- UX / Compare / Share

完成六工具输入与结果
UI、可信度标签、风险提示、适用模块商家建议量比较、中性差异提示、基础微信原生分享、完整导航、空态/错误态及移动端基础体验。

M3 禁止接入 CloudBase、正式生产埋点、广告 SDK、AI、登录、支付或 M5
工作。若需要为 M4 保留边界，只允许最小无后端依赖接口。

## 10. M1--M3 总验收

-   六工具均完成规定计算
-   核心测试全部通过
-   非法输入不崩溃
-   默认参数与 `formulas.md` 一致
-   计算逻辑与 UI 解耦
-   商家比较不使用"坑/欺诈"等结论
-   预算明确标注"粗略估算"
-   无 M4/M5 或冻结范围外实现
-   Git 状态明确

## 11. M3 交接

M3 完成后生成 `M3_HANDOFF.md`，至少记录： - 当前 commit / tag（如有） -
已完成与未完成功能 - 运行方式和测试命令/结果 - 关键目录/模块 -
默认参数位置 - 已知问题 - M4 可修改与不应修改区域 - CloudBase、正式
Analytics、Ads 均尚未接入 - M5 尚未执行

建议稳定节点：`v0.3-pre-cloud`。未经用户明确授权不得自行创建 tag。

## 12. M4/M5 接手保护

CodeBuddy 默认不得重写已验收的 M1--M3
核心实现，不得修改冻结公式。如微信/CloudBase/广告接入确需修改核心模块，必须
STOP，说明原因、影响和最小修改方案后等待授权。

## 13. Git 纪律

每个 Milestone 开始前检查 `git status` 和近期
`git log`，不得覆盖用户未提交修改。

每阶段完成后： 1. 运行测试 2. 展示变更摘要 3. 展示测试结果 4. 展示
`git diff --stat` 5. 展示 `git status` 6. STOP 等待用户确认下一阶段

建议提交： - M1 `feat: establish DecoKit MVP skeleton` - M2
`feat: add deterministic renovation calculator engine` - M3
`feat: complete local MVP calculator UX and comparisons`

是否 commit/tag 以用户明确授权为准。

## 14. STOP 条件

文档冲突、公式缺关键参数、需要修改冻结值、微信能力与预期不一致、需要新增隐私权限/付费服务/M4-M5能力/MVP外功能、测试不稳定、可能覆盖已有代码、存在来源不明未提交修改时，立即
STOP。

## 15. 当前路线

`Codex M1 → 人工验收 → M2 → 人工验收 → M3 → 全量测试 → M3_HANDOFF.md → STOP`

之后：`CodeBuddy M4 → M5 → v1.0 MVP`

**当前第一任务：执行 M1 前检查。**
