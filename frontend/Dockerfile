FROM node:16

WORKDIR /usr/src/frontend

COPY package*.json yarn.lock ./

RUN yarn install

COPY . .

CMD ["yarn", "start"]
