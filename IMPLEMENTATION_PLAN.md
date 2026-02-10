# 🏗️ Implementation Plan: Offline Chess Web Game for Kids

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Module Breakdown](#module-breakdown)
3. [Project Structure](#project-structure)
4. [Technology Decisions](#technology-decisions)
5. [Implementation Phases](#implementation-phases)
6. [Codex/Copilot Strategy](#codexcopilot-strategy)
7. [Technical Deep Dives](#technical-deep-dives)

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────┐
│                     Web Application                      │
│                   (Single Page App)                      │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐        ┌────▼────┐
   │   UI    │         │  Game   │        │  Data   │
   │  Layer  │◄───────►│ Engine  │◄──────►│  Layer  │
   └─────────┘         └─────────┘        └─────────┘
        │                   │                   │
        │              ┌────▼────┐              │
        │              │   AI    │              │
        │              │ Engine  │              │
        │              └─────────┘              │
        │                                       │
   ┌────▼────┐                            ┌────▼────┐
   │ Theme   │                            │ Storage │
   │ System  │                            │ Manager │
   └─────────┘                            └─────────┘
```

### Core Principles

1. **Separation of Concerns**: Clear boundaries between UI, game logic, and data
2. **Offline-First**: All core features work without network
3. **Progressive Enhancement**: Start simple, add complexity incrementally
4. **Testability**: Pure functions for game logic, mockable AI
5. **Kid-Friendly**: Simple state management, predictable behavior

### Data Flow

```
User Action → UI Event → Game State Update → AI Response (if needed) 
                                ↓
                         Render Update + Storage Sync
```

---

## Module Breakdown

### 1. **Core Game Engine** (`/core`)
**Responsibility**: Chess rules, move validation, game state management

- `board.ts` - Board representation (8×8 array)
- `pieces.ts` - Piece definitions and valid moves
- `move-validator.ts` - Legal move checking
- `game-state.ts` - Game state machine (playing, check, checkmate, stalemate)
- `move-history.ts` - Move tracking with undo/redo
- `fen-parser.ts` - FEN notation support (optional, for saving positions)

**Key Design Decisions**:
- Use 0-indexed 2D array `[row][col]` for board
- Each piece = `{ type, color, hasMoved }` object
- Immutable state updates (return new state, don't mutate)
- Pre-calculate all legal moves for highlighted squares

---

### 2. **AI Engine** (`/ai`)
**Responsibility**: Computer opponent logic

- `ai-interface.ts` - Common interface for all AI levels
- `ai-easy.ts` - Random legal moves
- `ai-medium.ts` - Minimax depth 2-3, basic scoring
- `ai-hard.ts` - Minimax depth 3-4, better heuristics
- `evaluator.ts` - Position evaluation (material, position, mobility)
- `move-generator.ts` - Efficient legal move generation

**Difficulty Progression**:

| Level  | Strategy | Depth | Features |
|--------|----------|-------|----------|
| Easy   | Random + avoid blunders | N/A | Random from legal moves, filter obvious losses |
| Medium | Minimax | 2-3 | Material count + center control |
| Hard   | Minimax + α-β pruning | 3-4 | Material + position tables + king safety |

**Evaluation Weights** (for AI):
```typescript
const PIECE_VALUES = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000
};

// Additional factors for medium/hard:
// - Center control: +10 per piece in center 4 squares
// - Piece-square tables for positional play
// - King safety in middlegame
```

---

### 3. **Tutorial / Guided Play** (`/tutorial`)
**Responsibility**: Educational layer on top of game engine

- `tutorial-manager.ts` - Tutorial flow control
- `lesson-library.ts` - Pre-defined lessons (opening, middlegame, endgame)
- `hint-system.ts` - Generate contextual hints
- `explanation-generator.ts` - Convert moves to kid-friendly text
- `ai-companion.ts` - Mascot personality and dialogue

**Guided Play Differences from Normal Play**:
- **State**: Tracks lesson progress + substeps
- **Hints**: Show suggested moves with reasons
- **Unlimited Undo**: Encourage experimentation
- **Explanations**: After each move, explain why it's good/bad
- **Checkpoints**: Lesson completion tracking

**Lesson Structure**:
```typescript
interface Lesson {
  id: string;
  title: string;
  description: string;
  stages: LessonStage[];
}

interface LessonStage {
  setup: FEN | "continue"; // Board position
  objective: string; // "Move knight to center"
  hints: string[];
  correctMoves: Move[]; // Accept multiple good moves
  explanation: string; // Shown after correct move
}
```

**AI Companion Personality**:
- Name: "ChessBuddy" 🦉 (suggest owl mascot)
- Tone: Encouraging, never critical
- Examples:
  - "Great thinking! 🌟"
  - "Want to try a different move? That's okay!"
  - "This knight can jump to protect your queen 🐴"

---

### 4. **UI Layer** (`/ui`)
**Responsibility**: Rendering, user interaction, theming

#### Sub-modules:

**4a. Board Rendering** (`/ui/board`)
- `board-renderer.ts` - Draw board, pieces, highlights
- `piece-renderer.ts` - SVG/image loading for pieces
- `animation.ts` - Smooth piece movement
- `highlight-manager.ts` - Show legal moves, last move, check

**4b. Components** (`/ui/components`)
- `game-screen.tsx` - Main game interface
- `menu-screen.tsx` - Mode selection
- `settings-screen.tsx` - Theme, sound, difficulty
- `tutorial-overlay.tsx` - Companion chat bubble
- `badge-display.tsx` - Achievement notifications

**4c. Theme System** (`/ui/themes`)
- `theme-manager.ts` - Theme switching
- `classic-theme.ts` - Wooden board
- `minimalist-theme.ts` - Flat design
- `fun-theme.ts` - Cartoon style

**Theme Configuration**:
```typescript
interface Theme {
  name: string;
  boardColors: { light: string; dark: string };
  pieceSet: "classic" | "minimalist" | "fun";
  fonts: FontConfig;
  sounds?: SoundPack;
}
```

---

### 5. **Data Layer** (`/data`)
**Responsibility**: Persistence, state sync, user accounts, skill tracking

- `storage-manager.ts` - Abstraction over IndexedDB/LocalStorage
- `user-manager.ts` - User profiles (username, avatar, skill profile)
- `game-history.ts` - Save/load enriched game records
- `progress-tracker.ts` - Track tutorial completion + learning path
- `badge-system.ts` - Achievement & reward logic
- `skill-engine.ts` - Rating calculation, tactical analysis, adaptive difficulty
- `learning-path.ts` - Personalized lesson recommendations

**Account Tiers**:
```
┌──────────────────────────────────────────────────┐
│ Guest          → Play immediately, no data saved │
│ Local Profile  → Full features, data on device   │
│ Family Account → Multiple profiles (post-MVP)    │
└──────────────────────────────────────────────────┘
```

**Skill Profile**:
```typescript
interface SkillProfile {
  rating: number;              // 400-1600 (kid-friendly Elo)
  level: SkillLevel;           // 'beginner' | 'developing' | 'intermediate' | 'advanced'
  tacticalSkills: {
    forks: number;             // 0-100 recognition score
    pins: number;
    skewers: number;
    discoveredAttacks: number;
  };
  phaseScores: {
    opening: number;           // 0-100
    middlegame: number;
    endgame: number;
  };
  mistakePatterns: string[];   // e.g. ['hangs_pieces', 'ignores_checks']
  adaptiveDifficulty: number;  // Auto-adjusted AI level (0.0 - 1.0)
}
```

**Enriched Game Record**:
```typescript
interface EnrichedGameRecord {
  id: string;
  userId: string;
  mode: 'pvp' | 'ai';
  difficulty?: 'easy' | 'medium' | 'hard';
  playerColor: 'white' | 'black';
  result: 'win' | 'loss' | 'draw';
  moves: string[];             // Algebraic notation
  timestamp: number;
  duration: number;            // Seconds
  
  // Enriched analysis data
  analysis: {
    blunders: number;
    mistakes: number;
    brilliantMoves: number;
    avgThinkTime: number;      // Seconds per move
    openingName?: string;      // Detected opening
    ratingChange: number;      // +/- points
    tacticsUsed: string[];     // ['fork', 'pin', ...]
  };
}
```

**Storage Schema**:
```
IndexedDB: chess_game_db
  ├─ users { id, username, avatar, createdAt, skillProfile, settings }
  ├─ games { id, userId, mode, moves, result, timestamp, analysis }
  ├─ progress { userId, lessonsCompleted, currentLesson, learningPath }
  ├─ badges { userId, badgeId, earnedAt }
  ├─ skills { userId, rating, tacticalSkills, phaseScores, history[] }
  └─ challenges { userId, dailyChallenge, weeklyGoals, streak }

LocalStorage: (for quick config)
  ├─ current_user_id
  ├─ theme_preference
  ├─ sound_enabled
  └─ adaptive_difficulty
```

---

### 6. **State Management** (`/state`)
**Responsibility**: Global app state

- `app-state.ts` - Current screen (menu, game, tutorial)
- `game-context.ts` - Active game state
- `ui-state.ts` - Modal dialogs, loading states

**State Management Approach**:
- **Simple pub-sub pattern** (no Redux needed)
- Centralized state object
- Components subscribe to state changes
- Pure functions for state updates

```typescript
class StateManager {
  private state: AppState;
  private listeners: Set<Listener>;
  
  getState(): AppState;
  setState(partial: Partial<AppState>): void;
  subscribe(listener: Listener): Unsubscribe;
}
```

---

### 7. **Service Layer** (`/services`)
**Responsibility**: Cross-cutting concerns

- `offline-manager.ts` - Service Worker registration
- `audio-manager.ts` - Sound effects (move, capture, check)
- `analytics.ts` - Local usage tracking (no external services)
- `ai-api-client.ts` - (Optional) API integration for advanced explanations

---

## Project Structure

```
chess-learning/
│
├── public/
│   ├── index.html
│   ├── manifest.json              # PWA manifest
│   └── service-worker.js          # Offline support
│
├── assets/                        # See ASSETS_ORGANIZATION_GUIDE.md
│   ├── pieces/                    # Chess piece sprites
│   │   ├── classic/               # Traditional pieces (12 SVG files)
│   │   ├── minimalist/            # Simple geometric (12 SVG files)
│   │   └── fun/                   # Cartoon style (12 SVG files)
│   ├── boards/                    # Board backgrounds
│   │   ├── classic/
│   │   ├── minimalist/
│   │   └── fun/
│   ├── ui/                        # UI elements
│   │   ├── buttons/               # Action buttons
│   │   ├── icons/                 # UI icons
│   │   ├── badges/                # Achievement badges
│   │   ├── highlights/            # Board overlays
│   │   ├── backgrounds/           # Screen backgrounds
│   │   └── effects/               # Particles, animations
│   ├── mascot/                    # ChessBuddy AI companion
│   │   ├── chessbuddy-idle.svg
│   │   ├── chessbuddy-happy.svg
│   │   ├── chessbuddy-thinking.svg
│   │   └── chat-bubble.svg
│   ├── sounds/                    # Audio files
│   │   ├── sfx/                   # Sound effects
│   │   └── music/                 # Background music (optional)
│   ├── avatars/                   # User profile pictures
│   ├── themes.json                # Theme configuration
│   └── manifest.json              # Asset versioning
│
├── src/
│   ├── main.ts                    # Entry point
│   ├── app.ts                     # App initialization
│   │
│   ├── core/                      # Game engine
│   │   ├── board.ts
│   │   ├── pieces.ts
│   │   ├── move-validator.ts
│   │   ├── game-state.ts
│   │   ├── move-history.ts
│   │   └── types.ts               # Shared types
│   │
│   ├── ai/                        # AI opponents
│   │   ├── ai-interface.ts
│   │   ├── ai-easy.ts
│   │   ├── ai-medium.ts
│   │   ├── ai-hard.ts
│   │   ├── evaluator.ts
│   │   ├── move-generator.ts
│   │   └── minimax.ts
│   │
│   ├── tutorial/                  # Guided play
│   │   ├── tutorial-manager.ts
│   │   ├── lesson-library.ts
│   │   ├── hint-system.ts
│   │   ├── explanation-generator.ts
│   │   ├── ai-companion.ts
│   │   └── lessons/               # Lesson definitions
│   │       ├── opening-basics.ts
│   │       ├── middlegame-tactics.ts
│   │       └── endgame-mates.ts
│   │
│   ├── ui/                        # User interface
│   │   ├── board/
│   │   │   ├── board-renderer.ts
│   │   │   ├── piece-renderer.ts
│   │   │   ├── animation.ts
│   │   │   └── highlight-manager.ts
│   │   ├── components/
│   │   │   ├── game-screen.ts
│   │   │   ├── menu-screen.ts
│   │   │   ├── settings-screen.ts
│   │   │   ├── tutorial-overlay.ts
│   │   │   ├── badge-notification.ts
│   │   │   └── modal-dialog.ts
│   │   ├── themes/
│   │   │   ├── theme-manager.ts
│   │   │   ├── classic-theme.ts
│   │   │   ├── minimalist-theme.ts
│   │   │   └── fun-theme.ts
│   │   └── styles/
│   │       ├── global.css
│   │       ├── board.css
│   │       └── components.css
│   │
│   ├── data/                      # Persistence
│   │   ├── storage-manager.ts
│   │   ├── user-manager.ts
│   │   ├── game-history.ts
│   │   ├── progress-tracker.ts
│   │   └── badge-system.ts
│   │
│   ├── state/                     # State management
│   │   ├── state-manager.ts
│   │   ├── app-state.ts
│   │   ├── game-context.ts
│   │   └── ui-state.ts
│   │
│   ├── services/                  # Cross-cutting
│   │   ├── offline-manager.ts
│   │   ├── audio-manager.ts
│   │   ├── analytics.ts
│   │   └── ai-api-client.ts
│   │
│   └── utils/                     # Helpers
│       ├── coordinates.ts         # Board coordinate conversions
│       ├── validation.ts
│       └── constants.ts
│
├── tests/                         # Unit tests
│   ├── core/
│   ├── ai/
│   └── tutorial/
│
├── docs/                          # Documentation
│   ├── architecture.md
│   ├── ai-design.md
│   └── tutorial-guide.md
│
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Build tool
└── README.md
```

---

## Technology Decisions

### Core Stack

| Technology | Choice | Rationale |
|------------|--------|-----------|
| **Language** | TypeScript | Type safety, better IDE support, scalable |
| **Build Tool** | Vite | Fast dev server, simple config, great for vanilla TS |
| **UI Framework** | Vanilla TS/JS | No framework overhead, full control, easier Codex generation |
| **State Management** | Custom pub-sub | Simple, no library, educational-friendly code |
| **Storage** | IndexedDB + LocalStorage | Offline-first, large data support |
| **PWA** | Service Worker | Full offline support, installable |

### Key Trade-offs

#### ✅ **Decision: No Framework (React/Vue/Svelte)**
**Why**:
- Simpler to understand for educational project
- No virtual DOM complexity
- Direct DOM manipulation is fine for chess (limited elements)
- Easier for Codex to generate correct vanilla code
- Smaller bundle size

**Trade-off**: More manual DOM work, but chess UI is simple enough.

---

#### ✅ **Decision: Custom Chess Logic vs chess.js**
**Why Custom**:
- Full control over simplifications
- Educational value (you understand every line)
- No unnecessary features (chess.js has PGN, UCI, etc.)
- Smaller bundle

**Trade-off**: More work upfront, but better for learning and customization.

---

#### ✅ **Decision: Local AI vs API**
**Why Local**:
- Offline-first requirement
- Immediate response (no latency)
- No API costs for basic play
- Privacy-friendly for kids

**Trade-off**: Limited AI strength, but appropriate for target age group.

**Optional Enhancement**: API for advanced explanations in Guided Play only.

---

#### ✅ **Decision: IndexedDB vs LocalStorage**
**Why IndexedDB**:
- Store full game histories (LocalStorage = 5-10MB limit)
- Better performance for complex queries
- Async API (non-blocking)

**Fallback**: Use LocalStorage for critical config if IndexedDB fails.

---

#### ✅ **Decision: SVG Pieces vs Canvas**
**Why SVG**:
- Scalable (retina displays, zoom)
- CSS styling
- Easier animation
- Accessible (can add alt text)

**Trade-off**: Slightly more DOM nodes, but negligible for 32 pieces.

---

### Browser Compatibility

**Target**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Polyfills Needed**: None (all features widely supported)

**Testing Priority**:
1. Chrome (primary)
2. Safari (iOS iPads)
3. Firefox (secondary)

### Asset Management

See **[ASSETS_ORGANIZATION_GUIDE.md](ASSETS_ORGANIZATION_GUIDE.md)** for:
- Professional folder structure
- Naming conventions
- File format guidelines
- Asset loading strategy
- Theme configuration
- Performance optimization
- Migration steps from current structure

---

## Implementation Phases

### Phase 0: Setup & Foundation (Week 1) ✅ COMPLETED
**Goal**: Project scaffolding and tooling

#### Tasks:
- [x] Initialize project with Vite + TypeScript
- [x] Set up folder structure
- [x] **Reorganize assets** following [ASSETS_ORGANIZATION_GUIDE.md](ASSETS_ORGANIZATION_GUIDE.md)
- [x] Configure tsconfig.json (strict mode)
- [x] Create basic HTML shell with canvas/div for board
- [x] Set up CSS reset + global styles
- [x] Add ESLint + Prettier (optional, for consistency)

#### Codex/Copilot Usage:
- ✅ Generate: Vite config, tsconfig, package.json scripts
- ⚠️ Manual: Review and adjust strict type settings

#### Deliverable:
- ✅ Empty project that builds and runs
- ✅ Hot reload working
- ✅ Basic styled page

---

### Phase 1: Core Game Engine (Week 1-2) ✅ COMPLETED
**Goal**: Playable chess with legal move validation (no AI)

#### Milestone 1.1: Board Representation ✅
- [x] Define `Board` class with 8×8 array
- [x] Define `Piece` type and piece constants
- [x] Write `initializeBoard()` function (starting position)
- [x] Write coordinate utilities (e.g., `algebraic('e4')` → `[4, 4]`)

#### Milestone 1.2: Move Validation ✅
- [x] Implement `getPossibleMoves(piece, position)` for each piece type:
  - Pawn (including en passant)
  - Knight
  - Bishop
  - Rook
  - Queen
  - King (including castling)
- [x] Filter moves that would leave king in check
- [x] Handle special rules: castling, en passant, promotion

#### Milestone 1.3: Game State Management ✅
- [x] `GameState` class with:
  - Current board
  - Active player (white/black)
  - Move history
  - Game status (playing, checkmate, stalemate, draw)
- [x] `isCheck()`, `isCheckmate()`, `isStalemate()` functions
- [x] `makeMove()` function with validation
- [x] `undo()` / `redo()` functions

#### Codex/Copilot Usage:
- ✅ Generate: Piece movement rules (well-defined logic)
- ✅ Generate: Check detection algorithms
- ⚠️ Manual: Review edge cases (castling through check, en passant timing)
- ✅ Generate: Unit tests for each piece type

#### Testing:
- ✅ Test each piece in isolation
- ✅ Test check detection
- ✅ Test checkmate scenarios (fool's mate, scholar's mate)
- ✅ Test stalemate

#### Deliverable:
- ✅ Console-based chess game that validates moves correctly
- ✅ No UI yet (just pure logic)

---

### Phase 2: Basic UI & 2-Player Mode (Week 2-3) ✅ COMPLETED
**Goal**: Visual board that two people can play on

#### Milestone 2.1: Board Rendering ✅
- [x] Create `BoardRenderer` class
- [x] Draw 8×8 grid with alternating colors
- [x] Load SVG piece images from `assets/pieces/classic/`
- [x] Render pieces on board
- [x] Handle different board orientations (white/black bottom)
- [x] Implement asset loading strategy (see [ASSETS_ORGANIZATION_GUIDE.md](ASSETS_ORGANIZATION_GUIDE.md))

#### Milestone 2.2: User Interaction ✅
- [x] Click to select piece (highlight legal moves)
- [x] Click destination to move
- [x] Drag-and-drop support (optional but nice)
- [x] Visual feedback:
  - Last move highlighting
  - Check highlighting
  - Legal move dots/squares

#### Milestone 2.3: Game Flow UI ✅
- [x] Turn indicator (White's turn / Black's turn)
- [x] Move history panel (simple list)
- [x] Undo/Redo buttons
- [x] New Game button
- [x] Game over modal (checkmate, stalemate)

#### Codex/Copilot Usage:
- ✅ Generate: SVG rendering code
- ✅ Generate: Event listeners for clicks
- ⚠️ Manual: Fine-tune CSS for kid-friendly sizing
- ✅ Generate: Animation timing functions

#### Deliverable:
- ✅ Fully playable 2-player local chess game
- ✅ Clean, functional UI (no themes yet)

---

### Phase 3: AI Opponent (Week 3-4) ✅ COMPLETED
**Goal**: Play against computer with 3 difficulty levels

#### Milestone 3.1: Easy AI (Random) ✅
- [x] Implement `AIEasy` class
- [x] Get all legal moves
- [x] Filter moves that immediately lose queen/rook (basic blunder check)
- [x] Pick random move from remaining
- [x] Add 500ms delay before AI moves (feels less robotic)

#### Milestone 3.2: Medium AI (Minimax Basic) ✅
- [x] Implement `AIMedium` class
- [x] Write `evaluatePosition()` function:
  - Material count (piece values)
  - Add bonus for center control (+10 per piece in center 4 squares)
- [x] Implement minimax algorithm (depth 2-3)
- [x] Add move ordering (captures first for better pruning)

#### Milestone 3.3: Hard AI (Minimax Advanced) ✅
- [x] Implement `AIHard` class
- [x] Enhanced evaluation:
  - Material + center control
  - Piece-square tables (positional bonuses)
  - King safety (penalty for exposed king in midgame)
  - Pawn structure basics
- [x] Increase depth to 3-4
- [x] Add alpha-beta pruning for performance

#### Milestone 3.4: AI Integration ✅
- [x] Mode selection screen (2-player vs AI)
- [x] Difficulty selector (Easy/Medium/Hard)
- [x] UI indication when AI is "thinking"

#### Codex/Copilot Usage:
- ✅ Generate: Minimax skeleton
- ✅ Generate: Evaluation function components
- ⚠️ Manual: Tune weights and depth for appropriate difficulty
- ✅ Generate: Alpha-beta pruning optimization
- ⚠️ Manual: Playtest to ensure Easy is winnable for kids

#### Testing:
- ✅ Test AI doesn't make illegal moves
- ⚠️ Test Easy loses to simple tactics (needs playtesting)
- ⚠️ Test Medium provides challenge (needs playtesting)
- ✅ Benchmark performance (moves should calculate <2 seconds)

#### Deliverable:
- ✅ Working AI opponents at 3 levels
- ✅ Smooth gameplay experience

---

### Phase 4: Theme System (Week 4) ✅ COMPLETED
**Goal**: Multiple visual styles

#### Milestone 4.1: Theme Architecture ✅
- [x] Create `ThemeManager` class
- [x] Define `Theme` interface
- [x] Implement theme switching without page reload

#### Milestone 4.2: Theme Implementation ✅
- [x] **Classic Theme**:
  - Load from `assets/pieces/classic/` and `assets/boards/classic/`
  - Traditional piece SVGs (Staunton style)
  - Warm browns and tans
- [x] **Minimalist Theme**:
  - Load from `assets/pieces/minimalist/` and `assets/boards/minimalist/`
  - Flat colors with 8 color options (black, white, blue, red, green, orange, purple, yellow)
  - Simple geometric pieces
  - Clean sans-serif fonts
  - **6 preset combinations** for easy customization
- [x] **Fun Theme**:
  - Load from `assets/pieces/fun/` and `assets/boards/fun/`
  - Bright primary colors
  - Cartoon piece designs
  - Rounded corners everywhere
- [x] Use `assets/themes.json` for theme configuration (see [ASSETS_ORGANIZATION_GUIDE.md](ASSETS_ORGANIZATION_GUIDE.md))

#### Milestone 4.3: Theme Selector UI ✅
- [x] Settings screen with theme preview cards
- [x] Save theme preference to LocalStorage
- [x] Apply theme on app startup
- [x] Color customization for Minimalist theme

#### Codex/Copilot Usage:
- ✅ Generate: CSS variables for theming
- ✅ Generate: Theme switching logic
- ✅ Manual: Design color palettes (8-color system implemented)
- ✅ Generate: Smooth transition animations

#### Deliverable:
- ✅ 3 polished themes (Classic, Minimalist, Fun)
- ✅ Persistent theme selection
- ✅ **BONUS**: 8-color customization system for Minimalist theme with 6 presets

---

### Phase 5: Data Persistence & Account System (Week 5-6)
**Goal**: User accounts with skill tracking, enriched game history, adaptive difficulty

#### Milestone 5.1: Storage Layer ✅
- [x] Implement `StorageManager` class (IndexedDB wrapper)
- [x] Create database schema (users, games, progress, badges)
- [x] Write CRUD operations for each table
- [x] Add error handling and fallback to LocalStorage

#### Milestone 5.2: User Management ✅
- [x] Simple account creation screen:
  - Username input (max 20 chars)
  - Avatar selector (12 preset emoji avatars)
  - No password needed (local only)
- [x] User login/logout
- [x] "Guest" mode for trying without account

#### Milestone 5.3: Game History ✅
- [x] Save completed games:
  - Date/time
  - Mode (2P, vs AI)
  - Difficulty (if AI)
  - Result (win/loss/draw)
  - Move list
- [x] Game history viewer
- [ ] Replay saved games (step through moves)

#### Milestone 5.4: Progress Tracking ✅
- [x] Track daily play streak
- [x] Track total games played
- [x] Track win rate by difficulty

#### Milestone 5.5: Skill Engine 🆕
- [ ] Implement `SkillEngine` class:
  - Kid-friendly rating system (400-1600, starts at 600)
  - Rating update after each game (simplified Elo)
  - Skill level mapping: Beginner (400-700) → Developing (700-1000) → Intermediate (1000-1300) → Advanced (1300-1600)
- [ ] Tactical skill tracking:
  - Detect forks, pins, skewers in games played
  - Score each tactical skill 0-100
  - Track improvement over time
- [ ] Game phase scoring:
  - Opening quality (development, center control, castling)
  - Middlegame quality (tactics, piece activity)
  - Endgame quality (king activation, pawn promotion)
- [ ] Mistake pattern detection:
  - Track recurring errors (hanging pieces, ignoring checks, poor trades)
  - Feed into learning path recommendations
- [ ] Rating history chart (visual progress over time)

#### Milestone 5.6: Enriched Game Records 🆕
- [ ] Post-game analysis:
  - Count blunders & mistakes (moves that lose significant material)
  - Detect brilliant moves (unexpected strong moves)
  - Track average think time per move
  - Detect opening name (match first 4-6 moves against opening database)
  - Calculate rating change
- [ ] Post-game review screen:
  - Summary: "You played 32 moves, found 2 tactics, made 1 blunder"
  - Move-by-move replay with annotations
  - "Best move" suggestions for key positions
- [ ] Enriched game card in history (show analysis highlights)

#### Milestone 5.7: Adaptive Difficulty 🆕
- [ ] Auto-adjust AI difficulty based on skill profile:
  - After 3 consecutive wins → suggest harder difficulty
  - After 3 consecutive losses → suggest easier difficulty
  - Smooth interpolation within difficulty level
- [ ] "Challenge Mode" toggle: AI adapts in real-time
- [ ] Difficulty recommendation on game start

#### Milestone 5.8: Account System Architecture 🆕
- [ ] 3-tier account system:
  - **Guest**: Play immediately, no data saved
  - **Local Profile**: Full features, IndexedDB persistence
  - **Family Account** (post-MVP): Multiple profiles on same device, parental dashboard
- [ ] Profile screen:
  - Skill level badge with icon
  - Rating with progress bar to next level
  - Quick stats (games played, win rate, current streak)
  - Tactical skill radar chart
  - Recent games list
- [ ] Account switcher (for family sharing)

#### Milestone 5.9: UI Flow Integration & Kid-Friendly UX ✅
- [x] Integrate account screen into main app flow:
  - Check user on app launch
  - Show account screen if no user logged in
  - Automatic transition to game after login
- [x] Add profile management to game menu:
  - "My Profile" section in hamburger menu
  - Display current user avatar and username
  - Logout button
  - Switch account button
  - Seamless navigation back to account screen
- [x] Kid-friendly design improvements (ages 5-10):
  - Rounded, playful font (Fredoka from Google Fonts)
  - Colorful gradient backgrounds with floating elements
  - Hero badges ("Offline • Kid-Friendly", "Ready to play")
  - Step-by-step instructions (Step 1-2-3)
  - Helper text for guidance ("This is your chess buddy")
  - Large, rounded buttons (14px border radius, 85% padding)
  - Pop-in animations and smooth transitions
  - Emoji avatars with hover effects (rotate, scale)
  - Responsive grid layouts (CSS Grid, auto-fit)
  - Mobile-first design with media queries
- [x] Enhanced Fun theme:
  - Oversized pieces (120% size)
  - Slight overflow beyond square boundaries
  - Drop shadow effects for depth
  - Preserved hover/select animations

#### Codex/Copilot Usage:
- ✅ Generate: IndexedDB boilerplate
- ✅ Generate: CRUD functions
- ✅ Generate: Rating calculation algorithms
- ✅ Generate: Tactical pattern detection
- ⚠️ Manual: Design user flow for account creation
- ⚠️ Manual: Tune rating system for kids (not too punishing)
- ✅ Generate: Data migration utilities (if schema changes)

#### Deliverable:
- ✅ Persistent user profiles with local storage (IndexedDB + LocalStorage fallback)
- ✅ Complete UI flow: Account screen ↔ Game screen with profile menu
- ✅ Kid-friendly UX design (ages 5-10) with Fredoka font and playful animations
- ✅ Enhanced Fun theme with oversized pieces
- ✅ 12 emoji avatar options with guest mode
- ✅ Progress statistics tracking (streaks, win rates)
- [ ] Enriched game history with post-game analysis (Milestone 5.6)
- [ ] Adaptive difficulty system (Milestone 5.7)
- [ ] Kid-friendly rating system with visible progress (Milestone 5.5)

---

### Phase 6: Reward & Badge System (Week 6-7)
**Goal**: Comprehensive gamification — badges, milestones, challenges, titles

#### Milestone 6.1: Badge Definitions (Core Badges)
- [ ] Define badge library:
  - 🏁 First Game (complete any game)
  - ♟️ First Capture
  - 👑 First Checkmate
  - 🧠 Complete Opening Tutorial
  - 🔥 3-Day Streak
  - 🔥 7-Day Streak
  - 🔥 30-Day Streak
  - 🎯 Win vs AI Easy
  - 🎯 Win vs AI Medium
  - 🎯 Win vs AI Hard
  - 🔁 Use Undo 5 Times (learning is okay!)
  - 🌟 Earn 10 Badges

#### Milestone 6.2: Skill Badges 🆕
- [ ] Rating milestone badges:
  - 🐣 Hatching (reach 500 rating)
  - 🐥 Fledgling (reach 700 rating)
  - 🦅 Soaring (reach 1000 rating)
  - 👑 Chess Champion (reach 1300 rating)
- [ ] Tactical skill badges:
  - ⚔️ Fork Master (execute 10 forks)
  - 📌 Pin Expert (execute 10 pins)
  - 💎 Brilliant Mind (play 5 brilliant moves)
  - 🎯 Sharp Eye (play 10 games with 0 blunders)
- [ ] Game phase badges:
  - 📖 Opening Scholar (opening score > 80 in 5 games)
  - ⚔️ Middlegame Warrior (middlegame score > 80 in 5 games)
  - 🏆 Endgame Master (endgame score > 80 in 5 games)

#### Milestone 6.3: Milestones & Titles 🆕
- [ ] Progressive milestones (cumulative):
  - Play 10 / 50 / 100 / 500 games
  - Win 5 / 25 / 100 games
  - Complete 3 / 6 / 10 lessons
  - Reach each skill level
- [ ] Title system (display next to username):
  - 🌱 "Newcomer" (0-10 games)
  - ♟️ "Pawn Pusher" (10-50 games)
  - 🐴 "Knight Rider" (50-100 games + rating 700+)
  - 🏰 "Castle Builder" (100-200 games + rating 1000+)
  - 👑 "Chess Master" (200+ games + rating 1300+)
- [ ] Title displayed on profile and in-game

#### Milestone 6.4: Daily & Weekly Challenges 🆕
- [ ] Daily challenge system:
  - "Win 1 game today"
  - "Play without using undo"
  - "Beat AI Medium"
  - "Complete a lesson"
  - Rotating pool of 20+ challenges
- [ ] Weekly goals:
  - "Play 5 games this week"
  - "Improve your rating by 50 points"
  - "Try all 3 AI difficulties"
- [ ] Challenge rewards (bonus XP or special badges)
- [ ] Challenge streak tracking

#### Milestone 6.5: Badge Logic
- [ ] `BadgeSystem` class with check methods
- [ ] `RewardEngine` class for challenges & milestones
- [ ] Hook badge checks into relevant events:
  - Game completion
  - Login (check streak + daily challenge)
  - Tutorial completion
  - Rating changes
  - Tactical skill updates
- [ ] Award badge + save to DB
- [ ] Track milestone progress (e.g., "15/50 games played")

#### Milestone 6.6: Reward UI
- [ ] Badge notification (toast/popup when earned)
- [ ] Badge collection screen (grid view with categories)
- [ ] Lock/unlock states with progress indicators
- [ ] Badge details (description, date earned)
- [ ] Daily challenge widget on home screen
- [ ] Weekly progress summary
- [ ] Title selector on profile
- [ ] Milestone progress bars
- [ ] Load badge icons from `assets/ui/badges/` (see [ASSETS_ORGANIZATION_GUIDE.md](ASSETS_ORGANIZATION_GUIDE.md))

#### Codex/Copilot Usage:
- ✅ Generate: Badge checking logic
- ✅ Generate: Challenge rotation system
- ✅ Generate: Notification animation
- ⚠️ Manual: Design fun badge icons
- ⚠️ Manual: Balance challenge difficulty for kids
- ✅ Generate: Grid layout for badge collection

#### Deliverable:
- Working badge system with 25+ badges across categories
- Milestone tracking with progress bars
- Daily & weekly challenge system
- Title system for players
- Engaging unlock notifications

---

### Phase 7: Tutorial/Guided Play & Learning Path (Week 7-8)
**Goal**: Interactive chess lessons with AI companion + personalized learning path

#### Milestone 7.1: Tutorial Architecture
- [ ] Create `TutorialManager` class
- [ ] Define lesson structure (stages, objectives, hints)
- [ ] Create tutorial state machine (intro → play → feedback → next)

#### Milestone 7.2: Lesson Library
- [ ] **Opening Lessons**:
  - Control the center (e4/d4 opening)
  - Develop knights and bishops
  - Don't move queen too early
  - Castle for king safety
- [ ] **Middlegame Lessons**:
  - Fork with knight
  - Pin with bishop/rook
  - Discovered attack
  - Defending against threats
- [ ] **Endgame Lessons**:
  - King activation
  - Pawn promotion
  - Rook checkmate
  - Queen checkmate

#### Milestone 7.3: Hint System
- [ ] Analyze current position
- [ ] Generate hints based on lesson objective
- [ ] Show suggested move with highlight
- [ ] Explain why move is good

#### Milestone 7.4: AI Companion (ChessBuddy)
- [ ] Create mascot character (owl recommended 🦉)
- [ ] Design mascot assets: idle, happy, thinking, celebrating, encouraging
- [ ] Save to `assets/mascot/` (see [ASSETS_ORGANIZATION_GUIDE.md](ASSETS_ORGANIZATION_GUIDE.md))
- [ ] Implement dialogue system with personality:
  - Encouraging, never critical
  - Use emojis
  - Simple language (5-10 year old reading level)
- [ ] Context-aware responses:
  - Good move → praise
  - Suboptimal move → gentle suggestion
  - Lesson complete → celebration
- [ ] Chat bubble UI overlay

#### Milestone 7.5: Tutorial UI
- [ ] Lesson selection menu
- [ ] Progress indicator (step X of Y)
- [ ] Hint button (always available)
- [ ] Unlimited undo in tutorial mode
- [ ] Explanation panel after each move

#### Milestone 7.6: Personalized Learning Path 🆕
- [ ] Implement `LearningPath` engine:
  - Analyze player's skill profile (from Phase 5)
  - Identify weakest areas (opening/middlegame/endgame, specific tactics)
  - Generate ordered list of recommended lessons
- [ ] Lesson recommendations:
  - "You often hang pieces → Try the 'Protecting Your Pieces' lesson"
  - "Your opening is weak → Start with 'Control the Center'"
  - "Great at tactics! → Try advanced endgame lessons"
- [ ] Learning path UI:
  - Visual path/roadmap (connected nodes)
  - Current position highlighted
  - Completed lessons with checkmarks
  - "Recommended Next" badge on suggested lesson
- [ ] Weekly learning goals:
  - "Complete 2 lessons this week"
  - "Practice fork tactics 3 times"
  - Auto-generated based on skill profile
- [ ] Progress integration:
  - After completing lessons, update skill profile
  - Recalculate learning path periodically
  - Show improvement: "Your opening score improved from 45 → 68!"

#### Milestone 7.7: Adaptive Tutorial Difficulty 🆕
- [ ] Adjust lesson difficulty based on player level:
  - Beginner: More hints, simpler positions, more encouragement
  - Intermediate: Fewer hints, complex positions, tactical challenges
  - Advanced: Minimal hints, multi-step tactics, positional puzzles
- [ ] Dynamic hint progression:
  - Strong players get subtle hints first
  - Struggling players get more explicit guidance
- [ ] Performance tracking per lesson:
  - Attempts needed, hints used, time taken
  - Feed back into skill profile

#### Milestone 7.8: (Optional) AI API Integration
- [ ] Create `AIExplanationClient` class
- [ ] Send position + move to LLM API
- [ ] Parse response into kid-friendly explanation
- [ ] Cache explanations locally
- [ ] Add API key settings screen

#### Codex/Copilot Usage:
- ✅ Generate: Lesson data structures
- ✅ Generate: Learning path algorithm
- ⚠️ Manual: Write lesson content (needs pedagogical thought)
- ✅ Generate: Hint algorithm
- ✅ Generate: Dialogue templates
- ⚠️ Manual: Curate and tone-check companion messages
- ⚠️ Manual: Map skill weaknesses to appropriate lessons
- ✅ Generate: API client boilerplate
- ⚠️ Manual: Design LLM prompts for explanations

#### Testing:
- Playtest each lesson with target age group
- Verify learning path recommendations make sense
- Ensure adaptive difficulty feels right per skill level
- Ensure hints are helpful but not overly directive
- Check that explanations are understandable

#### Deliverable:
- 6-10 interactive lessons
- Working AI companion
- Personalized learning path with visual roadmap
- Adaptive difficulty based on player skill
- Engaging tutorial experience

---

### Phase 8: Offline PWA & Performance (Week 8-9)
**Goal**: Full offline support, fast loading, installable

#### Milestone 8.1: Service Worker
- [ ] Create service worker script
- [ ] Cache strategy:
  - App shell (HTML, CSS, JS)
  - Piece images
  - Sounds (optional)
- [ ] Offline fallback page
- [ ] Cache versioning (for updates)

#### Milestone 8.2: PWA Manifest
- [ ] Create `manifest.json`:
  - App name and description
  - Icons (192×192, 512×512)
  - Theme color
  - Display mode (standalone)
  - Orientation (any)
- [ ] Add to HTML head

#### Milestone 8.3: Performance Optimization
- [ ] Lazy load non-critical assets
- [ ] Optimize piece SVGs (remove unnecessary paths)
- [ ] Code splitting (tutorial module separate)
- [ ] Minify CSS/JS
- [ ] Compress images

#### Milestone 8.4: Testing
- [ ] Test offline mode (turn off network)
- [ ] Test install on mobile (iOS Safari, Android Chrome)
- [ ] Lighthouse audit (aim for 90+ scores)

#### Codex/Copilot Usage:
- ✅ Generate: Service worker boilerplate
- ✅ Generate: Manifest.json
- ⚠️ Manual: Test on actual devices
- ✅ Generate: Build optimization scripts

#### Deliverable:
- Fully offline-capable PWA
- Fast loading (<3s on slow 3G)
- Installable on iOS and Android

---

### Phase 9: Polish & Audio (Week 9-10)
**Goal**: Sound effects, animations, juice

#### Milestone 9.1: Audio System
- [ ] Create `AudioManager` class
- [ ] Add sound effects (store in `assets/sounds/sfx/`):
  - Move piece (soft click)
  - Capture piece (stronger sound)
  - Check (alert sound)
  - Checkmate (victory/defeat music)
  - Button click
  - Badge unlock (jingle)
- [ ] Multiple formats: MP3 + OGG for compatibility
- [ ] Volume control
- [ ] Mute toggle (persistent)
- [ ] Follow audio optimization guide in [ASSETS_ORGANIZATION_GUIDE.md](ASSETS_ORGANIZATION_GUIDE.md)

#### Milestone 9.2: Animations & Juice
- [ ] Smooth piece sliding (not instant)
- [ ] Captured pieces fade out
- [ ] Shake animation for illegal move attempt
- [ ] Confetti on checkmate
- [ ] Sparkle on badge unlock
- [ ] Pulse effect on check

#### Milestone 9.3: Accessibility
- [ ] Keyboard navigation (tab through board)
- [ ] Screen reader support (piece positions announced)
- [ ] High contrast mode toggle
- [ ] Large text option

#### Codex/Copilot Usage:
- ✅ Generate: Audio loading and playback code
- ✅ Generate: CSS animations
- ⚠️ Manual: Select/create sound files
- ✅ Generate: ARIA labels for accessibility

#### Deliverable:
- Polished, juicy game feel
- Accessible to kids with different needs

---

### Phase 10: Testing & Refinement (Week 10-12)
**Goal**: Bug fixes, playtesting, balancing

#### Tasks:
- [ ] Comprehensive testing:
  - All game modes
  - All AI levels
  - All tutorials
  - Theme switching
  - Offline mode
  - Badge unlocking
- [ ] Playtest with target age group (5-10 year olds)
- [ ] Gather feedback on:
  - UI clarity
  - AI difficulty appropriate?
  - Tutorial helpfulness
  - Engagement level
- [ ] Fix bugs
- [ ] Adjust difficulty weights
- [ ] Refine tutorial content based on feedback
- [ ] Performance profiling (especially AI calculation)

#### Codex/Copilot Usage:
- ✅ Generate: Unit tests
- ✅ Generate: Integration tests
- ❌ Manual: User testing (can't be automated)

#### Deliverable:
- Stable, polished product
- Validated with actual users

---

## Codex/Copilot Strategy

### When to Use Copilot Effectively

#### ✅ **Excellent for Copilot:**
1. **Boilerplate code**
   - Class scaffolding
   - Interface definitions
   - Utility functions
2. **Well-defined algorithms**
   - Minimax implementation
   - Move validation for each piece
   - Check detection
3. **Data transformations**
   - Coordinate conversions
   - FEN parsing
   - State serialization
4. **UI components**
   - Button handlers
   - Modal dialogs
   - Form validation
5. **Standard patterns**
   - Event listeners
   - Pub-sub implementation
   - Local storage wrappers

#### ⚠️ **Use with Caution:**
1. **Edge cases in chess rules**
   - Castling through check
   - En passant timing
   - Threefold repetition
   → **Action**: Generate first, then manually verify against official chess rules
2. **AI evaluation function weights**
   → **Action**: Generate structure, manually tune numbers through playtesting
3. **Kid-friendly language**
   → **Action**: Generate templates, manually edit for appropriate tone/vocabulary
4. **Visual design decisions**
   → **Action**: Generate CSS structure, manually adjust colors/spacing

#### ❌ **Don't Use Copilot for:**
1. **Strategic decisions** (architecture choices)
2. **Lesson content** (requires pedagogical expertise)
3. **User testing feedback** (requires human judgment)
4. **Performance profiling** (requires measurement)

---

### Prompting Strategies

#### Strategy 1: Function-Level Generation
**Good for**: Core logic, utilities

**Prompt Template**:
```
// Generate a function that checks if a king is in check
// Parameters: board (8×8 array), kingPosition {row, col}, kingColor
// Return: boolean
// Logic:
// 1. Get all opponent pieces
// 2. For each opponent piece, get its possible moves
// 3. If any move targets the king's position, return true
// 4. Otherwise return false
```

→ Copilot generates the function

---

#### Strategy 2: Incremental Building
**Good for**: Complex features like minimax

**Steps**:
1. Write type definitions first
2. Write function signature with clear comments
3. Let Copilot fill implementation
4. Add unit test comments
5. Let Copilot generate tests

**Example**:
```typescript
interface MoveScore {
  move: Move;
  score: number;
}

// Minimax algorithm for chess AI
// Depth: how many moves ahead to search
// Returns the best move with its evaluation score
function minimax(
  board: Board, 
  depth: number, 
  isMaximizing: boolean,
  alpha: number,
  beta: number
): MoveScore {
  // [Copilot generates here]
}
```

---

#### Strategy 3: Test-Driven Prompting
**Good for**: Critical logic that must be correct

**Steps**:
1. Write test cases as comments
2. Write function signature
3. Let Copilot implement
4. Run tests, iterate

**Example**:
```typescript
// Test cases:
// 1. Knight at e4 can move to d2, f2, c3, g3, c5, g5, d6, f6
// 2. Knight at a1 can only move to b3, c2 (edge of board)
// 3. Knight cannot move to square occupied by same color piece
function getKnightMoves(board: Board, position: Position): Position[] {
  // [Copilot generates]
}
```

---

#### Strategy 4: Refinement Prompts
**Good for**: Improving generated code

**After Copilot generates initial code, add comments like**:
```typescript
// TODO: Optimize this function - we're recalculating legal moves too often
// TODO: Add error handling if piece is null
// TODO: Extract magic numbers to constants
```

→ Copilot suggests improvements

---

### Copilot in Different Phases

| Phase | Copilot Role | Manual Role | Ratio |
|-------|--------------|-------------|-------|
| Setup | Generate config files | Review settings | 80/20 |
| Core Engine | Generate move logic | Verify correctness | 70/30 |
| UI | Generate DOM code | Design visuals, UX flow | 60/40 |
| AI | Generate minimax | Tune weights, test difficulty | 65/35 |
| Themes | Generate CSS | Design color schemes | 50/50 |
| Data & Accounts | Generate CRUD, rating algo | Design schema, tune rating for kids | 65/35 |
| Rewards & Badges | Generate badge logic, challenges | Design badges, balance difficulty | 55/45 |
| Tutorial & Learning | Generate structure, path algo | Write content, map weaknesses | 40/60 |
| PWA | Generate SW config | Test on devices | 80/20 |
| Polish | Generate animations | Select sounds, adjust timing | 50/50 |

---

## Technical Deep Dives

### A. AI Difficulty Implementation

#### Easy AI: Random + No Blunders
```typescript
class AIEasy implements ChessAI {
  selectMove(board: Board): Move {
    const legalMoves = getAllLegalMoves(board, 'black');
    
    // Filter out obvious blunders (moves that lose queen/rook for nothing)
    const safeMoves = legalMoves.filter(move => {
      const futureBoard = applyMove(board, move);
      const materialLoss = evaluateMaterialChange(board, futureBoard);
      return materialLoss > -400; // Don't lose 4+ points of material
    });
    
    const moves = safeMoves.length > 0 ? safeMoves : legalMoves;
    return moves[Math.floor(Math.random() * moves.length)];
  }
}
```

**Why this works for kids**:
- Beatable by simple tactics (forks, pins)
- Doesn't make nonsensical moves
- Provides sense of accomplishment

---

#### Medium AI: Minimax Depth 2-3
```typescript
class AIMedium implements ChessAI {
  selectMove(board: Board): Move {
    return minimax(board, 2, true, -Infinity, Infinity).move;
  }
  
  evaluate(board: Board): number {
    let score = 0;
    
    // Material count
    score += countMaterial(board, 'white');
    score -= countMaterial(board, 'black');
    
    // Center control bonus
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    for (const sq of centerSquares) {
      const piece = getPiece(board, sq);
      if (piece) {
        score += (piece.color === 'white' ? 10 : -10);
      }
    }
    
    return score;
  }
}
```

**Why this works**:
- Sees 2-3 moves ahead (can spot simple tactics)
- Values center control (teaches good habits)
- Still makes positional mistakes

---

#### Hard AI: Minimax Depth 3-4 + Advanced Eval
```typescript
class AIHard implements ChessAI {
  selectMove(board: Board): Move {
    return minimax(board, 3, true, -Infinity, Infinity).move;
  }
  
  evaluate(board: Board): number {
    let score = 0;
    
    // Material
    score += countMaterial(board, 'white');
    score -= countMaterial(board, 'black');
    
    // Piece-square tables (positional bonuses)
    score += evaluatePiecePositions(board);
    
    // King safety
    score += evaluateKingSafety(board, 'white');
    score -= evaluateKingSafety(board, 'black');
    
    // Mobility (number of legal moves)
    score += getAllLegalMoves(board, 'white').length * 2;
    score -= getAllLegalMoves(board, 'black').length * 2;
    
    return score;
  }
}
```

**Piece-Square Tables Example (Knight)**:
```typescript
const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];
// Knights are better in the center
```

**Why this works**:
- Challenging for intermediate players
- Understands positional chess
- Still beatable with good tactics

---

### B. Guided Play vs Normal Play

#### Architecture Difference

```
Normal Play:
  Board State → User Click → Validate → Update → AI Turn

Guided Play:
  Lesson State → Board State → User Click → Validate + Check Lesson Goal
    ↓
  If correct → Explanation → Next Stage
  If incorrect → Hint → Allow Retry
```

#### Key Components Unique to Guided Play

**1. Lesson State Machine**
```typescript
enum LessonStage {
  INTRO = 'intro',           // Show lesson objective
  PLAYER_TURN = 'player',    // Wait for player move
  FEEDBACK = 'feedback',     // Explain the move
  AI_TURN = 'ai',           // Computer responds
  LESSON_COMPLETE = 'complete'
}

interface LessonState {
  currentStage: LessonStage;
  stageIndex: number;
  hintsUsed: number;
  attemptsThisStage: number;
}
```

**2. Move Validation with Learning**
```typescript
function validateLessonMove(
  move: Move, 
  lesson: Lesson, 
  stageIndex: number
): ValidationResult {
  const stage = lesson.stages[stageIndex];
  
  // Check if move is legal (always required)
  if (!isLegalMove(move)) {
    return { valid: false, feedback: "That move isn't allowed by the rules." };
  }
  
  // Check if move matches lesson objective
  const isCorrect = stage.correctMoves.some(m => 
    movesMatch(m, move)
  );
  
  if (isCorrect) {
    return { 
      valid: true, 
      feedback: stage.explanation,
      encouragement: getRandomPraise() // "Great job! 🌟"
    };
  }
  
  // Move is legal but not ideal for lesson
  return {
    valid: true,
    feedback: "That's a legal move, but there's a better one for what we're learning. Want a hint?",
    showHintButton: true
  };
}
```

**3. Hint System**
```typescript
function generateHint(lesson: Lesson, stageIndex: number, hintLevel: number): string {
  const stage = lesson.stages[stageIndex];
  
  // Progressive hints (get more specific)
  if (hintLevel === 1) {
    return stage.hints[0]; // General hint
  } else if (hintLevel === 2) {
    return stage.hints[1]; // More specific
  } else {
    // Show the actual move with arrow
    const move = stage.correctMoves[0];
    return `Try moving your ${move.piece} to ${move.destination} ✨`;
  }
}
```

**4. Unlimited Undo**
```typescript
// In normal play: optional undo
// In guided play: always available, no limits

function handleUndoInTutorial(state: TutorialState) {
  if (state.moveHistory.length > 0) {
    state.boardState = undoLastMove(state.boardState);
    state.companion.say("No problem! Let's try something else 😊");
    // Don't penalize for undo in tutorials
  }
}
```

---

### C. Offline-First Architecture

#### Service Worker Strategy

**Cache Layers**:
```
┌─────────────────────────────────────┐
│ Layer 1: App Shell (always cached)  │
│  - index.html, main.css, main.js,   │
│  - Core fonts, manifest.json        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Layer 2: Game Assets (cache-first)  │
│  - Piece SVGs, board images          │
│  - UI icons, mascot images           │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Layer 3: Optional (network-first)   │
│  - AI API calls (for explanations)  │
│  - Future online features           │
└─────────────────────────────────────┘
```

**Service Worker Implementation Pattern**:
```typescript
// service-worker.js
const CACHE_NAME = 'chess-game-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/styles.css',
  '/assets/pieces/classic/...',
  // ... all critical assets
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Fetch: cache-first strategy for assets
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});
```

---

#### Data Sync Strategy

**Problem**: User plays offline, then comes online. How to sync?

**Solution**: Event-based sync with versioning

```typescript
class DataSyncManager {
  private pendingWrites: QueuedWrite[] = [];
  
  // When online status changes
  handleOnlineStatus(isOnline: boolean) {
    if (isOnline) {
      this.syncPendingWrites();
    }
  }
  
  // Save data (works offline or online)
  async saveData(type: string, data: any) {
    const write: QueuedWrite = {
      id: generateId(),
      type,
      data,
      timestamp: Date.now()
    };
    
    // Always save locally first
    await this.localDB.save(type, data);
    
    // If online, sync immediately
    if (navigator.onLine) {
      await this.syncToCloud(write);
    } else {
      // Queue for later
      this.pendingWrites.push(write);
      await this.localDB.save('pending_syncs', write);
    }
  }
  
  private async syncPendingWrites() {
    for (const write of this.pendingWrites) {
      try {
        await this.syncToCloud(write);
        // Remove from queue on success
        this.pendingWrites = this.pendingWrites.filter(w => w.id !== write.id);
      } catch (error) {
        console.error('Sync failed, will retry', error);
      }
    }
  }
}
```

**For this MVP**: No cloud sync needed, all local. But architecture supports future sync.

---

### D. Performance Considerations

#### Minimax Optimization

**Problem**: Minimax at depth 4 can evaluate millions of positions

**Solutions**:

1. **Alpha-Beta Pruning** (reduces nodes by ~50%)
```typescript
function minimax(
  board: Board, 
  depth: number, 
  alpha: number, 
  beta: number
): MoveScore {
  if (depth === 0) return { move: null, score: evaluate(board) };
  
  const moves = getAllLegalMoves(board);
  let bestMove = moves[0];
  
  for (const move of moves) {
    const newBoard = applyMove(board, move);
    const score = -minimax(newBoard, depth - 1, -beta, -alpha).score;
    
    if (score > alpha) {
      alpha = score;
      bestMove = move;
    }
    
    // Prune: this branch can't be better than what we've found
    if (alpha >= beta) break;
  }
  
  return { move: bestMove, score: alpha };
}
```

2. **Move Ordering** (captures first → better pruning)
```typescript
function orderMoves(moves: Move[], board: Board): Move[] {
  return moves.sort((a, b) => {
    const scoreA = a.capture ? 100 : 0;
    const scoreB = b.capture ? 100 : 0;
    return scoreB - scoreA;
  });
}
```

3. **Iterative Deepening** (search depth 1, then 2, then 3... reuse results)

4. **Transposition Table** (cache position evaluations)
   → **Skip for MVP** (adds complexity)

---

#### Rendering Performance

**Problem**: Re-rendering entire board on every move

**Solution**: Dirty checking + incremental updates

```typescript
class BoardRenderer {
  private lastBoard: Board | null = null;
  
  render(board: Board) {
    if (!this.lastBoard) {
      this.renderFull(board);
    } else {
      this.renderDiff(this.lastBoard, board);
    }
    this.lastBoard = board;
  }
  
  private renderDiff(oldBoard: Board, newBoard: Board) {
    // Only update changed squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (oldBoard[row][col] !== newBoard[row][col]) {
          this.updateSquare(row, col, newBoard[row][col]);
        }
      }
    }
  }
}
```

---

### E. Account System & Skill Engine

#### Skill Rating Algorithm (Kid-Friendly Elo)

```typescript
class SkillEngine {
  // Simplified Elo for kids: less punishing, more rewarding
  private K_FACTOR = 32; // Standard, but with floor protection
  
