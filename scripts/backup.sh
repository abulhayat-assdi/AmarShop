#!/usr/bin/env bash
#
# AmarShop off-server backup to Cloudflare R2 (spec §7.1, §8).
#
# Dumps the PostgreSQL database and archives the self-hosted uploads, then
# uploads both to an R2 (S3-compatible) bucket. Intended to run on the VPS via
# cron. R2 is backup-only — nothing is ever served from it (spec §7.1).
#
# Requirements on the host: pg_dump, tar, gzip, and the AWS CLI (`aws`).
# Required env: DIRECT_URL, R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID,
#   R2_SECRET_ACCESS_KEY. Optional: UPLOAD_DIR (default ./uploads).
#
# Example cron (daily at 02:30):
#   30 2 * * * cd /path/to/amarshop && set -a && . ./.env && ./scripts/backup.sh >> /var/log/amarshop-backup.log 2>&1

set -euo pipefail

: "${DIRECT_URL:?DIRECT_URL is required}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required}"
: "${R2_BUCKET:?R2_BUCKET is required}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"

UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

DB_FILE="$WORKDIR/db-$STAMP.sql.gz"
UPLOADS_FILE="$WORKDIR/uploads-$STAMP.tar.gz"

echo "[backup] dumping database..."
# A full dump captures the public schema plus every tenant_<x> schema.
pg_dump "$DIRECT_URL" | gzip >"$DB_FILE"

echo "[backup] archiving uploads from $UPLOAD_DIR..."
if [ -d "$UPLOAD_DIR" ]; then
  tar -czf "$UPLOADS_FILE" -C "$UPLOAD_DIR" .
else
  echo "[backup]   no uploads dir, skipping"
fi

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"

echo "[backup] uploading to R2 bucket $R2_BUCKET..."
aws s3 cp "$DB_FILE" "s3://$R2_BUCKET/db/" --endpoint-url "$R2_ENDPOINT"
if [ -f "$UPLOADS_FILE" ]; then
  aws s3 cp "$UPLOADS_FILE" "s3://$R2_BUCKET/uploads/" --endpoint-url "$R2_ENDPOINT"
fi

echo "[backup] complete: $STAMP"
