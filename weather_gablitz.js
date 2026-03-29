#!/usr/bin/env node
/**
 * Script to fetch hourly humidity data for Gablitz, Austria using Open-Meteo API
 * Calculates absolute humidity and provides basement ventilation recommendations
 */

const https = require('https');

/**
 * Calculate absolute humidity in g/m³
 * @param {number} temperature - Temperature in Celsius
 * @param {number} relativeHumidity - Relative humidity in %
 * @returns {number} Absolute humidity in g/m³
 */
function calculateAbsoluteHumidity(temperature, relativeHumidity) {
    // Magnus formula for saturation vapor pressure
    const a = 17.27;
    const b = 237.7;

    // Saturation vapor pressure in hPa
    const saturationVaporPressure = 6.112 * Math.exp((a * temperature) / (b + temperature));

    // Actual vapor pressure
    const actualVaporPressure = (relativeHumidity / 100) * saturationVaporPressure;

    // Absolute humidity in g/m³
    const absoluteHumidity = (actualVaporPressure * 100 * 2.1674) / (temperature + 273.15);

    return absoluteHumidity;
}

/**
 * Determine if it's good to ventilate the basement
 * @param {number} outsideAbsHumidity - Outside absolute humidity
 * @param {number} basementTemp - Assumed basement temperature (typically 12-15°C)
 * @param {number} basementRelHumidity - Assumed basement relative humidity (typically 60-70%)
 * @returns {object} Ventilation recommendation
 */
function getVentilationAdvice(outsideAbsHumidity, basementTemp = 14, basementRelHumidity = 65) {
    const basementAbsHumidity = calculateAbsoluteHumidity(basementTemp, basementRelHumidity);

    // Only ventilate if outside absolute humidity is significantly lower than inside
    const difference = basementAbsHumidity - outsideAbsHumidity;

    if (difference > 1.5) {
        return {
            shouldVentilate: true,
            status: '✓ GUT ZUM LÜFTEN',
            reason: `Außenluft ist trockener (${difference.toFixed(1)} g/m³ weniger Feuchtigkeit)`,
            color: 'green'
        };
    } else if (difference > 0) {
        return {
            shouldVentilate: false,
            status: '~ BEDINGT GEEIGNET',
            reason: `Nur geringer Vorteil (${difference.toFixed(1)} g/m³ weniger)`,
            color: 'yellow'
        };
    } else {
        return {
            shouldVentilate: false,
            status: '✗ NICHT LÜFTEN',
            reason: `Außenluft bringt mehr Feuchtigkeit ein (${Math.abs(difference).toFixed(1)} g/m³ mehr)`,
            color: 'red'
        };
    }
}

/**
 * Find consecutive ventilation windows and calculate their properties
 * @param {Array} goodTimes - Array of good ventilation times
 * @returns {Array} Array of ventilation windows with duration and average values
 */
function findVentilationWindows(goodTimes) {
    if (goodTimes.length === 0) return [];

    const windows = [];
    let currentWindow = {
        start: goodTimes[0].time,
        end: goodTimes[0].time,
        hours: [goodTimes[0]],
        duration: 1
    };

    // Group consecutive hours into windows
    for (let i = 1; i < goodTimes.length; i++) {
        const prevTime = goodTimes[i - 1].time;
        const currTime = goodTimes[i].time;
        const hoursDiff = (currTime - prevTime) / (1000 * 60 * 60);

        if (hoursDiff === 1) {
            // Consecutive hour - add to current window
            currentWindow.hours.push(goodTimes[i]);
            currentWindow.end = currTime;
            currentWindow.duration++;
        } else {
            // Gap found - save current window and start new one
            windows.push(calculateWindowStats(currentWindow));
            currentWindow = {
                start: currTime,
                end: currTime,
                hours: [goodTimes[i]],
                duration: 1
            };
        }
    }

    // Add the last window
    windows.push(calculateWindowStats(currentWindow));

    // Find the best window (highest average difference)
    let bestWindow = windows[0];
    windows.forEach(window => {
        if (window.avgDifference > bestWindow.avgDifference) {
            bestWindow = window;
        }
    });
    bestWindow.isBest = true;

    return windows;
}

