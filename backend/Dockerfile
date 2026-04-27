FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY backend/package*.json ./

# 安装依赖
RUN yarn install

# 复制源代码
COPY backend/dist ./dist

# 暴露端口
EXPOSE 8000

# 启动后端
CMD ["node", "dist/index.js"]
