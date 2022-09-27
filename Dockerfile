FROM node:16@sha256:ebc73648091fc45d7f250089c27280551057e41bcbe060b3c0443e5529c60dd6
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
