FROM node:16.13.2

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY . ./

RUN npm ci

RUN npm run build

EXPOSE 3000

ENTRYPOINT ["npm", "run", "start:prod"]
