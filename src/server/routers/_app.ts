import { router } from '../trpc'
import { projectsRouter } from './projects'
import { providersRouter } from './providers'
import { providerKeysRouter } from './providerKeys'
import { logsRouter } from './logs'
import { statsRouter } from './stats'

export const appRouter = router({
  projects: projectsRouter,
  providers: providersRouter,
  providerKeys: providerKeysRouter,
  logs: logsRouter,
  stats: statsRouter,
})

export type AppRouter = typeof appRouter
