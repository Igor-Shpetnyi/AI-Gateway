import { login } from '../actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg border border-black/10 dark:border-white/10 p-6"
      >
        <h1 className="text-lg font-semibold">AI Gateway Admin</h1>
        {error && <p className="text-sm text-red-500">Invalid password</p>}
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoFocus
          className="w-full rounded border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/40"
        />
        <button
          type="submit"
          className="w-full rounded bg-foreground text-background py-2 text-sm font-medium"
        >
          Log in
        </button>
      </form>
    </main>
  )
}
