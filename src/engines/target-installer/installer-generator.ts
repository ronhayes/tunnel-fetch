export interface TargetInstallerOptions {
  url: string;
  filename: string;
  destinationDir: string;
  expectedSha256?: string;
  socksPort: number;
  mode: 'download-only' | 'download-review' | 'execute-confirm';
}

export function generateTargetInstallerCommands(opts: TargetInstallerOptions) {
  const proxyUrl = `socks5h://127.0.0.1:${opts.socksPort}`;
  const safeDest = opts.destinationDir || '/tmp';
  const targetPath = `${safeDest}/${opts.filename}`;

  // 1. Download command using curl via socks5h
  const downloadCmd = `curl --fail --show-error --location --connect-timeout 10 --max-time 300 --proto '=https' --proto-redir '=https' --proxy '${proxyUrl}' -o '${targetPath}.pending' '${opts.url}' && mv -f '${targetPath}.pending' '${targetPath}'`;

  // 2. Integrity check command
  const integrityCmd = opts.expectedSha256
    ? `echo '${opts.expectedSha256}  ${targetPath}' | sha256sum -c -`
    : `sha256sum '${targetPath}'`;

  // 3. File inspection command
  const inspectCmd = `file '${targetPath}' && stat '${targetPath}' && ls -la '${targetPath}'`;

  // 4. Execution confirmation command (only for execute-confirm mode)
  const executeCmd = opts.mode === 'execute-confirm'
    ? `chmod +x '${targetPath}' && '${targetPath}'`
    : `# Execution is disabled in ${opts.mode} mode. Review file manually.`;

  return {
    downloadCmd,
    integrityCmd,
    inspectCmd,
    executeCmd
  };
}
