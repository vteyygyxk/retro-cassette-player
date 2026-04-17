# 复古磁带播放器 Retro Cassette Player

一款怀旧风格的网页音乐播放器，模拟经典磁带录音机的视觉和交互体验。

<img width="931" height="832" alt="image" src="https://github.com/user-attachments/assets/011e7e44-4fd6-43ae-aaae-a9996ca1cf40" />


## 功能特性

### 播放控制
- 播放/暂停/停止
- 快进/快退（按住持续加速）
- 上一曲/下一曲
- 进度条拖动定位

### 播放模式
- 顺序播放
- 列表循环
- 单曲循环
- 随机播放

### 音量控制
- 旋钮式音量调节
- 点击切换静音
- 音量状态显示

### 歌词显示
- 同步歌词滚动
- 自动在线搜索歌词
- 支持加载本地 LRC 文件
- LED 风格显示

### 播放列表
- 拖放文件添加音乐
- 左滑快速删除曲目
- 收藏夹管理
- 支持批量添加

### 音乐搜索
- 在线搜索音乐
- 免费歌曲直接播放
- 自动获取封面和歌词

### 可视化
- 实时频谱分析显示
- 磁带卷轴旋转动画
- 更换磁带动画效果

### 皮肤主题
- 经典黑
- 复古棕
- 霓虹粉
- 自定义颜色

### 快捷键
| 按键 | 功能 |
|------|------|
| Space | 播放/暂停 |
| Left | 快退 |
| Right | 快进 |
| Up | 音量增加 |
| Down | 音量减少 |
| M | 静音切换 |
| N | 下一曲 |
| P | 上一曲 |

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 状态管理
- **Framer Motion** - 动画库
- **music-metadata** - 音频元数据解析
- **Vitest** - 测试框架

## 安装运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

## 使用说明

### 添加音乐
1. 拖放音频文件到播放器区域
2. 点击「添加文件」按钮选择文件
3. 使用在线搜索功能查找音乐

### 支持的格式
- MP3
- WAV
- OGG
- FLAC

### 歌词功能
- 播放音乐时自动搜索在线歌词
- 可手动加载本地 `.lrc` 歌词文件
- LED 显示区显示同步歌词

### 播放列表操作
- 点击曲目播放
- 左滑删除（滑动超过一半直接删除）
- 点击心形图标收藏

## 项目结构

```
src/
├── components/           # UI 组件
│   ├── ControlPanel/    # 播放控制按钮
│   ├── FavoritesPanel/  # 收藏列表面板
│   ├── LEDDisplay/      # LED 显示屏
│   ├── MusicSearchPanel/# 音乐搜索面板
│   ├── PlaylistPanel/   # 播放列表面板
│   ├── SkinSelector/    # 皮肤选择器
│   ├── Speaker/         # 扬声器动画
│   ├── TapeDeck/        # 磁带主体
│   ├── TrackListPanel/  # 曲目列表通用组件
│   └── VolumeKnob/      # 音量旋钮
├── hooks/               # 自定义 Hooks
│   ├── useKeyboardShortcuts.ts
│   ├── useLyrics.ts
│   ├── useMusicSearch.ts
│   └── useResponsive.ts
├── services/            # 服务层
│   ├── audioService.ts  # 音频播放服务
│   ├── fileService.ts   # 文件处理服务
│   ├── lyricsService.ts # 歌词服务
│   ├── musicSearchService.ts # 音乐搜索服务
│   └── storageService.ts # 本地存储服务
├── stores/              # 状态管理
│   └── playerStore.ts   # Zustand store
├── data/                # 静态数据
│   └── skins.ts         # 皮肤配置
├── types/               # TypeScript 类型
│   └── index.ts
├── styles/              # 全局样式
└── utils/               # 工具函数
```

## 开发

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 TypeScript 严格模式
- 组件使用函数式写法

### 测试
- 使用 Vitest + Testing Library
- 组件测试覆盖核心功能
- 服务层单元测试

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## License

MIT
