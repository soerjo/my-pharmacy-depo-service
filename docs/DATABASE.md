# Pharmacy Warehouse Service — Database Design

## Overview

Pharmacy warehouse microservice handling inventory, procurement, distribution, stock operations, and compounding (laboratory). Multi-tenant architecture — all data scoped by `organizationId`.

## Table Summary (21 tables)

| #   | Table                      | Purpose                                                  |
| --- | -------------------------- | -------------------------------------------------------- |
| 1   | `UnitOfMeasure`            | Measurement units with conversion hierarchy              |
| 2   | `Manufacturer`             | Product manufacturers                                    |
| 3   | `ProductCategory`          | Hierarchical product taxonomy                            |
| 4   | `Product`                  | Unified product catalog (finished goods + raw materials) |
| 5   | `Supplier`                 | Supplier management                                      |
| 6   | `WarehouseLocation`        | Physical storage locations                               |
| 7   | `Batch`                    | Batch tracking with expiry dates                         |
| 8   | `BatchInventory`           | Single source of truth for stock levels                  |
| 9   | `PurchaseOrder`            | Purchase orders to suppliers                             |
| 10  | `PurchaseOrderItem`        | Purchase order line items                                |
| 11  | `InboundShipment`          | Goods receipt records                                    |
| 12  | `InboundShipmentItem`      | Items received per shipment                              |
| 13  | `OutboundShipment`         | Customer/store shipments                                 |
| 14  | `OutboundShipmentItem`     | Items shipped per outbound                               |
| 15  | `StockMovement`            | Immutable audit trail                                    |
| 16  | `Transfer`                 | Internal location-to-location moves                      |
| 17  | `StockAdjustment`          | Manual inventory corrections                             |
| 18  | `Formula`                  | Compounding recipe (linked to output product)            |
| 19  | `FormulaIngredient`        | Ingredients per formula                                  |
| 20  | `CompoundingBatch`         | Production record                                        |
| 21  | `CompoundingBatchMaterial` | Raw materials consumed per production                    |

## Enums

| Enum                     | Values                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `ProductType`            | `FINISHED_GOOD`, `RAW_MATERIAL`                                                                         |
| `PurchaseOrderStatus`    | `DRAFT`, `SENT`, `CONFIRMED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`                             |
| `InboundShipmentStatus`  | `PENDING`, `RECEIVING`, `COMPLETED`, `CANCELLED`                                                        |
| `OutboundShipmentStatus` | `PENDING`, `PICKING`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`                                     |
| `TransferStatus`         | `PENDING`, `IN_TRANSIT`, `COMPLETED`, `CANCELLED`                                                       |
| `CompoundingStatus`      | `PENDING`, `MIXING`, `QC_CHECK`, `COMPLETED`, `CANCELLED`, `FAILED`                                     |
| `LocationType`           | `BULK_STORAGE`, `PICKING`, `COLD_STORAGE`, `QUARANTINE`, `LABORATORY`, `DISPENSING`                     |
| `StockMovementType`      | `INBOUND`, `OUTBOUND`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT`, `COMPOUNDING_IN`, `COMPOUNDING_OUT` |

## Entity Relationship Diagram

```
Master Data
───────────
UnitOfMeasure ◄──── Product (baseUnit, stockingUnit, sellingUnit, purchaseUnit)
                     │         │
Manufacturer ◄──────┘         │
ProductCategory ◄─────────────┘
Supplier

Inventory Core
──────────────
Product ──► Batch ──► BatchInventory ◄─── WarehouseLocation

Procurement (Inbound)
─────────────────────
Supplier ──► PurchaseOrder ──► PurchaseOrderItem ◄─── Product
    │              │
    └──► InboundShipment ──► InboundShipmentItem ──► Batch + Product + WarehouseLocation

Distribution (Outbound)
───────────────────────
OutboundShipment ──► OutboundShipmentItem ──► Batch + Product + WarehouseLocation

Stock Operations
────────────────
Transfer ──► Product + Batch + fromLocation ──► toLocation
StockAdjustment ──► Product + Batch + WarehouseLocation
StockMovement ──► Product + Batch + WarehouseLocation (audit trail for all operations)

Compounding / Laboratory
────────────────────────
Formula ──► Product (output product via productId)
    │
    ├──► FormulaIngredient ──► Product (RAW_MATERIAL)
    │
    └──► CompoundingBatch ──► CompoundingBatchMaterial ──► Product + Batch + WarehouseLocation
                │
                └──► Batch (produced finished good via producedBatch relation)
```

