FROM node:20-alpine

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN apk add --no-cache tini \
	&& addgroup -S app-group \
	&& adduser -S app-user -G app-group

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN chown -R app-user:app-group /app

USER app-user

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
