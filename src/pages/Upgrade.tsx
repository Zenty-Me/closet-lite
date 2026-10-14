import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSettings, saveSettings } from '../utils/settings'
import { useI18n } from '../i18n/I18nProvider'
import { Toast } from '../components/Toast'

/**
 * Stripe Checkout is intentionally stubbed.
 * zenty must supply Stripe secret / publishable keys + Price IDs before real billing.
 */
export function Upgrade() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [isPro, setIsPro] = useState(() => Boolean(loadSettings().isPro))
  const [toast, setToast] = useState('')

  const stubCheckout = (plan: string) => {
    setToast(`${t('upgrade.stripeTodo')} (${plan})`)
  }

  const toggleLocalPro = () => {
    const cur = loadSettings()
    const next = { ...cur, isPro: !cur.isPro }
    saveSettings(next)
    setIsPro(next.isPro)
    setToast(next.isPro ? t('upgrade.enabledLocal') : t('upgrade.disableLocal'))
  }

  return (
    <div>
      <button type="button" className="btn-text" style={{ marginBottom: 8 }} onClick={() => navigate(-1)}>
        ← {t('upgrade.back')}
      </button>
      <h1 className="page-title">{t('upgrade.title')}</h1>
      <p className="page-sub">{t('upgrade.sub')}</p>

      <section className="insight-section plan-card">
        <h3 className="insight-title">{t('upgrade.features')}</h3>
        <ul className="plan-feature-list">
          <li>{t('upgrade.f1')}</li>
          <li>{t('upgrade.f2')}</li>
          <li>{t('upgrade.f3')}</li>
          <li>
            {t('upgrade.f4')}
            <span className="coming-soon-badge">{t('upgrade.syncSoon')}</span>
          </li>
        </ul>
      </section>

      <div className="plan-price-stack">
        <button type="button" className="btn btn-primary btn-block" onClick={() => stubCheckout('yearly-$39')}>
          {t('upgrade.yearly')} · {t('upgrade.checkoutStub')}
        </button>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => stubCheckout('monthly-$4.99')}>
          {t('upgrade.monthly')} · {t('upgrade.checkoutStub')}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => stubCheckout('credit-pack-50')}>
          {t('upgrade.credit')}
        </button>
        <p className="insight-hint">{t('upgrade.creditHint')}</p>
      </div>

      <div className="help-box" style={{ marginTop: 16 }}>
        <h4>Stripe TODO (zenty)</h4>
        <p>{t('upgrade.stripeTodo')}</p>
        <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.75rem' }}>
          Needed: STRIPE_SECRET_KEY, VITE_STRIPE_PUBLISHABLE_KEY, price IDs for yearly / monthly /
          credit pack. Do not commit secrets.
        </p>
      </div>

      <section className="insight-section" style={{ marginTop: 16 }}>
        <h3 className="insight-title">{t('profile.testPro')}</h3>
        <p className="insight-hint">{t('profile.testProHint')}</p>
        <button type="button" className="btn btn-secondary btn-block" onClick={toggleLocalPro}>
          {isPro ? t('upgrade.disableLocal') : t('upgrade.enableLocal')}
        </button>
        <p className="insight-hint" style={{ marginTop: 8 }}>
          {isPro ? t('profile.planPro') : t('profile.planFree')}
        </p>
      </section>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