---

## Lifecycle 0: Master Data Setup

Before any warehouse operations, master data must be configured.

### Step 1: Unit of Measure

```
POST /api/unit-of-measures
{
  "code": "tablet",
  "name": "Tablet",
  "abbreviation": "tbl"
}

POST /api/unit-of-measures
{
  "code": "box",
  "name": "Box",
  "abbreviation": "box",
  "baseUnitId": "tablet-id",
  "conversionFactor": 10
}

POST /api/unit-of-measures
{
  "code": "carton",
  "name": "Carton",
  "abbreviation": "ctn",
  "baseUnitId": "box-id",
  "conversionFactor": 10
}
```

Hierarchy: `1 carton = 10 boxes = 100 tablets`

### Step 2: Product Categories

```
POST /api/product-categories
{ "name": "Medicines" }

POST /api/product-categories
{ "name": "Antibiotics", "parentId": "medicines-id" }
```

### Step 3: Manufacturers

```
POST /api/manufacturers
{
  "code": "KIMIA-FARMA",
  "name": "PT Kimia Farma",
  "contactEmail": "info@kimiafarma.co.id"
}
```

### Step 4: Suppliers

```
POST /api/suppliers
{
  "code": "DIST-INDO",
  "name": "PT Distributor Indo",
  "contactEmail": "order@distindo.co.id"
}
```

### Step 5: Warehouse Locations

```
POST /api/warehouse-locations
{
  "code": "ZONE-A",
  "name": "Zone A - Bulk Storage",
  "zone": "A",
  "locationType": "BULK_STORAGE"
}

POST /api/warehouse-locations
{
  "code": "ZONE-B-PICK",
  "name": "Zone B - Picking Area",
  "zone": "B",
  "locationType": "PICKING"
}

POST /api/warehouse-locations
{
  "code": "COLD-01",
  "name": "Cold Storage Room 1",
  "locationType": "COLD_STORAGE"
}

POST /api/warehouse-locations
{
  "code": "LAB-01",
  "name": "Laboratory",
  "locationType": "LABORATORY"
}
```

---

## Lifecycle 1: Product

### 1.1 Register Product

Insert into `Product` table. No purchase order needed. Stock starts at 0.

```
POST /api/products
{
  "code": "PARA-500",
  "name": "Paracetamol 500mg",
  "productType": "FINISHED_GOOD",
  "dosageForm": "Tablet",
  "strength": "500mg",
  "baseUnitId": "tablet-id",
  "stockingUnitId": "box-id",
  "sellingUnitId": "tablet-id",
  "purchaseUnitId": "carton-id",
  "categoryId": "analgesics-id",
  "manufacturerId": "kimia-farma-id",
  "minStock": 200,
  "maxStock": 5000
}
```

For raw materials:

```
POST /api/products
{
  "code": "AMOX-POWDER",
  "name": "Amoxicillin Trihydrate Powder",
  "productType": "RAW_MATERIAL",
  "casNumber": "61336-70-7",
  "grade": "USP",
  "baseUnitId": "gram-id",
  "stockingUnitId": "kilogram-id",
  "categoryId": "raw-materials-id",
  "manufacturerId": "raw-supplier-id",
  "minStock": 5
}
```

The product is now in the catalog but has no stock. It won't appear in stock lists (filtered by `HAVING SUM(quantity) > 0`).

### 1.2 Product Stock Acquisition

Two ways to get stock:

- **Purchase** (external): PO → InboundShipment → BatchInventory
- **Compound** (internal): Formula → CompoundingBatch → BatchInventory

### 1.3 Product Deactivation

Set `isActive = false`. The product no longer appears in active queries but historical data (shipments, movements) is preserved. Stock can still be shipped or adjusted but no new POs can reference it.

---

## Lifecycle 2: Batch

### 2.1 Batch Creation

Batches are created when goods enter the warehouse:

