# Trading Agent Engine

A Cloudflare Worker that generates AI-powered trading logs using Workers AI (Llama-3), KV storage, and provides API endpoints for user balance management to integrate with broader platforms.

## Architecture

- **Workers AI**: Uses `@cf/meta/llama-3-8b-instruct` to generate realistic trading logs
- **KV Storage**: Caches the latest log and stores user balances in `TRADING_CACHE` namespace
- **Cron Trigger**: Generates new logs every minute
- **HTTP API**: Serves cached logs and user balance management via REST endpoints

## Setup

### Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Configuration

1. Create a KV namespace:
   ```bash
   wrangler kv:namespace create TRADING_CACHE
   wrangler kv:namespace create TRADING_CACHE --preview
   ```

2. Update `wrangler.toml` with your namespace IDs:
   ```toml
   [[kv_namespaces]]
   binding = "TRADING_CACHE"
   id = "your-production-namespace-id"
   preview_id = "your-preview-namespace-id"
   ```

### Development

```bash
npm install
npm run dev
```

### Deployment

```bash
npm run deploy
```

## API Specification

### GET /api/narrative

Returns the latest AI-generated trading log.

**Response:**
```json
{
  "log": "Long BTC @ 97,450 - RSI divergence on 15m, volume spike confirming breakout",
  "timestamp": 1700000000000
}
```

**Headers:**
- `Cache-Control: public, max-age=5` — CDN caching for Free Tier scaling

---

### Bot Tiers

The Trading Agent Engine supports a multi-tier bot system with different ROI rates and minimum stake requirements:

| Tier       | Name           | Hourly ROI     | Daily ROI      | Min Stake  | Capital Withdrawal |
|------------|----------------|----------------|----------------|------------|-------------------|
| protobot   | Protobot       | 0.10% - 0.12%  | 0.80% - 0.96%  | $100       | 40 days           |
| chainpulse | Chainpulse Bot | 0.12% - 0.14%  | 0.96% - 1.12%  | $4,000     | 45 days           |
| titan      | Titan Bot      | 0.14% - 0.16%  | 1.12% - 1.28%  | $25,000    | 65 days           |
| omega      | Omega Bot      | 0.225% (fixed) | 1.80% (fixed)  | $50,000    | 85 days           |

**Bot Tier Configuration Structure:**
```typescript
interface BotTierConfig {
  name: string;              // Display name of the bot tier
  hourlyRoiMin: number;      // Minimum hourly ROI (e.g., 0.001 = 0.1%)
  hourlyRoiMax: number;      // Maximum hourly ROI
  dailyRoiMin: number;       // Minimum daily ROI (8 trading hours)
  dailyRoiMax: number;       // Maximum daily ROI
  minimumStake: number;      // Minimum stake amount in USD
  tradingHoursPerDay: number;    // Trading hours per day (8)
  tradingDaysPerWeek: number;    // Trading days per week (6)
  roiWithdrawalHours: number;    // Hours after investment for ROI withdrawal (24)
  capitalWithdrawalDays: number; // Days after investment for capital withdrawal
  investmentDurationDays: number; // Total investment duration (365)
}
```

**Tier Auto-Selection Logic:**
When `botTier` is not specified, the system automatically selects the highest tier the stake qualifies for:
- Balance >= $50,000 → Omega Bot
- Balance >= $25,000 → Titan Bot
- Balance >= $4,000 → Chainpulse Bot
- Balance < $4,000 → Protobot

---

### GET /api/balance/:userId

Get the balance, bot tier, and projected daily profit for a specific user.

