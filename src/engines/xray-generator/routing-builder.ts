import type { XrayGeneratorOptions, GenerationWarning } from './types';

export function buildRouting(options: XrayGeneratorOptions, warnings: GenerationWarning[]) {
  const rules: any[] = [];

  // 1. Private IPs direct routing
  if (options.enablePrivateIpDirect) {
    rules.push({
      type: 'field',
      ip: ['geoip:private'],
      outboundTag: 'direct'
    });
  }

  // 2. Iran GeoIP direct routing
  if (options.enableIranDirect) {
    warnings.push({
      code: 'GEODATA_DEPENDENCY',
      message: 'Iran domestic direct routing (geoip:ir) requires geosite.dat and geoip.dat assets on the VPS.'
    });
    rules.push({
      type: 'field',
      ip: ['geoip:ir'],
      outboundTag: 'direct'
    });
  }

  // Default rule: everything else goes to proxy
  return {
    domainStrategy: 'IPOnDemand',
    rules
  };
}
