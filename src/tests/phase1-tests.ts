/**
 * Phase 1 Test Suite
 * Manual tests for the core game engine
 */

import { ChessGame } from '../core/game-state';
import { fromAlgebraic } from '../utils/coordinates';
import { GameStatus, PieceColor } from '../core/types';

export function runPhase1Tests(): void {
  console.log('\n🧪 Running Phase 1 Test Suite');
  console.log('═══════════════════════════════════════════\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Initialize board
  totalTests++;
  try {
    const game = new ChessGame();
    const board = game.getBoard();
    if (board.length === 8 && board[0].length === 8) {
      console.log('✅ Test 1: Board initialization - PASSED');
      passedTests++;
    } else {
      throw new Error('Board dimensions incorrect');
    }
  } catch (e) {
    console.error('❌ Test 1: Board initialization - FAILED', e);
  }

  // Test 2: Legal pawn moves
  totalTests++;
  try {
    const game = new ChessGame();
    const e2 = fromAlgebraic('e2');
    const moves = game.getLegalMovesFor(e2);
    if (moves.length === 2) { // e3 and e4
      console.log('✅ Test 2: Pawn legal moves - PASSED');
      passedTests++;
    } else {
      throw new Error(`Expected 2 moves, got ${moves.length}`);
    }
  } catch (e) {
    console.error('❌ Test 2: Pawn legal moves - FAILED', e);
  }

  // Test 3: Make valid move
  totalTests++;
  try {
    const game = new ChessGame();
    const from = fromAlgebraic('e2');
    const to = fromAlgebraic('e4');
    const success = game.makeMove(from, to);
    if (success && game.getCurrentPlayer() === PieceColor.BLACK) {
      console.log('✅ Test 3: Valid move execution - PASSED');
      passedTests++;
    } else {
      throw new Error('Move failed or player not switched');
    }
  } catch (e) {
    console.error('❌ Test 3: Valid move execution - FAILED', e);
  }

  // Test 4: Reject invalid move
  totalTests++;
  try {
    const game = new ChessGame();
    const from = fromAlgebraic('e2');
    const to = fromAlgebraic('e5'); // Can't move pawn 3 squares
    const success = game.makeMove(from, to);
    if (!success) {
      console.log('✅ Test 4: Invalid move rejection - PASSED');
      passedTests++;
    } else {
      throw new Error('Invalid move was accepted');
    }
  } catch (e) {
    console.error('❌ Test 4: Invalid move rejection - FAILED', e);
  }

  // Test 5: Undo/Redo
  totalTests++;
  try {
    const game = new ChessGame();
    game.makeMove(fromAlgebraic('e2'), fromAlgebraic('e4'));
    game.makeMove(fromAlgebraic('e7'), fromAlgebraic('e5'));
    
    const canUndo = game.canUndo();
    game.undo();
    const currentPlayer = game.getCurrentPlayer();
    const canRedo = game.canRedo();
    
    if (canUndo && currentPlayer === PieceColor.WHITE && canRedo) {
      console.log('✅ Test 5: Undo/Redo functionality - PASSED');
      passedTests++;
    } else {
      throw new Error('Undo/Redo not working correctly');
    }
  } catch (e) {
    console.error('❌ Test 5: Undo/Redo functionality - FAILED', e);
  }

  // Test 6: Check detection
  totalTests++;
  try {
    const game = new ChessGame();
    // Fool's mate setup
    game.makeMove(fromAlgebraic('f2'), fromAlgebraic('f3'));
    game.makeMove(fromAlgebraic('e7'), fromAlgebraic('e5'));
    game.makeMove(fromAlgebraic('g2'), fromAlgebraic('g4'));
    game.makeMove(fromAlgebraic('d8'), fromAlgebraic('h4')); // Check
    
    if (game.getStatus() === GameStatus.CHECKMATE) {
      console.log('✅ Test 6: Check/Checkmate detection - PASSED');
      passedTests++;
    } else {
      throw new Error(`Expected CHECKMATE, got ${game.getStatus()}`);
    }
  } catch (e) {
    console.error('❌ Test 6: Check/Checkmate detection - FAILED', e);
  }

  // Test 7: Move history
  totalTests++;
  try {
    const game = new ChessGame();
    game.makeMove(fromAlgebraic('e2'), fromAlgebraic('e4'));
    game.makeMove(fromAlgebraic('e7'), fromAlgebraic('e5'));
    game.makeMove(fromAlgebraic('g1'), fromAlgebraic('f3'));
    
    const history = game.getHistory();
    const pgn = history.toPGN();
    
    if (history.getMoveCount() === 3 && pgn.includes('e4') && pgn.includes('e5')) {
      console.log('✅ Test 7: Move history tracking - PASSED');
      passedTests++;
    } else {
      throw new Error('History not tracking correctly');
    }
  } catch (e) {
    console.error('❌ Test 7: Move history tracking - FAILED', e);
  }

  // Test 8: Castling validation
  totalTests++;
  try {
    const game = new ChessGame();
    // Set up for castling
    game.makeMove(fromAlgebraic('e2'), fromAlgebraic('e4'));
    game.makeMove(fromAlgebraic('e7'), fromAlgebraic('e5'));
    game.makeMove(fromAlgebraic('g1'), fromAlgebraic('f3'));
    game.makeMove(fromAlgebraic('g8'), fromAlgebraic('f6'));
    game.makeMove(fromAlgebraic('f1'), fromAlgebraic('c4'));
    game.makeMove(fromAlgebraic('f8'), fromAlgebraic('c5'));
    
    // Check if castling is in legal moves
    const kingPos = fromAlgebraic('e1');
    const legalMoves = game.getLegalMovesFor(kingPos);
    const canCastle = legalMoves.some(move => move.col === 6); // g1
    
    if (canCastle) {
      console.log('✅ Test 8: Castling validation - PASSED');
      passedTests++;
    } else {
      throw new Error('Castling not available when it should be');
    }
  } catch (e) {
    console.error('❌ Test 8: Castling validation - FAILED', e);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All Phase 1 tests PASSED!');
    console.log('✅ Core Game Engine is ready for Phase 2');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed`);
    console.log('🔧 Review and fix issues before proceeding');
  }
  console.log('═══════════════════════════════════════════\n');
}
