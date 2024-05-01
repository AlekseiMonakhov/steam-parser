FROM node:16 AS build

WORKDIR /usr/src/frontend

COPY package*.json yarn.lock ./

RUN yarn install

COPY . .

CMD ["yarn", "start"]
