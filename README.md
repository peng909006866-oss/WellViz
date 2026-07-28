# 🕳️ WellViz — 市政检查井 3D 可视化与算量工具

基于 Next.js + Three.js 的市政排水构筑物交互式 3D 查阅工具，覆盖：

| 图集 | 井型 | 状态 |
|------|------|------|
| 06MS201-3 | 圆形检查井 / 沉泥井 / 跌水井 | ✅ 框架完成 |
| 06MS201-4 | 雨水口 | ✅ 框架完成 |
| 02S515 | 排水检查井（圆形/矩形） | ✅ 框架完成 |
| 04S516 | 混凝土管道基础 | ✅ 框架完成 |

## ✨ 功能

- 🔍 标准图集交互式 3D 查阅
- 📐 自动查表 — 井径 → 壁厚/配筋/混凝土量/钢筋量
- 🤖 AI 助手 — 自然语言操作参数、解答规范问题
- 📸 图纸识别 — 上传 CAD 截图自动识别井参数
- 📊 工程量导出 — CSV 格式
- 🎨 多种 3D 视角 — 透视/剖面/爆炸视图

## ⚠️ 重要：标准图数据

**本项目仅包含框架代码。标准图集的查表数据（壁厚、配筋规格等）已从 `src/lib/tables.ts` 中移除。**

原因：06MS201、02S515、04S516 为中国建筑标准设计研究院版权出版物，其表格数据不能公开分发。

**如需使用完整功能**，请自行购买正版标准图集，按 `src/lib/tables.ts` 中的接口定义填入数据。文件中的注释标明了每张表对应的图集编号和页码。

## 🚀 快速开始

```bash
git clone https://github.com/peng909006866-oss/WellViz.git
cd WellViz
npm install
npm run dev
```

打开 http://localhost:3010

### 填入数据

编辑 `src/lib/tables.ts`，在每个 `{}` 处按标准图集填入数据。数据格式已在 TypeScript 接口中完整定义。

## 🏗️ 技术栈

- Next.js 16 + React 19 + Three.js (React Three Fiber) + TypeScript
- 多模型 AI 支持 (DeepSeek / OpenAI / SiliconFlow / Qwen)
- **底座框架基于 [RebarViz](https://github.com/BruceLee1024/RebarViz)** by BruceLee1024
- 对 RebarViz 的 3D 组件、AI 引擎、UI 框架做了市政排水领域的适配改造

## 📄 License

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — 继承自 [RebarViz](https://github.com/BruceLee1024/RebarViz)。
署名—非商业性使用。标准图数据版权归中国建筑标准设计研究院所有。

## 🙏 致谢

- 底座 [RebarViz](https://github.com/BruceLee1024/RebarViz) by [BruceLee1024](https://github.com/BruceLee1024) — 提供了优秀的 3D 钢筋可视化框架
- 标准图集：中国建筑标准设计研究院 (06MS201 / 02S515 / 04S516)
