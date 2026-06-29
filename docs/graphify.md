# Telabotpower — Project Map (Graphify)

> แผนที่โปรเจกต์ Telabotpower ครอบคลุมทุก layer ตั้งแต่ UI จนถึง Database

---

## 1. ภาพรวมระบบ (System Overview)

```mermaid
graph TB
    classDef page fill:#1e3a5f,color:#7dd3fc,stroke:#3b82f6
    classDef api fill:#1a3a2a,color:#86efac,stroke:#22c55e
    classDef lib fill:#2d1b4e,color:#c4b5fd,stroke:#8b5cf6
    classDef ext fill:#3a1f00,color:#fb923c,stroke:#f97316
    classDef db fill:#1f1f3a,color:#a5b4fc,stroke:#6366f1

    subgraph UI["🖥️ Frontend (Next.js 16 + React 19)"]
        direction TB
        AUTH_PAGES["Auth Pages\n/login · /login/super"]:::page
        DASH_PAGES["Dashboard Pages\n/ · /tickets · /knowledge\n/assistant · /groups\n/users · /settings"]:::page
        COMPONENTS["50+ Components\nAppShell · KnowledgeManager\nAiAssistant · TicketsTable\nRichTextEditor · Charts"]:::page
    end

    subgraph API_LAYER["🔌 API Routes (App Router)"]
        AUTH_API["Auth API\n/api/auth/*\nPIN · Super · Logout · Session"]:::api
        DATA_API["Data API\n/api/tickets · /api/groups\n/api/users"]:::api
        WEBHOOK["Telegram Webhook\n/api/telegram/webhook\n(public, secret-token auth)"]:::api
        SUM_WEBHOOK["Summary Bot Webhook\n/api/telegram/summary-webhook\n(admin group only)"]:::api
    end

    subgraph SERVER["⚙️ Server Logic (lib/)"]
        ACTIONS["Server Actions\nassistant · knowledge\ningest · feedback · settings\ntelegram"]:::lib
        SERVICES["Services\ntickets · knowledge\nusers · groups · stats"]:::lib
        CORE["Core Utilities\nauth (JWT) · session\nai · rag · db\ncrypto · hash · telegram"]:::lib
    end

    subgraph EXT["🌐 External Services"]
        CLAUDE["🤖 Claude API\nclaude-sonnet-4-6\nclaude-opus-4-8"]:::ext
        VOYAGE["🔢 Voyage AI\nvoyage-3\n1024-dim embeddings"]:::ext
        TG_API["✈️ Telegram Bot API\n@cbgpower_bot"]:::ext
        REDIS["⚡ Upstash Redis\nSessions · Online Status"]:::ext
        BLOB["📦 Vercel Blob\nFile Storage CDN"]:::ext
    end

    subgraph DB["🗄️ Neon PostgreSQL + pgvector"]
        MODELS["Core: User · Session · TelegramGroup\nKnowledge: Collection · Doc · Chunk (vector 1024)\nOps: Ticket · ChatMessage · AiDraft\nLogs: AnswerLog · LoginAttempt\nConfig: BotSetting · AiSetting · SummaryBotSetting"]:::db
    end

    AUTH_PAGES --> AUTH_API
    DASH_PAGES --> ACTIONS
    DASH_PAGES --> DATA_API
    COMPONENTS --> ACTIONS

    AUTH_API --> CORE
    DATA_API --> SERVICES
    DATA_API --> CORE
    WEBHOOK --> CORE
    WEBHOOK --> ACTIONS
    SUM_WEBHOOK --> SUM_C

    ACTIONS --> SERVICES
    ACTIONS --> CORE
    SERVICES --> MODELS
    CORE --> MODELS

    CORE --> CLAUDE
    CORE --> VOYAGE
    CORE --> TG_API
    CORE --> REDIS
    CORE --> BLOB
```

---

## 2. แผนผัง Pages & Routes

