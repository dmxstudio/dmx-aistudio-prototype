import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '../lib/workspace'
import {
  Mail,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Send,
  MailCheck,
  Check,
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useTheme } from '../lib/theme'
import { useAuth } from '../lib/auth'

// Demo account (frontend mock — no real auth). These credentials sign you straight in.
const DEMO = { email: 'dahir@designo.mx', password: 'qwerty' }

type Mode = 'signin' | 'recover' | 'sent'

const inputCls =
  'w-full h-11 rounded-xl bg-raised border border-line pl-10 pr-3 text-sm text-content placeholder:text-faint outline-none focus:border-accent transition-colors'
const socialBtn =
  'w-full h-11 rounded-xl border border-line bg-surface text-content text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-raised transition-colors'

export function Login() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const { signIn } = useAuth()
  const { to } = useWorkspace()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es'

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState(DEMO.email)
  const [password, setPassword] = useState(DEMO.password)
  const [showPw, setShowPw] = useState(false)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const goSignin = () => {
    setMode('signin')
    setError('')
  }

  const signin = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      if (email.trim().toLowerCase() === DEMO.email && password === DEMO.password) {
        signIn(email)
        navigate(to('overview', 'global'))
      } else {
        setError(t('login.invalidCreds'))
        setLoading(false)
      }
    }, 700)
  }

  const sendRecover = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setMode('sent')
    }, 800)
  }

  const bullets = [t('login.brandBullet1'), t('login.brandBullet2'), t('login.brandBullet3')]

  return (
    <div className="relative h-full grid lg:grid-cols-2 bg-canvas">
      {/* Corner controls: language + theme (the sidebar isn't available here) */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-full bg-raised border border-line p-0.5">
          {(['es', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => i18n.changeLanguage(l)}
              className={`h-7 px-2.5 rounded-full text-xs font-medium transition-colors ${
                lang === l ? 'bg-accent text-accent-ink' : 'text-muted hover:text-content'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-9 h-9 rounded-full bg-raised border border-line grid place-items-center text-muted hover:text-content transition-colors"
        >
          {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>

      {/* Left: brand panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between bg-sidebar text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-accent text-accent-ink grid place-items-center">
            <Sparkles size={18} />
          </div>
          <span className="font-display text-xl font-bold">{t('app.name')}</span>
        </div>

        <div className="relative max-w-xl">
          <h2 className="font-display text-[34px] font-bold leading-[1.15] text-left text-pretty">{t('login.brandTagline')}</h2>
          <ul className="mt-8 space-y-4">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="w-5 h-5 mt-0.5 rounded-full bg-white/15 grid place-items-center shrink-0">
                  <Check size={12} className="text-white" />
                </span>
                <span className="text-[15px] text-white/85 leading-snug">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[13px] text-white/40">{t('login.brandFooter')}</p>
      </div>

      {/* Right: auth form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Logo (mobile, since the brand panel is hidden) */}
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-accent text-accent-ink grid place-items-center">
              <Sparkles size={18} />
            </div>
            <span className="font-display text-xl font-bold text-content">{t('app.name')}</span>
          </div>

          {mode === 'sent' ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-success-soft text-success-strong grid place-items-center mx-auto mb-4">
                <MailCheck size={22} />
              </div>
              <h1 className="font-display text-2xl font-bold text-content">{t('login.recoverSentTitle')}</h1>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                {t('login.recoverSentBody', { email: recoverEmail })}
              </p>
              <Button variant="secondary" className="w-full mt-6" onClick={goSignin}>
                {t('login.backToSignin')}
              </Button>
            </div>
          ) : mode === 'recover' ? (
            <>
              <button
                onClick={goSignin}
                className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-content mb-5 transition-colors"
              >
                <ArrowLeft size={14} />
                {t('login.backToSignin')}
              </button>
              <h1 className="font-display text-2xl font-bold text-content">{t('login.recoverTitle')}</h1>
              <p className="text-sm text-muted mt-1 mb-6 leading-relaxed">{t('login.recoverSubtitle')}</p>

              <form onSubmit={sendRecover} className="space-y-4">
                <div>
                  <label className="block text-[13px] text-muted mb-1.5">{t('login.email')}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      placeholder={t('login.emailPlaceholder')}
                      className={inputCls}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading || !recoverEmail.trim()}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  {loading ? t('login.recoverSending') : t('login.recoverSend')}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-content">{t('login.title')}</h1>
              <p className="text-sm text-muted mt-1 mb-6">{t('login.subtitle')}</p>

              <form onSubmit={signin} className="space-y-4">
                <div>
                  <label className="block text-[13px] text-muted mb-1.5">{t('login.email')}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('login.emailPlaceholder')}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[13px] text-muted">{t('login.password')}</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('recover')
                        setError('')
                      }}
                      className="text-[13px] text-accent-strong hover:underline"
                    >
                      {t('login.forgot')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? t('login.hidePassword') : t('login.showPassword')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="flex items-center gap-1.5 text-[13px] text-danger-strong">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </p>
                )}

                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? t('login.signingIn') : t('login.signin')}
                </Button>
              </form>

              <p className="text-[12px] text-faint text-center mt-3">{t('login.demoHint')}</p>

              <div className="flex items-center gap-3 my-5">
                <span className="flex-1 h-px bg-line" />
                <span className="text-xs text-faint">{t('login.or')}</span>
                <span className="flex-1 h-px bg-line" />
              </div>

              <div className="space-y-2.5">
                <button type="button" className={socialBtn}>
                  <span className="font-display font-bold text-[15px] text-accent-strong">G</span>
                  {t('login.google')}
                </button>
                <button type="button" className={socialBtn}>
                  <span className="font-display font-bold text-[15px] text-accent-strong">f</span>
                  {t('login.facebook')}
                </button>
              </div>
              <p className="text-[12px] text-faint text-center mt-3">{t('login.socialNote')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