- **Via Inbound Shipment**: Batch created during goods receipt (from supplier)
- **Via Compounding**: Batch created when compounding completes (internal production)

A batch always belongs to a `Product`, has an `expirationDate`, and tracks cost.

### 2.2 Batch Inventory

On batch creation, a `BatchInventory` record is created at the target warehouse location. This is the only place stock quantities are stored.

### 2.3 Batch Expiry Handling

```
1. System identifies expired batches (WHERE expirationDate < NOW() AND isActive = true)
2. Admin reviews and creates StockAdjustment:
   POST /api/stock-adjustments
   {
     "productId": "...",
     "batchId": "expired-batch-id",
     "quantity": -50,
     "reason": "Expired - disposal required"
   }
3. BatchInventory deducted to 0
4. Batch.isActive set to false
```

### 2.4 Batch Lifecycle Diagram

```
Created (via Inbound or Compounding)
    │
    ├──► Active (isActive = true)
    │       │
    │       ├──► Stock consumed (outbound, transfer, adjustment, compounding)
    │       │
    │       ├──► Expiration approaching → Low stock alert triggers
    │       │
    │       └──► Expired → StockAdjustment → isActive = false
    │
    └──► Deactivated (isActive = false, e.g. defective recall)
```

---

## Lifecycle 3: Procurement (Stock In)

Raw materials and finished goods enter through the same flow.

```
SUPPLIER ──► PURCHASE ORDER ──► INBOUND SHIPMENT ──► BATCH INVENTORY
```

### 3.1 Create Purchase Order

```
POST /api/purchase-orders
{
  "supplierId": "...",
  "expectedDate": "2026-02-01",
  "items": [
    { "productId": "amoxicillin-500mg", "quantity": 5, "unitPrice": 50.00 },
    { "productId": "amoxicillin-powder-raw", "quantity": 2, "unitPrice": 200.00 }
  ]
}
→ Status: DRAFT
```

### 3.2 PO Status Progression

```
DRAFT ──► SENT ──► CONFIRMED ──► PARTIALLY_RECEIVED ──► RECEIVED
                  │
                  └──► CANCELLED
```

- **DRAFT**: Being prepared, not yet sent
- **SENT**: Sent to supplier, awaiting confirmation
- **CONFIRMED**: Supplier confirmed, awaiting delivery
- **PARTIALLY_RECEIVED**: Some items received, some pending
- **RECEIVED**: All items fully received
- **CANCELLED**: Order cancelled (no stock changes)

### 3.3 Receive Goods (Inbound Shipment)

```
POST /api/inbound-shipments
{
  "purchaseOrderId": "...",
  "supplierId": "...",
  "receivedBy": "john",
  "items": [
    {
      "productId": "amoxicillin-500mg",
      "batchId": "batch-001",
      "quantity": 5,
      "locationId": "zone-a-shelf-1"
    },
    {
      "productId": "amoxicillin-powder-raw",
      "batchId": "batch-002",
      "quantity": 2,
      "locationId": "zone-a-shelf-2"
    }
  ]
}
→ Status: PENDING
```

### 3.4 Inbound Shipment Status

```
PENDING ──► RECEIVING ──► COMPLETED
    │
    └──► CANCELLED
```

### 3.5 System Side Effects on Inbound Completion

1. `Batch` created (if not existing) or referenced
2. `BatchInventory` created/updated for each item at the specified location
3. `StockMovement` created (type: INBOUND) with `referenceId` = inboundShipment.id
4. `PurchaseOrderItem.receivedQty` incremented
5. If all PO items fully received → PO status: RECEIVED
6. If partially received → PO status: PARTIALLY_RECEIVED

---

## Lifecycle 4: Distribution (Stock Out)

### 4.1 Create Outbound Shipment

```
POST /api/outbound-shipments
{
  "destination": "Apotek Sehat",
  "destinationAddress": "Jakarta",
  "items": [
    {
      "productId": "amoxicillin-500mg",
      "batchId": "batch-001",
      "locationId": "zone-b-picking",
      "quantity": 20
    }
  ]
}
→ Status: PENDING
```

### 4.2 FIFO Picking

When creating outbound items, the system should select the batch with the **earliest expiration date** first:

