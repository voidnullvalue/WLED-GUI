const fs = require('fs');
const path = require('path');
const { ensureChromeSandboxPermissions } = require('./sandboxPermissions');

/**
 * Ensure the bundled chrome-sandbox binary has the correct permissions on Linux
 * so Chromium's sandbox can start without disabling it.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') {
    return;
  }

  const sandboxPath = path.join(context.appOutDir, 'chrome-sandbox');

  const sandboxAdjusted = await ensureChromeSandboxPermissions(
    sandboxPath,
    (message) => context.packager.info(message),
  );

  if (!sandboxAdjusted) {
    try {
      await fs.promises.access(sandboxPath, fs.constants.F_OK);
      context.packager.info('chrome-sandbox permissions could not be fully adjusted; ensure root ownership after installation if sandbox errors occur.');
    } catch (error) {
      context.packager.info(`chrome-sandbox missing at ${sandboxPath}: ${error.message}`);
    }
  }
};
