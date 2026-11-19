export interface BundleManifest {
  formatVersion: string;
  xrayVersion: string;
  targetArchitecture: string;
  targetDistribution: string;
  createdAt: string;
  assets: {
    name: string;
    type: 'binary' | 'geodata' | 'script' | 'systemd' | 'docs';
    size: number;
    sha256: string;
    verificationStatus: string;
  }[];
  requiredDependencies: string[];
}

export function generateManifest(
  xrayVersion: string,
  architecture: string,
  distribution: string,
  assets: Array<{ name: string; type: any; size: number; sha256: string; verificationStatus: string }>
): BundleManifest {
  return {
    formatVersion: '1.0.0',
    xrayVersion,
    targetArchitecture: architecture,
    targetDistribution: distribution,
    createdAt: new Date().toISOString(),
    assets,
    requiredDependencies: ['bash', 'systemd', 'coreutils']
  };
}
