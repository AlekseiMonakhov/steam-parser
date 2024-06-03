FROM node:16 AS build

WORKDIR /usr/src/frontend

COPY package*.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn global add nodemon

CMD ["nodemon", "--watch", ".", "--exec", "yarn", "start"]
