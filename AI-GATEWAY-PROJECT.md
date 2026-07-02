# AI Gateway — мультитенантний адаптер до безкоштовних AI-моделей

## 1. Концепція проєкту

Це **власний AI Gateway** — проміжний сервіс між особистими пет-проєктами користувача та зовнішніми безкоштовними LLM-провайдерами (Groq, Google Gemini, OpenRouter та інші).

**Головна проблема, яку вирішує проєкт:**
- Кожен безкоштовний AI-провайдер має власні rate limits, які легко вичерпати
- Немає єдиної точки контролю: які пет-проєкти скільки й що використовують
- Немає fallback-механізму: якщо один провайдер впав/вичерпав ліміт — все ламається
- Немає видимості: скільки запитів, яка вартість (умовна), які помилки

**Рішення:** єдиний Gateway API (OpenAI-сумісний), до якого підключаються всі пет-проєкти користувача. Gateway сам вирішує, якого провайдера використати, кешує відповіді, логує все, і надає адмін-панель для повного контролю.

### Ключові принципи проєкту
1. **Мультитенантність** — кожен пет-проєкт має свій API-ключ, свою квоту, свою видимість у логах
2. **Відмовостійкість** — fallback між провайдерами, circuit breaker, ніяких "тихих" падінь
3. **Прозорість** — все логується: хто, що, коли, скільки токенів, який провайдер відповів
4. **Простота розширення** — додати нового провайдера = один файл-адаптер
5. **Реалістична безкоштовність** — усвідомлено обрані інструменти без прихованих платних пасток

---

## 2. Загальна архітектура

```
Пет-проєкт 1 ─┐
Пет-проєкт 2 ─┼─→ Gateway API (/v1/*)  ──→  Router  ──→  Provider Pool
Пет-проєкт N ─┘         │                      │           (Groq / Gemini / OpenRouter)
                         │                      ↓
                    Admin Panel          Circuit Breaker
                    (/admin/*)                  │
                         │                      ↓
                         └──────────→   Cache Layer (спільний)
                                              │
                                              ↓
                                    Postgres (config, logs, cache, rate-limit стан)
```

Gateway і Admin Panel — **один бекенд, два шляхи доступу**:
- `/v1/*` — публічний API для пет-проєктів (авторизація через API-ключ)
- `/admin/*` — приватна адмін-панель (авторизація через сесію/пароль власника)

---

## 3. Технологічний стек

| Шар | Вибір | Обґрунтування |
|---|---|---|
| Мова/рантайм | **TypeScript + Node.js** | Типізація рятує при роботі з різними форматами відповідей провайдерів; один стек на бек і фронт |
| БД | **PostgreSQL** (керована, у складі хостингу) | Краще за SQLite для паралельних записів логів у постійно живому процесі |
| Фронтенд адмінки | **Next.js** | Той самий стек, що й бекенд; App Router + API routes в одному застосунку |
| Типобезпека API | **tRPC** (для admin API) | Спільні типи бек↔фронт без окремого OpenAPI-контракту |
| Публічний API | Власний Express/Fastify роут `/v1/chat/completions` | OpenAI-сумісна схема — нульова вартість інтеграції для клієнтів |

---

## 4. Провайдери (MVP)

| Провайдер | Реєстрація | Роль у пулі |
|---|---|---|
| **Groq** | Email, без картки | Пріоритет 1 — швидкість |
| **Google Gemini (AI Studio)** | Google-акаунт, без картки | Пріоритет 2 — найщедріший daily-ліміт |
| **OpenRouter** | Email/GitHub, без картки | Пріоритет 3 — резервний пул з десятків free-моделей |

**Фаза 2 (не MVP):** Cerebras, Ollama (локальний fallback, вимагає GPU-хосту).

---

## 5. Схема бази даних (DDL)

```sql
-- Пет-проєкти, які підключаються до Gateway
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key_hash TEXT UNIQUE NOT NULL,       -- sha256, сам ключ ніколи не зберігається
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  daily_quota INTEGER,                     -- NULL = без ліміту
  monthly_quota INTEGER,
  allowed_models JSONB,                    -- опційне обмеження доступних моделей
  allowed_ips JSONB                        -- опційний IP allowlist
);

-- Провайдери, керовані з адмінки
CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,         -- AES-256-GCM
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  requests_per_minute INTEGER,
  requests_per_day INTEGER,
  status TEXT DEFAULT 'healthy',           -- healthy | degraded | down
  circuit_breaker_until TIMESTAMPTZ        -- NULL = не заблокований
);

-- Кожен запит окремо (детальні логи, 30 днів ретенції)
CREATE TABLE request_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  provider_id TEXT REFERENCES providers(id),
  model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  latency_ms INTEGER,
  status TEXT,                             -- success | rate_limited | error | cached | fallback
  error_message TEXT,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Агреговані щоденні метрики (після чистки сирих логів)
CREATE TABLE daily_stats (
  date DATE,
  project_id TEXT,
  provider_id TEXT,
  model TEXT,
  total_requests INTEGER,
  cache_hits INTEGER,
  total_tokens INTEGER,
  avg_latency_ms INTEGER,
  error_count INTEGER,
  PRIMARY KEY (date, project_id, provider_id, model)
);

-- Кеш відповідей (спільний між проєктами)
CREATE TABLE response_cache (
  cache_key TEXT PRIMARY KEY,              -- hash(model + normalizedMessages + temperature)
  response TEXT,
  model TEXT,
  provider_id TEXT,
  expires_at TIMESTAMPTZ,
  hit_count INTEGER DEFAULT 0
);

-- Стан rate limiter (персистентний, бо процес може рестартувати)
CREATE TABLE rate_limit_state (
  provider_id TEXT,
  window_start TIMESTAMPTZ,
  request_count INTEGER,
  PRIMARY KEY (provider_id, window_start)
);
```

