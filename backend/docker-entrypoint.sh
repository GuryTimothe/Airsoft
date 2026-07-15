#!/bin/sh
set -eu

php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration --all-or-nothing

exec "$@"