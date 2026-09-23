#!/bin/bash
# Test script untuk login functionality

echo "Testing APP GEREJA Login API"
echo "=============================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="https://app-gereja-api.antonio-girsang.workers.dev"
TEST_EMAIL="admin3@gereja.com"
TEST_PASSWORD="Admin123"

echo -e "${YELLOW}Test 1: Login dengan email${NC}"
echo "Endpoint: POST $API_URL/api/auth/login"
echo "Data:"
echo "  email: $TEST_EMAIL"
echo "  password: $TEST_PASSWORD"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if response contains token
if echo "$RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ Login berhasil!${NC}"
  TOKEN=$(echo "$RESPONSE" | jq -r '.token' 2>/dev/null)
  echo "Token: $TOKEN"
else
  echo -e "${RED}✗ Login gagal!${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}Test 2: Verify user data${NC}"
echo ""
ADMIN_LIST=$(curl -s -X GET "$API_URL/api/admin" \
  -H "Authorization: Bearer $TOKEN")

echo "Admin List Response:"
echo "$ADMIN_LIST" | jq '.' 2>/dev/null || echo "$ADMIN_LIST"
echo ""

if echo "$ADMIN_LIST" | grep -q "data"; then
  echo -e "${GREEN}✓ Authorization berhasil!${NC}"
else
  echo -e "${RED}✗ Authorization gagal!${NC}"
fi

echo ""
echo -e "${YELLOW}Test 3: List semua users di database${NC}"
echo ""

curl -s -X GET "$API_URL/api/admin" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, username, role, is_active}' 2>/dev/null

echo ""
echo "Testing selesai!"