  calculateNewRating(
    playerRating: number,
    opponentStrength: number, // AI difficulty mapped to rating
    result: 'win' | 'loss' | 'draw'
  ): { newRating: number; change: number } {
    const expected = 1 / (1 + Math.pow(10, (opponentStrength - playerRating) / 400));
    const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    
    let change = Math.round(this.K_FACTOR * (actual - expected));
    
    // Kid-friendly adjustments:
    // - Minimum +5 for a win (always feel rewarded)
    // - Maximum -10 for a loss (not too punishing)
    // - Bonus for beating higher-rated opponent
    if (result === 'win') {
      change = Math.max(change, 5);
      if (opponentStrength > playerRating) {
        change = Math.round(change * 1.5); // Bonus for upset
      }
    } else if (result === 'loss') {
      change = Math.max(change, -10); // Floor on losses
    }
    
    const newRating = Math.max(400, playerRating + change); // Never below 400
    return { newRating, change };
  }
  
  // Map AI difficulty to approximate rating
  getAIRating(difficulty: 'easy' | 'medium' | 'hard'): number {
    return { easy: 600, medium: 900, hard: 1200 }[difficulty];
  }
  
  // Determine skill level from rating
  getSkillLevel(rating: number): SkillLevel {
    if (rating < 700) return 'beginner';
    if (rating < 1000) return 'developing';
    if (rating < 1300) return 'intermediate';
    return 'advanced';
  }
}
```

#### Tactical Pattern Detection

```typescript
class TacticalAnalyzer {
  // Run after each move to detect tactics
  analyzeMoveForTactics(
    boardBefore: Board,
    boardAfter: Board,
    move: Move
  ): DetectedTactic[] {
    const tactics: DetectedTactic[] = [];
    
    // Detect fork: piece attacks 2+ higher-value pieces
    if (this.isFork(boardAfter, move)) {
      tactics.push({ type: 'fork', piece: move.piece, square: move.to });
    }
    
    // Detect pin: piece restricts opponent piece movement
    if (this.isPin(boardAfter, move)) {
      tactics.push({ type: 'pin', piece: move.piece, square: move.to });
    }
    
    // Detect skewer: attack through a valuable piece to one behind
    if (this.isSkewer(boardAfter, move)) {
      tactics.push({ type: 'skewer', piece: move.piece, square: move.to });
    }
    
    // Detect discovered attack
    if (this.isDiscoveredAttack(boardBefore, boardAfter, move)) {
      tactics.push({ type: 'discovered_attack', piece: move.piece, square: move.to });
    }
    
    return tactics;
  }
  
