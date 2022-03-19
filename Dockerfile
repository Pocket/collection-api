FROM node:16@sha256:ca9d3abb9e2228bf849afad8f861e0b446fd62d9f8ba85385e18f31f20cb58b8
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
