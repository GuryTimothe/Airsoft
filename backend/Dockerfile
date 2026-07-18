FROM php:8.4-cli-alpine

RUN apk add --no-cache \
    git \
    icu-dev \
    postgresql-dev \
    tini \
    unzip \
    $PHPIZE_DEPS \
    && docker-php-ext-install intl pdo_pgsql \
    && apk del $PHPIZE_DEPS

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN addgroup -S app-group \
    && adduser -S app-user -G app-group

WORKDIR /app

COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-interaction --no-progress --prefer-dist --no-scripts

COPY . .

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh \
    && chown app-user:app-group /app/docker-entrypoint.sh

RUN mkdir -p var/cache var/log \
    && chown -R app-user:app-group /app

USER app-user

EXPOSE 8000

ENTRYPOINT ["/sbin/tini", "--", "/app/docker-entrypoint.sh"]

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]