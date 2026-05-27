import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
