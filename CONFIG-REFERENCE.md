# RobotGuide Configuration Reference

This guide documents the full config surface used by:

- `robot-guide/robot-guide.config.js` (bootstrap + profile selection)
- `robot-guide-custom-basic/robot-guide.custom.js` (profile behavior)
- `robot-guide/robot-guide.js` (runtime defaults and execution)

---

## 1) Bootstrap config (`robot-guide/robot-guide.config.js`)

Use this file to select the active custom profile:

```js
window.RobotGuideConfig = {
  businessSpecific: {
    enabled: true,
    folderName: 'robot-guide-custom-basic',
    configFileName: 'robot-guide.custom.js'
  },
  assistant: {}
};
```

### `businessSpecific` fields

- `enabled` (`boolean`, default `true`): if `false`, skip loading a custom profile script.
- `folderName` (`string`): profile folder to load (for example `robot-guide-custom-basic`).
- `configFileName` (`string`, default `robot-guide.custom.js`): profile script filename inside folder.
- `configScriptPath` (`string`, optional): explicit script path override; if set, this is used directly.

When profile loading fails, runtime falls back to base config and still initializes.

---

## 2) Profile config (`robot-guide.custom.js`)

Custom profile scripts merge into `window.RobotGuideConfig`.

```js
(function () {
  const base = window.RobotGuideConfig || {};
  const overrides = { /* your config */ };
  window.RobotGuideConfig = merge(base, overrides);
}());
```

Profile is where sections, commentary, assistant behavior, and actions should live.

---

## 3) Top-level runtime config

## Core

- `sections: string[]`  
  IDs the robot reacts to for scroll/trigger/navigation.

- `poses: { basePath: string, map?: Record<string,string> }`  
  `basePath` is prepended to pose file names.  
  `map` overrides any pose filename by pose name.

- `fallbackImage: string | null`  
  Used if a pose image fails to load.

- `commentary: Record<sectionId, string[]>`  
  Per-section lines. Supports `roaming` for off-section drag drops.

- `aiEndpoint: string | null`  
  Optional POST endpoint for live section commentary.  
  Request: `{ section, context }`  
  Response: `{ text }`

- `commentaryFallback: string`  
  Used if no static line exists and AI is unavailable.

## Motion and placement

- `draggable: boolean`
- `scrollSpy: boolean`
- `sectionSnapOffsetX: number`
- `dropSectionSnapRadiusPx: number`
- `headerSelector: string`
- `bubbleTimeout: number`
- `typing: { base, variance, pauseOnPunctuation }`
- `poseCommitMs: number`
- `idleRotation: string[]`
- `idleRotationInterval: number`
- `idleRotationDelay: number`
- `bodyClass: string`
- `container: HTMLElement | null`
- `positioning: { mode: 'section-snap' | 'bottom-center', dockBottomMargin, dockOffsetX }`
- `iosKeyboard: { enabled, mobileBreakpoint, focusDockBottomMargin, lockWhileTyping }`
- `animation: { anticipationMs, settleMs, microIdleDelayMs, spring: { stiffness, damping, restDelta } }`

## Tracking

- `tracking.enabled: boolean`
- `tracking.endpoint: string`
- `tracking.category: string`

When enabled, runtime emits events like:
- `chat_send`
- `chat_action`
- `chat_response_success`
- `chat_response_fallback`

Uses `navigator.sendBeacon` when available.

---

## 4) Assistant config (`assistant`)

Assistant lives in the yellow chat bubble and optional input row.

### Base assistant fields

- `enabled: boolean`
- `endpoint: string` (default `/api/chat`)
- `title: string`
- `welcome: string`
- `showWelcomeOnLoad: boolean`
- `welcomeDelayMs: number`
- `placeholder: string`
- `maxInputLength: number`
- `timeoutMs: number`
- `stateful: boolean`
- `model: string | null`
- `errorReply: string`
- `fallbackReplies: string[]`
- `businessOverrideFolder: string` (normally auto-populated from selected profile)

### Behavior toggles

- `actionLinksEnabled: boolean`
- `quickActionsEnabled: boolean`
- `autoSendOnBlur: boolean`
- `blurSendDelayMs: number`
- `autoOpenContactOnContactIntent: boolean`
- `contactIntentReply: string`

### Contact helpers

- `openContactSubject: string`
- `openContactPrefillPrefix: string`

### External/action integration

- `githubUrl: string` (generic external URL holder in sample profile)
- `actionsConfigEndpoint: string | null` (optional remote JSON for actions matrix)
- `actionHandlerName: string` (global handler object/function name, default `RobotGuideActionHandler`)
- `customExecutors: Record<string, Function> | null` (per-instance handler map)