---

## 6. Ключові архітектурні рішення (з обґрунтуванням)

| # | Питання | Рішення | Чому |
|---|---|---|---|
| 1 | Формат API | OpenAI-сумісний `/v1/chat/completions` | Клієнти підключаються зміною `baseURL` в існуючому SDK |
| 2 | Вибір провайдера (`model: 'auto'`) | Статичний пріоритет + circuit breaker | Динамічний рейтинг за швидкістю — шумний при малому масштабі |
| 3 | Модель недоступна | Жорсткий фейл `409 MODEL_UNAVAILABLE` + `suggestedAlternatives` | Мовчазна підміна моделі — це прихована деградація якості |
| 4 | Кеш | Спільний між проєктами | Дані й так належать одному власнику, приросту приватності від ізоляції немає |
| 5 | Кількість БД | Одна Postgres | Передчасна оптимізація при розділенні на цьому масштабі |
| 6 | Ретенція логів | 30 днів сирих + агрегація в `daily_stats` | Баланс між дебагом і розміром БД |
| 7 | Провайдери MVP | Groq + Gemini + OpenRouter | Нульове тертя реєстрації, без картки |
| 8 | Нотифікації | Інтерфейс `AlertSink` закладено з першого дня, реалізація — `ConsoleAlertSink` у MVP | Точку виклику важче вплести пізніше, ніж закласти зараз |
| 9 | Версіонування API | `/v1/*` у шляху з першого дня | Нуль вартості зараз, рятує від рефакторингу пізніше |

---

## 7. Безпека

### Автентифікація пет-проєктів
- Ключ формату `gw_live_<32 hex chars>`, генерується криптостійко (`crypto.randomBytes`)
- У БД зберігається **тільки SHA-256 хеш**, сам ключ показується один раз при створенні
- Порівняння — **constant-time** (`crypto.timingSafeEqual`), захист від timing attack

### Rate limiting на рівні Gateway (окремо від лімітів провайдерів!)
- Sliding window per `project_id`, захищає пул від зловживання одним проєктом
- Кожен проєкт має свою стелю запитів/хв незалежно від лімітів самих LLM-провайдерів

### Шифрування ключів провайдерів
- AES-256-GCM, майстер-ключ шифрування — окрема env-змінна на сервері деплою
- Ключі OpenAI/Groq/Gemini ніколи не потрапляють до клієнта — Gateway єдина точка, що їх знає

### Захист адмін-панелі
- Окремий сильний пароль + HTTP-only Secure cookie для сесії (не localStorage — захист від XSS)
- Опційно: 2FA через TOTP (`otplib`)
- Рекомендовано: окремий субдомен `admin.domain.com` за Cloudflare Access / Zero Trust

### Мережевий рівень
- Cloudflare перед Gateway: безкоштовний WAF + rate-limiting на рівні мережі, до того як запит дійде до коду
- IP allowlist per project (опційно) — прив'язка ключа до конкретних IP/CIDR серверів пет-проєктів
- CORS закритий у нуль — усі виклики server-to-server, фронти пет-проєктів ходять через свій бекенд

### Логування підозрілої активності
- Лічильник невдалих спроб авторизації per IP → тимчасовий бан + алерт при перевищенні порогу

---

## 8. Деплой

### Обраний варіант: **Northflank Free tier**

**Чому:**
- Always-on контейнер без примусового сну (на відміну від Render Free)
- Не потребує переписування архітектури під stateless (на відміну від Vercel + serverless functions)
- Немає capacity-лотереї при провіжні ресурсів (на відміну від Oracle Cloud Free)
- 1 безкоштовна керована БД у тарифі — Postgres одразу, без самостійного управління файлом SQLite

**Ліміти free-тарифу:** 2 сервіси, 1 база даних, 2 cron-джоби, always-on compute. Потребує підтвердження кредитної картки (без реального білінгу в межах лімітів).

**Структура деплою:**
```
Northflank Service 1: Gateway API + Admin Panel (один Next.js застосунок)
Northflank Managed DB: PostgreSQL
Northflank Cron Job 1: health-check провайдерів (раз на N хвилин)
Northflank Cron Job 2: агрегація daily_stats + чистка старих логів (раз на добу)
```

**Альтернатива без кредитної картки (якщо це критичний пріоритет):** Render Free (гейтвей) + Turso (SQLite-сумісна БД, живе окремо від сну контейнера). Компроміс — холодний старт 30-50 сек після 15 хв простою контейнера.

