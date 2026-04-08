// ─── Configuration ────────────────────────────────────────────────────────────
const API_BASE = "";

// ─── Leaflet Map State ────────────────────────────────────────────────────────
let _leafletMap = null;   // Leaflet map instance (reused across searches)
let _leafletMarker = null;   // Current pin

// ─── Icons ────────────────────────────────────────────────────────────────────
function icon(type) {
    const icons = {
        domain: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" stroke-width="1.3"/><ellipse cx="6.5" cy="6.5" rx="2.8" ry="5.5" stroke="#94a3b8" stroke-width="1.1"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="#94a3b8" stroke-width="1.1"/></svg>`,
        ip: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="11" height="8" rx="2" stroke="#94a3b8" stroke-width="1.3"/><line x1="4" y1="1" x2="4" y2="4" stroke="#94a3b8" stroke-width="1.3" stroke-linecap="round"/><line x1="9" y1="1" x2="9" y2="4" stroke="#94a3b8" stroke-width="1.3" stroke-linecap="round"/></svg>`,
        location: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5C4.57 1.5 3 3.07 3 5c0 2.62 3.5 6.5 3.5 6.5S10 7.62 10 5c0-1.93-1.57-3.5-3.5-3.5z" stroke="#94a3b8" stroke-width="1.3"/><circle cx="6.5" cy="5" r="1.2" fill="#94a3b8"/></svg>`,
        registrar: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="2" y="1.5" width="9" height="10" rx="1.5" stroke="#94a3b8" stroke-width="1.3"/><line x1="4.5" y1="4.5" x2="8.5" y2="4.5" stroke="#94a3b8" stroke-width="1.1" stroke-linecap="round"/><line x1="4.5" y1="6.5" x2="8.5" y2="6.5" stroke="#94a3b8" stroke-width="1.1" stroke-linecap="round"/><line x1="4.5" y1="8.5" x2="7" y2="8.5" stroke="#94a3b8" stroke-width="1.1" stroke-linecap="round"/></svg>`,
        date: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="2.5" width="11" height="9" rx="1.5" stroke="#94a3b8" stroke-width="1.3"/><line x1="4" y1="1" x2="4" y2="4" stroke="#94a3b8" stroke-width="1.3" stroke-linecap="round"/><line x1="9" y1="1" x2="9" y2="4" stroke="#94a3b8" stroke-width="1.3" stroke-linecap="round"/><line x1="1" y1="5.5" x2="12" y2="5.5" stroke="#94a3b8" stroke-width="1.1"/></svg>`,
        dns: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1.5" width="11" height="4" rx="1.2" stroke="#94a3b8" stroke-width="1.3"/><rect x="1" y="7.5" width="11" height="4" rx="1.2" stroke="#94a3b8" stroke-width="1.3"/><circle cx="3.5" cy="3.5" r="0.8" fill="#94a3b8"/><circle cx="3.5" cy="9.5" r="0.8" fill="#94a3b8"/></svg>`,
        org: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="1" width="4" height="3" rx="1" stroke="#94a3b8" stroke-width="1.2"/><rect x="1" y="8.5" width="3.5" height="3" rx="1" stroke="#94a3b8" stroke-width="1.2"/><rect x="8.5" y="8.5" width="3.5" height="3" rx="1" stroke="#94a3b8" stroke-width="1.2"/><line x1="6.5" y1="4" x2="6.5" y2="7.5" stroke="#94a3b8" stroke-width="1.1"/><line x1="2.75" y1="7.5" x2="10.25" y2="7.5" stroke="#94a3b8" stroke-width="1.1"/><line x1="2.75" y1="7.5" x2="2.75" y2="8.5" stroke="#94a3b8" stroke-width="1.1"/><line x1="10.25" y1="7.5" x2="10.25" y2="8.5" stroke="#94a3b8" stroke-width="1.1"/></svg>`
    };
    return icons[type] || "";
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function val(v) {
    return (v && v !== "N/A" && v !== "null" && v !== "undefined") ? v : "—";
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function getNS(data) {
    const raw = data.name_servers || data.nameservers || data.ns || [];
    if (Array.isArray(raw)) return raw.filter(Boolean).slice(0, 8);
    if (typeof raw === "string") return raw.split(/[\s,]+/).filter(Boolean).slice(0, 8);
    return [];
}

// ─── Cards ────────────────────────────────────────────────────────────────────
function buildCards(data) {
    const grid = document.getElementById("cardsGrid");
    grid.innerHTML = "";

    const cards = [
        { label: "Country", key: "country", icon: "location" },
        { label: "City / Region", key: "_city", icon: "location" },
        { label: "ISP / Org", key: "org", icon: "org" },
        { label: "Status", key: "status", icon: "registrar" },
    ];


    if (data.city || data.region) {
        data._city = [data.city, data.region].filter(Boolean).join(", ");
    }

    cards.forEach(c => {
        const v = val(data[c.key]);
        if (v === "—" && c.key === "_city") return;
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
            <div class="card-label">${icon(c.icon)}${c.label}</div>
            <div class="card-value${c.mono ? " mono" : ""}">${escapeHtml(v)}</div>
        `;
        grid.appendChild(div);
    });

    const nsArr = getNS(data);
    if (nsArr.length) {
        const div = document.createElement("div");
        div.className = "card wide";
        div.innerHTML = `
            <div class="card-label">${icon("dns")}Name Servers</div>
            <div class="tag-list">${nsArr.map(ns => `<span class="tag">${escapeHtml(ns)}</span>`).join("")}</div>
        `;
        grid.appendChild(div);
    }
}

