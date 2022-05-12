FROM node:16@sha256:1817bb941c9a30fe2a6d75ff8675a8f6def408efe3d3ff43dbb006e2b534fa14
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
