import { LessonStage } from './lesson-library';

export interface HintResult {
  text: string;
  suggestedMove?: { from: string; to: string };
}

export class HintSystem {
  getHint(stage: LessonStage, hintIndex: number): HintResult {
    const hintText = stage.hints[Math.min(hintIndex, stage.hints.length - 1)];
    const suggestedMove = stage.correctMoves[0]
      ? { from: stage.correctMoves[0].from, to: stage.correctMoves[0].to }
      : undefined;

    return {
      text: hintText,
      suggestedMove
    };
  }
}
