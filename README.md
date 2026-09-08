# PrepAI Backend ⚡ <!-- omit in toc -->

> **AI-Orchestrated Career Intelligence, Resume-Job Alignment, and Real-Time Talent Market Analysis Engine**

The **PrepAI Backend** (`ResumeUnmask Server`) is an enterprise-grade RESTful API and AI orchestration service built on Node.js and Express. It bridges the gap between raw candidate resumes and real-world hiring expectations by executing multi-stage AI analysis, live web talent market intelligence retrieval, column-aware PDF spatial parsing, and fail-safe dual-layer schema validation.

---

## 📑 Table of Contents <!-- omit in toc -->

- [🏛️ System Architecture](#️-system-architecture)
- [⚡ Analysis Pipeline](#-analysis-pipeline)
- [📂 Project Structure](#-project-structure)
- [🛠️ Tech Stack \& Dependencies](#️-tech-stack--dependencies)
- [🛡️ Dual-Guardrail AI Architecture](#️-dual-guardrail-ai-architecture)
- [📡 API Reference](#-api-reference)
  - [1. Authentication \& User Management (`/api/v1/user`)](#1-authentication--user-management-apiv1user)
  - [2. Resume Analysis \& Insights (`/api/v1/resume-analysis`)](#2-resume-analysis--insights-apiv1resume-analysis)
  - [3. Health \& Monitoring (`/api/v1/healthcheck`)](#3-health--monitoring-apiv1healthcheck)
- [🗄️ Database Models \& Schema Design](#️-database-models--schema-design)
  - [User Model (`src/models/user.model.js`)](#user-model-srcmodelsusermodeljs)
  - [Resume AI Analysis Model (`src/models/resume-ai-analysis.model.js`)](#resume-ai-analysis-model-srcmodelsresume-ai-analysismodeljs)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation \& Running](#installation--running)
- [🔒 Error Handling \& Standards](#-error-handling--standards)
- [🤝 Contributing \& Community](#-contributing--community)
- [📄 License \& Acknowledgments](#-license--acknowledgments)

---

## 🏛️ System Architecture

The backend follows a modular, layered architecture adhering to the **Controller-Service-Repository/Model** pattern with strict validation and middleware pipelines:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HTTP Client                                │
│                     (React Frontend / Postman / Mobile)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Cookies / Bearer JWT / Multipart Form
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Express Application                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares: CORS | JSON/URL Encoded | CookieParser | Auth (JWT)  │  │
│  │              Multer (PDF Storage) | Zod Request Validation        │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Route Dispatchers: /healthcheck | /user | /resume-analysis        │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Controllers: User Controller | Resume Analysis Controller         │  │
│  └───────────────────┬───────────────────────────────┬───────────────┘  │
│                      │                               │                  │
│                      ▼                               ▼                  │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────┐  │
│  │ Services Layer                  │   │ Data Models (Mongoose)      │  │
│  │ • PDF Column Parser             │   │ • User                      │  │
│  │ • JD Signal Extractor           │   │ • ResumeAIAnalysis          │  │
│  │ • Market Query & Tavily Search  │   └──────────────┬──────────────┘  │
│  │ • AI Synthesis & Validation     │                  │                 │
│  └───────────────────┬─────────────┘                  │                 │
└──────────────────────┼────────────────────────────────┼─────────────────┘
                       │                                │
        ┌──────────────┴──────────────┐                 ▼
        ▼                             ▼          ┌──────────────┐
┌──────────────┐               ┌──────────────┐  │   MongoDB    │
│ Google GenAI │               │  Tavily Web  │  │    Atlas     │
│ (Gemini 2.5/ │               │  Search API  │  └──────────────┘
│  3.5 Models) │               └──────────────┘
└──────────────┘
```

---

## ⚡ Analysis Pipeline

The pipeline transforms a user's resume PDF and target job description into an actionable, market-grounded interview preparation report:

```
[User Request] (PDF Resume + Job Description + Interview Date)
       │
       ▼
 1. Ingest & Upload ───► Validate auth & payload (JWT + Zod)
                     ──► Buffer PDF via Multer ──► Upload to Cloudinary ──► Delete local temp file
       │
       ▼
 2. Parallel Extraction (Promise.all)
       ├──► [Branch A] PDF Parser ──────► Extract layout-clean text from 2-column PDF
       └──► [Branch B] Market Engine ───► Extract JD signals (Gemini)
                                     ──► Search hiring trends (Tavily)
                                     ──► Synthesize market intelligence
       │
       ▼
 3. Timeline Setup ────► Build custom N-day sprint (or default 14-day roadmap)
       │
       ▼
 4. Master AI Analysis ─► Run Gemini with dual Zod schema guardrails:
                          • Match Score (0–100) & Needs Improvement rating
                          • Market-Validated Skill Gaps
                          • Actionable Daily Preparation Roadmap
                          • 5 Technical + 5 Behavioral Interview Questions
       │
       ▼
 5. Save & Respond ────► Save to MongoDB Atlas ──► Return 200 OK JSON response
```

### Step-by-Step Breakdown

1. **Ingest & Upload**: The request is authenticated via JWT (`verifyJwt`) and validated with Zod. Multer streams the PDF into local temporary storage, uploads it securely to Cloudinary, and immediately unlinks the local temp file.
2. **Parallel Extraction (`Promise.all`)**:
   - **PDF Parsing (`pdf_parser.service.js`)**: Analyzes text coordinates ($X/Y$ positioning) to cleanly extract text from two-column resumes without interleaving words.
   - **Market Intelligence (`jd_extraction.service.js` & `market_analysis.service.js`)**: Extracts role and technology requirements using Gemini, queries live hiring trends with Tavily, and distills web findings into a structured market snapshot.
3. **Timeline Setup**: Calculates days remaining until the target interview date to formulate a custom-paced daily sprint (or falls back to a standard 14-day plan).
4. **Master AI Analysis (`resume_analysis.service.js`)**: Combines resume text, JD, self-description, market intelligence, and timeline into a prompt for Gemini. Dual guardrails (compile-time JSON schema + runtime Zod parsing) guarantee the exact output schema.
5. **Save & Respond**: Persists the complete report to MongoDB Atlas and returns the formatted `ApiResponse` to the client.

---

## 📂 Project Structure

```
server/
├── public/
│   └── temp/                        # Ephemeral upload buffer for Multer
├── src/
│   ├── controllers/
│   │   ├── healthcheck.controller.js # Mongoose ping and connectivity monitor
│   │   ├── resume-analysis.controller.js # Multi-stage analysis & analytics retrieval
│   │   └── user.controller.js        # Authentication & JWT session management
│   ├── db/
│   │   └── db.js                    # MongoDB Atlas connection handler
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT authorization guard
│   │   ├── multer.middleware.js     # Multipart PDF file upload filter
│   │   └── validate.middlerware.js  # Generic Zod request schema validator
│   ├── models/
│   │   ├── resume-ai-analysis.model.js # Schema for analysis reports & plans
│   │   └── user.model.js            # User schema with bcrypt & JWT methods
│   ├── routes/
│   │   ├── healthcheck.route.js     # /api/v1/healthcheck
│   │   ├── resume-analysis.route.js # /api/v1/resume-analysis
│   │   └── user.route.js            # /api/v1/user
│   ├── services/
│   │   ├── jd_extraction.service.js # LLM extraction of JD entities & signals
│   │   ├── market_analysis.service.js # Tavily search & market intelligence synthesis
│   │   ├── pdf_parser.service.js    # Layout-aware spatial PDF text extractor
│   │   └── resume_analysis.service.js # Master Gemini evaluation service
│   ├── utils/
│   │   ├── ApiError.utils.js        # Custom extended Error class
│   │   ├── ApiResponse.utils.js     # Standardized JSON response envelope
│   │   ├── AsyncHandler.utils.js    # Express async exception wrapper
│   │   ├── Cloudinary.utils.js      # Cloudinary upload and local unlink utility
│   │   ├── constants.utils.js       # Cookie configuration options
│   │   └── GeminiAI.utils.js        # Generic Google GenAI SDK wrapper
│   ├── validators/
│   │   ├── resumeanalysis.validator.js # Zod schemas for resume analysis requests
│   │   └── user.validator.js        # Zod schemas for login and registration
│   ├── app.js                       # Express app configuration & global error handler
│   └── index.js                     # Server entry point & port listener
├── .env.example                     # Environment template
├── package.json                     # Project scripts and dependencies
└── README.md                        # Documentation
```

---

## 🛠️ Tech Stack & Dependencies

| Category | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Runtime & Framework** | **Node.js** (ES Modules) + **Express 5** | High-performance asynchronous API server |
| **Generative AI** | **`@google/genai` (SDK 2.x+)** | Google Gemini (Gemini 2.5 / 3.5 models) integration |
| **Market Intelligence** | **Tavily Search API** (`axios`) | Live web search engine optimized for LLM contexts |
| **Data Guardrails** | **Zod** + **`zod-to-json-schema`** | Schema generation for Gemini + runtime response validation |
| **Database & ODM** | **MongoDB** + **Mongoose 9** | Document storage for users and analysis reports |
| **PDF Processing** | **`pdf-parse`** | Layout-preserving text extraction with coordinate analysis |
| **Cloud Storage** | **Cloudinary (`v2`)** | Secure cloud storage for uploaded resume PDFs |
| **Security & Auth** | **`jsonwebtoken`** + **`bcryptjs`** | Dual-token authentication (Access/Refresh) and password hashing |
| **File Handling** | **`multer`** | Multi-part form-data stream parsing and disk caching |

---

## 🛡️ Dual-Guardrail AI Architecture

To prevent hallucinations, schema drift, and unexpected data formats from the LLM, PrepAI enforces a **Dual-Guardrail Strategy** in `GeminiAI.utils.js`:

```
                    ┌──────────────────────────────┐
                    │      Zod Schema Definition   │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   [Guardrail 1: LLM Engine]                [Guardrail 2: Runtime Bouncer]
  zodToJsonSchema(zodSchema)                     zodSchema.parse(jsonRaw)
              │                                         │
              ▼                                         ▼
 Enforced inside Gemini via               Validates the received payload.
 requestConfig.responseFormat             Throws an error if the model deviates
       { mimeType: "application/json" }   from types, ranges, or array lengths.
```

1. **Compile-Time LLM Constraint**: The Zod schema is converted directly into JSON Schema (`zod-to-json-schema`) and supplied to Gemini's `responseFormat.text.schema` parameter.
2. **Runtime Validation Bouncer**: Once the model returns JSON, the payload is parsed through `zodSchema.parse(jsonRaw)`. If any key is missing or invalid, an exception is thrown before any data is sent downstream.

---

## 📡 API Reference

### 1. Authentication & User Management (`/api/v1/user`)

#### Register User <!-- omit in toc -->
- **Endpoint**: `POST /api/v1/user/register`
- **Body** (`application/json`):
  ```json
  {
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "strongPassword123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "statusCode": 200,
    "data": {
      "user": {
        "_id": "66db8f1...",
        "fullname": "John Doe",
        "email": "john@example.com",
        "createdAt": "2026-09-08T12:00:00.000Z"
      }
    },
    "message": "User registered successfully!",
    "success": true
  }
  ```

#### Login User <!-- omit in toc -->
- **Endpoint**: `POST /api/v1/user/login`
- **Body** (`application/json`):
  ```json
  {
    "email": "john@example.com",
    "password": "strongPassword123"
  }
  ```
- **Cookies Set**: `accessToken` (HTTP-only, 24h), `refreshToken` (HTTP-only, 1h).

#### Logout User <!-- omit in toc -->
- **Endpoint**: `POST /api/v1/user/logout`
- **Headers**: Requires `accessToken` cookie or `Authorization: Bearer <token>`.
- **Response**: Clears authentication cookies and invalidates refresh token in the database.

#### Get Current User <!-- omit in toc -->
- **Endpoint**: `GET /api/v1/user/@me`
- **Headers**: Requires `accessToken` cookie or `Authorization: Bearer <token>`.

---

### 2. Resume Analysis & Insights (`/api/v1/resume-analysis`)

#### Analyze Resume (Multipart Upload) <!-- omit in toc -->
- **Endpoint**: `POST /api/v1/resume-analysis/`
- **Security**: Requires authenticated user session (`verifyJwt`).
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `resume`: PDF File (Binary, max 1 file)
  - `selfDescription`: Candidate's personal statement / background (string, required)
  - `jobDescription`: Complete text of the target Job Description (string, required)
  - `interviewDate`: Target interview date in `YYYY-MM-DD` format (optional; must be tomorrow or later if provided)
- **Response Example** (`200 OK`):
  ```json
  {
    "statusCode": 200,
    "data": {
      "analysisRecord": {
        "_id": "66dc10a...",
        "userId": "66db8f1...",
        "analysisTitle": "Strong Fit for Senior Backend Engineer with Distributed Systems Gaps",
        "resumeFileUrl": "https://res.cloudinary.com/.../resume.pdf",
        "matchScore": 78,
        "needsImprovement": "minimal",
        "marketSnapshot": {
          "summary": "High demand for Node.js developers with Kubernetes and Redis clustering expertise.",
          "trendingTechnologies": ["Redis", "Kubernetes", "Kafka", "TypeScript"],
          "industryExpectations": ["Event-driven architecture design", "Production performance tuning"],
          "marketGaps": ["Practical experience with high-throughput message streaming"]
        },
        "skillGaps": [
          {
            "skillName": "Apache Kafka",
            "severity": "high",
            "context": "JD requires scalable event pipelines; candidate has only standard REST background.",
            "marketValidated": true
          }
        ],
        "preparationPlan": {
          "timelineType": "custom_date",
          "daysRemaining": 5,
          "dailySchedule": [
            {
              "dayNumber": 1,
              "focusTopic": "Day 1 | Topic: Kafka Architecture & Event Streaming (3 Hours)",
              "marketRelevance": "Kafka is a key requirement in 65% of modern backend roles.",
              "actionItems": [
                "Review Kafka partitions, consumer groups, and offset management.",
                "Build a Node.js microservice producing messages with kafkajs."
              ]
            }
          ]
        },
        "topTechnicalQuestions": [
          {
            "id": 1,
            "type": "technical",
            "question": "[HARD - TECHNICAL] How do you handle backpressure and partition rebalancing in Kafka with Node.js?",
            "intent": "Assesses distributed stream processing resilience.",
            "suggestedTalkingPoints": [
              "Discuss consumer heartbeats and max.poll.interval.ms",
              "Explain pause/resume mechanisms during high throughput"
            ]
          }
        ],
        "topBehavioralQuestions": [
          {
            "id": 1,
            "type": "behavioral",
            "question": "[MEDIUM - BEHAVIORAL] Describe a scenario where you diagnosed and fixed a production memory leak.",
            "intent": "Evaluates debugging persistence and production observability skills.",
            "suggestedTalkingPoints": [
              "Mention heap snapshot analysis with Chrome DevTools or Clinic.js",
              "Describe root cause, fix, and post-mortem safeguards implemented"
            ]
          }
        ]
      }
    },
    "message": "Resume analyzed successfully!",
    "success": true
  }
  ```

#### Fetch All Analyses for Current User <!-- omit in toc -->
- **Endpoint**: `GET /api/v1/resume-analysis/user/all`
- **Description**: Returns lightweight summary records for the dashboard (omits heavy daily schedules and question arrays for fast transfer).

#### Fetch Single Analysis by ID <!-- omit in toc -->
- **Endpoint**: `GET /api/v1/resume-analysis/user/:analysisId`
- **Description**: Retrieves the complete analysis document including all daily action items and interview questions.

---

### 3. Health & Monitoring (`/api/v1/healthcheck`)

#### Server & Database Ping <!-- omit in toc -->
- **Endpoint**: `GET /api/v1/healthcheck`
- **Response** (`200 OK`):
  ```json
  {
    "status": "healthy",
    "message": "Keep-alive successful!"
  }
  ```
- **Internal Behavior**: Verifies Mongoose connection state and executes `mongoose.connection.db.admin().ping()` to ensure active cluster connectivity.

---

## 🗄️ Database Models & Schema Design

### User Model (`src/models/user.model.js`)
- `fullname`: `String` (required)
- `email`: `String` (required, unique, lowercase, trimmed)
- `password`: `String` (hashed via bcrypt in `pre('save')` hook)
- `refreshToken`: `String` (managed during login/logout)
- **Methods**:
  - `isPasswordCorrect(plainPassword)`: Compares passwords via bcrypt.
  - `generateAccessToken()`: Signs JWT with 24-hour expiration.
  - `generateRefreshToken()`: Signs JWT with 1-hour expiration.

### Resume AI Analysis Model (`src/models/resume-ai-analysis.model.js`)
- `userId`: `ObjectId` referencing `User`
- `resumeFileUrl`: `String` (Cloudinary URL)
- `analysisTitle`: `String` (Executive summary title)
- `matchScore`: `Number` (0–100)
- `needsImprovement`: `String` (`"extensive" | "moderate" | "minimal" | "none"`)
- `marketSnapshot`: Subdocument (`summary`, `trendingTechnologies[]`, `industryExpectations[]`, `marketGaps[]`)
- `skillGaps`: Array of subdocuments (`skillName`, `severity`, `context`)
- `preparationPlan`: Subdocument (`timelineType`, `daysRemaining`, `dailySchedule[]` with `dayNumber`, `focusTopic`, `actionItems[]`)
- `topTechnicalQuestions`: Array of 5 technical questions (`id`, `type`, `question`, `intent`, `suggestedTalkingPoints[]`)
- `topBehavioralQuestions`: Array of 5 behavioral questions (`id`, `type`, `question`, `intent`, `suggestedTalkingPoints[]`)

---

## ⚙️ Environment Configuration

Create a `.env` file in the root of `/server` with the following variables:

```env
# Server Configuration
PORT=8000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/resume_unmask

# JWT Secrets
ACCESS_TOKEN_SECRET_KEY=your_super_secret_access_key
REFRESH_TOKEN_SECRET_KEY=your_super_secret_refresh_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Tavily Search API
TAVILY_API_KEY=your_tavily_api_key
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **MongoDB**: Active MongoDB Atlas cluster or local instance
- **API Keys**: Google Gemini API key, Cloudinary account, and Tavily API key

### Installation & Running

1. **Clone the repository and navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Populate .env with your credentials
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Start in production mode**:
   ```bash
   npm start
   ```

---

## 🔒 Error Handling & Standards

- **Standardized Error Class (`ApiError`)**: Every operational error inherits from `ApiError`, ensuring standard HTTP status codes, clear error messages, and stack trace isolation.
- **Async Safety (`asyncHandler`)**: All asynchronous controllers and middlewares are wrapped to catch unhandled promise rejections and forward them to the global error handler.
- **Global Error Interceptor**: Configured in `app.js` to catch any uncaught exceptions and format them into a predictable JSON payload:
  ```json
  {
    "success": false,
    "message": "Error description",
    "errors": [],
    "data": null,
    "statusCode": 500
  }
  ```

---

## 🤝 Contributing & Community

Contributions, issues, and feature requests are welcome!

1. **Fork the Repository**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'feat: Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

---

## 📄 License & Acknowledgments

- **License**: Distributed under the **ISC License**. See `package.json` for details.
- **Powered By**:
  - [Google Gemini API](https://ai.google.dev/) — Semantic analysis and structured evaluation engine
  - [Tavily Search](https://tavily.com/) — Real-time talent market crawling & hiring benchmarks
  - [Cloudinary](https://cloudinary.com/) — Secure cloud asset management

---

<div align="center">

Made with ❤️ for developers and candidates preparing for their next big career breakthrough.

⭐ **Star this repository if you find PrepAI helpful!**

</div>