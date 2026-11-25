/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) 시대별 피라미드 배치 패턴 및 차단(Blocking) 규칙
 * - col은 반칸(half-step) 단위 좌표 (인접 카드는 col 차이 2, 상하 겹침은 col 차이 1)
 */
(function (root) {
  const SWDuel = (root.SWDuel = root.SWDuel || {});

  const AGE_ROWS = {
    1: [
      { row: 0, cols: [4, 6], faceUp: true },
      { row: 1, cols: [3, 5, 7], faceUp: false },
      { row: 2, cols: [2, 4, 6, 8], faceUp: true },
      { row: 3, cols: [1, 3, 5, 7, 9], faceUp: false },
      { row: 4, cols: [0, 2, 4, 6, 8, 10], faceUp: true },
    ],
    2: [
      { row: 0, cols: [0, 2, 4, 6, 8, 10], faceUp: true },
      { row: 1, cols: [1, 3, 5, 7, 9], faceUp: false },
      { row: 2, cols: [2, 4, 6, 8], faceUp: true },
      { row: 3, cols: [3, 5, 7], faceUp: false },
      { row: 4, cols: [4, 6], faceUp: true },
    ],
    3: [
      { row: 0, cols: [2, 4], faceUp: true },
      { row: 1, cols: [1, 3, 5], faceUp: false },
      { row: 2, cols: [0, 2, 4, 6], faceUp: true },
      { row: 3, cols: [1, 5], faceUp: false },
      { row: 4, cols: [0, 2, 4, 6], faceUp: true },
      { row: 5, cols: [1, 3, 5], faceUp: false },
      { row: 6, cols: [2, 4], faceUp: true },
    ],
  };

  function buildAgeLayout(age) {
    const rows = AGE_ROWS[age];
    const slots = [];
    let idx = 0;
    for (const r of rows) {
      for (const col of r.cols) {
        slots.push({
          slotIndex: idx++,
          row: r.row,
          col,
          faceUp: r.faceUp,
          coveredBy: [],
        });
      }
    }
    for (const slot of slots) {
      slot.coveredBy = slots
        .filter((other) => other.row === slot.row + 1 && Math.abs(other.col - slot.col) === 1)
        .map((other) => other.slotIndex);
    }
    return slots;
  }

  const AGE_LAYOUTS = {
    1: buildAgeLayout(1),
    2: buildAgeLayout(2),
    3: buildAgeLayout(3),
  };

  SWDuel.Layouts = {
    AGE_ROWS,
    AGE_LAYOUTS,
    buildAgeLayout,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SWDuel.Layouts;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
