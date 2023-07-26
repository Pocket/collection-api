FROM node:18@sha256:e7e0921e352fc579d4d1807ecb2a91f42548cb5097e8bd2742e13bd672b7dc4a
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
