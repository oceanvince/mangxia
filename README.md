<<<<<<< HEAD
# Mangxia Healthcare Platform

A healthcare platform backend API service.

## Project Structure

```
mangxia/
└── backend/               # Node.js/Express server
    ├── src/
    │   ├── controllers/  # Route controllers
    │   ├── models/       # Database models
    │   ├── routes/       # API routes
    │   ├── services/     # Business logic
    │   └── utils/        # Utility functions
    └── package.json
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment files:
   - Copy `.env.example` to `.env` in the backend directory
   - Update the environment variables with your values

3. Start development server:
   ```bash
   npm run dev
   ```

4. Access the application:
   - Backend API: http://localhost:3000
=======
# 芒夏-心脏瓣膜术后服药随访系统

这是一个用于心脏瓣膜术后患者进行华法林用药管理和随访的Web应用。项目分为前端（医生端Admin）和后端服务。

## 技术栈

- **前端**: React, Vite, TypeScript, CSS
- **后端**: Node.js, Express, PostgreSQL
- **包管理器**: npm

## 项目结构

```
.
├── admin/         # 前端医生端 (Vite + React)
│   ├── src/
│   └── package.json
├── backend/       # 后端服务 (Node.js + Express)
│   ├── src/
│   └── package.json
└── README.md
```

## 本地开发启动指南

在开始之前，请确保你已经安装了 [Node.js](https://nodejs.org/) (v16 或更高版本) 和 [PostgreSQL](https://www.postgresql.org/)。

### 1. 启动后端服务

首先，进入后端项目目录，安装依赖，并启动服务。后端服务将运行在 `http://localhost:3001`。

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

**注意**: 后端服务依赖于一个名为 `mangxia_db` 的PostgreSQL数据库。请确保你已经根据 `backend/src/db/` 目录下的 `schema.sql` 和 `init.sql` 文件创建并初始化了数据库。

### 2. 启动前端Admin应用

然后，打开一个新的终端窗口，进入前端项目目录，安装依赖，并启动应用。前端应用将运行在 `http://localhost:5173`。

```bash
# (在新的终端窗口中) 进入前端目录
cd admin

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

现在，你可以通过浏览器访问 `http://localhost:5173` 来使用医生端管理后台了。
>>>>>>> mvp_0_0_1

## Features

### Backend API
- Authentication system
- Patient management
- Medical records management
- Appointment scheduling
- Message system

<<<<<<< HEAD
## Tech Stack

- Backend: Node.js, Express, MongoDB

=======
>>>>>>> mvp_0_0_1
## Development Status

This is an MVP (Minimum Viable Product) version with basic functionality. Future updates will include:
- Enhanced security features
- Real-time chat
- File upload system
- Advanced scheduling system
- Integration with medical devices