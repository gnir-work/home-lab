# Stock Portfolio Page — Product Plan

## Context

The money manager already tracks two stock-market accounts as opaque balances: `ibi_ils` (₪ portfolio) and `ibi_usd` ($ portfolio). They appear on the **Net Worth** page only as single numbers. Nir wants a dedicated **Stock Portfolio** page to:

1. Decide *strategically* how the stock portion should be split between specific tickers (target allocation).
2. Record *actually-held* positions per ticker (shares × price), separated by the two brokerage sub-accounts (`ibi_ils`, `ibi_usd`).
3. When he has new cash to deploy, compute *how many shares of each ticker to buy* to drift the actual allocation closer to the target — **buy-only** (no selling), and **single-currency** per rebalance run.

Out of scope for this plan: editing the rest of the Net Worth page, fully automated price fetching as a hard dependency (we'll plan around graceful manual fallback), tax/lot tracking, dividends, FX hedging.

---

## Mental Model

Three things, in plain English:

| Concept | What it is | Where it lives |
|---|---|---|
| **Target allocation** | "I want 40% VOO, 30% QQQ, 30% IWM" — per currency bucket | Static config / management section, edited rarely |
| **Holdings snapshot** | "On 2026-05-22 I own 12 VOO @ $521, 30 SPY shares @ $480..." | Time-stamped snapshot, one per month like other features |
| **Rebalance calculator** | "I have $5,000 to deploy in USD. Buy 7 VOO, 2 QQQ." | Stateless tool — derives from latest holdings + target allocation |

The two brokerage accounts (`ibi_ils`, `ibi_usd`) act as **currency buckets**. A ticker belongs to one bucket. The sum of a bucket's holdings should equal the value shown for that account on the Net Worth page (close enough — manual reconciliation).

---

## Page Layout (top to bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: "Stock Portfolio"      [+ New Holdings Snapshot]    │
├─────────────────────────────────────────────────────────────┤
│  SUMMARY CARDS                                               │
│  ┌──────────────┬──────────────┬────────────┬────────────┐  │
│  │ Total Value  │ ILS Bucket   │ USD Bucket │ Last Update│  │
│  │ ₪ 184,200    │ ₪ 92,400     │ $ 24,600   │ May 2026   │  │
│  └──────────────┴──────────────┴────────────┴────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  TAB BAR:  [● Holdings]  [ Allocation ]  [ Calculator ]  [ History ] │
├─────────────────────────────────────────────────────────────┤
│   tab content (see sections below)                           │
└─────────────────────────────────────────────────────────────┘
```

Four tabs keep three distinct mental modes separate (record / plan / act / audit) without overwhelming scroll. Tabs match the existing **Net Worth** page pattern.

---

## Ticker Config — Config-Driven

Like accounts, the list of tickers I track lives in a single config file (`frontend/src/config/tickers.ts`). All UI renders dynamically from it.

```ts
// frontend/src/types/index.ts — shared, used by accounts, tickers, snapshots
export enum Currency {
  ILS = 'ils',
  USD = 'usd',
}

// frontend/src/config/tickers.ts
export interface TickerConfig {
  symbol: string;        // 'VOO', 'QQQ' — also the unique key
  name: string;          // 'Vanguard S&P 500 ETF' — display
  bucket: 'ibi_ils' | 'ibi_usd'; // which brokerage sub-account holds it
  currency: Currency;    // Currency.ILS or Currency.USD — matches the bucket
  color: string;         // for charts/donut slices
  order: number;
}
```

Adding a ticker = one entry in the file. All tables, forms, donut slices, calculator rows update automatically.

> **Design note — currency typing.** Today `AccountConfig.currency` is the string-literal union `'ILS' | 'USD'`. As part of this work, introduce a single shared `Currency` **enum** in `frontend/src/types/index.ts` and **migrate `AccountConfig.currency`** to it too, so all code consumes one source of truth. JSON stored on disk uses the enum's *string values* (`"ils"` / `"usd"`) which is safe for serialization. Backend mirrors the same string values in its TS types (Hono runs in Node so we can `export enum Currency` server-side as well, or keep it as a string-literal union there if we prefer not to share a package). Currency formatters (`formatILS`, `formatUSD`, `formatCurrency`) switch on the enum.

> **Design note — ticker list source:** I considered making the ticker list *editable from the UI* (like accounts in some apps). Decided against it for the first version — same rationale as accounts: it's a config, it changes rarely, editing files is faster than building a CRUD UI for it.

---

## Tab 1: Holdings (default)

Shows the **latest snapshot**: every ticker's current position. Two sub-tables (one per currency bucket), so totals always make sense without mixing currencies.

```
── ILS Bucket (IBI Stock Market ILS) ─────────────────────────
  Symbol  Name         Shares   Price (₪)  Value (₪)   % of bucket
  ────────────────────────────────────────────────────────────
  TASE.X  Some ETF       240    ₪ 215.40   ₪ 51,696    55.9%
  TASE.Y  Another        180    ₪ 226.13   ₪ 40,703    44.1%
  ────────────────────────────────────────────────────────────
  TOTAL                                    ₪ 92,399   100.0%

── USD Bucket (IBI Stock Market USD) ─────────────────────────
  Symbol  Name              Shares  Price ($)  Value ($)  %
  ────────────────────────────────────────────────────────────
  VOO     Vanguard S&P 500     20   $ 521.40   $ 10,428   42.3%
  QQQ     Invesco Nasdaq      14   $ 480.00   $  6,720   27.3%
  IWM     Russell 2000        30   $ 250.00   $  7,500   30.4%
  ────────────────────────────────────────────────────────────
  TOTAL                                       $ 24,648  100.0%
```

**Per-ticker metadata row (expandable):** click the symbol to expand a row that shows:
- Inferred full name (from `tickers.ts` config — no live lookup in v1).
- A small price sparkline: the historical prices we already stored across past snapshots (so the graph "fills in" as snapshots accumulate; no external API needed).
- Last 6 snapshot prices as a tiny table.

> **Open question for later:** auto-fetching live prices via Yahoo Finance / Stooq is appealing but adds CORS / rate-limit / failure paths. **First version stays manual** — you type the price in the snapshot modal. Sparkline uses prices already entered in past snapshots. We can layer in fetching later without changing the data model.

### Growth Statistics (per ticker + per bucket + total)

A dedicated **Growth column group** is appended to each bucket sub-table — three extra columns on the right showing how each ticker (and the bucket total) has changed since prior snapshots:

```
── USD Bucket (IBI Stock Market USD) ──────────────────────────────────────────────
  Symbol  Shares  Price ($)  Value ($)   %     Δ MoM    Δ MoM %   Δ 12M %
  ─────────────────────────────────────────────────────────────────────────────
  VOO       20    $ 521.40   $ 10,428   42.3%  +$ 312    +3.1%    +18.4%
  QQQ       14    $ 480.00   $  6,720   27.3%  +$  84    +1.3%     +9.2%
  IWM       30    $ 250.00   $  7,500   30.4%  −$ 150    −2.0%     +4.7%
  ─────────────────────────────────────────────────────────────────────────────
  TOTAL                      $ 24,648  100.0%  +$ 246    +1.0%    +12.6%
```

**Definitions:**
- `Δ MoM` (absolute) — change in **value** vs the previous snapshot, in the ticker's own currency. Includes both price change *and* shares change (new buys / sales).
- `Δ MoM %` — `(currentValue − prevValue) / prevValue × 100`. Coloured green (up) / red (down) / grey (no change or no prior snapshot).
- `Δ 12M %` — same formula, vs the snapshot 12 months ago (or the oldest available if <12 months of history).

**Growth toggle.** A small toggle above each table lets the user switch the basis between **value** (includes contributions) and **price** (pure market movement, derived from `price` field only). Default: value. Price view is useful for asking *"is the market up or am I just contributing more?"*

**Summary card additions.** The page-level summary cards add a small footnote line under each value:

```
┌──────────────────────────┐
│ Total Portfolio Value    │
│ ₪ 184,200                │
│ ▲ +₪ 3,420 (+1.9%) MoM  │ ← new
└──────────────────────────┘
```

Both ILS Bucket and USD Bucket cards get the same MoM footnote in their native currency. Total Portfolio MoM uses ₪ (converted via the *current* snapshot's `usdRate` on both sides — i.e., we compare apples-to-apples by converting both months with their own rates, so currency drift doesn't masquerade as portfolio change).

**Allocation tab growth.** A small "Drift from target" indicator next to each ticker row: e.g., `+5.9%` (over target) or `−1.7%` (under target). Already-implicit in the Target vs Actual columns, but explicit makes it scannable.

**History tab growth.** Each row already shows the bucket totals; add a `Δ vs prev` column showing the MoM % for each bucket total. The expanded per-ticker rows do *not* need growth columns — they'd clutter; users who want to compare months can scroll between rows.

---

## Tab 2: Allocation (the "management section")

Two side-by-side donut charts (one per currency bucket) showing **target vs actual**, plus an editable target table.

```
┌──────────────────────────┐  ┌──────────────────────────┐
│  ILS Bucket              │  │  USD Bucket              │
│  [Target] [Actual]       │  │  [Target] [Actual]       │
│    donut                 │  │    donut                 │
│                          │  │                          │
│  Symbol   Target  Actual │  │  Symbol  Target  Actual  │
│  TASE.X    50%    55.9%  │  │  VOO      50%    42.3%   │
│  TASE.Y    50%    44.1%  │  │  QQQ      25%    27.3%   │
│                          │  │  IWM      25%    30.4%   │
│  [Edit Targets]          │  │  [Edit Targets]          │
└──────────────────────────┘  └──────────────────────────┘
```

**Target editing:** clicking *Edit Targets* opens a modal with a percentage field per ticker in that bucket. Validation: must sum to 100%, individual values 0–100. Saved per-bucket.

**Storage of targets:** a separate, single-row record (not snapshotted by month — targets are a current intent, not a time series). One file: `data/portfolio-targets.json`.

```ts
{
  ils:  { 'TASE.X': 50, 'TASE.Y': 50 },
  usd:  { 'VOO': 50, 'QQQ': 25, 'IWM': 25 },
  updatedAt: '2026-05-22T...'
}
```

> **Why not snapshot targets too?** Targets change rarely and we always want "the current target." Snapshotting adds UI complexity (which target was active when?) with little gain. Easy to upgrade later if needed.

---

## Tab 3: Calculator (the rebalance / new-money tool)

Stateless tool. Inputs at top, results below. Nothing is saved — pure planning.

```
┌─────────────────────────────────────────────────────────────┐
│  REBALANCE CALCULATOR                                        │
│                                                              │
│  I want to invest:  [ 5,000 ]   in:  [● USD]  [ ILS ]        │
│                                                              │
│  Based on the latest snapshot (May 2026) and current targets.│
│  Rebalancing the [USD bucket] only.                          │
│                                                              │
│  [ Compute ]                                                 │
├─────────────────────────────────────────────────────────────┤
│  RESULT — Buy these shares:                                  │
│                                                              │
│  Symbol  Price    Buy shares  Spend       New %  Target %    │
│  ────────────────────────────────────────────────────────    │
│  VOO    $ 521.40    6        $ 3,128     46.2%   50%         │
│  QQQ    $ 480.00    3        $ 1,440     27.7%   25%         │
│  IWM    $ 250.00    1        $   250     27.1%   25%         │
│  ────────────────────────────────────────────────────────    │
│  Total spent:  $ 4,818       Leftover cash: $ 182             │
│                                                              │
│  Note: Cannot reach target without selling. Best achievable  │
│  drift shown. Leftover left in cash.                         │
└─────────────────────────────────────────────────────────────┘
```

### The buy-only rebalancing algorithm

User goal: *make the new bucket total split closer to the target percentages, using only the new cash.*

**Key clarification on what "over target" means.** Targets are *ratios* (e.g., 50% VOO / 25% QQQ / 25% IWM). They define the desired *split of the bucket's total value*. A ticker is "over target" when its **current value as a % of the bucket** is higher than its target % — e.g., VOO sits at 60% of the bucket but its target is 50%. When that happens, the new money cannot reduce VOO's ratio without selling.

In the **common case** (no ticker is over-target), the algorithm simply moves every ticker toward its target ratio — which, for a well-behaved bucket, looks almost identical to spending the new cash in the target proportions (e.g., 50/25/25).

**Per the rules:** rebalance acts on a single currency bucket (the one matching the invest currency), considers only tickers in that bucket, and only **buys** (never sells).

**Algorithm (greedy buy-only):**

1. Read the latest snapshot for the chosen bucket → starting holdings `value[t]` per ticker `t`.
2. Read targets `target[t]` (in %) for the bucket.
3. Let `cash` = amount user wants to invest. Let `T = currentBucketTotal + cash` (the post-investment bucket total).
4. For each ticker compute *desired value* `desired[t] = (target[t]/100) × T` and *deficit* `deficit[t] = max(0, desired[t] - value[t])`.
   - If `value[t] >= desired[t]`, the ticker is over-target ratio-wise; its deficit is 0 and we cannot buy more without making the imbalance worse. (Selling would be needed to fix, but selling is not allowed.)
5. Distribute `cash` across tickers proportionally to `deficit[t]`: `weight[t] = deficit[t] / Σ deficit[*]`, then `spend[t] = weight[t] × cash`.
   - **Fallback when Σ deficit = 0** (every ticker is at or above its target ratio — e.g., you skipped contributing to one ticker for a while and others have grown disproportionately): instead of refusing, **deploy the new cash in target proportions** (`weight[t] = target[t] / 100`). The money still gets put to work in the shape you originally chose; an info note explains *"All tickers are at or above target. Deploying new cash in target proportions; full rebalance would require selling."*
6. Convert spend to *whole shares*: `shares[t] = floor(spend[t] / price[t])`.
7. Compute leftover cash = `cash − Σ (shares[t] × price[t])`.
8. (Refinement step) **Distribute leftover into one more whole share** wherever it most reduces drift from target — small greedy pass — to minimize unused cash. Cap at one extra share per ticker.
9. Display result. If leftover ≥ smallest share price among tickers with deficit > 0, show "Cannot fully deploy — $X leftover".

> **Open question (resolved by user):** Fractional shares — whole shares only.

### Visual cue when rebalance is impossible without selling

If the user is *already so over-target on a ticker* that no amount of buying others can fix it within the new cash, we show an info note above the result table: *"Note: with new money only, target % cannot be fully reached. Showing best achievable allocation."* No error — just a hint.

---

## Tab 4: History

Same auditable raw table pattern as Net Worth / Account Fees pages:

```
Month     ILS Bucket  USD Bucket  USD Rate  Notes      Edit
May 2026  ₪ 92,400    $ 24,648    ₪ 3.75    —          ✏️ 🗑️
Apr 2026  ₪ 89,100    $ 23,400    ₪ 3.78    —          ✏️ 🗑️
...
```

Click a row → opens the **New Holdings Snapshot** modal pre-filled with that month's data (same edit-pattern as Net Worth / Account Fees history).

**Expandable row detail.** Each row has an expand caret (▸). Clicking it reveals an inline sub-table with the per-ticker breakdown for that month:

```
▾ May 2026  ₪ 92,400  $ 24,648  ₪ 3.75
    ── ILS Bucket ──
    TASE.X   240 sh × ₪ 215.40 = ₪ 51,696
    TASE.Y   180 sh × ₪ 226.13 = ₪ 40,703
    ── USD Bucket ──
    VOO      20 sh × $ 521.40  = $ 10,428
    QQQ      14 sh × $ 480.00  = $  6,720
    IWM      30 sh × $ 250.00  = $  7,500
```

Helpful for auditing past entries and remembering how positions evolved.

---

## "New Holdings Snapshot" Modal

Triggered by the header button. One modal, sections per bucket. **Three fields per ticker: shares, price, currency-already-implied.**

```
┌─────────────────────────────────────────────────┐
│  New Holdings Snapshot — May 2026         [✕]   │
│  [ 2026-05 ▾ ]      USD Rate: [ 3.75 ]          │
│                                                  │
│  ── ILS Bucket (IBI ILS) ─────────────────────  │
│  TASE.X    Shares [ 240 ]   Price ₪ [ 215.40 ]  │
│  TASE.Y    Shares [ 180 ]   Price ₪ [ 226.13 ]  │
│                                                  │
│  ── USD Bucket (IBI USD) ─────────────────────  │
│  VOO       Shares [  20 ]   Price $ [ 521.40 ]  │
│  QQQ       Shares [  14 ]   Price $ [ 480.00 ]  │
│  IWM       Shares [  30 ]   Price $ [ 250.00 ]  │
│                                                  │
│  Previous values shown as placeholder.           │
│                                                  │
│  [ Cancel ]              [ Save Snapshot ]      │
└─────────────────────────────────────────────────┘
```

UX details (mirror existing modals):
- Month/year defaults to current month.
- Previous values shown as grey placeholder text.
- Tab order moves top to bottom, shares → price → next ticker.
- Save disabled until at least one row has both shares and price.
- 409 conflict on duplicate month → warn + offer overwrite (same as other modals).
- USD rate field at top is required if any USD ticker has a value — used to compute the bucket's value in ILS for the **summary cards** total.

---

## Data Model (Backend)

A new endpoint group `/api/portfolio` with two resources:

### 1. Portfolio Snapshots (time series — one per month)

`data/portfolio.json`

```ts
interface PortfolioPosition {
  symbol: string;       // 'VOO'
  shares: number;
  price: number;        // in the ticker's currency (Currency.ILS or Currency.USD)
}

interface PortfolioSnapshot {
  id: string;
  yearMonth: string;            // '2026-05'
  positions: Record<string, PortfolioPosition>; // keyed by symbol
  usdRate?: number;             // copied into the snapshot, like MonthlySnapshot
  createdAt: string;
  updatedAt: string;
}
```

The position's currency is **inferred from the ticker's `bucket`** in `tickers.ts` — we don't store it per-position to avoid drift. The shared `Currency` enum from the frontend is mirrored verbatim on the backend in `backend/src/types.ts`.

Same CRUD shape as fees / snapshots routes. Same 409-on-duplicate-yearMonth rule.

### 2. Portfolio Targets (single record)

`data/portfolio-targets.json`

```ts
interface PortfolioTargets {
  ils: Record<string, number>;  // { 'TASE.X': 50, 'TASE.Y': 50 }
  usd: Record<string, number>;  // { 'VOO': 50, 'QQQ': 25, 'IWM': 25 }
  updatedAt: string;
}
```

Routes: `GET /api/portfolio/targets`, `PUT /api/portfolio/targets`. No history.

---

## Seed Data (extending `scripts/seed.mjs`)

The existing `just seed` command (defined in the justfile, runs `node scripts/seed.mjs`) generates 12 months of fake Net Worth snapshots. We extend it to **also seed the stock portfolio**, so the new page has realistic data on a fresh checkout.

**What the extended seed produces, in order:**

1. **Net Worth snapshots** — unchanged from today (12 months of `bank`, `pension_*`, `ibi_ils`, `ibi_usd`, ...).
2. **Portfolio targets** — single `PUT /api/portfolio/targets` with a plausible split, e.g.:
   - `ils: { 'TASE.X': 50, 'TASE.Y': 50 }`
   - `usd: { 'VOO': 50, 'QQQ': 25, 'IWM': 25 }`
   - (Real symbols will be filled in once the user provides them — placeholder works for seeding.)
3. **Portfolio snapshots** — 12 months of `POST /api/portfolio` mirroring the same `yearMonth` axis as the Net Worth snapshots. For each month, the per-bucket totals must **reconcile with the corresponding `ibi_ils` / `ibi_usd` values** in the matching Net Worth snapshot — otherwise the new Reconciliation banner will flash a warning the moment the user opens the page after seeding. (Strict reconciliation also gives us a free integration test.)

**Algorithm for the portfolio seed (per month):**
- Pull the matching Net Worth snapshot's `ibi_ils` value as the *target ILS bucket total*; same for `ibi_usd`.
- For each ticker in the bucket, pick a *price* with small monthly drift (random walk around a starting price, e.g. VOO around $500, QQQ around $450, IWM around $250 — TASE tickers around ₪200).
- Allocate the bucket total across tickers in roughly the **target proportions**, then derive `shares = round(allocatedValue / price)`.
- The rounding will cause tiny rounding error vs the Net Worth totals; the seed adjusts the price (or shares) of the largest-weight ticker by the residual so the bucket reconciles exactly. Same trick the snapshot rounding logic already uses (`Math.round(v / round) * round` on line 87).
- Copy the same `usdRate` used in that month's Net Worth snapshot.

**CLI flags** mirror existing behavior:
- `just seed` — seeds Net Worth + portfolio together (12 months).
- `just seed --months 24` — same `--months` flag controls both.
- `just seed --portfolio-only` — *(new)* skip Net Worth seeding, useful when you've already seeded Net Worth and just want to re-seed portfolio. Implementation: just guard the Net Worth loop with a flag check.
- `just seed --skip-portfolio` — *(new)* legacy behavior, seeds Net Worth only.

**409 handling.** Same as today — if a `yearMonth` already exists, log "already exists, skipped" and continue. The seed remains idempotent for re-runs.

**File layout choice.** Keep everything in `scripts/seed.mjs` (one file, three loops). An alternative is splitting into `seed-snapshots.mjs` / `seed-portfolio.mjs` / `seed-targets.mjs` with a thin wrapper, but the existing file is short and the duplication of helpers (`randn`, `monthOffset`, `post`) doesn't justify a refactor.

> **Why seed portfolio targets even though they're not month-scoped?** Without seeded targets, the Allocation tab and Calculator are non-functional on a freshly-seeded dev environment. We always want a working demo state after `just seed`.

---

## Frontend Structure (mirroring `features/account-fees/`)

```
frontend/src/
├── config/
│   └── tickers.ts                       (TICKERS array, source of truth)
├── api/
│   └── portfolio.ts                     (CRUD client + targets client)
├── hooks/
│   ├── usePortfolio.ts                  (snapshots, identical to useFees pattern)
│   └── usePortfolioTargets.ts           (single-record GET/PUT)
└── features/stock-portfolio/
    ├── StockPortfolioPage.tsx
    ├── utils/
    │   ├── computeBucketTotals.ts
    │   ├── computeActualAllocation.ts
    │   ├── computeGrowth.ts             (MoM / 12M deltas per ticker + per bucket + total)
    │   └── rebalanceCalculator.ts       (the buy-only algorithm)
    └── components/
        ├── PortfolioSnapshotModal.tsx
        ├── SummaryCards.tsx
        ├── HoldingsTab.tsx
        ├── AllocationTab.tsx
        ├── CalculatorTab.tsx
        ├── HistoryTab.tsx
        ├── EditTargetsModal.tsx
        └── charts/
            ├── AllocationDonut.tsx       (one per bucket, target vs actual)
            └── TickerSparkline.tsx       (from past snapshot prices)
```

**Navigation:** add `'stock-portfolio'` to the `Page` union in `App.tsx` and a NavButton labeled "Stock Portfolio".

---

## Summary Cards (top of page)

| Card | Value | Sub-line | Notes |
|---|---|---|---|
| **Total Portfolio Value** | Sum of both buckets, converted to ₪ using snapshot's `usdRate` | `▲ +₪ X (+Y%) MoM` | The headline number |
| **ILS Bucket** | Sum of ILS-currency holdings | `▲ +₪ X (+Y%) MoM` | In ₪ |
| **USD Bucket** | Sum of USD-currency holdings | `▲ +$ X (+Y%) MoM` | In $ — *not* converted, shown in its native currency |
| **Last Snapshot** | "May 2026" (or "No data yet") | — | So you remember how fresh the data is |

MoM sub-lines are hidden when there's no prior snapshot to compare against.

---

## Reconciliation with Net Worth (IBI accounts only)

The Stock Portfolio page's two buckets should match the two IBI accounts on the Net Worth page **for the same `yearMonth`**:

- ILS bucket total ⇄ `values['ibi_ils']` on the matching Net Worth snapshot
- USD bucket total (in $) × `usdRate` ⇄ `values['ibi_usd']` on the matching Net Worth snapshot *(IBI USD is already stored in ILS on the Net Worth page — the `usdRate` from the snapshot does the conversion)*

When a portfolio snapshot exists *and* a Net Worth snapshot exists for the same month, show a small banner above the Holdings tab:

```
✓ Reconciles with Net Worth for May 2026
```

or, when they disagree:

```
⚠ Holdings total ₪ 92,400 doesn't match Net Worth IBI ILS account (₪ 90,000) for May 2026
  — difference ₪ 2,400. Edit one to fix.
```

A single banner can show both buckets' status compactly. Reconciliation is a *display-only* check — never blocks saving. We compare only against the IBI accounts (not the whole net worth), since the rest of the portfolio is unrelated.

> The Net Worth IBI numbers are still where the Net Worth page reads from — we are not duplicating storage. We just compute "what would the IBI account values be, if derived from this portfolio snapshot" and warn on mismatch.

---

## Empty State

- No snapshots yet → friendly prompt, prominent **+ New Holdings Snapshot** button, tabs disabled except for **Allocation** (so you can still set targets up-front).
- Snapshot exists but no targets set → **Allocation** tab shows a *"Set your targets to enable the calculator"* nudge.

---

## Responsive / Mobile

- Bucket sub-tables stack vertically on narrow screens.
- Donut + table in Allocation tab go stacked (donut on top).
- Modal becomes full-screen bottom sheet on mobile (matches existing modals).
- Calculator inputs stack; result table scrolls horizontally if needed.

---

## Confirmed Decisions

| Question | Decision |
|---|---|
| Price source | **Manual entry only in v1.** Sparklines fill in from past snapshots. |
| Share precision | **Whole shares only.** Leftover cash shown explicitly. |
| Targets editing | **Editable from UI per bucket;** saved as a single record (no history). |
| Rebalance semantics | Targets are **ratios of the bucket total**. Algorithm moves every ticker toward `(target% × newBucketTotal)` using only buys. |
| All-tickers-over-target fallback | **Deploy new cash in target proportions** (50/25/25 of new money) with an info note. Never refuse to compute. |
| History row expansion | **Yes, expandable rows** show per-ticker shares × price for that month. |
| Reconciliation with Net Worth | **Yes — IBI accounts only.** Banner above Holdings tab when buckets match (or don't match) the IBI ILS / IBI USD account values for the same yearMonth. Display-only check, never blocks saving. |
| Currency typing | **Use a TypeScript `enum Currency { ILS = 'ils', USD = 'usd' }`** in `types/index.ts`. New code uses it; migrate `AccountConfig.currency` to it as part of this work. JSON on disk stores `"ils"` / `"usd"`. |
| Growth statistics | **Per-ticker, per-bucket, and total** Δ MoM (absolute + %) and Δ 12M (%). Shown as extra columns in Holdings tab + sub-line on Summary cards + drift indicator on Allocation tab + Δ-vs-prev column on History. Toggle between "value" (default) and "price" basis. |
| Seed data | **Extend `scripts/seed.mjs`** to also generate portfolio snapshots + targets that reconcile with the seeded IBI account values. New flags `--portfolio-only` / `--skip-portfolio`. |

## Build-Time TODO (not blocking the plan)

- **Seed `tickers.ts` with the actual symbols** currently held in `ibi_ils` and `ibi_usd`. Mockups in this plan use placeholders (`TASE.X`, `VOO`, `QQQ`, `IWM`).

---

## Implementation Order (when approved)

1. Introduce `Currency` enum in `frontend/src/types/index.ts`; migrate `AccountConfig.currency` and the `formatCurrency` dispatcher.
2. Create `frontend/src/config/tickers.ts` with placeholder tickers and the `TickerConfig` type.
3. Backend: add `backend/src/types.ts` portfolio types, `backend/src/storage/portfolioStore.ts` (snapshots) and `portfolioTargetsStore.ts` (single record), `backend/src/routes/portfolio.ts`; wire them into `index.ts`. Mirror `fees.test.ts` for both.
4. Frontend: `api/portfolio.ts`, `hooks/usePortfolio.ts`, `hooks/usePortfolioTargets.ts`.
5. Frontend feature folder `features/stock-portfolio/` — page + four tab components + modal + utils (`computeBucketTotals`, `computeActualAllocation`, `computeGrowth`, `rebalanceCalculator`).
6. Add `'stock-portfolio'` nav button to `App.tsx`.
7. Extend `scripts/seed.mjs`: add target-PUT and 12-month portfolio snapshot loop reconciling with IBI account totals; add `--portfolio-only` / `--skip-portfolio` flags.
8. Run through the verification smoke test below.

---

## Verification Plan (for when we build it)

End-to-end smoke test, manually:
1. Add 2 tickers per bucket in `tickers.ts`. App rebuilds without code changes.
2. Run `just seed` on a freshly-wiped `data/` directory → Net Worth, portfolio targets, and 12 months of portfolio snapshots all populated.
3. Open the new **Stock Portfolio** nav item — Holdings tab shows current month, no reconciliation warning (seed produces matching totals).
4. Re-run `just seed --portfolio-only` — re-seeds portfolio only; Net Worth snapshots untouched (409s logged).
5. Set targets via Allocation tab on an empty system → values persist after refresh.
6. Create a holdings snapshot for current month → appears in Holdings tab and History tab; growth columns blank for the first month (no prior).
7. Create a second month's snapshot → growth Δ MoM / Δ MoM % columns now populate; colours correct (green/red).
8. Edit a past snapshot from History → confirm changes propagate to growth columns and reconciliation banner.
9. On Calculator tab: enter $1,000 USD → result table shows whole-share buys, leftover cash < smallest USD price, "new %" closer to target than "current %".
10. Try investing in a currency where every ticker is over-target (manually edit a snapshot to force this) → confirm fallback note appears and money distributes in target proportions.
11. Switch growth toggle from **value** → **price** on Holdings tab; confirm the Δ columns recalculate using only `price` changes (ignoring shares-bought).
12. Edit an IBI value on the **Net Worth** page so it diverges from the portfolio bucket total → reconciliation banner switches to warning state on the Stock Portfolio page.
13. Confirm `Currency` enum is used everywhere: grep for `'ILS' | 'USD'` and `'USD' | 'ILS'` should return only legacy spots intentionally not migrated (none, ideally).
14. Mobile viewport: nav button visible, modal becomes bottom sheet, tables scroll cleanly.

Backend tests: mirror `backend/src/routes/fees.test.ts`:
- CRUD for portfolio snapshots, 409 on duplicate yearMonth.
- Targets GET/PUT roundtrip; PUT validates sum=100 per bucket.
- Growth-stat utility unit tests cover: missing prior snapshot, prior with no holdings of that ticker (treated as new position), 12-month lookup falling back to oldest available.
- Rebalance calculator unit tests cover: common case, all-over-target fallback, leftover-cash distribution, single-ticker bucket.