**URL Parameters:**
- `userId` (string, required): Unique identifier for the user (alphanumeric, hyphens, underscores, 1-128 chars)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 50000.00,
    "currency": "USD",
    "botTier": "omega",
    "botTierConfig": {
      "name": "Omega Bot",
      "hourlyRoiMin": 0.00225,
      "hourlyRoiMax": 0.00225,
      "dailyRoiMin": 0.018,
      "dailyRoiMax": 0.018,
      "minimumStake": 50000,
      "tradingHoursPerDay": 8,
      "tradingDaysPerWeek": 6,
      "roiWithdrawalHours": 24,
      "capitalWithdrawalDays": 85,
      "investmentDurationDays": 365
    },
    "dailyTargetPct": {
      "min": 0.018,
      "max": 0.018
    },
    "projectedDailyProfit": {
      "min": 900.00,
      "max": 900.00
    },
    "lastUpdated": 1700000000000
  }
}
```

**Response (400 Bad Request):**
```json
{
  "status": "error",
  "error": "Invalid userId format. Must be alphanumeric with optional hyphens/underscores, 1-128 characters."
}
```

**Response (404 Not Found):**
```json
{
  "status": "error",
  "error": "User balance not found. Use POST /api/balance to set initial balance."
}
```

---

### POST /api/balance

Create or set a user's balance for the Trading Agent to use.

**Request Body:**
```json
{
  "userId": "user123",
  "balance": 50000.00,
  "currency": "USD",
  "botTier": "omega"
}
```

| Field    | Type   | Required | Description                                                                 |
|----------|--------|----------|-----------------------------------------------------------------------------|
| userId   | string | Yes      | Unique identifier for the user (alphanumeric, hyphens, underscores, 1-128 chars) |
| balance  | number | Yes      | User's balance (must be >= 0)                                               |
| currency | string | No       | Currency code (default: "USD"). Supported: USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, HKD, SGD |
| botTier  | string | No       | Bot tier to use: "protobot", "chainpulse", "titan", or "omega". Auto-selected if not provided |

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 50000.00,
    "currency": "USD",
    "botTier": "omega",
    "botTierConfig": {
      "name": "Omega Bot",
      "hourlyRoiMin": 0.00225,
      "hourlyRoiMax": 0.00225,
      "dailyRoiMin": 0.018,
      "dailyRoiMax": 0.018,
      "minimumStake": 50000,
      "tradingHoursPerDay": 8,
      "tradingDaysPerWeek": 6,
      "roiWithdrawalHours": 24,
      "capitalWithdrawalDays": 85,
      "investmentDurationDays": 365
    },
    "dailyTargetPct": {
      "min": 0.018,
      "max": 0.018
    },
    "projectedDailyProfit": {
      "min": 900.00,
      "max": 900.00
    },
    "lastUpdated": 1700000000000
  }
}
```

**Response (400 Bad Request - Invalid Bot Tier):**
```json
{
  "status": "error",
  "error": "Invalid botTier. Valid tiers: protobot, chainpulse, titan, omega"
}
```

**Response (400 Bad Request - Insufficient Stake):**
```json
{
  "status": "error",
  "error": "Insufficient stake for Omega Bot. Minimum stake: $50,000"
}
```

---

### PUT /api/balance/:userId

Update an existing user's balance and optionally change bot tier.

**URL Parameters:**
- `userId` (string, required): Unique identifier for the user

**Request Body:**
```json
{
  "balance": 75000.00,
  "currency": "USD",
  "botTier": "omega"
}
```

| Field    | Type   | Required | Description                                                                 |
|----------|--------|----------|-----------------------------------------------------------------------------|
| balance  | number | Yes      | User's balance (must be >= 0)                                               |
| currency | string | No       | Currency code (default: "USD"). Supported: USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, HKD, SGD |
| botTier  | string | No       | Bot tier to use: "protobot", "chainpulse", "titan", or "omega". Auto-selected if not provided |

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "userId": "user123",
    "balance": 75000.00,
    "currency": "USD",
    "botTier": "omega",
    "botTierConfig": {
      "name": "Omega Bot",
      "hourlyRoiMin": 0.00225,
      "hourlyRoiMax": 0.00225,
      "dailyRoiMin": 0.018,
      "dailyRoiMax": 0.018,
      "minimumStake": 50000,
      "tradingHoursPerDay": 8,
      "tradingDaysPerWeek": 6,
      "roiWithdrawalHours": 24,
      "capitalWithdrawalDays": 85,
      "investmentDurationDays": 365
    },
    "dailyTargetPct": {
      "min": 0.018,
      "max": 0.018
    },
    "projectedDailyProfit": {
      "min": 1350.00,
      "max": 1350.00
    },
    "lastUpdated": 1700000000000
  }
}
```

---

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "trading-agent-engine"
}
```

## Multi-User Integration Guide

### Overview

