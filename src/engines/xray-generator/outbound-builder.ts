import type { ParsedVpnConfig } from '../vpn-parser/types';
import type { GenerationWarning } from './types';

export function buildOutbounds(config: ParsedVpnConfig, warnings: GenerationWarning[]) {
  const proxyOutbound: any = {
    tag: 'proxy',
    protocol: config.protocol === 'shadowsocks' ? 'shadowsocks' : config.protocol,
    settings: {},
    streamSettings: {
      network: config.transport || 'tcp',
      security: config.security || 'none'
    }
  };

  // Protocol-specific settings
  if (config.protocol === 'vless') {
    proxyOutbound.settings = {
      vnext: [
        {
          address: config.server,
          port: config.port,
          users: [
            {
              id: config.uuid,
              encryption: config.encryption || 'none',
              flow: config.flow || ''
            }
          ]
        }
      ]
    };
  } else if (config.protocol === 'vmess') {
    proxyOutbound.settings = {
      vnext: [
        {
          address: config.server,
          port: config.port,
          users: [
            {
              id: config.uuid,
              alterId: config.alterId || 0,
              security: config.cipher || 'auto'
            }
          ]
        }
      ]
    };
  } else if (config.protocol === 'trojan') {
    proxyOutbound.settings = {
      servers: [
        {
          address: config.server,
          port: config.port,
          password: config.password
        }
      ]
    };
  } else if (config.protocol === 'shadowsocks') {
    proxyOutbound.settings = {
      servers: [
        {
          address: config.server,
          port: config.port,
          method: config.method,
          password: config.password
        }
      ]
    };
    if (config.plugin) {
      warnings.push({
        code: 'UNSUPPORTED_PLUGIN',
        message: `Shadowsocks plugin '${config.plugin}' was noted but standard TCP outbound was generated.`
      });
    }
  }

  // Stream settings (TLS / Reality / Transport)
  if (config.security === 'tls') {
    proxyOutbound.streamSettings.tlsSettings = {
      serverName: config.tls?.sni || config.server,
      fingerprint: config.tls?.fingerprint || 'chrome',
      alpn: config.tls?.alpn || ['h2', 'http/1.1'],
      allowInsecure: false
    };
  } else if (config.security === 'reality' && config.reality) {
    proxyOutbound.streamSettings.realitySettings = {
      show: false,
      serverName: config.reality.sni || config.server,
      fingerprint: config.tls?.fingerprint || 'chrome',
      publicKey: config.reality.publicKey,
      shortId: config.reality.shortId || '',
      spiderX: config.reality.spiderX || ''
    };
  }

  // Direct and Block outbounds
  const directOutbound = {
    tag: 'direct',
    protocol: 'freedom',
    settings: {}
  };

  const blockOutbound = {
    tag: 'block',
    protocol: 'blackhole',
    settings: {}
  };

  return [proxyOutbound, directOutbound, blockOutbound];
}
