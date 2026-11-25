/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) 순수 함수형 핵심 게임 엔진 및 상태 머신
 * - DOM 의존성 없음 (Node 테스트 및 브라우저 공용)
 */
(function (root) {
  const SWDuel = (root.SWDuel = root.SWDuel || {});

  function getModules() {
    if (typeof require === 'function' && typeof module !== 'undefined' && module.exports) {
      return {
        Cards: SWDuel.Cards || require('../data/cards'),
        Wonders: SWDuel.Wonders || require('../data/wonders'),
        Tokens: SWDuel.Tokens || require('../data/tokens'),
        Layouts: SWDuel.Layouts || require('../data/layouts'),
        Cost: SWDuel.Cost || require('./cost'),
      };
    }
    return {
      Cards: SWDuel.Cards,
      Wonders: SWDuel.Wonders,
      Tokens: SWDuel.Tokens,
      Layouts: SWDuel.Layouts,
      Cost: SWDuel.Cost,
    };
  }

  function cloneState(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function shuffle(arr, rng = Math.random) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function addLog(state, message, type = 'info', playerIndex = null) {
    state.log.push({
      id: state.log.length + 1,
      age: state.age,
      turn: state.turnNumber,
      playerIndex,
      type,
      message,
    });
  }

  function buildAgeDeck(age, rng = Math.random) {
    const { Cards } = getModules();
    if (age === 1) {
      return shuffle(Cards.AGE1_CARDS, rng).slice(0, 20);
    }
    if (age === 2) {
      return shuffle(Cards.AGE2_CARDS, rng).slice(0, 20);
    }
    const base = shuffle(Cards.AGE3_CARDS, rng).slice(0, 17);
    const guilds = shuffle(Cards.GUILD_CARDS, rng).slice(0, 3);
    return shuffle([...base, ...guilds], rng);
  }

  function setupAgePyramid(age, rng = Math.random) {
    const { Layouts } = getModules();
    const layout = Layouts.AGE_LAYOUTS[age];
    const deck = buildAgeDeck(age, rng);
    return layout.map((slot, i) => ({
      slotIndex: slot.slotIndex,
      row: slot.row,
      col: slot.col,
      faceUp: slot.faceUp,
      coveredBy: slot.coveredBy.slice(),
      removed: false,
      card: deck[i],
    }));
  }

  function createPlayer(index, name, isAI = false) {
    return {
      index,
      name,
      isAI,
      coins: 7,
      cards: [],
      wonders: [],
      tokens: [],
    };
  }

  function createInitialState(options = {}) {
    const { Wonders, Tokens } = getModules();
    const rng = options.rng || Math.random;
    const mode = options.mode === 'ai' ? 'ai' : 'local';
    const p1Name = options.p1Name || '플레이어 1';
    const p2Name = options.p2Name || (mode === 'ai' ? '스마트 AI' : '플레이어 2');

    const shuffledTokens = shuffle(Tokens.PROGRESS_TOKENS, rng);
    const boardTokens = shuffledTokens.slice(0, 5);
    const unusedTokens = shuffledTokens.slice(5);

    const shuffledWonders = shuffle(Wonders.WONDERS, rng);
    const draftRound1 = shuffledWonders.slice(0, 4).map((w) => ({ ...w, built: false, removed: false, builtCardAge: null }));
    const draftRound2 = shuffledWonders.slice(4, 8).map((w) => ({ ...w, built: false, removed: false, builtCardAge: null }));

    const state = {
      mode,
      phase: 'WONDER_DRAFT', // 'WONDER_DRAFT' | 'CHOOSE_STARTER' | 'PLAYING' | 'GAME_OVER'
      age: 1,
      turnNumber: 1,
      currentPlayer: 0,
      lastPlayerIndex: 0,
      starterChooser: 0,
      players: [
        createPlayer(0, p1Name, false),
        createPlayer(1, p2Name, mode === 'ai'),
      ],
      militaryPos: 0, // -9 (P1 패배/P2 압도) ~ +9 (P1 압도/P2 패배)
      looted: [
        { tier1: false, tier2: false }, // P0 측 약탈 토큰 (-2, -5)
        { tier1: false, tier2: false }, // P1 측 약탈 토큰 (-2, -5)
      ],
      boardTokens,
      unusedTokens,
      discardPile: [],
      pyramid: [],
      draft: {
        round: 1,
        order: [0, 1, 1, 0],
        step: 0,
        pool: draftRound1,
        nextPool: draftRound2,
      },
      pendingAction: null,
      pendingQueue: [],
      pendingExtraTurn: false,
      result: null,
      log: [],
    };

    if (options.skipDraft) {
      state.players[0].wonders = draftRound1;
      state.players[1].wonders = draftRound2;
      state.draft = null;
      state.phase = 'PLAYING';
      state.pyramid = setupAgePyramid(1, rng);
      addLog(state, '불가사의 배분이 완료되어 1시대를 시작합니다.', 'phase');
    } else {
      addLog(state, '게임 시작! 불가사의 1차 드래프트를 진행합니다. (순서: 1-2-1)', 'phase');
    }

    return state;
  }

  function draftWonder(prevState, wonderId, rng = Math.random) {
    if (prevState.phase !== 'WONDER_DRAFT') {
      throw new Error('불가사의 드래프트 단계가 아닙니다.');
    }
    const state = cloneState(prevState);
    const { draft } = state;
    const pickerIndex = draft.order[draft.step];
    const idx = draft.pool.findIndex((w) => w.id === wonderId);
    if (idx === -1) {
      throw new Error('선택할 수 없는 불가사의입니다.');
    }

    const [chosen] = draft.pool.splice(idx, 1);
    state.players[pickerIndex].wonders.push(chosen);
    addLog(state, `${state.players[pickerIndex].name}이(가) 불가사의 [${chosen.name}]을(를) 선택했습니다.`, 'draft', pickerIndex);

    draft.step += 1;

    // 4장 중 3번째가 선택되면 남은 1장은 마지막 순번 플레이어에게 자동 배정
    if (draft.pool.length === 1) {
      const lastPicker = draft.order[draft.step];
      const [remaining] = draft.pool.splice(0, 1);
      state.players[lastPicker].wonders.push(remaining);
      addLog(state, `남은 불가사의 [${remaining.name}]은(는) ${state.players[lastPicker].name}에게 배정되었습니다.`, 'draft', lastPicker);

      if (draft.round === 1) {
        draft.round = 2;
        draft.order = [1, 0, 0, 1];
        draft.step = 0;
        draft.pool = draft.nextPool;
        draft.nextPool = [];
        state.currentPlayer = draft.order[0];
        addLog(state, '불가사의 2차 드래프트를 시작합니다. (순서: 2-1-2)', 'phase');
      } else {
        state.draft = null;
        state.phase = 'PLAYING';
        state.age = 1;
        state.currentPlayer = 0;
        state.pyramid = setupAgePyramid(1, rng);
        addLog(state, '불가사의 드래프트 완료! 1시대를 시작합니다.', 'phase');
      }
    } else {
      state.currentPlayer = draft.order[draft.step];
    }

    return state;
  }

  function isSlotAvailable(pyramid, slot) {
    if (slot.removed) return false;
    return slot.coveredBy.every((idx) => pyramid[idx].removed);
  }

  function getAvailableSlots(state) {
    if (state.phase !== 'PLAYING') return [];
    return state.pyramid.filter((slot) => isSlotAvailable(state.pyramid, slot));
  }

  function getTotalBuiltWonders(state) {
    return (
      state.players[0].wonders.filter((w) => w.built).length +
      state.players[1].wonders.filter((w) => w.built).length
    );
  }

  function checkImmediateVictory(state) {
    const { Cost } = getModules();
    if (state.militaryPos >= 9) {
      state.phase = 'GAME_OVER';
      state.result = {
        victoryType: 'military',
        winner: 0,
        scores: Cost.computeScores(state),
      };
      addLog(state, `군사적 패권! ${state.players[0].name}의 군대가 상대 수도에 도달하여 즉시 승리했습니다!`, 'victory', 0);
      return true;
    }
    if (state.militaryPos <= -9) {
      state.phase = 'GAME_OVER';
      state.result = {
        victoryType: 'military',
        winner: 1,
        scores: Cost.computeScores(state),
      };
      addLog(state, `군사적 패권! ${state.players[1].name}의 군대가 상대 수도에 도달하여 즉시 승리했습니다!`, 'victory', 1);
      return true;
    }

    for (let i = 0; i < 2; i++) {
      if (Cost.getUniqueScienceCount(state.players[i]) >= 6) {
        state.phase = 'GAME_OVER';
        state.result = {
          victoryType: 'science',
          winner: i,
          scores: Cost.computeScores(state),
        };
        addLog(state, `과학적 패권! ${state.players[i].name}이(가) 서로 다른 과학 기호 6종을 모아 즉시 승리했습니다!`, 'victory', i);
        return true;
      }
    }

    return false;
  }

  function applyMilitaryShields(state, playerIndex, shields, isRedCard = false) {
    const { Cost } = getModules();
    const player = state.players[playerIndex];
    const oppIndex = 1 - playerIndex;
    const opp = state.players[oppIndex];

    let totalShields = shields;
    if (isRedCard && Cost.hasToken(player, 'pt_strategy')) {
      totalShields += 1;
    }
    if (totalShields <= 0) return;

    const delta = playerIndex === 0 ? totalShields : -totalShields;
    state.militaryPos = Math.max(-9, Math.min(9, state.militaryPos + delta));

    // 상대방 약탈 토큰 검사
    const advanceTowardOpp = playerIndex === 0 ? state.militaryPos : -state.militaryPos;
    if (advanceTowardOpp >= 3 && !state.looted[oppIndex].tier1) {
      state.looted[oppIndex].tier1 = true;
      const lost = Math.min(2, opp.coins);
      opp.coins -= lost;
      addLog(state, `군사 약탈(-2)! ${opp.name}이(가) ${lost}원을 잃었습니다.`, 'military', playerIndex);
    }
    if (advanceTowardOpp >= 6 && !state.looted[oppIndex].tier2) {
      state.looted[oppIndex].tier2 = true;
      const lost = Math.min(5, opp.coins);
      opp.coins -= lost;
      addLog(state, `군사 약탈(-5)! ${opp.name}이(가) ${lost}원을 잃었습니다.`, 'military', playerIndex);
    }
  }

  function applyCardEffects(state, playerIndex, card) {
    const { Cost } = getModules();
    const player = state.players[playerIndex];
    const e = card.effect || {};

    if (e.coins) {
      player.coins += e.coins;
    }
    if (e.coinsPerColor) {
      const cnt = Cost.countCardsByColor(player, e.coinsPerColor.color);
      const gain = cnt * e.coinsPerColor.amount;
      player.coins += gain;
    }
    if (e.coinsPerWonder) {
      const builtCount = player.wonders.filter((w) => w.built).length;
      player.coins += builtCount * e.coinsPerWonder;
    }
    if (e.guild && e.guild.coinPer > 0) {
      const maxCount = Math.max(
        Cost.countCardsByColor(state.players[0], e.guild.colors),
        Cost.countCardsByColor(state.players[1], e.guild.colors)
      );
      player.coins += maxCount * e.guild.coinPer;
    }
    if (e.shields) {
      applyMilitaryShields(state, playerIndex, e.shields, card.color === 'red');
    }
    if (e.science) {
      const counts = Cost.getScienceSymbols(player);
      if (counts[e.science] === 2 && state.boardTokens.length > 0) {
        state.pendingQueue.push({
          type: 'PICK_PROGRESS_TOKEN',
          playerIndex,
          source: 'science',
          choices: state.boardTokens.map((t) => t.id),
        });
      }
    }
  }

  function applyWonderEffects(state, playerIndex, wonder, rng = Math.random) {
    const { Cost } = getModules();
    const player = state.players[playerIndex];
    const oppIndex = 1 - playerIndex;
    const opp = state.players[oppIndex];
    const e = wonder.effect || {};

    if (e.coins) {
      player.coins += e.coins;
    }
    if (e.oppLoseCoins) {
      const lost = Math.min(e.oppLoseCoins, opp.coins);
      opp.coins -= lost;
      if (lost > 0) {
        addLog(state, `${opp.name}이(가) ${wonder.name} 효과로 ${lost}원을 잃었습니다.`, 'wonder', playerIndex);
      }
    }
    if (e.shields) {
      applyMilitaryShields(state, playerIndex, e.shields, false);
    }
    if (e.destroyOppColor) {
      const eligible = opp.cards.filter((c) => c.color === e.destroyOppColor);
      if (eligible.length > 0) {
        state.pendingQueue.push({
          type: 'DESTROY_OPPONENT_CARD',
          playerIndex,
          targetIndex: oppIndex,
          color: e.destroyOppColor,
          eligibleCardIds: eligible.map((c) => c.id),
        });
      } else {
        addLog(state, `${opp.name}에게 파괴할 해당 색상 카드가 없어 효과가 건너뛰어졌습니다.`, 'wonder', playerIndex);
      }
    }
    if (e.drawProgressTokens) {
      if (state.unusedTokens.length > 0) {
        const drawn = shuffle(state.unusedTokens, rng).slice(0, e.drawProgressTokens);
        state.pendingQueue.push({
          type: 'PICK_PROGRESS_TOKEN',
          playerIndex,
          source: 'great_library',
          choices: drawn.map((t) => t.id),
        });
      }
    }
    if (e.buildFromDiscard) {
      if (state.discardPile.length > 0) {
        state.pendingQueue.push({
          type: 'BUILD_FROM_DISCARD',
          playerIndex,
        });
      } else {
        addLog(state, '버림 더미가 비어 있어 무료 건설 효과가 건너뛰어졌습니다.', 'wonder', playerIndex);
      }
    }
    if (e.extraTurn || Cost.hasToken(player, 'pt_theology')) {
      state.pendingExtraTurn = true;
    }
  }

  function revealUncoveredCards(state) {
    for (const slot of state.pyramid) {
      if (!slot.removed && !slot.faceUp && isSlotAvailable(state.pyramid, slot)) {
        slot.faceUp = true;
      }
    }
  }

  function finalizeTurnOrAdvance(state, rng = Math.random) {
    const { Cost } = getModules();
    if (checkImmediateVictory(state)) {
      return state;
    }

    if (state.pendingQueue.length > 0) {
      state.pendingAction = state.pendingQueue.shift();
      return state;
    }
    state.pendingAction = null;

    // 현재 시대의 카드가 모두 소진되었는지 확인
    const anyLeft = state.pyramid.some((s) => !s.removed);
    if (!anyLeft) {
      state.pendingExtraTurn = false;
      if (state.age < 3) {
        state.age += 1;
        state.pyramid = setupAgePyramid(state.age, rng);
        state.phase = 'CHOOSE_STARTER';
        // 군사력이 열세인 플레이어가 선공 결정, 동률(0)이면 직전 턴을 진행한 플레이어가 결정
        if (state.militaryPos > 0) {
          state.starterChooser = 1;
        } else if (state.militaryPos < 0) {
          state.starterChooser = 0;
        } else {
          state.starterChooser = state.lastPlayerIndex;
        }
        state.currentPlayer = state.starterChooser;
        addLog(
          state,
          `${state.age - 1}시대가 종료되었습니다. ${state.players[state.starterChooser].name}이(가) ${state.age}시대 선공을 선택합니다.`,
          'phase'
        );
        return state;
      }

      // 3시대 종료 -> 시민 승리 점수 합산
      state.phase = 'GAME_OVER';
      const scores = Cost.computeScores(state);
      let winner = null;
      let tie = false;
      if (scores[0].total > scores[1].total) winner = 0;
      else if (scores[1].total > scores[0].total) winner = 1;
      else if (scores[0].blueVp > scores[1].blueVp) winner = 0;
      else if (scores[1].blueVp > scores[0].blueVp) winner = 1;
      else tie = true;

      state.result = {
        victoryType: 'civilian',
        winner,
        tie,
        scores,
      };
      if (tie) {
        addLog(state, `게임 종료! 총점(${scores[0].total}점) 및 파란색 건물 점수까지 완전히 동일하여 무승부입니다!`, 'victory');
      } else {
        addLog(
          state,
          `게임 종료! ${state.players[winner].name}이(가) ${scores[winner].total} 대 ${scores[1 - winner].total}점으로 시민 승리했습니다!`,
          'victory',
          winner
        );
      }
      return state;
    }

    if (state.pendingExtraTurn) {
      state.pendingExtraTurn = false;
      state.turnNumber += 1;
      addLog(state, `${state.players[state.currentPlayer].name}이(가) 추가 턴을 진행합니다!`, 'extra', state.currentPlayer);
      return state;
    }

    state.currentPlayer = 1 - state.currentPlayer;
    state.turnNumber += 1;
    return state;
  }

  function applyPlayerAction(prevState, action, rng = Math.random) {
    if (prevState.phase !== 'PLAYING' || prevState.pendingAction) {
      throw new Error('현재 일반 턴 행동을 수행할 수 없는 상태입니다.');
    }

    const { Cost } = getModules();
    const state = cloneState(prevState);
    const pIdx = state.currentPlayer;
    const oppIdx = 1 - pIdx;
    const player = state.players[pIdx];
    const opp = state.players[oppIdx];

    const slot = state.pyramid.find((s) => s.slotIndex === action.slotIndex);
    if (!slot || !isSlotAvailable(state.pyramid, slot)) {
      throw new Error('선택할 수 없는 카드 슬롯입니다.');
    }

    const card = slot.card;
    state.lastPlayerIndex = pIdx;
    state.pendingExtraTurn = false;

    if (action.type === 'BUILD') {
      const costInfo = Cost.calculateCardCost(player, opp, card);
      if (!costInfo.affordable) {
        throw new Error('코인이 부족하여 건설할 수 없습니다.');
      }
      player.coins -= costInfo.totalCoins;
      if (costInfo.tradeCoins > 0 && Cost.hasToken(opp, 'pt_economy')) {
        opp.coins += costInfo.tradeCoins;
        addLog(state, `경제 진보 토큰 발동! ${opp.name}이(가) 교역 비용 ${costInfo.tradeCoins}원을 획득했습니다.`, 'token', oppIdx);
      }
      if (costInfo.urbanismBonus > 0) {
        player.coins += costInfo.urbanismBonus;
      }

      slot.removed = true;
      player.cards.push(card);
      applyCardEffects(state, pIdx, card);

      const costDesc = costInfo.isFreeChain
        ? `연쇄 무료 건설${costInfo.urbanismBonus ? ' (도시화 +4원)' : ''}`
        : costInfo.totalCoins === 0
          ? '무료'
          : `${costInfo.totalCoins}원${costInfo.tradeCoins > 0 ? ` (교역 ${costInfo.tradeCoins}원)` : ''}`;
      addLog(state, `${player.name}이(가) [${card.name}]을(를) 건설했습니다. (${costDesc})`, 'build', pIdx);
    } else if (action.type === 'DISCARD') {
      const gain = Cost.getDiscardValue(player);
      player.coins += gain;
      slot.removed = true;
      state.discardPile.push(card);
      addLog(state, `${player.name}이(가) [${card.name}]을(를) 버리고 ${gain}원을 획득했습니다.`, 'discard', pIdx);
    } else if (action.type === 'WONDER') {
      if (getTotalBuiltWonders(state) >= 7) {
        throw new Error('이미 총 7개의 불가사의가 건설되었습니다.');
      }
      const wonder = player.wonders.find((w) => w.id === action.wonderId);
      if (!wonder || wonder.built || wonder.removed) {
        throw new Error('건설할 수 없는 불가사의입니다.');
      }
      const costInfo = Cost.calculateWonderCost(player, opp, wonder);
      if (!costInfo.affordable) {
        throw new Error('코인이 부족하여 불가사의를 건설할 수 없습니다.');
      }

      player.coins -= costInfo.totalCoins;
      if (costInfo.tradeCoins > 0 && Cost.hasToken(opp, 'pt_economy')) {
        opp.coins += costInfo.tradeCoins;
        addLog(state, `경제 진보 토큰 발동! ${opp.name}이(가) 교역 비용 ${costInfo.tradeCoins}원을 획득했습니다.`, 'token', oppIdx);
      }

      slot.removed = true;
      wonder.built = true;
      wonder.builtCardAge = card.age;

      const costDesc = costInfo.totalCoins === 0 ? '무료' : `${costInfo.totalCoins}원`;
      addLog(state, `${player.name}이(가) [${card.name}]을(를) 사용해 불가사의 [${wonder.name}]을(를) 건설했습니다! (${costDesc})`, 'wonder', pIdx);

      // 7번째 불가사의 규칙 확인
      if (getTotalBuiltWonders(state) === 7) {
        for (const p of state.players) {
          for (const w of p.wonders) {
            if (!w.built && !w.removed) {
              w.removed = true;
              addLog(state, `총 7개의 불가사의가 건설되어 남은 미건설 불가사의 [${w.name}]이(가) 게임에서 제거되었습니다.`, 'phase');
            }
          }
        }
      }

      applyWonderEffects(state, pIdx, wonder, rng);
    } else {
      throw new Error('알 수 없는 행동 타입입니다.');
    }

    revealUncoveredCards(state);
    return finalizeTurnOrAdvance(state, rng);
  }

  function resolvePendingChoice(prevState, choice, rng = Math.random) {
    if (!prevState.pendingAction) {
      throw new Error('해결해야 할 대기 행동이 없습니다.');
    }
    const { Tokens } = getModules();
    const state = cloneState(prevState);
    const pending = state.pendingAction;
    state.pendingAction = null;

    if (pending.type === 'PICK_PROGRESS_TOKEN') {
      const tokenId = choice.tokenId;
      if (!pending.choices.includes(tokenId)) {
        throw new Error('선택할 수 없는 진보 토큰입니다.');
      }
      const token = Tokens.TOKENS_BY_ID[tokenId];
      const player = state.players[pending.playerIndex];
      player.tokens.push(token);

      if (pending.source === 'science') {
        state.boardTokens = state.boardTokens.filter((t) => t.id !== tokenId);
      } else if (pending.source === 'great_library') {
        state.unusedTokens = state.unusedTokens.filter((t) => t.id !== tokenId);
      }

      if (token.effect.coins) {
        player.coins += token.effect.coins;
      }

      addLog(state, `${player.name}이(가) 진보 토큰 [${token.name}]을(를) 획득했습니다! (${token.desc})`, 'token', pending.playerIndex);
    } else if (pending.type === 'DESTROY_OPPONENT_CARD') {
      const cardId = choice.cardId;
      if (!pending.eligibleCardIds.includes(cardId)) {
        throw new Error('파괴할 수 없는 카드입니다.');
      }
      const target = state.players[pending.targetIndex];
      const idx = target.cards.findIndex((c) => c.id === cardId);
      const [destroyed] = target.cards.splice(idx, 1);
      state.discardPile.push(destroyed);
      addLog(
        state,
        `${state.players[pending.playerIndex].name}이(가) ${target.name}의 [${destroyed.name}]을(를) 파괴했습니다!`,
        'wonder',
        pending.playerIndex
      );
    } else if (pending.type === 'BUILD_FROM_DISCARD') {
      const cardId = choice.cardId;
      const idx = state.discardPile.findIndex((c) => c.id === cardId);
      if (idx === -1) {
        throw new Error('버림 더미에 해당 카드가 없습니다.');
      }
      const [card] = state.discardPile.splice(idx, 1);
      const player = state.players[pending.playerIndex];
      player.cards.push(card);
      applyCardEffects(state, pending.playerIndex, card);
      addLog(state, `${player.name}이(가) 영묘 효과로 버림 더미에서 [${card.name}]을(를) 무료 건설했습니다!`, 'wonder', pending.playerIndex);
    } else {
      throw new Error('알 수 없는 대기 행동입니다.');
    }

    return finalizeTurnOrAdvance(state, rng);
  }

  function chooseAgeStarter(prevState, starterIndex) {
    if (prevState.phase !== 'CHOOSE_STARTER') {
      throw new Error('선공 선택 단계가 아닙니다.');
    }
    const state = cloneState(prevState);
    state.currentPlayer = starterIndex;
    state.phase = 'PLAYING';
    addLog(state, `${state.age}시대 선공: ${state.players[starterIndex].name}`, 'phase', starterIndex);
    return state;
  }

  SWDuel.Engine = {
    createInitialState,
    draftWonder,
    isSlotAvailable,
    getAvailableSlots,
    getTotalBuiltWonders,
    applyPlayerAction,
    resolvePendingChoice,
    chooseAgeStarter,
    setupAgePyramid,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SWDuel.Engine;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