```mermaid
graph LR
    classDef group fill:#0f2027,color:#38bdf8,stroke:#0ea5e9
    classDef page fill:#0a1628,color:#7dd3fc,stroke:#3b82f6
    classDef api fill:#0a1f14,color:#86efac,stroke:#22c55e
    classDef guard fill:#1a0a28,color:#c4b5fd,stroke:#8b5cf6

    ROOT["app/"]

    ROOT --> AUTH_GROUP["(auth)/"]:::group
    ROOT --> DASH_GROUP["(dashboard)/"]:::group
    ROOT --> API_DIR["api/"]

    AUTH_GROUP --> LOGIN["login/\npage.tsx\n[QR + PIN modes]"]:::page
    AUTH_GROUP --> SUPER["login/super/\npage.tsx\n[Super Admin]"]:::page

    DASH_GROUP --> LAYOUT["layout.tsx\n[Auth Guard\n+ AppShell]"]:::guard
    LAYOUT --> HOME["page.tsx\n/ Dashboard\nKPIs + Trends"]:::page
    LAYOUT --> TICKETS["tickets/\npage.tsx\nTicket List"]:::page
    LAYOUT --> KNOWLEDGE["knowledge/\npage.tsx\nFAQ + Docs + RAG"]:::page
    LAYOUT --> ASSISTANT["assistant/\npage.tsx\nAI Chat"]:::page
    LAYOUT --> GROUPS["groups/\npage.tsx\nTelegram Groups"]:::page
    LAYOUT --> USERS["users/\npage.tsx\nUser Mgmt"]:::page
    LAYOUT --> SETTINGS["settings/\npage.tsx\nBot + AI Config"]:::page

    API_DIR --> AUTH_API["auth/\npin · super\nlogout · session"]:::api
    API_DIR --> TICKETS_API["tickets/\n[id]/\nGET POST PATCH DELETE"]:::api
    API_DIR --> GROUPS_API["groups/\n[id]/\nGET POST PATCH DELETE"]:::api
    API_DIR --> USERS_API["users/\n[id]/\nGET POST PATCH DELETE"]:::api
    API_DIR --> WEBHOOK_API["telegram/\nwebhook/\nPOST only"]:::api
    API_DIR --> SUM_WEBHOOK_API["telegram/\nsummary-webhook/\nPOST only"]:::api
```

---

## 3. Data Flow — RAG Pipeline (Knowledge → AI Answer)

```mermaid
sequenceDiagram
    participant U as 👤 User/Bot
    participant A as assistant.ts (Action)
    participant R as rag.ts
    participant V as Voyage API
    participant DB as PostgreSQL + pgvector
    participant C as Claude API

    U->>A: askAssistant(collectionId, question)
    A->>A: requireUser() — auth check
    A->>R: ragAnswer({ collectionId, question, topK, minScore })

    R->>V: embedTexts([question], "query")
    V-->>R: float[1024] vector

    R->>DB: SELECT chunks by cosine distance\n(embedding <=> $vec::vector)\nWHERE collectionId = $id\nAND 1 - distance >= minScore\nORDER BY distance LIMIT topK
    DB-->>R: KnowledgeChunk[] with scores

    alt No chunks found (score < minScore)
        R-->>A: { answer: "ไม่มีข้อมูล", confidence: 0, hasContext: false }
    else Chunks found
        R->>C: generateAnswer(systemPrompt + chunks, question, model)
        C-->>R: grounded Thai answer + confidence
        R-->>A: { answer, sources: RagSource[], confidence, hasContext: true }
    end

    A->>DB: INSERT AnswerLog (question, answer, confidence)
    A-->>U: { answer, sources, confidence }
```

---

## 4. Data Flow — Telegram Bot Auto-Reply

```mermaid
sequenceDiagram
    participant TG as Telegram
    participant WH as /api/telegram/webhook
    participant RAG as rag.ts
    participant DB as PostgreSQL
    participant TG_API as Telegram Bot API

    TG->>WH: POST (X-Telegram-Bot-Api-Secret-Token)
    WH->>WH: validateSecretToken()
    WH->>DB: INSERT ChatMessage (CUSTOMER)

    WH->>DB: findGroup (chatId) + BotSetting.aiAutoReply
    
    alt botMode = OFF or aiAutoReply = false
        WH-->>TG: 200 OK (no action)
    else botMode = DRAFT
        WH->>RAG: ragAnswer(group collections, text)
        RAG-->>WH: { answer, confidence }
        WH->>DB: INSERT AiDraft (PENDING)
        WH-->>TG: 200 OK
    else botMode = AUTO_REPLY
        WH->>RAG: ragAnswer(group collections, text)
        RAG-->>WH: { answer, confidence }
        
        alt confidence >= autoReplyMinConfidence
            WH->>TG_API: sendMessage(chatId, answer)
            WH->>DB: INSERT ChatMessage (BOT)
        else confidence too low
            WH->>DB: INSERT AiDraft (PENDING)
        end
        WH-->>TG: 200 OK
    end
```

