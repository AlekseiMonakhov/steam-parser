FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Устанавливаем все зависимости, включая devDependencies
RUN yarn install --frozen-lockfile

# Устанавливаем nodemon глобально
RUN yarn global add nodemon

COPY . .

EXPOSE 3008

CMD ["yarn", "dev"]
