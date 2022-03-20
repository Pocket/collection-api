FROM node:16@sha256:68e34cfcd8276ad531b12b3454af5c24cd028752dfccacce4e19efef6f7cdbe0
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4004
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