---

## 5. Data Flow — Authentication

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant P as /api/auth/pin (or /super)
    participant DB as PostgreSQL
    participant R as Redis
    participant MW as proxy.ts (Middleware)

    U->>P: POST { username, pin }
    P->>DB: findUser(username) + verifyPinHash
    
    alt Invalid credentials
        P->>DB: INSERT LoginAttempt (success=false)
        P-->>U: 401 Unauthorized
    else Valid
        P->>DB: INSERT LoginAttempt (success=true)
        P->>DB: DELETE old Session (single-session)
        P->>DB: INSERT Session { id, userId, expiresAt }
        P->>P: signSession(JWT) — HS256, payload: { sub, role, sid }
        P-->>U: Set-Cookie: session=<jwt>; HttpOnly; Secure
    end

    Note over MW: Every dashboard request
    U->>MW: GET /tickets (with cookie)
    MW->>MW: verifySession(jwt) — jose HS256
    MW->>DB: findSession(sid) — check expiry
    
    alt Session invalid/expired
        MW-->>U: Redirect /login
    else Valid
        MW->>R: setOnlineStatus(userId)
        MW-->>U: Pass through to route handler
    end
```

---

## 6. Entity Relationship Diagram (Database)

```mermaid
erDiagram
    User {
        string id PK
        string name
        Role role
        string username UK
        string passwordHash
        string pinHash
        string telegramId UK
        bool isActive
    }

    Session {
        string id PK
        string userId FK
        string deviceInfo
        datetime expiresAt
    }

    TelegramGroup {
        string id PK
        string name
        string chatId UK
        string purpose
        BotMode botMode
        bool isActive
    }

    KnowledgeCollection {
        string id PK
        string name
        string description
    }

    KnowledgeDoc {
        string id PK
        string collectionId FK
        DocType type
        string title
        string blobUrl
        string question
        string answer
        IngestStatus status
    }

    KnowledgeChunk {
        string id PK
        string docId FK
        string collectionId FK
        string content
        vector embedding
    }

    Ticket {
        string id PK
        int seq UK
        string groupId FK
        string adminId FK
        string tag
        string detail
        Urgency urgency
        TicketStatus status
        datetime respondedAt
    }

    ChatMessage {
        string id PK
        string groupId FK
        string tgUserId
        string adminId FK
        MsgRole role
        string text
    }

    AiDraft {
        string id PK
        string groupId FK
        string sourceMsg
        string draftText
        DraftStatus status
        string adminId FK
    }

    AnswerLog {
        string id PK
        string collectionId
        string question
        string answer
        float confidence
        int rating
    }

    BotSetting {
        string id PK
        string botToken
        string webhookUrl
        bool aiAutoReply
    }

    SummaryBotSetting {
        string id PK
        string botToken
        string webhookUrl
        string webhookSecret
        string targetGroupChatId
    }

    AiSetting {
        string id PK
        string chatModel
        string embedModel
        string systemPrompt
        float ragMinScore
        float autoReplyMinConfidence
    }

    User ||--o{ Session : "has"
    User ||--o{ Ticket : "handles"
    User ||--o{ ChatMessage : "sends"
    User ||--o{ AiDraft : "reviews"
    TelegramGroup ||--o{ Ticket : "generates"
    TelegramGroup ||--o{ ChatMessage : "contains"
    TelegramGroup ||--o{ AiDraft : "queues"
    TelegramGroup }o--o{ KnowledgeCollection : "linked to"
    KnowledgeCollection ||--o{ KnowledgeDoc : "contains"
    KnowledgeDoc ||--o{ KnowledgeChunk : "chunked into"
```

---

## 7. Module Dependency Map (lib/)

```mermaid
graph LR
    classDef action fill:#1a1a3a,color:#c4b5fd,stroke:#7c3aed
    classDef service fill:#1a3a1a,color:#86efac,stroke:#16a34a
    classDef core fill:#3a1a1a,color:#fca5a5,stroke:#dc2626
    classDef external fill:#3a2a00,color:#fcd34d,stroke:#d97706

    subgraph ACTIONS["Server Actions"]
        ASS["assistant.ts"]:::action
        KNOW["knowledge.ts"]:::action
        ING["ingest.ts"]:::action
        FEED["feedback.ts"]:::action
        SET["settings.ts"]:::action
        TEL_A["telegram.ts (action)"]:::action
        SUM_A["summary-bot.ts (action)"]:::action
    end

    subgraph SERVICES["Services"]
        SVC_T["tickets.ts"]:::service
        SVC_K["knowledge.ts"]:::service
        SVC_U["users.ts"]:::service
        SVC_G["groups.ts"]:::service
        SVC_S["stats.ts"]:::service
    end

    subgraph CORE["Core Utils"]
        AI["ai.ts\n(Anthropic+Voyage)"]:::core
        RAG["rag.ts\n(vector search)"]:::core
        AUTH["auth.ts\n(JWT)"]:::core
        SESSION["session.ts\n(user resolver)"]:::core
        DB["db.ts\n(Prisma)"]:::core
        CRYPTO["crypto.ts"]:::core
        HASH["hash.ts"]:::core
        TEL_C["telegram.ts (core)"]:::core
        SUM_C["summary-bot.ts (core)\nkeyword dispatch"]:::core
        REDIS["redis.ts"]:::core
        INGEST_C["ingest.ts (core)\nchunkText"]:::core
    end

    subgraph EXT["External"]
        CLAUDE_E["Claude API"]:::external
        VOYAGE_E["Voyage API"]:::external
        TG_E["Telegram API"]:::external
        REDIS_E["Upstash Redis"]:::external
        BLOB_E["Vercel Blob"]:::external
        PRISMA_E["Neon PostgreSQL"]:::external
    end

    ASS --> RAG
    ASS --> SESSION
    KNOW --> DB
    KNOW --> BLOB_E
    ING --> AI
    ING --> INGEST_C
    ING --> DB
    FEED --> DB
    SET --> DB
    SET --> TEL_C
    TEL_A --> TEL_C
    TEL_A --> RAG
    SUM_A --> SUM_C
    SUM_A --> DB

    SVC_T --> DB
    SVC_K --> DB
    SVC_U --> DB
    SVC_G --> DB
    SVC_S --> DB

    RAG --> AI
    RAG --> DB
    AI --> CLAUDE_E
    AI --> VOYAGE_E
    AI --> DB
    AUTH --> SESSION
    SESSION --> DB
    SESSION --> REDIS
    TEL_C --> TG_E
    TEL_C --> CRYPTO
    SUM_C --> TG_E
    SUM_C --> DB
    SUM_C --> CRYPTO
    REDIS --> REDIS_E
    DB --> PRISMA_E
```

---

## 8. สรุป Key Patterns

| Pattern | ไฟล์หลัก | หน้าที่ |
|---------|----------|---------|
| **Auth (JWT + Session)** | `lib/auth.ts` + `lib/session.ts` + `proxy.ts` | PIN/Super login → JWT cookie → Middleware guard |
| **RAG Pipeline** | `lib/ai.ts` + `lib/rag.ts` + `lib/ingest.ts` | Embed → pgvector search → Claude generate |
| **Telegram Bot** | `lib/telegram.ts` + `/api/telegram/webhook` | Webhook → RAG → auto-reply or draft queue |
| **Role-Based Access** | `lib/session.ts#requireRole()` | SUPER_ADMIN > MANAGER > ADMIN |
| **Mock Toggle** | `lib/use-mock.ts` + `NEXT_PUBLIC_USE_MOCK` | Dev without DB (mock data) |
| **Single Session** | `lib/session.ts` + Session model | New login kills old session |
| **Dynamic Config** | `AiSetting` + `BotSetting` + `SummaryBotSetting` in DB | RAG params + bot tokens, no redeploy needed |
| **Summary Bot** | `lib/summary-bot.ts` + `/api/telegram/summary-webhook` | Keyword-triggered admin group bot → pulls live DB stats |
| **File Storage** | `lib/actions/knowledge.ts` + Vercel Blob | Upload → Blob URL → store in DB → ingest |

---

> Generated: 2026-06-24 | Updated: 2026-06-29 (Summary Bot) | Stack: Next.js 16 · Prisma 6 · Neon + pgvector · Claude + Voyage · Upstash Redis · Vercel Blob
