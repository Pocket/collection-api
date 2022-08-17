FROM node:16@sha256:bf1609ac718dda03940e2be4deae1704fb77cd6de2bed8bf91d4bbbc9e88b497
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
