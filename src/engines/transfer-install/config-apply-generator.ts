export interface ConfigApplyOptions {
  localOs: 'windows-powershell' | 'linux-terminal' | 'macos-terminal';
  vpsIp: string;
  sshPort: number;
  sshUser: string;
  authMethod: 'password' | 'key';
  privateKeyPath?: string;
  stagingConfigPath: string;
  activeConfigPath: string;
  xrayBinaryPath: string;
  backupDir: string;
}

export function generateConfigApplyCommands(opts: ConfigApplyOptions): { preflight: string; backup: string; nativeTest: string; atomicReplace: string; verify: string; rollback: string } {
  const portArg = opts.sshPort && opts.sshPort !== 22 ? opts.sshPort : 22;
  const keyArg = opts.authMethod === 'key' && opts.privateKeyPath ? opts.privateKeyPath : '';
  const keyFlag = keyArg ? `-i "${keyArg}"` : '';

  const timestamp = '$(date +%Y%m%d-%H%M%S)';
  const backupPath = `${opts.backupDir}/config.json.${timestamp}.bak`;
  const tempRenamePath = `${opts.activeConfigPath}.tmp`;

  let preflight = '';
  let backup = '';
  let nativeTest = '';
  let atomicReplace = '';
  let verify = '';
  let rollback = '';

  if (opts.localOs === 'windows-powershell') {
    preflight = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "cat /etc/os-release && uname -m && ls -la ${opts.xrayBinaryPath} && ls -la ${opts.stagingConfigPath} && (ls -la ${opts.activeConfigPath} || echo 'No active config')"`;
    backup = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "mkdir -p ${opts.backupDir} && if [ -f ${opts.activeConfigPath} ]; then cp -p ${opts.activeConfigPath} ${opts.backupDir}/config.json.bak && sha256sum ${opts.backupDir}/config.json.bak; else echo 'No existing config to backup'; fi"`;
    nativeTest = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "${opts.xrayBinaryPath} run -test -config ${opts.stagingConfigPath}"`;
    atomicReplace = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "cp ${opts.stagingConfigPath} ${tempRenamePath} && chmod 600 ${tempRenamePath} && mv -f ${tempRenamePath} ${opts.activeConfigPath}"`;
    verify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "ls -la ${opts.activeConfigPath} && sha256sum ${opts.activeConfigPath} && ${opts.xrayBinaryPath} run -test -config ${opts.activeConfigPath}"`;
    rollback = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "if [ -f ${opts.backupDir}/config.json.bak ]; then cp -p ${opts.backupDir}/config.json.bak ${opts.activeConfigPath} && echo 'Rollback successful'; else echo 'No backup found'; fi"`;
  } else {
    preflight = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "cat /etc/os-release && uname -m && ls -la '${opts.xrayBinaryPath}' && ls -la '${opts.stagingConfigPath}' && (ls -la '${opts.activeConfigPath}' || echo 'No active config')"`;
    backup = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "mkdir -p '${opts.backupDir}' && if [ -f '${opts.activeConfigPath}' ]; then cp -p '${opts.activeConfigPath}' '${backupPath}' && sha256sum '${backupPath}'; else echo 'No existing config to backup'; fi"`;
    nativeTest = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "'${opts.xrayBinaryPath}' run -test -config '${opts.stagingConfigPath}'"`;
    atomicReplace = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "cp '${opts.stagingConfigPath}' '${tempRenamePath}' && chmod 600 '${tempRenamePath}' && mv -f '${tempRenamePath}' '${opts.activeConfigPath}'"`;
    verify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "ls -la '${opts.activeConfigPath}' && sha256sum '${opts.activeConfigPath}' && '${opts.xrayBinaryPath}' run -test -config '${opts.activeConfigPath}'"`;
    rollback = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "LATEST_BACKUP=\$(ls -t '${opts.backupDir}'/config.json.*.bak 2>/dev/null | head -n1); if [ -n \"\$LATEST_BACKUP\" ]; then cp -p \"\$LATEST_BACKUP\" '${opts.activeConfigPath}' && echo 'Rollback successful from \$LATEST_BACKUP'; else echo 'No backup found'; fi"`;
  }

  return { preflight, backup, nativeTest, atomicReplace, verify, rollback };
}
