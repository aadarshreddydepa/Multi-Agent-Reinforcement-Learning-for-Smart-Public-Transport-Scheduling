# Bus Route Data – Source of Truth

This folder holds all bus route and stop data used by the MARL simulation and frontend.

## Files

| File | Purpose |
|------|--------|
| **bus_route_details_extracted.txt** | Raw text extracted from `Bus route details.pdf` (for reference). |
| **bus_route_details_structured.json** | Structured route paths: each route’s start, end, and ordered list of stop names. **Single source of truth** for “which stops in which order.” |
| **landmarks_reference.json** | Every landmark/stop name from the PDF with its description (for geocoding and display). |
| **stops.json** | Stops used by the app: `id`, `name`, `location` (lat/lng), capacity, etc. Used by `RouteManager` and the map. |
| **routes.json** | Routes used by the app: `id`, `name`, `stops` (list of stop IDs), frequency, etc. Used by `RouteManager` and the map. |

## Start and end points

- **End point (all routes):** **CBIT** (Chaitanya Bharathi Institute of Technology).
- **Start points** (depot/origin) vary by route; they are listed in `bus_route_details_structured.json` under `"starting_points"` and per route as `"start_point"`.

## Adding or changing routes

1. Edit **bus_route_details_structured.json**:
   - Add or edit an entry in `route_paths` with `route_id`, `name`, `start_point`, `end_point`, and `stops_in_order` (array of stop display names).
2. Ensure every stop name in `stops_in_order` exists in **landmarks_reference.json** (and in **stops.json** if the app should show it on the map).
3. Run the generator (if you use it) to refresh **stops.json** / **routes.json** from the structured JSON, or update **stops.json** and **routes.json** by hand so they stay in sync with `bus_route_details_structured.json`.

## Coordinates

- **stops.json** uses `location: { lat, lng }` for the map. Values are currently placeholders (Hyderabad area). Replace with geocoded coordinates for production.
- **landmarks_reference.json** does not contain coordinates; it is a name/landmark reference only.
