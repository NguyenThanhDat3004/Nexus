/** Where the public site sends people to sign in. Configured per environment, never hard-coded. */
export const PORTALS = {
  auth: {
    label: 'Nexus Ledger SSO',
    description: 'Centralized authentication portal',
    url: import.meta.env.VITE_AUTH_PORTAL_URL ?? 'http://localhost:5170',
  },
  customer: {
    label: 'Customer Portal',
    description: 'Clients and product sponsors',
    url: import.meta.env.VITE_CUSTOMER_PORTAL_URL ?? 'http://localhost:5175',
  },
  delivery: {
    label: 'Delivery Portal',
    description: 'BA, engineering, QA and DevOps',
    url: import.meta.env.VITE_DELIVERY_PORTAL_URL ?? 'http://localhost:5174',
  },
} as const
