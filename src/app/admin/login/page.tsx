import { login } from '../actions'
import { getServerLang } from '../i18n/server'
import { dictionaries } from '../i18n/dictionaries'
import { LoginLanguageSwitcher } from './login-language-switcher'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const lang = await getServerLang()
  const t = dictionaries[lang]

  return (
    <main className="admin-theme relative flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="absolute right-4 top-4">
        <LoginLanguageSwitcher lang={lang} />
      </div>

      <form
        action={login}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-surface-border bg-surface p-8"
      >
        <div>
          <h1 className="text-xl font-bold">AI Gateway</h1>
          <p className="mt-1 text-sm text-muted">{t.login.subtitle}</p>
        </div>

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {t.login.invalidPassword}
          </p>
        )}

        <input
          type="password"
          name="password"
          placeholder={t.login.passwordPlaceholder}
          required
          autoFocus
          className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t.login.submit}
        </button>
      </form>
    </main>
  )
}
