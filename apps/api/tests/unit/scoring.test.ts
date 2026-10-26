import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Scoring & ICPC Penalty Calculations — Unit Tests", () => {
  // Bonus rating map as defined in submission.worker.ts
  const bonusMap: Record<string, number> = {
    EASY: 10,
    MEDIUM: 20,
    HARD: 35,
  };

  const getRatingBonus = (difficulty: string): number => {
    return bonusMap[difficulty.toUpperCase()] || 15;
  };

  describe("Problem Difficulty Rating Bonus", () => {
    it("should award +10 rating for EASY problems", () => {
      assert.equal(getRatingBonus("EASY"), 10);
      assert.equal(getRatingBonus("easy"), 10);
    });

    it("should award +20 rating for MEDIUM problems", () => {
      assert.equal(getRatingBonus("MEDIUM"), 20);
      assert.equal(getRatingBonus("medium"), 20);
    });

    it("should award +35 rating for HARD problems", () => {
      assert.equal(getRatingBonus("HARD"), 35);
      assert.equal(getRatingBonus("hard"), 35);
    });

    it("should fallback to +15 rating for unrecognized difficulty", () => {
      assert.equal(getRatingBonus("EXPERT"), 15);
      assert.equal(getRatingBonus(""), 15);
    });
  });

  describe("ICPC Contest Scoring & Penalty Formula", () => {
    const calculateProblemPenalty = (solvedMinutes: number, attempts: number): number => {
      // ICPC formula: minutes from start to solve + 20 penalty minutes per rejected attempt before solve
      return solvedMinutes + (attempts - 1) * 20;
    };

    interface ParticipantStanding {
      userId: string;
      score: number;
      penalty: number;
    }

    const rankStandings = (participants: ParticipantStanding[]): ParticipantStanding[] => {
      return [...participants].sort((a, b) => {
        // Higher score (more solved problems) first
        if (b.score !== a.score) return b.score - a.score;
        // Tie-breaker: lower penalty minutes
        return a.penalty - b.penalty;
      });
    };

    it("should calculate zero penalty added when solved on first attempt", () => {
      const penalty = calculateProblemPenalty(14, 1);
      assert.equal(penalty, 14); // 14 + 0*20 = 14
    });

    it("should add 20 minutes per incorrect attempt before acceptance", () => {
      // 3 attempts = 2 WAs + 1 AC at minute 45
      const penalty = calculateProblemPenalty(45, 3);
      assert.equal(penalty, 45 + 2 * 20); // 85
    });

    it("should accumulate penalty correctly across multiple problems", () => {
      const prob1 = calculateProblemPenalty(10, 1); // 10
      const prob2 = calculateProblemPenalty(35, 2); // 35 + 20 = 55
      const prob3 = calculateProblemPenalty(90, 4); // 90 + 3*20 = 150
      const totalPenalty = prob1 + prob2 + prob3;
      assert.equal(totalPenalty, 215);
    });

    it("should correctly rank participants with score priority and penalty tie-breaker", () => {
      const standings: ParticipantStanding[] = [
        { userId: "Alice", score: 2, penalty: 120 },
        { userId: "Bob", score: 3, penalty: 200 },
        { userId: "Charlie", score: 2, penalty: 85 }, // Same score as Alice, lower penalty
        { userId: "Dave", score: 1, penalty: 30 },
      ];

      const ranked = rankStandings(standings);

      assert.equal(ranked[0].userId, "Bob"); // Most problems solved (3)
      assert.equal(ranked[1].userId, "Charlie"); // 2 problems, penalty 85
      assert.equal(ranked[2].userId, "Alice"); // 2 problems, penalty 120
      assert.equal(ranked[3].userId, "Dave"); // 1 problem
    });
  });
});
