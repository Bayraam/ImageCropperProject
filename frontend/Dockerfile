# Frontend Dockerfile za React aplikaciju
FROM node:18-alpine

# Postavi working directory
WORKDIR /app

# Kopiraj package.json i package-lock.json
COPY package*.json ./

# Instaliraj dependencies
RUN npm install

# Kopiraj sve frontend fajlove
COPY . .

# Build aplikaciju za production
RUN npm run build

# Instaliraj serve za serving static fajlova
RUN npm install -g serve

# Ekspozuj port
EXPOSE 3000

# Pokreni aplikaciju
CMD ["serve", "-s", "build", "-l", "3000"]