```sql
-- Auto-suggest FIFO batch
SELECT bi.batchId, b.expirationDate, bi.quantity
FROM BatchInventory bi
JOIN Batch b ON bi.batchId = b.id
WHERE bi.productId = ?
  AND bi.locationId = ?
  AND b.isActive = true
  AND bi.quantity > 0
ORDER BY b.expirationDate ASC
LIMIT 1
```

### 4.3 Outbound Status Progression

```
PENDING ──► PICKING ──► PACKED ──► SHIPPED ──► DELIVERED
    │
    └──► CANCELLED
```

- **PENDING**: Shipment created, items not yet picked
- **PICKING**: Staff picking items from warehouse locations
- **PACKED**: Items packed and ready for dispatch
- **SHIPPED**: Left the warehouse (stock deducted here)
- **DELIVERED**: Confirmed delivered to destination
- **CANCELLED**: Shipment cancelled (no stock changes)

### 4.4 System Side Effects on SHIPPED

1. `BatchInventory` deducted for each item
2. `StockMovement` created (type: OUTBOUND) with `referenceId` = outboundShipment.id

---

## Lifecycle 5: Internal Transfer

Move stock between warehouse locations.

### 5.1 Create Transfer

```
POST /api/transfers
{
  "productId": "amoxicillin-500mg",
  "batchId": "batch-001",
  "fromLocationId": "zone-a",
  "toLocationId": "zone-b-picking",
  "quantity": 10
}
→ Status: PENDING
```

### 5.2 Transfer Status

```
PENDING ──► IN_TRANSIT ──► COMPLETED
    │
    └──► CANCELLED
```

### 5.3 System Side Effects on COMPLETED

1. `BatchInventory` deducted from fromLocation
2. `BatchInventory` created/incremented at toLocation
3. Two `StockMovement` records created:
   - TRANSFER_OUT at fromLocation with `referenceId` = transfer.id
   - TRANSFER_IN at toLocation with `referenceId` = transfer.id

---

## Lifecycle 6: Stock Adjustment

Manual corrections for cycle counts, damage, or expiry disposal.

```
POST /api/stock-adjustments
{
  "productId": "amoxicillin-500mg",
  "batchId": "batch-001",
  "locationId": "zone-a-shelf-1",
  "quantity": -2,
  "reason": "Damaged during handling"
}
```

`quantity` can be positive (found extra stock) or negative (lost/damaged).

**System side effects:**

1. `BatchInventory` adjusted
2. `StockMovement` created (type: ADJUSTMENT) with `referenceId` = stockAdjustment.id

---

## Lifecycle 7: Compounding (Laboratory)

### 7.1 Prerequisites

1. All raw material `Product`s registered (`productType: RAW_MATERIAL`)
2. All raw materials in stock (via procurement flow)
3. Output `Product` registered (`productType: FINISHED_GOOD`)

### 7.2 Create Formula

```
POST /api/formulas
{
  "code": "SUSP-AMOX-125",
  "name": "Amoxicillin Suspension 125mg/5ml",
  "productId": "susp-amox-125-product-id",
  "dosageForm": "Suspension",
  "totalYield": 100,
  "yieldUnitId": "milliliter-id",
  "instructions": "Mix amoxicillin powder with suspending agent...",
  "ingredients": [
    { "productId": "amoxicillin-powder-id", "quantity": 2.5, "unitOfMeasureId": "gram-id" },
    { "productId": "suspending-agent-id", "quantity": 95, "unitOfMeasureId": "milliliter-id" },
    { "productId": "purified-water-id", "quantity": 2.5, "unitOfMeasureId": "milliliter-id" }
  ]
}
```

### 7.3 Start Compounding

```
POST /api/compounding-batches
{
  "formulaId": "susp-amox-125-formula-id",
  "locationId": "lab-01-id",
  "quantity": 2,
  "expirationDate": "2026-02-12",
  "materials": [
    {
      "productId": "amoxicillin-powder-id",
      "batchId": "batch-002",
      "locationId": "zone-a-shelf-2",
      "quantityUsed": 5.0
    },
    {
      "productId": "suspending-agent-id",
      "batchId": "batch-003",
      "locationId": "zone-a-shelf-3",
      "quantityUsed": 190.0
    }
  ]
}
→ Status: PENDING
```

