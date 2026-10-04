# Design patterns

Two patterns are central to the business rules: **Strategy** for catalogue
pricing and **State Machine** for workflow status transitions.

## 1. Strategy Pattern — catalogue pricing

### Problem

Different companies use different catalogues. A catalogue may use a fixed
price, a multiplier, an amount adjustment or a percentage markup, while an
individual dish can still have a manual override.

### Design

The pricing service resolves a price through one common interface. Each
strategy calculates a result from the base price and its configured value.

```text
Base dish price
       |
       v
Company's catalogue
       |
       +--> fixed/override price
       +--> add amount
       +--> subtract amount
       +--> multiply
       +--> percentage markup
       |
       v
Final price in integer cents
```

### Why it fits

- Adding a new pricing rule does not require changing company or order code.
- The calculation is easy to test independently.
- Manual overrides take precedence over derived values.
- Missing catalogue membership or price hides a dish instead of showing a
  misleading zero price.
- Prices are resolved before an order is created and then snapshotted.

### Example

If the base price is 2,000 cents and a tier applies a 15% markup:

```text
2,000 + (2,000 × 15%) = 2,300 cents
```

Derived prices round up to the next five cents where required by the
assignment. The current documented limitation is that catalogue strategies
apply to final dish prices; option prices remain independently stored.

## 2. State Machine Pattern — operational workflows

### Problem

Orders, kitchen units and delivery drops must not jump between arbitrary
statuses. For example, a Driver must not mark a ready-to-leave drop delivered.

### Design

Each workflow has a defined set of legal transitions. The backend validates the
current state and the requested next state before writing it.

```text
Order:
  DRAFT -> PLACED -> CONFIRMED -> DELIVERED
     |        |          |
     +------> CANCELLED / REJECTED

Kitchen unit:
  NOT_STARTED -> STARTED -> DONE

Delivery drop:
  KITCHEN_READY -> DISPATCH_READY
       -> OUT_FOR_DELIVERY -> DELIVERED
```

### Why it fits

- Invalid transitions are rejected in one place.
- Admin, Kitchen, Dispatch and Driver actions remain predictable.
- Repeated actions can be detected instead of silently corrupting progress.
- Timestamps such as kitchen-started, kitchen-ready and delivered are tied to
  meaningful transitions.
- The same rules apply whether the request comes from the UI or a direct API
  client.

### Role boundaries

| Role | Allowed workflow responsibility |
|---|---|
| Admin | Create orders and apply approved overrides |
| Kitchen | Start and finish confirmed kitchen units |
| Dispatch | Assign drivers and move eligible drops out for delivery |
| Driver | Complete only their own out-for-delivery drops |

## Supporting practices

The application also uses supporting engineering patterns without making them
the primary domain patterns:

- **Permission guards:** controllers declare required permissions; guards
  enforce them on the server.
- **Service boundaries:** controllers handle HTTP concerns while services
  hold business rules and Prisma operations.
- **Snapshotting:** order lines and combinations preserve the price and option
  choices used at order time.
- **Optimistic/constrained updates:** status writes check the expected current
  state so two staff members cannot legitimately complete the same unit twice.

These supporting practices keep the Strategy and State Machine rules
consistent across Admin, Kitchen, Dispatch and Driver dashboards.
