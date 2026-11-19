 
    const sites = [
      { name: "Trinity Campus", type: "hive", icon: "🐝", experimental: true, lat: 53.34238, lng: -6.25265, baseline: 0.02, peakHour: 12.5, peakLevel: 0.9, spread: 2.4, secondaryHour: 17, secondaryLevel: 0.12 },
      { name: "Trinity Innovation Hub", type: "campus", icon: "🏢", lat: 53.34161, lng: -6.23941, baseline: 0.035, peakHour: 14, peakLevel: 0.62, spread: 3.1, secondaryHour: 9, secondaryLevel: 0.2 },
      { name: "Ringsend & Irishtown Community Centre (RICC)", type: "other", icon: "📍", lat: 53.34418, lng: -6.22859, baseline: 0.025, peakHour: 11.5, peakLevel: 0.78, spread: 2.2, secondaryHour: 16, secondaryLevel: 0.28 },
      { name: "Spencer Dock Park", type: "park", icon: "🌳", lat: 53.34859, lng: -6.23746, baseline: 0.02, peakHour: 15, peakLevel: 0.86, spread: 2.7, secondaryHour: 10, secondaryLevel: 0.16 },
      { name: "St Laurence O'Toole Recreation Centre", type: "other", icon: "📍", lat: 53.35025, lng: -6.24281, baseline: 0.03, peakHour: 10, peakLevel: 0.58, spread: 2.5, secondaryHour: 14.5, secondaryLevel: 0.18 },
      { name: "Google", type: "campus", icon: "🏢", lat: 53.33993, lng: -6.2359, baseline: 0.02, peakHour: 13.5, peakLevel: 0.7, spread: 2.1, secondaryHour: 8.5, secondaryLevel: 0.2 },
      { name: "Salesforce", type: "campus", icon: "🏢", lat: 53.34754, lng: -6.23585, baseline: 0.035, peakHour: 16, peakLevel: 0.8, spread: 2.3, secondaryHour: 11, secondaryLevel: 0.14 },
      { name: "Liffey Quays", type: "riverside", icon: "🌊", lat: 53.34785, lng: -6.2534, baseline: 0.025, peakHour: 14, peakLevel: 0.66, spread: 2.8, secondaryHour: 9.5, secondaryLevel: 0.18 }
    ];

    const weatherProfile = [
      { hour: 0, temperature: 8, humidity: 82, wind: 13, condition: "Cloudy", icon: "☁" },
      { hour: 3, temperature: 7, humidity: 85, wind: 12, condition: "Cloudy", icon: "☁" },
      { hour: 6, temperature: 7, humidity: 83, wind: 10, condition: "Partly cloudy", icon: "⛅" },
      { hour: 9, temperature: 10, humidity: 75, wind: 13, condition: "Partly cloudy", icon: "⛅" },
      { hour: 12, temperature: 13, humidity: 66, wind: 17, condition: "Mostly sunny", icon: "☀" },
      { hour: 15, temperature: 14, humidity: 62, wind: 18, condition: "Mostly sunny", icon: "☀" },
      { hour: 18, temperature: 12, humidity: 70, wind: 15, condition: "Partly cloudy", icon: "⛅" },
      { hour: 21, temperature: 10, humidity: 78, wind: 13, condition: "Cloudy", icon: "☁" },
      { hour: 24, temperature: 8, humidity: 82, wind: 13, condition: "Cloudy", icon: "☁" }
    ];

    const map = new maplibregl.Map({
      container: "map",
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [-6.24, 53.345],
      zoom: 13,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    const slider = document.getElementById("timeline");
    const timeLabel = document.getElementById("time-value");
    const playButton = document.getElementById("play-button");
    const infoDialog = document.getElementById("demo-info");
    const legend = document.getElementById("map-legend");
    const legendToggle = document.getElementById("legend-toggle");
    const weatherWidget = document.getElementById("weather-widget");
    const weatherToggle = document.getElementById("weather-toggle");
    const weatherContent = document.getElementById("weather-content");
    const experimentPanel = document.getElementById("experiment-panel");
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

    function updateWeather(hour) {
      const nextIndex = weatherProfile.findIndex(point => point.hour >= hour);
      const currentIndex = nextIndex <= 0 ? 0 : nextIndex - 1;
      const current = weatherProfile[currentIndex];
      const next = weatherProfile[Math.min(currentIndex + 1, weatherProfile.length - 1)];
      const progress = (hour - current.hour) / (next.hour - current.hour);
      const interpolate = key => Math.round(current[key] + (next[key] - current[key]) * progress);
      const condition = progress < 0.5 ? current : next;

      document.getElementById("weather-temperature").textContent = `${interpolate("temperature")}°`;
      document.getElementById("weather-humidity").textContent = `${interpolate("humidity")}%`;
      document.getElementById("weather-wind").textContent = `${interpolate("wind")} km/h`;
      document.getElementById("weather-condition").textContent = condition.condition;
      document.getElementById("weather-icon").textContent = condition.icon;
    }

    function updateTimeline() {
      const hour = currentHour();
      timeLabel.textContent = formatTime(hour);
      updateWeather(hour);

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
      sites.forEach(site => {
        const marker = document.createElement(site.experimental ? "button" : "div");
        marker.className = `map-site-marker map-site-marker--${site.type}`;
        marker.textContent = site.icon;
        marker.title = site.name;
        if (site.experimental) {
          marker.type = "button";
          marker.setAttribute("aria-label", "Show earlier experimental result for Trinity rooftop hive");
          marker.addEventListener("click", () => { experimentPanel.hidden = false; });
        } else {
          marker.setAttribute("role", "img");
          marker.setAttribute("aria-label", `${site.name}, proposed monitoring location`);
        }
        const mapMarker = new maplibregl.Marker({ element: marker, anchor: "center" })
          .setLngLat([site.lng, site.lat])
          .addTo(map);
        mapMarker.getElement().style.cursor = site.experimental ? "pointer" : "default";
      });
      const bounds = new maplibregl.LngLatBounds();
      sites.forEach(site => bounds.extend([site.lng, site.lat]));
      map.fitBounds(bounds, {
        padding: {
          top: 80,
          bottom: 185,
          left: 75,
          right: Math.min(245, Math.max(175, map.getCanvas().clientWidth * 0.42))
        },
        maxZoom: 14
      });
      updateTimeline();
    });

    document.getElementById("demo-info-button").addEventListener("click", () => infoDialog.showModal());
    document.getElementById("demo-info-close").addEventListener("click", () => infoDialog.close());
    document.getElementById("experiment-close").addEventListener("click", () => { experimentPanel.hidden = true; });
    document.addEventListener("click", event => {
      const target = event.target;
      if (target instanceof Element
        && !experimentPanel.hidden
        && !experimentPanel.contains(target)
        && !target.closest(".map-site-marker--hive")) {
        experimentPanel.hidden = true;
      }
    });
    document.getElementById("legend-toggle").addEventListener("click", () => {
      const collapsed = legend.classList.toggle("is-collapsed");
      legendToggle.setAttribute("aria-expanded", String(!collapsed));
      legendToggle.setAttribute("aria-label", `${collapsed ? "Show" : "Hide"} abundance legend`);
      legendToggle.querySelector("span").textContent = collapsed ? "›" : "‹";
    });
    weatherToggle.addEventListener("click", () => {
      const collapsed = weatherWidget.classList.toggle("is-collapsed");
      weatherToggle.setAttribute("aria-expanded", String(!collapsed));
      weatherToggle.setAttribute("aria-label", `${collapsed ? "Show" : "Hide"} weather panel`);
      weatherToggle.querySelector("span").textContent = collapsed ? "‹" : "›";
      weatherContent.setAttribute("aria-hidden", String(collapsed));
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
