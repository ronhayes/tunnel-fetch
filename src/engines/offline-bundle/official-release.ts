export interface OfficialReleaseAsset {
  name: string;
  downloadUrl: string;
  size: number;
}

export interface OfficialReleaseInfo {
  version: string;
  tagName: string;
  publishedAt: string;
  releasePageUrl: string;
  assets: OfficialReleaseAsset[];
}

export const OFFICIAL_XRAY_REPO = 'XTLS/Xray-core';
export const OFFICIAL_RELEASES_PAGE = 'https://github.com/XTLS/Xray-core/releases';
export const OFFICIAL_LATEST_API = 'https://api.github.com/repos/XTLS/Xray-core/releases/latest';

export function getExpectedAssetName(architecture: 'amd64' | 'arm64'): string {
  // Official Xray release naming convention: Xray-linux-64.zip or Xray-linux-arm64-v8a.zip (or similar)
  // We match architecture precisely
  if (architecture === 'arm64') {
    return 'Xray-linux-arm64-v8a.zip';
  }
  return 'Xray-linux-64.zip';
}

export function getOfficialDownloadUrl(tagName: string, architecture: 'amd64' | 'arm64'): string {
  const assetName = getExpectedAssetName(architecture);
  return `https://github.com/XTLS/Xray-core/releases/download/${tagName}/${assetName}`;
}
