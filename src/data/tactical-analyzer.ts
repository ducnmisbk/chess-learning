/**
 * Tactical Analyzer - Detects tactical patterns in chess games
 * Used for enriching game records and tracking skill development
 */

import { Board, Piece, Position, Move, PieceType, PieceColor } from '../core/types';
import { getPseudoLegalMoves } from '../core/pieces';

export type TacticType = 'fork' | 'pin' | 'skewer' | 'discovered_attack' | 'removal_of_defender';

export interface DetectedTactic {
  type: TacticType;
  move: Move;
  piece: PieceType;
  square: Position;
  targets?: Position[];  // For forks
  victim?: Position;     // For pins/skewers
  description: string;
}

export interface MoveQuality {
  isBlunder: boolean;
  isMistake: boolean;
  isBrilliant: boolean;
  materialChange: number;
  evaluation: number;  // Rough position evaluation (-1000 to +1000)
}

export class TacticalAnalyzer {
  /**
   * Analyze a move for tactical patterns
   */
  static analyzeMoveForTactics(
    boardBefore: Board,
    boardAfter: Board,
    move: Move
  ): DetectedTactic[] {
    const tactics: DetectedTactic[] = [];
    const movedPiece = boardAfter[move.to.row][move.to.col];
    
    if (!movedPiece) return tactics;

    // Check for fork
    const fork = this.detectFork(boardAfter, move.to, movedPiece);
    if (fork) tactics.push(fork);

    // Check for pin
    const pin = this.detectPin(boardAfter, move.to, movedPiece);
    if (pin) tactics.push(pin);

    // Check for skewer
    const skewer = this.detectSkewer(boardAfter, move.to, movedPiece);
    if (skewer) tactics.push(skewer);

    // Check for discovered attack
    const discovered = this.detectDiscoveredAttack(boardBefore, boardAfter, move);
    if (discovered) tactics.push(discovered);

    return tactics;
  }

  /**
   * Detect fork: one piece attacks 2+ valuable enemy pieces
   */
  private static detectFork(
    board: Board,
    position: Position,
    piece: Piece
  ): DetectedTactic | null {
    const attacks = this.getAttackedSquares(board, position, piece);
    const valuableTargets = attacks.filter(pos => {
      const target = board[pos.row][pos.col];
      if (!target || target.color === piece.color) return false;
      
      // Consider pieces more valuable than pawns
      return this.getPieceValue(target.type) > 100;
    });

    if (valuableTargets.length >= 2) {
      const targetNames = valuableTargets.map(pos => {
        const target = board[pos.row][pos.col];
        return target ? target.type : '';
      }).filter(Boolean);

      return {
        type: 'fork',
        move: { from: { row: -1, col: -1 }, to: position, piece },
        piece: piece.type,
        square: position,
        targets: valuableTargets,
        description: `${piece.type} fork attacking ${targetNames.join(' and ')}!`,
      };
    }

    return null;
  }

  /**
   * Detect pin: piece attacked and pinned to more valuable piece behind it
   */
  private static detectPin(
    board: Board,
    position: Position,
    piece: Piece
  ): DetectedTactic | null {
    // Only long-range pieces can pin (bishop, rook, queen)
    if (!['bishop', 'rook', 'queen'].includes(piece.type)) {
      return null;
    }

    // Get sliding directions
    const directions = this.getSlidingDirections(piece.type);
    
    for (const dir of directions) {
      const pinned = this.checkPinInDirection(board, position, piece, dir);
      if (pinned) {
        return {
          type: 'pin',
          move: { from: { row: -1, col: -1 }, to: position, piece },
          piece: piece.type,
          square: position,
          victim: pinned.pinnedPiece,
          description: `${piece.type} pins ${pinned.pinnedType} to ${pinned.behindType}!`,
        };
      }
    }

    return null;
  }

  /**
   * Detect skewer: attacking valuable piece with less valuable piece behind
   */
  private static detectSkewer(
    board: Board,
    position: Position,
    piece: Piece
  ): DetectedTactic | null {
    // Only long-range pieces can skewer
    if (!['bishop', 'rook', 'queen'].includes(piece.type)) {
      return null;
    }

    const directions = this.getSlidingDirections(piece.type);
    
    for (const dir of directions) {
      const skewer = this.checkSkewerInDirection(board, position, piece, dir);
      if (skewer) {
        return {
          type: 'skewer',
          move: { from: { row: -1, col: -1 }, to: position, piece },
          piece: piece.type,
          square: position,
          description: `${piece.type} skewers ${skewer.frontType} to ${skewer.behindType}!`,
        };
      }
    }

    return null;
  }

