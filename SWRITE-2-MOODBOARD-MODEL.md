# SWRITE 2 — Moodboard & Freeform Canvas Model
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Storage & Persistence Contract

Moodboards are stored on disk in project-portable JSON files at:

`Desk/Moodboards/<Board Name>/board.json`

### File Format Example:

```json
{
  "id": "mb-9104820",
  "name": "Northern Kingdom Atmosphere",
  "canvas": {
    "pan_x": 120.0,
    "pan_y": 80.0,
    "zoom": 1.15
  },
  "items": [
    {
      "type": "text",
      "id": "txt-a89",
      "x": 100,
      "y": 100,
      "width": 260,
      "height": 60,
      "text": "The Frozen Citadel",
      "style": "title",
      "z_index": 1
    },
    {
      "type": "color",
      "id": "col-b12",
      "x": 380,
      "y": 100,
      "width": 80,
      "height": 80,
      "hex": "#3B4252",
      "label": "Frost Slate",
      "z_index": 2
    },
    {
      "type": "image",
      "id": "img-c44",
      "x": 100,
      "y": 180,
      "width": 300,
      "height": 220,
      "asset_path": "Assets/Images/glacier_keep.jpg",
      "caption": "Northern battlements at dusk",
      "z_index": 3
    },
    {
      "type": "note",
      "id": "note-d77",
      "x": 420,
      "y": 200,
      "width": 220,
      "height": 160,
      "title": "Tactical Note",
      "content": "Defended by ice catapults and wind wards.",
      "z_index": 4
    },
    {
      "type": "link",
      "id": "link-e01",
      "x": 420,
      "y": 380,
      "width": 220,
      "height": 80,
      "title": "Lucan's Garrison",
      "target_path": "Desk/Characters/Lucan.md",
      "z_index": 5
    }
  ],
  "updated_at": 1700000000
}
```

---

## 2. Canvas Gestures & Interactions

| Gesture / Key | Action |
|---|---|
| **Left Click** | Select item |
| **Shift + Click** | Multi-select items |
| **Drag Selected** | Move item(s) across canvas |
| **Bottom-Right Handle Drag** | Resize item width & height |
| **Mouse Wheel** | Vertical / horizontal pan |
| **Ctrl + Mouse Wheel** | Zoom in / Zoom out (0.2x to 3.0x) |
| **Middle Click Drag / Space Drag** | Pan canvas |
| **Delete / Backspace** | Delete selected item(s) |
| **Ctrl + D** | Duplicate selected item(s) with offset |
| **Ctrl + 0** | Reset pan and zoom to 100% |
