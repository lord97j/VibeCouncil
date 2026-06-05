# VibeCouncil 设计文档

> 浏览器里的多 AI 专家委员会 — 通过 Chrome 扩展协调多个 AI 网页讨论，无需 API 集成。

## 1. 产品定位

VibeCouncil 是一个 Chrome 浏览器扩展，通过 DOM 读写与多个 AI 网页应用（ChatGPT、Gemini 等）交互，将它们组织成结构化的专家讨论流程，综合输出高质量答案。

**核心价值**：不是简单的"多 AI 群发器"，而是基于成熟讨论/决策模型的产品化工具。

## 2. 整体架构

采用纯 Content Script 轻量架构：

```
┌─────────────────────────────────────────────────┐
│                  Chrome Extension                │
│                                                  │
│  ┌──────────────┐    ┌──────────────────────┐   │
│  │  Side Panel   │◄──►│  Orchestrator        │   │
│  │  (UI 层)      │    │  (流程状态机)         │   │
│  └──────────────┘    └──────────┬───────────┘   │
│                                  │               │
│                     chrome.runtime.sendMessage    │
│                                  │               │
│              ┌───────────────────┼───────────┐   │
│              ▼                   ▼           │   │
│  ┌──────────────────┐ ┌──────────────────┐   │   │
│  │ ChatGPTAdapter   │ │ GeminiAdapter    │   │   │
│  │ (Content Script) │ │ (Content Script) │   │   │
│  └──────────────────┘ └──────────────────┘   │   │
│         │                      │              │   │
│         ▼                      ▼              │   │
│    [chatgpt.com tab]    [gemini.google.com]   │   │
└─────────────────────────────────────────────────┘
```

### 四大模块

| 模块 | 职责 | 运行环境 |
|------|------|----------|
| **Adapter** | 平台特定的 DOM 读写，封装为统一接口 | Content Script |
| **Orchestrator** | 讨论流程状态机，协调各 Adapter 执行顺序 | Side Panel |
| **Side Panel UI** | 用户界面：提问、配置、进度展示、结果查看 | Side Panel |
| **Context Menu** | 右键菜单和快捷键注册，跨页面发送问题 | Background SW |

### Adapter 统一接口

```typescript
interface AIPlatformAdapter {
  id: string;              // "chatgpt" | "gemini" | ...
  name: string;            // 显示名称
  hostPattern: string;     // URL 匹配模式，用于 tab 检测

  sendPrompt(text: string): Promise<void>;
  waitForResponse(): Promise<string>;
  isReady(): Promise<boolean>;
}
```

新平台只需实现此接口，注册到 Adapter Registry 即可接入。

## 3. 讨论流程体系

### 核心设计：可插拔讨论模板（Strategy 模式）

```typescript
interface DiscussionStrategy {
  id: string;
  name: string;
  description: string;
  supportedRounds: [number, number];
  requiredParticipants: number;
  generatePrompt(context: RoundContext): string;
  advanceRound(state: DiscussionState): RoundAction[];
}
```

### 默认流程：Delphi + Debate 混合模式

```
Round 1: INDEPENDENT
  各 AI 独立回答，互不可见
  → 输出：观点 + 置信度(1-5) + 关键理由 + 最大不确定性

Round 2: ANONYMOUS_SYNTHESIS
  插件（非 AI）匿名汇总所有观点
  → 提取：共识点、分歧点、遗漏点

Round 3: CRITIQUE_REVISE
  每个 AI 基于匿名汇总进行质疑和修正
  → 要求：必须指出不同意之处 + 说明是否改变观点及原因

Round 4: FINAL_JUDGE
  裁判 AI 综合全部讨论，输出结构化最终答案
```

### MVP 内置 6 个讨论模板

| 优先级 | 模板 ID | 产品名 | 说明 | 最少 AI 数 |
|-------|---------|--------|------|-----------|
| P0 | `parallel` | 快速对比 | 并行独立回答，无交叉 | 2 |
| P0 | `delphi` | 专家收敛 | 独立→匿名汇总→修正→收敛 | 2 |
| P0 | `debate` | 圆桌讨论 | 自由表达、质疑、补充，形成共识 | 2 |
| P1 | `six-hats` | 多视角分析 | 事实/风险/机会/创意/直觉/总结 | 5（或复用 AI + 切换角色） |
| P1 | `red-blue` | 攻防评审 | 提方案→攻击→修正→合规评估 | 2（攻/防） |
| P1 | `matrix` | 选型打分 | 定义维度→各 AI 打分→汇总分歧 | 2 |

