# 🎨 Assets Organization Guide

## Current Structure Issues
- ❌ Inconsistent naming conventions (`b_Bishop.png` vs `chess-bishop-black.png`)
- ❌ No separation by asset type
- ❌ Missing folders for sounds, UI, mascot, badges
- ❌ Difficult to add new themes

## Recommended Professional Structure

```
assets/
│
├── pieces/                          # Chess piece sprites
│   ├── classic/                     # Traditional Staunton style
│   │   ├── black-bishop.svg
│   │   ├── black-king.svg
│   │   ├── black-knight.svg
│   │   ├── black-pawn.svg
│   │   ├── black-queen.svg
│   │   ├── black-rook.svg
│   │   ├── white-bishop.svg
│   │   ├── white-king.svg
│   │   ├── white-knight.svg
│   │   ├── white-pawn.svg
│   │   ├── white-queen.svg
│   │   └── white-rook.svg
│   │
│   ├── minimalist/                  # Flat, simple geometric
│   │   └── [same 12 files]
│   │
│   └── fun/                         # Cartoon/kid-friendly
│       └── [same 12 files]
│
├── boards/                          # Board backgrounds and patterns
│   ├── classic/
│   │   ├── board-pattern.svg       # Repeatable pattern
│   │   ├── light-square.svg        # Individual square assets
│   │   ├── dark-square.svg
│   │   └── board-border.svg        # Optional decorative border
│   │
│   ├── minimalist/
│   │   └── [same files]
│   │
│   └── fun/
│       └── [same files]
│
├── ui/                              # User interface elements
│   ├── buttons/
│   │   ├── button-primary.svg      # Main action buttons
│   │   ├── button-secondary.svg
│   │   ├── button-icon-play.svg
│   │   ├── button-icon-pause.svg
│   │   ├── button-icon-undo.svg
│   │   ├── button-icon-redo.svg
│   │   ├── button-icon-hint.svg
│   │   ├── button-icon-settings.svg
│   │   ├── button-icon-home.svg
│   │   └── button-icon-close.svg
│   │
│   ├── icons/
│   │   ├── icon-checkmate.svg
│   │   ├── icon-check.svg
│   │   ├── icon-stalemate.svg
│   │   ├── icon-trophy.svg
│   │   ├── icon-star.svg
│   │   ├── icon-clock.svg
│   │   ├── icon-sound-on.svg
│   │   ├── icon-sound-off.svg
│   │   └── icon-theme.svg
│   │
│   ├── badges/                     # Achievement badges
│   │   ├── badge-first-game.svg
│   │   ├── badge-first-capture.svg
│   │   ├── badge-first-checkmate.svg
│   │   ├── badge-opening-tutorial.svg
│   │   ├── badge-3day-streak.svg
│   │   ├── badge-7day-streak.svg
│   │   ├── badge-win-easy.svg
│   │   ├── badge-win-medium.svg
│   │   ├── badge-win-hard.svg
│   │   ├── badge-use-undo.svg
│   │   ├── badge-10badges.svg
│   │   └── badge-locked.svg        # Template for locked badges
│   │
│   ├── highlights/                 # Board overlays
│   │   ├── highlight-legal-move.svg
│   │   ├── highlight-last-move.svg
│   │   ├── highlight-check.svg
│   │   ├── highlight-selected.svg
│   │   └── highlight-capture.svg
│   │
│   ├── backgrounds/
│   │   ├── bg-menu.svg
│   │   ├── bg-game.svg
│   │   └── bg-tutorial.svg
│   │
│   └── effects/                    # Particle effects, confetti
│       ├── confetti-particle.svg
│       ├── sparkle.svg
│       └── star-burst.svg
│
├── mascot/                          # ChessBuddy AI companion
│   ├── chessbuddy-idle.svg         # Default state
│   ├── chessbuddy-happy.svg        # Correct move
│   ├── chessbuddy-thinking.svg     # Waiting for player
│   ├── chessbuddy-celebrating.svg  # Lesson complete
│   ├── chessbuddy-encouraging.svg  # After mistake
│   └── chat-bubble.svg             # Dialogue container
│
├── sounds/                          # Audio assets
│   ├── sfx/                        # Sound effects
│   │   ├── move-piece.mp3
│   │   ├── move-piece.ogg          # Multiple formats for compatibility
│   │   ├── capture-piece.mp3
│   │   ├── capture-piece.ogg
│   │   ├── check.mp3
│   │   ├── check.ogg
│   │   ├── checkmate-win.mp3
│   │   ├── checkmate-win.ogg
│   │   ├── checkmate-lose.mp3
│   │   ├── checkmate-lose.ogg
│   │   ├── button-click.mp3
│   │   ├── button-click.ogg
│   │   ├── badge-unlock.mp3
│   │   ├── badge-unlock.ogg
│   │   ├── hint-appear.mp3
│   │   ├── hint-appear.ogg
│   │   ├── lesson-complete.mp3
│   │   └── lesson-complete.ogg
│   │
│   └── music/                      # Background music (optional)
│       ├── menu-theme.mp3
│       ├── menu-theme.ogg
│       ├── gameplay-calm.mp3
│       └── gameplay-calm.ogg
│
└── avatars/                         # User profile avatars
    ├── avatar-01-bear.svg
    ├── avatar-02-cat.svg
    ├── avatar-03-dog.svg
    ├── avatar-04-owl.svg
    ├── avatar-05-fox.svg
    ├── avatar-06-panda.svg
    ├── avatar-07-rabbit.svg
    ├── avatar-08-lion.svg
    ├── avatar-09-penguin.svg
    ├── avatar-10-koala.svg
    ├── avatar-11-elephant.svg
    └── avatar-12-giraffe.svg
```

