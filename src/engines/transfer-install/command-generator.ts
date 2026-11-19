export interface TransferOptions {
  localOs: 'windows-powershell' | 'linux-terminal' | 'macos-terminal';
  vpsIp: string;
  sshPort: number;
  sshUser: string;
  authMethod: 'password' | 'key';
  privateKeyPath?: string;
  remoteStagingDir: string;
  zipFilename: string;
  expectedSha256: string;
}

export function generateTransferCommands(opts: TransferOptions): { preflight: string; transfer: string; verify: string; inspect: string; install: string; postVerify: string } {
  const portArg = opts.sshPort && opts.sshPort !== 22 ? opts.sshPort : 22;
  const keyArgKey = opts.authMethod === 'key' && opts.privateKeyPath ? opts.privateKeyPath : '';

  let preflight = '';
  let transfer = '';
  let verify = '';
  let inspect = '';
  let install = '';
  let postVerify = '';

  const remoteZipPath = `${opts.remoteStagingDir}/${opts.zipFilename}`;

  if (opts.localOs === 'windows-powershell') {
    const keyFlagPowerShell = keyArgKey ? `-i "${keyArgKey}"` : '';
    preflight = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagPowerShell} "install -d -m 700 ${opts.remoteStagingDir} && cat /etc/os-release && uname -m && id && command -v systemctl && command -v sha256sum && command -v unzip"`;
    // Point directly to user's Downloads folder where browser saves files by default
    transfer = `scp -P ${portArg} ${keyFlagPowerShell} "$HOME\\Downloads\\${opts.zipFilename}" ${opts.sshUser}@${opts.vpsIp}:${opts.remoteStagingDir}/`;
    verify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagPowerShell} "echo '${opts.expectedSha256}  ${remoteZipPath}' | sha256sum -c -"`;
    inspect = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagPowerShell} "unzip -t ${remoteZipPath} && unzip -l ${remoteZipPath}"`;
    install = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagPowerShell} "mkdir -p ${opts.remoteStagingDir}/extracted && unzip -q ${remoteZipPath} -d ${opts.remoteStagingDir}/extracted && cd ${opts.remoteStagingDir}/extracted && sudo bash scripts/install.sh"`;
    postVerify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagPowerShell} "/usr/local/bin/xray version && systemctl cat xray && systemctl is-active xray && systemctl is-enabled xray"`;
  } else {
    // Linux / macOS Bash
    const keyFlagBash = keyArgKey ? `-i "${keyArgKey}"` : '';
    preflight = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagBash} "install -d -m 700 '${opts.remoteStagingDir}' && cat /etc/os-release && uname -m && id && command -v systemctl && command -v sha256sum && command -v unzip"`;
    transfer = `scp -P ${portArg} ${keyFlagBash} "$HOME/Downloads/${opts.zipFilename}" "${opts.sshUser}@${opts.vpsIp}:${opts.remoteStagingDir}/"`;
    verify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagBash} "echo '${opts.expectedSha256}  ${remoteZipPath}' | sha256sum -c -"`;
    inspect = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagBash} "unzip -t '${remoteZipPath}' && unzip -l '${remoteZipPath}'"`;
    install = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagBash} "mkdir -p '${opts.remoteStagingDir}/extracted' && unzip -q '${remoteZipPath}' -d '${opts.remoteStagingDir}/extracted' && cd '${opts.remoteStagingDir}/extracted' && sudo bash scripts/install.sh"`;
    postVerify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlagBash} "/usr/local/bin/xray version && systemctl cat xray && systemctl is-active xray && systemctl is-enabled xray"`;
  }

  return { preflight, transfer, verify, inspect, install, postVerify };
}
