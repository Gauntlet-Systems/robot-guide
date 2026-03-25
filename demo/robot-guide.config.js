/**
 * RobotGuide Demo Configuration
 * Edit this file to customise the robot for your own site.
 */
window.RobotGuideConfig = {

  sections: ['hero', 'features', 'usage', 'api'],

  poses: {
    basePath: '../poses/',
  },

  fallbackImage: '../poses/idle-stand.png',

  commentary: {
    hero: [
      'Two files. No NPM required.',
      'The robot is also the demo. Meta.',
    ],
    features: [
      '24 poses. I counted. Twice.',
      'Angry if you mouse too fast.',
    ],
    usage: [
      'Seriously, just 3 lines.',
      'Copy that snippet. I\'ll wait.',
    ],
    api: [
      'say() is my favourite method.',
      'destroy() feels harsh but ok.',
    ],
  },

  // aiEndpoint: '/api/section-explain',
  // Optional — POST { section, context } → { text }
  // Falls back to static commentary above when not set.

  draggable: true,
  scrollSpy: true,
  headerSelector: 'header',
  sectionSnapOffsetX: -78,

};
