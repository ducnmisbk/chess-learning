import { PieceColor, PieceType } from '../core/types';

export type LessonCategory = 'opening' | 'middlegame' | 'endgame';

export interface PiecePlacement {
  type: PieceType;
  color: PieceColor;
  square: string; // algebraic (e.g. "e4")
  hasMoved?: boolean;
}

export type LessonSetup =
  | { type: 'initial' }
  | {
      type: 'custom';
      pieces: PiecePlacement[];
      currentPlayer: PieceColor;
      castlingRights?: {
        whiteKingSide: boolean;
        whiteQueenSide: boolean;
        blackKingSide: boolean;
        blackQueenSide: boolean;
      };
      enPassantTarget?: string | null; // algebraic square
    };

export interface LessonMove {
  from: string; // algebraic
  to: string; // algebraic
  promotion?: PieceType;
}

export interface LessonStage {
  id: string;
  objective: string;
  hints: string[];
  correctMoves: LessonMove[];
  setup?: LessonSetup;
  successMessage: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  stages: LessonStage[];
}

export const lessons: Lesson[] = [
  {
    id: 'opening-center-control',
    title: 'Control the Center',
    description: 'Start the game by claiming the center squares.',
    category: 'opening',
    stages: [
      {
        id: 'center-1',
        objective: 'Move a center pawn to e4 or d4.',
        hints: [
          'The center squares are d4, e4, d5, and e5.',
          'Try moving the pawn in front of your king or queen.',
          'A strong start is e4 or d4.'
        ],
        correctMoves: [
          { from: 'e2', to: 'e4' },
          { from: 'd2', to: 'd4' }
        ],
        setup: { type: 'initial' },
        successMessage: 'Great start! You took control of the center.',
        explanation: 'Center control helps your pieces move freely and attack faster.'
      }
    ]
  },
  {
    id: 'opening-develop-knights',
    title: 'Develop Your Knights',
    description: 'Bring your knights out early to help the center.',
    category: 'opening',
    stages: [
      {
        id: 'knight-1',
        objective: 'Develop a knight to f3 or c3.',
        hints: [
          'Knights love to jump toward the center.',
          'Try the knight on g1 or b1.',
          'Best squares: f3 or c3.'
        ],
        correctMoves: [
          { from: 'g1', to: 'f3' },
          { from: 'b1', to: 'c3' }
        ],
        setup: { type: 'initial' },
        successMessage: 'Nice! Your knight is active and ready to help.',
        explanation: 'Developed knights protect the center and prepare for castling.'
      }
    ]
  },
  {
    id: 'opening-center-then-develop',
    title: 'Center Then Develop',
    description: 'Start with a center pawn and then develop a knight.',
    category: 'opening',
    stages: [
      {
        id: 'center-dev-1',
        objective: 'Move the pawn to e4.',
        hints: [
          'This is a classic opening move for white.',
          'Move the pawn in front of your king.',
          'Click e2 then e4.'
        ],
        correctMoves: [{ from: 'e2', to: 'e4' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e1' },
            { type: PieceType.QUEEN, color: PieceColor.WHITE, square: 'd1' },
            { type: PieceType.PAWN, color: PieceColor.WHITE, square: 'e2' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e8' }
          ]
        },
        successMessage: 'Great! You claimed space in the center.',
        explanation: 'Center pawns help control key squares.'
      },
      {
        id: 'center-dev-2',
        objective: 'Develop the knight to f3.',
        hints: [
          'Now bring a knight toward the center.',
          'The knight on g1 can jump to f3.'
        ],
        correctMoves: [{ from: 'g1', to: 'f3' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e1' },
            { type: PieceType.QUEEN, color: PieceColor.WHITE, square: 'd1' },
            { type: PieceType.PAWN, color: PieceColor.WHITE, square: 'e4', hasMoved: true },
            { type: PieceType.KNIGHT, color: PieceColor.WHITE, square: 'g1' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e8' }
          ]
        },
        successMessage: 'Nice! Your knight is active.',
        explanation: 'Developing pieces quickly makes your position stronger.'
      }
    ]
  },
  {
    id: 'opening-castle',
    title: 'Castle for Safety',
    description: 'Learn how to castle to protect your king.',
    category: 'opening',
    stages: [
      {
        id: 'castle-1',
        objective: 'Castle kingside (move your king from e1 to g1).',
        hints: [
          'Castling moves the king two squares toward the rook.',
          'The rook jumps over the king to f1.',
          'Click the king, then click g1.'
        ],
        correctMoves: [{ from: 'e1', to: 'g1' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          castlingRights: {
            whiteKingSide: true,
            whiteQueenSide: false,
            blackKingSide: false,
            blackQueenSide: false
          },
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e1' },
            { type: PieceType.ROOK, color: PieceColor.WHITE, square: 'h1' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e8' }
          ]
        },
        successMessage: 'Awesome! Your king is safe.',
        explanation: 'Castling protects your king and connects your rook.'
      }
    ]
  },
  {
    id: 'middlegame-knight-fork',
    title: 'Knight Fork',
    description: 'Use a knight to attack two pieces at once.',
    category: 'middlegame',
    stages: [
      {
        id: 'fork-1',
        objective: 'Play Nf6+ to fork the king and rook.',
        hints: [
          'Knights attack in an L shape.',
          'Look for a move that gives check and hits another piece.',
          'Move the knight from d5 to f6.'
        ],
        correctMoves: [{ from: 'd5', to: 'f6' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e1' },
            { type: PieceType.KNIGHT, color: PieceColor.WHITE, square: 'd5' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e8' },
            { type: PieceType.ROOK, color: PieceColor.BLACK, square: 'g8' }
          ]
        },
        successMessage: 'Fork success! Two threats at once.',
        explanation: 'A fork lets one piece attack two pieces at the same time.'
      }
    ]
  },
  {
    id: 'middlegame-pin',
    title: 'Pin with a Bishop',
    description: 'Pin a piece to the king so it cannot move.',
    category: 'middlegame',
    stages: [
      {
        id: 'pin-1',
        objective: 'Play Bb5 to pin the knight.',
        hints: [
          'A pin means the piece behind cannot be exposed.',
          'The bishop can aim at the king through the knight.',
          'Move the bishop from c4 to b5.'
        ],
        correctMoves: [{ from: 'c4', to: 'b5' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e1' },
            { type: PieceType.BISHOP, color: PieceColor.WHITE, square: 'c4' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e8' },
            { type: PieceType.KNIGHT, color: PieceColor.BLACK, square: 'c6' }
          ]
        },
        successMessage: 'Nice pin! The knight cannot move.',
        explanation: 'If the knight moves, the king would be in check.'
      }
    ]
  },
  {
    id: 'middlegame-fork-then-win',
    title: 'Fork and Win Material',
    description: 'Use a fork and then capture a piece.',
    category: 'middlegame',
    stages: [
      {
        id: 'fork-win-1',
        objective: 'Play Nf6+ to fork the king and rook.',
        hints: [
          'Knights attack in an L shape.',
          'Move the knight from d5 to f6.'
        ],
        correctMoves: [{ from: 'd5', to: 'f6' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e1' },
            { type: PieceType.KNIGHT, color: PieceColor.WHITE, square: 'd5' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e8' },
            { type: PieceType.ROOK, color: PieceColor.BLACK, square: 'g8' }
          ]
        },
        successMessage: 'Fork success! Two threats at once.',
        explanation: 'A fork attacks two pieces at the same time.'
      },
      {
        id: 'fork-win-2',
        objective: 'Capture the rook with your knight.',
        hints: [
          'After the fork, take the rook.',
          'Move the knight from f6 to g8.'
        ],
        correctMoves: [{ from: 'f6', to: 'g8' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e1' },
            { type: PieceType.KNIGHT, color: PieceColor.WHITE, square: 'f6' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e7' },
            { type: PieceType.ROOK, color: PieceColor.BLACK, square: 'g8' }
          ]
        },
        successMessage: 'Great! You won the rook.',
        explanation: 'Forks help you win material.'
      }
    ]
  },
  {
    id: 'middlegame-discovered-attack',
    title: 'Discovered Attack',
    description: 'Move one piece to reveal an attack from another.',
    category: 'middlegame',
    stages: [
      {
        id: 'discover-1',
        objective: 'Move the bishop to reveal a rook attack on the queen.',
        hints: [
          'Your rook is behind the bishop on the same file.',
          'Move the bishop away without losing it.',
          'Try Be2 to b5.'
        ],
        correctMoves: [{ from: 'e2', to: 'b5' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'g1' },
            { type: PieceType.ROOK, color: PieceColor.WHITE, square: 'e1' },
            { type: PieceType.BISHOP, color: PieceColor.WHITE, square: 'e2' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'g8' },
            { type: PieceType.QUEEN, color: PieceColor.BLACK, square: 'e7' }
          ]
        },
        successMessage: 'Great! The rook is now attacking the queen.',
        explanation: 'A discovered attack happens when one piece moves and reveals another.'
      }
    ]
  },
  {
    id: 'endgame-king-activity',
    title: 'Activate Your King',
    description: 'In the endgame, the king should join the fight.',
    category: 'endgame',
    stages: [
      {
        id: 'king-1',
        objective: 'Move your king toward the center (e2 or d2).',
        hints: [
          'The king is a strong piece in the endgame.',
          'Move one square closer to the center.',
          'Try Ke2 or Kd2.'
        ],
        correctMoves: [
          { from: 'e1', to: 'e2' },
          { from: 'e1', to: 'd2' }
        ],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e1' },
            { type: PieceType.PAWN, color: PieceColor.WHITE, square: 'e4' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e7' }
          ]
        },
        successMessage: 'Nice! Your king is active.',
        explanation: 'An active king helps your pawns promote.'
      }
    ]
  },
  {
    id: 'endgame-pawn-promotion',
    title: 'Promote a Pawn',
    description: 'Push a pawn to the last rank and become a queen.',
    category: 'endgame',
    stages: [
      {
        id: 'promo-1',
        objective: 'Move the pawn to e8 and promote.',
        hints: [
          'A pawn becomes a queen on the last rank.',
          'Move the pawn from e7 to e8.',
          'You will promote automatically.'
        ],
        correctMoves: [{ from: 'e7', to: 'e8', promotion: PieceType.QUEEN }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e6' },
            { type: PieceType.PAWN, color: PieceColor.WHITE, square: 'e7' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'h8' }
          ]
        },
        successMessage: 'Promotion achieved! You have a new queen.',
        explanation: 'Promotion is a key endgame goal. Great job!'
      }
    ]
  },
  {
    id: 'endgame-king-and-pawn',
    title: 'King Helps the Pawn',
    description: 'Use your king to support a pawn push.',
    category: 'endgame',
    stages: [
      {
        id: 'kp-1',
        objective: 'Move your king to e5 to support the pawn.',
        hints: [
          'The king should be close to the pawn.',
          'Move the king from e4 to e5.'
        ],
        correctMoves: [{ from: 'e4', to: 'e5' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e4' },
            { type: PieceType.PAWN, color: PieceColor.WHITE, square: 'e3' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e7' }
          ]
        },
        successMessage: 'Nice! Your king is supporting the pawn.',
        explanation: 'A strong king helps pawns advance safely.'
      },
      {
        id: 'kp-2',
        objective: 'Push the pawn to e4.',
        hints: [
          'Now the pawn can move forward safely.',
          'Move the pawn from e3 to e4.'
        ],
        correctMoves: [{ from: 'e3', to: 'e4' }],
        setup: {
          type: 'custom',
          currentPlayer: PieceColor.WHITE,
          pieces: [
            { type: PieceType.KING, color: PieceColor.WHITE, square: 'e5' },
            { type: PieceType.PAWN, color: PieceColor.WHITE, square: 'e3' },
            { type: PieceType.KING, color: PieceColor.BLACK, square: 'e7' }
          ]
        },
        successMessage: 'Great push! Keep supporting your pawn.',
        explanation: 'The king and pawn work together in the endgame.'
      }
    ]
  }
];
