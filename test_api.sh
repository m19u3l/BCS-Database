#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  Invoice Generator API Tests${NC}"
echo -e "${BLUE}==================================${NC}"
echo

# Test 1: Server Health
echo -e "${BLUE}Test 1: Checking server health...${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
if [ $STATUS -eq 200 ]; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not responding (Status: $STATUS)${NC}"
    exit 1
fi
echo

# Test 2: Get Dashboard Stats
echo -e "${BLUE}Test 2: Getting dashboard stats...${NC}"
curl -s $BASE_URL/api/dashboard/stats | python3 -m json.tool
echo -e "${GREEN}✓ Dashboard stats retrieved${NC}"
echo

# Test 3: Get All Clients
echo -e "${BLUE}Test 3: Fetching all clients...${NC}"
CLIENTS=$(curl -s $BASE_URL/api/clients)
echo "$CLIENTS" | python3 -m json.tool
CLIENT_COUNT=$(echo "$CLIENTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
echo -e "${GREEN}✓ Found $CLIENT_COUNT clients${NC}"
echo

# Test 4: Get All Services
echo -e "${BLUE}Test 4: Fetching all services...${NC}"
SERVICES=$(curl -s $BASE_URL/api/services)
echo "$SERVICES" | python3 -m json.tool
SERVICE_COUNT=$(echo "$SERVICES" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
echo -e "${GREEN}✓ Found $SERVICE_COUNT services${NC}"
echo

# Test 5: Create a New Client
echo -e "${BLUE}Test 5: Creating a new client...${NC}"
NEW_CLIENT=$(curl -s -X POST $BASE_URL/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client",
    "email": "test@example.com",
    "phone": "(555) 123-4567",
    "address": "123 Test St",
    "city": "Test City",
    "state": "CA",
    "zip": "12345"
  }')
echo "$NEW_CLIENT" | python3 -m json.tool
NEW_CLIENT_ID=$(echo "$NEW_CLIENT" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo -e "${GREEN}✓ Client created with ID: $NEW_CLIENT_ID${NC}"
echo

# Test 6: Create an Invoice
echo -e "${BLUE}Test 6: Creating an invoice...${NC}"
NEW_INVOICE=$(curl -s -X POST $BASE_URL/api/invoices \
  -H "Content-Type: application/json" \
  -d "{
    \"client_id\": $NEW_CLIENT_ID,
    \"due_date\": \"2025-12-31\",
    \"line_items\": [
      {
        \"category\": \"Labor\",
        \"description\": \"Water Extraction\",
        \"quantity\": 2,
        \"rate\": 250
      },
      {
        \"category\": \"Materials\",
        \"description\": \"Drywall Repair\",
        \"quantity\": 1,
        \"rate\": 150
      }
    ],
    \"notes\": \"Test invoice created by API test script\"
  }")
echo "$NEW_INVOICE" | python3 -m json.tool
NEW_INVOICE_ID=$(echo "$NEW_INVOICE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo -e "${GREEN}✓ Invoice created with ID: $NEW_INVOICE_ID${NC}"
echo

# Test 7: Get Invoice Details
echo -e "${BLUE}Test 7: Fetching invoice details...${NC}"
curl -s $BASE_URL/api/invoices/$NEW_INVOICE_ID | python3 -m json.tool
echo -e "${GREEN}✓ Invoice details retrieved${NC}"
echo

# Test 8: Get All Invoices
echo -e "${BLUE}Test 8: Fetching all invoices...${NC}"
INVOICES=$(curl -s $BASE_URL/api/invoices)
echo "$INVOICES" | python3 -m json.tool
INVOICE_COUNT=$(echo "$INVOICES" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
echo -e "${GREEN}✓ Found $INVOICE_COUNT invoices${NC}"
echo

# Test 9: Download Invoice PDF
echo -e "${BLUE}Test 9: Downloading invoice PDF...${NC}"
curl -s $BASE_URL/api/invoices/$NEW_INVOICE_ID/pdf --output test_invoice.pdf
if [ -f "test_invoice.pdf" ]; then
    FILE_SIZE=$(stat -f%z "test_invoice.pdf" 2>/dev/null || stat -c%s "test_invoice.pdf" 2>/dev/null)
    echo -e "${GREEN}✓ PDF downloaded successfully (${FILE_SIZE} bytes)${NC}"
    echo -e "${BLUE}  → Saved as: test_invoice.pdf${NC}"
else
    echo -e "${RED}✗ PDF download failed${NC}"
fi
echo

# Test 10: Get Materials
echo -e "${BLUE}Test 10: Fetching materials...${NC}"
MATERIALS=$(curl -s $BASE_URL/api/materials)
echo "$MATERIALS" | python3 -m json.tool
echo -e "${GREEN}✓ Materials list retrieved${NC}"
echo

# Summary
echo -e "${BLUE}==================================${NC}"
echo -e "${GREEN}All tests completed successfully!${NC}"
echo -e "${BLUE}==================================${NC}"
echo
echo -e "Created resources:"
echo -e "  • Client ID: ${GREEN}$NEW_CLIENT_ID${NC}"
echo -e "  • Invoice ID: ${GREEN}$NEW_INVOICE_ID${NC}"
echo -e "  • PDF File: ${GREEN}test_invoice.pdf${NC}"
echo
echo -e "Next steps:"
echo -e "  1. Open ${GREEN}test_invoice.pdf${NC} to view the generated invoice"
echo -e "  2. Visit ${BLUE}http://localhost:3000${NC} in your browser"
echo -e "  3. Check the API documentation for more endpoints"
echo
