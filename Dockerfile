FROM node:22.12.0-alpine
WORKDIR /app
COPY . .
RUN npm i
EXPOSE 3000
CMD [ "npm", "run", "start" ]