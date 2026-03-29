/*!
 * RobotGuide v0.1.0
 * An embeddable AI-powered robot guide widget for websites.
 * https://github.com/your-org/robot-guide
 * MIT License
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RobotGuide = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ── Default configuration ──────────────────────────────────────────────────
  const DEFAULTS = {
    // Array of section element IDs the robot reacts to
    sections: [],

    // Poses: map of name → image path. Override any subset.
    poses: {
      basePath: '',   // e.g. '/images/robot-poses/'
      map: {
        'idle-stand':       'idle-stand.png',
        'idle-happy':       'idle-happy.png',
        'happy-cheer':      'happy-cheer.png',
        'happy-smile':      'happy-smile.png',
        'surprised':        'surprised.png',
        'point-left':       'point-left.png',
        'point-left-happy': 'point-left-happy.png',
        'point-right':      'point-right.png',
        'point-up':         'point-up.png',
        'point-up-happy':   'point-up-happy.png',
        'walk-happy':       'walk-happy.png',
        'lunge-forward':    'lunge-forward.png',
        'smug-stand':       'smug-stand.png',
        'fierce-stand':     'fierce-stand.png',
        'combat-smug':      'combat-smug.png',
        'combat-fierce':    'combat-fierce.png',
        'run-smug':         'run-smug.png',
        'charge-angry':     'charge-angry.png',
        'charge-rage':      'charge-rage.png',
        'angry-spark':      'angry-spark.png',
        'angry-weapon':     'angry-weapon.png',
        'rage-spark':       'rage-spark.png',
        'punch-forward':    'punch-forward.png',
        'power-up':         'power-up.png',
      }
    },

    // Fallback image when a pose fails to load
    fallbackImage: null,

    // Static commentary per section ID. Cycles through the array.
    // Set a section to null/[] to skip commentary for it.
    commentary: {},

    // Optional AI endpoint for live commentary.
    // POST { section: 'hero', context: '...' } → { text: '...' }
    // When set, static commentary is used as fallback only.
    aiEndpoint: null,
    commentaryFallback: '',

    // Whether the robot is draggable
    draggable: true,

    // Offset robot snaps to when moving to a section heading (px left of element)
    sectionSnapOffsetX: -78,

    // Header element selector for top-boundary padding
    headerSelector: 'header, .site-header, nav',

    // Scroll spy: auto-move + comment as sections scroll into view
    scrollSpy: true,
    // Max distance (px) from section center to treat drop as section-targeted.
    dropSectionSnapRadiusPx: 280,

    // Bubble display duration after typing completes (ms)
    bubbleTimeout: 10000,

    // Typing speed: base ms per character + up to `variance` random ms
    typing: { base: 20, variance: 16, pauseOnPunctuation: 65 },

    // Pose debounce: ms mouse must hold a pose state before switching
    poseCommitMs: 180,

    // Idle rotation: poses to cycle through after mouse stops
    idleRotation: ['idle-stand', 'idle-happy', 'smug-stand', 'happy-smile'],
    idleRotationInterval: 4000,
    idleRotationDelay: 3500,

    // CSS class added to <body> while the widget is active (for scoping styles)
    bodyClass: 'rg-active',

    // Container element to mount into. Defaults to document.body.
    container: null,

    // Optional built-in assistant chat panel.
    assistant: {
      enabled: false,
      endpoint: '/api/chat',
      title: '',
      welcome: '',
      showWelcomeOnLoad: true,
      welcomeDelayMs: 320,
      placeholder: '',
      maxInputLength: 300,
      actionLinksEnabled: true,
      stateful: true,
      autoOpenContactOnContactIntent: false,
      autoSendOnBlur: false,
      blurSendDelayMs: 220,
      contactIntentReply: '',
      quickActionsEnabled: true,
      githubUrl: '',
      actionsConfigEndpoint: null,
      actionHandlerName: 'RobotGuideActionHandler',
      customExecutors: null,
      openContactSubject: '',
      openContactPrefillPrefix: '',
      prompts: {
        capabilitiesIntro: '',
        openExternalConfirm: '',
        sectionMissing: '',
        openExternalConfirmYes: '',
        openExternalConfirmNo: '',
        openContactActionLabel: '',
        externalOpenedReply: '',
        actionNoUrl: '',
        actionDisabled: '',
        actionNoJsFunction: '',
        actionHandlerMissing: '',
        actionFailed: '',
        actionCompletedDefault: '',
        actionCompletedOpenContact: '',
        actionCompletedCloseContact: '',
        actionCompletedOpenExternal: '',
        actionCompletedNavigate: '',
        actionCompletedNavigateWithTarget: '',
      },
      timeoutMs: 6000,
      fallbackReplies: [],
      model: null,
      errorReply: '',
    },

    tracking: {
      enabled: false,
      endpoint: '/api/track/event',
      category: 'chat',
    },

    // Positioning strategy.
    positioning: {
      mode: 'section-snap', // 'section-snap' | 'bottom-center'
      dockBottomMargin: 10,
      dockOffsetX: 0,
    },

    // iOS keyboard handling for assistant input.
    iosKeyboard: {
      enabled: true,
      mobileBreakpoint: 991,
      focusDockBottomMargin: 96,
      lockWhileTyping: true,
    },

    // Optional motion/animation tuning.
    animation: {
      anticipationMs: 95,
      settleMs: 170,
      microIdleDelayMs: 1300,
      spring: {
        stiffness: 0.075,
        damping: 0.95,
        restDelta: 0.16,
      },
    },
  };

  // ── Public API ─────────────────────────────────────────────────────────────
  function init(userConfig) {
    const cfg = deepMerge(DEFAULTS, userConfig || {});

    // Resolve pose paths
    const POSES = {};
    for (const [name, file] of Object.entries(cfg.poses.map)) {
      POSES[name] = cfg.poses.basePath ? cfg.poses.basePath.replace(/\/?$/, '/') + file : file;
    }

    // Mount HTML
    const container = cfg.container || document.body;
    const guideEl = document.createElement('div');
    guideEl.id = 'rg-guide';
    guideEl.className = 'rg-guide';
    guideEl.setAttribute('aria-live', 'polite');
    guideEl.innerHTML = `
      <div id="rg-avatar" class="rg-avatar" title="Drag me or click for commentary" role="img" aria-label="Robot guide"></div>
      <div id="rg-bubble" class="rg-bubble" role="status"></div>
      <div id="rg-chat-bubble" class="rg-bubble rg-chat-bubble" role="status"></div>
    `;
    container.appendChild(guideEl);
    document.body.classList.add(cfg.bodyClass);

    const robot     = guideEl;
    const avatar    = guideEl.querySelector('#rg-avatar');
    const bubble    = guideEl.querySelector('#rg-bubble');
    const chatBubble = guideEl.querySelector('#rg-chat-bubble');
    let assistantWidget = null;
    let assistantInputEl = null;
    let dismissAssistantBubble = () => {};

    function emitTrackingEvent(eventName, label, meta) {
      if (!cfg.tracking || !cfg.tracking.enabled || !eventName) return;
      const payload = {
        event: String(eventName),
        category: cfg.tracking.category || 'chat',
        label: label || null,
        path: location.pathname + location.search + location.hash,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent || '',
        meta: JSON.stringify(meta || {}),
      };
      const body = JSON.stringify(payload);
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon(cfg.tracking.endpoint || '/api/track/event', blob);
          return;
        }
      } catch {}
      fetch(cfg.tracking.endpoint || '/api/track/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }

    // ── Optional assistant chat ──────────────────────────────────────────────
    function initAssistant() {
      if (!cfg.assistant || !cfg.assistant.enabled) return null;

      const assistantCfg = cfg.assistant;
      const widget = document.createElement('div');
      widget.className = 'rg-assist-widget';
      widget.innerHTML = `
        <div class="rg-assist-inline" role="group" aria-label="${escapeHtml(assistantCfg.title || '')} input">
          <div class="rg-assist-input-row">
            <input class="rg-assist-input" type="text" maxlength="${Number(assistantCfg.maxInputLength || 300)}" placeholder="${escapeHtml(assistantCfg.placeholder || '')}" autocomplete="off" />
            <button class="rg-assist-send" type="button" aria-label="Send message">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 17.3V15.9" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>
                <path d="M9.8 8.6C9.8 7.2 10.9 6 12.5 6C14 6 15.2 7.1 15.2 8.6C15.2 10 14.2 10.7 13.3 11.3C12.5 11.8 12 12.2 12 13.2V13.6" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      `;
      robot.appendChild(widget);

      const input = widget.querySelector('.rg-assist-input');
      const sendBtn = widget.querySelector('.rg-assist-send');
      let assistantBubbleTimer = null;
      let assistantStreamToken = 0;
      let blurSendTimer = null;
      let lastSentMessage = '';
      let pendingExternalOpen = null;
      const assistantHistory = [];
      const historyLimit = 12;
      const isStateful = assistantCfg.stateful !== false;
      let actionsMatrix = (assistantCfg.actionsMatrix && typeof assistantCfg.actionsMatrix === 'object')
        ? assistantCfg.actionsMatrix
        : null;
      const defaultActionsMatrix = {
        definitions: {},
        dynamicNavigation: { routes: [] }
      };

      function matrixOrDefault() {
        return actionsMatrix || defaultActionsMatrix;
      }

      function isEnabledFlag(value) {
        return value !== false;
      }

      async function loadActionsMatrix() {
        if (actionsMatrix) return;
        const endpoint = assistantCfg.actionsConfigEndpoint;
        if (!endpoint) return;
        try {
          const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
          if (!res.ok) return;
          const data = await res.json();
          if (data && typeof data === 'object') actionsMatrix = data;
        } catch {
          // keep defaults
        }
      }

      function setAssistantWaiting(isWaiting) {
        avatar.classList.toggle('rg-assist-waiting', Boolean(isWaiting));
        setMood(isWaiting ? 'waiting' : null);
      }

      function getFriendlyFallbackReply() {
        const replies = Array.isArray(assistantCfg.fallbackReplies)
          ? assistantCfg.fallbackReplies.filter(Boolean)
          : [];
        if (replies.length) return replies[Math.floor(Math.random() * replies.length)];
        return String(assistantCfg.errorReply || '').trim();
      }

      function hasContactIntent(text) {
        return /\b(contact|reach|email|call|book|schedule|meeting|get in touch|talk)\b/i.test(String(text || ''));
      }

      function normalizeText(text) {
        return String(text || '').toLowerCase();
      }

      function resolveJsParamToken(token) {
        const raw = String(token || '').trim();
        if (!raw) return '';
        if (raw.startsWith('literal:')) return raw.slice('literal:'.length);
        const readElementValue = (prefix) => {
          const selector = raw.slice(prefix.length).trim();
          if (!selector) return '';
          const el = document.querySelector(selector);
          if (!el) return '';
          if (typeof el.value === 'string') return el.value;
          return (el.textContent || '').trim();
        };
        if (raw.startsWith('select:')) return readElementValue('select:');
        if (raw.startsWith('input:')) return readElementValue('input:');
        if (raw.startsWith('query:')) return readElementValue('query:');
        return raw;
      }

      function parseJsFunctionParamsCsv(csv) {
        const raw = String(csv || '').trim();
        if (!raw) return [];
        return raw
          .split(',')
          .map((part) => resolveJsParamToken(part))
          .map((part) => String(part || '').trim())
          .filter(Boolean);
      }

      function findNavigationRoute(text) {
        const lower = normalizeText(text);
        const routes = Array.isArray(matrixOrDefault().dynamicNavigation?.routes)
          ? matrixOrDefault().dynamicNavigation.routes
          : [];
        for (const route of routes) {
          if (!isEnabledFlag(route?.isEnabled)) continue;
          const phrases = Array.isArray(route?.triggerPhrases) ? route.triggerPhrases : [];
          const functionSpec = String(route?.jsFunctionCalled || '').trim();
          if (!functionSpec) continue;
          if (phrases.some((phrase) => lower.includes(String(phrase).toLowerCase()))) return route;
        }
        return null;
      }

      function detectActionIntent(text) {
        if (!assistantCfg.quickActionsEnabled) return null;
        const lower = normalizeText(text);
        const defs = matrixOrDefault().definitions || {};
        const hasAny = (arr) => Array.isArray(arr) && arr.some((phrase) => lower.includes(String(phrase).toLowerCase()));

        for (const [actionId, def] of Object.entries(defs)) {
          if (!isEnabledFlag(def?.isEnabled)) continue;
          if (hasAny(def.triggerPhrases)) {
            const csvValues = parseJsFunctionParamsCsv(def.jsFunctionParamsCsv);
            const params = { ...(def.params || {}) };
            if (csvValues.length) {
              params.values = csvValues;
              if (!params.sectionId) params.sectionId = csvValues[0];
            }
            return {
              actionId,
              jsFunctionCalled: def.jsFunctionCalled || actionId,
              params
            };
          }
        }

        const route = findNavigationRoute(lower);
        if (route) {
          const jsFunctionCalled = String(route.jsFunctionCalled || 'goSection').trim();
          const csvValues = parseJsFunctionParamsCsv(route.jsFunctionParamsCsv);
          const params = {};
          if (csvValues.length) {
            params.values = csvValues;
            params.sectionId = csvValues[0];
          }
          return {
            actionId: 'dynamicNavigation',
            jsFunctionCalled,
            params
          };
        }
        return null;
      }

      function navigateToSection(sectionId) {
        const target = document.getElementById(sectionId);
        if (!target) return false;
        const header = document.querySelector(cfg.headerSelector);
        const offset = (header?.offsetHeight || 70) + 12;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        history.replaceState(null, '', `#${sectionId}`);
        window.robotGuide?.trigger(sectionId);
        return true;
      }

      async function invokeActionJsFunction(functionName, intent, sourceText) {
        if (!functionName) return { ok: false, reply: '', silent: false };
        const prompts = assistantCfg.prompts || {};
        const helpers = {
          navigateToSection,
          openContactFromAssistant,
          openContact: (prefill) => openContactFromAssistant(prefill),
          closeContact: () => typeof window.closeContactModal === 'function' && window.closeContactModal(),
          requestExternalOpen: ({ url, label, confirmText }) => {
            if (!url) return { ok: false, reply: String(prompts.actionNoUrl || '').trim(), silent: false };
            pendingExternalOpen = { type: 'external-url', url, label: label || 'external page' };
            return {
              ok: true,
              reply: confirmText || prompts.openExternalConfirm || '',
              silent: false
            };
          }
        };

        // Priority 1: per-instance handler map in config
        const map = assistantCfg.customExecutors;
        if (map && typeof map === 'object' && typeof map[functionName] === 'function') {
          const res = await Promise.resolve(map[functionName]({
            intent,
            sourceText,
            prompts,
            assistant: assistantCfg,
            helpers
          }));
          return res || { ok: true, reply: '', silent: true };
        }

        // Priority 2: global handler object/function
        const globalName = assistantCfg.actionHandlerName || 'RobotGuideActionHandler';
        const globalHandler = globalName ? window[globalName] : null;
        if (typeof globalHandler === 'function') {
          const res = await Promise.resolve(globalHandler({
            functionName,
            intent,
            sourceText,
            prompts,
            assistant: assistantCfg,
            helpers
          }));
          return res || { ok: true, reply: '', silent: true };
        }
        if (globalHandler && typeof globalHandler === 'object' && typeof globalHandler[functionName] === 'function') {
          const res = await Promise.resolve(globalHandler[functionName]({
            intent,
            sourceText,
            prompts,
            assistant: assistantCfg,
            helpers
          }));
          return res || { ok: true, reply: '', silent: true };
        }

        return { ok: false, reply: String(prompts.actionHandlerMissing || '').trim(), silent: false };
      }

      async function executeAction(intent, sourceText) {
        if (!intent) return { ok: false, reply: '' };
        const defs = matrixOrDefault().definitions || {};
        const actionDef = intent.actionId ? defs[intent.actionId] : null;
        if (actionDef && !isEnabledFlag(actionDef.isEnabled)) {
          return { ok: false, reply: String((assistantCfg.prompts || {}).actionDisabled || '').trim(), silent: false };
        }
        const functionName = String(
          intent.jsFunctionCalled ||
          actionDef?.jsFunctionCalled ||
          intent.actionId ||
          ''
        ).trim();
        const mergedIntent = {
          ...intent,
          ...(actionDef || {}),
          params: { ...(actionDef?.params || {}), ...(intent.params || {}) }
        };
        Object.assign(mergedIntent, mergedIntent.params || {});
        if (!functionName) return { ok: false, reply: String((assistantCfg.prompts || {}).actionNoJsFunction || '').trim(), silent: false };
        const result = await invokeActionJsFunction(functionName, mergedIntent, sourceText);
        const normalized = { ok: false, reply: '', silent: false, ...(result || {}) };
        if (!normalized.reply) {
          normalized.reply = normalized.ok
            ? getActionCompletedReply(mergedIntent)
            : String((assistantCfg.prompts || {}).actionFailed || '').trim();
        }
        return normalized;
      }

      function getActionLabel(actionId) {
        const def = matrixOrDefault().definitions?.[actionId];
        if (!def) return actionId;
        return def.capabilityLabel || actionId;
      }

      function getActionCompletedReply(intent) {
        const prompts = assistantCfg.prompts || {};
        if (!intent) return String(prompts.actionCompletedDefault || '').trim();
        const sectionId = intent.sectionId || intent.params?.sectionId || '';
        if (intent.actionId === 'openContact') return String(prompts.actionCompletedOpenContact || prompts.actionCompletedDefault || '').trim();
        if (intent.actionId === 'closeContact') return String(prompts.actionCompletedCloseContact || prompts.actionCompletedDefault || '').trim();
        if ((intent.actionId === 'openGithub') || intent.jsFunctionCalled === 'openGithub') return String(prompts.actionCompletedOpenExternal || prompts.actionCompletedDefault || '').trim();
        if ((intent.actionId === 'dynamicNavigation') || intent.jsFunctionCalled === 'goSection') {
          const templateWithTarget = String(prompts.actionCompletedNavigateWithTarget || '').trim();
          if (sectionId && templateWithTarget) return templateWithTarget.replace('{sectionId}', sectionId);
          return String(prompts.actionCompletedNavigate || prompts.actionCompletedDefault || '').trim();
        }
        return String(prompts.actionCompletedDefault || '').trim();
      }

      function buildCapabilitiesLinks() {
        const defs = matrixOrDefault().definitions || {};
        const ordered = Object.entries(defs)
          .filter(([, def]) => def && def.capabilityLabel && isEnabledFlag(def.isEnabled))
          .map(([actionId, def], idx) => {
            const seq = Number(def.displaySequence);
            const sortKey = Number.isFinite(seq) ? seq : (100000 + idx);
            return { actionId, sortKey };
          })
          .sort((a, b) => a.sortKey - b.sortKey);
        return ordered
          .map(({ actionId }) => {
            const label = escapeHtml(getActionLabel(actionId));
            return `<br><a href="#" class="rg-chat-action" data-rg-action-id="${escapeHtml(actionId)}">${label}</a>`;
          })
          .join('');
      }

      function actionLinkHtml(intent) {
        if (!intent || !assistantCfg.actionLinksEnabled) return '';
        if (intent.actionId === 'showCapabilities') {
          return buildCapabilitiesLinks();
        }
        if ((intent.actionId === 'openGithub') || intent.jsFunctionCalled === 'openGithub') {
          const yesLabel = escapeHtml(String((assistantCfg.prompts || {}).openExternalConfirmYes || '').trim());
          const noLabel = escapeHtml(String((assistantCfg.prompts || {}).openExternalConfirmNo || '').trim());
          if (!yesLabel || !noLabel) return '';
          return `<br><a href="#" class="rg-chat-action" data-rg-action="confirm-open-external">${yesLabel}</a> <span class="rg-chat-action-sep">|</span> <a href="#" class="rg-chat-action" data-rg-action="cancel-open-external">${noLabel}</a>`;
        }
        return '';
      }

      function openContactFromAssistant(prefillMessage) {
        if (typeof window.openContactModal !== 'function') return;
        const subject = String(assistantCfg.openContactSubject || '').trim();
        const prefillPrefix = String(assistantCfg.openContactPrefillPrefix || '').trim();
        const prefill = prefillMessage
          ? `${prefillPrefix ? `${prefillPrefix}\n` : ''}${prefillMessage}\n`
          : '';
        window.openContactModal(subject || undefined, prefill);
      }

      function renderAssistantRichReply(replyText, sourceText, intent) {
        const escaped = escapeHtml(replyText || '').replace(/\n/g, '<br>');
        const linked = escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        const openContactEnabled = isEnabledFlag(matrixOrDefault().definitions?.openContact?.isEnabled);
        const addContactAction = Boolean(assistantCfg.actionLinksEnabled) && hasContactIntent(sourceText);
        const openContactActionLabel = escapeHtml(String((assistantCfg.prompts || {}).openContactActionLabel || '').trim());
        const actionHtml = intent
          ? actionLinkHtml(intent)
          : (addContactAction && openContactEnabled && openContactActionLabel
            ? `<br><a href="#" class="rg-chat-action" data-rg-action-id="openContact">${openContactActionLabel}</a>`
            : '');
        chatBubble.innerHTML = `${linked}${actionHtml}`;
      }

      function typeAssistantText(text, token, opts) {
        let idx = 0;
        setMood('answering');
        clearTimeout(assistantBubbleTimer);
        chatBubble.classList.add('rg-bubble-visible');
        const { base, variance, pauseOnPunctuation } = cfg.typing;
        const tick = () => {
          if (token !== assistantStreamToken) return;
          idx = Math.min(text.length, idx + 1);
          chatBubble.textContent = text.slice(0, idx);
          if (idx < text.length) {
            const ch = text[idx - 1];
            setTimeout(tick, (ch === '.' || ch === ',') ? pauseOnPunctuation : base + Math.random() * variance);
          } else {
            if (opts && typeof opts.onComplete === 'function') opts.onComplete();
            assistantBubbleTimer = setTimeout(() => {
              if (token === assistantStreamToken) {
                chatBubble.classList.remove('rg-bubble-visible');
                setMood(null);
              }
            }, cfg.bubbleTimeout);
          }
        };
        tick();
      }

      function showWelcomeOnLoad() {
        const enabled = assistantCfg.showWelcomeOnLoad !== false;
        const welcomeText = String(assistantCfg.welcome || '').trim();
        if (!enabled || !welcomeText) return;
        const delayMs = Math.max(0, Number(assistantCfg.welcomeDelayMs ?? 320));
        clearTimeout(assistantBubbleTimer);
        chatBubble.textContent = '';
        chatBubble.classList.remove('rg-bubble-visible');
        showCommentaryText(welcomeText, delayMs);
      }

      async function sendMessage(text) {
        if (!text || sendBtn.disabled) return;
        clearTimeout(blurSendTimer);
        const startTs = Date.now();
        lastSentMessage = text;
        if (!isStateful) assistantHistory.length = 0;
        const historyPayload = isStateful ? assistantHistory.slice(-historyLimit) : [];
        const directIntent = detectActionIntent(text);
        input.value = '';
        sendBtn.disabled = true;
        input.disabled = true;
        setAssistantWaiting(true);
        emitTrackingEvent('chat_send', 'ask', { chars: text.length });
        const myToken = ++assistantStreamToken;
        clearTimeout(assistantBubbleTimer);
        chatBubble.textContent = '';
        chatBubble.classList.remove('rg-bubble-visible');
        let timeoutId = null;

        if (directIntent) {
          const actionResult = await executeAction(directIntent, text);
          setAssistantWaiting(false);
          emitTrackingEvent('chat_action', directIntent.actionId || directIntent.jsFunctionCalled, { ok: actionResult.ok, latencyMs: Date.now() - startTs });
          const directReply = String(actionResult.reply || '').trim();
          if (!actionResult.silent && directReply) {
            typeAssistantText(directReply, myToken, {
              onComplete: () => {
                if (myToken !== assistantStreamToken) return;
                renderAssistantRichReply(directReply, text, directIntent);
              }
            });
          }
          sendBtn.disabled = false;
          input.disabled = false;
          input.focus();
          return;
        }

        try {
          const controller = new AbortController();
          const timeoutMs = Number(assistantCfg.timeoutMs || 6000);
          timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          const res = await fetch(assistantCfg.endpoint || '/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              history: historyPayload,
              stateful: isStateful,
              model: assistantCfg.model || null,
              businessOverrideFolder: assistantCfg.businessOverrideFolder || cfg.businessSpecific?.folderName || null
            }),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const reply = String(data.reply || '').trim();
          if (isStateful) {
            assistantHistory.push({ role: 'user', content: text });
            assistantHistory.push({ role: 'assistant', content: reply });
            if (assistantHistory.length > historyLimit) assistantHistory.splice(0, assistantHistory.length - historyLimit);
          }
          setAssistantWaiting(false);
          emitTrackingEvent('chat_response_success', 'success', { latencyMs: Date.now() - startTs, chars: reply.length });
          const contactIntent = hasContactIntent(text);
          const visibleReply = contactIntent
            ? String(assistantCfg.contactIntentReply || '').trim()
            : reply;
          const postIntent = detectActionIntent(text) || (contactIntent ? { actionId: 'openContact', jsFunctionCalled: 'openContact' } : null);
          if (visibleReply) {
            typeAssistantText(visibleReply, myToken, {
              onComplete: async () => {
                if (myToken !== assistantStreamToken) return;
                renderAssistantRichReply(visibleReply, text);
                if (postIntent) {
                  const postResult = await executeAction(postIntent, text);
                  if (postResult?.reply) renderAssistantRichReply(postResult.reply, text, postIntent);
                }
              }
            });
          } else if (postIntent) {
            const postResult = await executeAction(postIntent, text);
            if (postResult?.reply) renderAssistantRichReply(postResult.reply, text, postIntent);
          }
        } catch (err) {
          setAssistantWaiting(false);
          setMood('error');
          const reason = err && err.name === 'AbortError' ? 'timeout' : 'connection';
          emitTrackingEvent('chat_response_fallback', reason, { latencyMs: Date.now() - startTs });
          const fallback = getFriendlyFallbackReply();
          if (fallback) {
            typeAssistantText(fallback, myToken, {
              onComplete: () => {
                if (myToken !== assistantStreamToken) return;
                renderAssistantRichReply(fallback, text);
              }
            });
          }
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
          setAssistantWaiting(false);
          sendBtn.disabled = false;
          input.disabled = false;
          input.focus();
        }
      }

      sendBtn.addEventListener('click', () => sendMessage(input.value.trim()));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(input.value.trim());
        }
      });
      input.addEventListener('focus', () => {
        clearTimeout(blurSendTimer);
      });
      input.addEventListener('blur', () => {
        if (!assistantCfg.autoSendOnBlur) return;
        clearTimeout(blurSendTimer);
        blurSendTimer = setTimeout(() => {
          if (document.activeElement === input) return;
          const pending = input.value.trim();
          if (!pending || sendBtn.disabled) return;
          sendMessage(pending);
        }, Number(assistantCfg.blurSendDelayMs || 220));
      });
      chatBubble.addEventListener('click', (e) => {
        const action = e.target.closest('[data-rg-action]');
        const actionById = e.target.closest('[data-rg-action-id]');
        if (!action && !actionById) return;
        e.preventDefault();

        if (actionById?.dataset?.rgActionId) {
          const id = actionById.dataset.rgActionId;
          Promise.resolve(executeAction({ actionId: id }, lastSentMessage)).then((result) => {
            if (result?.silent) return;
            if (result?.reply) renderAssistantRichReply(result.reply, lastSentMessage, { actionId: id, jsFunctionCalled: id });
          });
          return;
        }

        if (action.dataset.rgAction === 'confirm-open-external') {
          if (pendingExternalOpen?.type === 'external-url' && pendingExternalOpen.url) {
            window.open(pendingExternalOpen.url, '_blank', 'noopener,noreferrer');
            pendingExternalOpen = null;
            const openedReply = String((assistantCfg.prompts || {}).externalOpenedReply || '').trim();
            if (openedReply) renderAssistantRichReply(openedReply, lastSentMessage);
            chatBubble.classList.add('rg-bubble-visible');
          }
        }
        if (action.dataset.rgAction === 'cancel-open-external') {
          pendingExternalOpen = null;
          chatBubble.classList.remove('rg-bubble-visible');
        }
      });

      loadActionsMatrix();
      showWelcomeOnLoad();
      dismissAssistantBubble = () => {
        clearTimeout(assistantBubbleTimer);
        chatBubble.classList.remove('rg-bubble-visible');
      };

      return { widget, input };
    }

    // ── Pose system ──────────────────────────────────────────────────────────
    let currentPoseName = 'idle-stand';
    let settlePoseTimer = null;

    const poseImg = document.createElement('img');
    poseImg.id = 'rg-pose-img';
    poseImg.alt = '';
    poseImg.draggable = false;
    if (cfg.fallbackImage) {
      poseImg.addEventListener('error', () => { poseImg.src = cfg.fallbackImage; }, { once: true });
    }
    poseImg.src = POSES['idle-stand'] || '';
    avatar.appendChild(poseImg);

    let poseTimer = null;
    let settleTimer = null;
    let microIdleTimer = null;
    const motionCfg = cfg.animation || {};
    const springCfg = motionCfg.spring || {};

    function setMood(mode) {
      avatar.classList.remove('rg-mood-waiting', 'rg-mood-answering', 'rg-mood-error');
      if (mode) avatar.classList.add(`rg-mood-${mode}`);
    }

    function scheduleMicroIdle() {
      clearTimeout(microIdleTimer);
      avatar.classList.remove('rg-idle-alive');
      microIdleTimer = setTimeout(() => {
        if (!isDragging && !avatar.classList.contains('rg-talking')) avatar.classList.add('rg-idle-alive');
      }, Number(motionCfg.microIdleDelayMs || 1300));
    }

    function cancelMicroIdle() {
      clearTimeout(microIdleTimer);
      avatar.classList.remove('rg-idle-alive');
    }

    function applyPose(name) {
      if (!POSES[name] || name === currentPoseName) return;
      currentPoseName = name;
      poseImg.src = POSES[name];
    }

    function getAnticipationPose(nextPose) {
      if (['charge-angry', 'charge-rage', 'punch-forward', 'combat-fierce', 'combat-smug'].includes(nextPose)) return 'power-up';
      if (['point-left', 'point-left-happy', 'point-right', 'point-up', 'point-up-happy'].includes(nextPose)) return 'walk-happy';
      if (nextPose === 'surprised') return 'idle-happy';
      return null;
    }

    function getSettlePose(nextPose) {
      if (['charge-angry', 'charge-rage', 'punch-forward', 'combat-fierce', 'combat-smug'].includes(nextPose)) return 'fierce-stand';
      if (nextPose === 'surprised') return 'happy-smile';
      return null;
    }

    function setRobotPose(name, options) {
      const opts = options || {};
      if (!POSES[name]) return;
      if (opts.instant) {
        clearTimeout(poseTimer);
        clearTimeout(settleTimer);
        applyPose(name);
        return;
      }
      if (name === currentPoseName) return;
      clearTimeout(poseTimer);
      clearTimeout(settleTimer);

      const anticipationPose = getAnticipationPose(name);
      const anticipationMs = Number(motionCfg.anticipationMs || 0);
      const settleMs = Number(motionCfg.settleMs || 0);

      if (anticipationPose && anticipationPose !== name && anticipationMs > 0) {
        applyPose(anticipationPose);
        poseTimer = setTimeout(() => applyPose(name), anticipationMs);
      } else {
        applyPose(name);
      }

      const settlePose = getSettlePose(name);
      if (settlePose && settleMs > 0) {
        settleTimer = setTimeout(() => {
          if (!isDragging && !avatar.classList.contains('rg-talking') && currentPoseName === name) {
            applyPose(settlePose);
          }
        }, anticipationMs + settleMs);
      }
    }

    // ── Position state ───────────────────────────────────────────────────────
    let robotX = null, robotY = null;
    let renderX = null, renderY = null;
    let targetX = null, targetY = null;
    let velocityX = 0, velocityY = 0;
    let springRaf = null;
    let isDragging = false, dragMoved = false, userPinnedRobot = false;
    let dragStartX = 0, dragStartY = 0, pointerStartX = 0, pointerStartY = 0;

    let assistantFocusActive = false;
    let restorePinnedState = null;

    function getHeaderHeight() {
      const hdr = document.querySelector(cfg.headerSelector);
      return hdr ? hdr.offsetHeight : 68;
    }

    function getViewportMetrics() {
      const vv = window.visualViewport;
      if (!vv) {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          offsetLeft: 0,
          offsetTop: 0,
        };
      }
      return {
        width: Math.max(1, Math.round(vv.width)),
        height: Math.max(1, Math.round(vv.height)),
        offsetLeft: Math.round(vv.offsetLeft || 0),
        offsetTop: Math.round(vv.offsetTop || 0),
      };
    }

    function shouldUseKeyboardMode() {
      if (!cfg.iosKeyboard?.enabled || !assistantFocusActive) return false;
      const viewportWidth = getViewportMetrics().width;
      return viewportWidth <= Number(cfg.iosKeyboard?.mobileBreakpoint || 991);
    }

    function getRobotSize() {
      const isBottomCenter = (cfg.positioning?.mode || 'section-snap') === 'bottom-center';
      if (isBottomCenter) {
        const avatarRect = avatar.getBoundingClientRect();
        return {
          width: Math.max(56, Math.round(avatarRect.width || 86)),
          height: Math.max(56, Math.round(avatarRect.height || 86)),
        };
      }
      const rect = robot.getBoundingClientRect();
      return {
        width:  Math.max(240, Math.round(rect.width  || 240)),
        height: Math.max(64,  Math.round(rect.height || 86))
      };
    }

    function clampPosition(x, y) {
      const { width, height } = getRobotSize();
      const viewport = getViewportMetrics();
      const minY = getHeaderHeight() + 10;
      const minX = viewport.offsetLeft + 8;
      const maxX = viewport.offsetLeft + viewport.width - width - 8;
      const minYInViewport = Math.max(minY, viewport.offsetTop + 8);
      const maxY = viewport.offsetTop + viewport.height - height - 8;
      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minYInViewport, Math.min(maxY, y))
      };
    }

    function getDockPosition(forKeyboard = false) {
      const { width, height } = getRobotSize();
      const viewport = getViewportMetrics();
      const x = viewport.offsetLeft + (viewport.width - width) / 2 + Number(cfg.positioning?.dockOffsetX || 0);
      const assistantClearance = cfg.assistant?.enabled ? 60 : 0;
      let bottomMargin = Number(cfg.positioning?.dockBottomMargin || 10);
      if (forKeyboard) bottomMargin = Math.max(bottomMargin, Number(cfg.iosKeyboard?.focusDockBottomMargin || bottomMargin));
      const y = viewport.offsetTop + viewport.height - height - bottomMargin - assistantClearance;
      return clampPosition(x, y);
    }

    function dockToBottomCenter(animated = false, forKeyboard = false) {
      const dock = getDockPosition(forKeyboard);
      setPosition(dock.x, dock.y, animated);
    }

    function isOffscreen() {
      if (robotX == null || robotY == null) return false;
      const { width, height } = getRobotSize();
      const viewport = getViewportMetrics();
      return (
        robotX + width < viewport.offsetLeft ||
        robotX > viewport.offsetLeft + viewport.width ||
        robotY + height < viewport.offsetTop ||
        robotY > viewport.offsetTop + viewport.height
      );
    }

    function recoverIfOffscreen() {
      if (!isOffscreen()) return;
      userPinnedRobot = false;
      dockToBottomCenter(false);
    }

    function applyZonePose() {
      if (isDragging || avatar.classList.contains('rg-talking')) return;
      const cx = (robotX ?? 0) + (avatar.offsetWidth / 2 || 40);
      if      (cx < window.innerWidth * 0.38) setRobotPose('point-left-happy');
      else if (cx > window.innerWidth * 0.62) setRobotPose('point-right');
      else                                     setRobotPose('idle-stand');
      scheduleMicroIdle();
    }

    function applyTransform(x, y) {
      robot.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
    }

    function stopSpring() {
      if (springRaf) cancelAnimationFrame(springRaf);
      springRaf = null;
      velocityX = 0;
      velocityY = 0;
    }

    function startSpring() {
      if (springRaf) return;
      const k = Number(springCfg.stiffness || 0.16);
      const d = Number(springCfg.damping || 0.8);
      const rest = Number(springCfg.restDelta || 0.24);
      const step = () => {
        if (targetX == null || targetY == null || renderX == null || renderY == null) {
          springRaf = null;
          return;
        }
        const prevDx = targetX - renderX;
        const prevDy = targetY - renderY;
        velocityX = (velocityX + (targetX - renderX) * k) * d;
        velocityY = (velocityY + (targetY - renderY) * k) * d;
        renderX += velocityX;
        renderY += velocityY;
        const nextDx = targetX - renderX;
        const nextDy = targetY - renderY;
        if (prevDx !== 0 && Math.sign(prevDx) !== Math.sign(nextDx)) {
          renderX = targetX;
          velocityX = 0;
        }
        if (prevDy !== 0 && Math.sign(prevDy) !== Math.sign(nextDy)) {
          renderY = targetY;
          velocityY = 0;
        }
        applyTransform(renderX, renderY);
        const done = Math.abs(targetX - renderX) < rest && Math.abs(targetY - renderY) < rest && Math.abs(velocityX) < rest && Math.abs(velocityY) < rest;
        if (done) {
          renderX = targetX;
          renderY = targetY;
          applyTransform(renderX, renderY);
          springRaf = null;
          return;
        }
        springRaf = requestAnimationFrame(step);
      };
      springRaf = requestAnimationFrame(step);
    }

    function setPosition(x, y, animated = true) {
      const prev = { x: robotX, y: robotY };
      const next = clampPosition(x, y);
      robotX = next.x; robotY = next.y;
      targetX = robotX;
      targetY = robotY;
      if (renderX == null || renderY == null) {
        renderX = robotX;
        renderY = robotY;
      }
      if (animated) {
        startSpring();
      } else {
        stopSpring();
        renderX = targetX;
        renderY = targetY;
        applyTransform(renderX, renderY);
      }
      const moved = prev.x == null || Math.abs(prev.x - robotX) > 1 || Math.abs(prev.y - robotY) > 1;
      if (moved) {
        cancelMicroIdle();
        setRobotPose('walk-happy', { instant: true });
        clearTimeout(settlePoseTimer);
        if (!isDragging) settlePoseTimer = setTimeout(applyZonePose, animated ? 380 : 140);
      } else {
        applyZonePose();
      }
    }

    function moveToSection(sectionId, force = false) {
      if ((cfg.positioning?.mode || 'section-snap') === 'bottom-center') {
        if (!userPinnedRobot) dockToBottomCenter(false);
        return;
      }
      if (!force && userPinnedRobot) return;
      const section = document.getElementById(sectionId);
      if (!section) return;
      const anchor = section.querySelector('h1, h2, h3') || section;
      const rect = anchor.getBoundingClientRect();
      setPosition(
        rect.left + cfg.sectionSnapOffsetX,
        rect.top + Math.min(30, Math.max(8, rect.height * 0.45)),
        true
      );
      if (force) userPinnedRobot = false;
    }

    // ── Mouse-reactive poses ─────────────────────────────────────────────────
    let lastMx = -1, lastMy = -1, mouseVx = 0, mouseVy = 0;
    let poseCommitTimer = null, pendingPose = null;
    let idleTimer = null, idleRotIndex = 0;

    function computePose(mx, my, vx, vy) {
      const W = window.innerWidth, H = window.innerHeight;
      const speed = Math.sqrt(vx * vx + vy * vy);
      const rx = (robotX ?? 0) + (avatar.offsetWidth  / 2 || 40);
      const ry = (robotY ?? 0) + (avatar.offsetHeight / 2 || 40);
      const dist = Math.hypot(mx - rx, my - ry);

      if (dist < 90)   return speed > 10 ? 'surprised' : 'happy-cheer';
      if (speed > 35) {
        if (vx >  22)  return 'charge-angry';
        if (vx < -22)  return 'charge-rage';
        if (vy < -22)  return 'rage-spark';
        return 'punch-forward';
      }
      if (speed > 18) {
        if (Math.abs(vx) > Math.abs(vy)) return vx > 0 ? 'combat-smug' : 'combat-fierce';
        return vy < 0 ? 'point-up' : 'run-smug';
      }
      if (my < H * 0.2) return 'point-up-happy';
      if (mx < W * 0.33) return 'smug-stand';
      if (mx > W * 0.67) return 'fierce-stand';
      return 'idle-stand';
    }

    function commitPose(name) {
      pendingPose = name;
      clearTimeout(poseCommitTimer);
      poseCommitTimer = setTimeout(() => {
        if (!isDragging && !avatar.classList.contains('rg-talking')) setRobotPose(pendingPose);
      }, cfg.poseCommitMs);
    }

    function rotateIdle() {
      if (isDragging || avatar.classList.contains('rg-talking')) return;
      idleRotIndex = (idleRotIndex + 1) % cfg.idleRotation.length;
      setRobotPose(cfg.idleRotation[idleRotIndex]);
      idleTimer = setTimeout(rotateIdle, cfg.idleRotationInterval);
    }

    window.addEventListener('mousemove', (e) => {
      if (isDragging || avatar.classList.contains('rg-talking')) {
        lastMx = e.clientX; lastMy = e.clientY; return;
      }
      cancelMicroIdle();
      const dx = e.clientX - lastMx, dy = e.clientY - lastMy;
      if (lastMx >= 0) {
        const a = 0.15;
        mouseVx = a * dx + (1 - a) * mouseVx;
        mouseVy = a * dy + (1 - a) * mouseVy;
      }
      lastMx = e.clientX; lastMy = e.clientY;
      commitPose(computePose(e.clientX, e.clientY, mouseVx, mouseVy));
      clearTimeout(idleTimer);
      idleTimer = setTimeout(rotateIdle, cfg.idleRotationDelay);
    });

    // ── Drag ─────────────────────────────────────────────────────────────────
    function resolveDroppedSectionId(dropX, dropY) {
      const sectionIds = Array.isArray(cfg.sections) ? cfg.sections.filter(Boolean) : [];
      if (!sectionIds.length) return '';

      // First preference: section under the actual drop point.
      const stack = (typeof document.elementsFromPoint === 'function')
        ? document.elementsFromPoint(dropX, dropY)
        : [document.elementFromPoint(dropX, dropY)].filter(Boolean);
      for (const node of stack) {
        let cur = node;
        while (cur && cur !== document.body) {
          if (cur.id && sectionIds.includes(cur.id)) return cur.id;
          cur = cur.parentElement;
        }
      }

      // Fallback: nearest configured section by center-point distance.
      let bestId = '';
      let bestDistance = Infinity;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + (rect.width / 2);
        const cy = rect.top + (rect.height / 2);
        const dx = dropX - cx;
        const dy = dropY - cy;
        const distance = Math.hypot(dx, dy);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = id;
        }
      }
      const snapRadius = Math.max(0, Number(cfg.dropSectionSnapRadiusPx || 0));
      if (bestId && bestDistance <= snapRadius) return bestId;
      return '';
    }

    if (cfg.draggable) {
      avatar.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        isDragging = true; dragMoved = false;
        dragStartX = robotX ?? 20;
        dragStartY = robotY ?? (getHeaderHeight() + 16);
        pointerStartX = e.clientX; pointerStartY = e.clientY;
        userPinnedRobot = true;
        robot.classList.add('rg-dragging');
        cancelMicroIdle();
        setRobotPose('walk-happy', { instant: true });
      });
      window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - pointerStartX, dy = e.clientY - pointerStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
        setPosition(dragStartX + dx, dragStartY + dy, false);
      });
      window.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        const wasDragged = dragMoved;
        isDragging = false;
        robot.classList.remove('rg-dragging');
        if (wasDragged) {
          const droppedSectionId = resolveDroppedSectionId(e.clientX, e.clientY);
          if (droppedSectionId) {
            activeSectionId = droppedSectionId;
            showCommentary(droppedSectionId);
          } else {
            showRoamingCommentary();
          }
        }
        applyZonePose();
      });
    }

    // ── Commentary ───────────────────────────────────────────────────────────
    let bubbleTimer = null, streamToken = 0;
    const commentaryLastIndex = {};

    function dismissCommentaryBubble() {
      clearTimeout(bubbleTimer);
      bubble.classList.remove('rg-bubble-visible');
    }

    function nextStaticLine(sectionId) {
      const lines = (cfg.commentary[sectionId] || []).filter(Boolean);
      if (!lines.length) return null;
      if (lines.length === 1) return lines[0];
      const last = Number.isInteger(commentaryLastIndex[sectionId]) ? commentaryLastIndex[sectionId] : -1;
      let pick = Math.floor(Math.random() * lines.length);
      if (lines.length > 1 && pick === last) {
        pick = (pick + 1) % lines.length;
      }
      commentaryLastIndex[sectionId] = pick;
      return lines[pick];
    }

    function showRoamingCommentary() {
      const text = nextStaticLine('roaming') || String(cfg.commentaryFallback || '').trim();
      if (!text) return;
      showCommentaryText(text, 120);
    }

    async function fetchAiLine(sectionId) {
      if (!cfg.aiEndpoint) return null;
      try {
        const res = await fetch(cfg.aiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: sectionId, context: `ts:${Date.now()}` })
        });
        const data = await res.json();
        return data.text || null;
      } catch {
        return null;
      }
    }

    function typeText(text, token) {
      let idx = 0;
      bubble.classList.add('rg-bubble-visible');
      const { base, variance, pauseOnPunctuation } = cfg.typing;
      const tick = () => {
        if (token !== streamToken) return;
        idx = Math.min(text.length, idx + 1);
        bubble.textContent = text.slice(0, idx);
        if (idx < text.length) {
          const ch = text[idx - 1];
          setTimeout(tick, (ch === '.' || ch === ',') ? pauseOnPunctuation : base + Math.random() * variance);
        } else {
          setTimeout(() => { if (token === streamToken) stopTalking(); }, 500);
          bubbleTimer = setTimeout(() => bubble.classList.remove('rg-bubble-visible'), cfg.bubbleTimeout);
        }
      };
      tick();
    }

    function startTalking() {
      cancelMicroIdle();
      avatar.classList.add('rg-talking');
      setRobotPose('power-up', { instant: true });
      setTimeout(() => { if (avatar.classList.contains('rg-talking')) setRobotPose('point-up-happy', { instant: true }); }, 350);
    }

    function stopTalking() {
      avatar.classList.remove('rg-talking');
      applyZonePose();
    }

    function showCommentaryText(text, delayMs) {
      const line = String(text || '').trim();
      if (!line) return;
      clearTimeout(bubbleTimer);
      bubble.classList.remove('rg-bubble-visible');
      const myToken = ++streamToken;
      bubble.textContent = '';
      startTalking();
      setTimeout(() => {
        if (myToken !== streamToken) return;
        typeText(line, myToken);
      }, Math.max(0, Number(delayMs || 0)));
    }

    async function showCommentary(sectionId) {
      clearTimeout(bubbleTimer);
      bubble.classList.remove('rg-bubble-visible');
      const myToken = ++streamToken;
      bubble.textContent = '';
      startTalking();

      let text = null;
      if (cfg.aiEndpoint) text = await fetchAiLine(sectionId);
      if (!text)          text = nextStaticLine(sectionId);
      if (!text)          text = String(cfg.commentaryFallback || '').trim();
      if (!text)          return;

      if (myToken !== streamToken) return;
      setTimeout(() => {
        if (myToken !== streamToken) return;
        typeText(text, myToken);
      }, 120);
    }

    // ── Click avatar ─────────────────────────────────────────────────────────
    avatar.addEventListener('click', (e) => {
      if (dragMoved) { e.preventDefault(); return; }
      showCommentary(activeSectionId);
    });

    // ── Scroll spy ───────────────────────────────────────────────────────────
    let activeSectionId = cfg.sections[0] || '';

    if (cfg.scrollSpy && cfg.sections.length) {
      const obs = new IntersectionObserver((entries) => {
        let best = null, bestRatio = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            best = entry.target.id;
            bestRatio = entry.intersectionRatio;
          }
        });
        if (best && best !== activeSectionId) {
          activeSectionId = best;
          moveToSection(activeSectionId, false);
          showCommentary(activeSectionId);
        }
      }, { threshold: [0.3, 0.6] });

      cfg.sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) obs.observe(el);
      });
    }

    // ── Resize ───────────────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
      if (shouldUseKeyboardMode()) {
        dockToBottomCenter(false, true);
        return;
      }
      if (robotX == null) {
        if ((cfg.positioning?.mode || 'section-snap') === 'bottom-center') dockToBottomCenter(false);
        else moveToSection(activeSectionId, true);
        return;
      }
      recoverIfOffscreen();
      if ((cfg.positioning?.mode || 'section-snap') === 'bottom-center' && !userPinnedRobot) {
        dockToBottomCenter(false);
        return;
      }
      const c = clampPosition(robotX, robotY);
      setPosition(c.x, c.y, false);
      applyZonePose();
    });

    window.addEventListener('scroll', () => {
      if (shouldUseKeyboardMode()) {
        dockToBottomCenter(false, true);
        return;
      }
      if ((cfg.positioning?.mode || 'section-snap') === 'bottom-center' && !userPinnedRobot) {
        dockToBottomCenter(false);
      } else {
        recoverIfOffscreen();
      }
    }, { passive: true });

    // ── Init position ────────────────────────────────────────────────────────
    if ((cfg.positioning?.mode || 'section-snap') === 'bottom-center') {
      setTimeout(() => dockToBottomCenter(false), 80);
    } else if (cfg.sections.length) {
      setTimeout(() => moveToSection(activeSectionId, true), 100);
    } else {
      setPosition(16, getHeaderHeight() + 16, false);
    }
    const assistant = initAssistant();
    if (assistant) {
      assistantWidget = assistant.widget;
      assistantInputEl = assistant.input || null;
      if (assistantInputEl) {
        assistantInputEl.addEventListener('focus', () => {
          assistantFocusActive = true;
          if (cfg.iosKeyboard?.lockWhileTyping && restorePinnedState == null) {
            restorePinnedState = userPinnedRobot;
            userPinnedRobot = false;
          }
          dockToBottomCenter(false, true);
          setTimeout(() => dockToBottomCenter(false, true), 120);
        });
        assistantInputEl.addEventListener('blur', () => {
          assistantFocusActive = false;
          if (restorePinnedState != null) {
            userPinnedRobot = restorePinnedState;
            restorePinnedState = null;
          }
          if ((cfg.positioning?.mode || 'section-snap') === 'bottom-center' && !userPinnedRobot) {
            dockToBottomCenter(false);
          }
        });
      }
      if (window.visualViewport && cfg.iosKeyboard?.enabled) {
        const syncKeyboardDock = () => {
          if (!shouldUseKeyboardMode()) return;
          dockToBottomCenter(false, true);
        };
        window.visualViewport.addEventListener('resize', syncKeyboardDock);
        window.visualViewport.addEventListener('scroll', syncKeyboardDock);
      }
    }

    document.addEventListener('pointerdown', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (bubble.contains(target) || chatBubble.contains(target)) return;
      dismissCommentaryBubble();
      dismissAssistantBubble();
    });

    // ── Return public API ────────────────────────────────────────────────────
    return {
      moveTo:       (sectionId) => moveToSection(sectionId, true),
      say:          (text) => { const t = ++streamToken; startTalking(); setTimeout(() => typeText(text, t), 120); },
      trigger:      (sectionId) => { activeSectionId = sectionId; moveToSection(sectionId, true); showCommentary(sectionId); },
      setPose:      setRobotPose,
      setSection:   (id) => { activeSectionId = id; },
      openAssistant: () => assistantWidget?.querySelector('.rg-assist-input')?.focus(),
      closeAssistant: () => assistantWidget?.querySelector('.rg-assist-input')?.blur(),
      destroy:      () => {
        robot.remove();
        if (assistantWidget) assistantWidget.remove();
        document.body.classList.remove(cfg.bodyClass);
      },
    };
  }

  // ── Utility ────────────────────────────────────────────────────────────────
  function deepMerge(target, source) {
    const out = Object.assign({}, target);
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        out[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  return { init };
}));

// ── Auto-init from config file ─────────────────────────────────────────────
// If robot-guide.config.js was loaded before this file and set
// window.RobotGuideConfig, initialise automatically — no manual call needed.
(function () {
  if (typeof window.RobotGuideConfig === 'undefined') return;
  const config = window.RobotGuideConfig || {};
  const spec = config.businessSpecific || {};

  function normalizeProfileFolder(input) {
    let folder = String(input || '').trim().replace(/\\/g, '/');
    folder = folder.replace(/^\/+|\/+$/g, '');
    folder = folder.replace(/^wwwroot\//i, '');
    return folder;
  }

  function detectAppBasePath() {
    const scripts = Array.from(document.getElementsByTagName('script'));
    const current = document.currentScript;
    if (current && current.src) {
      try {
        const u = new URL(current.src, window.location.href);
        const marker = '/robot-guide/robot-guide.js';
        const idx = u.pathname.toLowerCase().indexOf(marker);
        if (idx >= 0) return u.pathname.slice(0, idx);
      } catch {}
    }
    for (const s of scripts) {
      const src = (s.getAttribute('src') || '').replace(/\\/g, '/');
      const lower = src.toLowerCase();
      const marker = '/robot-guide/robot-guide.js';
      const idx = lower.indexOf(marker);
      if (idx >= 0) {
        return src.slice(0, idx).replace(/^https?:\/\/[^/]+/i, '').replace(/\?.*$/, '');
      }
    }
    return '';
  }

  function buildProfileScriptSrc(folder, file) {
    if (!folder) return '';
    const basePath = detectAppBasePath().replace(/\/+$/g, '');
    const rel = `${folder.replace(/^\/+|\/+$/g, '')}/${file.replace(/^\/+|\/+$/g, '')}`;
    return `${basePath}/${rel}`;
  }

  function resolveBusinessScript() {
    if (spec.enabled === false) return { src: '', folder: '' };
    const folder = normalizeProfileFolder(spec.folderName || '');
    const file = String(spec.configFileName || 'robot-guide.custom.js').trim();
    const explicit = String(spec.configScriptPath || '').trim();
    const src = explicit || buildProfileScriptSrc(folder, file);
    return { src, folder };
  }

  function loadBusinessProfile(src) {
    if (!src) return Promise.resolve();
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => resolve(); // fallback to base config if profile file is missing
      document.head.appendChild(script);
    });
  }

  async function doInit() {
    const { src, folder } = resolveBusinessScript();
    if (config.assistant && folder) {
      // Sent to /api/chat so backend prompt loading matches selected custom folder.
      config.assistant.businessOverrideFolder = folder;
    }
    await loadBusinessProfile(src);
    window.robotGuide = window.RobotGuide.init(config);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { void doInit(); });
  } else {
    void doInit();
  }
}());
