import { createEmptyBoard, setPieceAt } from '../core/board';
import { PieceColor, PieceType } from '../core/types';
import type { Board, Position } from '../core/types';
import { fromAlgebraic, toAlgebraic } from '../utils/coordinates';
import { HintSystem, HintResult } from './hint-system';
import type { Lesson, LessonStage, LessonSetup } from './lesson-library';

export interface LessonProgress {
  stageNumber: number;
  totalStages: number;
}

export interface MoveResult {
  correct: boolean;
  message: string;
  stageComplete: boolean;
  lessonComplete: boolean;
  nextStage?: LessonStage | null;
}

export interface StageSetupResult {
  board: Board;
  currentPlayer: PieceColor;
  castlingRights?: {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
  };
  enPassantTarget?: Position | null;
}

export class TutorialManager {
  private lessons: Lesson[];
  private currentLesson: Lesson | null = null;
  private currentStageIndex: number = 0;
  private hintIndex: number = 0;
  private hintSystem = new HintSystem();

  constructor(lessons: Lesson[]) {
    this.lessons = lessons;
  }

  getLessons(): Lesson[] {
    return this.lessons;
  }

  getLessonIndex(lessonId: string): number {
    return this.lessons.findIndex(item => item.id === lessonId);
  }

  getNextLessonId(lessonId: string): string | null {
    const index = this.getLessonIndex(lessonId);
    if (index === -1 || index + 1 >= this.lessons.length) return null;
    return this.lessons[index + 1].id;
  }

  getCurrentLesson(): Lesson | null {
    return this.currentLesson;
  }

  getCurrentStage(): LessonStage | null {
    if (!this.currentLesson) return null;
    return this.currentLesson.stages[this.currentStageIndex] || null;
  }

  getProgress(): LessonProgress | null {
    if (!this.currentLesson) return null;
    return {
      stageNumber: this.currentStageIndex + 1,
      totalStages: this.currentLesson.stages.length
    };
  }

  startLesson(lessonId: string): LessonStage | null {
    const lesson = this.lessons.find(item => item.id === lessonId) || null;
    this.currentLesson = lesson;
    this.currentStageIndex = 0;
    this.hintIndex = 0;
    return this.getCurrentStage();
  }

  reset(): void {
    this.currentLesson = null;
    this.currentStageIndex = 0;
    this.hintIndex = 0;
  }

  getHint(): HintResult | null {
    const stage = this.getCurrentStage();
    if (!stage) return null;

    const hint = this.hintSystem.getHint(stage, this.hintIndex);
    this.hintIndex++;
    return hint;
  }

  validateMove(from: Position, to: Position): MoveResult {
    const stage = this.getCurrentStage();
    if (!stage) {
      return {
        correct: false,
        message: 'No active lesson.',
        stageComplete: false,
        lessonComplete: false
      };
    }

    const fromAlg = toAlgebraic(from);
    const toAlg = toAlgebraic(to);
    const isCorrect = stage.correctMoves.some(move =>
      move.from === fromAlg && move.to === toAlg
    );

    if (!isCorrect) {
      return {
        correct: false,
        message: 'Not quite. Try again or ask for a hint!',
        stageComplete: false,
        lessonComplete: false
      };
    }

    const message = `${stage.successMessage} ${stage.explanation}`.trim();
    const stageComplete = true;
    const lessonComplete = this.currentLesson
      ? this.currentStageIndex >= this.currentLesson.stages.length - 1
      : true;

    if (!lessonComplete) {
      this.currentStageIndex++;
      this.hintIndex = 0;
    }

    return {
      correct: true,
      message,
      stageComplete,
      lessonComplete,
      nextStage: lessonComplete ? null : this.getCurrentStage()
    };
  }

  getStageSetup(stage: LessonStage | null): StageSetupResult | null {
    if (!stage || !stage.setup) return null;

    if (stage.setup.type === 'initial') {
      return null;
    }

    const setup = stage.setup as LessonSetup;
    if (setup.type !== 'custom') return null;

    const board = createEmptyBoard();
    setup.pieces.forEach(piece => {
      const pos = fromAlgebraic(piece.square);
      setPieceAt(board, pos, {
        type: piece.type as PieceType,
        color: piece.color as PieceColor,
        hasMoved: piece.hasMoved ?? false
      });
    });

    return {
      board,
      currentPlayer: setup.currentPlayer,
      castlingRights: setup.castlingRights,
      enPassantTarget: setup.enPassantTarget ? fromAlgebraic(setup.enPassantTarget) : null
    };
  }
}
