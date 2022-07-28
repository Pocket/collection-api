FROM node:16@sha256:2b61abb7d0e7373026b18c7fcfa1138b386ff66fa3c2dca293bf75ccdfab21fe
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
