import type { ParseResult, VmessParsedConfig, ParseError, ParseWarning } from '../types';
import { safeBase64Decode } from '../shared/base64';
import { isValidUuid, isValidHost, isValidPort } from '../shared/validation';

export function parseVmess(uri: string): ParseResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];

  try {
    const urlStr = uri.trim();
    if (!urlStr.startsWith('vmess://')) {
      errors.push({ code: 'INVALID_SCHEME', message: 'URI does not start with vmess://', severity: 'FATAL' });
      return { success: false, errors, warnings };
    }

    const base64Part = urlStr.substring(8);
    const decodeResult = safeBase64Decode(base64Part);

    if (!decodeResult.success || !decodeResult.decoded) {
      errors.push({ code: 'INVALID_BASE64', message: decodeResult.error || 'Failed to decode VMess base64 payload', severity: 'FATAL' });
      return { success: false, errors, warnings };
    }

    let jsonConfig: any;
    try {
      jsonConfig = JSON.parse(decodeResult.decoded);
    } catch {
      errors.push({ code: 'INVALID_JSON', message: 'Decoded VMess payload is not valid JSON', severity: 'FATAL' });
      return { success: false, errors, warnings };
    }

    const name = jsonConfig.ps || 'VMess Server';
    const server = jsonConfig.add;
    const port = Number(jsonConfig.port);
    const uuid = jsonConfig.id;
    const alterId = Number(jsonConfig.aid || 0);
    const cipher = jsonConfig.scy || 'auto';
    const net = jsonConfig.net || 'tcp';
    const tlsRaw = jsonConfig.tls || jsonConfig.tlsg || '';
    const tls = tlsRaw === 'tls' || tlsRaw === true ? 'tls' : 'none';
    const sni = jsonConfig.sni || jsonConfig.host || undefined;

    if (!server || !isValidHost(server)) {
      errors.push({ code: 'INVALID_HOST', message: 'Invalid or missing server address in VMess config', field: 'server', severity: 'FATAL' });
    }

    if (!port || !isValidPort(port)) {
      errors.push({ code: 'INVALID_PORT', message: 'Invalid or missing port in VMess config', field: 'port', severity: 'FATAL' });
    }

    if (!uuid || !isValidUuid(uuid)) {
      errors.push({ code: 'INVALID_UUID', message: 'Invalid or missing UUID in VMess config', field: 'uuid', severity: 'FATAL' });
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    const config: VmessParsedConfig = {
      protocol: 'vmess',
      name,
      server,
      port,
      uuid,
      alterId,
      cipher,
      transport: net,
      security: tls,
      tls: tls === 'tls' ? { sni } : undefined,
      warnings
    };

    return { success: true, config, warnings };
  } catch (err: any) {
    errors.push({ code: 'INVALID_SCHEME', message: err?.message || 'Failed to parse VMess URI', severity: 'FATAL' });
    return { success: false, errors, warnings };
  }
}
