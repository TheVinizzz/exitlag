# Use a imagem oficial do Node.js como base
FROM node:18

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copie o package.json e o package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências do projeto, incluindo o Prisma
RUN npm install

# Copie o restante do código do aplicativo para o diretório de trabalho
COPY . .

# Gere o cliente Prisma
RUN npx prisma generate

# Exponha a porta que o aplicativo irá rodar
EXPOSE 3000

# Comando para iniciar o aplicativo
CMD ["node", "server.js"]