  /**
   * Detect discovered attack: moving piece reveals attack from behind
   */
  private static detectDiscoveredAttack(
    boardBefore: Board,
    boardAfter: Board,
    move: Move
  ): DetectedTactic | null {
    // Check if there's a long-range piece behind the moved piece that now attacks something
    const piece = boardBefore[move.from.row][move.from.col];
    if (!piece) return null;

    // Look for friendly long-range pieces that were blocked
    const directions = [
      { row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 },
      { row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }
    ];

    for (const dir of directions) {
      // Check if there's a friendly piece behind that can now attack
      let row = move.from.row + dir.row;
      let col = move.from.col + dir.col;

      while (row >= 0 && row < 8 && col >= 0 && col < 8) {
        const behindPiece = boardBefore[row][col];
        
        if (behindPiece) {
          if (behindPiece.color !== piece.color) break;
          
          // Check if this piece now attacks something valuable in boardAfter
          const pieceTypeStr = behindPiece.type as string;
          if (['bishop', 'rook', 'queen'].includes(pieceTypeStr)) {
            const attacks = this.getAttackedSquares(boardAfter, { row, col }, behindPiece);
            const valuableTarget = attacks.find(pos => {
              const target = boardAfter[pos.row][pos.col];
              return target && target.color !== behindPiece.color && this.getPieceValue(target.type) > 300;
            });

            if (valuableTarget) {
              const target = boardAfter[valuableTarget.row][valuableTarget.col];
              return {
                type: 'discovered_attack',
                move,
                piece: piece.type,
                square: move.to,
                description: `Discovered attack by ${behindPiece.type} on ${target?.type}!`,
              };
            }
          }
          break;
        }
        
        row += dir.row;
        col += dir.col;
      }
    }

    return null;
  }

  /**
   * Evaluate move quality (blunder, mistake, brilliant)
   */
  static evaluateMoveQuality(
    boardBefore: Board,
    boardAfter: Board,
    move: Move,
    playerColor: PieceColor
  ): MoveQuality {
    const materialBefore = this.evaluateMaterial(boardBefore, playerColor);
    const materialAfter = this.evaluateMaterial(boardAfter, playerColor);
    const materialChange = materialAfter - materialBefore;

    // Simple evaluation (in centipawns)
    const evaluation = this.evaluatePosition(boardAfter, playerColor);

    // Check if move loses significant material
    const isBlunder = materialChange < -200;  // Lost 2+ pawns worth
    const isMistake = materialChange < -100 && !isBlunder;

    // Check if move is brilliant (unexpected strong move)
    const isBrilliant = this.isBrilliantMove(boardBefore, boardAfter, move, playerColor);

    return {
      isBlunder,
      isMistake,
      isBrilliant,
      materialChange,
      evaluation,
    };
  }

  /**
   * Check if move is brilliant (sacrifice or non-obvious strong move)
   */
  private static isBrilliantMove(
    boardBefore: Board,
    boardAfter: Board,
    _move: Move,
    playerColor: PieceColor
  ): boolean {
    // For MVP, consider a move brilliant if:
    // 1. It's a sacrifice that leads to checkmate threat
    // 2. It's part of a forcing combination
    // For now, we'll use a simple heuristic: tactical move that sacrifices material
    
    const materialBefore = this.evaluateMaterial(boardBefore, playerColor);
    const materialAfter = this.evaluateMaterial(boardAfter, playerColor);
    
    // If sacrificed material but position improved significantly
    if (materialAfter < materialBefore - 100) {
      const evalBefore = this.evaluatePosition(boardBefore, playerColor);
      const evalAfter = this.evaluatePosition(boardAfter, playerColor);
      
      // Position improved despite material sacrifice
      if (evalAfter > evalBefore + 200) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluate material balance for a color
   */
  private static evaluateMaterial(board: Board, color: PieceColor): number {
    let material = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          material += this.getPieceValue(piece.type);
        }
      }
    }
    
