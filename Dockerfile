FROM node:16@sha256:6155ff062c403e99c1da7c317710c5c838c1e060f526d98baea6ee921ca61729
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
