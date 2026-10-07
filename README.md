# 校园公共信息与数据展示中心

> 软件开发综合实践 · 课堂作业八（前端技术整合、质量检查与成果验收）自主实践作品
> 作者：容磊　学号：20251060108　2025 计算机科学与技术

把课堂作业一至七的成果组装成一个综合作品，作为**期末大作业的原型**。
主题：校园公共信息与数据展示中心 —— 自习室空位查询、场所使用指数看板、校园三维导览。

---

## 一、项目简介

作品整合了四个模块，通过**同一套顶部导航**串联，彼此之间有主题和数据衔接，不是四个孤立页面：

| 模块 | 页面 | 用到的课堂成果 |
| --- | --- | --- |
| ① 页面结构 | `home.html` | 课堂一、二：语义化骨架、Bootstrap 导航与卡片 |
| ② 样式与响应式 | `css/style.css` | 课堂二、三：Flex/Grid、媒体查询、Bootstrap 栅格与组件 |
| ③ 交互与数据 | `study-room.html` | 课堂四、五：DOM 动态渲染、表单筛选、localStorage |
| ④ 数据可视化 | `dashboard.html` | 课堂六：fetch 加载 JSON、ECharts 柱状图与饼图、jQuery 筛选 |
| ⑤ 三维展示（进阶） | `three-d/scene.html` | 课堂七：Three.js 场景、光照、动画、OrbitControls |
| 质量自查 | `quality.html` | 课堂八：五项质量检查清单与结果记录 |

**模块之间怎么衔接：**

1. `data/data.json` 是**唯一数据源**，首页概览数字、看板图表、自习室名单都读它，所以三处数字必然一致。
2. 首页写明了三模块的推荐使用顺序：先查空位 → 再看整体热度 → 最后看三维方位。
3. 看板里的"与自习室数据的对应"表格，把图表里的自习室指数和各区域实际空位对起来。

---

## 二、运行方法

### 方式一：本地服务器（推荐）

页面通过 `fetch` 读取 `data/data.json`，直接双击打开会受到 `file://` 协议的同源限制。
在**项目根目录**（本文件所在目录）执行任一命令：

```bash
# 有 Python 3
python -m http.server 8000

# 有 Node.js
npx serve .
```

然后浏览器访问：

```
http://localhost:8000/home.html
```

### 方式二：VS Code Live Server

用 VS Code 打开本目录，右键 `home.html` → **Open with Live Server**。

### 方式三：直接双击（部分功能受限）

双击 `home.html` 也能打开页面，但浏览器可能拦截 `fetch` 读取本地 JSON，
此时页面会显示"数据加载失败，请检查 data/data.json 是否存在，或用本地服务器方式重新打开页面"——
这是**预期行为**，不是崩溃。三维页与样式部分不受影响。

---

## 三、目录结构

```
integration/
├── index.html              入口，自动跳转到 home.html
├── home.html               首页：数据概览 + 模块入口卡片
├── study-room.html         自习室查询：筛选 + 我的预约（localStorage）
├── dashboard.html          数据看板：ECharts 柱状图 + 饼图 + 对应表
├── quality.html            质量自查记录（五项清单）
├── css/
│   └── style.css           自定义样式（在 Bootstrap 之后引入，保证能覆盖）
├── js/
│   ├── main.js             全站公共逻辑：导航高亮、数据加载、座位状态、本地存储
│   ├── home.js             首页概览
│   ├── study-room.js       自习室筛选与预约
│   ├── dashboard.js        图表渲染与 jQuery 筛选
│   └── scene.js            三维场景
├── data/
│   └── data.json           统一数据源
├── three-d/
│   └── scene.html          三维导览页
├── _fixtures/              质量自查用的测试替身（空数据、格式错误）
└── libs/                   第三方库（全部本地化，断网也能用）
```

**加载顺序约定：** 库在前，自己的代码在后；CSS 顺序为 Bootstrap → 自定义样式。
`libs/` 全部本地化，不依赖 CDN，所以在断网环境下样式、图表、三维仍然正常。

---

## 四、资源来源与许可

| 资源 | 版本 | 来源 | 许可 |
| --- | --- | --- | --- |
| Bootstrap | 5.3.3 | https://getbootstrap.com/ | MIT |
| ECharts | 5.5.1 | https://echarts.apache.org/ | Apache-2.0 |
| jQuery | 3.7.1 | https://jquery.com/ | MIT |
| Three.js | r128（随课堂资料下发） | https://threejs.org/ | MIT |
| OrbitControls | 随 Three.js 下发 | https://threejs.org/docs/#examples/en/controls/OrbitControls | MIT |

**数据来源说明：** `data/data.json` 中的场所使用指数、自习室座位数为**课程练习用自拟数据**，
用于演示图表与筛选功能，不是学校官方统计，不代表真实情况。文件内 `meta.source` 字段也做了标注。

**代码来源说明：**

- 三维场景（`js/scene.js`）在课堂作业七"旋转展示台"的基础上改造：保留场景/相机/渲染器/光照/动画循环的骨架，
  把展台与几何体换成校园地面、教学楼、图书馆、旗杆与树木。
- 看板（`js/dashboard.js`）在课堂作业六的看板基础上改造：改为读取统一数据源、补齐三状态处理与图表说明。
- 自习室筛选复用了课堂作业五的"先改数据、再统一渲染"模式。
- 页面结构、样式与整合逻辑为本作品新写。

---

## 五、已知限制

1. **`file://` 下 `fetch` 可能被拦截**：请按第二节用本地服务器方式运行。
2. **三维页在低端设备上帧率较低**：场景做了 `visibilitychange` 处理，页面切到后台会暂停渲染循环。
3. **座位数据是静态的**：`zones` 里的空位是基准值，切换时间段时按系数换算，不是实时数据。
4. **未实现的功能（明确不做）**：用户登录、真实预约写入后台、历史趋势折线图。这些超出课堂技术栈范围。

---

## 六、Git 提交说明

本项目按"骨架 → 交互 → 图表 → 三维 → 自查"分步提交，提交说明均写明具体做了什么，
不使用 "update"、"final" 这类无信息量的说明。
