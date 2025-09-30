### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## API Documentation

### Authentication

All requests require header: `X-API-Key: test_key`

Error you get if you don't have the correct API key:
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing API key"
}
```

### Endpoints

#### 1. Create Customer
```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -d '{
    "phone": "2347030000000",
    "email": "ada@example.com"
  }'
```

**Response:**
```json
{
  "id": "cust_1",
  "phone": "2347030000000",
  "email": "ada@example.com",
  "createdAt": "2025-09-29T12:34:56.000Z"
}
```

#### 2. Earn Points
```bash
curl -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "customerId": "cust_1",
    "amountMinor": 120000,
    "currency": "NGN"
  }'
```

**Response:**
```json
{
  "customerId": "cust_1",
  "creditedPoints": 1200,
  "remainingDailyAllowance": 3800,
  "transaction": {
    "id": "tx_001",
    "customerId": "cust_1",
    "amountMinor": 120000,
    "points": 1200,
    "createdAt": "2025-09-29T12:35:12.000Z"
  }
}
```

#### 3. Redeem Points
```bash
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: redeem-key-456" \
  -d '{
    "customerId": "cust_1",
    "points": 500
  }'
```

**Response:**
```json
{
  "customerId": "cust_1",
  "redeemedPoints": 500,
  "newBalance": 700
}
```

#### 4. Get Wallet Summary
```bash
curl -X GET http://localhost:3000/wallet/cust_1 \
  -H "X-API-Key: test_key"
```

**Response:**
```json
{
  "customerId": "cust_1",
  "balancePoints": 700,
  "todayEarnedPoints": 1200,
  "lifetimeEarnedPoints": 1200,
  "lifetimeRedeemedPoints": 500
}
```

## Business Rules

- **Currency:** NGN only (Nigerian Naira)
- **Earn Rate:** 1 point per ₦100 (100 kobo)
- **Daily Cap:** Maximum 5,000 points per customer per day
- **Timezone:** Africa/Lagos for daily cap calculations
- **Idempotency:** Required for POST /earn and POST /redeem

## Error Codes

- `401` - Invalid or missing API key
- `400` - Invalid request payload or insufficient points
- `404` - Customer not found
- `409` - Idempotency key conflict

## Complete Testing Workflow

### Scenario 1: Basic Redemption Flow

```bash
# Step 1: Create a customer
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -d '{
    "phone": "2348012345678",
    "email": "test@example.com"
  }'

# Step 2: Earn 1000 points (spend ₦10,000 = 1,000,000 kobo)
curl -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: earn-001" \
  -d '{
    "customerId": "cust_1",
    "amountMinor": 100000,
    "currency": "NGN"
  }'

# Step 3: Check wallet balance
curl -X GET http://localhost:3000/wallet/cust_1 \
  -H "X-API-Key: test_key"

# Step 4: Redeem 300 points
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: redeem-001" \
  -d '{
    "customerId": "cust_1",
    "points": 300
  }'

# Step 5: Check updated balance
curl -X GET http://localhost:3000/wallet/cust_1 \
  -H "X-API-Key: test_key"
```

### Scenario 2: Multiple Redemptions

```bash
# Redeem 200 points
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: redeem-002" \
  -d '{
    "customerId": "cust_1",
    "points": 200
  }'

# Redeem another 150 points
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: redeem-003" \
  -d '{
    "customerId": "cust_1",
    "points": 150
  }'
```

### Scenario 3: Test Insufficient Points Error

```bash
# Try to redeem more points than available
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: redeem-004" \
  -d '{
    "customerId": "cust_1",
    "points": 99999
  }'

# Expected response: 400 Bad Request
# {
#   "error": "INSUFFICIENT_POINTS",
#   "message": "Not enough points to redeem."
# }
```

### Scenario 4: Test Idempotency

```bash
# First redemption
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: same-key-123" \
  -d '{
    "customerId": "cust_1",
    "points": 100
  }'

# Retry with same idempotency key - should return cached response
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: same-key-123" \
  -d '{
    "customerId": "cust_1",
    "points": 100
  }'

# Different request with same key - should return 409 conflict
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: same-key-123" \
  -d '{
    "customerId": "cust_1",
    "points": 200
  }'
```

### Scenario 5: Test Daily Cap

```bash
# Earn maximum daily points (₦50,000 = 5,000 points)
curl -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: earn-max-001" \
  -d '{
    "customerId": "cust_1",
    "amountMinor": 500000,
    "currency": "NGN"
  }'

# Try to earn more - should credit 0 points
curl -X POST http://localhost:3000/earn \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: earn-max-002" \
  -d '{
    "customerId": "cust_1",
    "amountMinor": 100000,
    "currency": "NGN"
  }'

# Expected response:
# {
#   "customerId": "cust_1",
#   "creditedPoints": 0,
#   "remainingDailyAllowance": 0,
#   ...
# }
```

## Common Redemption Use Cases

### Gift Card Redemption (500 points)
```bash
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: gift-card-$(date +%s)" \
  -d '{
    "customerId": "cust_1",
    "points": 500
  }'
```

### Discount Redemption (1000 points)
```bash
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: discount-$(date +%s)" \
  -d '{
    "customerId": "cust_1",
    "points": 1000
  }'
```

### Full Points Cashout
```bash
# First get current balance
BALANCE=$(curl -s -X GET http://localhost:3000/wallet/cust_1 \
  -H "X-API-Key: test_key" | jq -r '.balancePoints')

# Then redeem all points
curl -X POST http://localhost:3000/redeem \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "Idempotency-Key: cashout-$(date +%s)" \
  -d "{
    \"customerId\": \"cust_1\",
    \"points\": $BALANCE
  }"
```

## Project Structure

```
src/
├── types/           # TypeScript interfaces
├── services/        # Business logic layer
│   ├── CustomerService.ts
│   ├── PointsService.ts
│   └── IdempotencyService.ts
├── middleware/      # Express middleware
│   ├── auth.ts
│   └── idempotency.ts
├── utils/           # Helper functions
│   └── dateUtils.ts
├── app.ts          # Express app configuration
└── server.ts       # Server entry point
```

## License

MIT
