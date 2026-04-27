FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY frontend/package*.json ./

# 安装依赖
RUN yarn install

# 复制源代码
COPY frontend/src ./src
COPY frontend/index.html .
COPY frontend/tsconfig.json .
COPY frontend/vite.config.ts .

# 构建
RUN yarn build

# 使用 nginx 为前端服务
FROM nginx:alpine

# 复制构建输出到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
