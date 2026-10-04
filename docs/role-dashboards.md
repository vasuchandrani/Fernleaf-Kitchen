# Role dashboards

Fernleaf Kitchen is used by four internal roles. Each person signs in to one
role, sees the work relevant to that role, and completes a clear part of the
same meal-delivery workflow.

## 1. Admin dashboard

### User story

As an operations manager, I want one place to configure the menu, companies,
employees, prices and orders so the kitchen can run without editing the
database or code.

### Real-life workflow

1. Create or update dishes, categories, stations and option groups.
2. Create catalogue versions and set pricing strategies or overrides.
3. Create companies, delivery addresses and employees.
4. Select the catalogue and pricing tier used by each company.
5. Open a company's menu, add dishes and options, assign dishes to employees,
   then save a draft or place the order.
6. Review orders, edit eligible drafts/placed orders, and handle exceptions.
7. Use settings to manage kitchen working days, holidays and cut-off rules.

### Dashboard focus

- Today's operational summary
- Order search and status filters
- Catalogue and pricing management
- Company and employee CRUD
- Settings and administrative overrides

The Admin role can override operational data, but normal status transitions
remain explicit and auditable.

## 2. Kitchen dashboard

### User story

As a cook, I want to see only confirmed meals that need preparation, grouped
by station, so I can start and finish my work without seeing billing or
administrative details.

### Real-life workflow

1. Select today or another delivery date.
2. Filter by kitchen station, preparation status and dietary type.
3. Open the confirmed preparation units for the station.
4. Mark a unit **Started** when cooking begins.
5. Mark it **Done** when it is ready for packing.
6. Continue until every unit in the order is complete.

Only confirmed orders enter the kitchen board. A dish without a station is
shown under **Unassigned** so it is never silently lost.

### Dashboard focus

- Prep units by station
- Not started, started and done counts
- At-risk or late work
- Date-aware read-only review for past/future dates
- Clear loading, empty and error states

## 3. Dispatch dashboard

### User story

As a dispatch coordinator, I want to know which drops are waiting for the
kitchen, ready to pack, out for delivery or delivered so I can assign drivers
and keep deliveries moving.

### Real-life workflow

1. Review drops created from compatible company, address and delivery-time
   orders.
2. Watch kitchen completion and identify drops ready for packing.
3. Assign a driver to each ready drop.
4. Move a drop through the allowed delivery states.
5. Track unassigned, out-for-delivery and delivered work at a glance.

Dispatch is responsible for the handoff to the driver. A drop cannot become
out for delivery without an assigned driver.

### Dashboard focus

- Waiting for kitchen
- Ready to leave
- Out for delivery
- Delivered
- Unassigned drops
- Driver assignment and delivery progress

## 4. Driver dashboard

### User story

As a driver, I want a simple phone-friendly list of my assigned deliveries
for today so I can complete each delivery quickly without seeing information
that I do not need.

### Real-life workflow

1. Sign in on a phone.
2. See only drops assigned to the signed-in driver for today.
3. Read the order number and item quantity.
4. Select **Mark delivered** after handing over the drop.
5. Confirm completion and continue to the next delivery.

The Driver cannot see another driver's drops, assign drivers, edit orders or
skip the dispatch handoff. The only Driver transition is:

```text
OUT_FOR_DELIVERY -> DELIVERED
```

Delivery completion records the server timestamp and on-time result. Optional
delivery evidence is kept as a controlled extension and does not expand the
minimal Driver card with company, address, employee, dish or price details.

### Dashboard focus

- Today's assigned drops in delivery-time order
- Delivered versus remaining progress
- Order number and item quantity only
- Mobile-friendly loading, empty and error states

## Shared workflow

```text
Admin places order
        |
        v
Order confirmed after cut-off
        |
        v
Kitchen starts and completes prep units
        |
        v
Dispatch assigns driver and sends drop out
        |
        v
Driver marks drop delivered
```

Permissions are enforced by the backend for every step. Hiding a navigation
item in the frontend is not treated as authorization.
