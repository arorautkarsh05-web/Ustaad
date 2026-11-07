# Eurogrip Ustaad Network - Comprehensive Security Architecture & Measures

**Team Name:** Code Slayers  
**Author / Security Architect:** Utkarsh Arora  
**Document Class:** System Security & Compliance Specification

---

## 1. Overview & Threat Model

In high-volume loyalty and brand advocacy ecosystems, the primary threats stem from financial manipulation (sybil attacks, fake transaction generation), data harvesting (customer PII leaks), unauthorized access (IDOR, privilege escalation), and credential replay.

The Eurogrip Ustaad Network enforces defense-in-depth across the network, application, database, and presentation layers.

```
+-----------------------------------------------------------------------------------+
|                            DEFENSE-IN-DEPTH ARCHITECTURE                          |
+-----------------------------------------------------------------------------------+
|  Perimeter:   Helmet Headers, Strict CORS, IP/Mobile Rate Limiting (authLimiter)  |
|  Identity:    Cryptographic OTP Engine (Node.js crypto), SHA-256 Hashes, JWT      |
|  AuthZ:       Role-Based Access Control (RBAC), Regional Manager / Dealer Scoping |
|  Data:        Strict Allowlist Serialization, PII Masking, Private Storage        |
|  Storage:     IDOR-Protected File Serving with DB Ownership Validation            |
|  Ledger:      ACID Transactions, Row-Level Locks (FOR UPDATE), Idempotency Keys   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Cryptographic OTP Engine

### 2.1 Entropy & Non-Predictability
- **Vulnerability Eliminated:** Traditional systems use pseudo-random generators (`Math.random()`) which are predictable and vulnerable to seed reconstruction.
- **Implementation:** Eurogrip Ustaad Network uses Node.js `crypto.randomInt(100000, 1000000)` ensuring cryptographically strong pseudo-random number generation (CSPRNG) backed by operating system entropy (`/dev/urandom` / Windows CryptGenRandom).

### 2.2 SHA-256 Database Hash Protection
- OTPs are **never stored in plaintext** in the database.
- Every OTP is converted to a 64-character SHA-256 hash prior to persistence:
  $$\text{hash} = \text{SHA-256}(\text{OTP})$$
- Even in the event of a catastrophic database dump or backup leak, attackers cannot read active verification codes.

### 2.3 Timing Attack Protection
- Plaintext string comparisons (`a === b`) leak timing metadata through byte-by-byte early exits.
- Verification uses `crypto.timingSafeEqual(Buffer.from(hashedInput), Buffer.from(storedHash))` guaranteeing constant-time execution regardless of match length.

### 2.4 Brute-Force & Replay Defenses
- **Maximum 3 Attempts:** Failed attempts increment the database counter. On the 3rd failed attempt, the record is immediately invalidated (`is_used = 1`).
- **One-Time Consumption:** Upon successful verification, `is_used` is set to `1` in the same transaction. Replay of consumed OTPs fails immediately.
- **30-Second Resend Cooldown:** Rapid-fire OTP requests are rejected with HTTP 429 to prevent SMS flooding and provider cost exhaustion.

---

## 3. Fitment Passport Anti-Fraud & Credit Safeguards

### 3.1 Zero-Credit Initialization
- Creating a fitment issues **zero credits** to the mechanic.
- The record enters an initial state of `submitted` with `verification_level = 0`.
- Credits are only distributed **after** independent customer confirmation.

### 3.2 Anti-Fraud Self-Verification Prevention
- A common vulnerability in mechanic reward platforms is self-verification: mechanics entering their own mobile number as the customer's number.
- The controller compares `customer_mobile` against the mechanic's registered phone number:
  ```javascript
  if (customer_mobile === mechanic.mechanic_mobile) {
    return res.status(400).json({
      success: false,
      message: 'Mechanic mobile number cannot be used as customer mobile number.',
    });
  }
  ```

### 3.3 Atomic ACID Credit Ledger
- To prevent duplicate credit distribution caused by concurrent requests or network retries, fitment verification executes inside an atomic MySQL transaction:
  1. `SELECT ... FOR UPDATE` acquires an exclusive row-level lock on the fitment record.
  2. Verifies status is `submitted` (rejects if already confirmed).
  3. Updates status to `customer_confirmed`.
  4. Inserts into `credit_transactions` using the deterministic key `FITMENT-${fitment_id}`.
  5. The database table enforces a unique constraint:
     ```sql
     UNIQUE KEY unique_mechanic_activity (mechanic_id, activity_type, activity_reference)
     ```
  6. Atomic increment on `mechanic_profiles.total_credits`.
  7. Commit transaction. If any step fails, the entire transaction rolls back cleanly.

---

## 4. Customer Data Protection & Public Allowlists

Public QR verification links (`/passport/:passportId`) are accessible by consumers and tyre inspectors without requiring system login.

### 4.1 Strict Response Allowlist
Raw database rows are never returned to unauthenticated endpoints. The system applies an explicit allowlist:

| Field | Public Endpoint Status | Notes |
|---|---|---|
| `passport_id` | **Exposed** | Identification code |
| `tyre_brand` / `model` / `size` | **Exposed** | Technical verification |
| `axle_position` | **Exposed** | Front / Rear mounting spec |
| `installation_date` | **Exposed** | Warranty eligibility calculation |
| `shop_name` / `mechanic_name` | **Exposed** | Garage accountability |
| `verification_status` | **Exposed** | Tamper-proof guarantee |
| `customer_mobile` | **Masked** | Rendered as `******1234` |
| `verification_otp` | **Strictly Omitted** | Never sent to client |
| `dealer_invoice_ref` | **Strictly Omitted** | Private dealer document reference |
| `internal_notes` | **Strictly Omitted** | Internal technician annotations |
| `evidence_file_urls` | **Strictly Omitted** | Storage paths withheld |

---

## 5. Evidence Document Security & IDOR Elimination

Fitment evidence (tax invoices, warranty registration receipts, barcode images) contains sensitive commercial and customer information.

### 5.1 Insecure Direct Object Reference (IDOR) Mitigation
- Static file serving of evidence (`/uploads/evidence/*`) was eliminated.
- All evidence downloads route through the authenticated handler `serveEvidence`:
  ```javascript
  app.get('/uploads/evidence/:filename', authenticate, serveEvidence);
  ```
- Before returning any file, the system validates the relationship:
  1. Queries `fitment_evidence` linked to `fitment_records` and `mechanic_profiles`.
  2. **Mechanic:** Must be the exact owner of the fitment (`doc.mechanic_user_id === req.user.id`). Other mechanics receive `403 Forbidden`.
  3. **Regional Manager:** Allowed only if the mechanic's shop resides in the manager's assigned state (`doc.mechanic_state === req.user.assigned_region`).
  4. **Super Admin:** Full audit access.

---

## 6. Role-Based Access Control (RBAC) & Scope Enforcement

Five distinct roles are enforced at the backend middleware layer:
1. `mechanic`
2. `customer`
3. `dealer`
4. `regional_manager`
5. `super_admin`

### 6.1 Registration Role Escalation Prevention
During public self-registration via OTP, client-provided roles are checked against an allowlist:
```javascript
const allowedPublicRoles = ['mechanic', 'customer'];
const safeRole = allowedPublicRoles.includes(requestedRole) ? requestedRole : 'mechanic';
```
Any malicious payload attempting to submit `role: "super_admin"` or `role: "regional_manager"` is automatically sanitized to `'mechanic'`.

### 6.2 Regional Manager Scope Enforcement
Regional managers are restricted to their assigned geographic territory (e.g., `'Maharashtra'`, `'Tamil Nadu'`). Every administrative query (`getMechanics`, `getFitments`, `getDashboardOverview`) enforces:
```sql
WHERE mp.state = ? [req.user.assigned_region]
```
This guarantees that regional personnel cannot inspect performance metrics or mechanic records outside their authorized territory.

---

## 7. ToolBank Concurrency & State Machine

### 7.1 Race-Condition-Proof Reservations
When multiple mechanics attempt to reserve the last available piece of equipment (e.g., dynamic wheel balancer), simple read-then-write logic causes negative inventory.
Ustaad Network solves this with row-level locks and atomic conditions:
```sql
SELECT * FROM toolbank_items WHERE id = ? AND status = "active" FOR UPDATE;
UPDATE toolbank_items SET available_quantity = available_quantity - 1 WHERE id = ? AND available_quantity > 0;
```

### 7.2 Strict State Machine Validation
Reservation transitions are enforced server-side:
$$\text{pending} \longrightarrow \text{approved} \longrightarrow \text{collected} \longrightarrow \text{returned}$$
Terminal states (`returned`, `cancelled`, `rejected`) reject any further status updates, preventing inventory duplication.

