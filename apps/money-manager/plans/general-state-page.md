# Money Manager — General State Page (Product Plan)

## Context

Nir wants a personal money manager app used once a month. The first feature is a **General State** page: a place to log how much money exists across all accounts each month, and see trends over time. Account types are a fixed set.

This plan covers only the **product design** (layout, interactions, widgets). Tech stack and data storage are deferred.

---

## Account Types — Config-Driven

All account types live in a **single configuration file** (e.g. `config/accounts.ts` or `config/accounts.json`). No other file needs to change when adding, removing, or renaming an account. Every table column, chart series, donut slice, sparkline row, and form field is rendered dynamically from this config.

### Config schema (per account)

```ts
{
  key: string;          // unique identifier, used as data key
  label: string;        // display name shown everywhere in the UI
  liquid: boolean;      // true = accessible today, false = long-term
  color: string;        // hex color for charts/donut
  order: number;        // display order in tables, forms, and charts
}
```

### Default accounts

| key | label | liquid | order |
|---|---|---|---|
| `bank` | Bank Account | true | 1 |
| `pension_a` | Pension A | false | 2 |
| `pension_b` | Pension B | false | 3 |
| `stocks` | Stock Market | true | 4 |
| `keren_hishtalmut` | Keren Hishtalmut | false | 5 |
| `altshuler_shaham` | Altshuler Shaham | true | 6 |

To add a new account: add one entry to the config file. All UI — snapshot form fields, table columns, chart series, sparklines — automatically include it.

---

## Page: General State

### Layout (top to bottom)

