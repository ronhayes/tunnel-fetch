export interface ProxyGeneratorOptions {
  socksPort: number;
  enableHttp: boolean;
  httpPort: number;
}

export function generateDownloaderProxyCommands(opts: ProxyGeneratorOptions) {
  const socksUrl = `socks5h://127.0.0.1:${opts.socksPort}`;
  const httpUrl = `http://127.0.0.1:${opts.httpPort}`;

  // Session-scoped environment variables
  const envExport = `export ALL_PROXY="${socksUrl}"\nexport all_proxy="${socksUrl}"${opts.enableHttp ? `\nexport HTTP_PROXY="${httpUrl}"\nexport HTTPS_PROXY="${httpUrl}"` : ''}`;
  const envCleanup = `unset ALL_PROXY all_proxy${opts.enableHttp ? ' HTTP_PROXY HTTPS_PROXY http_proxy https_proxy' : ''}`;

  // Tool-specific commands
  const curlCmd = `curl --proxy '${socksUrl}' --connect-timeout 10 --max-time 60 -sSL https://api.github.com`;
  const gitCmd = `git -c http.proxy='${socksUrl}' clone https://github.com/example/repo.git`;
  const wgetCmd = `# Wget proxy configuration (uses environment variables)\nexport all_proxy="${socksUrl}"\nwget -qO- https://api.github.com`;
  const npmCmd = `npm config set proxy ${opts.enableHttp ? httpUrl : socksUrl}\nnpm config set https-proxy ${opts.enableHttp ? httpUrl : socksUrl}`;
  const pipCmd = opts.enableHttp
    ? `pip install --proxy '${httpUrl}' package_name`
    : `# PIP requires HTTP proxy inbound. Enable HTTP in Step 04 or use socks5 via PySocks.\n# export all_proxy="${socksUrl}"`;
  const aptCmd = opts.enableHttp
    ? `echo 'Acquire::http::Proxy "${httpUrl}";' | sudo tee /etc/apt/apt.conf.d/99proxy`
    : `# APT requires HTTP proxy inbound. HTTP inbound is currently disabled in Step 04.`;
  const dockerCmd = opts.enableHttp
    ? `# Docker systemd drop-in configuration for HTTP proxy:\nsudo mkdir -p /etc/systemd/system/docker.service.d\necho -e "[Service]\\nEnvironment=\\"HTTP_PROXY=${httpUrl}\\" \\"HTTPS_PROXY=${httpUrl}\\"" | sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf\nsudo systemctl daemon-reload\nsudo systemctl restart docker`
    : `# Docker daemon proxy requires HTTP proxy inbound.`;

  return {
    envExport,
    envCleanup,
    curlCmd,
    gitCmd,
    wgetCmd,
    npmCmd,
    pipCmd,
    aptCmd,
    dockerCmd
  };
}