  // Detect blunders: moves that lose significant material
  isBlunder(boardBefore: Board, boardAfter: Board, move: Move): boolean {
    const materialBefore = this.evaluateMaterial(boardBefore, move.color);
    // Simulate opponent's best response
    const bestResponse = this.getBestResponse(boardAfter);
    const boardAfterResponse = applyMove(boardAfter, bestResponse);
    const materialAfter = this.evaluateMaterial(boardAfterResponse, move.color);
    
    return (materialBefore - materialAfter) > 200; // Lost 2+ pawns worth
  }
  
  // Detect brilliant moves: unexpected strong moves
  isBrilliant(boardBefore: Board, move: Move, allMoves: Move[]): boolean {
    // A move is brilliant if:
    // 1. It's the best move by a significant margin
    // 2. It involves a sacrifice or non-obvious tactic
    // 3. Most moves in the position are significantly worse
    const moveScores = allMoves.map(m => ({
      move: m,
      score: this.evaluateMove(boardBefore, m)
    }));
    
    const bestScore = Math.max(...moveScores.map(ms => ms.score));
    const thisScore = this.evaluateMove(boardBefore, move);
    const avgScore = moveScores.reduce((s, ms) => s + ms.score, 0) / moveScores.length;
    
    return thisScore === bestScore && (thisScore - avgScore) > 150;
  }
}
```

#### Learning Path Algorithm

```typescript
class LearningPathEngine {
  generatePath(profile: SkillProfile): LearsonRecommendation[] {
    const recommendations: LessonRecommendation[] = [];
    
    // Priority 1: Address mistake patterns
    for (const pattern of profile.mistakePatterns) {
      const lesson = this.getLessonForPattern(pattern);
      if (lesson && !this.isCompleted(lesson)) {
        recommendations.push({
          lesson,
          reason: this.getReasonForPattern(pattern),
          priority: 'high'
        });
      }
    }
    
    // Priority 2: Weakest game phase
    const weakestPhase = this.getWeakestPhase(profile.phaseScores);
    const phaseLessons = this.getLessonsForPhase(weakestPhase);
    for (const lesson of phaseLessons) {
      if (!this.isCompleted(lesson)) {
        recommendations.push({
          lesson,
          reason: `Strengthen your ${weakestPhase}`,
          priority: 'medium'
        });
      }
    }
    
    // Priority 3: Weakest tactical skill
    const weakestTactic = this.getWeakestTactic(profile.tacticalSkills);
    const tacticLessons = this.getLessonsForTactic(weakestTactic);
    for (const lesson of tacticLessons) {
      if (!this.isCompleted(lesson)) {
        recommendations.push({
          lesson,
          reason: `Practice ${weakestTactic} tactics`,
          priority: 'medium'
        });
      }
    }
    
    // Priority 4: Next difficulty level lessons
    if (recommendations.length < 3) {
      const nextLevel = this.getNextLevelLessons(profile.level);
      recommendations.push(...nextLevel.map(l => ({
        lesson: l,
        reason: 'Challenge yourself!',
        priority: 'low' as const
      })));
    }
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }
  
