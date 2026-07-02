'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'

export default function ProjectsPage() {
  const utils = trpc.useUtils()
  const { data: projects, isLoading } = trpc.projects.list.useQuery()

  const [name, setName] = useState('')
  const [dailyQuota, setDailyQuota] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  const create = trpc.projects.create.useMutation({
    onSuccess: (result) => {
      setCreatedKey(result.apiKey)
      setName('')
      setDailyQuota('')
      utils.projects.list.invalidate()
    },
  })

  const setActive = trpc.projects.setActive.useMutation({
    onSuccess: () => utils.projects.list.invalidate(),
  })

  const updateQuota = trpc.projects.updateQuota.useMutation({
    onSuccess: () => utils.projects.list.invalidate(),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Projects</h1>

      {createdKey && (
        <div className="rounded border border-amber-500/40 bg-amber-500/10 p-4 text-sm space-y-2">
          <p className="font-medium">Save this API key — it will not be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="rounded bg-black/10 dark:bg-white/10 px-2 py-1 break-all">{createdKey}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(createdKey)}
              className="shrink-0 rounded border border-black/20 dark:border-white/20 px-2 py-1 text-xs"
            >
              Copy
            </button>
          </div>
          <button type="button" onClick={() => setCreatedKey(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate({
            name,
            dailyQuota: dailyQuota ? Number(dailyQuota) : null,
          })
        }}
        className="flex flex-wrap items-end gap-3 rounded border border-black/10 dark:border-white/10 p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Daily quota (optional)
          <input
            type="number"
            min={1}
            value={dailyQuota}
            onChange={(e) => setDailyQuota(e.target.value)}
            className="rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-1"
          />
        </label>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {create.isPending ? 'Creating…' : 'Create project'}
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-black/60 dark:text-white/60">Loading…</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-left">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Daily quota</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {projects?.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onToggleActive={() =>
                  setActive.mutate({ id: project.id, isActive: !project.is_active })
                }
                onSaveQuota={(quota) =>
                  updateQuota.mutate({ id: project.id, dailyQuota: quota, monthlyQuota: project.monthly_quota })
                }
              />
            ))}
            {projects?.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-black/60 dark:text-white/60">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ProjectRow({
  project,
  onToggleActive,
  onSaveQuota,
}: {
  project: {
    id: string
    name: string
    is_active: boolean
    daily_quota: number | null
    created_at: Date
  }
  onToggleActive: () => void
  onSaveQuota: (quota: number | null) => void
}) {
  const [quota, setQuota] = useState(project.daily_quota?.toString() ?? '')

  return (
    <tr className="border-b border-black/5 dark:border-white/5">
      <td className="py-2 pr-4">{project.name}</td>
      <td className="py-2 pr-4">
        <button
          type="button"
          onClick={onToggleActive}
          className={`rounded px-2 py-0.5 text-xs ${
            project.is_active
              ? 'bg-green-500/15 text-green-600 dark:text-green-400'
              : 'bg-red-500/15 text-red-600 dark:text-red-400'
          }`}
        >
          {project.is_active ? 'active' : 'disabled'}
        </button>
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="unlimited"
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            className="w-24 rounded border border-black/20 dark:border-white/20 bg-transparent px-2 py-0.5"
          />
          <button
            type="button"
            onClick={() => onSaveQuota(quota ? Number(quota) : null)}
            className="text-xs underline"
          >
            Save
          </button>
        </div>
      </td>
      <td className="py-2 pr-4 text-black/60 dark:text-white/60">
        {new Date(project.created_at).toLocaleDateString()}
      </td>
      <td className="py-2 pr-4" />
    </tr>
  )
}
