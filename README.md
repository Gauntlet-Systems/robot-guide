# 🤖 RobotGuide

> An embeddable AI-powered robot guide widget for websites.  
> Two files. Zero dependencies. Works with any framework or plain HTML.

**[Live Demo →](https://gauntletsys.com)** · [Gauntlet Systems](https://gauntletsys.com) · MIT License

---

## What it does

RobotGuide adds a draggable character to your site that:

- **Follows scroll** — automatically moves to each section as visitors scroll through your page
- **Reacts to mouse movement** — 24 distinct named poses driven by mouse speed, direction, and proximity
- **Types commentary** — speech bubble with typewriter effect, one quip per section, cycling
- **Speaks with AI** — point it at any POST endpoint and get live-generated speech; falls back to static lines
- **Drags anywhere** — users can pin it wherever they want

No build step. No React. No jQuery. Drop in two files and call one function.

---

## Quick start

```html
<!-- 1. Styles in <head> -->
<link rel="stylesheet" href="robot-guide.css" />

<!-- 2. Script before </body> -->
<script src="robot-guide.js"></script>

<!-- 3. Init -->
<script>
const guide = RobotGuide.init({
  sections: ['hero', 'features', 'pricing', 'contact'],

  poses: {
    basePath: '/images/robot-poses/',
    // 24 named poses — override any subset via the map key
  },

  commentary: {
    hero:     ["Welcome! I'll be your guide today."],
    features: ["These features took a while to build. Worth it."],
    pricing:  ["No hidden fees. Scout's honor."],
    contact:  ["You made it this far — just say hi."],
  },

  // aiEndpoint: '/api/section-explain',
  // Optional — POST { section, context } → { text }
  // Fetches live AI commentary; falls back to static lines when omitted or null.

  draggable: true,
  scrollSpy: true,
});
</script>
```

---

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sections` | `string[]` | `[]` | Element IDs the robot reacts to |
| `poses.basePath` | `string` | `''` | Base URL for pose images |
| `poses.map` | `object` | 24 built-in names | Map of pose name → filename |
| `fallbackImage` | `string` | `null` | Image shown if a pose fails to load |
| `commentary` | `object` | `{}` | `sectionId → string[]` lines, cycling |
| `aiEndpoint` | `string` | `null` | POST endpoint for live AI commentary |
| `draggable` | `boolean` | `true` | Allow drag to reposition |
| `scrollSpy` | `boolean` | `true` | Auto-move on scroll |
| `sectionSnapOffsetX` | `number` | `-78` | Pixel offset left of section heading |
| `headerSelector` | `string` | `'header, .site-header, nav'` | Selector for top-boundary padding |
| `bubbleTimeout` | `number` | `5800` | ms before bubble hides after typing |
| `poseCommitMs` | `number` | `180` | ms mouse must hold a pose before switching |
| `idleRotation` | `string[]` | 4 calm poses | Poses to cycle through when mouse is idle |
| `idleRotationInterval` | `number` | `4000` | ms between idle pose rotations |
| `bodyClass` | `string` | `'rg-active'` | CSS class added to `<body>` while active |

---

## Public API

```js
const guide = RobotGuide.init(config);

guide.say('Hello from the robot!');   // Type text in the bubble
guide.moveTo('pricing');              // Move to any section ID
guide.setPose('happy-cheer');         // Force a specific pose
guide.setSection('about');            // Update the active section
guide.destroy();                      // Remove widget + clean up
```

---

## Pose reference

All 24 named poses and their intended use:

| Name | Trigger |
|------|---------|
| `idle-stand` | Default idle, mouse center |
| `idle-happy` | Idle rotation |
| `happy-cheer` | Mouse near robot (slow) |
| `happy-smile` | Idle rotation |
| `surprised` | Mouse near robot (fast) |
| `smug-stand` | Mouse idle on left side |
| `fierce-stand` | Mouse idle on right side |
| `point-left` | Slow mouse moving left |
| `point-left-happy` | Robot positioned on left side |
| `point-right` | Slow mouse moving right / robot on right |
| `point-up` | Medium mouse moving up |
| `point-up-happy` | Mouse parked at top of screen |
| `walk-happy` | Robot moving / being dragged slowly |
| `lunge-forward` | Fast drag |
| `run-smug` | Medium mouse speed downward |
| `combat-smug` | Medium-fast mouse moving right |
| `combat-fierce` | Medium-fast mouse moving left |
| `charge-angry` | Fast mouse sweep right |
| `charge-rage` | Fast mouse sweep left |
| `rage-spark` | Fast mouse sweep upward |
| `punch-forward` | Fast mouse, general direction |
| `angry-spark` | Supplemental angry pose |
| `angry-weapon` | Supplemental aggressive pose |
| `power-up` | Start of talking sequence |

---

## Bring your own character

The widget is character-agnostic. Supply any set of PNG images:

```js
RobotGuide.init({
  poses: {
    basePath: '/images/my-character/',
    map: {
      'idle-stand': 'standing.png',
      'happy-cheer': 'celebrating.png',
      // ... only override what you have
    }
  },
  fallbackImage: '/images/my-character/default.png',
});
```

Use the full 24-pose set for maximum reactivity, or start with 3-4 key poses and the fallback handles the rest.

---

## AI commentary endpoint

Any backend works. Here's the expected contract:

**Request**
```json
POST /api/section-explain
{ "section": "pricing", "context": "ts:1748123456789" }
```

**Response**
```json
{ "text": "No hidden fees here. Just honest pricing for real work." }
```

If the endpoint is unavailable or returns an error, the widget falls back silently to your static `commentary` lines.

Example implementation in ASP.NET Core:

```csharp
app.MapPost("/api/section-explain", async (SectionRequest req, ...) =>
{
    // ... call OpenAI or any LLM
    return Results.Ok(new { text = generatedLine });
});
```

---

## Theming

All CSS is scoped to `.rg-active` on `<body>` — zero conflict with your existing styles.

**Dark theme** — add `rg-dark` to `<body>`:
```html
<body class="rg-dark">
```

**Custom colors** — override CSS variables or the scoped classes directly:
```css
.rg-active .rg-avatar {
  background: radial-gradient(circle at 35% 30%, #ff7b7b 0%, #ff3b3b 100%);
}
.rg-active .rg-bubble {
  background: #1a1a2e;
  color: #e0e0ff;
  border-color: #3a3a6e;
}
```

---

## Built by

[Gauntlet Systems](https://gauntletsys.com) — full-stack engineering and agentic AI delivery.

The live version of this widget runs on [gauntletsys.com](https://gauntletsys.com) with 24 custom poses, drag-and-drop positioning, and live AI commentary powered by GPT-4o.

Want one for your site? [Start a conversation →](https://gauntletsys.com/#contact)

---

## License

MIT — use it, fork it, ship it.
