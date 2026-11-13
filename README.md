# WingSense demo

A static, interactive concept dashboard for exploring simulated insect activity and illustrative pollinator-threat layers around Dublin.

**This is a concept demo, not monitoring data.** No sensors are installed at these locations. All activity profiles and example sighting locations are synthetic and must not be interpreted as verified observations.

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
