/**
 * RobotGuide Configuration
 * ────────────────────────────────────────────────────────────────────────────
 * This is the ONLY file you need to edit.
 *
 * SETUP (3 steps):
 *   1. Copy the robot-guide/ folder into your site root
 *   2. Edit the config below — sections, commentary, poses path
 *   3. Add these three lines to your HTML (order matters):
 *
 *        <link rel="stylesheet" href="robot-guide/robot-guide.css" />
 *        <script src="robot-guide/robot-guide.config.js"></script>
 *        <script src="robot-guide/robot-guide.js"></script>
 *
 *   The robot initialises automatically. No other code required.
 *
 * INTEROP (optional):
 *   After init, window.robotGuide exposes the public API:
 *     window.robotGuide.trigger('section-id')  — move + comment
 *     window.robotGuide.say('Custom text!')    — say anything
 *     window.robotGuide.setPose('happy-cheer') — force a pose
 *     window.robotGuide.destroy()              — remove from page
 * ────────────────────────────────────────────────────────────────────────────
 */
window.RobotGuideConfig = {

  // ── Sections ──────────────────────────────────────────────────────────────
  // IDs of the page sections the robot reacts to, in scroll order.
  sections: ['hero', 'features', 'about', 'contact'],

  // ── Poses ─────────────────────────────────────────────────────────────────
  // Path to the poses/ folder relative to your site root.
  poses: {
    basePath: 'robot-guide/poses/',
    // Override individual poses if you bring your own images:
    // map: {
    //   'idle-stand': 'my-idle.png',
    //   'happy-cheer': 'my-happy.png',
    // }
  },

  // Shown if any pose image fails to load.
  fallbackImage: 'robot-guide/poses/idle-stand.png',

  // ── Commentary ────────────────────────────────────────────────────────────
  // Short punchy lines per section. 3–6 words works best.
  // Lines cycle each time the section is triggered.
  commentary: {
    hero:     ['Your tagline. Very short.', 'Make it punchy.'],
    features: ['Cool stuff lives here.', 'Worth a read.'],
    about:    ['Real humans. Promise.', 'No fluff zone.'],
    contact:  ['Just say hi.', 'One form. No spam.'],
  },

  // ── AI commentary (optional) ──────────────────────────────────────────────
  // Uncomment to fetch live AI-generated speech per section.
  // Your endpoint receives: POST { section: 'hero', context: '...' }
  // and should return: { text: 'Your short AI quip here.' }
  // Falls back to static commentary above if the request fails or is omitted.
  //
  // aiEndpoint: '/api/section-explain',

  // ── Behaviour ─────────────────────────────────────────────────────────────
  draggable:  true,   // Let users drag the robot anywhere
  scrollSpy:  true,   // Auto-move + comment as sections scroll into view

  // Selector for your sticky header — sets the top boundary for robot movement.
  headerSelector: 'header, .site-header, nav',

  // Horizontal offset (px) left of the section heading when robot snaps to it.
  sectionSnapOffsetX: -78,

};
