import type { XrayGeneratorOptions } from './types';

export function buildInbounds(options: XrayGeneratorOptions) {
  const inbounds: any[] = [
    {
      tag: 'socks-in',
      port: options.socksPort,
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: {
        auth: 'noauth',
        udp: true,
        ip: '127.0.0.1'
      },
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls', 'quic']
      }
    }
  ];

  if (options.enableHttpInbound) {
    inbounds.push({
      tag: 'http-in',
      port: options.httpPort,
      listen: '127.0.0.1',
      protocol: 'http',
      settings: {
        auth: 'noauth'
      },
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls', 'quic']
      }
    });
  }

  return inbounds;
}