  private patternToLesson: Record<string, string> = {
    'hangs_pieces': 'protecting-your-pieces',
    'ignores_checks': 'responding-to-checks',
    'poor_trades': 'piece-value-exchange',
    'weak_opening': 'opening-basics',
    'no_castling': 'castle-for-safety',
    'queen_too_early': 'dont-move-queen-early',
  };
}
```

#### User Flow

```
App Start
  ├─ First time? → Welcome Screen → Create Profile (name + avatar)
  │                                    └→ Start with "Beginner" path
  │
  └─ Returning? → Profile Dashboard
                    ├─ Quick Play (last difficulty)
                    ├─ Today's Challenge ⭐
                    ├─ Continue Learning Path →
                    ├─ View Progress (rating chart, badges)
                    └─ Switch Profile (family mode)
                    
Post-Game Flow:
  Game Over → Result Screen
                ├─ Rating Change: "+12 ⭐ (Rating: 623 → 635)"
                ├─ Game Summary: "32 moves, 2 tactics found, 1 blunder"
                ├─ Badges Earned (if any): 🏅 animation
                ├─ Challenge Progress: "Daily: 1/1 ✅"
                ├─ [Review Game] → move-by-move replay
                ├─ [Play Again] → same settings
                └─ [Back to Dashboard]
