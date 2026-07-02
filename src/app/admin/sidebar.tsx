'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { DashboardIcon, ProjectsIcon, ProvidersIcon, LogsIcon, LogoutIcon } from './icons'
import { useI18n } from './i18n/LanguageProvider'
import { LanguageSwitcher } from './i18n/LanguageSwitcher'
import type { Dict } from './i18n/dictionaries'

function navItems(t: Dict) {
  return [
    { href: '/admin', label: t.sidebar.navDashboard, Icon: DashboardIcon },
    { href: '/admin/projects', label: t.sidebar.navProjects, Icon: ProjectsIcon },
    { href: '/admin/providers', label: t.sidebar.navProviders, Icon: ProvidersIcon },
    { href: '/admin/logs', label: t.sidebar.navLogs, Icon: LogsIcon },
  ]
}

export function Sidebar({ logoutAction }: { logoutAction: () => void }) {
  const pathname = usePathname()
  const { t, lang, setLang } = useI18n()

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-surface-border bg-surface">
      <div className="flex items-start justify-between gap-2 px-5 py-6">
        <div>
          <h1 className="text-xl font-bold">AI Gateway</h1>
          <p className="mt-0.5 text-xs text-muted">{t.sidebar.subtitle}</p>
        </div>
        <LanguageSwitcher lang={lang} onChange={setLang} />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide text-muted">{t.sidebar.sectionMain}</p>
        {navItems(t).map(({ href, label, Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? 'bg-accent-soft text-accent' : 'text-muted hover:text-foreground'
              }`}
            >
              <Icon className="shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 px-3 pb-5">
        <SystemStatusCard />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            <LogoutIcon className="shrink-0" />
            {t.sidebar.logout}
          </button>
        </form>
      </div>
    </aside>
  )
}

function SystemStatusCard() {
  const { t } = useI18n()
  const { data } = trpc.stats.summary.useQuery()

  if (!data) {
    return (
      <div className="rounded-xl border border-surface-border bg-background/40 p-3 text-xs text-muted">
        {t.sidebar.statusLoading}
      </div>
    )
  }

  const activeProviders = data.providerHealth.filter((p) => p.is_active)
  const down = activeProviders.filter((p) => p.status === 'down').length
  const degraded = activeProviders.filter((p) => p.status === 'degraded').length

  const { dotClass, label } =
    down > 0
      ? { dotClass: 'bg-danger', label: t.sidebar.providersDown(down) }
      : degraded > 0
        ? { dotClass: 'bg-warning', label: t.sidebar.providersDegraded(degraded) }
        : { dotClass: 'bg-success', label: t.sidebar.allOperational }

  const cacheHitPct = Math.round(data.cacheHitRate * 100)

  return (
    <div className="space-y-3 rounded-xl border border-surface-border bg-background/40 p-3">
      <div className="flex items-center gap-2 text-xs">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className="text-foreground">{label}</span>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>{t.sidebar.cacheHitRateToday}</span>
          <span>{cacheHitPct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-border">
          <div className="h-full rounded-full bg-accent" style={{ width: `${cacheHitPct}%` }} />
        </div>
      </div>
    </div>
  )
}
