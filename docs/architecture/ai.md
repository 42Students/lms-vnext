# AI architecture

AI is an application layer over deterministic LMS domains, not an alternate data-access path.

## Current foundation

The repo now has:

- a provider-neutral generation contract in `src/ai/provider.ts`
- runtime latency/token/cost telemetry hooks in `src/ai/runtime.ts` and `src/ai/telemetry.ts`
- a versioned prompt catalog in `src/ai/prompts/catalog.ts`
- an explicit tool registry in `src/ai/tools`
- deterministic evaluation cases in `src/ai/evaluation/cases.ts`

No model provider or AI-facing route is enabled yet. Vertex AI remains the planned provider and waits for the real GCP project/configuration.

## Security boundary

AI tools never receive database handles and do not run arbitrary SQL.

Every tool takes the authenticated `RequestContext` and delegates to an existing domain service. The domain service remains authoritative for:

- tenant scope
- membership state
- system/admin scope
- exact project/course/placement access
- role permissions

The central AI tool executor validates the tool input but intentionally does not duplicate authorization rules.

Initial tools:

- `placements.get_operations`
- `projects.get_readiness`
- `courses.get_learner_progress`

The placement tool calls the existing TPO operations service, the project tool calls project readiness, and the course tool calls exact learner-content progress.

## Provider contract

Providers accept explicit messages/model settings and return:

- text
- actual model identifier
- finish reason
- input/output/total token usage when available
- estimated provider cost in micros when the provider can supply or calculate it

The runtime wrapper measures latency independently from the provider and emits an observer metric on success or error.

Prompt content, learner data and tool payloads are deliberately absent from default telemetry fields.

## Prompt/version tracking

Prompts are named and versioned in source control. Changing behavioral instructions requires incrementing the prompt version so an evaluation result can be tied to the exact prompt used.

Do not place large product rules into prompts when they can be expressed in domain services or tool contracts.

## Evaluations

The initial evaluation catalog records expected tool selection and forbidden behavior for:

- TPO operational prioritization
- Project readiness/blocker explanation
- Learner self-scoped progress

Model-quality execution waits for the Vertex provider. Authorization and cross-tenant behavior are testable before that and belong in deterministic tests.

## Next AI step

Once the GCP project exists:

1. choose the supported Vertex model/deployment
2. implement the `AiProvider` adapter with ADC
3. map the explicit tool registry into the provider's function/tool schema
4. add a server-only orchestration service
5. run the committed evaluation cases
6. record real token, latency and cost observations
7. only then expose a role-specific UI/API surface

Do not ship a generic chatbot with unrestricted LMS context.