---

## Naming Conventions

### Format: `{category}-{descriptor}-{variant}.{ext}`

#### Chess Pieces
- **Format**: `{color}-{piece}.svg`
- **Examples**: 
  - `black-bishop.svg`
  - `white-knight.svg`
- **Colors**: `black`, `white`
- **Pieces**: `pawn`, `knight`, `bishop`, `rook`, `queen`, `king`

#### Boards
- **Format**: `{element}-{descriptor}.svg`
- **Examples**:
  - `board-pattern.svg`
  - `light-square.svg`
  - `dark-square.svg`

#### UI Elements
- **Format**: `{type}-{name}.svg`
- **Examples**:
  - `button-primary.svg`
  - `icon-settings.svg`
  - `badge-first-game.svg`

#### Sounds
- **Format**: `{action}-{descriptor}.{ext}`
- **Examples**:
  - `move-piece.mp3`
  - `capture-piece.ogg`
  - `badge-unlock.mp3`

#### Mascot
- **Format**: `chessbuddy-{emotion}.svg`
- **Examples**:
  - `chessbuddy-idle.svg`
  - `chessbuddy-happy.svg`

#### Avatars
- **Format**: `avatar-{number}-{animal}.svg`
- **Examples**:
  - `avatar-01-bear.svg`
  - `avatar-08-lion.svg`

---

## File Format Guidelines

### Vector Assets (SVG)
**Use for**: Pieces, UI elements, icons, mascot, avatars, boards

**Benefits**:
- Scalable to any size (retina displays)
- Small file size
- Styleable with CSS
- Accessible (can add titles/descriptions)

**Requirements**:
- Clean, optimized paths
- Remove unnecessary metadata
- Use semantic IDs if needed for styling
- Viewbox centered at 0,0

**Optimization**:
```bash
# Use SVGO to optimize
npx svgo assets/pieces/classic/*.svg
```

---

### Raster Assets (PNG) - Use Sparingly
**Use for**: Complex illustrations, photos, textures

**Requirements**:
- Multiple resolutions: `@1x`, `@2x`, `@3x`
- Example: `board-texture@2x.png`
- Optimize with ImageOptim or similar

---

### Audio Assets
**Formats**: MP3 (compatibility) + OGG (quality)

**Requirements**:
- Mono for small files (SFX)
- Stereo for music
- Sample rate: 44.1kHz
- Bit rate: 128kbps (SFX), 192kbps (music)
- Normalize volume levels
- Max duration: 2-3s for SFX

**Optimization**:
```bash
# Convert to multiple formats
ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3
ffmpeg -i input.wav -codec:a libvorbis -qscale:a 6 output.ogg
```

