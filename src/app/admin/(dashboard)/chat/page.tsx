'use client'

import { useEffect, useRef, useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useI18n } from '../../i18n/LanguageProvider'
import { QueryError } from '../../query-error'

export default function ChatPage() {
  const { t } = useI18n()
  const utils = trpc.useUtils()
  const {
    data: conversations,
    isLoading: loadingConversations,
    isError: conversationsError,
    refetch: refetchConversations,
  } = trpc.chat.listConversations.useQuery()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState('') // '' = Auto
  const [selectedModel, setSelectedModel] = useState('') // '' = provider default
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: providersList } = trpc.providers.list.useQuery()
  const availableProviders = providersList?.filter((p) => p.is_active && p.isConfigured) ?? []

  const { data: modelsData, isLoading: loadingModels } = trpc.providers.listModels.useQuery(
    { providerId: selectedProviderId },
    { enabled: !!selectedProviderId }
  )
  const models = modelsData?.models ?? []

  const {
    data: messages,
    isLoading: loadingMessages,
    isError: messagesError,
    refetch: refetchMessages,
  } = trpc.chat.getMessages.useQuery({ conversationId: selectedId! }, { enabled: !!selectedId })

  const createConversation = trpc.chat.createConversation.useMutation({
    onSuccess: ({ id }) => {
      setSelectedId(id)
      utils.chat.listConversations.invalidate()
    },
  })

  const deleteConversation = trpc.chat.deleteConversation.useMutation({
    onSuccess: (_, variables) => {
      if (selectedId === variables.id) setSelectedId(null)
      utils.chat.listConversations.invalidate()
    },
  })

  const send = trpc.chat.send.useMutation({
    onSuccess: () => {
      setPendingError(null)
      if (selectedId) utils.chat.getMessages.invalidate({ conversationId: selectedId })
      utils.chat.listConversations.invalidate()
    },
    onError: (err) => {
      setPendingError(err.message)
      if (selectedId) utils.chat.getMessages.invalidate({ conversationId: selectedId })
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, send.isPending])

  function handleSend() {
    const content = draft.trim()
    if (!content || !selectedId || send.isPending) return
    setDraft('')
    setPendingError(null)
    send.mutate({
      conversationId: selectedId,
      content,
      providerId: selectedProviderId || undefined,
      model: selectedModel || undefined,
    })
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      <aside className="flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="border-b border-surface-border p-3">
          <button
            type="button"
            onClick={() => createConversation.mutate()}
            disabled={createConversation.isPending}
            className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t.chat.newChat}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversationsError ? (
            <div className="p-1">
              <QueryError onRetry={refetchConversations} />
            </div>
          ) : loadingConversations ? (
            <p className="p-3 text-xs text-muted">{t.common.loading}</p>
          ) : !conversations || conversations.length === 0 ? (
            <p className="p-3 text-xs text-muted">{t.chat.empty}</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedId === c.id ? 'bg-accent-soft text-accent' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{c.title ?? t.chat.newChat}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(t.chat.confirmDelete)) deleteConversation.mutate({ id: c.id })
                      }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-xs text-danger"
                    >
                      {t.chat.deleteConversation}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="border-b border-surface-border px-5 py-4">
          <h1 className="text-lg font-bold">{t.chat.title}</h1>
          <p className="mt-0.5 text-xs text-muted">{t.chat.subtitle}</p>
        </div>

        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">{t.chat.emptyConversation}</div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {messagesError ? (
                <QueryError onRetry={refetchMessages} />
              ) : loadingMessages ? (
                <p className="text-sm text-muted">{t.common.loading}</p>
              ) : !messages || messages.length === 0 ? (
                <p className="text-sm text-muted">{t.chat.emptyConversation}</p>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} role={m.role} content={m.content} providerId={m.provider_id} model={m.model} />)
              )}
              {send.isPending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-surface-border bg-background/40 px-4 py-2 text-sm text-muted">
                    {t.chat.thinking}
                  </div>
                </div>
              )}
              {pendingError && !send.isPending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
                    {t.chat.errorPrefix} {pendingError}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border px-4 py-2">
              <label className="flex items-center gap-1.5 text-xs text-muted">
                {t.chat.providerLabel}
                <select
                  value={selectedProviderId}
                  onChange={(e) => {
                    setSelectedProviderId(e.target.value)
                    setSelectedModel('')
                  }}
                  className="rounded-lg border border-surface-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                >
                  <option value="">{t.chat.autoProvider}</option>
                  {availableProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {selectedProviderId && (
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  {t.chat.modelLabel}
                  {models.length > 0 ? (
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="max-w-[220px] rounded-lg border border-surface-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                    >
                      <option value="">{t.chat.modelDefault}</option>
                      {models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      placeholder={loadingModels ? t.common.loading : t.chat.modelFallbackPlaceholder}
                      className="w-48 rounded-lg border border-surface-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
                    />
                  )}
                </label>
              )}
            </div>

            <div className="flex items-end gap-3 p-4 pt-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={t.chat.inputPlaceholder}
                rows={2}
                className="flex-1 resize-none rounded-lg border border-surface-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={send.isPending || !draft.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t.chat.send}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function MessageBubble({
  role,
  content,
  providerId,
  model,
}: {
  role: 'user' | 'assistant'
  content: string
  providerId: string | null
  model: string | null
}) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[75%]">
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
            isUser ? 'bg-accent text-white' : 'border border-surface-border bg-background/40 text-foreground'
          }`}
        >
          {content}
        </div>
        {!isUser && providerId && (
          <div className="mt-1 px-1 text-[11px] text-muted">
            {providerId}
            {model ? ` · ${model}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