    return material;
  }

  /**
   * Simple position evaluation
   */
  private static evaluatePosition(board: Board, color: PieceColor): number {
    let score = 0;
    
    // Material count
    score += this.evaluateMaterial(board, color);
    score -= this.evaluateMaterial(board, color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE);
    
    // Center control bonus
    const centerSquares = [
      { row: 3, col: 3 }, { row: 3, col: 4 },
      { row: 4, col: 3 }, { row: 4, col: 4 }
    ];
    
    for (const sq of centerSquares) {
      const piece = board[sq.row][sq.col];
      if (piece) {
        score += piece.color === color ? 10 : -10;
      }
    }
    
    return score;
  }

  /**
   * Get piece value in centipawns
   */
  private static getPieceValue(type: PieceType): number {
    const values: Record<PieceType, number> = {
      pawn: 100,
      knight: 320,
      bishop: 330,
      rook: 500,
      queen: 900,
      king: 20000,
    };
    return values[type] || 0;
  }

  /**
   * Get all squares attacked by a piece
   */
  private static getAttackedSquares(
    board: Board,
    position: Position,
    piece: Piece
  ): Position[] {
    const moves = getPseudoLegalMoves(board, position, piece);
    // getPseudoLegalMoves returns an array of Position[], not Move[]
    // need to adjust based on actual return type
    return moves;
  }

  /**
   * Get sliding directions for long-range pieces
   */
  private static getSlidingDirections(type: PieceType): Array<{ row: number; col: number }> {
    if (type === 'bishop') {
      return [
        { row: -1, col: -1 }, { row: -1, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 1 }
      ];
    } else if (type === 'rook') {
      return [
        { row: -1, col: 0 }, { row: 1, col: 0 },
        { row: 0, col: -1 }, { row: 0, col: 1 }
      ];
    } else if (type === 'queen') {
      return [
        { row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 },
        { row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }
      ];
    }
    return [];
  }

  /**
   * Check for pin in a specific direction
   */
  private static checkPinInDirection(
    board: Board,
    position: Position,
    piece: Piece,
    dir: { row: number; col: number }
  ): { pinnedPiece: Position; pinnedType: PieceType; behindType: PieceType } | null {
    let row = position.row + dir.row;
    let col = position.col + dir.col;
    let pinnedPiece: Position | null = null;
    let pinnedType:  PieceType | null = null;

    // Look for enemy piece
    while (row >= 0 && row < 8 && col >= 0 && col < 8) {
      const target = board[row][col];
      
      if (target) {
        if (target.color === piece.color) break;  // Hit friendly piece
        
        if (!pinnedPiece) {
          // Found potential pinned piece
          pinnedPiece = { row, col };
          pinnedType = target.type;
        } else {
          // Found piece behind - check if more valuable
          if (pinnedType && this.getPieceValue(target.type) > this.getPieceValue(pinnedType)) {
            return {
              pinnedPiece,
              pinnedType,
              behindType: target.type,
            };
          }
          break;
        }
      }
      
      row += dir.row;
      col += dir.col;
    }

    return null;
  }

  /**
   * Check for skewer in a specific direction
   */
  private static checkSkewerInDirection(
    board: Board,
    position: Position,
    piece: Piece,
    dir: { row: number; col: number }
  ): { frontType: string; behindType: string } | null {
    let row = position.row + dir.row;
    let col = position.col + dir.col;
    let frontPiece: { type: string; value: number } | null = null;

    while (row >= 0 && row < 8 && col >= 0 && col < 8) {
      const target = board[row][col];
      
      if (target) {
        if (target.color === piece.color) break;
        
        if (!frontPiece) {
          frontPiece = { type: target.type, value: this.getPieceValue(target.type) };
        } else {
          // Found piece behind - skewer if front piece is more valuable
          if (frontPiece.value > this.getPieceValue(target.type)) {
            return {
              frontType: frontPiece.type,
              behindType: target.type,
            };
          }
          break;
        }
      }
      
      row += dir.row;
      col += dir.col;
    }

    return null;
  }

  /**
   * Count material for a specific color
   */
  static countMaterial(board: Board, color: PieceColor): number {
    return this.evaluateMaterial(board, color);
  }
}
