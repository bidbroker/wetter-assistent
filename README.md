# 🏠 Kellerlüftungs-Assistent für Gablitz

Intelligenter Lüftungsberater basierend auf absoluter Luftfeuchtigkeit und Temperatur.

## 📋 Übersicht

Diese Web-Anwendung berechnet die optimalen Lüftungszeiten für Ihren Keller basierend auf:
- Absoluter Luftfeuchtigkeit (g/m³)
- Temperaturvergleich (Innen vs. Außen)
- Auskühlung vermeiden durch Stoßlüftungs-Empfehlungen

## 🌟 Features

- ✅ **Beste Lüftungszeitfenster** - Optimale Zeiten für die nächsten 48 Stunden
- 🕐 **Jetzt-Empfehlung** - Sofortige Entscheidung ob lüften oder nicht
- ❄️ **Stoßlüftungs-Warnung** - Warnt wenn nur kurz gelüftet werden sollte
- ⚙️ **Anpassbare Kellerwerte** - Eigene Temperatur und Feuchtigkeit eingeben
- 📱 **Mobile-optimiert** - Perfekt lesbar auf iPhone und Android
- 📊 **48h-Vorschau** - Stündliche Detailansicht

## 🎯 Lüftungskriterien

### 🌡️ LANGES LÜFTEN (Normal)
**Kriterium:** Außentemperatur ≥ Kellertemperatur
- ✅ Keine Gefahr der Auskühlung
- ✅ Mehrere Stunden durchgehend lüften möglich
- ✅ Optimal für effektive Entfeuchtung

### ❄️ STOSSLÜFTEN (5 Minuten)
**Kriterium:** Außentemperatur < Kellertemperatur
- ⚠️ Gefahr der Auskühlung
- ⏱️ Nur 5 Minuten pro Stunde lüften
- 💡 Trotzdem Entfeuchtung möglich

## 📦 Dateien

- `weather_gablitz.html` - Hauptanwendung (komplett standalone)
- `weather_gablitz.js` - Node.js Kommandozeilen-Version (optional)
- `README.md` - Diese Dokumentation

## 🚀 Installation

### Option 1: Lokales Öffnen (einfachste)
Doppelklick auf `weather_gablitz.html` im Browser öffnen.

### Option 2: Raspberry Pi (empfohlen für 24/7)

#### Voraussetzungen
- Raspberry Pi mit Raspbian/Raspberry Pi OS
- SSH aktiviert
- Python 3 (vorinstalliert)

#### Setup-Schritte

1. **Datei auf Raspberry übertragen:**
```bash
scp weather_gablitz.html pi@192.168.178.186:/home/pi/Luft
```

2. **Service einrichten (automatischer Start):**

Service-Datei erstellen:
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

3. **Service aktivieren:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable weather-server.service
sudo systemctl start weather-server.service
sudo systemctl status weather-server.service
```

4. **Zugriff:**
```
http://RASPBERRY-IP:8080/weather_gablitz.html
```

Beispiel: `http://192.168.178.186:8080/weather_gablitz.html`

## 🔧 Konfiguration

### Kellerwerte anpassen

1. Auf der Webseite auf **⚙️ Einstellungen** klicken
2. Temperatur und Luftfeuchtigkeit eingeben
3. **✓ Übernehmen & Neu berechnen** klicken

**Standard-Werte:**
- Kellertemperatur: 14°C
- Relative Luftfeuchtigkeit: 65%

### Empfehlung: Eigene Werte messen
- Hygrometer im Keller platzieren
- Mehrere Tage messen
- Durchschnittswerte verwenden

## 🌐 Datenquelle

