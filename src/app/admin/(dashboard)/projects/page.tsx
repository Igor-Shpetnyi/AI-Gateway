'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Toggle } from '../../toggle'
import { useI18n } from '../../i18n/LanguageProvider'
import type { Dict } from '../../i18n/dictionaries'

export default function ProjectsPage() {
  const { t } = useI18n()
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
      <div>
        <h1 className="text-2xl font-bold">{t.projects.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.projects.subtitle}</p>
      </div>

      {createdKey && (
        <div className="space-y-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <p className="font-medium text-foreground">{t.projects.keyBanner}</p>
          <div className="flex items-center gap-2">
            <code className="break-all rounded-lg bg-background px-2 py-1 text-foreground">{createdKey}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(createdKey)}
              className="shrink-0 rounded-lg border border-surface-border px-2 py-1 text-xs text-foreground"
            >
              {t.common.copy}
            </button>
          </div>
          <button type="button" onClick={() => setCreatedKey(null)} className="text-xs text-muted underline">
            {t.common.dismiss}
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
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-surface-border bg-surface p-5"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs text-muted">{t.projects.nameLabel}</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-surface-border bg-background px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs text-muted">{t.projects.dailyQuotaLabel}</span>
          <input
            type="number"
            min={1}
            value={dailyQuota}
            onChange={(e) => setDailyQuota(e.target.value)}
            className="w-36 rounded-lg border border-surface-border bg-background px-3 py-1.5 outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {create.isPending ? t.projects.creating : t.projects.create}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        {isLoading ? (
          <p className="p-5 text-sm text-muted">{t.common.loading}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">{t.projects.colName}</th>
                <th className="px-5 py-3 font-medium">{t.projects.colStatus}</th>
                <th className="px-5 py-3 font-medium">{t.projects.colDailyQuota}</th>
                <th className="px-5 py-3 font-medium">{t.projects.colCreated}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {projects?.map((project) => (
                <ProjectRow
                  key={project.id}
                  t={t}
                  project={project}
                  onToggleActive={(isActive) => setActive.mutate({ id: project.id, isActive })}
                  onSaveQuota={(quota) =>
                    updateQuota.mutate({ id: project.id, dailyQuota: quota, monthlyQuota: project.monthly_quota })
                  }
                />
              ))}
              {projects?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-muted">
                    {t.projects.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ProjectRow({
  t,
  project,
  onToggleActive,
  onSaveQuota,
}: {
  t: Dict
  project: {
    id: string
    name: string
    is_active: boolean
    daily_quota: number | null
    created_at: Date
  }
  onToggleActive: (isActive: boolean) => void
  onSaveQuota: (quota: number | null) => void
}) {
  const [quota, setQuota] = useState(project.daily_quota?.toString() ?? '')

  return (
    <tr>
      <td className="px-5 py-3 font-medium">{project.name}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <Toggle checked={project.is_active} onChange={onToggleActive} />
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              project.is_active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
            }`}
          >
            {project.is_active ? t.common.active : t.common.disabled}
          </span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder={t.projects.unlimitedPlaceholder}
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            className="w-24 rounded-lg border border-surface-border bg-background px-2 py-1 outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => onSaveQuota(quota ? Number(quota) : null)}
            className="rounded-lg border border-surface-border px-2 py-1 text-xs text-muted hover:text-foreground"
          >
            {t.common.save}
          </button>
        </div>
      </td>
      <td className="px-5 py-3 text-muted">{new Date(project.created_at).toLocaleDateString()}</td>
      <td className="px-5 py-3" />
    </tr>
  )
}