---

## Asset Loading Strategy

### Critical Assets (Load First)
Needed for initial render:
```
pieces/classic/
boards/classic/
ui/buttons/button-primary.svg
ui/icons/icon-settings.svg
```

### Deferred Assets (Lazy Load)
Load when needed:
```
pieces/minimalist/        # Load when theme selected
pieces/fun/               # Load when theme selected
sounds/                   # Load after critical assets
mascot/                   # Load when tutorial starts
badges/                   # Load when badge screen opens
```

### Preload Strategy
```typescript
// In service worker
const CRITICAL_ASSETS = [
  '/assets/pieces/classic/white-pawn.svg',
  '/assets/pieces/classic/white-knight.svg',
  // ... other critical pieces
  '/assets/boards/classic/board-pattern.svg'
];

const LAZY_ASSETS = [
  '/assets/sounds/sfx/move-piece.mp3',
  '/assets/mascot/chessbuddy-idle.svg'
];
```

---

## Theme Management

### Theme Configuration File
Create `assets/themes.json`:

```json
{
  "themes": [
    {
      "id": "classic",
      "name": "Classic",
      "description": "Traditional wooden chess board",
      "pieces": "assets/pieces/classic",
      "board": "assets/boards/classic",
      "colors": {
        "lightSquare": "#F0D9B5",
        "darkSquare": "#B58863",
        "highlight": "#646F40",
        "check": "#E85D75"
      }
    },
    {
      "id": "minimalist",
      "name": "Minimalist",
      "description": "Clean and simple design",
      "pieces": "assets/pieces/minimalist",
      "board": "assets/boards/minimalist",
      "colors": {
        "lightSquare": "#EEEEEE",
        "darkSquare": "#BBBBBB",
        "highlight": "#7F9ACF",
        "check": "#FF6B6B"
      }
    },
    {
      "id": "fun",
      "name": "Fun",
      "description": "Colorful and playful",
      "pieces": "assets/pieces/fun",
      "board": "assets/boards/fun",
      "colors": {
        "lightSquare": "#FFF4E6",
        "darkSquare": "#7FB3D5",
        "highlight": "#FFD93D",
        "check": "#FF6B9D"
      }
    }
  ]
}
```

---

## Asset Manifest

### Create `assets/manifest.json` for versioning:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-10",
  "pieces": {
    "classic": {
      "format": "svg",
      "count": 12,
      "size": "~5KB per piece"
    },
    "minimalist": {
      "format": "svg",
      "count": 12,
      "size": "~3KB per piece"
    },
    "fun": {
      "format": "svg",
      "count": 12,
      "size": "~7KB per piece"
    }
  },
  "totalSize": "~850KB",
  "criticalSize": "~200KB"
}
```

---

## Migration from Current Structure

### Step-by-step Migration:

```bash
# 1. Create new structure
mkdir -p assets/{pieces,boards,ui,mascot,sounds,avatars}
mkdir -p assets/pieces/{classic,minimalist,fun}
mkdir -p assets/boards/{classic,minimalist,fun}
mkdir -p assets/ui/{buttons,icons,badges,highlights,backgrounds,effects}
mkdir -p assets/mascot
mkdir -p assets/sounds/{sfx,music}
mkdir -p assets/avatars

# 2. Convert pack-classic pieces (rename for consistency)
mv assets/pack-classic/w_Bishop.png assets/pieces/classic/white-bishop.png
mv assets/pack-classic/w_King.png assets/pieces/classic/white-king.png
mv assets/pack-classic/w_Knight.png assets/pieces/classic/white-knight.png
mv assets/pack-classic/w_Pawn.png assets/pieces/classic/white-pawn.png
mv assets/pack-classic/w_Queen.png assets/pieces/classic/white-queen.png
mv assets/pack-classic/w_Rook.png assets/pieces/classic/white-rook.png
mv assets/pack-classic/b_Bishop.png assets/pieces/classic/black-bishop.png
mv assets/pack-classic/b_King.png assets/pieces/classic/black-king.png
mv assets/pack-classic/b_Knight.png assets/pieces/classic/black-knight.png
mv assets/pack-classic/b_Pawn.png assets/pieces/classic/black-pawn.png
mv assets/pack-classic/b_Queen.png assets/pieces/classic/black-queen.png
mv assets/pack-classic/b_Rook.png assets/pieces/classic/black-rook.png

