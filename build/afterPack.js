const fs = require('fs');
const path = require('path');

/**
 * Ensure the bundled chrome-sandbox binary has the correct permissions on Linux
 * so Chromium's sandbox can start without disabling it.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') {
    return;
  }

  const sandboxPath = path.join(context.appOutDir, 'chrome-sandbox');

  try {
    await fs.promises.access(sandboxPath, fs.constants.X_OK);
  } catch (error) {
    context.packager.info(`chrome-sandbox missing or not executable at ${sandboxPath}: ${error.message}`);
    return;
  }

  try {
    const currentMode = (await fs.promises.stat(sandboxPath)).mode & 0o7777;

    if (currentMode !== 0o4755) {
      await fs.promises.chmod(sandboxPath, 0o4755);
      context.packager.info(`Set setuid permissions on ${sandboxPath}`);
    } else {
      context.packager.info(`chrome-sandbox already has correct permissions at ${sandboxPath}`);
    }
  } catch (error) {
    context.packager.info(`Unable to adjust chrome-sandbox permissions: ${error.message}`);
  }
};
