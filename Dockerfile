FROM node:16@sha256:3afa49c0e36da219d62460bc30fe3da87792392fa969665fe807e49412695895
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