### 7.4 Compounding Status

```
PENDING ──► MIXING ──► QC_CHECK ──► COMPLETED
    │                          │
    └──► CANCELLED             └──► FAILED
```

- **PENDING**: Ingredients reserved, production not started
- **MIXING**: Currently being compounded in laboratory
- **QC_CHECK**: Production done, awaiting quality control
- **COMPLETED**: QC passed, product added to inventory
- **FAILED**: QC failed, raw materials lost
- **CANCELLED**: Cancelled before production started

### 7.5 System Side Effects on COMPLETED

1. `BatchInventory` deducted for all raw materials consumed
2. `StockMovement` created for each consumed material (type: COMPOUNDING_OUT)
3. New `Batch` created for the output product (`Formula.productId`)
4. `Batch.compoundingBatchId` linked back to the production record
5. `BatchInventory` created for the produced batch
6. `StockMovement` created for the produced output (type: COMPOUNDING_IN)

### 7.6 System Side Effects on FAILED

1. `BatchInventory` deducted for all raw materials consumed (materials are lost)
2. `StockMovement` created for each consumed material (type: COMPOUNDING_OUT)
3. No output batch created

---

## Stock Movement Audit Trail

`StockMovement` is an immutable log of every stock change. Every operation creates entries:

| Operation               | Movement Types Created                                   | referenceId Points To |
| ----------------------- | -------------------------------------------------------- | --------------------- |
| Inbound                 | INBOUND                                                  | InboundShipment.id    |
| Outbound (shipped)      | OUTBOUND                                                 | OutboundShipment.id   |
| Transfer (completed)    | TRANSFER_OUT + TRANSFER_IN                               | Transfer.id           |
| Stock Adjustment        | ADJUSTMENT                                               | StockAdjustment.id    |
| Compounding (completed) | COMPOUNDING_OUT per material + COMPOUNDING_IN for output | CompoundingBatch.id   |

---

## Alerts (Computed, Not Stored)

Alerts are computed dynamically from existing data.

### Low Stock Alert

Products where total stock is at or below `Product.minStock`.

```sql
SELECT p.name, SUM(bi.quantity) as totalStock, p.minStock
FROM BatchInventory bi
JOIN Product p ON bi.productId = p.id
WHERE bi.organizationId = ?
GROUP BY bi.productId, p.minStock, p.name
HAVING SUM(bi.quantity) <= p.minStock
```

### Expiring Batch Alert

Active batches with remaining stock expiring within 30 days.

```sql
SELECT b.batchNumber, p.name, b.expirationDate, SUM(bi.quantity) as remainingQty
FROM Batch b
JOIN BatchInventory bi ON bi.batchId = b.id
JOIN Product p ON b.productId = p.id
WHERE b.organizationId = ?
  AND b.isActive = true
  AND b.expirationDate BETWEEN now() AND now() + interval '30 days'
  AND bi.quantity > 0
GROUP BY b.id, b.batchNumber, p.name, b.expirationDate
```

### Overstock Alert

Products where total stock exceeds `Product.maxStock`.

```sql
SELECT p.name, SUM(bi.quantity) as totalStock, p.maxStock
FROM BatchInventory bi
JOIN Product p ON bi.productId = p.id
WHERE bi.organizationId = ?
  AND p.maxStock IS NOT NULL
GROUP BY bi.productId, p.maxStock, p.name
HAVING SUM(bi.quantity) > p.maxStock
```

---

## Common Stock Queries

### Product-level Stock List (No Batch Detail)

For UI dashboards — one row per product, aggregated across all batches.

```sql
SELECT
  p.id, p.code, p.name, p.productType,
  u.name as baseUnit,
  p.minStock, p.maxStock,
  SUM(bi.quantity) as totalStock
FROM Product p
LEFT JOIN BatchInventory bi ON bi.productId = p.id
LEFT JOIN UnitOfMeasure u ON p.baseUnitId = u.id
WHERE p.organizationId = ?
  AND p.isActive = true
GROUP BY p.id, p.code, p.name, p.productType, u.name, p.minStock, p.maxStock
HAVING SUM(bi.quantity) > 0
ORDER BY p.name
```

