FROM node:18-slim@sha256:b175cd7f3358c399f7bcee9b1032b86b71b1afa4cfb4dd0db55d66f871475a3e
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