The page has a persistent header + summary cards, then a **two-tab** body: **Charts** (visual trends) and **History** (raw table). This avoids an overwhelming scroll and separates two distinct mental modes.

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: "Net Worth Overview"          [+ New Snapshot]  │
├───────────────────┬───────────────┬──────────┬──────────┤
│  Total Net Worth  │  Liquid       │  MoM Δ   │  Best    │
│  ₪ 1,238,000      │  ₪ 398,000    │ +₪ 8,200 │ Pension A│
├─────────────────────────────────────────────────────────┤
│  Show: [● All money]  [ Liquid only ]  ← filter         │
├─────────────────────────────────────────────────────────┤
│  [● Charts]  [ History ]           ← tab bar            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ── CHARTS TAB (default) ───────────────────────────     │
│                                                          │
│  NET WORTH OVER TIME  (line chart, all months)           │
│   1.3M ┤                                        ╭──      │
│   1.2M ┤                              ╭────────╯         │
│   1.1M ┤                  ╭──────────╯                   │
│        └──────────────────────────────────────           │
│         Jan   Feb   Mar   Apr   May                      │
│                                                          │
│  BREAKDOWN  < May 2026 >   (month navigator)             │
│  ┌────────────────────┐  ┌────────────────────────────┐  │
│  │  Donut chart       │  │  Bank          ₪ 120,000   │  │
│  │  (% share of each  │  │  Pension A     ₪ 340,000   │  │
│  │   account)         │  │  Pension B     ₪ 290,000   │  │
│  │                    │  │  Stocks        ₪ 180,000   │  │
│  │                    │  │  Keren Hish.   ₪ 210,000   │  │
│  │                    │  │  Altshuler     ₪  98,000   │  │
│  └────────────────────┘  └────────────────────────────┘  │
│                                                          │
│  PER-ACCOUNT SPARKLINES                                  │
│  Bank          ▁▂▃▃▄▄▅▆  ₪ 120,000  ▲ +₪ 5,000         │
│  Pension A     ▁▁▂▃▃▄▅▅  ₪ 340,000  ▲ +₪ 2,100         │
│  Pension B     ▁▂▂▃▄▄▄▅  ₪ 290,000  ▼ −₪   800         │
│  Stocks        ▂▃▁▂▄▅▅▆  ₪ 180,000  ▲ +₪ 1,400         │
│  Keren Hish.   ▁▁▂▂▃▄▄▅  ₪ 210,000  ▲ +₪   900         │
│  Altshuler     ▁▂▂▃▃▃▄▄  ₪  98,000  ▲ +₪   300         │
│                                                          │
│  ── HISTORY TAB ────────────────────────────────────     │
│  (raw snapshot table — see Snapshot History Table below) │
└─────────────────────────────────────────────────────────┘
```

---

## Interactions

### "New Snapshot" flow

Triggered by the `[+ New Snapshot]` button in the header. Opens a **modal / side drawer** (not a separate page) so the user never loses context of the dashboard.

```
┌───────────────────────────────────────────┐
│  New Snapshot — May 2026            [✕]   │
│  (month/year auto-filled, editable)       │
│                                           │
│  Bank Account          ₪ [__________]    │
│  Pension A             ₪ [__________]    │
│  Pension B             ₪ [__________]    │
│  Stock Market          ₪ [__________]    │
│  Keren Hishtalmut      ₪ [__________]    │
│  Altshuler Shaham      ₪ [__________]    │
│                                           │
│  Previous values shown as placeholder     │
│  text so you can see what to beat.        │
│                                           │
│              [Cancel]  [Save Snapshot]    │
└───────────────────────────────────────────┘
```

**UX details:**
- Month/year defaults to current month; can be changed (for back-filling).
- Each field shows last month's value as grey placeholder so entering numbers is fast.
- Tab order moves field-to-field top to bottom.
- "Save Snapshot" is disabled until at least one field is filled.
- If a snapshot already exists for that month, warn before overwriting.

### Editing a past snapshot

- In the **History tab**, each row has a ✏️ icon at the right edge.
- Clicking it opens the same modal pre-filled with that month's data.
- On the Charts tab, clicking a point on the Net Worth line chart also shows a small tooltip with an "Edit" link for that month.

### Month selector

- A subtle `< May 2026 >` navigator in the Breakdown section lets you browse past months' breakdown and donut without entering edit mode.

---

## Dashboard Widgets (summary cards, top of page)

| Widget | Value shown | Why useful |
|---|---|---|
| **Total Net Worth** | Sum of all accounts, latest snapshot | The number you care most about |
| **Liquid** | Sum of liquid accounts only | What you can actually access today |
| **Month-over-Month Δ** | Absolute change in total vs previous month | Quick pulse check |
| **Best Performing Account** | Account with highest absolute gain this month | Encourages looking at where growth comes from |

The two most important numbers — Total and Liquid — are the first two cards, visually heavier than the others.

Optional widgets to consider later:
- Yearly change (vs same month last year)
- Liquid % of total — shows balance between accessible and locked money

## Liquidity Filter

A **toggle/filter** sits between the summary cards and the tab bar, affecting everything below it (charts, donut, sparklines, table):

```
┌─────────────────────────────────────────────────────────┐
│  Total: ₪ 1,238,000   Liquid: ₪ 398,000                 │
│                                                          │
│  Show:  [● All money]  [ Liquid only ]                   │
├─────────────────────────────────────────────────────────┤
│  [● Charts]  [ History ]                                 │
```

**Behavior when "Liquid only" is active:**
- Line chart shows only the sum of liquid accounts over time.
- Donut chart shows only liquid accounts (long-term accounts disappear from the pie).
- Sparkline rows: long-term accounts are greyed out / hidden (user preference — default to greyed out so the list isn't jarring).
- History table: long-term account columns are hidden; Total column recalculates to liquid-only sum.
- The summary cards stay visible but the Total card gets a subtle "Liquid view" label to remind you the filter is active.

The filter state is **not persisted** — it resets to "All" on page reload. This is a view-only toggle, not a data filter.

---

## Empty State (first use)

When no snapshots exist yet, the page shows:
- A friendly prompt: "No data yet — add your first snapshot to get started."
- The `[+ New Snapshot]` button prominently centered.
- No charts (they appear once ≥1 snapshot exists).
- Sparklines and MoM delta appear once ≥2 snapshots exist.

---

## Confirmed Decisions

| Question | Decision |
|---|---|
| Pension labels | Keep "Pension A" / "Pension B" for now; rename in config file |
| Negative values | Bank account can go negative (overdraft); show in red, include correctly in total |
| Mobile | Fully responsive — must work on phone (for data entry on the go) |
| Currency | ILS (₪) throughout; no multi-currency needed |
| Language | English only — no Hebrew in the UI |
| Account types | Config-driven — all UI renders dynamically from `config/accounts` |

## Snapshot History Table

Below the per-account sparkline rows, a full-width table shows every snapshot as a row. This gives a raw, auditable view of the data and lets you spot data entry errors easily.

```
┌──────────┬──────────┬───────────┬───────────┬──────────┬────────────┬────────────┬──────────┬──────┐
│ Month    │ Bank     │ Pension A │ Pension B │ Stocks   │ Keren H.   │ Altshuler  │ Total    │      │
├──────────┼──────────┼───────────┼───────────┼──────────┼────────────┼────────────┼──────────┼──────┤
│ May 2026 │ 120,000  │ 340,000   │ 290,000   │ 180,000  │ 210,000    │  98,000    │ 1,238,000│ ✏️   │
│ Apr 2026 │ 115,000  │ 337,900   │ 290,800   │ 178,600  │ 209,100    │  97,700    │ 1,229,100│ ✏️   │
│ Mar 2026 │ 108,000  │ 335,200   │ 289,500   │ 172,000  │ 208,000    │  97,200    │ 1,209,900│ ✏️   │
│  …       │  …       │  …        │  …        │  …       │  …         │  …         │  …       │  …   │
└──────────┴──────────┴───────────┴───────────┴──────────┴────────────┴────────────┴──────────┴──────┘
```

**UX details:**
- Sorted newest-first by default; click column header to sort by any account value.
- The **Total** column is always shown and always the rightmost data column.
- The **✏️** action column opens the same "New Snapshot" modal pre-filled with that row's data.
- Negative bank values appear in red in the cell.
- On mobile, the table scrolls horizontally; Month and Total columns are sticky (pinned left/right).
- Pagination or "load more" if there are many months (e.g., show 12 rows, expand on demand).

---

## Responsive / Mobile Behavior

- Summary cards stack vertically on narrow screens (2×2 grid → single column)
- Net Worth chart scrolls horizontally if many months
- Breakdown section: donut chart collapses above the account list (stacked, not side-by-side)
- Per-account sparkline rows stay as rows but text truncates gracefully
- Modal for "New Snapshot" becomes a full-screen sheet on mobile (bottom sheet pattern)
