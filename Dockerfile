FROM node:20-alpine3.21

WORKDIR /app

COPY ./server_app/package*.json /app/

RUN npm install

COPY ./server_app /app

EXPOSE 3000

CMD ["node", "server.js"]