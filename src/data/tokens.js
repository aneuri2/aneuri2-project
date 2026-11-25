/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) 진보 토큰 10종 데이터베이스
 */
(function (root) {
  const SWDuel = (root.SWDuel = root.SWDuel || {});

  const PROGRESS_TOKENS = [
    {
      id: 'pt_agriculture',
      name: '농업',
      effect: { coins: 6, vp: 4 },
      desc: '즉시 코인 +6원, 게임 종료 시 승점 +4',
    },
    {
      id: 'pt_architecture',
      name: '건축',
      effect: { wonderResourceDiscount: 2 },
      desc: '앞으로 건설하는 불가사의의 자원 비용 -2개',
    },
    {
      id: 'pt_economy',
      name: '경제',
      effect: { gainOppTradeCoins: true },
      desc: '상대가 교역(부족 자원 구매)으로 지불하는 코인을 내가 획득',
    },
    {
      id: 'pt_law',
      name: '법률',
      effect: { science: 'law' },
      desc: '고유 과학 기호(법률) 1개 추가',
    },
    {
      id: 'pt_masonry',
      name: '석조',
      effect: { blueResourceDiscount: 2 },
      desc: '앞으로 건설하는 파란색 건물의 자원 비용 -2개',
    },
    {
      id: 'pt_mathematics',
      name: '수학',
      effect: { vpPerToken: 3 },
      desc: '게임 종료 시 보유한 진보 토큰 1개당 승점 +3 (본 토큰 포함)',
    },
    {
      id: 'pt_philosophy',
      name: '철학',
      effect: { vp: 7 },
      desc: '게임 종료 시 승점 +7',
    },
    {
      id: 'pt_strategy',
      name: '전략',
      effect: { bonusShieldOnRed: 1 },
      desc: '앞으로 건설하는 빨간색 군사 건물마다 방패 +1 추가',
    },
    {
      id: 'pt_theology',
      name: '신학',
      effect: { wonderExtraTurn: true },
      desc: '앞으로 건설하는 모든 불가사의에 추가 턴 효과 부여',
    },
    {
      id: 'pt_urbanism',
      name: '도시화',
      effect: { coins: 6, chainCoinBonus: 4 },
      desc: '즉시 코인 +6원, 연쇄 무료 건설 시 코인 +4원 획득',
    },
  ];

  const TOKENS_BY_ID = Object.fromEntries(PROGRESS_TOKENS.map((t) => [t.id, t]));

  SWDuel.Tokens = {
    PROGRESS_TOKENS,
    TOKENS_BY_ID,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SWDuel.Tokens;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
