Page({
  data: {
    primaryTools: [
      {
        id: "tile",
        name: "瓷砖用量",
        description: "按铺贴面积和瓷砖规格核算用量",
        icon: "砖",
        path: "/pages/tile/tile"
      },
      {
        id: "paint",
        name: "乳胶漆用量",
        description: "估算墙面与顶面的底漆、面漆用量",
        icon: "漆",
        path: "/pages/paint/paint"
      },
      {
        id: "grout",
        name: "美缝剂用量",
        description: "根据砖缝尺寸获得参考用量",
        icon: "缝",
        path: "/pages/grout/grout"
      },
      {
        id: "flooring",
        name: "地板用量",
        description: "结合铺装方式预估采购面积",
        icon: "板",
        path: "/pages/flooring/flooring"
      }
    ],
    moreTools: [
      {
        id: "curtain",
        name: "窗帘宽度",
        description: "根据轨道宽度估算成品布幅",
        icon: "帘",
        path: "/pages/curtain/curtain"
      },
      {
        id: "budget",
        name: "装修预算粗估",
        description: "按装修项目梳理预算构成",
        icon: "预",
        path: "/pages/budget/budget"
      }
    ]
  },

  openTool(event) {
    const { path } = event.currentTarget.dataset;

    wx.navigateTo({ url: path });
  }
});
