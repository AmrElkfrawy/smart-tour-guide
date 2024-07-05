FROM node:20-alpine3.19

WORKDIR /app
COPY package*.json /app
RUN npm install
COPY . /app

EXPOSE 8000
CMD ["npm", "run", "start:docker"]