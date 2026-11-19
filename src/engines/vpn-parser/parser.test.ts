import { safeBase64Decode } from './shared/base64';

export function runParserUnitTests(): { passed: number; failed: number; logs: string[] } {
  const logs: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      logs.push(`[PASS] ${testName}`);
    } else {
      failed++;
      logs.push(`[FAIL] ${testName}`);
    }
  }

  // Test Base64
  const b64 = safeBase64Decode('SGVsbG8gV29ybGQ=');
  assert(b64.success && b64.decoded === 'Hello World', 'Safe Base64 Decoding');

  return { passed, failed, logs };
}
