FROM node:24-alpine

VOLUME /www
WORKDIR /www
RUN mkdir -p /app

COPY --recursive src /app
RUN npm install
EXPOSE 8000

CMD [ "npm", "start" ]