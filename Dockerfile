FROM node:16@sha256:0eafb338139eaaad6e867b22ef75dec1f7f51dcb08845531aed6cf6f6a1adea5
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
