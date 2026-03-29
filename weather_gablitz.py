#!/usr/bin/env python3
"""
Script to fetch hourly humidity data for Gablitz, Austria using Open-Meteo API
"""

import requests
import json
from datetime import datetime

def get_gablitz_humidity():
    """
    Fetch hourly humidity data for Gablitz (48.2333° N, 16.1167° E)
    """
    # Gablitz coordinates
    latitude = 48.2333
    longitude = 16.1167

    # Open-Meteo API endpoint
    url = "https://api.open-meteo.com/v1/forecast"

    # Parameters for hourly humidity
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "relative_humidity_2m,temperature_2m",
        "timezone": "Europe/Vienna",
        "forecast_days": 1
    }

    try:
        print(f"Fetching weather data for Gablitz ({latitude}°N, {longitude}°E)...\n")

        response = requests.get(url, params=params)
        response.raise_for_status()

        data = response.json()

        # Extract hourly data
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        humidity = hourly.get("relative_humidity_2m", [])
        temperature = hourly.get("temperature_2m", [])

        print("=" * 70)
        print("STÜNDLICHE LUFTFEUCHTIGKEIT IN GABLITZ")
        print("=" * 70)
        print(f"{'Zeit':<20} {'Luftfeuchtigkeit':<20} {'Temperatur':<15}")
        print("-" * 70)

        for i, time_str in enumerate(times):
            # Parse and format time
            dt = datetime.fromisoformat(time_str)
            time_formatted = dt.strftime("%d.%m.%Y %H:%M")

            humidity_val = humidity[i] if i < len(humidity) else "N/A"
            temp_val = temperature[i] if i < len(temperature) else "N/A"

            print(f"{time_formatted:<20} {humidity_val}%{'':<17} {temp_val}°C")

        print("=" * 70)
        print(f"\nDatenquelle: Open-Meteo API")
        print(f"Abgerufen am: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}")

        return data

    except requests.exceptions.RequestException as e:
        print(f"Fehler beim Abrufen der Daten: {e}")
        return None
    except Exception as e:
        print(f"Unerwarteter Fehler: {e}")
        return None

if __name__ == "__main__":
    get_gablitz_humidity()
