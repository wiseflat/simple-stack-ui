FROM node:24-alpine

VOLUME /app
WORKDIR /app
RUN mkdir -p /app

COPY . /app
RUN npm install
EXPOSE 8000

CMD [ "npm", "start" ]