import { logout } from '../actions'
import { Sidebar } from '../sidebar'
import { TrpcProvider } from '../trpc-provider'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { getServerLang } from '../i18n/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const lang = await getServerLang()

  return (
    <TrpcProvider>
      <LanguageProvider initialLang={lang}>
        <div className="admin-theme flex min-h-screen bg-background text-foreground">
          <Sidebar logoutAction={logout} />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </LanguageProvider>
    </TrpcProvider>
  )
}