```

---

## Summary Checklist

### Before Starting Development

- [ ] Read product spec thoroughly
- [ ] Review this implementation plan
- [ ] Set up development environment
- [ ] Create project repository
- [ ] Document architecture decisions

### During Development

- [ ] Follow phases sequentially (don't skip)
- [ ] Test each phase before moving to next
- [ ] Use Copilot for well-defined tasks
- [ ] Manually review critical logic (chess rules, AI)
- [ ] Commit frequently with clear messages

### Before Launch

- [ ] Complete all 10 phases
- [ ] Playtest with target age group (5-10 year olds)
- [ ] Get parent/teacher feedback
- [ ] Test on multiple devices (desktop, tablet, phone)
- [ ] Verify offline mode works completely
- [ ] Performance audit (Lighthouse 90+)
- [ ] Accessibility audit (WCAG AA minimum)

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Set up development environment** (Phase 0)
3. **Create GitHub repository** with initial structure
4. **Start Phase 1**: Core game engine
5. **Iterate based on testing feedback**

---

## Appendix: Useful Resources

### Project Documentation
- **[ASSETS_ORGANIZATION_GUIDE.md](ASSETS_ORGANIZATION_GUIDE.md)** - Professional asset management
- **[simple_offline_chess_web_game_product_technical_spec.md](simple_offline_chess_web_game_product_technical_spec.md)** - Original product spec

### Chess Programming
- [Chess Programming Wiki](https://www.chessprogramming.org/) - Minimax, evaluation functions
- Piece-square tables (standard values)
- Perft testing (validate move generation)

### Kid-Friendly UX
- Nielsen Norman Group: Design for Children
- COPPA compliance (even though offline, good principles)
- Color contrast checkers (WCAG)

### TypeScript/Web
- TypeScript Handbook (strict mode best practices)
- Vite documentation
- IndexedDB API (MDN)
- Service Worker Cookbook

### AI/NLP (for guided play)
- OpenAI API documentation (if using for explanations)
- Prompt engineering for kid-friendly language
- LangChain (if building complex AI flows)

### Asset Creation & Optimization
- SVGO - SVG optimization
- Figma - UI/UX design
- Audacity - Audio editing
- FFmpeg - Media conversion

---

**Total Estimated Timeline**: 10-12 weeks for MVP (expanded with Account System)
**Post-MVP**: Family accounts, cloud sync, user testing, iterations (+3-4 weeks)

**Good luck building! 🚀 ♟️ ✨**
