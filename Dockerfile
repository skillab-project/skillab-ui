FROM node:22.11.0
WORKDIR /app
COPY . .
RUN npm i
EXPOSE 3000
CMD [ "npm", "run", "start" ]