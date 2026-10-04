# Phase 05: Security — Threat Model & Authorization Pipeline

## 1. Security Philosophy: Authorization Before Retrieval

```text
[ Incoming Request ]
          │
          ▼
[ 1. Authentication (OIDC / OAuth2 Token Validation) ]
          │
          ▼
[ 2. Resource-Level Authorization (Tenant / Project / Channel Scope Check) ]
          │
    ┌─────┴─────┐
    │ Authorized?│
    └─────┬─────┘
       YES│         │ NO
          │         └─► [ 403 Forbidden Response ]
          ▼
[ 3. Data Retrieval / Database Query / Search Pipeline ]
          │
          ▼
[ 4. Response Delivery / Audit Log Generation ]
```

---

## 2. STRIDE Threat Model Summary

| Threat Category | Potential Risk in Nexus | Mitigation Strategy |
| :--- | :--- | :--- |
| **Spoofing** | Impersonation of Customer/BA identity | OAuth2/OIDC, JWT signatures, MFA enforcement |
| **Tampering** | Altering confirmed customer decisions | Immutable audit logs, message revision history |
| **Repudiation** | Denying customer confirmation of requirement | Cryptographic signature of approval actions |
| **Information Disclosure**| Tenant A seeing Tenant B project data / Search leakage | Authorization-first query filters, tenant isolation |
| **Denial of Service** | WebSocket abuse or search flood | Redis rate-limiting, connection quotas |
| **Elevation of Privilege**| Standard user gaining Admin or Break-glass access | Resource ABAC policies, mandatory break-glass approval |
