FROM node:16@sha256:95d8b780f8263060fcc2cc3358b9179d225961a246558a297e83df43c6a6a8ba
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
