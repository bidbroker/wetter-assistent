# 🔄 Wiederherstellungs-Anleitung

## Szenario 1: Raspberry Pi neu aufsetzen

### 1. Backup vom PC auf neuen Raspberry übertragen

```bash
# Backup-Archiv auf Raspberry kopieren
scp kellerlueftung_backup_DATUM.tar.gz pi@NEUE-RASPBERRY-IP:~/

# Auf Raspberry einloggen
ssh pi@NEUE-RASPBERRY-IP

# Archiv entpacken
tar -xzf kellerlueftung_backup_DATUM.tar.gz
cd kellerlueftung_backup_DATUM
```

### 2. Dateien wiederherstellen

```bash
# Zielverzeichnis erstellen
mkdir -p /home/pi/Luft

# HTML-Datei kopieren
cp weather_gablitz.html /home/pi/Luft/

# Service-Datei kopieren
sudo cp weather-server.service /etc/systemd/system/

# Service aktivieren
sudo systemctl daemon-reload
sudo systemctl enable weather-server.service
sudo systemctl start weather-server.service

# Status prüfen
sudo systemctl status weather-server.service
```

### 3. Testen

```
http://NEUE-RASPBERRY-IP:8080/weather_gablitz.html
```

---

## Szenario 2: Nur HTML-Datei aktualisieren

```bash
# Von Windows PC:
scp weather_gablitz.html pi@192.168.178.186:/home/pi/Luft/

# Service muss NICHT neu gestartet werden
# Einfach Browser neu laden (STRG+F5)
```

---

## Szenario 3: Service reparieren

```bash
# Service-Datei aus Backup wiederherstellen
sudo cp weather-server.service /etc/systemd/system/

# Systemd neu laden
sudo systemctl daemon-reload

# Service neu starten
sudo systemctl restart weather-server.service

# Status prüfen
sudo systemctl status weather-server.service
```

---

## Szenario 4: Komplette Neuinstallation

### Voraussetzungen
- Raspberry Pi mit Raspbian/Raspberry Pi OS
- SSH aktiviert
- Netzwerkverbindung

### Schritte

1. **Python prüfen (sollte vorinstalliert sein):**
```bash
python3 --version
```

2. **Verzeichnis erstellen:**
```bash
mkdir -p /home/pi/Luft
```

3. **HTML-Datei hochladen:**
```bash
# Von Windows:
scp weather_gablitz.html pi@RASPBERRY-IP:/home/pi/Luft/
```

4. **Service erstellen:**
```bash
sudo nano /etc/systemd/system/weather-server.service
```

Inhalt:
```ini
[Unit]
Description=Weather Ventilation Web Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Luft
ExecStart=/usr/bin/python3 -m http.server 8080
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

5. **Service aktivieren:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable weather-server.service
sudo systemctl start weather-server.service
sudo systemctl status weather-server.service
```

6. **Testen:**
```
http://RASPBERRY-IP:8080/weather_gablitz.html
```

---

## Backup-Dateien Übersicht

Nach einem Backup haben Sie:

```
kellerlueftung_backup_2026-03-15_18-30-00/
├── weather_gablitz.html         # Hauptanwendung
├── weather-server.service       # Systemd Service
├── README.md                    # Dokumentation
└── backup_info.txt             # Backup-Informationen
```

Komprimiert als: `kellerlueftung_backup_2026-03-15_18-30-00.tar.gz`

---

## Wichtige IP-Adressen notieren

**Aktuell:**
- Raspberry Pi: `192.168.178.186`
- Port: `8080`
- URL: `http://192.168.178.186:8080/weather_gablitz.html`

**Bei neuem Raspberry:**
```bash
# IP herausfinden
hostname -I
```

---

## Notfall: Manueller Start (ohne Service)

Falls Service nicht funktioniert:

```bash
# Auf Raspberry einloggen
ssh pi@192.168.178.186

# Ins Verzeichnis wechseln
cd /home/pi/Luft

# Server manuell starten
python3 -m http.server 8080
```

**Hinweis:** Terminal muss offen bleiben, Server stoppt beim Schließen.

---

## Probleme beim Wiederherstellen?

### Service startet nicht
```bash
# Logs anzeigen
sudo journalctl -u weather-server.service -n 50

# Häufige Fehler:
# - Leerzeichen am Zeilenanfang in Service-Datei
# - Falscher Pfad in WorkingDirectory
# - Port bereits belegt
```

### Datei nicht gefunden
```bash
# Prüfen ob Datei existiert
ls -la /home/pi/Luft/weather_gablitz.html

# Berechtigungen prüfen
ls -la /home/pi/Luft/
```

### Port bereits belegt
```bash
# Port prüfen
sudo lsof -i :8080

# Anderen Port verwenden (z.B. 8000)
# In Service-Datei: ExecStart=/usr/bin/python3 -m http.server 8000
```

---

## Backup auf externen USB-Stick

```bash
# USB-Stick mounten (automatisch unter /media/pi/...)
# Backup dorthin kopieren
cp ~/Backups/Kellerlueftung/*.tar.gz /media/pi/USB-NAME/

# Sicher entfernen
sudo umount /media/pi/USB-NAME
```

---

## Cloud-Backup (optional)

### Mit Dropbox, Google Drive, etc:
```bash
# Backup in Cloud-Ordner kopieren
cp ~/Backups/Kellerlueftung/*.tar.gz ~/Dropbox/Backups/
```

### Mit Git (GitHub/GitLab):
```bash
cd ~/Luft
git init
git add weather_gablitz.html
git commit -m "Initial commit"
git remote add origin YOUR-REPO-URL
git push -u origin main
```

---

## Checkliste Wiederherstellung

- [ ] Backup-Datei vorhanden?
- [ ] Raspberry Pi läuft?
- [ ] SSH-Verbindung funktioniert?
- [ ] Verzeichnis `/home/pi/Luft` erstellt?
- [ ] HTML-Datei kopiert?
- [ ] Service-Datei erstellt (ohne Leerzeichen am Anfang!)?
- [ ] Service aktiviert und gestartet?
- [ ] Im Browser erreichbar?
- [ ] Einstellungen angepasst?
- [ ] Als Lesezeichen/Homescreen-Icon gespeichert?

---

**Bei Fragen siehe README.md oder Backup-Info.txt im Backup-Archiv!**
