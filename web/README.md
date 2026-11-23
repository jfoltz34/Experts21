# Experts21 Web App

A web chat for your expert team. It has:

- **A sidebar** listing every agent with its name, title, model (opus, sonnet or haiku) and voice. Hover an agent to see its working style.
- **A chat window** for talking to any one expert directly.
- **"Ask the whole team"**, which sends your question through Theo, the orchestrator:
  1. Theo picks 1-6 experts.
  2. The experts answer in parallel. You can expand each memo.
  3. Theo combines one answer.

The agents come from this repository **at build time**:

- Agent definitions and models from `.claude/agents/`.
- Their preloaded skills from `.claude/skills/`.
- Each agent's `knowledge/<agent>/` folder.
- The relevant `docs/` files, plus personas from `docs/agent-brains.md`.

So editing an agent or dropping a document into a knowledge folder and pushing to `main` updates the live site on the next deploy.

**Your API key never reaches the browser.** All Claude API calls run in two Netlify Functions (`/api/chat` and `/api/plan`), which read `ANTHROPIC_API_KEY` from Netlify's environment variables. The browser also never receives your knowledge documents or prompts, only names and titles.

---

## Deploy to Netlify (step by step)

You need:
- A Netlify account (free is fine).
- An Anthropic API key from https://platform.claude.com, under **API keys**.
- This repository on GitHub.

1. **Make sure everything is on `main`.** Netlify deploys from your GitHub repository.
2. **Create the site.**
   1. In Netlify, choose **Add new project → Import an existing project → GitHub**. Older Netlify screens say **Add new site**.
   2. Authorize Netlify and pick the `Experts21` repository.
3. **Leave the build settings alone.** Netlify reads `netlify.toml` at the repo root:
   - base `web`
   - build command `npm run build`
   - publish `dist`
   - functions `netlify/functions`

   If the form shows those values, or shows them blank, that's correct. Don't type anything over them.
4. **Add your API key before the first deploy.**
   1. On the same screen, choose **Add environment variables**. Or, after creating the site, go to **Site configuration → Environment variables → Add a variable**.
   2. Key: `ANTHROPIC_API_KEY`
   3. Value: your key (starts with `sk-ant-`)
   4. Scopes: at least **Functions**. Mark it as a secret if offered.
5. **Strongly recommended: add a passcode.** Anyone who finds your site URL could otherwise run up your API bill. Add a second variable:
   - Key: `APP_PASSWORD`
   - Value: any passcode you choose

   The app asks for it once per browser and remembers it on that device.
6. **Deploy.** Click **Deploy**. The build takes about a minute. If you added variables after the first deploy, go to **Deploys → Trigger deploy → Deploy site** so the functions pick them up.
7. **Open the site URL** (`https://<name>.netlify.app`). Click **Ask the whole team** or any expert, and send a message.

### After it's live

- **Updating experts or knowledge:**
  - Push changes to `.claude/`, `knowledge/` or `docs/` on `main`.
  - Netlify rebuilds automatically. `netlify.toml` has an `ignore` rule so changes outside `web/` still trigger a build.
  - The sidebar footer shows when the current build was made.
- **Changing the passcode:** edit `APP_PASSWORD` in Netlify, then trigger a new deploy.
- **Custom domain:** Netlify → **Domain management**.

### Optional settings (environment variables)

| Variable | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | (required) | Your Anthropic API key. Only the functions can read it |
| `APP_PASSWORD` | not set (open) | A shared passcode required on every request |
| `CLAUDE_EFFORT` | `medium` | How hard the experts think: `low`, `medium`, `high`. Higher gives deeper answers but is slower and costs more, and risks Netlify's 60-second limit |

---

## How it works

```
Browser (React)                     Netlify Functions (server)           Anthropic API
───────────────                     ──────────────────────────           ─────────────
Direct chat ─── POST /api/chat ───▶ builds the agent's system prompt ──▶ streams the reply
                                    (definition + skills + knowledge
"Ask the whole team":                + docs), adds the API key
 1. POST /api/plan ───────────────▶ Theo picks the panel (JSON) ───────▶
 2. POST /api/chat × N (parallel) ▶ each expert answers its brief ─────▶
 3. POST /api/chat (synthesize) ──▶ Theo combines the memos ───────────▶
```

- **Models:** each agent runs on the model set in its file:
  - `opus` → `claude-opus-5-5`
  - `sonnet` → `claude-sonnet-5-5`
  - `haiku` → `claude-haiku-5-5`

  The table in `docs/agent-brains.md` explains each choice.
- **Refusal fallbacks:** Opus and Sonnet requests turn on Anthropic's server-side fallback. If a safety classifier declines a request, the API retries it on a fallback model in the same call. Haiku has no server-side fallback.
- **Prompt caching:** each agent's large system prompt is cached, so follow-up messages within a few minutes cost much less.
- **The 60-second limit:** Netlify streaming functions can run for 60 seconds. That's why "Ask the whole team" runs as several short calls rather than one long one. If an answer is cut off, the app says so. Ask "continue" or lower `CLAUDE_EFFORT`.
- **What the web team can't do:**
  - Agents here have no tools. They can't open files, browse or edit the repo; everything they'd read is placed in their prompt at build time.
  - The web panel runs one round. It doesn't do the cross-review round the Claude Code orchestrator can.
  - Ada (the meta agent) can draft new agents and skills, but you apply them with `/improve-team` in Claude Code.
  - Conversations live only in your browser tab. Reloading starts fresh.
- **Knowledge files:** text formats (`.md`, `.txt`, `.csv`, `.json`, and files with no extension) up to 400 KB each are included. PDFs and images are skipped with a build warning, so convert them to text or Markdown first.

### Cost

You pay Anthropic for tokens on your API key. A direct question usually sends 15-40K tokens of system prompt, and those tokens are cached on follow-ups. A team question runs 3-8 calls. Watch usage at https://platform.claude.com, and set a spend limit there.

---

## Run it locally

```bash
cd web
npm install
npm test          # builds the team data, then runs the function tests against a mock API (no key needed)
npm run build     # production build into web/dist
```

To chat locally with real answers, you need the Netlify CLI. `npm run dev` runs only the front end, without the functions.

```bash
npm install -g netlify-cli
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

```bash
netlify dev       # run from the repo root; serves the app and the functions together
```

## Files

| Path | What it is |
|---|---|
| `../netlify.toml` | Netlify build settings (base `web`, functions, rebuild rule, security headers) |
| `scripts/build-team.mjs` | Build step: reads `.claude/`, `knowledge/`, `docs/` and generates the team data |
| `src/` | The React app (`App.jsx`, `api.js`, `styles.css`) |
| `netlify/functions/chat.mjs` | `/api/chat`: streams one agent's reply (direct chat, panel memo, or synthesis) |
| `netlify/functions/plan.mjs` | `/api/plan`: Theo chooses the panel, using structured JSON output |
| `netlify/lib/experts.mjs` | Shared server code: prompt assembly, model mapping, API client, passcode check |
| `scripts/smoke-test.mjs` | Tests for the functions against a local mock of the Anthropic API |

The generated files (`src/generated/`, `netlify/lib/team-data.generated.mjs`) are rebuilt on every build and aren't committed.
