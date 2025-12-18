const fs = require('fs');

const DESIRED_MODE = 0o4755;

function formatUid(uid) {
  return typeof uid === 'number' ? uid : 'unknown';
}

async function ensureChromeSandboxPermissions(sandboxPath, log) {
  const logger = typeof log === 'function' ? log : () => {};

  try {
    await fs.promises.access(sandboxPath, fs.constants.X_OK);
  } catch (error) {
    logger(`chrome-sandbox missing or not executable at ${sandboxPath}: ${error.message}`);
    return false;
  }

  let stat;
  try {
    stat = await fs.promises.stat(sandboxPath);
  } catch (error) {
    logger(`Unable to read chrome-sandbox stats: ${error.message}`);
    return false;
  }

  const currentMode = stat.mode & 0o7777;
  const needsModeUpdate = currentMode !== DESIRED_MODE;
  const needsOwnerUpdate = typeof stat.uid === 'number' && stat.uid !== 0;

  if (!needsModeUpdate && !needsOwnerUpdate) {
    logger(`chrome-sandbox already has correct permissions at ${sandboxPath}`);
    return true;
  }

  const canChown = typeof process.geteuid === 'function' && process.geteuid() === 0;

  if (needsOwnerUpdate && !canChown) {
    logger(`chrome-sandbox is owned by uid ${formatUid(stat.uid)}; run with elevated privileges to set root ownership and setuid bit.`);
    return false;
  }

  try {
    if (needsOwnerUpdate && canChown) {
      await fs.promises.chown(sandboxPath, 0, typeof stat.gid === 'number' ? stat.gid : 0);
    }

    if (needsModeUpdate || needsOwnerUpdate) {
      await fs.promises.chmod(sandboxPath, DESIRED_MODE);
    }

    logger(`Adjusted chrome-sandbox permissions to mode 4755${needsOwnerUpdate ? ' with root ownership' : ''}.`);
    return true;
  } catch (error) {
    logger(`Unable to adjust chrome-sandbox permissions: ${error.message}`);
    return false;
  }
}

module.exports = {
  ensureChromeSandboxPermissions,
};
