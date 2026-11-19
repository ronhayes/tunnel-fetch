import type { ParsedVpnConfig } from '../vpn-parser/types';
import type { XrayGeneratorOptions, GenerationResult, GenerationWarning } from './types';
import { buildInbounds } from './inbound-builder';
import { buildOutbounds } from './outbound-builder';
import { buildRouting } from './routing-builder';
import { buildDns } from './dns-builder';

export function generateXrayConfig(
  config: ParsedVpnConfig | null,
  options: XrayGeneratorOptions
): GenerationResult {
  if (!config) {
    return {
      success: false,
      errors: [{ code: 'MISSING_CONFIG', message: 'No accepted VPN configuration provided to generator.' }],
      warnings: []
    };
  }

  const warnings: GenerationWarning[] = [];

  const inbounds = buildInbounds(options);
  const outbounds = buildOutbounds(config, warnings);
  const routing = buildRouting(options, warnings);
  const dns = buildDns(options);

  const xrayConfig: Record<string, any> = {
    log: {
      loglevel: 'warning'
    },
    ...(dns ? { dns } : {}),
    inbounds,
    outbounds,
    routing
  };

  const json = JSON.stringify(xrayConfig, null, 2);

  // Safe preview json with masked credentials
  const safeConfig = JSON.parse(json);
  if (safeConfig.outbounds && safeConfig.outbounds[0]) {
    const proxy = safeConfig.outbounds[0];
    if (proxy.settings?.vnext?.[0]?.users?.[0]) {
      proxy.settings.vnext[0].users[0].id = '12345678-****-****-****-************';
    }
    if (proxy.settings?.servers?.[0]) {
      if (proxy.settings.servers[0].password) proxy.settings.servers[0].password = '*******';
    }
  }
  const safeJson = JSON.stringify(safeConfig, null, 2);

  return {
    success: true,
    config: xrayConfig,
    json,
    safeJson,
    warnings,
    metadata: {
      targetVersion: options.targetVersion,
      generatedAt: new Date().toISOString(),
      protocol: config.protocol,
      server: config.server
    }
  };
}
