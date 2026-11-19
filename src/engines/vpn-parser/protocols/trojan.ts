import type { ParseResult, TrojanParsedConfig, ParseError, ParseWarning } from '../types';
import { isValidHost, isValidPort } from '../shared/validation';

export function parseTrojan(uri: string): ParseResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];

  try {
    const urlStr = uri.trim();
    if (!urlStr.startsWith('trojan://')) {
      errors.push({ code: 'INVALID_SCHEME', message: 'URI does not start with trojan://', severity: 'FATAL' });
      return { success: false, errors, warnings };
    }

    const withoutScheme = urlStr.substring(9);
    const hashIdx = withoutScheme.indexOf('#');
    let name = 'Trojan Server';
    let mainPart = withoutScheme;

    if (hashIdx !== -1) {
      name = decodeURIComponent(withoutScheme.substring(hashIdx + 1));
      mainPart = withoutScheme.substring(0, hashIdx);
    }

    const queryIdx = mainPart.indexOf('?');
    let queryPart = '';
    let authorityAndPath = mainPart;

    if (queryIdx !== -1) {
      queryPart = mainPart.substring(queryIdx + 1);
      authorityAndPath = mainPart.substring(0, queryIdx);
    }

    const atIdx = authorityAndPath.lastIndexOf('@');
    if (atIdx === -1) {
      errors.push({ code: 'MISSING_CREDENTIALS', message: 'Missing password in Trojan URI', severity: 'FATAL' });
      return { success: false, errors, warnings };
    }

    const password = decodeURIComponent(authorityAndPath.substring(0, atIdx));
    const serverPortPart = authorityAndPath.substring(atIdx + 1);

    if (!password) {
      errors.push({ code: 'MISSING_CREDENTIALS', message: 'Trojan password cannot be empty', field: 'password', severity: 'FATAL' });
    }

    let server = '';
    let port = 443;

    if (serverPortPart.startsWith('[')) {
      const closingBracket = serverPortPart.indexOf(']');
      if (closingBracket === -1) {
        errors.push({ code: 'INVALID_HOST', message: 'Malformed IPv6 address format', severity: 'FATAL' });
        return { success: false, errors, warnings };
      }
      server = serverPortPart.substring(1, closingBracket);
      const portStr = serverPortPart.substring(closingBracket + 2);
      port = parseInt(portStr, 10);
    } else {
      const colonIdx = serverPortPart.lastIndexOf(':');
      if (colonIdx === -1) {
        errors.push({ code: 'INVALID_PORT', message: 'Missing port in server address', severity: 'FATAL' });
        return { success: false, errors, warnings };
      }
      server = serverPortPart.substring(0, colonIdx);
      port = parseInt(serverPortPart.substring(colonIdx + 1), 10);
    }

    if (!isValidHost(server)) {
      errors.push({ code: 'INVALID_HOST', message: 'Invalid server host or IP', field: 'server', severity: 'FATAL' });
    }

    if (!isValidPort(port)) {
      errors.push({ code: 'INVALID_PORT', message: 'Invalid port range (1-65535)', field: 'port', severity: 'FATAL' });
    }

    const params = new URLSearchParams(queryPart);
    const type = params.get('type') || 'tcp';
    const sni = params.get('sni') || params.get('host') || undefined;
    const fp = params.get('fp') || undefined;
    const alpn = params.get('alpn') ? params.get('alpn')!.split(',') : undefined;

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    const config: TrojanParsedConfig = {
      protocol: 'trojan',
      name,
      server,
      port,
      password,
      transport: type,
      security: 'tls',
      tls: { sni, fingerprint: fp, alpn },
      warnings
    };

    return { success: true, config, warnings };
  } catch (err: any) {
    errors.push({ code: 'INVALID_SCHEME', message: err?.message || 'Failed to parse Trojan URI', severity: 'FATAL' });
    return { success: false, errors, warnings };
  }
}
