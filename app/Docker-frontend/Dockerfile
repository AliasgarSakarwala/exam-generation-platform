FROM node:18-alpine

WORKDIR /app

# Install dependencies first for caching
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Copy source files
COPY frontend .

EXPOSE 3000

CMD ["npm", "run", "dev"]