### 模板分类体系（后续扩展预留）

```
发散型：Parallel, Double Diamond, Six Hats
收敛型：Delphi, Decision Matrix, Judge Summary
对抗型：Debate(LGD), Red-Blue, Premortem
复盘型：AAR, OODA, Root Cause Analysis
```

### 防污染机制（所有模板共享）

- **第一轮始终独立**：避免强势观点污染后续回答
- **匿名汇总由插件完成**：不暴露哪个观点来自哪个 AI
- **强制差异化提示**：要求 AI 指出不同意之处，不要简单附和
- **观点变更必须说明原因**：如果 AI 改变了立场，需要解释理由

## 4. Side Panel UI 布局

```
┌──────────────────────────────┐
│  VibeCouncil          [⚙️]   │  顶部标题栏 + 设置
├──────────────────────────────┤
│  📝 提问区域                   │
│  ┌──────────────────────────┐│
│  │ 输入你的问题...            ││
│  └──────────────────────────┘│
│  [讨论模式 ▼]  [轮次: 3 ▼]   │  配置行
│  [裁判: ChatGPT ▼]  [风格 ▼] │
│  [🚀 开始讨论]                │
├──────────────────────────────┤
│  📊 讨论进度                   │
│  ● Round 1: 独立回答 ✅       │  实时状态
│  ◐ Round 2: 匿名汇总 ⏳      │
│  ○ Round 3: 交叉审阅         │
│  ○ Round 4: 裁判总结         │
├──────────────────────────────┤
│  💬 讨论记录                   │
│  [全部] [ChatGPT] [Gemini]   │  标签页切换
│  ┌─ Round 1 ──────────────┐ │
│  │ 🤖 ChatGPT: ... 4/5    │ │  折叠卡片
│  │ 🔷 Gemini: ... 3/5     │ │
│  └────────────────────────┘ │
│  ┌─ Round 2 匿名汇总 ──────┐ │
│  │ 📋 共识: ... ⚡ 分歧: ...│ │
│  └────────────────────────┘ │
├──────────────────────────────┤
│  🏆 最终结论                   │
│  [📋 复制] [💾 导出] [🔄 重试]│
└──────────────────────────────┘
```

### UI 三层结构

| 层 | 组件 | 说明 |
|---|------|------|
| **输入层** | 提问区 + 配置项 | 输入问题、选择模式/轮次/裁判/风格 |
| **进度层** | 状态时间线 | 实时展示当前讨论进度 |
| **内容层** | 讨论记录 + 最终结论 | 按 Round 分组的消息流，支持按 AI 筛选 |

### 关键交互

- **标签页检测**：启动前显示各平台就绪状态，未就绪提供"一键打开"按钮
- **讨论进行中**：输入层收起，内容层实时流式展示各 AI 回答
- **讨论完成**：最终结论固定底部，提供复制/导出/重试操作
- **Context Menu**：选中文本右键「发送到 VibeCouncil 讨论」，自动填充并打开 Side Panel

## 5. 数据模型与存储

### 核心数据结构

```typescript
interface DiscussionSession {
  id: string;
  question: string;
  strategy: DiscussionStrategy;
  config: DiscussionConfig;
  status: DiscussionStatus;
  rounds: Round[];
  finalConclusion?: Conclusion;
  createdAt: number;
  completedAt?: number;
}

interface DiscussionConfig {
  rounds: number;                    // 总轮次 (1-4)
  judgeAdapterId: string;            // 裁判 AI 的 adapter id
  promptStyle: 'strict' | 'creative' | 'neutral';
  participantIds: string[];          // 参与的 AI adapter ids
}

type DiscussionStatus =
  | 'idle' | 'dispatching' | 'collecting'
  | 'cross_review' | 'synthesizing'
  | 'done' | 'failed';

interface Round {
  roundNumber: number;
  type: 'independent' | 'anonymous_synthesis' | 'critique_revise' | 'judge';
  responses: AIResponse[];
  synthesis?: AnonymousSynthesis;
}

interface AIResponse {
  adapterId: string;
  status: 'pending' | 'streaming' | 'completed' | 'failed';
  content: string;
  confidence?: number;               // 1-5，Delphi 模式使用
  changedMind?: boolean;
  changeReason?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

interface AnonymousSynthesis {
  consensus: string[];               // 共识点
  disagreements: string[];           // 分歧点
  gaps: string[];                    // 遗漏点
}

interface Conclusion {
  judgeAdapterId: string;
  content: string;
  timestamp: number;
}
```

