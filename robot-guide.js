/*!
 * RobotGuide v0.1.0
 * An embeddable AI-powered robot guide widget for websites.
 * https://github.com/Gauntlet-Systems/robot-guide
 * MIT License — © 2026 Gauntlet Systems LLC
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

    // Whether the robot is draggable
    draggable: true,

    // Offset robot snaps to when moving to a section heading (px left of element)
    sectionSnapOffsetX: -78,

    // Header element selector for top-boundary padding
    headerSelector: 'header, .site-header, nav',

    // Scroll spy: auto-move + comment as sections scroll into view
    scrollSpy: true,

    // Bubble display duration after typing completes (ms)
    bubbleTimeout: 5800,

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
    `;
    container.appendChild(guideEl);
    document.body.classList.add(cfg.bodyClass);

    const robot     = guideEl;
    const avatar    = guideEl.querySelector('#rg-avatar');
    const bubble    = guideEl.querySelector('#rg-bubble');

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

    function setRobotPose(name) {
      if (!POSES[name] || name === currentPoseName) return;
      currentPoseName = name;
      poseImg.src = POSES[name];
    }

    // ── Position state ───────────────────────────────────────────────────────
    let robotX = null, robotY = null;
    let isDragging = false, dragMoved = false, userPinnedRobot = false;
    let dragStartX = 0, dragStartY = 0, pointerStartX = 0, pointerStartY = 0;

    function getHeaderHeight() {
      const hdr = document.querySelector(cfg.headerSelector);
      return hdr ? hdr.offsetHeight : 68;
    }

    function getRobotSize() {
      const rect = robot.getBoundingClientRect();
      return {
        width:  Math.max(240, Math.round(rect.width  || 240)),
        height: Math.max(64,  Math.round(rect.height || 86))
      };
    }

    function clampPosition(x, y) {
      const { width, height } = getRobotSize();
      const minY = getHeaderHeight() + 10;
      return {
        x: Math.max(8, Math.min(window.innerWidth  - width  - 8, x)),
        y: Math.max(minY, Math.min(window.innerHeight - height - 8, y))
      };
    }

    function applyZonePose() {
      if (isDragging || avatar.classList.contains('rg-talking')) return;
      const cx = (robotX ?? 0) + (avatar.offsetWidth / 2 || 40);
      if      (cx < window.innerWidth * 0.38) setRobotPose('point-left-happy');
      else if (cx > window.innerWidth * 0.62) setRobotPose('point-right');
      else                                     setRobotPose('idle-stand');
    }

    function setPosition(x, y, animated = true) {
      const prev = { x: robotX, y: robotY };
      const next = clampPosition(x, y);
      robotX = next.x; robotY = next.y;
      robot.classList.toggle('rg-animated', animated);
      robot.style.transform = `translate3d(${Math.round(robotX)}px,${Math.round(robotY)}px,0)`;
      const moved = prev.x == null || Math.abs(prev.x - robotX) > 1 || Math.abs(prev.y - robotY) > 1;
      if (moved) {
        setRobotPose('walk-happy');
        clearTimeout(settlePoseTimer);
        if (!isDragging) settlePoseTimer = setTimeout(applyZonePose, animated ? 380 : 140);
      } else {
        applyZonePose();
      }
    }

    function moveToSection(sectionId, force = false) {
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
    if (cfg.draggable) {
      avatar.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        isDragging = true; dragMoved = false;
        dragStartX = robotX ?? 20;
        dragStartY = robotY ?? (getHeaderHeight() + 16);
        pointerStartX = e.clientX; pointerStartY = e.clientY;
        userPinnedRobot = true;
        robot.classList.add('rg-dragging');
        robot.classList.remove('rg-animated');
        setRobotPose('walk-happy');
      });
      window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - pointerStartX, dy = e.clientY - pointerStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
        setPosition(dragStartX + dx, dragStartY + dy, false);
      });
      window.addEventListener('pointerup', () => {
        if (!isDragging) return;
        isDragging = false;
        robot.classList.remove('rg-dragging');
        robot.classList.add('rg-animated');
        applyZonePose();
      });
    }

    // ── Commentary ───────────────────────────────────────────────────────────
    let bubbleTimer = null, streamToken = 0;
    const commentaryIndex = {};

    function nextStaticLine(sectionId) {
      const lines = (cfg.commentary[sectionId] || []).filter(Boolean);
      if (!lines.length) return null;
      const i = commentaryIndex[sectionId] || 0;
      commentaryIndex[sectionId] = (i + 1) % lines.length;
      return lines[i];
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
      avatar.classList.add('rg-talking');
      setRobotPose('power-up');
      setTimeout(() => { if (avatar.classList.contains('rg-talking')) setRobotPose('point-up-happy'); }, 350);
    }

    function stopTalking() {
      avatar.classList.remove('rg-talking');
      applyZonePose();
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
      if (!text)          text = 'Interesting section.';

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
      if (robotX == null) { moveToSection(activeSectionId, true); return; }
      const c = clampPosition(robotX, robotY);
      setPosition(c.x, c.y, false);
      applyZonePose();
    });

    // ── Init position ────────────────────────────────────────────────────────
    if (cfg.sections.length) {
      setTimeout(() => moveToSection(activeSectionId, true), 100);
    } else {
      setPosition(16, getHeaderHeight() + 16, false);
    }

    // ── Return public API ────────────────────────────────────────────────────
    return {
      moveTo:       (sectionId) => moveToSection(sectionId, true),
      say:          (text) => { const t = ++streamToken; startTalking(); setTimeout(() => typeText(text, t), 120); },
      trigger:      (sectionId) => { activeSectionId = sectionId; moveToSection(sectionId, true); showCommentary(sectionId); },
      setPose:      setRobotPose,
      setSection:   (id) => { activeSectionId = id; },
      destroy:      () => { robot.remove(); document.body.classList.remove(cfg.bodyClass); },
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

  return { init };
}));