### Stock at a Specific Location

```sql
SELECT p.name, u.name as baseUnit, SUM(bi.quantity) as totalStock
FROM BatchInventory bi
JOIN Product p ON bi.productId = p.id
JOIN UnitOfMeasure u ON p.baseUnitId = u.id
WHERE bi.locationId = ? AND bi.organizationId = ?
GROUP BY p.id, p.name, u.name
ORDER BY p.name
```

### Batch Breakdown (For FIFO/Expiry Picking)

Used during outbound, transfer, and adjustment operations.

```sql
SELECT b.batchNumber, b.expirationDate, b.cost, wl.name as location, bi.quantity
FROM BatchInventory bi
JOIN Batch b ON bi.batchId = b.id
JOIN Product p ON bi.productId = p.id
JOIN WarehouseLocation wl ON bi.locationId = wl.id
WHERE bi.productId = ? AND bi.organizationId = ?
  AND b.isActive = true AND bi.quantity > 0
ORDER BY b.expirationDate ASC
```

### Total Stock of a Single Product

```sql
SELECT SUM(quantity) as totalStock
FROM BatchInventory
WHERE productId = ? AND organizationId = ?
```

### Raw Material Stock List

```sql
SELECT p.name, p.casNumber, p.grade, u.name as baseUnit,
       SUM(bi.quantity) as totalStock, p.minStock
FROM Product p
LEFT JOIN BatchInventory bi ON bi.productId = p.id
JOIN UnitOfMeasure u ON p.baseUnitId = u.id
WHERE p.organizationId = ?
  AND p.productType = 'RAW_MATERIAL'
  AND p.isActive = true
GROUP BY p.id, p.name, p.casNumber, p.grade, u.name, p.minStock
ORDER BY p.name
```

### Product Catalog (All Products, With or Without Stock)

```sql
SELECT p.id, p.code, p.name, p.productType, p.dosageForm, p.strength,
       p.isActive, p.createdAt,
       COALESCE(SUM(bi.quantity), 0) as totalStock
FROM Product p
LEFT JOIN BatchInventory bi ON bi.productId = p.id
WHERE p.organizationId = ?
GROUP BY p.id, p.code, p.name, p.productType, p.dosageForm, p.strength, p.isActive, p.createdAt
ORDER BY p.name
```

---

## Key Design Decisions

### 1. Product Type (FINISHED_GOOD vs RAW_MATERIAL)

Both types use the same `Product` table and the same procurement flow (PO → Inbound → Batch → BatchInventory). Raw materials have additional fields (`casNumber`, `grade`) for pharmaceutical identification. This eliminates duplicate tables.

### 2. BatchInventory as Single Source of Truth

Only `BatchInventory` stores stock quantities. Total stock is always derived via aggregation. This prevents data duplication and sync issues.

### 3. Compounding → Formula → Product Link

`Formula.productId` defines the output product. Workflow: create Product → create Formula → compound → produced Batch appears in same inventory as purchased goods.

### 4. StockMovement as Immutable Audit Trail

Every stock change creates `StockMovement` records. Provides regulatory compliance audit trail, analytics, and debugging capability.

### 5. Multi-tenant Constraints

All unique constraints scoped per `organizationId`. Two organizations can have products with the same code/name independently.

### 6. Status as Enums

All status fields use typed enums to prevent invalid data at database level.

### 7. Soft Delete (isActive)

`Product`, `Batch`, `WarehouseLocation`, `Supplier`, `Manufacturer`, `Formula`, `UnitOfMeasure` all have `isActive`. Setting to false preserves historical data while hiding from active queries.

---

## Multi-UOM Support

Each product has 4 UOM fields supporting different operations:

| UOM            | Use Case        | Example            |
| -------------- | --------------- | ------------------ |
| `baseUnit`     | Smallest unit   | tablet, ml, gram   |
| `stockingUnit` | How it's stored | box (10 tablets)   |
| `sellingUnit`  | How it's sold   | tablet, bottle     |
| `purchaseUnit` | How it's bought | carton (100 boxes) |

Conversions flow through `UnitOfMeasure` hierarchy:

```
1 carton → 10 boxes → 10 tablets per box → 100 tablets total
```
