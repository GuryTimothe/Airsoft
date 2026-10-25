#!/bin/sh
set -eu

# Signing keys must survive redeploys: a fresh keypair would invalidate every
# session. config/jwt is a named volume seeded with the image's ownership, so
# this writes once on the first boot.
#
# Guarded on the file rather than on --skip-if-exists: that flag reports an
# already-present keypair by throwing, and Symfony's console turns an exception
# with code 0 into exit code 1, which would kill this script under `set -e`.
if [ "${APP_ENV:-dev}" = "prod" ] && [ ! -f config/jwt/private.pem ]; then
    php bin/console lexik:jwt:generate-keypair --no-interaction
fi

php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration --all-or-nothing

if [ "${APP_ENV:-dev}" = "prod" ]; then
    # FrankenPHP serves requests concurrently, so a cold cache would let several
    # in-flight requests race to build it on first boot. Build it up front.
    php bin/console cache:warmup --no-interaction
fi

# The FrankenPHP image rewrites docker-php-entrypoint to exec `frankenphp run`,
# so the prod CMD is a bare argument list. The plain PHP image leaves it as
# `php`, so the dev CMD stays a full command. Delegating keeps both working.
exec docker-php-entrypoint "$@"
