/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) 엔진/데이터/AI/UI 통합 단위 테스트
 */
const assert = require('assert');
const Cards = require('../src/data/cards');
const Wonders = require('../src/data/wonders');
const Tokens = require('../src/data/tokens');
const Layouts = require('../src/data/layouts');
const Cost = require('../src/engine/cost');
const Engine = require('../src/engine/engine');
const AI = require('../src/engine/ai');

// UI 렌더러 스모크 테스트를 위한 window/SWDuel 연결
global.window = global;
require('../src/ui/icons');
require('../src/ui/render');

function runTests() {
  console.log('1. 데이터베이스 수량 및 무결성 검증...');
  assert.strictEqual(Cards.AGE1_CARDS.length, 23, '1시대 카드는 23장이어야 함');
  assert.strictEqual(Cards.AGE2_CARDS.length, 23, '2시대 카드는 23장이어야 함');
  assert.strictEqual(Cards.AGE3_CARDS.length, 20, '3시대 일반 카드는 20장이어야 함');
  assert.strictEqual(Cards.GUILD_CARDS.length, 7, '길드 카드는 7장이어야 함');
  assert.strictEqual(Wonders.WONDERS.length, 12, '불가사의는 12종이어야 함');
  assert.strictEqual(Tokens.PROGRESS_TOKENS.length, 10, '진보 토큰은 10종이어야 함');

  for (const age of [1, 2, 3]) {
    assert.strictEqual(Layouts.AGE_LAYOUTS[age].length, 20, `${age}시대 피라미드는 20슬롯이어야 함`);
  }

  // 연쇄 기호 매칭 검증: 모든 chainIn이 어딘가의 chainOut과 매칭되어야 함
  const allOut = new Set(Cards.ALL_CARDS.map((c) => c.chainOut).filter(Boolean));
  for (const c of Cards.ALL_CARDS) {
    if (c.chainIn) {
      assert(allOut.has(c.chainIn), `${c.name}의 연쇄 기호 ${c.chainIn}에 해당하는 선행 카드가 없음`);
    }
  }

  console.log('2. 불가사의 드래프트 (1-2-1, 2-1-2) 검증...');
  let state = Engine.createInitialState({ mode: 'local' });
  assert.strictEqual(state.phase, 'WONDER_DRAFT');
  assert.strictEqual(state.players[0].coins, 7);
  assert.strictEqual(state.players[1].coins, 7);
  assert.strictEqual(state.boardTokens.length, 5);
  assert.strictEqual(state.unusedTokens.length, 5);

  assert.strictEqual(state.currentPlayer, 0);
  state = Engine.draftWonder(state, state.draft.pool[0].id);
  assert.strictEqual(state.currentPlayer, 1);
  state = Engine.draftWonder(state, state.draft.pool[0].id);
  assert.strictEqual(state.currentPlayer, 1);
  state = Engine.draftWonder(state, state.draft.pool[0].id);
  assert.strictEqual(state.players[0].wonders.length, 2);
  assert.strictEqual(state.players[1].wonders.length, 2);
  assert.strictEqual(state.draft.round, 2);
  assert.strictEqual(state.currentPlayer, 1);

  state = Engine.draftWonder(state, state.draft.pool[0].id);
  assert.strictEqual(state.currentPlayer, 0);
  state = Engine.draftWonder(state, state.draft.pool[0].id);
  assert.strictEqual(state.currentPlayer, 0);
  state = Engine.draftWonder(state, state.draft.pool[0].id);
  assert.strictEqual(state.players[0].wonders.length, 4);
  assert.strictEqual(state.players[1].wonders.length, 4);
  assert.strictEqual(state.phase, 'PLAYING');
  assert.strictEqual(state.age, 1);
  assert.strictEqual(state.pyramid.length, 20);

  console.log('3. 교역 비용 공식 및 할인/연쇄/진보 토큰 비용 계산 검증...');
  const p0 = {
    index: 0,
    name: 'P1',
    coins: 20,
    cards: [
      Cards.CARDS_BY_ID.a1_lumber_yard,
      Cards.CARDS_BY_ID.a1_stone_reserve,
      Cards.CARDS_BY_ID.a1_theater,
      Cards.CARDS_BY_ID.a2_caravansery,
    ],
    wonders: [Wonders.WONDERS_BY_ID.w_pyramids],
    tokens: [Tokens.TOKENS_BY_ID.pt_masonry, Tokens.TOKENS_BY_ID.pt_architecture, Tokens.TOKENS_BY_ID.pt_urbanism],
  };
  const p1 = {
    index: 1,
    name: 'P2',
    coins: 10,
    cards: [
      Cards.CARDS_BY_ID.a2_brickyard,
      Cards.CARDS_BY_ID.a2_shelf_quarry,
      Cards.CARDS_BY_ID.a2_forum,
    ],
    wonders: [],
    tokens: [],
  };

  const statueCost = Cost.calculateCardCost(p0, p1, Cards.CARDS_BY_ID.a2_statue);
  assert.strictEqual(statueCost.isFreeChain, true);
  assert.strictEqual(statueCost.totalCoins, 0);
  assert.strictEqual(statueCost.urbanismBonus, 4);

  const palaceCost = Cost.calculateCardCost(p0, p1, Cards.CARDS_BY_ID.a3_palace);
  assert.strictEqual(palaceCost.totalCoins, 1);

  const pyrCost = Cost.calculateWonderCost(p0, p1, Wonders.WONDERS_BY_ID.w_pyramids);
  assert.strictEqual(pyrCost.totalCoins, 1);

  const glassUnit = Cost.getTradeUnitPrice(Cost.getPlayerProduction(p0), Cost.getPlayerProduction(p1), 'glass');
  assert.strictEqual(glassUnit, 2);

  console.log('4. 군사 약탈 토큰·전략·경제·신학·7개 불가사의 제한 검증...');
  let mState = Engine.createInitialState({ mode: 'local', skipDraft: true });
  mState.pyramid[14] = { ...mState.pyramid[14], card: Cards.CARDS_BY_ID.a3_arsenal, removed: false, faceUp: true };
  mState.players[0].coins = 50;
  mState.players[0].cards = [Cards.CARDS_BY_ID.a2_brickyard, Cards.CARDS_BY_ID.a2_sawmill, Cards.CARDS_BY_ID.a1_clay_pit];
  mState.players[0].tokens = [Tokens.TOKENS_BY_ID.pt_strategy];
  mState.players[1].tokens = [Tokens.TOKENS_BY_ID.pt_economy];
  mState = Engine.applyPlayerAction(mState, { type: 'BUILD', slotIndex: 14 });
  // 전략 토큰 덕분에 방패 3 + 1 = 4 -> militaryPos = 4
  assert.strictEqual(mState.militaryPos, 4);
  assert.strictEqual(mState.players[1].coins, 5);
  assert.strictEqual(mState.looted[1].tier1, true);

  // 7개 불가사의 제한 검증
  let wState = Engine.createInitialState({ mode: 'local', skipDraft: true });
  wState.players[0].coins = 50;
  wState.players[0].tokens = [Tokens.TOKENS_BY_ID.pt_theology];
  wState.players[0].wonders = [
    { ...Wonders.WONDERS_BY_ID.w_pyramids, built: true, removed: false, builtCardAge: 1 },
    { ...Wonders.WONDERS_BY_ID.w_colossus, built: true, removed: false, builtCardAge: 1 },
    { ...Wonders.WONDERS_BY_ID.w_sphinx, built: true, removed: false, builtCardAge: 1 },
    { ...Wonders.WONDERS_BY_ID.w_great_lighthouse, built: false, removed: false, builtCardAge: null },
  ];
  wState.players[1].wonders = [
    { ...Wonders.WONDERS_BY_ID.w_appian_way, built: true, removed: false, builtCardAge: 1 },
    { ...Wonders.WONDERS_BY_ID.w_hanging_gardens, built: true, removed: false, builtCardAge: 1 },
    { ...Wonders.WONDERS_BY_ID.w_temple_of_artemis, built: true, removed: false, builtCardAge: 1 },
    { ...Wonders.WONDERS_BY_ID.w_piraeus, built: false, removed: false, builtCardAge: null },
  ];
  wState = Engine.applyPlayerAction(wState, {
    type: 'WONDER',
    slotIndex: 14,
    wonderId: 'w_great_lighthouse',
  });
  assert.strictEqual(Engine.getTotalBuiltWonders(wState), 7);
  assert.strictEqual(wState.players[1].wonders[3].removed, true, '7번째 불가사의 건설 시 8번째 불가사의 제거');
  assert.strictEqual(wState.currentPlayer, 0, '신학 토큰으로 모든 불가사의 추가 턴 부여');

  console.log('5. 길드·진보토큰 점수 및 과학 6종 즉시 승리 검증...');
  let sState = Engine.createInitialState({ mode: 'local', skipDraft: true });
  sState.players[0].coins = 50;
  sState.players[0].cards = [
    Cards.CARDS_BY_ID.a1_workshop,
    Cards.CARDS_BY_ID.a1_apothecary,
    Cards.CARDS_BY_ID.a1_scriptorium,
    Cards.CARDS_BY_ID.a1_pharmacist,
    Cards.CARDS_BY_ID.a3_university,
    Cards.CARDS_BY_ID.g_builders, // 건축가 길드
  ];
  sState.players[0].wonders = [
    { ...Wonders.WONDERS_BY_ID.w_pyramids, built: true, removed: false },
    { ...Wonders.WONDERS_BY_ID.w_sphinx, built: true, removed: false },
  ];
  sState.players[0].tokens = [Tokens.TOKENS_BY_ID.pt_mathematics, Tokens.TOKENS_BY_ID.pt_philosophy];
  const scoreCheck = Cost.computeScores(sState);
  assert.strictEqual(scoreCheck[0].guildVp, 4, '건축가 길드 = 최다 불가사의 2개 * 2점 = 4점');
  assert.strictEqual(scoreCheck[0].tokenVp, 2 * 3 + 7, '수학(토큰 2개*3) + 철학(7) = 13점');

  sState.boardTokens = [Tokens.TOKENS_BY_ID.pt_law, Tokens.TOKENS_BY_ID.pt_agriculture];
  sState.pyramid[14] = { ...sState.pyramid[14], card: Cards.CARDS_BY_ID.a2_library, removed: false, faceUp: true };
  sState = Engine.applyPlayerAction(sState, { type: 'BUILD', slotIndex: 14 });
  assert.strictEqual(sState.pendingAction.type, 'PICK_PROGRESS_TOKEN');
  sState = Engine.resolvePendingChoice(sState, { tokenId: 'pt_law' });
  assert.strictEqual(sState.phase, 'GAME_OVER');
  assert.strictEqual(sState.result.victoryType, 'science');

  console.log('6. UI 렌더러 스모크 테스트 및 스마트 AI 풀 게임 시뮬레이션 (15판)...');
  const mockContainer = { innerHTML: '' };
  const results = { military: 0, science: 0, civilian: 0, maxTurns: 0 };
  for (let g = 0; g < 15; g++) {
    let sim = Engine.createInitialState({ mode: 'ai' });
    let safety = 0;
    while (sim.phase !== 'GAME_OVER' && safety < 400) {
      safety++;
      if (g === 0 && safety % 10 === 1) {
        global.SWDuel.UI.renderApp(mockContainer, sim, { selectedSlot: null });
        assert(mockContainer.innerHTML.length > 500, 'UI HTML이 정상 렌더링되어야 함');
      }
      if (sim.phase === 'WONDER_DRAFT') {
        sim = Engine.draftWonder(sim, AI.chooseDraftWonder(sim));
      } else if (sim.phase === 'CHOOSE_STARTER') {
        sim = Engine.chooseAgeStarter(sim, AI.chooseAgeStarter(sim));
      } else if (sim.phase === 'PLAYING') {
        if (sim.pendingAction) {
          sim = Engine.resolvePendingChoice(sim, AI.choosePendingAction(sim));
        } else {
          sim = Engine.applyPlayerAction(sim, AI.chooseTurnAction(sim));
        }
      }
    }
    global.SWDuel.UI.renderApp(mockContainer, sim, { selectedSlot: null });
    assert(mockContainer.innerHTML.includes('점수 항목'), '게임 종료 점수판이 렌더링되어야 함');
    assert.strictEqual(sim.phase, 'GAME_OVER', `${g + 1}번째 시뮬레이션이 정상 종료되지 않음`);
    assert(Engine.getTotalBuiltWonders(sim) <= 7, '건설된 불가사의 총합은 7을 넘을 수 없음');
    results[sim.result.victoryType]++;
    if (safety > results.maxTurns) results.maxTurns = safety;
  }
  console.log('   시뮬레이션 15판 결과:', results);
  console.log('✅ 모든 엔진·규칙·AI·UI 테스트 통과!');
}

runTests();