// ─── Map ──────────────────────────────────────────────────────────────────────
/**
 * Initialise or update the Leaflet map for the given coordinates.
 * Safe to call multiple times — re-uses the same map instance.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {object} data  - Full API response (used for the popup label)
 */
function initMap(lat, lon, data) {
    // Validate coords before touching Leaflet
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
        showMapError("No geolocation data available for this domain.");
        return;
    }

    hideMapError();

    const mapEl = document.getElementById("leafletMap");
    const latlng = [lat, lon];

    // Build a human-readable popup line
    const label = [data.city, data.region, data.country]
        .filter(Boolean).join(", ") || "Unknown location";

    // ── First run: create the map ────────────────────────────────────────────
    if (!_leafletMap) {
        mapEl.style.display = "block";

        _leafletMap = L.map("leafletMap", {
            zoomControl: true,
            scrollWheelZoom: false,   // avoids accidental scroll-hijack
            attributionControl: true,
        }).setView(latlng, 12);

        // OpenStreetMap tiles (free, no API key)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
        }).addTo(_leafletMap);

        _leafletMarker = L.marker(latlng).addTo(_leafletMap);

    } else {
        // ── Subsequent searches: move existing map ───────────────────────────
        _leafletMap.setView(latlng, 12);
        _leafletMarker.setLatLng(latlng);
    }

    // Popup content
    const popupHtml = `
        <div style="font-family:'Segoe UI',sans-serif;font-size:12px;line-height:1.6">
            <strong style="font-size:13px">${escapeHtml(data.domain || "")}</strong><br>
            <span style="color:#64748b">${escapeHtml(data.ip || "")}</span><br>
            <span>${escapeHtml(label)}</span>
        </div>`;
    _leafletMarker.bindPopup(popupHtml, { maxWidth: 200 }).openPopup();

    // Update the map section header label
    document.getElementById("mapLabel").textContent =
        `Server Location — ${label}`;

    // Fix tile rendering when the container was hidden on init
    setTimeout(() => _leafletMap.invalidateSize(), 200);
}

// ─── Map UI Helpers ───────────────────────────────────────────────────────────
function showMapLoader(visible) {
    document.getElementById("map-loader").classList.toggle("hidden", !visible);
    if (visible) document.getElementById("leafletMap").style.display = "none";
}

function showMapError(msg) {
    const el = document.getElementById("map-error");
    el.textContent = msg;
    el.classList.remove("hidden");
    document.getElementById("leafletMap").style.display = "none";
}

function hideMapError() {
    document.getElementById("map-error").classList.add("hidden");
    document.getElementById("leafletMap").style.display = "block";
}

// ─── Button / Form Helpers ────────────────────────────────────────────────────
function setLoading(on) {
    const btn = document.getElementById("fetchBtn");
    const txt = document.getElementById("btnText");
    const spin = document.getElementById("btnSpinner");
    btn.disabled = on;
    txt.textContent = on ? "Analyzing…" : "Analyze";
    spin.classList.toggle("hidden", !on);
}

function showError(msg) {
    document.getElementById("errorMsg").textContent = msg;
    document.getElementById("errorBox").classList.remove("hidden");
}

function hideError() {
    document.getElementById("errorBox").classList.add("hidden");
}

function toggleRaw() {
    document.getElementById("result").classList.toggle("hidden");
    document.getElementById("rawArrow").classList.toggle("open");
}

// ─── Main Fetch ───────────────────────────────────────────────────────────────
async function fetchData() {
    const domainInput = document.getElementById("domainInput");
    const domain = domainInput.value.trim();

    if (!domain) {
        showError("Please enter a domain name.");
        return;
    }

    const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainPattern.test(domain)) {
        showError("Invalid domain format. Try something like 'example.com'.");
        return;
    }

    hideError();
    setLoading(true);
    showMapLoader(true);

    document.getElementById("resultDomain").textContent = "Fetching…";
    document.getElementById("resultSection").classList.remove("hidden");
    document.getElementById("mapSection").classList.remove("hidden");

    try {
        const response = await fetch(
            `${API_BASE}/api/track?domain=${encodeURIComponent(domain)}`
        );

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        console.log(data[0].location.lat);
        

        // ── Populate UI ──────────────────────────────────────────────────────
        document.getElementById("resultDomain").textContent = domain;
        document.getElementById("result").textContent = JSON.stringify(data, null, 2);

        buildCards(data[0].location);

        // ── Map ──────────────────────────────────────────────────────────────
        showMapLoader(false);
        const item = data[0];

        const lat = item.location?.lat;
        const lon = item.location?.lon;

        initMap(lat, lon, {
            ...item,
            city: item.location?.city,
            region: item.location?.regionName,
            country: item.location?.country
        });        // Reset raw JSON accordion
        document.getElementById("result").classList.add("hidden");
        document.getElementById("rawArrow").classList.remove("open");

    } catch (error) {
        showMapLoader(false);
        showMapError("Map unavailable — check if the backend is running.");
        showError(error.message || "Could not connect to the API. Is FastAPI running?");
    } finally {
        setLoading(false);
    }
}

// ─── Enter Key ────────────────────────────────────────────────────────────────
document.getElementById("domainInput").addEventListener("keydown", e => {
    if (e.key === "Enter") fetchData();
});