**Open-Meteo API** (https://open-meteo.com)
- ✅ Kostenlos und ohne API-Key
- ✅ Keine Registrierung erforderlich
- ✅ Zuverlässige Wettervorhersage
- 📍 Standort: Gablitz, Österreich (48.2333°N, 16.1167°E)

## 📱 Mobile Nutzung

### Als App-Icon speichern

**iPhone (Safari):**
1. Webseite öffnen
2. Teilen-Button → "Zum Home-Bildschirm"
3. Name eingeben (z.B. "Kellerlüftung")

**Android (Chrome):**
1. Webseite öffnen
2. ⋮ Menü → "Zum Startbildschirm hinzufügen"

## 🛠️ Verwaltung (Raspberry Pi)

### Service-Befehle

```bash
# Status anzeigen
sudo systemctl status weather-server.service

# Service neu starten
sudo systemctl restart weather-server.service

# Service stoppen
sudo systemctl stop weather-server.service

# Service starten
sudo systemctl start weather-server.service

# Logs anzeigen
sudo journalctl -u weather-server.service -f
```

### HTML aktualisieren

```bash
# Neue Version hochladen
scp weather_gablitz.html pi@192.168.178.186:/home/pi/Luft

# Browser mit STRG+F5 neu laden
```

## 🔍 Problemlösung

### Service läuft nicht
```bash
# Logs prüfen
sudo journalctl -u weather-server.service -n 50

# Manuell testen
cd /home/pi/Luft
python3 -m http.server 8080
```

### Nicht erreichbar
```bash
# Port prüfen
sudo netstat -tulpn | grep 8080

# Firewall (falls aktiv)
sudo ufw allow 8080
```

### Daten werden nicht aktualisiert
- Browser-Cache leeren (STRG+SHIFT+R oder CMD+SHIFT+R)
- Seite neu laden

## 📊 Technische Details

### Berechnungen

**Absolute Luftfeuchtigkeit (g/m³):**
```
Magnus-Formel:
e_s = 6.112 * exp((17.27 * T) / (237.7 + T))
e = (RF / 100) * e_s
AH = (e * 100 * 2.1674) / (T + 273.15)

T = Temperatur in °C
RF = Relative Feuchtigkeit in %
e_s = Sättigungsdampfdruck in hPa
e = Aktueller Dampfdruck in hPa
AH = Absolute Feuchtigkeit in g/m³
```

**Lüftungsempfehlung:**
- Vorteil > 1.5 g/m³ → "GUT ZUM LÜFTEN" ✅
- Vorteil 0-1.5 g/m³ → "BEDINGT GEEIGNET" ⚠️
- Vorteil < 0 g/m³ → "NICHT LÜFTEN" ❌

### Browser-Kompatibilität

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Kein Internet Explorer Support

## 🔒 Sicherheit & Datenschutz

- ✅ Keine Cookies
- ✅ Keine Benutzer-Tracking
- ✅ Alle Berechnungen lokal im Browser
- ✅ Keine persönlichen Daten gespeichert
- ✅ Nur Wetterdaten von Open-Meteo API

## 📝 Changelog

### Version 1.0 (März 2026)
- ✅ Initiale Version
- ✅ Berechnung absoluter Feuchtigkeit
- ✅ Lüftungszeitfenster mit Dauer
- ✅ Stoßlüftungs-Warnungen bei kalter Außenluft
- ✅ Mobile-optimiert für iOS und Android
- ✅ Anpassbare Kellerwerte
- ✅ 48-Stunden Vorhersage
- ✅ Automatische Zeitfenster-Trennung bei Temperaturwechsel

## 👤 Autor

Erstellt mit Claude Code (Anthropic)
Standort: Gablitz, Österreich

## 📄 Lizenz

Freie Nutzung für private Zwecke.

## 🙏 Danksagungen

- Open-Meteo API für kostenlose Wetterdaten
- Magnus-Formel für Dampfdruckberechnung

## 📞 Support

Bei Fragen oder Problemen:
1. README durchlesen
2. Logs prüfen: `sudo journalctl -u weather-server.service`
3. Browser-Konsole öffnen (F12) für JavaScript-Fehler

---

**Viel Erfolg beim Kellerlüften!** 🏠💨
