<div align="center">

# 🕵️ AI 剧本杀 / AI Murder Mystery

**多智能体 LLM 驱动的沉浸式谋杀悬疑推理游戏**

**每个角色都是独立的 AI 智能体，拥有独特人格、记忆与秘密。**
**你能通过对话、推理和证据，找出真正的凶手吗？**

<img alt="游戏界面" src="assets/游戏界面.png" width="80%">

*▲ 游戏界面 — 与各角色对话收集线索*

<br/>

[![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 项目简介

AI 剧本杀（AI Murder Mystery）是一个基于多智能体大语言模型的沉浸式谋杀悬疑推理游戏。每个角色都是独立的 AI 智能体，具有独特的人格、记忆和行为模式。游戏采用「初始生成 → 批评检测 → 智能修订」三层防泄露机制，确保推理过程的公正性和趣味性。

你可以选择预设剧本或自定义剧本，与各角色对话收集线索，利用 AI 搭档分析案件，最终指认凶手并揭示动机。

## 功能截图

| | |
|:---:|:---:|
| ![剧本库](assets/剧本库.png) | ![剧本库创建](assets/剧本库创建.png) |
| *剧本库 — 浏览和管理所有剧本* | *剧本创建 — 可视化剧本编辑器* |
| ![剧本库质检](assets/剧本库质检.png) | ![游戏界面](assets/游戏界面.png) |
| *质检系统 — AI 多维度分析剧本质量* | *游戏界面 — 与嫌疑人对话收集线索* |
| ![AI助手](assets/AI助手协助你调查案件.png) | ![证物系统](assets/类似《逆转裁判》的证物系统.png) |
| *AI 助手 — 协助你分析案件* | *证物系统 — 类似《逆转裁判》的证物出示* |
| ![提交推理](assets/提交推理结果--正确就结束游戏.png) | ![选择动机](assets/选择嫌疑人只是第一步，第二步的动机对了才能结.png) |
| *提交推理 — 指认凶手提交最终答案* | *动机选择 — 选对嫌疑人还要选对动机* |

<div align="center">
<img alt="真相揭示" src="assets/找到真凶让其无法狡辩后，嫌疑人开始讲述作案动机和前因后果.png" width="80%">

*找到真凶后，嫌疑人讲述作案动机和前因后果*
</div>

## 核心特色

- **多智能体角色系统** — 每个角色是独立 AI 智能体，具备独特人格、记忆和对话策略
- **三层 AI 防泄露机制** — 初始生成 → 批评检测 → 智能修订，角色不会意外泄露关键信息
- **智能搭档系统** — AI 搭档基于你的推理笔记提供专业案件分析
- **证物系统** — 证物发现、出示、组合、反应，支持 AI 生成证物图像
- **自定义剧本系统** — 可视化剧本编辑器，支持 AI 辅助创作、质检和润色
- **AI 内容生成** — 角色头像、聊天背景、剧本封面、证物图像的 AI 生成
- **流式对话** — 实时流式输出，支持中途中断
- **多 LLM 支持** — Anthropic Claude / OpenAI GPT / DeepSeek / Gemini / Groq / Ollama

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Mantine UI 7 + React Router 7 |
| 后端 | Python 3.12 + FastAPI + SQLAlchemy + Uvicorn |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） |
| 状态管理 | React Context + Constate |
| 客户端存储 | IndexedDB (localforage) + localStorage |
| AI 服务 | Anthropic / OpenAI / DeepSeek / Groq / Ollama / OpenRouter |
| 图像生成 | 火山引擎 API |
| 部署 | Docker + Docker Compose |

## 快速开始

### 环境要求

- Python 3.12+
- Node.js 16+
- npm

### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai-murder-mystery.git
cd ai-murder-mystery
```

### 2. 配置环境变量

```bash
cp api/.env.example api/.env
```

编辑 `api/.env`，填入你的 AI 服务配置：

```bash
# AI 服务提供商：anthropic / openai / groq / ollama / openrouter
INFERENCE_SERVICE=openai

# 模型名称
MODEL=gpt-4o-mini

# API 密钥
API_KEY=sk-your-api-key

# 最大 token 数
MAX_TOKENS=8192

# （可选）自定义 API 地址，适用于 DeepSeek、中转等场景
# OPENAI_API_BASE=https://api.deepseek.com

# （可选）Ollama 本地部署地址
# OLLAMA_URL=http://localhost:11434

# （可选）PostgreSQL 连接地址，不设置则使用 SQLite
# DB_CONN_URL=postgresql://user:pass@host:5432/dbname

# （可选）火山引擎，用于图像生成
# VOLC_ACCESS_KEY=your-key
# VOLC_SECRET_KEY=your-secret
```


<details>
<summary>各 AI 服务配置示例</summary>

**Anthropic Claude:**
```bash
INFERENCE_SERVICE=anthropic
API_KEY=your_anthropic_api_key
MODEL=claude-3-haiku-20240307
```

**OpenAI GPT:**
```bash
INFERENCE_SERVICE=openai
API_KEY=sk-your-openai-api-key
MODEL=gpt-4o-mini
```

**DeepSeek:**
```bash
INFERENCE_SERVICE=openai
API_KEY=sk-your-deepseek-api-key
MODEL=deepseek-chat
OPENAI_API_BASE=https://api.deepseek.com
```

**Groq:**
```bash
INFERENCE_SERVICE=groq
API_KEY=your_groq_api_key
MODEL=llama3-8b-8192
```

**Ollama（本地部署）:**
```bash
INFERENCE_SERVICE=ollama
MODEL=llama2
OLLAMA_URL=http://localhost:11434
```

</details>

### 3. 安装依赖并启动

**方式一：使用 Makefile（推荐）**

```bash
# 一键安装所有依赖
make install

# 一键启动前后端（开发模式，带热重载）
make dev
```

**方式二：手动启动**

```bash
# 后端
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 10000 --reload

# 前端（新终端）
cd web
npm install
npm start
```

### 4. 访问

- 前端界面：http://localhost:5001
- 后端 API：http://localhost:10000
- 健康检查：http://localhost:10000/health

## Docker 部署

```bash
# 配置环境变量
cp api/.env.example api/.env
# 编辑 api/.env 填入配置

# 启动
docker compose up

# 重新构建
docker compose up --build
```

## 项目结构

```
├── api/                          # 后端 (Python FastAPI)
│   ├── main.py                   # 主应用入口，API 端点
│   ├── settings.py               # 配置管理（LLM 服务、模型选择）
│   ├── llm_service.py            # AI 三阶段处理（生成→批评→修订）
│   ├── invoke_types.py           # Pydantic 数据模型
│   ├── models.py                 # SQLAlchemy ORM 模型
│   ├── evidence_models.py        # 证物系统数据模型
│   ├── db.py                     # 数据库连接池
│   ├── scripts_api.py            # 剧本管理 API
│   ├── evidence_api.py           # 证物系统 API
│   ├── database_api.py           # 数据库操作 API
│   ├── spoiler_story_api.py      # 剧透故事 API
│   ├── avatar_generator.py       # 角色头像生成
│   ├── cover_generator.py        # 剧本封面生成
│   ├── background_generator.py   # 聊天背景生成
│   ├── evidence_generator.py     # 证物图像生成
│   ├── schema.sql                # PostgreSQL 数据库结构
│   ├── requirements.txt          # Python 依赖
│   ├── Dockerfile                # 后端容器配置
│   └── .env.example              # 环境变量模板
│
├── web/                          # 前端 (React TypeScript)
│   ├── src/
│   │   ├── pages/                # 页面组件
│   │   │   ├── Home.tsx          # 主游戏界面
│   │   │   ├── ScriptLibrary.tsx # 剧本库
│   │   │   ├── ScriptEditor.tsx  # 剧本编辑器
│   │   │   ├── ScriptGenerator.tsx # AI 剧本生成
│   │   │   ├── PlayScript.tsx    # 剧本游玩
│   │   │   └── DocsPage.tsx      # 文档页面
│   │   ├── components/           # UI 组件
│   │   │   ├── Actor.tsx         # 角色对话界面
│   │   │   ├── EnhancedNotesPanel.tsx # 推理笔记面板
│   │   │   ├── MultipleChoiceGame.tsx # 答题推理
│   │   │   ├── evidence/        # 证物系统组件
│   │   │   ├── notes/           # 笔记系统组件
│   │   │   ├── ScriptEditor/    # 编辑器子组件
│   │   │   └── ScriptGenerator/ # 生成器子组件
│   │   ├── providers/            # React Context 状态管理
│   │   ├── api/                  # API 调用层
│   │   ├── types/                # TypeScript 类型定义
│   │   └── utils/                # 工具函数
│   ├── public/                   # 静态资源
│   │   ├── character_avatars/    # 角色头像
│   │   ├── script_covers/        # 剧本封面
│   │   ├── script_scenes/        # 场景背景
│   │   └── evidence_images/      # 证物图像
│   ├── package.json
│   └── Dockerfile
│
├── docs/                         # 项目文档
├── data/                         # 数据文件
├── Makefile                      # 开发命令
└── README.md
```

## 游戏玩法

1. **选择剧本** — 从剧本库选择预设剧本，或使用编辑器创建自定义剧本
2. **角色分配** — 系统自动识别玩家、搭档、凶手、嫌疑人等角色
3. **调查阶段** — 与各角色对话收集线索，记录推理笔记，收集和出示证物
4. **搭档协作** — 利用 AI 搭档分析案件，获得专业建议
5. **推理结算** — 选择凶手和动机，系统 AI 生成动机选项
6. **真相揭示** — 查看完整真相和作案过程

## 支持的 AI 服务

| 服务 | 模型示例 | 说明 |
|------|----------|------|
| Anthropic Claude | claude-3-haiku-20240307 | 推理能力强 |
| OpenAI GPT | gpt-4o-mini, gpt-4 | 通用性好 |
| DeepSeek | deepseek-chat | 中文优秀，性价比高 |
| Groq | llama3-8b-8192 | 推理速度极快 |
| Ollama | llama2, qwen | 本地部署，数据安全 |
| OpenRouter | 多种模型 | 统一代理多家模型 |

## Makefile 常用命令

```bash
make install       # 安装前后端所有依赖
make dev           # 一键启动前后端（开发模式）
make backend       # 仅启动后端
make frontend      # 仅启动前端
make stop          # 停止所有服务
make clean-ports   # 清理端口占用
make status        # 查看服务状态
make setup         # 一键设置（安装工具 + 依赖）
```


## 故障排除

**端口冲突：** 运行 `make clean-ports` 清理 5001 和 10000 端口占用。

**后端连接失败：** 确认 `api/.env` 配置正确，运行 `curl http://localhost:10000/health` 检查后端状态。

**AI 调用失败：** 检查 API 密钥、网络连接和模型名称是否正确，查看后端终端日志。

**数据库问题：** 删除 `api/murder_mystery.db` 后重启后端，数据库会自动重建。

## 联系方式

<img alt="个人微信 " src="微信.png" width="80%">
## 致谢

本项目基于 [AI Murder Mystery Hackathon](https://github.com/ironman5366/ai-murder-mystery-hackathon) 项目开发，原始项目由 [Paul Scotti](https://paulscotti.github.io/) 和 [Will Beddow](https://www.willbeddow.com/) 创建。

## License

[MIT](LICENSE)
