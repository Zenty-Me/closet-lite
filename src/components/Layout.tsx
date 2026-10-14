import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { UpdatePrompt } from './UpdatePrompt'

export function Layout() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
      <UpdatePrompt />
    </div>
  )
}
