import { router } from '../trpc'
import { projectsRouter } from './projects'
import { providersRouter } from './providers'
import { logsRouter } from './logs'
import { statsRouter } from './stats'

export const appRouter = router({
  projects: projectsRouter,
  providers: providersRouter,
  logs: logsRouter,
  stats: statsRouter,
})

export type AppRouter = typeof appRouter
