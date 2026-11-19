export type VerificationState = 'VERIFIED' | 'MISMATCH' | 'SOURCE_UNVERIFIED' | 'MISSING' | 'INVALID_FORMAT';

export async function computeSha256(fileData: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function verifyChecksum(calculatedHash: string, expectedHash?: string): VerificationState {
  if (!expectedHash || !expectedHash.trim()) {
    return 'SOURCE_UNVERIFIED';
  }
  if (calculatedHash.toLowerCase() === expectedHash.trim().toLowerCase()) {
    return 'VERIFIED';
  }
  return 'MISMATCH';
}
