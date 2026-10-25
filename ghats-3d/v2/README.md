# Real Kashi River Journey — Version 2 Preview

**URL:** `https://punyayatra.in/ghats-3d/v2/` (subject to GitHub Pages propagation; live browser validation pending)  
**Repository:** `Programmer-s-Picnic/punya` · `main` · `ghats-3d/v2/`

This preview does not replace the existing `ghats-3d/` application, booking page or home page. There is no preview link in the site's main navigation until approval.

## River-facing Boat Journey (2026-10-25)

**Default Boat Journey is now a river-facing photographic scene, not an overhead map.**

- Boat-bow point-of-view with gently animated water, wake and a perspective-based image pan.
- As the sightseeing animation approaches a major stop, it crossfades to that stop's verified subject photograph where available. The actual photograph's viewpoint is not guaranteed to be from the river; the UI explicitly states this.
- Missing place-specific photography is replaced with a labelled **general Varanasi ghats photograph taken from a Ganga boat**, not an invented place-specific photo. Original source: Wikimedia Commons, *Varanasi ghats seen from a boat on the Ganges river in October 2014.jpg*, photographer Rickard Törnblad, CC BY-SA 4.0.
- River-facing image area supports horizontal touch drag, river-level/wide image framing, cruise start/pause/resume, adjustable nonphysical sightseeing speed, and automatic pauses for each location's photo gallery.
- "Open map" exits the first-person scene and returns to the map viewer. The photo-based scene can run even if the map engine is unavailable.
- This is **not a continuous georeferenced video, 360° panorama for each stop, photorealistic 3D model, or navigable boat route**. Producing these requires appropriately licensed river-facing footage/panoramas or surveys for the entire route.

## Delivered

- Source-linked WGS84 coordinates for **15 major geographic stops**, including Shooltankeshwar Mahadev (Madhopur, **not** the homonymous downtown shrine), 13 historic ghats and Adi Keshav Ghat. 
- A 16th concluding confluence stop with its geographic point withheld pending specific hydrological verification.
- Traditional 84-ghat inventory with source-positioned map markers **only** for reviewed stops. Unverified entries can be browsed but are not assigned invented coordinates.
- Interactive MapLibre map, optional satellite imagery, 3D *mapped building extrusions* only where OSM building-height records exist, and real stop-location navigation. Photo and content panel remains usable if WebGL fails.
- Guided **map stop journey** with pause and resume, previous/next, route progress and shareable hash links.
- Per-stop gallery with modal viewer, thumbnails, manual-start autoplay slideshow and per-photo author/source/rights display. 
- Reviewed site photo from the existing Punya Yatra collection for Manikarnika, plus 12 original Wikimedia Commons file pages with verified subject and attribution metadata. Optional Commons image-search results remain explicitly marked **unreviewed** and cannot be asserted as verified photos. Other stops show no fabricated image.
- Hindi stop names, accessible control labels, mobile responsive UI.
- Local-only curator page at `/ghats-3d/v2/admin.html`: import/export validated draft JSON. **No server-side authentication or automatic database/GitHub publishing.** This is intentionally not a privileged admin panel.

## Geographic accuracy

The reference line is a polyline **connecting verified landmark coordinates**. It follows no surveyed navigable channel and no verified pedestrian footpath. Consecutive minimum distances use the haversine geodesic formula; totals are cumulative **lower bounds**, never accurate boat distance or walking directions.

Dataset: `data/places.json` and `data/reference-chain.geojson`. Verify local river/shoreline and steps with proper GIS/field surveys before using the map for real-world routing.

Map attribution: © OpenStreetMap contributors / OpenMapTiles, with satellite imagery © Esri and partners when selected. MapLibre and OpenFreeMap supply map rendering and buildings where mapped. 3D buildings are **not** photogrammetric reconstructions.

## Still required for full, geographically realistic digital twin

1. Verify individual positions and accessibility for the entire 84-ghat directory. Do not interpolate between major pins for individual ghats.
2. Digitise approved Ganga boat-route geometry, seasonal navigability, river-water level effects and pedestrian route sections from reliable mapped paths or on-site survey. Replace lower-bound reference chains with properly labelled routes.
3. Acquire photographic rights and location-specific images for all stops, ideally 3+ reviewed photos per place. Obtain dated images, exact authors, licences, source links, and review captions for historical and seasonal changes.
4. Source licensed detailed **georeferenced** architectural 3D meshes, building heights, façade textures, photogrammetry/3D tiles as available, with privacy and sacred-site protections. No invented high-fidelity models.
5. Implement protected MySQL/PHP backend at `cserver.learnwithchampak.live/punya/`, permissions, approval workflow, and secure media hosting. A static GitHub Pages site cannot safely store MySQL credentials.
6. Performance and cross-device **live browser** verification, actual tile provider SLA/licensing review, full WCAG testing, and stakeholder sign-off.

## QA / release checklist

- [x] JSON source structure generated and geodesic chain computed from cited coordinates.
- [x] Client assets committed and JavaScript syntax checked.
- [x] Preview path is isolated from existing production page.
- [x] Media review flags distinguish curated photographs from unreviewed search candidates.
- [x] Map failure retains access to gallery and location data.
- [ ] Load the actual GitHub Pages URL on Android Chrome and desktop; verify geolocation pins, tiles, photos and guided tour.
- [ ] Confirm mobile 30FPS target under real load.
- [ ] Confirm any required external tile/data licence and provider limits.
- [ ] Obtain missing GIS/photographic/3D content and site owner approval.
- [ ] Release to primary `/ghats-3d/` address after acceptance.

## Editorial process

Use `admin.html` to import a draft and edit records locally. Validate and download the revised JSON, compare it with the current `data/places.json`, review source rights and coordinate validity, and submit for approval. Do not upload confidential material into a public GitHub repository.

The area is culturally sensitive: do not depict or solicit private cremation rituals; distinguish heritage photography from the conduct of ongoing sacred rites.

**Maintained by Punya Yatra. Developed and maintained by Champak Roy.**
