import { detectProtocol } from './detector';
import { parseVless } from './protocols/vless';
import { parseVmess } from './protocols/vmess';
import { parseTrojan } from './protocols/trojan';
import { parseShadowsocks } from './protocols/shadowsocks';
import type { ParseResult, ParseError } from './types';

export function parseVpnUri(uri: string): ParseResult {
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    const errors: ParseError[] = [
      { code: 'INVALID_SCHEME', message: 'Input URI is empty or invalid', severity: 'FATAL' }
    ];
    return { success: false, errors, warnings: [] };
  }

  const protocol = detectProtocol(uri);

  switch (protocol) {
    case 'vless':
      return parseVless(uri);
    case 'vmess':
      return parseVmess(uri);
    case 'trojan':
      return parseTrojan(uri);
    case 'shadowsocks':
      return parseShadowsocks(uri);
    default: {
      const errors: ParseError[] = [
        { code: 'INVALID_SCHEME', message: 'Unsupported or unknown protocol scheme', severity: 'FATAL' }
      ];
      return { success: false, errors, warnings: [] };
    }
  }
}

export * from './types';
export { detectProtocol };
