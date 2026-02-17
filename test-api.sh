#!/usr/bin/env bash
# PolicySignoff API curl smoke test
# Usage: ./test-api.sh [email] [password]
# Defaults to alice@example.com / password

set -e

BASE="http://localhost:8000"
ORIGIN="http://localhost:3001"
EMAIL="${1:-alice@example.com}"
PASS="${2:-password}"
COOKIE_JAR=$(mktemp)

header() { echo ""; echo "━━━ $1 ━━━"; }
check() { echo "✓ $1"; }
fail() { echo "✗ FAIL: $1"; exit 1; }

get_xsrf() {
  python3 -c "
import urllib.parse, re
with open('$COOKIE_JAR') as f:
    for line in f:
        if 'XSRF-TOKEN' in line and 'session' not in line:
            print(urllib.parse.unquote(line.strip().split()[-1]))
            break
"
}

# ── 1. CSRF cookie ────────────────────────────────────────────────────────────
header "GET /sanctum/csrf-cookie"
curl -s -c "$COOKIE_JAR" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  "$BASE/sanctum/csrf-cookie" -o /dev/null
XSRF=$(get_xsrf)
[ -n "$XSRF" ] && check "CSRF cookie set" || fail "No XSRF-TOKEN cookie"

# ── 2. Register (new user) ────────────────────────────────────────────────────
header "POST /register"
TS=$(date +%s)
REG=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/register" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -d "{\"name\":\"Test User\",\"email\":\"test$TS@example.com\",\"password\":\"password\",\"password_confirmation\":\"password\"}")
echo "$REG" | python3 -m json.tool
echo "$REG" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'id' in d" && check "Register returns user"
XSRF=$(get_xsrf)

# ── 3. Logout ─────────────────────────────────────────────────────────────────
header "POST /logout"
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/logout" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json" | python3 -m json.tool
XSRF=$(get_xsrf)

# ── 4. Login ──────────────────────────────────────────────────────────────────
header "POST /login (as $EMAIL)"
LOGIN=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/login" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
echo "$LOGIN" | python3 -m json.tool
echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'id' in d" && check "Login returns user"
XSRF=$(get_xsrf)

# ── 5. GET /user ──────────────────────────────────────────────────────────────
header "GET /user"
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json" \
  "$BASE/user" | python3 -m json.tool && check "GET /user"

# ── 6. List policies ──────────────────────────────────────────────────────────
header "GET /api/policies"
POLICIES=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json" \
  "$BASE/api/policies")
echo "$POLICIES" | python3 -m json.tool
POLICY_COUNT=$(echo "$POLICIES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
[ "$POLICY_COUNT" -ge 1 ] && check "Got $POLICY_COUNT policies" || fail "No policies returned"

# ── 7. Policy detail ──────────────────────────────────────────────────────────
header "GET /api/policies/1"
DETAIL=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json" \
  "$BASE/api/policies/1")
echo "$DETAIL" | python3 -m json.tool
echo "$DETAIL" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'signoff_summary' in d" && check "Policy detail has signoff_summary"

# ── 8. Create policy ──────────────────────────────────────────────────────────
header "POST /api/policies"
NEW_POLICY=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/policies" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json" \
  -d '{"title":"Test Policy","description":"Created by curl test","due_date":"2026-12-31"}')
echo "$NEW_POLICY" | python3 -m json.tool
NEW_ID=$(echo "$NEW_POLICY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
check "Created policy id=$NEW_ID"
XSRF=$(get_xsrf)

# ── 9. Sign off ───────────────────────────────────────────────────────────────
header "POST /api/policies/$NEW_ID/signoff"
SIGNOFF=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/policies/$NEW_ID/signoff" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json")
echo "$SIGNOFF" | python3 -m json.tool
echo "$SIGNOFF" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'signed_at' in d" && check "Sign-off returns signed_at"
XSRF=$(get_xsrf)

# ── 10. Duplicate sign-off → 409 ─────────────────────────────────────────────
header "POST /api/policies/$NEW_ID/signoff (duplicate → expect 409)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/policies/$NEW_ID/signoff" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json")
echo "HTTP $HTTP_CODE"
[ "$HTTP_CODE" = "409" ] && check "Duplicate sign-off returns 409" || fail "Expected 409, got $HTTP_CODE"
XSRF=$(get_xsrf)

# ── 11. Request presigned upload URL ─────────────────────────────────────────
header "POST /api/policies/$NEW_ID/upload-url"
UPLOAD=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/policies/$NEW_ID/upload-url" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json" \
  -d '{"filename":"test.pdf","content_type":"application/pdf"}')
echo "$UPLOAD" | python3 -m json.tool
UPLOAD_URL=$(echo "$UPLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin)['upload_url'])" 2>/dev/null || echo "")
[ -n "$UPLOAD_URL" ] && check "Got presigned upload URL" || fail "No upload_url in response"
XSRF=$(get_xsrf)

# ── 12. Upload file directly to MinIO via presigned URL ───────────────────────
header "PUT $UPLOAD_URL (direct to MinIO)"
echo "hello pdf" > /tmp/test-upload.pdf
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary @/tmp/test-upload.pdf)
echo "HTTP $HTTP_CODE"
[ "$HTTP_CODE" = "200" ] && check "File uploaded to MinIO via presigned URL" || fail "Upload failed: HTTP $HTTP_CODE"
rm -f /tmp/test-upload.pdf

# ── 13. Request presigned download URL ───────────────────────────────────────
header "GET /api/policies/$NEW_ID/download-url"
DOWNLOAD=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json" \
  "$BASE/api/policies/$NEW_ID/download-url")
echo "$DOWNLOAD" | python3 -m json.tool
DOWNLOAD_URL=$(echo "$DOWNLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin)['download_url'])" 2>/dev/null || echo "")
[ -n "$DOWNLOAD_URL" ] && check "Got presigned download URL" || fail "No download_url in response"

# ── 14. Download file via presigned URL ───────────────────────────────────────
header "GET $DOWNLOAD_URL (direct from MinIO)"
CONTENT=$(curl -s "$DOWNLOAD_URL")
echo "Content: $CONTENT"
[ "$CONTENT" = "hello pdf" ] && check "Downloaded correct file content" || fail "Wrong content: $CONTENT"

# ── 15. Validation errors ─────────────────────────────────────────────────────
header "POST /api/policies (missing required fields → 422)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/policies" \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  -H "Accept: application/json" \
  -d '{}')
echo "HTTP $HTTP_CODE"
[ "$HTTP_CODE" = "422" ] && check "Missing fields returns 422" || fail "Expected 422, got $HTTP_CODE"

# ── 16. Unauthenticated access ────────────────────────────────────────────────
header "GET /api/policies with no session (→ 401)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Accept: application/json" \
  -H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" \
  "$BASE/api/policies")
echo "HTTP $HTTP_CODE"
[ "$HTTP_CODE" = "401" ] && check "No session returns 401" || fail "Expected 401, got $HTTP_CODE"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "All tests passed!"
rm -f "$COOKIE_JAR"
