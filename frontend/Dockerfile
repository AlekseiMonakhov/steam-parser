FROM node:16 as build

WORKDIR /usr/src/frontend

COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM alpine:latest
WORKDIR /usr/share/frontend
COPY --from=build /usr/src/frontend/build .
