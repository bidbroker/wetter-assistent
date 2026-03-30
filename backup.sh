#!/bin/bash
#
# Backup Script für Kellerlüftungs-Assistent
# Erstellt ein vollständiges Backup mit Datum
#

# Konfiguration
BACKUP_DIR="$HOME/Backups/Kellerlueftung"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="kellerlueftung_backup_$DATE"
SOURCE_DIR="/home/pi/Luft"

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Kellerlüftung Backup Script${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Backup-Verzeichnis erstellen
mkdir -p "$BACKUP_DIR"

# Backup-Ordner für dieses Backup
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH"

echo -e "${GREEN}✓${NC} Backup-Verzeichnis erstellt: $BACKUP_PATH"

# HTML-Datei kopieren
if [ -f "$SOURCE_DIR/weather_gablitz.html" ]; then
    cp "$SOURCE_DIR/weather_gablitz.html" "$BACKUP_PATH/"
    echo -e "${GREEN}✓${NC} HTML-Datei gesichert"
else
    echo "⚠️  Warnung: HTML-Datei nicht gefunden!"
fi

# Service-Datei kopieren
if [ -f "/etc/systemd/system/weather-server.service" ]; then
    cp "/etc/systemd/system/weather-server.service" "$BACKUP_PATH/"
    echo -e "${GREEN}✓${NC} Service-Datei gesichert"
fi

# README kopieren (falls vorhanden)
if [ -f "$SOURCE_DIR/README.md" ]; then
    cp "$SOURCE_DIR/README.md" "$BACKUP_PATH/"
    echo -e "${GREEN}✓${NC} README gesichert"
fi

# Backup-Info erstellen
cat > "$BACKUP_PATH/backup_info.txt" << EOF
Kellerlüftungs-Assistent Backup
================================

Backup erstellt am: $(date)
Hostname: $(hostname)
IP-Adresse: $(hostname -I)
Raspberry Pi OS Version: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)

Gesicherte Dateien:
- weather_gablitz.html (Hauptanwendung)
- weather-server.service (Systemd Service)
- README.md (Dokumentation)
- backup_info.txt (Diese Datei)

Wiederherstellung:
==================

1. HTML-Datei kopieren:
   scp weather_gablitz.html pi@RASPBERRY-IP:/home/pi/Luft/

2. Service einrichten:
   sudo cp weather-server.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable weather-server.service
   sudo systemctl start weather-server.service

3. Status prüfen:
   sudo systemctl status weather-server.service

4. Browser öffnen:
   http://RASPBERRY-IP:8080/weather_gablitz.html
EOF

echo -e "${GREEN}✓${NC} Backup-Info erstellt"

# Komprimiertes Archiv erstellen
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
echo -e "${GREEN}✓${NC} Archiv erstellt: ${BACKUP_NAME}.tar.gz"

# Größe anzeigen
SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
echo ""
echo -e "${BLUE}Backup abgeschlossen!${NC}"
echo -e "Größe: $SIZE"
echo -e "Speicherort: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo ""

# Optional: Unkomprimierten Ordner löschen
# rm -rf "$BACKUP_PATH"

# Alte Backups (älter als 30 Tage) löschen
echo "Alte Backups (>30 Tage) werden gelöscht..."
find "$BACKUP_DIR" -name "kellerlueftung_backup_*.tar.gz" -mtime +30 -delete
echo -e "${GREEN}✓${NC} Aufräumen abgeschlossen"

echo ""
echo "Fertig! 🎉"
