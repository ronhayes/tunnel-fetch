export interface ConnectivityOptions {
  localOs: 'windows-powershell' | 'linux-terminal' | 'macos-terminal';
  vpsIp: string;
  sshPort: number;
  sshUser: string;
  authMethod: 'password' | 'key';
  privateKeyPath?: string;
  socksPort: number;
}

export function generateConnectivityCommands(opts: ConnectivityOptions): { serviceControl: string; listenerCheck: string; socksTest: string; cloudflareTrace: string; diagnostics: string } {
  const portArg = opts.sshPort && opts.sshPort !== 22 ? opts.sshPort : 22;
  const keyArg = opts.authMethod === 'key' && opts.privateKeyPath ? opts.privateKeyPath : '';
  const keyFlag = keyArg ? `-i "${keyArg}"` : '';

  const proxyUrl = `socks5h://127.0.0.1:${opts.socksPort}`;

  let serviceControl = '';
  let listenerCheck = '';
  let socksTest = '';
  let cloudflareTrace = '';
  let diagnostics = '';

  if (opts.localOs === 'windows-powershell') {
    serviceControl = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "systemctl daemon-reload && systemctl start xray && systemctl status xray --no-pager"`;
    listenerCheck = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "ss -lntup | grep -E '127.0.0.1:${opts.socksPort}|xray'"`;
    socksTest = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "curl --proxy '${proxyUrl}' --connect-timeout 10 --max-time 20 -s -I https://api.github.com"`;
    cloudflareTrace = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "curl --proxy '${proxyUrl}' --connect-timeout 10 --max-time 20 -s https://www.cloudflare.com/cdn-cgi/trace"`;
    diagnostics = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "journalctl -u xray -n 50 --no-pager"`;
  } else {
    serviceControl = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "systemctl daemon-reload && systemctl start xray && systemctl status xray --no-pager"`;
    listenerCheck = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "ss -lntup | grep -E '127.0.0.1:${opts.socksPort}|xray'"`;
    socksTest = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "curl --proxy '${proxyUrl}' --connect-timeout 10 --max-time 20 -s -I https://api.github.com"`;
    cloudflareTrace = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "curl --proxy '${proxyUrl}' --connect-timeout 10 --max-time 20 -s https://www.cloudflare.com/cdn-cgi/trace"`;
    diagnostics = `ssh ${opts.sshUser}@${opts.vpsIp} -p ${portArg} ${keyFlag} "journalctl -u xray -n 50 --no-pager"`;
  }

  return { serviceControl, listenerCheck, socksTest, cloudflareTrace, diagnostics };
}
