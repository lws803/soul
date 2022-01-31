FROM node:16.13.2

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json package-lock.json ./

RUN npm ci

COPY . ./

RUN npm run build
ENTRYPOINT ["npm", "run", "start:prod"]
