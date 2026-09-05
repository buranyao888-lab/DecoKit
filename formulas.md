# DecoKit formulas.md v1.0

**状态：FROZEN**\
本文件是 MVP
计算逻辑的唯一事实来源。未经产品负责人明确批准，不得修改默认值、公式、取整方式或风险分级。

## 0. 全局计算约定

-   面积：㎡
-   长度 UI 可使用 mm/cm/m，进入计算引擎前统一转换。
-   比率内部使用小数，如 5% = `0.05`。
-   购买"片/箱/支"等不可拆分数量时使用 `ceil`。
-   中间计算保留完整精度，最终展示再格式化。
-   禁止浮点误差造成少买：涉及购买数量时最终向上取整。
-   所有输入必须校验为有限、正数；可选字段除外。
-   不允许用 AI 替代本文件公式。

## 1. 瓷砖用量

### 输入

-   `areaM2`：铺贴面积
-   `tileLengthMm`
-   `tileWidthMm`
-   `layingMode`
-   `piecesPerBox`：可选
-   `merchantPieces`：可选

### 公式

``` text
tileAreaM2 = tileLengthMm * tileWidthMm / 1_000_000
theoreticalPieces = ceil(areaM2 / tileAreaM2)
recommendedPieces = ceil(theoreticalPieces * (1 + lossRate))
boxes = piecesPerBox ? ceil(recommendedPieces / piecesPerBox) : null
```

### 损耗率

-   `straight` 普通直铺：默认 5%，建议可调 3--8%
-   `staggered` 通铺/工字/较多切割：默认 8%，建议可调 5--10%
-   `complex` 斜铺/小砖/复杂空间：默认 10%，建议可调 8--15%
-   特殊拼花：不自动判断，要求用户自定义

### 商家报价比较

``` text
merchantExcessRate = (merchantPieces - recommendedPieces) / recommendedPieces
```

分级： - `<= 5%`：正常参考范围 - `>5% and <=10%`：略高，建议确认备用砖 -
`>10% and <=20%`：明显偏高，建议询问切割、备用砖或特殊铺贴 -
`>20%`：差异较大，建议重新核算

不得输出"被坑/商家欺诈"等结论。

## 2. 乳胶漆

### 输入

优先支持直接输入净涂刷面积 `paintAreaM2`。

辅助面积模式：

``` text
wallNetArea = perimeterM * heightM - openingsAreaM2
paintAreaM2 = wallNetArea + (includeCeiling ? ceilingAreaM2 : 0)
```

"建筑面积倍率"只能作为明确标注的粗估模式，不得作为精准计算。

### 面漆

默认： - `coverageM2PerLPerCoat = 13` - `coatCount = 2` -
`reserveRate = 10%`

公式：

``` text
facePaintLiters =
paintAreaM2 * coatCount / coverageM2PerLPerCoat * (1 + reserveRate)
```

允许高级调整： - coverage：10--16 ㎡/L/遍 - coatCount：1--3 -
reserveRate：0--20%

### 底漆

默认： - `primerCoverage = 11` ㎡/L/遍 - `primerCoats = 1` -
`reserveRate = 10%`

``` text
primerLiters =
paintAreaM2 * primerCoats / primerCoverage * (1 + reserveRate)
```

底漆和面漆必须分别展示。不得把不同包装规格硬编码为"X桶"；如用户提供包装容量，再使用
`ceil(liters/packageLiters)`。

## 3. 地板

### 输入

-   `netAreaM2`
-   `layingMode`
-   `irregularRoom`：是否较多异形墙/柱
-   `boxCoverageM2`：可选

### 损耗

-   `straight`：5%
-   `staggered`：8%
-   `herringbone`：15%
-   `irregularRoom=true`：在上述基础上 +2 个百分点
-   自动损耗率上限：20%；更高只能用户自定义

### 公式

``` text
purchaseAreaM2 = netAreaM2 * (1 + lossRate)
boxes = boxCoverageM2 ? ceil(purchaseAreaM2 / boxCoverageM2) : null
```

## 4. 美缝剂

**可信度：参考估算。**

### 输入

-   `areaM2`
-   `tileLengthMm`
-   `tileWidthMm`
-   `jointWidthMm`
-   `jointDepthMm`，默认 3mm
-   `cartridgeEffectiveVolumeMl` 或产品经验参数

### 几何模型

先转换：

``` text
A = tileLengthMm / 1000
B = tileWidthMm / 1000
jointWidthM = jointWidthMm / 1000
jointDepthM = jointDepthMm / 1000
```

近似单位面积缝长：

``` text
jointLengthPerM2 = (A + B) / (A * B)
totalJointLengthM = areaM2 * jointLengthPerM2
```

理论填充体积：

``` text
volumeM3 = totalJointLengthM * jointWidthM * jointDepthM
volumeMl = volumeM3 * 1_000_000
```

产品支数不得仅凭理论包装容量做"绝对准确"承诺。实现层应支持一个可配置的
`effectiveYieldFactor`/产品经验参数，用于反映混合比例、残留与施工损耗；如没有可靠产品参数，结果应展示为"理论填充量 +
参考支数"，并提示优先以所购产品包装说明为准。

**禁止开发者自行猜测某品牌单支可施工面积。**

## 5. 窗帘

MVP 精确计算"宽度"，高度仅提供测量指导。

### 输入

-   `trackWidthM`
-   `fullness`

默认选项： - 自然：1.5 - 标准丰满：1.8（产品中间推荐值） - 丰满：2.0 -
`panels`：默认 2

### 公式

``` text
totalFinishedWidthM = trackWidthM * fullness
singlePanelWidthM = totalFinishedWidthM / panels
```

不得把高度直接声称为精准裁布尺寸；必须提醒安装方式、挂钩、离地、缝边及面料缩水会影响高度。

## 6. 装修预算

**状态：结构冻结，价格参数 NOT FROZEN。可信度：粗略估算。**

### 结构

``` text
totalBudget =
baseConstruction
+ plumbingElectrical
+ masonry
+ carpentry
+ painting
+ mainMaterials
+ customization
+ kitchenBathroom
+ installation
+ contingency
```

禁止使用固定"全国每㎡单价"作为最终依据。

### 配置

远程配置建议结构：

``` json
{
  "version": "budget_config_v1",
  "city": "example",
  "level": "standard",
  "updated_at": "YYYY-MM-DD",
  "source": "maintained-config",
  "components": {}
}
```

档位可包含：经济 / 标准 / 改善 / 高配。任何金额结果必须展示： -
"预算粗估，不是装修报价" - 城市/档位 - 参数更新时间

## 7. 可信度

-   tile：`high`
-   paint：`medium_high`
-   flooring：`medium_high`
-   grout：`reference`
-   curtain：`medium_high`
-   budget：`rough`

## 8. 单元测试最低要求

每个模块至少覆盖： - 标准输入 - 小数输入 - 极小合法输入 - 非法零值 -
负数 - NaN/Infinity 或等价异常 - 自定义参数边界 - 向上取整边界

瓷砖额外测试：不同铺贴损耗、箱数、商家差异分级。\
乳胶漆：底/面漆分离、遍数和覆盖率调整。\
地板：异形 +2%、20%上限。\
美缝：mm→m→ml 单位转换。\
窗帘：1.5/1.8/2.0 和单/双片。\
预算：缺失/过期配置时必须降级提示，不得伪造价格。
