import type { VpnProtocol } from './types';

export function detectProtocol(uri: string): VpnProtocol | null {
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim().toLowerCase();

  if (trimmed.startsWith('vless://')) return 'vless';
  if (trimmed.startsWith('vmess://')) return 'vmess';
  if (trimmed.startsWith('trojan://')) return 'trojan';
  if (trimmed.startsWith('ss://')) return 'shadowsocks';

  return null;
}
