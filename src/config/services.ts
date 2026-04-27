/**
 * Central service URL config.
 * To change a port for the whole app, edit the fallback value here
 * OR set the corresponding VITE_* variable in .env.
 */
const SERVICES = {
  identity:       import.meta.env.VITE_IDENTITY_URL        ?? 'http://localhost:9000',
  backOffice:     import.meta.env.VITE_BACK_OFFICE_URL     ?? 'http://localhost:9100',
  productStorage: import.meta.env.VITE_PRODUCT_STORAGE_URL ?? 'http://localhost:9200',
  ecommerce:      import.meta.env.VITE_ECOMMERCE_URL       ?? 'http://localhost:9300',
} as const

export default SERVICES
