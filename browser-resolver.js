const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function findExecutable(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveBrowserExecutable(customPath = null) {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  if (process.env.BROWSER_PATH && fs.existsSync(process.env.BROWSER_PATH)) {
    return process.env.BROWSER_PATH;
  }

  const platform = os.platform();

  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';

    // Orden de preferencia: Brave -> Google Chrome -> Chromium
    const windowsCandidates = [
      // Brave
      path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      path.join(programFilesX86, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),

      // Google Chrome
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),

      // Chromium
      path.join(localAppData, 'Chromium', 'Application', 'chrome.exe'),
      path.join(programFiles, 'Chromium', 'Application', 'chrome.exe')
    ];

    const found = findExecutable(windowsCandidates);
    if (found) return found;

    // Intentar con where si está en PATH
    for (const bin of ['brave.exe', 'chrome.exe']) {
      try {
        const out = execSync(`where ${bin} 2>nul`, { encoding: 'utf8' }).trim().split('\r\n')[0];
        if (out && fs.existsSync(out)) return out;
      } catch (e) {}
    }
  } else if (platform === 'darwin') {
    // macOS
    const macCandidates = [
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      `${os.homedir()}/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`,
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      `${os.homedir()}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ];
    const found = findExecutable(macCandidates);
    if (found) return found;
  } else {
    // Linux y derivados
    const linuxCandidates = [
      '/usr/bin/brave-browser',
      '/usr/bin/brave',
      '/opt/brave.com/brave/brave-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/brave',
      '/snap/bin/chromium'
    ];
    const found = findExecutable(linuxCandidates);
    if (found) return found;

    // Buscar via which
    for (const bin of ['brave-browser', 'brave', 'google-chrome-stable', 'google-chrome', 'chromium']) {
      try {
        const out = execSync(`which ${bin} 2>/dev/null`, { encoding: 'utf8' }).trim();
        if (out && fs.existsSync(out)) return out;
      } catch (e) {}
    }
  }

  return null;
}

module.exports = {
  resolveBrowserExecutable
};
