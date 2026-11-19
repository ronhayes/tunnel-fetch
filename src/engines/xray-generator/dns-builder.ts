import type { XrayGeneratorOptions } from './types';

export function buildDns(options: XrayGeneratorOptions) {
  if (!options.dnsServers || options.dnsServers.length === 0) {
    return undefined;
  }

  return {
    servers: options.dnsServers
  };
}
