/** Where the public site sends people to sign in. Configured per environment, never hard-coded. */
export const PORTALS = {
  customer: {
    label: 'Customer Portal',
    description: 'Clients and product sponsors',
    url: import.meta.env.VITE_CUSTOMER_PORTAL_URL ?? '#',
  },
  delivery: {
    label: 'Delivery Portal',
    description: 'BA, engineering, QA and DevOps',
    url: import.meta.env.VITE_DELIVERY_PORTAL_URL ?? '#',
  },
} as const
