# Phase 01: Business Analysis — Stakeholders & Personas

## 1. Stakeholder Matrix

| Stakeholder Category | Primary Interest / Goal | Key Pain Point Solved |
| :--- | :--- | :--- |
| **Customer / Client Sponsor** | Ensuring requirements are implemented as confirmed | Requirement drift, lost confirmation history |
| **Business Analyst (BA)** | Capturing clear requirements & customer confirmations | Scattered discussions across email/chat |
| **Engineering (FE / BE)** | Clear implementation rationale & requirement context | Unclear specifications, missing decision context |
| **QA / Testing Team** | Expected behavior alignment & acceptance criteria | Testing against outdated specs |
| **DevOps / SRE** | Deployment impact & operational context | Lack of visibility into operational decisions |
| **Project Manager (PM)** | Overall cross-team alignment & audit trail | Blind spots in multi-team communication |

---

## 2. Detailed Personas

### Persona 1: Customer Representative (Sarah - Product Sponsor)
- **Role:** VP of Product at US Client Organization.
- **Goals:** Quickly confirm requirement tweaks, review project updates, ensure budget/scope alignment.
- **Pain Points:** Hard to track where a verbal or Slack decision was confirmed; email threads get lost.

### Persona 2: Lead Business Analyst (Minh - Lead BA)
- **Role:** Senior BA at Vietnam ODC.
- **Goals:** Turn customer discussions into validated specifications, link discussions to Jira stories.
- **Pain Points:** Developers ask "Why are we doing this?" weeks after a meeting; missing proof of client confirmation.

### Persona 3: Senior Backend Developer (An - Senior BE Engineer)
- **Role:** Backend Developer at Vietnam ODC.
- **Goals:** Implement feature logic accurately without guessing business intent.
- **Pain Points:** Jira tickets lack the background context or conversation history behind a complex business rule.

### Persona 4: QA Lead (Trang - Senior QA Engineer)
- **Role:** QA Engineer.
- **Goals:** Write precise test scenarios matching the actual confirmed requirements.
- **Pain Points:** Customer changed requirement in a private chat; QA tested against old specification.
