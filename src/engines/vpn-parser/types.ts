export type VpnProtocol = 'vless' | 'vmess' | 'trojan' | 'shadowsocks';

export type ParseWarningCode =
  | 'UNSUPPORTED_PARAMETER'
  | 'DEPRECATED_FORMAT'
  | 'INSECURE_CONNECTION'
  | 'MISSING_RECOMMENDED_FIELD';

export type ParseErrorCode =
  | 'INVALID_SCHEME'
  | 'INVALID_UUID'
  | 'INVALID_HOST'
  | 'INVALID_PORT'
  | 'INVALID_BASE64'
  | 'INVALID_JSON'
  | 'MISSING_CREDENTIALS'
  | 'MISSING_REQUIRED_PARAMETER'
  | 'DUPLICATE_PARAMETER'
  | 'INVALID_PERCENT_ENCODING'
  | 'UNSUPPORTED_TRANSPORT'
  | 'UNSUPPORTED_SECURITY';

export interface ParseWarning {
  code: ParseWarningCode;
  message: string;
  field?: string;
}

export interface ParseError {
  code: ParseErrorCode;
  message: string;
  field?: string;
  severity: 'ERROR' | 'FATAL';
}

export interface BaseParsedConfig {
  protocol: VpnProtocol;
  name: string;
  server: string;
  port: number;
  transport: 'tcp' | 'ws' | 'grpc' | 'http' | string;
  security: 'none' | 'tls' | 'reality' | string;
  tls?: {
    sni?: string;
    fingerprint?: string;
    alpn?: string[];
  };
  reality?: {
    publicKey: string;
    shortId?: string;
    spiderX?: string;
    sni?: string;
  };
  extensions?: Record<string, string>;
  warnings: ParseWarning[];
}

export interface VlessParsedConfig extends BaseParsedConfig {
  protocol: 'vless';
  uuid: string;
  flow?: string;
  encryption?: string;
}

export interface VmessParsedConfig extends BaseParsedConfig {
  protocol: 'vmess';
  uuid: string;
  alterId: number;
  cipher: string;
}

export interface TrojanParsedConfig extends BaseParsedConfig {
  protocol: 'trojan';
  password: string;
}

export interface ShadowsocksParsedConfig extends BaseParsedConfig {
  protocol: 'shadowsocks';
  method: string;
  password: string;
  plugin?: string;
}

export type ParsedVpnConfig =
  | VlessParsedConfig
  | VmessParsedConfig
  | TrojanParsedConfig
  | ShadowsocksParsedConfig;

export type ParseResult =
  | {
      success: true;
      config: ParsedVpnConfig;
      warnings: ParseWarning[];
    }
  | {
      success: false;
      errors: ParseError[];
      warnings: ParseWarning[];
    };
