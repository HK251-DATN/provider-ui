import { ConfigProvider } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import viVN from 'antd/locale/vi_VN'
import theme from '@/theme'
import AppRouter from '@/routes'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme} locale={viVN}>
        <AppRouter />
      </ConfigProvider>
    </QueryClientProvider>
  )
}
