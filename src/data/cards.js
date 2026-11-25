/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) 전체 카드 데이터베이스
 * - 1시대 23장, 2시대 23장, 3시대 20장, 길드 7장 (총 73장)
 */
(function (root) {
  const SWDuel = (root.SWDuel = root.SWDuel || {});

  const CHAIN_LABELS = {
    mask: '가면',
    moon: '달',
    drop: '물방울',
    vase: '주전자',
    horseshoe: '말굽',
    sword: '검',
    tower: '탑',
    book: '책',
    gear: '톱니',
    pillar: '기둥',
    sun: '태양',
    capitol: '신전 지붕',
    barrel: '오크통',
    target: '과녁',
    helmet: '투구',
    lamp: '등불',
    harp: '하프',
  };

  const SCIENCE_LABELS = {
    wheel: '바퀴',
    mortar: '절구',
    quill: '깃펜',
    plumb: '측량추',
    globe: '혼천의',
    sundial: '해시계',
    law: '법률(저울)',
  };

  const RESOURCE_LABELS = {
    wood: '목재',
    clay: '점토',
    stone: '석재',
    glass: '유리',
    papyrus: '파피루스',
  };

  const COLOR_LABELS = {
    brown: '원자재 (갈색)',
    gray: '제조품 (회색)',
    blue: '시민 (파란색)',
    yellow: '상업 (노란색)',
    red: '군사 (빨간색)',
    green: '과학 (초록색)',
    purple: '길드 (보라색)',
  };

  const AGE1_CARDS = [
    // 갈색 (원자재) 6장
    { id: 'a1_lumber_yard', name: '벌목장', age: 1, color: 'brown', cost: {}, effect: { resources: { wood: 1 } } },
    { id: 'a1_logging_camp', name: '벌목 캠프', age: 1, color: 'brown', cost: { coins: 1 }, effect: { resources: { wood: 1 } } },
    { id: 'a1_clay_pool', name: '점토 채굴장', age: 1, color: 'brown', cost: {}, effect: { resources: { clay: 1 } } },
    { id: 'a1_clay_pit', name: '점토 구덩이', age: 1, color: 'brown', cost: { coins: 1 }, effect: { resources: { clay: 1 } } },
    { id: 'a1_quarry', name: '채석장', age: 1, color: 'brown', cost: {}, effect: { resources: { stone: 1 } } },
    { id: 'a1_stone_pit', name: '석재 구덩이', age: 1, color: 'brown', cost: { coins: 1 }, effect: { resources: { stone: 1 } } },

    // 회색 (제조품) 2장
    { id: 'a1_glassworks', name: '유리공예소', age: 1, color: 'gray', cost: { coins: 1 }, effect: { resources: { glass: 1 } } },
    { id: 'a1_press', name: '제지소', age: 1, color: 'gray', cost: { coins: 1 }, effect: { resources: { papyrus: 1 } } },

    // 파란색 (시민 건물) 3장
    { id: 'a1_theater', name: '극장', age: 1, color: 'blue', cost: {}, chainOut: 'mask', effect: { vp: 3 } },
    { id: 'a1_altar', name: '제단', age: 1, color: 'blue', cost: {}, chainOut: 'moon', effect: { vp: 3 } },
    { id: 'a1_baths', name: '목욕탕', age: 1, color: 'blue', cost: { stone: 1 }, chainOut: 'drop', effect: { vp: 3 } },

    // 노란색 (상업 건물) 4장
    { id: 'a1_tavern', name: '선술집', age: 1, color: 'yellow', cost: {}, chainOut: 'vase', effect: { coins: 4 } },
    { id: 'a1_stone_reserve', name: '석재 비축소', age: 1, color: 'yellow', cost: { coins: 3 }, effect: { tradeDiscount: ['stone'] } },
    { id: 'a1_clay_reserve', name: '점토 비축소', age: 1, color: 'yellow', cost: { coins: 3 }, effect: { tradeDiscount: ['clay'] } },
    { id: 'a1_wood_reserve', name: '목재 비축소', age: 1, color: 'yellow', cost: { coins: 3 }, effect: { tradeDiscount: ['wood'] } },

    // 빨간색 (군사 건물) 4장
    { id: 'a1_guard_tower', name: '망루', age: 1, color: 'red', cost: {}, effect: { shields: 1 } },
    { id: 'a1_stable', name: '마구간', age: 1, color: 'red', cost: { wood: 1 }, chainOut: 'horseshoe', effect: { shields: 1 } },
    { id: 'a1_garrison', name: '수비대', age: 1, color: 'red', cost: { clay: 1 }, chainOut: 'sword', effect: { shields: 1 } },
    { id: 'a1_palisade', name: '방책', age: 1, color: 'red', cost: { coins: 2 }, chainOut: 'tower', effect: { shields: 1 } },

    // 초록색 (과학 건물) 4장
    { id: 'a1_workshop', name: '공방', age: 1, color: 'green', cost: { papyrus: 1 }, effect: { vp: 1, science: 'plumb' } },
    { id: 'a1_apothecary', name: '약제상', age: 1, color: 'green', cost: { glass: 1 }, effect: { vp: 1, science: 'wheel' } },
    { id: 'a1_scriptorium', name: '필사실', age: 1, color: 'green', cost: { coins: 2 }, chainOut: 'book', effect: { science: 'quill' } },
    { id: 'a1_pharmacist', name: '조제실', age: 1, color: 'green', cost: { coins: 2 }, chainOut: 'gear', effect: { science: 'mortar' } },
  ];

  const AGE2_CARDS = [
    // 갈색 (원자재) 3장
    { id: 'a2_sawmill', name: '제재소', age: 2, color: 'brown', cost: { coins: 2 }, effect: { resources: { wood: 2 } } },
    { id: 'a2_brickyard', name: '벽돌 공장', age: 2, color: 'brown', cost: { coins: 2 }, effect: { resources: { clay: 2 } } },
    { id: 'a2_shelf_quarry', name: '대형 채석장', age: 2, color: 'brown', cost: { coins: 2 }, effect: { resources: { stone: 2 } } },

    // 회색 (제조품) 2장
    { id: 'a2_glassblower', name: '유리 세공소', age: 2, color: 'gray', cost: {}, effect: { resources: { glass: 1 } } },
    { id: 'a2_drying_room', name: '건조실', age: 2, color: 'gray', cost: {}, effect: { resources: { papyrus: 1 } } },

    // 파란색 (시민 건물) 5장
    { id: 'a2_courthouse', name: '법원', age: 2, color: 'blue', cost: { wood: 2, clay: 1 }, effect: { vp: 5 } },
    { id: 'a2_statue', name: '조각상', age: 2, color: 'blue', cost: { clay: 2 }, chainIn: 'mask', chainOut: 'pillar', effect: { vp: 4 } },
    { id: 'a2_temple', name: '신전', age: 2, color: 'blue', cost: { wood: 1, papyrus: 1 }, chainIn: 'moon', chainOut: 'sun', effect: { vp: 4 } },
    { id: 'a2_aqueduct', name: '수로', age: 2, color: 'blue', cost: { stone: 3 }, chainIn: 'drop', effect: { vp: 5 } },
    { id: 'a2_rostrum', name: '연단', age: 2, color: 'blue', cost: { stone: 1, wood: 1 }, chainOut: 'capitol', effect: { vp: 4 } },

    // 노란색 (상업 건물) 4장
    { id: 'a2_brewery', name: '양조장', age: 2, color: 'yellow', cost: {}, chainOut: 'barrel', effect: { coins: 6 } },
    { id: 'a2_caravansery', name: '대상숙소', age: 2, color: 'yellow', cost: { coins: 2, glass: 1, papyrus: 1 }, effect: { flexResources: ['wood', 'clay', 'stone'] } },
    { id: 'a2_forum', name: '포럼', age: 2, color: 'yellow', cost: { coins: 3, clay: 1 }, effect: { flexResources: ['glass', 'papyrus'] } },
    { id: 'a2_customs_house', name: '세관', age: 2, color: 'yellow', cost: { coins: 4 }, effect: { tradeDiscount: ['glass', 'papyrus'] } },

    // 빨간색 (군사 건물) 5장
    { id: 'a2_walls', name: '성벽', age: 2, color: 'red', cost: { stone: 2 }, effect: { shields: 2 } },
    { id: 'a2_horse_breeders', name: '승마장', age: 2, color: 'red', cost: { clay: 1, wood: 1 }, chainIn: 'horseshoe', effect: { shields: 1 } },
    { id: 'a2_barracks', name: '병영', age: 2, color: 'red', cost: { coins: 3 }, chainIn: 'sword', effect: { shields: 1 } },
    { id: 'a2_archery_range', name: '궁술 사격장', age: 2, color: 'red', cost: { stone: 1, wood: 1, papyrus: 1 }, chainOut: 'target', effect: { shields: 2 } },
    { id: 'a2_parade_ground', name: '연병장', age: 2, color: 'red', cost: { clay: 2, glass: 1 }, chainOut: 'helmet', effect: { shields: 2 } },

    // 초록색 (과학 건물) 4장
    { id: 'a2_dispensary', name: '진료소', age: 2, color: 'green', cost: { clay: 2, stone: 1 }, chainIn: 'gear', effect: { vp: 2, science: 'mortar' } },
    { id: 'a2_laboratory', name: '실험실', age: 2, color: 'green', cost: { wood: 1, glass: 2 }, chainOut: 'lamp', effect: { vp: 1, science: 'plumb' } },
    { id: 'a2_library', name: '도서관', age: 2, color: 'green', cost: { stone: 1, wood: 1, glass: 1 }, chainIn: 'book', effect: { vp: 2, science: 'quill' } },
    { id: 'a2_school', name: '학교', age: 2, color: 'green', cost: { wood: 1, papyrus: 2 }, chainOut: 'harp', effect: { vp: 1, science: 'wheel' } },
  ];

  const AGE3_CARDS = [
    // 파란색 (시민 건물) 6장
    { id: 'a3_palace', name: '궁전', age: 3, color: 'blue', cost: { clay: 1, stone: 1, wood: 1, glass: 2 }, effect: { vp: 7 } },
    { id: 'a3_town_hall', name: '시청', age: 3, color: 'blue', cost: { stone: 3, wood: 2 }, effect: { vp: 7 } },
    { id: 'a3_obelisk', name: '오벨리스크', age: 3, color: 'blue', cost: { stone: 2, glass: 1 }, effect: { vp: 5 } },
    { id: 'a3_gardens', name: '정원', age: 3, color: 'blue', cost: { clay: 2, wood: 2 }, chainIn: 'pillar', effect: { vp: 6 } },
    { id: 'a3_pantheon', name: '판테온', age: 3, color: 'blue', cost: { clay: 1, wood: 1, papyrus: 2 }, chainIn: 'sun', effect: { vp: 6 } },
    { id: 'a3_senate', name: '원로원', age: 3, color: 'blue', cost: { clay: 2, stone: 1, papyrus: 1 }, chainIn: 'capitol', effect: { vp: 5 } },

    // 노란색 (상업 건물) 5장
    { id: 'a3_chamber_of_commerce', name: '상공회의소', age: 3, color: 'yellow', cost: { papyrus: 2 }, effect: { vp: 3, coinsPerColor: { color: 'gray', amount: 3 } } },
    { id: 'a3_port', name: '항구', age: 3, color: 'yellow', cost: { wood: 1, glass: 1, papyrus: 1 }, effect: { vp: 3, coinsPerColor: { color: 'brown', amount: 2 } } },
    { id: 'a3_armory', name: '무기고', age: 3, color: 'yellow', cost: { stone: 2, glass: 1 }, effect: { vp: 3, coinsPerColor: { color: 'red', amount: 1 } } },
    { id: 'a3_lighthouse', name: '등대', age: 3, color: 'yellow', cost: { clay: 2, glass: 1 }, chainIn: 'vase', effect: { vp: 3, coinsPerColor: { color: 'yellow', amount: 1 } } },
    { id: 'a3_arena', name: '경기장', age: 3, color: 'yellow', cost: { clay: 1, stone: 1, wood: 1 }, chainIn: 'barrel', effect: { vp: 3, coinsPerWonder: 2 } },

    // 빨간색 (군사 건물) 5장
    { id: 'a3_fortifications', name: '요새', age: 3, color: 'red', cost: { stone: 2, clay: 1, papyrus: 1 }, chainIn: 'tower', effect: { shields: 2 } },
    { id: 'a3_arsenal', name: '병기창', age: 3, color: 'red', cost: { clay: 3, wood: 2 }, effect: { shields: 3 } },
    { id: 'a3_praetorium', name: '근위대', age: 3, color: 'red', cost: { coins: 8 }, effect: { shields: 3 } },
    { id: 'a3_siege_workshop', name: '공성 작업장', age: 3, color: 'red', cost: { wood: 3, glass: 1 }, chainIn: 'target', effect: { shields: 2 } },
    { id: 'a3_circus', name: '전차 경기장', age: 3, color: 'red', cost: { clay: 2, stone: 2 }, chainIn: 'helmet', effect: { shields: 2 } },

    // 초록색 (과학 건물) 4장
    { id: 'a3_academy', name: '아카데미', age: 3, color: 'green', cost: { stone: 1, wood: 1, glass: 2 }, effect: { vp: 3, science: 'sundial' } },
    { id: 'a3_study', name: '서재', age: 3, color: 'green', cost: { wood: 2, glass: 1, papyrus: 1 }, effect: { vp: 3, science: 'sundial' } },
    { id: 'a3_university', name: '대학', age: 3, color: 'green', cost: { clay: 1, glass: 1, papyrus: 1 }, chainIn: 'harp', effect: { vp: 2, science: 'globe' } },
    { id: 'a3_observatory', name: '천문대', age: 3, color: 'green', cost: { stone: 1, papyrus: 2 }, chainIn: 'lamp', effect: { vp: 2, science: 'globe' } },
  ];

  const GUILD_CARDS = [
    {
      id: 'g_merchants',
      name: '상인 길드',
      age: 3,
      color: 'purple',
      isGuild: true,
      cost: { clay: 1, wood: 1, glass: 1, papyrus: 1 },
      effect: { guild: { type: 'color', colors: ['yellow'], coinPer: 1, vpPer: 1, desc: '가장 많은 노란색 카드 수 × (즉시 1원 + 종료 1점)' } },
    },
    {
      id: 'g_shipowners',
      name: '선주 길드',
      age: 3,
      color: 'purple',
      isGuild: true,
      cost: { clay: 1, stone: 1, glass: 1, papyrus: 1 },
      effect: { guild: { type: 'color', colors: ['brown', 'gray'], coinPer: 1, vpPer: 1, desc: '가장 많은 갈색+회색 카드 수 × (즉시 1원 + 종료 1점)' } },
    },
    {
      id: 'g_builders',
      name: '건축가 길드',
      age: 3,
      color: 'purple',
      isGuild: true,
      cost: { stone: 2, clay: 1, wood: 1, glass: 1 },
      effect: { guild: { type: 'wonders', coinPer: 0, vpPer: 2, desc: '가장 많은 건설된 불가사의 수 × 종료 2점' } },
    },
    {
      id: 'g_magistrates',
      name: '행정관 길드',
      age: 3,
      color: 'purple',
      isGuild: true,
      cost: { wood: 2, clay: 1, papyrus: 1 },
      effect: { guild: { type: 'color', colors: ['blue'], coinPer: 1, vpPer: 1, desc: '가장 많은 파란색 카드 수 × (즉시 1원 + 종료 1점)' } },
    },
    {
      id: 'g_scientists',
      name: '과학자 길드',
      age: 3,
      color: 'purple',
      isGuild: true,
      cost: { clay: 2, wood: 2 },
      effect: { guild: { type: 'color', colors: ['green'], coinPer: 1, vpPer: 1, desc: '가장 많은 초록색 카드 수 × (즉시 1원 + 종료 1점)' } },
    },
    {
      id: 'g_moneylenders',
      name: '고리대금업자 길드',
      age: 3,
      color: 'purple',
      isGuild: true,
      cost: { stone: 2, wood: 2 },
      effect: { guild: { type: 'coins', coinPer: 0, vpPer: 1, step: 3, desc: '가장 많은 보유 코인 3원당 종료 1점' } },
    },
    {
      id: 'g_tacticians',
      name: '전략가 길드',
      age: 3,
      color: 'purple',
      isGuild: true,
      cost: { stone: 2, clay: 1, papyrus: 1 },
      effect: { guild: { type: 'color', colors: ['red'], coinPer: 1, vpPer: 1, desc: '가장 많은 빨간색 카드 수 × (즉시 1원 + 종료 1점)' } },
    },
  ];

  const ALL_CARDS = [...AGE1_CARDS, ...AGE2_CARDS, ...AGE3_CARDS, ...GUILD_CARDS];
  const CARDS_BY_ID = Object.fromEntries(ALL_CARDS.map((c) => [c.id, c]));

  function describeCardEffect(card) {
    const parts = [];
    const e = card.effect || {};
    if (e.resources) {
      for (const [res, amt] of Object.entries(e.resources)) {
        parts.push(`${RESOURCE_LABELS[res]} +${amt}`);
      }
    }
    if (e.flexResources) {
      parts.push(`매 턴 ${e.flexResources.map((r) => RESOURCE_LABELS[r]).join('/')} 중 1 생산`);
    }
    if (e.tradeDiscount) {
      parts.push(`${e.tradeDiscount.map((r) => RESOURCE_LABELS[r]).join('·')} 교역 비용 1원 고정`);
    }
    if (e.coins) parts.push(`즉시 코인 +${e.coins}원`);
    if (e.coinsPerColor) {
      const label = { brown: '갈색', gray: '회색', red: '빨간색', yellow: '노란색' }[e.coinsPerColor.color];
      parts.push(`내 ${label} 카드 1장당 +${e.coinsPerColor.amount}원`);
    }
    if (e.coinsPerWonder) parts.push(`내 건설된 불가사의 1개당 +${e.coinsPerWonder}원`);
    if (e.shields) parts.push(`방패 +${e.shields}`);
    if (e.science) parts.push(`과학: ${SCIENCE_LABELS[e.science]}`);
    if (e.vp) parts.push(`승점 +${e.vp}`);
    if (e.guild) parts.push(e.guild.desc);
    return parts.join(' · ');
  }

  SWDuel.Cards = {
    AGE1_CARDS,
    AGE2_CARDS,
    AGE3_CARDS,
    GUILD_CARDS,
    ALL_CARDS,
    CARDS_BY_ID,
    CHAIN_LABELS,
    SCIENCE_LABELS,
    RESOURCE_LABELS,
    COLOR_LABELS,
    describeCardEffect,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SWDuel.Cards;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
