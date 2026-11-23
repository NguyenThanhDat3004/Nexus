import { UserRole } from '../types'

export const PORTAL_ROUTES: Record<UserRole, string> = {
  CUSTOMER: import.meta.env.VITE_CUSTOMER_PORTAL_URL ?? 'http://localhost:5175',
  DEVELOPER: import.meta.env.VITE_DELIVERY_PORTAL_URL ?? 'http://localhost:5174/delivery/workspace',
  BA: import.meta.env.VITE_DELIVERY_PORTAL_URL ?? 'http://localhost:5174/delivery/workspace',
  QA: import.meta.env.VITE_DELIVERY_PORTAL_URL ?? 'http://localhost:5174/delivery/workspace',
  ADMIN: import.meta.env.VITE_ADMIN_PORTAL_URL ?? 'http://localhost:5176/admin',
}

export function useRoleRouter() {
  const routeByRole = (role: UserRole): string => {
    return PORTAL_ROUTES[role] ?? PORTAL_ROUTES.DEVELOPER
  }

  const navigateToPortal = (role: UserRole) => {
    const targetUrl = routeByRole(role)
    if (targetUrl.startsWith('http')) {
      window.location.href = targetUrl
    } else {
      window.location.pathname = targetUrl
    }
  }

  return { routeByRole, navigateToPortal }
}
