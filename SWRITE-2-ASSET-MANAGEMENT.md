# SWRITE 2 — Asset Management Specification
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Asset Storage & Safe Importing

- **Location on Disk**: `Assets/Images/`
- **Supported Formats**: `JPG`, `JPEG`, `PNG`, `WebP`, `SVG`, `GIF`
- **Path Portability**: All image assets are stored and referenced using project-relative paths (e.g. `Assets/Images/map_of_valoria.png`).

### Import Logic:
1. Validates image extension against whitelist.
2. Resolves filename collisions automatically (e.g. `castle.png` $\to$ `castle_1.png`).
3. Safely copies bytes to `Assets/Images/` using atomic filesystem write.
4. Generates base64 data URLs for immediate rendering within webviews without exposing system-wide absolute paths.
