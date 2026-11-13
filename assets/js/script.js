 
    const sites = [
      { name: "Trinity Campus", lat: 53.34238, lng: -6.25265, baseline: 0.02, peakHour: 12.5, peakLevel: 0.9, spread: 2.4, secondaryHour: 17, secondaryLevel: 0.12 },
      { name: "Trinity Innovation Hub", lat: 53.34161, lng: -6.23941, baseline: 0.035, peakHour: 14, peakLevel: 0.62, spread: 3.1, secondaryHour: 9, secondaryLevel: 0.2 },
      { name: "Ringsend & Irishtown Community Centre (RICC)", lat: 53.34418, lng: -6.22859, baseline: 0.025, peakHour: 11.5, peakLevel: 0.78, spread: 2.2, secondaryHour: 16, secondaryLevel: 0.28 },
      { name: "Spencer Dock Park", lat: 53.34859, lng: -6.23746, baseline: 0.02, peakHour: 15, peakLevel: 0.86, spread: 2.7, secondaryHour: 10, secondaryLevel: 0.16 },
      { name: "St Laurence O'Toole Recreation Centre", lat: 53.35025, lng: -6.24281, baseline: 0.03, peakHour: 10, peakLevel: 0.58, spread: 2.5, secondaryHour: 14.5, secondaryLevel: 0.18 },
      { name: "Google", lat: 53.33993, lng: -6.2359, baseline: 0.02, peakHour: 13.5, peakLevel: 0.7, spread: 2.1, secondaryHour: 8.5, secondaryLevel: 0.2 },
      { name: "Salesforce", lat: 53.34754, lng: -6.23585, baseline: 0.035, peakHour: 16, peakLevel: 0.8, spread: 2.3, secondaryHour: 11, secondaryLevel: 0.14 }
    ];

    const threatLayers = [
      {
        id: "asian-hornet",
        name: "Asian hornet",
        description: "Invasive predator",
        color: "#d84b35",
        peakHour: 14,
        peakLevel: 0.84,
        spread: 3,
        baseline: 0.025,
        sightings: [[53.3447, -6.2548], [53.3479, -6.2295], [53.3385, -6.2440]]
      },
      {
        id: "varroa-mite",
        name: "Varroa mites",
        description: "Honey bee parasite",
        color: "#8654a8",
        peakHour: 11,
        peakLevel: 0.58,
        spread: 3.8,
        baseline: 0.015,
        sightings: [[53.3415, -6.2490], [53.3460, -6.2390], [53.3490, -6.2310]]
      },
      {
        id: "hive-beetle",
        name: "Large hive beetle",
        description: "Hive pest",
        color: "#cf8428",
        peakHour: 17,
        peakLevel: 0.72,
        spread: 3.2,
        baseline: 0.02,
        sightings: [[53.3420, -6.2350], [53.3480, -6.2470], [53.3380, -6.2290]]
      },
      {
        id: "bats",
        name: "Bats",
        description: "Insect-eating predators",
        color: "#3679a8",
        peakHour: 21.5,
        peakLevel: 0.9,
        spread: 2.7,
        baseline: 0.02,
        sightings: [[53.3450, -6.2520], [53.3500, -6.2360], [53.3410, -6.2270]]
      }
    ];

    const map = new maplibregl.Map({
      container: "map",
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [-6.24, 53.345],
      zoom: 13,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    document.getElementById("threat-list").innerHTML = threatLayers.map(layer =>
      `<label class="threat-toggle"><input type="checkbox" role="switch" data-threat="${layer.id}" aria-label="Show ${layer.name} example sightings"><span class="threat-swatch" style="background:${layer.color}"></span><span>${layer.name}<span class="threat-description">${layer.description}</span></span></label>`
    ).join("");

    const slider = document.getElementById("timeline");
    const timeLabel = document.getElementById("time-value");
    const playButton = document.getElementById("play-button");
    const threatInputs = [...document.querySelectorAll("[data-threat]")];
    const infoDialog = document.getElementById("demo-info");
    const legend = document.getElementById("map-legend");
    const legendToggle = document.getElementById("legend-toggle");
    let timer = null;

    function activityAt(hour, site) {
      const gaussian = (center, spread) => {
        const difference = Math.abs(hour - center) % 24;
        const circularDifference = Math.min(difference, 24 - difference);
        return Math.exp(-Math.pow(circularDifference / spread, 2) / 2);
      };
      const primaryPeak = site.peakLevel * gaussian(site.peakHour, site.spread);
      const secondaryPeak = site.secondaryLevel ? site.secondaryLevel * gaussian(site.secondaryHour, site.spread * 0.8) : 0;
      return Math.min(0.99, site.baseline + primaryPeak + secondaryPeak);
    }

    function currentHour() {
      return Number(slider.value) / 2;
    }

    function formatTime(hour) {
      const hours = Math.floor(hour);
      const minutes = hour % 1 ? "30" : "00";
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    }

    function updateTimeline() {
      const hour = currentHour();
      timeLabel.textContent = formatTime(hour);

      const levels = sites.map(site => activityAt(hour, site));
      const source = map.getSource("activity");
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: sites.map((site, index) => ({
            type: "Feature",
            properties: { name: site.name, weight: levels[index] },
            geometry: { type: "Point", coordinates: [site.lng, site.lat] }
          }))
        });
      }
      const average = levels.reduce((sum, level) => sum + level, 0) / levels.length;
      slider.setAttribute("aria-valuetext", `${timeLabel.textContent}, illustrative activity ${Math.round(average * 100)} out of 100`);
      updateThreats(hour);
    }

    function updateThreats(hour = currentHour()) {
      const source = map.getSource("threat-sightings");
      if (!source) return;

      const selectedThreats = new Set(
        threatInputs.filter(input => input.checked).map(input => input.dataset.threat)
      );
      source.setData({
        type: "FeatureCollection",
        features: threatLayers
          .filter(layer => selectedThreats.has(layer.id))
          .flatMap(layer => layer.sightings.map(([lat, lng], index) => {
            const locationProfile = {
              baseline: layer.baseline,
              peakHour: layer.peakHour + ((index % 3) - 1) * 0.6,
              peakLevel: layer.peakLevel * (0.82 + index * 0.09),
              spread: layer.spread,
              secondaryHour: layer.peakHour + 5,
              secondaryLevel: layer.peakLevel * 0.16
            };
            const weight = activityAt(hour, locationProfile);
            return {
            type: "Feature",
            properties: {
              threatId: layer.id,
              name: layer.name,
              color: layer.color,
              weight,
              time: formatTime(hour),
              exampleNumber: index + 1
            },
            geometry: { type: "Point", coordinates: [lng, lat] }
            };
          }))
      });
    }

    map.on("load", () => {
      map.addSource("activity", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });
      map.addLayer({
        id: "activity-heat",
        type: "heatmap",
        source: "activity",
        maxzoom: 18,
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 15, 1.5],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 28, 15, 42],
          "heatmap-opacity": 0.88,
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(40,117,238,0)",
              0.015, "rgba(40,117,238,0.2)",
              0.04, "rgba(40,117,238,0.4)",
              0.1, "#23c6a1",
              0.18, "#e4dc45",
              0.28, "#fa8736",
            1, "#ed453c"
          ]
        }
      });
      map.addLayer({
        id: "activity-glow",
        type: "circle",
        source: "activity",
        paint: {
          "circle-radius": [
              "interpolate", ["linear"], ["get", "weight"],
              0.025, 7,
              0.15, 11,
              0.5, 18,
              0.99, 27
          ],
          "circle-color": [
              "interpolate", ["linear"], ["get", "weight"],
              0.025, "#2875ee",
              0.15, "#2875ee",
              0.38, "#23c6a1",
              0.62, "#e4dc45",
              0.82, "#fa8736",
              0.99, "#ed453c"
          ],
          "circle-opacity": [
              "interpolate", ["linear"], ["get", "weight"],
              0.025, 0.2,
              0.3, 0.42,
              0.99, 0.72
          ],
          "circle-blur": 1
        }
      });
      map.addLayer({
        id: "location-points",
        type: "circle",
        source: "activity",
        paint: {
          "circle-radius": 5,
          "circle-color": "#0c3934",
          "circle-stroke-color": "#effff5",
          "circle-stroke-width": 2
        }
      });
      map.addLayer({
        id: "location-labels",
        type: "symbol",
        source: "activity",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-anchor": "left",
          "text-offset": [0.8, 0],
          "text-allow-overlap": false
        },
        paint: {
          "text-color": "#073033",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5
        }
      });
      map.addSource("threat-sightings", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });
      map.addLayer({
        id: "threat-activity-heat",
        type: "heatmap",
        source: "threat-sightings",
        maxzoom: 18,
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.7, 15, 1.3],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 24, 15, 38],
          "heatmap-opacity": 0.72,
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(40,117,238,0)",
            0.025, "rgba(40,117,238,0.2)",
            0.08, "rgba(40,117,238,0.48)",
            0.2, "#23c6a1",
            0.38, "#e4dc45",
            0.62, "#fa8736",
            1, "#ed453c"
          ]
        }
      });
      map.addLayer({
        id: "threat-markers",
        type: "circle",
        source: "threat-sightings",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "weight"],
            0, 4,
            0.25, 7,
            0.65, 10,
            0.99, 13
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": [
            "interpolate", ["linear"], ["get", "weight"],
            0, 0.28,
            0.1, 0.52,
            0.5, 0.92
          ],
          "circle-stroke-color": "#fffdf3",
          "circle-stroke-width": 2.5
        }
      });
      map.on("click", "threat-markers", event => {
        const feature = event.features[0];
        const content = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = `Simulated ${feature.properties.name} sighting`;
        const details = document.createElement("div");
        details.textContent = `${feature.properties.time} · Illustrative activity ${Math.round(feature.properties.weight * 100)} / 100`;
        const note = document.createElement("div");
        note.textContent = "Example location only — not a verified sighting.";
        content.append(title, details, note);
        new maplibregl.Popup({ offset: 12 })
          .setLngLat(feature.geometry.coordinates)
          .setDOMContent(content)
          .addTo(map);
      });
      map.on("mouseenter", "threat-markers", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "threat-markers", () => { map.getCanvas().style.cursor = ""; });
      const bounds = new maplibregl.LngLatBounds();
      sites.forEach(site => bounds.extend([site.lng, site.lat]));
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 185, left: 75, right: 75 },
        maxZoom: 14
      });
      updateTimeline();
      updateThreats();
    });

    threatInputs.forEach(input => input.addEventListener("change", updateThreats));
    document.getElementById("demo-info-button").addEventListener("click", () => infoDialog.showModal());
    document.getElementById("demo-info-close").addEventListener("click", () => infoDialog.close());
    document.getElementById("legend-toggle").addEventListener("click", () => {
      const collapsed = legend.classList.toggle("is-collapsed");
      legendToggle.setAttribute("aria-expanded", String(!collapsed));
      legendToggle.setAttribute("aria-label", `${collapsed ? "Show" : "Hide"} abundance legend`);
      legendToggle.querySelector("span").textContent = collapsed ? "›" : "‹";
    });

    function stopPlayback() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
      playButton.innerHTML = "▶&nbsp; Play";
      playButton.setAttribute("aria-label", "Play timeline");
    }

    slider.addEventListener("input", updateTimeline);
    playButton.addEventListener("click", () => {
      if (timer !== null) {
        stopPlayback();
        return;
      }
      if (Number(slider.value) >= Number(slider.max)) slider.value = slider.min;
      playButton.innerHTML = '<span class="pause-icon" aria-hidden="true"></span> Pause';
      playButton.setAttribute("aria-label", "Pause timeline");
      timer = window.setInterval(() => {
        const next = Number(slider.value) + 1;
        slider.value = String(next > Number(slider.max) ? Number(slider.min) : next);
        updateTimeline();
      }, 450);
      updateTimeline();
    });

    updateTimeline();
