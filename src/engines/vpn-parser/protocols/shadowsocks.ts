import type { ParseResult, ShadowsocksParsedConfig, ParseError, ParseWarning } from '../types';
import { safeBase64Decode } from '../shared/base64';
import { isValidHost, isValidPort } from '../shared/validation';

export function parseShadowsocks(uri: string): ParseResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];

  try {
    const urlStr = uri.trim();
    if (!urlStr.startsWith('ss://')) {
      errors.push({ code: 'INVALID_SCHEME', message: 'URI does not start with ss://', severity: 'FATAL' });
      return { success: false, errors, warnings };
    }

    const withoutScheme = urlStr.substring(5);
    const hashIdx = withoutScheme.indexOf('#');
    let name = 'Shadowsocks Server';
    let mainPart = withoutScheme;

    if (hashIdx !== -1) {
      name = decodeURIComponent(withoutScheme.substring(hashIdx + 1));
      mainPart = withoutScheme.substring(0, hashIdx);
    }

    let method = '';
    let password = '';
    let server = '';
    let port = 0;
    let plugin = undefined;

    // Check if SIP002 format (contains @)
    const atIdx = mainPart.indexOf('@');
    if (atIdx !== -1) {
      // SIP002 format: ss://base64(method:password)@server:port/?plugin=...
      const userInfoBase64 = mainPart.substring(0, atIdx);
      const serverPortPart = mainPart.substring(atIdx + 1);

      const userInfoDecode = safeBase64Decode(userInfoBase64);
      if (!userInfoDecode.success || !userInfoDecode.decoded) {
        errors.push({ code: 'INVALID_BASE64', message: 'Failed to decode Shadowsocks user info base64', severity: 'FATAL' });
        return { success: false, errors, warnings };
      }

      const colonIdx = userInfoDecode.decoded.indexOf(':');
      if (colonIdx === -1) {
        errors.push({ code: 'MISSING_CREDENTIALS', message: 'Invalid Shadowsocks user info format (missing colon)', severity: 'FATAL' });
        return { success: false, errors, warnings };
      }

      method = userInfoDecode.decoded.substring(0, colonIdx);
      password = userInfoDecode.decoded.substring(colonIdx + 1);

      // Parse server and port
      const queryIdx = serverPortPart.indexOf('?');
      let authority = serverPortPart;
      if (queryIdx !== -1) {
        const queryPart = serverPortPart.substring(queryIdx + 1);
        authority = serverPortPart.substring(0, queryIdx);
        const params = new URLSearchParams(queryPart);
        if (params.get('plugin')) {
          plugin = params.get('plugin')!;
          warnings.push({ code: 'UNSUPPORTED_PARAMETER', message: 'Shadowsocks plugin metadata detected; standard Xray fallback applied.' });
        }
      }

      if (authority.startsWith('[')) {
        const closingBracket = authority.indexOf(']');
        server = authority.substring(1, closingBracket);
        port = parseInt(authority.substring(closingBracket + 2), 10);
      } else {
        const cIdx = authority.lastIndexOf(':');
        server = authority.substring(0, cIdx);
        port = parseInt(authority.substring(cIdx + 1), 10);
      }
    } else {
      // Legacy format: ss://base64(method:password@server:port)
      const fullDecode = safeBase64Decode(mainPart);
      if (!fullDecode.success || !fullDecode.decoded) {
        errors.push({ code: 'INVALID_BASE64', message: 'Failed to decode legacy Shadowsocks base64 payload', severity: 'FATAL' });
        return { success: false, errors, warnings };
      }

      const decoded = fullDecode.decoded;
      const legacyAtIdx = decoded.lastIndexOf('@');
      if (legacyAtIdx === -1) {
        errors.push({ code: 'MISSING_CREDENTIALS', message: 'Invalid legacy Shadowsocks format', severity: 'FATAL' });
        return { success: false, errors, warnings };
      }

      const methodPass = decoded.substring(0, legacyAtIdx);
      const serverPort = decoded.substring(legacyAtIdx + 1);

      const colonIdx = methodPass.indexOf(':');
      method = methodPass.substring(0, colonIdx);
      password = methodPass.substring(colonIdx + 1);

      const cIdx = serverPort.lastIndexOf(':');
      server = serverPort.substring(0, cIdx);
      port = parseInt(serverPort.substring(cIdx + 1), 10);
    }

    if (!method) {
      errors.push({ code: 'MISSING_REQUIRED_PARAMETER', message: 'Shadowsocks encryption method is missing', field: 'method', severity: 'FATAL' });
    }

    if (!password) {
      errors.push({ code: 'MISSING_CREDENTIALS', message: 'Shadowsocks password is missing', field: 'password', severity: 'FATAL' });
    }

    if (!isValidHost(server)) {
      errors.push({ code: 'INVALID_HOST', message: 'Invalid Shadowsocks server host', field: 'server', severity: 'FATAL' });
    }

    if (!isValidPort(port)) {
      errors.push({ code: 'INVALID_PORT', message: 'Invalid Shadowsocks port range', field: 'port', severity: 'FATAL' });
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    const config: ShadowsocksParsedConfig = {
      protocol: 'shadowsocks',
      name,
      server,
      port,
      method,
      password,
      transport: 'tcp',
      security: 'none',
      plugin,
      warnings
    };

    return { success: true, config, warnings };
  } catch (err: any) {
    errors.push({ code: 'INVALID_SCHEME', message: err?.message || 'Failed to parse Shadowsocks URI', severity: 'FATAL' });
    return { success: false, errors, warnings };
  }
}
