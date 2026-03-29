# Robot Guide Complete Summary

This document is a generic reference for Robot Guide functionality, hierarchy, and design.

## 1) Architecture Overview

Robot Guide is split into:

- Core engine (`wwwroot/robot-guide`):
  - `robot-guide.js` (runtime behavior)
  - `robot-guide.css` (visual design)
  - `robot-guide.config.js` (bootstrap + profile selection)
- Active profile (`wwwroot/robot-guide-custom-<profile>`):
  - `robot-guide.custom.js` (profile config + handlers + copy)
  - `ChatPrompts/*` (assistant system/user fallback prompts)
  - optional profile-level `InsightsSignalsPrompts/*` (not currently consumed by backend lookup)

Core stays generic. Profile owns business-specific behavior and wording.

## 2) Initialization Hierarchy

Expected script order:

1. `wwwroot/robot-guide/robot-guide.config.js`
2. `wwwroot/robot-guide/robot-guide.js`

Startup flow:

1. Read `window.RobotGuideConfig.businessSpecific`
2. Resolve profile script path
3. Load selected `robot-guide.custom.js`
4. Merge profile config into base config
5. Initialize engine (`RobotGuide.init(...)`)

## 3) Config Model

Primary config object:

- `window.RobotGuideConfig`

Common top-level keys:

- `sections`
- `poses`
- `commentary`
- `assistant`
- `tracking`
- `positioning`
- `iosKeyboard`
- `scrollSpy`
- `animation`

## 4) Bubble Design and Message Routing

Robot Guide uses two visual channels:

- White bubble (`#rg-bubble`):
  - role: commentary channel
  - includes:
    - welcome commentary on load
    - section commentary
    - roaming commentary (drop outside known sections)
- Yellow bubble (`#rg-chat-bubble`):
  - role: assistant chat channel
  - includes:
    - `/api/chat` responses
    - action confirmation links and action-result chat replies

This separation is intentional: commentary and chat are distinct interaction modes.

## 5) Commentary Behavior

Commentary source:

- `commentary.<sectionId>` arrays in profile config
- optional `commentary.roaming` for non-section drops

Selection behavior:

- Random selection per section
- Consecutive duplicate for same section is avoided when multiple lines exist

Triggers:

- avatar click -> commentary for active section
- scroll spy section change -> commentary for visible section (if enabled)
- drag-drop:
  - drop on/near configured section -> section commentary
  - drop away from sections -> roaming commentary

Related control:

- `dropSectionSnapRadiusPx` controls how close a drop must be to count as a section drop

## 6) Assistant Behavior

Assistant input/output:

- inline input UI under avatar
- request endpoint default: `POST /api/chat`
- optional per-profile model via `assistant.model`
- optional stateful history via `assistant.stateful`

On-load behavior:

- `assistant.showWelcomeOnLoad` governs welcome emission
- welcome text comes from profile config
- welcome is rendered in the commentary channel (white bubble)

## 7) Action System

Action configuration lives in:

- `assistant.actionsMatrix`

Structure:

- `definitions.<actionId>`
- `dynamicNavigation.routes[]`

Common fields:

- `isEnabled`
- `triggerPhrases`
- `jsFunctionCalled`
- `jsFunctionParamsCsv` (optional)
- `capabilityLabel` (optional)
- `displaySequence` (optional)

Execution pipeline:

1. detect intent from `definitions` or `dynamicNavigation`
2. resolve handler
3. execute via `customExecutors` or `window.RobotGuideActionHandler`
4. normalize result
5. render reply/action links in chat channel

Notes:

- `silent: true` is respected
- clickable action links route through same execution pipeline

## 8) Action Param Tokens

`jsFunctionParamsCsv` supports:

- `literal:<text>`
- `select:<css selector>`
- `input:<css selector>`
- `query:<css selector>`
- plain literal values

Resolved CSV values map to:

- `intent.params.values`
- `intent.params.sectionId` (first item convenience mapping)

## 9) External Link Safety

External open flow is confirm-first:

1. handler requests external open
2. runtime stores pending URL
3. chat renders confirm/cancel actions
4. browser tab opens only after explicit confirmation

## 10) Prompt and Profile Binding

Chat prompts are loaded from active profile folder:

- `wwwroot/<active-profile>/ChatPrompts/*`

`businessOverrideFolder` is sent by frontend and normalized server-side so backend prompt loading matches selected profile.

Validation rules for override folder:

- regex-limited folder name
- path traversal blocked
- expected profile prefix required
- invalid values fallback to default profile

Insights/signals prompt lookup is currently separate from active chat profile selection:

- `wwwroot/robot-guide-custom-basic/InsightsSignalsPrompts/*`
- `InsightsSignalsPrompts/*` (generic fallback)

This means active profile switching affects `ChatPrompts/*`, but does not currently switch insights/signals prompt roots.

## 11) Chat Request Guardrails

`/api/chat` request contract includes:

- `message`
- `history`
- `stateful`
- `model` (optional)
- `businessOverrideFolder` (optional)

Server guardrails:

- `message` required
- max message length enforced (`1200`)
- requested model format validated

## 12) Tracking

Optional event tracking emits interaction signals to configured endpoint:

- send events
- action events
- response success/fallback events

When `navigator.sendBeacon` is available, runtime prefers it for reliability.

## 13) Security and Middleware Notes

Backend pipeline order:

1. `UseRouting()`
2. `UseAuthentication()`
3. `UseAuthorization()`

Additional hardening:

- folder override normalization and validation
- safe external-link confirmation flow
- user-safe client-facing error messages for contact delivery failures

## 14) Customization Workflow (Generic)

1. Keep core files in `wwwroot/robot-guide` generic.
2. Create or update a profile folder `wwwroot/robot-guide-custom-<name>`.
3. Configure:
   - `robot-guide.custom.js`
   - `ChatPrompts/*`
   - optional `InsightsSignalsPrompts/*` (only used if backend lookup is extended to consume per-profile roots)
4. Set `businessSpecific.folderName` to activate profile.

## 15) Source of Truth

- Runtime behavior: `wwwroot/robot-guide/robot-guide.js`
- Visual design: `wwwroot/robot-guide/robot-guide.css`
- Bootstrap/profile selection: `wwwroot/robot-guide/robot-guide.config.js`
- Active profile behavior/copy: `wwwroot/robot-guide-custom-<profile>/robot-guide.custom.js`
- Active chat prompts: `wwwroot/<active-profile>/ChatPrompts/*`
- Insights/signals prompt roots (current backend behavior):
  - `wwwroot/robot-guide-custom-basic/InsightsSignalsPrompts/*`
  - `InsightsSignalsPrompts/*` fallback