The Trading Agent Engine is designed to integrate with broader platforms that manage multiple users. Each user can have their own balance and bot tier, and the daily cashflow profit is calculated based on their individual balance and selected tier.

### Bot Tier System

The system supports four bot tiers with different ROI rates:

1. **Protobot** - Entry level (min $100): 0.8% - 0.96% daily ROI
2. **Chainpulse Bot** - Mid tier (min $4,000): 0.96% - 1.12% daily ROI
3. **Titan Bot** - Advanced (min $25,000): 1.12% - 1.28% daily ROI
4. **Omega Bot** - Premium (min $50,000): 1.8% fixed daily ROI

### Integration Steps

1. **Register User Balance with Bot Tier**
   When a user joins your platform or deposits funds, register their balance:
   ```bash
   # Auto-select tier based on balance
   curl -X POST https://your-worker.workers.dev/api/balance \
     -H "Content-Type: application/json" \
     -d '{"userId": "user123", "balance": 25000}'
   
   # Or specify a specific tier
   curl -X POST https://your-worker.workers.dev/api/balance \
     -H "Content-Type: application/json" \
     -d '{"userId": "user123", "balance": 25000, "botTier": "titan"}'
   ```

2. **Retrieve User Status**
   Get current balance, bot tier, and projected daily profits:
   ```bash
   curl https://your-worker.workers.dev/api/balance/user123
   ```

3. **Update Balance and/or Bot Tier**
   When users deposit, withdraw, or want to change tiers:
   ```bash
   curl -X PUT https://your-worker.workers.dev/api/balance/user123 \
     -H "Content-Type: application/json" \
     -d '{"balance": 50000, "botTier": "omega"}'
   ```

### Frontend Integration

For the Trading Agent frontend, you can manage balances and bot tiers via the global JavaScript API:

```javascript
// Set user balance (auto-selects bot tier based on amount)
window.setTradingAgentBalance(50000);
// Returns: { 
//   status: 'success', 
//   new_balance: 50000, 
//   bot_tier: 'omega',
//   bot_tier_config: { ... },
//   projected_daily_profit: { min: 900, max: 900 } 
// }

// Set user balance with specific bot tier
window.setTradingAgentBalance(25000, 'titan');
// Returns: { 
//   status: 'success', 
//   new_balance: 25000, 
//   bot_tier: 'titan',
//   bot_tier_config: { ... },
//   projected_daily_profit: { min: 280, max: 320 } 
// }

// Set bot tier explicitly (must meet minimum stake)
window.setBotTier('chainpulse');
// Returns: { status: 'success', bot_tier: 'chainpulse', bot_tier_config: { ... } }

// Get all available bot tiers and their configurations
window.getBotTiers();
// Returns: { protobot: {...}, chainpulse: {...}, titan: {...}, omega: {...} }

// Get current status
window.getTradingAgentStatus();
// Returns full portfolio state including:
// - wallet_balance, pool_balance, total_equity, session_pnl
// - bot_tier, bot_tier_config
// - daily_target_pct, projected_daily_profit
// - market_context (volatility, active_pairs)
// - active_trades_count, system_status
```

### Profit Calculation

The daily profit is calculated based on the user's bot tier:

| Bot Tier   | Daily ROI Range     | Example ($50,000 balance) |
|------------|---------------------|---------------------------|
| Protobot   | 0.80% - 0.96%       | $400 - $480               |
| Chainpulse | 0.96% - 1.12%       | $480 - $560               |
| Titan      | 1.12% - 1.28%       | $560 - $640               |
| Omega      | 1.80% (fixed)       | $900                      |

### Market-Contextual Trading

The Trading Agent considers market conditions when simulating trades:

- **Volatility Levels**: Low, Medium, High
  - High volatility = larger potential profits/losses
  - Low volatility = smaller, more consistent moves
  
- **Market Trend**: Bullish, Bearish, Neutral
  - Bullish markets increase win rates for long positions
  - Bearish markets make profitable trades more challenging

This creates more realistic trading simulations that respond to actual market conditions.

## Cron Schedule

The worker generates new logs on a schedule defined in `wrangler.toml`:

```toml
[triggers]
crons = ["* * * * *"]  # Every minute
```

> Note: Minimum cron interval in production is 1 minute. For more frequent updates, consider using Durable Objects with alarms.
