import Link from 'next/link'
import { logout } from '../actions'
import { TrpcProvider } from '../trpc-provider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10 px-6 py-3 flex items-center justify-between">
          <nav className="flex gap-4 text-sm">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/projects">Projects</Link>
            <Link href="/admin/providers">Providers</Link>
            <Link href="/admin/logs">Logs</Link>
          </nav>
          <form action={logout}>
            <button type="submit" className="text-sm text-black/60 dark:text-white/60 hover:underline">
              Log out
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </TrpcProvider>
  )
}
