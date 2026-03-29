/**
 * RobotGuide core bootstrap config.
 * Keep this file generic; all behavior lives in the selected custom folder.
 */
window.RobotGuideConfig = {
  businessSpecific: {
    enabled: true,
    // Switch this to activate a different custom profile folder.
    // Example: 'robot-guide-custom-gauntletsystems'
    // You may also enter 'wwwroot/robot-guide-custom-gauntletsystems' (normalized automatically).
    folderName: 'robot-guide-custom-basic',
    configFileName: 'robot-guide.custom.js'
  },
  assistant: {}
};
