/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) 전체 불가사의 데이터베이스 (12종)
 */
(function (root) {
  const SWDuel = (root.SWDuel = root.SWDuel || {});

  const WONDERS = [
    {
      id: 'w_appian_way',
      name: '아피아 가도',
      cost: { stone: 2, clay: 2, papyrus: 1 },
      effect: { coins: 3, oppLoseCoins: 3, extraTurn: true, vp: 3 },
      desc: '즉시 3원 획득, 상대 3원 파괴, 추가 턴, 승점 +3',
    },
    {
      id: 'w_circus_maximus',
      name: '키르쿠스 막시무스',
      cost: { stone: 2, wood: 1, glass: 1 },
      effect: { shields: 1, destroyOppColor: 'gray', vp: 3 },
      desc: '상대 회색 카드 1장 파괴, 방패 +1, 승점 +3',
    },
    {
      id: 'w_colossus',
      name: '로도스의 거상',
      cost: { clay: 3, glass: 1 },
      effect: { shields: 2, vp: 3 },
      desc: '방패 +2, 승점 +3',
    },
    {
      id: 'w_great_library',
      name: '알렉산드리아 도서관',
      cost: { wood: 3, glass: 1, papyrus: 1 },
      effect: { drawProgressTokens: 3, vp: 4 },
      desc: '미사용 진보 토큰 3개 중 1개 선택 획득, 승점 +4',
    },
    {
      id: 'w_great_lighthouse',
      name: '알렉산드리아 등대',
      cost: { wood: 1, stone: 1, papyrus: 2 },
      effect: { flexResources: ['wood', 'clay', 'stone'], vp: 4 },
      desc: '매 턴 목재/점토/석재 중 1 생산, 승점 +4',
    },
    {
      id: 'w_hanging_gardens',
      name: '바빌론의 공중정원',
      cost: { wood: 2, glass: 1, papyrus: 1 },
      effect: { coins: 6, extraTurn: true, vp: 3 },
      desc: '즉시 6원 획득, 추가 턴, 승점 +3',
    },
    {
      id: 'w_mausoleum',
      name: '마우솔로스의 영묘',
      cost: { clay: 2, glass: 2, papyrus: 1 },
      effect: { buildFromDiscard: true, vp: 2 },
      desc: '버림 더미의 카드 1장 무료 건설, 승점 +2',
    },
    {
      id: 'w_piraeus',
      name: '피레우스 항구',
      cost: { wood: 2, stone: 1, clay: 1 },
      effect: { flexResources: ['glass', 'papyrus'], extraTurn: true, vp: 2 },
      desc: '매 턴 유리/파피루스 중 1 생산, 추가 턴, 승점 +2',
    },
    {
      id: 'w_pyramids',
      name: '기자 대피라미드',
      cost: { stone: 3, papyrus: 1 },
      effect: { vp: 9 },
      desc: '승점 +9',
    },
    {
      id: 'w_sphinx',
      name: '스핑크스',
      cost: { stone: 1, clay: 1, glass: 2 },
      effect: { extraTurn: true, vp: 6 },
      desc: '추가 턴, 승점 +6',
    },
    {
      id: 'w_statue_of_zeus',
      name: '올림피아 제우스 신상',
      cost: { stone: 1, wood: 1, clay: 1, papyrus: 2 },
      effect: { shields: 1, destroyOppColor: 'brown', vp: 3 },
      desc: '상대 갈색 카드 1장 파괴, 방패 +1, 승점 +3',
    },
    {
      id: 'w_temple_of_artemis',
      name: '아르테미스 신전',
      cost: { wood: 1, stone: 1, glass: 1, papyrus: 1 },
      effect: { coins: 12, extraTurn: true, vp: 0 },
      desc: '즉시 12원 획득, 추가 턴',
    },
  ];

  const WONDERS_BY_ID = Object.fromEntries(WONDERS.map((w) => [w.id, w]));

  SWDuel.Wonders = {
    WONDERS,
    WONDERS_BY_ID,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SWDuel.Wonders;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
