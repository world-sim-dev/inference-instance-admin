# React Frontend

基于 React + TypeScript + Vite + Ant Design 的前端应用。

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Ant Design** - UI 组件库
- **React Query** - 数据获取和状态管理
- **Axios** - HTTP 客户端
- **ESLint** - 代码检查
- **Prettier** - 代码格式化

## 项目结构

```
src/
├── components/     # 可复用组件
├── pages/         # 页面组件
├── hooks/         # 自定义 Hooks
├── services/      # API 服务
├── utils/         # 工具函数
├── types/         # TypeScript 类型定义
├── constants/     # 常量定义
└── assets/        # 静态资源
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 代码格式化
npm run format

# 预览构建结果
npm run preview
```

## 环境变量

复制 `.env.example` 到 `.env` 并配置相应的环境变量：

```bash
cp .env.example .env
```

## API 配置

默认 API 地址为 `http://localhost:8000`，可通过环境变量 `VITE_API_BASE_URL` 修改。