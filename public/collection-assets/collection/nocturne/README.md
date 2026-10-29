# Nocturne — Jacket Image Assets

## Folder structure

```
assets/collection/nocturne/
├── curiosity/curiosity.jpg     — 01 Curiosity, Dark Navy
├── temptation/temptation.jpg   — 02 Temptation, Forest Green
├── desire/desire.jpg           — 03 Desire, Deep Red
├── audacity/audacity.jpg       — 04 Audacity, Deep Mustard
└── insolence/insolence.jpg     — 05 Insolence, Black
```

## Replacing with production photos

Drop the final file in place of the placeholder — filename and path must remain identical.

| Jacket | Path | Colour |
|---|---|---|
| 01 Curiosity | `curiosity/curiosity.jpg` | Dark Navy |
| 02 Temptation | `temptation/temptation.jpg` | Forest Green |
| 03 Desire | `desire/desire.jpg` | Deep Red |
| 04 Audacity | `audacity/audacity.jpg` | Deep Mustard |
| 05 Insolence | `insolence/insolence.jpg` | Black |

## Recommended image spec

- **Format**: JPG (or WebP — update path + `app.js` `IMAGE_BASE` template if using WebP)
- **Orientation**: portrait — **4 : 5** ratio
- **Dimensions**: **1200 × 1500 px** (max)
- **File size**: ≤ 400 KB per image
- **Background**: white or transparent (PNG) — the drop-shadow filter works best on a clean bg
- **Subject**: jacket on a hanger or flat lay, centred, with enough breathing room at top and bottom

## Construction copy (⚠ PENDING)

The "The Construction" detail row is hidden on the live page until copy is
supplied. Add it to the matching `construction:` field in `app.js` for each jacket:

```js
construction: 'Your copy here.',
```

Once a non-null string is set, the row appears automatically.

## Brand name

**Ekkomi** (double-K, single-M).

- `<title>`: Ekkomi — Nocturne ✓
- Header wordmark: EKKOMI ✓  
- Footer: Ekkomi ✓

The original HTML had `EKOMMI` (one K, two M) in the wordmark — corrected to `EKKOMI`.
