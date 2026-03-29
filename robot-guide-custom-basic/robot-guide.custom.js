/**
 * Generic out-of-box RobotGuide profile.
 */
(function () {
  const base = window.RobotGuideConfig || {};
  const wittyWelcomeOptions = [
    'Welcome to the Lamborghini showcase. Ask me about design, specs, or performance.',
    'Buckle up. I can give you the quick tour on styling, aerodynamics, and power.',
    'Engines warm, assistant ready. Ask anything about this car and I will point you to the right section.',
    'Need the highlights first? I can jump you straight to performance, tech, or specs.',
    'Welcome in. I am your guide for the sharp lines, fast numbers, and standout features.',
    'Pit lane briefing: I can walk you through what matters most in under a minute.',
    'Ready for a fast lap? I can route you from design language to hard specs.',
    'I can keep it simple or go full gearhead, you choose.',
    'Say the word and I will steer you to performance, aero, tech, or heritage.',
    'Think of me as your co-pilot for this supercar tour.'
  ];
  const randomWelcome = () => wittyWelcomeOptions[Math.floor(Math.random() * wittyWelcomeOptions.length)];
  const overrides = {
    sections: ['hero', 'design', 'performance', 'aerodynamics', 'interior', 'technology', 'heritage', 'specs'],
    poses: { basePath: 'robot-guide/poses/' },
    fallbackImage: 'robot-guide/poses/idle-stand.png',
    bubbleTimeout: 10000,

    commentary: {
      hero: [
        'Welcome to the Lamborghini showcase.',
        'Need the quick lap? I got you.',
        'Fast tour or nerd mode, your call.',
        'This is where style meets horsepower.',
        'Big drama, real engineering, all in one.',
        'Start here and I will steer the rest.',
        'First glance wow, second glance numbers.',
        'This is the red carpet before the revs.',
        'Want the headline version? Two stops max.',
        'Grab the vibe here, then chase details.'
      ],
      design: [
        'Sharp lines, sharper intent.',
        'Pretty? Yes. Functional? Also yes.',
        'Every curve here is pulling double duty.',
        'This is design with a physics degree.',
        'Looks loud, works hard.',
        'Form and airflow are in a happy marriage.',
        'This is where beauty gets practical.',
        'Aggressive styling, disciplined engineering.',
        'It is art, but with wind tunnel receipts.',
        'Nothing random here, even the swagger.'
      ],
      performance: [
        'Horsepower lives here.',
        'This is the hold on tight section.',
        'Big numbers, real control.',
        'Seat back force explained politely.',
        'Fast is fun, stable is smarter.',
        'Raw output with actual manners.',
        'This is where speed meets precision.',
        'Metrics that make buyers grin.',
        'Acceleration and handling are friends here.',
        'If you love stats, welcome home.'
      ],
      aerodynamics: [
        'Air is the invisible co driver.',
        'This is wind wizardry in public.',
        'Downforce is doing heavy lifting here.',
        'Fast corners need smart airflow.',
        'Less float, more planted confidence.',
        'Wind tunnel ideas, road ready results.',
        'Aero here is performance, not decoration.',
        'Airflow tuning keeps chaos in check.',
        'This is where speed learns manners.',
        'At high pace, this stuff is everything.'
      ],
      interior: [
        'Welcome to the command center.',
        'Premium materials, race day posture.',
        'Everything here points to the driver.',
        'Luxury, but still business.',
        'Buttons where your instincts expect them.',
        'Comfort meets go time ergonomics.',
        'This cabin is built for focus.',
        'It feels expensive and purposeful.',
        'Driver first is not just a slogan here.',
        'Sit in, lock in, smile.'
      ],
      technology: [
        'Brains and brawn shake hands here.',
        'Drive modes are personality switches.',
        'Telemetry turns laps into insights.',
        'Software is helping the horsepower behave.',
        'This is the nerd candy aisle.',
        'Smart controls, zero fluff.',
        'Tech here is built to react fast.',
        'Real time feedback, real time fun.',
        'Digital precision meets mechanical chaos.',
        'If you like tuning knobs, enjoy.'
      ],
      heritage: [
        'Legacy mode: on.',
        'Old school attitude, modern engineering.',
        'History here still has horsepower.',
        'This is where icons teach new tricks.',
        'Not nostalgia, just strong DNA.',
        'Past wins still echo in this build.',
        'Heritage gives this machine its accent.',
        'Classic spirit, current speed.',
        'You can feel the lineage in the details.',
        'Origin story with useful context.'
      ],
      specs: [
        'Numbers, glorious numbers.',
        'This is the compare me section.',
        'All the key stats, no scavenger hunt.',
        'Fast facts for fast decisions.',
        'Here is the spreadsheet friendly view.',
        'Specs at a glance, drama optional.',
        'This is where hype meets math.',
        'Shortlist mode starts here.',
        'If you compare cars for fun, enjoy.',
        'Brochure talk translated into data.'
      ],
      roaming: [
        'Oof!',
        'Hey, that tickles.',
        'Nice drop!',
        'Careful, I am carrying horsepower.',
        'Bonk. Still street legal.',
        'That landing had drift energy.',
        'I stuck the landing. Mostly.',
        'Okay, that was a bumpy pit stop.',
        'You drop, I comment. Teamwork.',
        'Next drop gets style points too.'
      ]
    },

    assistant: {
      enabled: true,
      endpoint: '/api/chat',
      title: 'Chat',
      welcome: randomWelcome(),
      placeholder: 'Ask about design, V12 performance, aerodynamics, and specs...',
      maxInputLength: 300,
      model: 'gpt-4o-mini',
      stateful: true,
      actionLinksEnabled: true,
      autoOpenContactOnContactIntent: false,
      autoSendOnBlur: true,
      blurSendDelayMs: 220,
      contactIntentReply: 'I can walk you through the car details and key specs.',
      openContactSubject: 'General Inquiry',
      openContactPrefillPrefix: 'I have a question:',
      quickActionsEnabled: true,
      githubUrl: 'https://www.lamborghini.com',
      actionsConfigEndpoint: null,
      actionsMatrix: {
        definitions: {
          showCapabilities: {
            isEnabled: true,
            triggerPhrases: ['what can you do', 'help', 'commands', 'actions', 'capabilities'],
            jsFunctionCalled: 'showCapabilities',
            capabilityLabel: 'Show capabilities',
            displaySequence: 1
          },
          openWebsite: {
            isEnabled: true,
            triggerPhrases: ['open lamborghini site', 'official website', 'open website'],
            jsFunctionCalled: 'openGithub',
            capabilityLabel: 'Open official website',
            displaySequence: 2
          },
          goPerformance: {
            isEnabled: true,
            triggerPhrases: ['go to performance', 'show performance'],
            jsFunctionCalled: 'goSection',
            jsFunctionParamsCsv: 'performance',
            capabilityLabel: 'Go to Performance',
            displaySequence: 3
          }
        },
        dynamicNavigation: {
          routes: [
            { isEnabled: true, triggerPhrases: ['go to hero', 'show hero', 'scroll to hero'], jsFunctionCalled: 'goSection', jsFunctionParamsCsv: 'hero' },
            { isEnabled: true, triggerPhrases: ['go to design', 'show design', 'scroll to design'], jsFunctionCalled: 'goSection', jsFunctionParamsCsv: 'design' },
            { isEnabled: true, triggerPhrases: ['go to performance', 'show performance', 'scroll to performance'], jsFunctionCalled: 'goSection', jsFunctionParamsCsv: 'performance' },
            { isEnabled: true, triggerPhrases: ['go to aerodynamics', 'show aerodynamics', 'scroll to aerodynamics'], jsFunctionCalled: 'goSection', jsFunctionParamsCsv: 'aerodynamics' },
            { isEnabled: true, triggerPhrases: ['go to interior', 'show interior', 'scroll to interior'], jsFunctionCalled: 'goSection', jsFunctionParamsCsv: 'interior' },
            { isEnabled: true, triggerPhrases: ['go to technology', 'show technology', 'scroll to technology'], jsFunctionCalled: 'goSection', jsFunctionParamsCsv: 'technology' },
            { isEnabled: true, triggerPhrases: ['go to heritage', 'show heritage', 'scroll to heritage'], jsFunctionCalled: 'goSection', jsFunctionParamsCsv: 'heritage' },
            { isEnabled: true, triggerPhrases: ['go to specs', 'show specs', 'scroll to specs'], jsFunctionCalled: 'goSection', jsFunctionParamsCsv: 'specs' }
          ]
        }
      },
      actionHandlerName: 'RobotGuideActionHandler',
      prompts: {
        capabilitiesIntro: 'I can explain Lamborghini design, performance, and specs, navigate sections, and open the official website with confirmation.',
        openExternalConfirm: 'Want me to open the official Lamborghini website in a new tab?',
        sectionMissing: "I couldn't find that car section on this page.",
        openExternalConfirmYes: 'Yes, open it',
        openExternalConfirmNo: 'No thanks',
        openContactActionLabel: 'Open contact form',
        externalOpenedReply: 'Done - I opened that link in a new tab.',
        actionNoUrl: 'No URL is configured for this action.',
        actionDisabled: 'That action is currently disabled.',
        actionNoJsFunction: 'No js function is configured for this action.',
        actionHandlerMissing: 'No action handler is configured for this action.',
        actionFailed: 'I could not complete that action.',
        actionCompletedDefault: 'Done.',
        actionCompletedOpenContact: 'Done - I opened the contact form.',
        actionCompletedCloseContact: 'Done - I closed the contact form.',
        actionCompletedOpenExternal: 'Done - I opened that page in a new tab.',
        actionCompletedNavigate: 'Done - I navigated to that section.',
        actionCompletedNavigateWithTarget: 'Done - I navigated to {sectionId}.'
      },
      errorReply: 'Connection error. Please try again in a moment.'
    },

    tracking: {
      enabled: false,
      endpoint: null,
      category: 'chat'
    },

    draggable: true,
    scrollSpy: true,
    headerSelector: '.site-header',
    sectionSnapOffsetX: -90,
    positioning: {
      mode: 'bottom-center',
      dockBottomMargin: 20,
      dockOffsetX: 0
    },
    iosKeyboard: {
      enabled: true,
      mobileBreakpoint: 991,
      focusDockBottomMargin: 104,
      lockWhileTyping: true
    }
  };

  const merge = (target, source) => {
    for (const key of Object.keys(source)) {
      const src = source[key];
      const dst = target[key];
      if (src && typeof src === 'object' && !Array.isArray(src)) {
        target[key] = merge(dst && typeof dst === 'object' && !Array.isArray(dst) ? dst : {}, src);
      } else {
        target[key] = src;
      }
    }
    return target;
  };

  window.RobotGuideConfig = merge(base, overrides);

  window.RobotGuideActionHandler = {
    showCapabilities: ({ prompts }) => ({
      ok: true,
      silent: false,
      reply: prompts.capabilitiesIntro || 'Here is what I can do right now:'
    }),
    openGithub: ({ assistant, prompts, helpers }) => {
      const url = assistant.githubUrl || 'https://github.com';
      return helpers.requestExternalOpen({
        url,
        label: 'GitHub page',
        confirmText: prompts.openExternalConfirm || 'Want me to open this in a new tab?'
      });
    },
    goSection: ({ intent, prompts, helpers }) => {
      const sectionId = intent.sectionId || intent.params?.sectionId;
      const ok = helpers.navigateToSection(sectionId);
      return {
        ok,
        silent: ok,
        reply: ok ? '' : (prompts.sectionMissing || "I couldn't find that section on this page.")
      };
    }
  };
}());
