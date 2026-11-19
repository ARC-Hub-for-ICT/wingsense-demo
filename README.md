# WingSense demo

A static, interactive concept dashboard for exploring illustrative pollinator activity at proposed monitoring locations around Dublin.

**This is a concept demo, not live monitoring.** The map activity and timeline-linked weather are simulated, and the Asian hornet notification is a future-application concept—not a sighting. The Trinity rooftop hive panel shows an earlier experimental result: the radar-and-camera dataset class distribution from Figure 3.15 (9,620 labelled windows). All other map locations are proposed monitoring sites with no experimental results shown.

## Run locally

The site has no build step or package dependencies. From the project directory, start a local static server:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000>.

## GitHub Pages

The included GitHub Actions workflow deploys the repository root to GitHub Pages whenever changes are pushed to `main`. Once Pages is enabled for the repository, the site will be available at:

<https://arc-hub-for-ict.github.io/wingsense-demo/>

## Map and attribution

The interactive map uses MapLibre GL JS and OpenFreeMap basemap tiles. MapLibre and map-data attribution are displayed on the map. OpenFreeMap uses OpenStreetMap and OpenMapTiles data; see the [OpenFreeMap terms](https://openfreemap.org/tos/), [OpenMapTiles](https://www.openmaptiles.org/), and [OpenStreetMap copyright and licence](https://www.openstreetmap.org/copyright).

The WingSense logo is included as a project brand asset.
