FROM node:16@sha256:ffe804d6fcced29bcfc3477de079d03a9c2b0e4917e44bfeafb1a6b0f875e383
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