/**
 * Calculate statistics for a ventilation window
 * @param {Object} window - Window object with hours array
 * @returns {Object} Window with calculated statistics
 */
function calculateWindowStats(window) {
    const hours = window.hours;
    const count = hours.length;

    const avgTemp = hours.reduce((sum, h) => sum + h.temp, 0) / count;
    const avgAbsHum = hours.reduce((sum, h) => sum + h.absHum, 0) / count;
    const avgDifference = hours.reduce((sum, h) => sum + h.difference, 0) / count;

    return {
        start: window.start,
        end: window.end,
        duration: window.duration,
        avgTemp: avgTemp,
        avgAbsHum: avgAbsHum,
        avgDifference: avgDifference,
        isBest: false
    };
}

async function getGablitzHumidity() {
    // Gablitz coordinates
    const latitude = 48.2333;
    const longitude = 16.1167;

    // Build URL with parameters
    const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        hourly: 'relative_humidity_2m,temperature_2m',
        timezone: 'Europe/Vienna',
        forecast_days: 2  // 2 days for better planning
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params}`;

    console.log(`\n🏠 KELLERLÜFTUNGS-ASSISTENT FÜR GABLITZ\n`);
    console.log(`Fetching weather data for Gablitz (${latitude}°N, ${longitude}°E)...\n`);

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    displayWeatherData(json);
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function displayWeatherData(data) {
    const hourly = data.hourly || {};
    const times = hourly.time || [];
    const humidity = hourly.relative_humidity_2m || [];
    const temperature = hourly.temperature_2m || [];

    // Assumed basement conditions
    const basementTemp = 14;
    const basementRelHumidity = 65;
    const basementAbsHumidity = calculateAbsoluteHumidity(basementTemp, basementRelHumidity);

    console.log('═══════════════════════════════════════════════════════════════════════════════════════');
    console.log('📊 KELLERLÜFTUNGS-ANALYSE');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════');
    console.log(`Angenommene Kellerbedingungen: ${basementTemp}°C, ${basementRelHumidity}% rel. Feuchte`);
    console.log(`Absolute Feuchtigkeit im Keller: ${basementAbsHumidity.toFixed(1)} g/m³`);
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');

    console.log('Zeit                 Temp    Rel.    Abs.Feuchte  Empfehlung');
    console.log('                     (°C)    (%)     (g/m³)');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');

    const goodTimes = [];

    times.forEach((timeStr, i) => {
        const date = new Date(timeStr);
        const timeFormatted = date.toLocaleString('de-AT', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const temp = temperature[i];
        const relHum = humidity[i];
        const absHum = calculateAbsoluteHumidity(temp, relHum);

        const advice = getVentilationAdvice(absHum, basementTemp, basementRelHumidity);

        // Track good ventilation times
        if (advice.shouldVentilate) {
            goodTimes.push({
                time: date,
                timeFormatted: timeFormatted,
                temp: temp,
                absHum: absHum,
                difference: basementAbsHumidity - absHum
            });
        }

        // Color coding with symbols
        let statusSymbol = '';
        if (advice.status.includes('GUT')) {
            statusSymbol = '✓';
        } else if (advice.status.includes('NICHT')) {
            statusSymbol = '✗';
        } else {
            statusSymbol = '~';
        }

        console.log(
            `${timeFormatted.padEnd(20)} ` +
            `${temp.toFixed(1).padStart(5)}  ` +
            `${relHum.toString().padStart(5)}  ` +
            `${absHum.toFixed(1).padStart(8)}     ` +
            `${statusSymbol} ${advice.status}`
        );
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');

    // Get current conditions
    const now = new Date();
    const currentHourData = times.findIndex(timeStr => {
        const timeDate = new Date(timeStr);
        return timeDate >= now;
    });

    const currentTemp = temperature[currentHourData];
    const currentRelHum = humidity[currentHourData];
    const currentAbsHum = calculateAbsoluteHumidity(currentTemp, currentRelHum);
    const currentAdvice = getVentilationAdvice(currentAbsHum, basementTemp, basementRelHumidity);

    // Quick overview at the top
    console.log('╔═══════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          🏠 SCHNELLÜBERSICHT KELLERLÜFTUNG                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════════════╝\n');

    // Current status
    console.log('┌─────────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ 🕐 JETZT LÜFTEN?                                                                    │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────┤');

    if (currentAdvice.shouldVentilate) {
        console.log('│ ✅ JA, JETZT IST LÜFTEN EMPFOHLEN!                                                 │');
        console.log('│                                                                                     │');
        console.log(`│    Außentemperatur:     ${currentTemp.toFixed(1)}°C                                                       │`);
        console.log(`│    Rel. Luftfeuchtigkeit: ${currentRelHum}%                                                           │`);
        console.log(`│    Abs. Luftfeuchtigkeit: ${currentAbsHum.toFixed(1)} g/m³                                                  │`);
        console.log(`│    Vorteil:             ${(basementAbsHumidity - currentAbsHum).toFixed(1)} g/m³ trockener als Keller                         │`);
    } else {
        const statusEmoji = currentAdvice.status.includes('NICHT') ? '❌' : '⚠️';
        const statusText = currentAdvice.status.includes('NICHT') ? 'NEIN, NICHT LÜFTEN!' : 'BEDINGT GEEIGNET';

        console.log(`│ ${statusEmoji} ${statusText.padEnd(75)} │`);
        console.log('│                                                                                     │');
        console.log(`│    Außentemperatur:     ${currentTemp.toFixed(1)}°C                                                       │`);
        console.log(`│    Rel. Luftfeuchtigkeit: ${currentRelHum}%                                                           │`);
        console.log(`│    Abs. Luftfeuchtigkeit: ${currentAbsHum.toFixed(1)} g/m³                                                  │`);

        if (currentAbsHum > basementAbsHumidity) {
            console.log(`│    ⚠️  Außenluft ist ${(currentAbsHum - basementAbsHumidity).toFixed(1)} g/m³ FEUCHTER als Keller!                           │`);
        } else {
            console.log(`│    ℹ️  Nur ${(basementAbsHumidity - currentAbsHum).toFixed(1)} g/m³ trockener (geringer Vorteil)                          │`);
        }
    }

    console.log('└─────────────────────────────────────────────────────────────────────────────────────┘\n');

    // Summary of best ventilation times
    if (goodTimes.length > 0) {
        // Find ventilation windows (consecutive good hours)
        const ventilationWindows = findVentilationWindows(goodTimes);
        const bestWindow = ventilationWindows.find(w => w.isBest);

        console.log('┌─────────────────────────────────────────────────────────────────────────────────────┐');
        console.log('│ 🏆 BESTES LÜFTUNGSFENSTER                                                           │');
        console.log('├─────────────────────────────────────────────────────────────────────────────────────┤');
        console.log(`│    📅 Datum:            ${bestWindow.start.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).padEnd(43)} │`);
        console.log(`│    🕐 Zeitfenster:      ${bestWindow.start.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })} - ${bestWindow.end.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })} Uhr                                             │`);
        console.log(`│    ⏱️  Lüftungsdauer:    ${bestWindow.duration} Stunde${bestWindow.duration > 1 ? 'n' : ''}                                                    │`);
        console.log(`│    🌡️  Ø Temperatur:     ${bestWindow.avgTemp.toFixed(1)}°C                                                       │`);
        console.log(`│    💧 Ø Abs. Feuchte:   ${bestWindow.avgAbsHum.toFixed(1)} g/m³                                                  │`);
        console.log(`│    ✅ Vorteil:          ${bestWindow.avgDifference.toFixed(1)} g/m³ trockener als Keller                          │`);
        console.log('└─────────────────────────────────────────────────────────────────────────────────────┘\n');

        // All windows table
        if (ventilationWindows.length > 1) {
            console.log('┌─────────────────────────────────────────────────────────────────────────────────────┐');
            console.log('│ 📋 ALLE LÜFTUNGSZEITFENSTER                                                         │');
            console.log('├─────────────────────────────────────────────────────────────────────────────────────┤');
            console.log('│                                                                                     │');
            console.log('│  Datum     Zeitfenster          Dauer   Temp.   Abs.Feuchte  Vorteil              │');
            console.log('│                                 (Std)   (°C)    (g/m³)       (g/m³)                │');
            console.log('│  ─────────────────────────────────────────────────────────────────────────────     │');

            ventilationWindows.forEach((window, index) => {
                const dateStr = window.start.toLocaleDateString('de-AT', {
                    day: '2-digit',
                    month: '2-digit'
                });
                const startTime = window.start.toLocaleTimeString('de-AT', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const endTime = window.end.toLocaleTimeString('de-AT', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const timeRange = `${startTime}-${endTime}`;
                const durationStr = `${window.duration}h`;
                const avgTemp = window.avgTemp.toFixed(1);
                const avgAbsHum = window.avgAbsHum.toFixed(1);
                const avgDiff = window.avgDifference.toFixed(1);

                const marker = window.isBest ? '🏆' : '  ';

                console.log(
                    `│  ${marker} ${dateStr}  ${timeRange.padEnd(16)} ${durationStr.padStart(6)}  ` +
                    `${avgTemp.padStart(5)}  ${avgAbsHum.padStart(8)}     ${avgDiff.padStart(5)}              │`
                );
            });

            console.log('│                                                                                     │');
            console.log('└─────────────────────────────────────────────────────────────────────────────────────┘\n');
        }
    } else {
        console.log('┌─────────────────────────────────────────────────────────────────────────────────────┐');
        console.log('│ ⚠️  KEINE GEEIGNETEN LÜFTUNGSZEITEN                                                 │');
        console.log('├─────────────────────────────────────────────────────────────────────────────────────┤');
        console.log('│                                                                                     │');
        console.log('│    ❌ In den nächsten 48 Stunden gibt es KEINE guten Lüftungszeitfenster!          │');
        console.log('│                                                                                     │');
        console.log('│    Die Außenluft ist durchgehend zu feucht.                                        │');
        console.log('│    Kellerlüftung würde die Feuchtigkeit erhöhen statt reduzieren.                 │');
        console.log('│                                                                                     │');
        console.log('│    💡 Tipp: Versuchen Sie es später noch einmal oder warten Sie auf               │');
        console.log('│             kühlere/trockenere Wetterbedingungen.                                  │');
        console.log('│                                                                                     │');
        console.log('└─────────────────────────────────────────────────────────────────────────────────────┘\n');
    }

    console.log('═══════════════════════════════════════════════════════════════════════════════════════');
    console.log('\nℹ️  HINWEISE:');
    console.log('   • Lüften Sie nur, wenn die absolute Feuchtigkeit außen niedriger ist als innen');
    console.log('   • Beste Lüftungszeiten sind meist morgens und abends');
    console.log('   • Im Sommer ist die Außenluft oft zu feucht zum Kellerlüften');
    console.log('   • Passen Sie die angenommenen Kellerwerte im Script bei Bedarf an');
    console.log('\n   Datenquelle: Open-Meteo API');
    console.log(`   Abgerufen am: ${new Date().toLocaleString('de-AT')}`);
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
}

// Run the function
getGablitzHumidity()
    .then(() => {
        console.log('✓ Analyse erfolgreich abgeschlossen\n');
    })
    .catch((error) => {
        console.error('❌ Fehler beim Abrufen der Daten:', error.message);
        process.exit(1);
    });
