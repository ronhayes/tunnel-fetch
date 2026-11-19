export function safeBase64Decode(input: string): { success: boolean; decoded?: string; error?: string } {
  try {
    let base64 = input.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      const decoded = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return { success: true, decoded };
    } else if (typeof (globalThis as any).Buffer !== 'undefined') {
      const decoded = (globalThis as any).Buffer.from(base64, 'base64').toString('utf-8');
      return { success: true, decoded };
    } else {
      return { success: false, error: 'No base64 decoding environment available' };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Invalid Base64 encoding' };
  }
}
