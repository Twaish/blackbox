import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from './components/ui/tooltip'
import { ModalProvider } from './components/modal/ModalProvider'
import { queryClient } from './core/queryClient'
import VaultPage from './pages/VaultPage'
import BaseLayout from './layouts/BaseLayout'

export default function App() {
  return (
    <BaseLayout>
      <VaultPage />
    </BaseLayout>
  )
}

document.addEventListener('DOMContentLoaded', () => {
  const root = createRoot(document.getElementById('app')!)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ModalProvider />
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
