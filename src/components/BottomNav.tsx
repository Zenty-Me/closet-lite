import { NavLink } from 'react-router-dom'

const tabs = [
  {
    to: '/',
    label: '衣橱',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16v14H4z" strokeLinejoin="round" />
        <path d="M12 6V4M9 10v6M15 10v6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/outfits',
    label: '搭配',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="9" r="3.5" />
        <circle cx="15" cy="15" r="3.5" />
      </svg>
    ),
  },
  {
    to: '/calendar',
    label: '日历',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/me',
    label: '我的',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          {t.icon}
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