### 存储方案

| 数据 | 存储位置 | 生命周期 |
|------|---------|---------|
| 讨论历史 | `chrome.storage.local` | 持久化，默认保留 50 条 |
| 当前讨论状态 | Side Panel 内存 | 关闭即丢失（完成后写入历史） |
| Adapter 选择器配置 | `chrome.storage.local` | 持久化，带版本号检测失效 |
| 用户设置 | `chrome.storage.sync` | 跨设备同步 |
| 讨论模板库 | 扩展内置 + `chrome.storage.local` | 内置不可删，用户可添加自定义 |

### 匿名汇总实现

由插件本地完成，不调用外部 API：

1. 比对所有 AI 响应，用文本相似度检测共识点
2. 提取各响应中的关键论点句（基于标点、关键词模式）
3. 识别分歧：对同一子问题的不同立场归类
4. 格式化为匿名摘要文本，发送给各 AI 进入下一轮

这是方案中最薄弱的环节——纯规则方法可能不如 LLM 汇总精准，但符合"不调用外部 API"的约束。后续可开放可选的 LLM 辅助汇总。

## 6. Adapter 实现与 DOM 交互

### Adapter 基类

```typescript
abstract class BaseAdapter implements AIPlatformAdapter {
  abstract id: string;
  abstract name: string;
  abstract hostPattern: string;

  abstract getPromptInput(): Element;
  abstract getSendButton(): Element;
  abstract getLastResponse(): string;
  abstract isGenerating(): boolean;
  abstract getLoginIndicator(): Element | null;

  async sendPrompt(text: string): Promise<void> {
    const input = this.getPromptInput();
    await this.typeIntoInput(input, text);   // 逐字输入，防检测
    await this.delay(200);
    this.getSendButton().click();
  }

  async waitForResponse(timeout = 120000): Promise<string> {
    await this.waitFor(() => this.isGenerating(), 10000);
    await this.waitFor(() => !this.isGenerating(), timeout);
    return this.getLastResponse();
  }

  async isReady(): Promise<boolean> {
    return this.getLoginIndicator() !== null
      && this.getPromptInput() !== null;
  }
}
```

### MVP 平台：ChatGPT + Gemini

每个平台 Adapter 包含：
- `index.ts` — 实现类
- `selectors.json` — 选择器配置（与代码分离）
- `prompts.ts` — 平台特定的提示词模板

### 选择器容错机制

```
选择器解析优先级：
1. 精确选择器（data-testid、aria-label）
2. CSS 路径选择器（结构定位）
3. 文本内容启发式（placeholder 文本、按钮文字）
4. 全部失败 → 标记 adapter broken，通知用户更新扩展
```

选择器配置与代码分离，存为 JSON 文件。支持通过 `chrome.storage.local` 远程更新选择器（无需发版）。

### 防检测策略

| 策略 | 说明 |
|------|------|
| 逐字输入 | 模拟真人打字速度（30-80ms/字符） |
| 随机延迟 | 操作间加入 100-500ms 随机间隔 |
| 原生事件 | 使用 InputEvent / execCommand 而非直接赋值 |
| 频率控制 | 单个 AI 每分钟最多 2 次消息 |
| 新对话隔离 | 每次讨论前创建新对话，避免上下文污染 |

## 7. 技术栈

| 层面 | 选型 | 理由 |
|------|------|------|
| 扩展标准 | Manifest V3 | Chrome Web Store 强制要求 |
| 语言 | TypeScript 严格模式 | 类型安全，复杂状态机必需 |
| 构建 | Vite + CRXJS | Chrome 扩展 HMR 热更新 |
| UI 框架 | React 18 + Zustand | 轻量状态管理 |
| 样式 | Tailwind CSS | 快速原型，无运行时开销 |
| 测试 | Vitest + Testing Library | 单元测试 + DOM 交互测试 |

## 8. 项目结构

