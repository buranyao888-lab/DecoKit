# DecoKit analytics.md v1.0

**状态：FROZEN / MVP**

## 1. 原则

-   埋点服务产品验证，不追求"大而全"。
-   不采集与分析目的无关的个人敏感信息。
-   事件命名稳定；MVP 上线后非必要不改名。
-   失败的统计上报不得阻塞计算器。

## 2. 核心事件

  Event                  触发时机            核心属性
  ---------------------- ------------------- -----------------------------
  `app_open`             打开小程序          source, scene
  `home_view`            首页展示            ---
  `tool_view`            打开工具            tool_id, source
  `calculate`            成功完成计算        tool_id, mode
  `calculate_error`      输入校验/计算失败   tool_id, error_type
  `quote_compare`        完成商家报价比较    tool_id, difference_band
  `result_share`         发起结果分享        tool_id
  `ad_impression`        广告有效展示        ad_type, placement, tool_id
  `reward_ad_start`      主动开始激励广告    placement, tool_id
  `reward_ad_complete`   完成激励广告        placement, tool_id
  `budget_config_used`   使用预算配置        city, level, config_version

## 3. 禁止/避免采集

MVP 默认不上传： - 用户姓名、手机号、精确地址 - 装修合同/聊天内容 -
原始商家名称 - 与计算无关的设备识别信息 - 无必要的完整输入明细

如业务后续确需新增数据，先更新隐私说明和本文件。

## 4. 核心漏斗

``` text
app_open
→ tool_view
→ calculate
→ quote_compare（可选）
→ result_share（可选）
→ ad_impression（开通后）
```

## 5. 指标

### 工具完成率

`calculate / tool_view`

### 报价对比使用率

`quote_compare / calculate`

### 分享率

`result_share / calculate`

### 广告曝光/UV

`ad_impression / unique_visitor`

### 激励广告完成率

`reward_ad_complete / reward_ad_start`

### RPUV

`广告及可归因收入 / UV`

### RPM/1000 UV

`收入 / UV * 1000`

## 6. 分工具分析

必须能按 `tool_id` 比较： - 流量 - 完成率 - 报价对比率 - 分享率 -
广告曝光/UV - RPUV

建议 tool_id： - `tile` - `paint` - `flooring` - `grout` - `curtain` -
`budget`

## 7. 搜索/来源分析

尽可能利用微信提供的合法来源/场景参数区分： - 微信搜索 - 分享进入 -
扫码 - 其他入口

不得自行声称能获得平台未开放的"完整搜索关键词"。若微信后台提供搜索词报告，应以后端/官方后台为准。

## 8. 阶段 KPI

### 0--500 UV

目的：验证产品可用性。 关注： - 是否有人自然进入 - 哪个工具最常用 -
calculate/tool_view - calculate_error

### 500--1,000 UV

目的：验证初步变现与传播。 关注： - 报价对比率 - 分享率 -
广告曝光/UV（如已具备资格） - 初始 eCPM / RPUV

### 1,000--10,000 UV

目的：决定是否值得继续。 关注： - 各工具 RPUV - 流量来源质量 -
7日回访（若平台数据可用） - 哪个工具值得拆出更多长尾入口

### 10,000 UV 决策

只允许三类决策： 1. `SCALE`：有稳定流量/变现，扩大优胜工具。 2.
`FOCUS`：仅少数工具有效，砍掉/弱化其余功能。 3.
`STOP`：流量与商业数据不足，停止继续堆功能。

## 9. 数据质量

-   开发/测试环境必须标记，避免污染生产数据。
-   `calculate` 只在成功得到合法结果后触发。
-   同一次用户操作不得重复发送同一事件。
-   广告收入以微信广告后台实际结算数据为准，不用客户端估算代替。
