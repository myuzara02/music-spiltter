# Music Splitter Frontend — Dockerfile

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

EXPOSE 5173

# Run dev server (accessible from Docker network)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