```
vibe-council/
├── manifest.json
├── vite.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── background/
│   │   └── index.ts                   # Service Worker：注册 context menu
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── QuestionInput.tsx       # 提问区 + 配置
│   │   │   ├── ProgressTimeline.tsx    # 讨论进度
│   │   │   ├── DiscussionLog.tsx       # 讨论记录流
│   │   │   ├── FinalConclusion.tsx     # 最终结论展示
│   │   │   ├── PlatformStatus.tsx      # 标签页检测状态
│   │   │   └── Settings.tsx            # 设置页
│   │   └── store/
│   │       └── discussionStore.ts      # Zustand store
│   ├── adapters/
│   │   ├── base.ts                     # BaseAdapter 抽象类
│   │   ├── registry.ts                 # Adapter 注册表
│   │   ├── chatgpt/
│   │   │   ├── index.ts
│   │   │   ├── selectors.json
│   │   │   └── prompts.ts
│   │   └── gemini/
│   │       ├── index.ts
│   │       ├── selectors.json
│   │       └── prompts.ts
│   ├── strategies/
│   │   ├── base.ts                     # DiscussionStrategy 接口
│   │   ├── registry.ts                 # 模板注册表
│   │   ├── parallel.ts
│   │   ├── delphi.ts
│   │   ├── debate.ts
│   │   ├── six-hats.ts
│   │   ├── red-blue.ts
│   │   └── matrix.ts
│   ├── orchestrator/
│   │   ├── index.ts                    # 主协调器，状态机
│   │   ├── tab-manager.ts             # 标签页管理
│   │   └── anonymizer.ts              # 匿名汇总逻辑
│   ├── messaging/
│   │   └── index.ts                    # Content Script ↔ Side Panel 通信层
│   ├── utils/
│   │   ├── dom.ts
│   │   └── text.ts
│   └── types/
│       └── index.ts
└── tests/
    ├── adapters/
    ├── strategies/
    └── orchestrator/
```

## 9. 错误处理

| 错误场景 | 检测方式 | 处理策略 |
|---------|---------|---------|
| AI 平台未登录 | `getLoginIndicator()` 返回 null | 暂停讨论，提示用户登录 |
| 选择器失效 | DOM 查询返回 null | 依次尝试 fallback 选择器，全失败标记 broken |
| AI 响应超时 | 超过 120 秒仍在生成 | 标记该 AI 此轮 failed，继续其他 AI |
| AI 输出被截断 | 检测"继续生成"按钮 | 自动点击继续，重新等待 |
| 弹窗/限流阻断 | 检测 paywall/限流弹窗 | 暂停讨论，通知用户手动处理 |
| 标签页被关闭 | `chrome.tabs.onRemoved` 监听 | 标记 failed，询问是否重新打开 |
| 扩展更新/刷新 | Service Worker 重启 | 状态持久化到 storage，重启后恢复 |
| 多讨论并发 | 用户连续点击开始 | 限制同一时间只允许一个讨论 |

### 通信消息协议

```typescript
type ExtensionMessage =
  | { type: 'SEND_PROMPT';     adapterId: string; prompt: string }
  | { type: 'PROMPT_SENT';     adapterId: string }
  | { type: 'RESPONSE_CHUNK';  adapterId: string; chunk: string }
  | { type: 'RESPONSE_DONE';   adapterId: string; fullText: string }
  | { type: 'RESPONSE_FAILED'; adapterId: string; error: string }
  | { type: 'ADAPTER_STATUS';  adapterId: string; ready: boolean }
  | { type: 'START_DISCUSSION'; question: string; config: DiscussionConfig }
  | { type: 'DISCUSSION_UPDATE'; state: DiscussionState }
  | { type: 'CONTEXT_MENU_TRIGGER'; selectedText: string };
```

## 10. 设计决策记录

| 决策 | 选择 | 替代方案 | 理由 |
|------|------|---------|------|
| 交互机制 | DOM 读写（浏览器扩展） | API 调用、手动中转 | 无需 API 密钥，降低使用门槛 |
| MVP 平台 | ChatGPT + Gemini | ChatGPT + Claude | 两者都有免费版，便于测试 |
| 架构模式 | Content Script 轻量架构 | Background SW 主导 / Offscreen | MVP 调试直观，适配器是核心风险 |
| 讨论默认模式 | Delphi + Debate 混合 | 纯 LGD / 纯并行 | 防污染效果最好，适合 AI 场景 |
| 匿名汇总 | 本地规则抽取 | 调用外部 LLM | 符合无 API 约束，后续可扩展 |
| 状态管理 | Zustand | Redux / Context | 轻量，Side Panel 不需要复杂中间件 |