---

## 5) Actions system (`assistant.actionsMatrix`)

Actions support direct intent matching and dynamic navigation routes.

```js
assistant: {
  quickActionsEnabled: true,
  actionsMatrix: {
    definitions: {
      showCapabilities: {
        isEnabled: true,
        triggerPhrases: ['help', 'capabilities'],
        jsFunctionCalled: 'showCapabilities',
        capabilityLabel: 'Show capabilities',
        displaySequence: 1
      }
    },
    dynamicNavigation: {
      routes: [
        {
          isEnabled: true,
          triggerPhrases: ['go to specs', 'show specs'],
          jsFunctionCalled: 'goSection',
          jsFunctionParamsCsv: 'specs'
        }
      ]
    }
  }
}
```

### `definitions.<actionId>` fields

- `isEnabled?: boolean`
- `triggerPhrases?: string[]`
- `jsFunctionCalled?: string`
- `jsFunctionParamsCsv?: string`
- `capabilityLabel?: string` (used for capabilities list links)
- `displaySequence?: number` (sorting for capabilities list)
- `params?: object` (merged into intent params)

### `dynamicNavigation.routes[]` fields

- `isEnabled?: boolean`
- `triggerPhrases?: string[]`
- `jsFunctionCalled?: string`
- `jsFunctionParamsCsv?: string`

### Action execution pipeline

1. Detect intent from `definitions` or `dynamicNavigation`.
2. Resolve function name (`jsFunctionCalled`).
3. Execute via:
   - `assistant.customExecutors[functionName]`, else
   - global handler (`window[assistant.actionHandlerName]`) function/object method.
4. Normalize result:
   - `{ ok, reply, silent }`
5. Render chat reply and optional action links.

If an action returns `silent: true`, no chat reply is shown.

---

## 6) `jsFunctionParamsCsv` token syntax

`jsFunctionParamsCsv` supports dynamic value resolution:

- `literal:<text>` -> returns `<text>`
- `select:<css selector>` -> reads element value/textContent
- `input:<css selector>` -> reads element value/textContent
- `query:<css selector>` -> reads element value/textContent
- plain text -> treated as literal

Resolved values become:
- `intent.params.values` (array)
- `intent.params.sectionId` (first value convenience mapping)

---

## 7) Action handler contract

Define a global handler in profile script:

```js
window.RobotGuideActionHandler = {
  goSection: ({ intent, helpers, prompts }) => {
    const ok = helpers.navigateToSection(intent.sectionId);
    return { ok, silent: ok, reply: ok ? '' : prompts.sectionMissing };
  }
};
```

Handler receives:

- `intent`
- `sourceText`
- `prompts`
- `assistant`
- `helpers`

Built-in helpers include:

- `navigateToSection(sectionId)`
- `openContactFromAssistant(prefillMessage)`
- `openContact(prefillMessage)`
- `closeContact()`
- `requestExternalOpen({ url, label, confirmText })`

---

## 8) Prompts (`assistant.prompts`)

Prompt keys used by runtime:

- `capabilitiesIntro`
- `openExternalConfirm`
- `sectionMissing`
- `openExternalConfirmYes`
- `openExternalConfirmNo`
- `openContactActionLabel`
- `externalOpenedReply`
- `actionNoUrl`
- `actionDisabled`
- `actionNoJsFunction`
- `actionHandlerMissing`
- `actionFailed`
- `actionCompletedDefault`
- `actionCompletedOpenContact`
- `actionCompletedCloseContact`
- `actionCompletedOpenExternal`
- `actionCompletedNavigate`
- `actionCompletedNavigateWithTarget`

External links are confirm-first:

1. action asks for external open
2. runtime stores pending URL
3. chat shows confirm/cancel links
4. URL opens only after explicit confirmation

---

## 9) `/api/chat` request/response contract

Request payload:

```json
{
  "message": "go to specs",
  "history": [],
  "stateful": true,
  "model": "gpt-4o-mini",
  "businessOverrideFolder": "robot-guide-custom-basic"
}
```

Expected success response:

```json
{
  "reply": "Here are the key specs..."
}
```

---

## 10) Recommended workflow

1. Keep `robot-guide/` generic runtime.
2. Put business-specific behavior in `robot-guide-custom-<name>/robot-guide.custom.js`.
3. Keep actions/prompt wording in profile, not core runtime.
4. Use `robot-guide-custom-basic/index.html` as your sample/demo baseline.

