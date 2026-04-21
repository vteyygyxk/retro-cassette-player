# 🎵 复古磁带播放器

一个基于 React 的复古风格音乐播放器，拥有磁带机外观、在线音乐搜索、AI 音乐助手等功能。

![版本](https://img.shields.io/badge/version-1.0.1-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Vite](https://img.shields.io/badge/Vite-8.0-646cff)

---

## ✨ 功能特性
![Uploading image.png…]()

### 🎛️ 播放器核心
- 复古磁带机 UI，磁带转轴动画随播放状态同步
- 支持本地音频文件（拖拽或点击上传）
- 支持在线音乐搜索（网易云音乐）
- 播放列表管理（添加、删除、排序）
- 收藏夹功能，收藏喜爱的歌曲
- 播放模式：顺序播放 / 列表循环 / 单曲循环 / 随机播放
- 快进 / 快退 / 上一首 / 下一首
- 音量调节（滚轮旋钮）
- 歌词显示面板

### 🎨 外观定制
- 内置多款磁带皮肤：经典黑、复古棕、霓虹粉
- 自定义皮肤：自由调整机身颜色、转轴颜色、标签颜色
- 专辑封面展示，支持封面回退占位图

### 🤖 AI 音乐助手
- 接入阿里云通义千问（qwen-turbo）
- 支持自然语言点歌，如"我想听周杰伦的稻香"
- 支持随机播放指令
- 支持音乐知识问答
- 悬浮聊天窗口，不影响主界面操作

### 🎙️ 语音输入
- 接入讯飞语音听写（流式版）WebSocket API
- 说话自动识别，静音后自动发送给 AI 助手
- 自动选择真实麦克风设备（排除虚拟音频设备）
- 支持动态修正，识别更准确

### 📊 可视化
- LED 频谱可视化，实时显示音频频率
- 磁带转轴转速与播放状态联动
- 时间进度显示

### 🌤️ 日期天气
- 实时显示当前日期和时间
- 自动获取本地天气信息

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

---

## ⚙️ 配置说明

### AI 助手配置（通义千问）

1. 前往 [阿里云灵积控制台](https://dashscope.console.aliyun.com/apiKey) 获取 API Key
2. 点击播放器右下角 🤖 图标打开 AI 助手
3. 点击 ⚙️ 设置，在「通义千问」标签页填入 API Key 并保存

### 语音识别配置（讯飞）

1. 前往 [讯飞开放平台](https://console.xfyun.cn/services/iat) 创建应用并开通「语音听写（流式版）」服务
2. 获取 AppID、API Key、API Secret
3. 在 AI 助手设置的「语音识别」标签页填入并保存
4. 每日免费 500 次调用

---

## 🎮 使用说明

### 播放本地音乐

将音频文件（MP3、WAV、FLAC 等）拖拽到播放器区域，或点击「选择文件」按钮上传。

### 在线搜索音乐

在右侧搜索面板输入歌曲名或歌手名，点击搜索结果即可加入播放列表。

### 使用 AI 助手点歌

1. 点击右下角 🤖 按钮打开助手
2. 输入或语音说出你想听的歌曲
3. AI 会自动搜索并播放

**示例指令：**
- "我想听周杰伦的稻香"
- "放一首林俊杰的歌"
- "随机播放一首歌"
- "来首轻松的音乐"

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放 / 暂停 |
| `←` | 上一首 |
| `→` | 下一首 |
| `↑` | 音量增加 |
| `↓` | 音量减少 |
| `M` | 静音切换 |

---

## 🏗️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 6.0 | 类型安全 |
| Vite | 8.0 | 构建工具 |
| Zustand | 5.0 | 状态管理 |
| Framer Motion | 12 | 动画效果 |
| crypto-js | 4.2 | 讯飞鉴权签名 |
| music-metadata | 11 | 本地音频元数据解析 |

---

## 📁 项目结构

```
src/
├── components/
│   ├── AIChat/          # AI 音乐助手聊天组件
│   ├── ControlPanel/    # 播放控制按钮面板
│   ├── DateTimeWeather/ # 日期时间天气组件
│   ├── FavoritesPanel/  # 收藏夹面板
│   ├── LEDDisplay/      # LED 显示屏（歌曲信息、频谱）
│   ├── LyricsPanel/     # 歌词面板
│   ├── MusicSearchPanel/# 在线音乐搜索面板
│   ├── PlaylistPanel/   # 播放列表面板
│   ├── SkinSelector/    # 皮肤选择器
│   ├── Speaker/         # 扬声器装饰组件
│   ├── TapeDeck/        # 磁带仓（转轴动画、专辑封面）
│   ├── TapePlayer/      # 主播放器容器
│   ├── TodayHitsPanel/  # 今日热歌面板
│   ├── TrackListPanel/  # 曲目列表面板
│   └── VolumeKnob/      # 音量旋钮
├── hooks/
│   ├── useKeyboardShortcuts.ts  # 键盘快捷键
│   ├── useLyrics.ts             # 歌词获取
│   ├── useMusicSearch.ts        # 音乐搜索逻辑
│   ├── useResponsive.ts         # 响应式布局
│   └── useSpeechRecognition.ts  # 语音识别
├── services/
│   ├── audioService.ts          # Web Audio API 音频处理
│   ├── fileService.ts           # 本地文件处理
│   ├── lyricsService.ts         # 歌词服务
│   ├── musicSearchService.ts    # 网易云音乐 API
│   ├── storageService.ts        # 本地存储
│   └── xunfeiSpeechService.ts   # 讯飞语音识别
├── stores/
│   └── playerStore.ts           # Zustand 全局状态
├── data/
│   └── skins.ts                 # 磁带皮肤数据
└── types/                       # TypeScript 类型定义
```

---

## 🧪 测试

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

---

## 📝 开发说明

### 在线音乐搜索

在线搜索通过 Vite 开发服务器代理网易云音乐 API，仅在开发模式下可用。生产环境需要自行搭建代理服务。

### 语音识别注意事项

- 需要 HTTPS 或 localhost 环境（浏览器麦克风权限要求）
- 如果系统有虚拟音频设备（如网易云音乐虚拟设备），会自动跳过，选择真实麦克风
- 讯飞语音听写最长支持 60 秒连续识别

---

## 📄 License

MIT
