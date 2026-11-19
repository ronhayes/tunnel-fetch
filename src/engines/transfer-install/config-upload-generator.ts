export interface ConfigUploadOptions {
  localOs: 'windows-powershell' | 'linux-terminal' | 'macos-terminal';
  vpsIp: string;
  sshPort: number;
  sshUser: string;
  authMethod: 'password' | 'key';
  privateKeyPath?: string;
  stagingDir: string;
  expectedSha256: string;
}

export function generateConfigUploadCommands(opts: ConfigUploadOptions): { prepare: string; upload: string; verify: string; promote: string; postVerify: string } {
  const portArg = opts.sshPort && opts.sshPort !== 22 ? opts.sshPort : 22;
  const keyArg = opts.authMethod === 'key' && opts.privateKeyPath ? opts.privateKeyPath : '';

  let prepare = '';
  let upload = '';
  let verify = '';
  let promote = '';
  let postVerify = '';

  const remotePendingPath = `${opts.stagingDir}/config.json.pending`;
  const remoteFinalPath = `${opts.stagingDir}/config.json`;

  if (opts.localOs === 'windows-powershell') {
    const keyFlag = keyArg ? `-i "${keyArg}"` : '';
    prepare = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "umask 077 && mkdir -p ${opts.stagingDir}"`;
    upload = `scp -P ${portArg} ${keyFlag} .\\config.json ${opts.sshUser}@${opts.vpsIp}:${remotePendingPath}`;
    verify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "echo '${opts.expectedSha256}  ${remotePendingPath}' | sha256sum -c -"`;
    promote = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "chmod 600 ${remotePendingPath} && mv -f ${remotePendingPath} ${remoteFinalPath}"`;
    postVerify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "ls -la ${remoteFinalPath} && sha256sum ${remoteFinalPath}"`;
  } else {
    const keyFlag = keyArg ? `-i "${keyArg}"` : '';
    prepare = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "umask 077 && mkdir -p '${opts.stagingDir}'"`;
    upload = `scp -P ${portArg} ${keyFlag} './config.json' '${opts.sshUser}@${opts.vpsIp}:${remotePendingPath}'`;
    verify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "echo '${opts.expectedSha256}  ${remotePendingPath}' | sha256sum -c -"`;
    promote = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "chmod 600 '${remotePendingPath}' && mv -f '${remotePendingPath}' '${remoteFinalPath}'"`;
    postVerify = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "ls -la '${remoteFinalPath}' && sha256sum '${remoteFinalPath}'"`;
  }

  return { prepare, upload, verify, promote, postVerify };
}
