
## 2026-06-26 - Cached LLM Providers
**Learning:** Instantiating new LLM provider instances (e.g., `new OpenAIProvider()`) on every request in `getLLMProvider` is highly inefficient. It repeatedly parses environment variables and sets up HTTP clients, causing unnecessary CPU load and latency.
**Action:** Cache the instantiated LLM providers in a map so they can be reused across requests.

## 2026-06-26 - Cached LLM Providers
**Learning:** Instantiating new LLM provider instances (e.g., `new OpenAIProvider()`) on every request in `getLLMProvider` is highly inefficient. It repeatedly parses environment variables and sets up HTTP clients, causing unnecessary CPU load and latency.
**Action:** Cache the instantiated LLM providers in a map so they can be reused across requests.
