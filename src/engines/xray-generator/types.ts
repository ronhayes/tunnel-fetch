export interface XrayGeneratorOptions {
  targetVersion: string; // e.g. "v1.8.24"
  socksPort: number;
  enableHttpInbound: boolean;
  httpPort: number;
  enableIranDirect: boolean;
  enablePrivateIpDirect: boolean;
  dnsServers: string[];
}

export interface GenerationWarning {
  code: string;
  message: string;
}

export interface GenerationError {
  code: string;
  message: string;
  field?: string;
}

export interface GenerationMetadata {
  targetVersion: string;
  generatedAt: string;
  protocol: string;
  server: string;
}

export type GenerationResult =
  | {
      success: true;
      config: Record<string, any>;
      json: string;
      safeJson: string;
      warnings: GenerationWarning[];
      metadata: GenerationMetadata;
    }
  | {
      success: false;
      errors: GenerationError[];
      warnings: GenerationWarning[];
    };
