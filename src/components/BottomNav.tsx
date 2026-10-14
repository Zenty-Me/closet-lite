import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'

const tabDefs = [
  {
    to: '/',
    labelKey: 'nav.wardrobe',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 6h16v14H4z" strokeLinejoin="round" />
        <path d="M12 6V4M9 10v6M15 10v6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/outfits',
    labelKey: 'nav.outfits',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="9" cy="9" r="3.5" />
        <circle cx="15" cy="15" r="3.5" />
      </svg>
    ),
  },
  {
    to: '/inspire',
    labelKey: 'nav.inspire',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3l-1.4-1.4M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" strokeLinecap="round" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    to: '/calendar',
    labelKey: 'nav.calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/me',
    labelKey: 'nav.me',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const { t } = useI18n()
  return (
    <nav className="bottom-nav" aria-label={t('nav.aria')}>
      {tabDefs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          {tab.icon}
          {t(tab.labelKey)}
        </NavLink>
      ))}
    </nav>
  )
}
