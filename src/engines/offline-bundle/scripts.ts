export function generateInstallScript(): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# Tunnel Fetch - Offline Xray Core Installer
# Target: Ubuntu 22.04 / 24.04 / Debian 12 (Offline Mode)
# ==============================================================================
set -euo pipefail

if [ "\${EUID}" -ne 0 ]; then
  echo "[ERROR] This installer must be run as root (sudo)." >&2
  exit 1
fi

INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/usr/local/etc/xray"
SHARE_DIR="/usr/local/share/xray"
SYSTEMD_DIR="/etc/systemd/system"

echo "==> [1/5] Verifying bundle integrity..."
if [ ! -f "bin/xray" ]; then
  echo "[ERROR] Xray binary not found in bin/." >&2
  exit 1
fi

echo "==> [2/5] Creating directories..."
mkdir -p "\${INSTALL_DIR}"
mkdir -p "\${CONFIG_DIR}"
mkdir -p "\${SHARE_DIR}"

echo "==> [3/5] Installing Xray binary and assets..."
install -m 755 bin/xray "\${INSTALL_DIR}/xray"

if [ -f "geodata/geoip.dat" ]; then
  install -m 644 geodata/geoip.dat "\${SHARE_DIR}/geoip.dat"
fi
if [ -f "geodata/geosite.dat" ]; then
  install -m 644 geodata/geosite.dat "\${SHARE_DIR}/geosite.dat"
fi

echo "==> [4/5] Installing systemd service..."
if [ -f "systemd/xray.service" ]; then
  install -m 644 systemd/xray.service "\${SYSTEMD_DIR}/xray.service"
  systemctl daemon-reload
fi

echo "==> [5/5] Installation completed successfully (Offline Mode)."
echo "NOTE: Xray service is installed but NOT started or enabled automatically per workflow policy."
`;
}

export function generateUninstallScript(): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# Tunnel Fetch - Offline Xray Core Uninstaller
# ==============================================================================
set -euo pipefail

if [ "\${EUID}" -ne 0 ]; then
  echo "[ERROR] This uninstaller must be run as root (sudo)." >&2
  exit 1
fi

echo "==> Stopping Xray service if running..."
systemctl stop xray || true
systemctl disable xray || true

echo "==> Removing Xray binary and systemd service..."
rm -f /usr/local/bin/xray
rm -f /etc/systemd/system/xray.service
systemctl daemon-reload

echo "==> Cleaning up shared assets..."
rm -rf /usr/local/share/xray

echo "[NOTE] User configuration in /usr/local/etc/xray/ has been preserved safely."
echo "==> Uninstallation completed."
`;
}

export function generateSystemdService(): string {
  return `[Unit]
Description=Xray Service - Tunnel Fetch
After=network.target nss-lookup.target

[Service]
Type=simple
User=root
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
NoNewPrivileges=true
ExecStart=/usr/local/bin/xray run -config /usr/local/etc/xray/config.json
Restart=on-failure
RestartSec=5s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
`;
}
