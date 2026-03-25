# 🤖 RobotGuide

> An embeddable AI-powered robot guide widget for websites.  
> One folder. One config file. Three HTML lines.

**[Live Demo →](https://gauntletsys.com)** · [Gauntlet Systems](https://gauntletsys.com) · MIT License

---

## What it does

RobotGuide adds a draggable character to your site that:

- **Follows scroll** — automatically moves to each section as visitors scroll through your page
- **Reacts to mouse movement** — 24 distinct named poses driven by mouse speed, direction, and proximity
- **Types commentary** — speech bubble with typewriter effect, one quip per section, cycling
- **Speaks with AI** — point it at any POST endpoint and get live-generated speech; falls back to static lines
- **Drags anywhere** — users can pin it wherever they want

No build step. No React. No jQuery. Copy one folder, edit one file.

---

## Quick start

**Step 1** — Copy the `robot-guide/` folder into your site root.

**Step 2** — Edit `robot-guide/robot-guide.config.js` with your sections and commentary.

**Step 3** — Add these three lines to your HTML (order matters):

```html
<link rel="stylesheet" href="robot-guide/robot-guide.css" />
<script src="robot-guide/robot-guide.config.js"></script>
<script src="robot-guide/robot-guide.js"></script>
```

That's it. The robot initialises automatically — no extra script required.

---

### robot-guide.config.js

This is the **only file you need to edit**. Everything lives here:

```js
window.RobotGuideConfig = {

  sections: ['hero', 'features', 'pricing', 'contact'],

  poses: {
    basePath: 'robot-guide/poses/',
    // override individual poses if you bring your own images:
    // map: { 'idle-stand': 'my-idle.png' }
  },

  commentary: {
    hero:     ["Welcome! I'm your guide."],
    features: ["These took a while. Worth it."],
    pricing:  ["No hidden fees. Scout's honor."],
    contact:  ["You made it. Just say hi."],
  },

  // aiEndpoint: '/api/section-explain',
  // Optional — POST { section, context } → { text }
  // Fetches live AI commentary; falls back to static lines when omitted or null.

  draggable: true,
  scrollSpy: true,
  headerSelector: 'header, .site-header, nav',
  sectionSnapOffsetX: -78,

};
```

---

### Controlling the robot from your own JS

After auto-init, the public API is available on `window.robotGuide`:

```js
window.robotGuide.trigger('contact');      // move to section + comment
window.robotGuide.say('Custom text!');    // say anything
window.robotGuide.setPose('happy-cheer'); // force a pose
window.robotGuide.destroy();              // remove from page
```

---

### Manual init (advanced)

If you prefer explicit control — or need to pass dynamic values — skip the config
file and call `RobotGuide.init()` directly after loading the script:

```html
<link rel="stylesheet" href="robot-guide/robot-guide.css" />
<script src="robot-guide/robot-guide.js"></script>
<script>
  const guide = RobotGuide.init({
    sections: ['hero', 'features', 'contact'],
    poses: { basePath: 'robot-guide/poses/' },
    commentary: { hero: ['Hello!'] },
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