# 3. Convert pack-funny pieces
mv assets/pack-funny/chess-bishop-white.png assets/pieces/fun/white-bishop.png
mv assets/pack-funny/chess-king-white.png assets/pieces/fun/white-king.png
# ... (repeat for all pieces)

# 4. Move board
mv assets/pack-funny/board.png assets/boards/fun/board-pattern.png

# 5. Remove old folders
rm -rf assets/pack-classic
rm -rf assets/pack-funny

# 6. Convert PNGs to SVGs (if possible)
# Use online tools or design software to trace PNGs to SVG
```

---

## Asset Creation Guidelines

### For Designers

#### Chess Pieces
- **Size**: Design at 128×128px artboard
- **Style**: Recognize at small sizes (32×32px min)
- **Contrast**: High contrast for clarity
- **Silhouette**: Distinct piece shapes
- **Export**: SVG with centered viewbox

#### UI Icons
- **Size**: 24×24px or 32×32px artboard
- **Stroke**: 2px minimum
- **Grid**: Align to pixel grid
- **Padding**: 2-4px internal padding

#### Mascot (ChessBuddy)
- **Size**: 256×256px artboard
- **Style**: Friendly, approachable
- **Emotions**: Clear, exaggerated expressions
- **Export**: SVG, group by body part for potential animation

#### Badges
- **Size**: 96×96px artboard
- **Style**: Circular or shield shape
- **Icons**: Clear symbolism
- **Details**: Not too intricate (display at 48×48px)

---

## Performance Checklist

- [ ] All SVGs optimized with SVGO
- [ ] No embedded base64 images in SVGs
- [ ] Audio files compressed (< 100KB per SFX)
- [ ] Critical assets < 200KB total
- [ ] Lazy load non-critical themes
- [ ] Use image sprites for small icons (optional)
- [ ] Implement asset preloading in service worker
- [ ] Set proper cache headers

---

## Maintenance Guidelines

### Adding New Assets
1. Place in appropriate category folder
2. Follow naming convention
3. Optimize before committing
4. Update `manifest.json`
5. Update theme config if needed
6. Document in this guide

### Updating Existing Assets
1. Keep same filename
2. Update version in `manifest.json`
3. Test on all themes
4. Clear browser cache during testing

### Removing Assets
1. Check for dependencies in code
2. Remove from all themes
3. Update `manifest.json`
4. Document removal in changelog

---

## Quick Reference

### File Sizes (Target)
| Asset Type | Target Size |
|------------|-------------|
| SVG Piece | 3-7KB |
| SVG Icon | 1-3KB |
| SVG Mascot | 10-20KB |
| Sound Effect | 20-100KB |
| Background Music | 1-3MB |
| Board Pattern | 5-30KB |

### Load Priority
1. **Critical** (0-500ms): Classic pieces, board, basic UI
2. **Important** (500ms-2s): Sounds, highlights, buttons
3. **Deferred** (2s+): Other themes, music, badges, mascot

### Browser Support
- SVG: All modern browsers
- MP3: Universal
- OGG: Firefox, Chrome (backup format)

---

## Tools Recommendations

### Design
- **Figma** - UI/UX design, export SVGs
- **Inkscape** - Free vector editor
- **Illustrator** - Professional vector work

### Optimization
- **SVGO** - SVG optimization
- **ImageOptim** - PNG compression
- **Audacity** - Audio editing
- **FFmpeg** - Audio format conversion

### Testing
- **Chrome DevTools** - Network panel, asset size
- **Lighthouse** - Performance audit
- **WebPageTest** - Real-world loading

---

## Next Steps

1. **Immediate**: Reorganize existing assets following this guide
2. **Phase 2-4**: Create missing UI assets (buttons, icons)
3. **Phase 6**: Create badge designs
4. **Phase 7**: Design ChessBuddy mascot
5. **Phase 8**: Add sound effects
6. **Phase 9**: Create minimalist theme assets

---

**Remember**: Good asset organization = faster development + easier maintenance + better performance!
