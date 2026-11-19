export type LinuxArch = 'amd64' | 'arm64';
export type LinuxDistro = 'ubuntu-22.04' | 'ubuntu-24.04' | 'debian-12';

export interface CompatibilityMatrixEntry {
  distro: LinuxDistro;
  distroName: string;
  supportedArches: LinuxArch[];
  recommendedXrayVersion: string;
}

export const COMPATIBILITY_MATRIX: CompatibilityMatrixEntry[] = [
  {
    distro: 'ubuntu-22.04',
    distroName: 'Ubuntu 22.04 LTS (Jammy Jellyfish)',
    supportedArches: ['amd64', 'arm64'],
    recommendedXrayVersion: 'v1.8.24'
  },
  {
    distro: 'ubuntu-24.04',
    distroName: 'Ubuntu 24.04 LTS (Noble Numbat)',
    supportedArches: ['amd64', 'arm64'],
    recommendedXrayVersion: 'v1.8.24'
  },
  {
    distro: 'debian-12',
    distroName: 'Debian 12 (Bookworm)',
    supportedArches: ['amd64', 'arm64'],
    recommendedXrayVersion: 'v1.8.24'
  }
];

export function validateCompatibility(distro: LinuxDistro, arch: LinuxArch): { compatible: boolean; reason?: string } {
  const entry = COMPATIBILITY_MATRIX.find(e => e.distro === distro);
  if (!entry) {
    return { compatible: false, reason: 'Unsupported Linux distribution.' };
  }
  if (!entry.supportedArches.includes(arch)) {
    return { compatible: false, reason: `Architecture ${arch} is not officially supported on ${entry.distroName}.` };
  }
  return { compatible: true };
}