### Змінні середовища на Northflank

Northflank Dashboard → сервіс Gateway → **Environment** → **Environment variables**. Кожну змінну додавай як **Secret** (не Plain) — Northflank шифрує їх at rest і маскує в логах/UI.

**`ENCRYPTION_KEY` (критично важлива):**

1. Згенерувати один раз локально:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Результат — рядок з 64 hex-символів (32 байти). `src/lib/crypto.ts` кине помилку при першій спробі зашифрувати/розшифрувати ключ провайдера, якщо довжина інша або змінна не задана.
2. Додати в Northflank як Secret env var з назвою `ENCRYPTION_KEY` (значення — той самий рядок, без лапок).
3. Зберегти копію значення в менеджері паролів **до** першого деплою.

Цей ключ шифрує (AES-256-GCM) кожен API-ключ провайдера, доданий через адмін-панель (таблиця `provider_api_keys`). Звідси три правила:
- Генеруй його **один раз**, до першого запуску проду. Не міняй на вже працюючому деплої без плану міграції.
- Якщо ключ загублено або перегенеровано — усі раніше збережені через панель API-ключі провайдерів стають нечитабельними назавжди; єдиний вихід — видалити їх і додати заново через панель.
- Це **не** те саме, що `ADMIN_PASSWORD`: втрата `ENCRYPTION_KEY` не блокує вхід у панель і не зачіпає провайдерів, налаштованих через env-змінні (`GROQ_API_KEY` тощо) — ламається лише розшифрування ключів, доданих саме через UI.

**Інші обов'язкові змінні:**
- `DATABASE_URL` — рядок підключення з Northflank Managed PostgreSQL addon
- `ADMIN_PASSWORD` — стійкий пароль для входу в адмін-панель
- `GROQ_API_KEY` / `GEMINI_API_KEY` / `OPENROUTER_API_KEY` — опційно, якщо провайдер налаштовується через env, а не через панель

---

## 9. Порядок розробки (фази)

1. **Фаза 0 — рішення закриті** ✅ (цей документ)
2. **Фаза 1 — Core Gateway.** Auth (API keys), router з одним провайдером, логування в Postgres. Працює локально.
3. **Фаза 2 — Provider Pool.** Додати ще 2 провайдери, circuit breaker, fallback-ланцюжок.
4. **Фаза 3 — Кеш.** Cache layer з TTL-стратегією за типом задачі.
5. **Фаза 4 — Admin Panel.** UI поверх готової БД/API: dashboard, projects CRUD, providers management, logs, analytics.
6. **Фаза 5 — Деплой.** Northflank + Cloudflare, шифрування ключів у проді.
7. **Фаза 6 — Підключення пет-проєктів.** Один за одним, з моніторингом навантаження й лімітів.

---

## 10. Приклад контракту `ProviderAdapter`

Кожен новий провайдер додається як один файл, що імплементує цей інтерфейс:

```typescript
interface ProviderAdapter {
  name: string;
  baseUrl: string;
  authHeader: (apiKey: string) => Record<string, string>;
  transformRequest: (messages: ChatMessage[], options: ChatOptions) => unknown;
  transformResponse: (raw: unknown) => ChatResponse;
  limits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    concurrentRequests: number;
  };
}
```

Реєстрація нового провайдера — один рядок у `providers/index.ts`, роутер підхоплює автоматично.

---

## 11. Типізовані помилки Gateway

```typescript
class GatewayError extends Error {
  constructor(
    public code:
      | 'UNAUTHORIZED'
      | 'QUOTA_EXCEEDED'
      | 'MODEL_UNAVAILABLE'
      | 'ALL_PROVIDERS_DOWN'
      | 'RATE_LIMITED',
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}
```

---

## 12. Що явно НЕ входить у MVP

- Динамічний рейтинг провайдерів за швидкістю (тільки статичний пріоритет)
- Автоматичне виявлення нових free-моделей в інтернеті (замість цього — легке ручне додавання через `ProviderAdapter`)
- Ізоляція кешу per-project
- Локальні моделі (Ollama) — окрема інфраструктурна історія, Фаза 2+
- Повноцінна система нотифікацій (тільки інтерфейс `AlertSink`, реалізація мінімальна)

---

## 13. Контекст для AI-агента розробки

Якщо ти — AI-агент, який продовжує розробку цього проєкту:

- Дотримуйся вже прийнятих рішень з розділу 6 — вони обговорені й зафіксовані свідомо, не пропонуй їх переглядати без явного запиту власника
- Увесь новий код для провайдерів має відповідати інтерфейсу `ProviderAdapter` (розділ 10)
- Кожен ендпоінт `/v1/*` повинен: перевірити auth → перевірити quota → перевірити cache → пройти router → залогувати результат
- Помилки завжди типізовані через `GatewayError`, ніколи не голі `throw new Error(...)`
- Секрети (ключі провайдерів) — тільки зашифровані в БД, ніколи в коді чи відкритому конфізі
- Стек фіксований: TypeScript, Node.js, Next.js, PostgreSQL — не пропонуй альтернативи без явного запиту
