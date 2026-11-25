/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) 스마트 휴리스틱 AI 엔진
 */
(function (root) {
  const SWDuel = (root.SWDuel = root.SWDuel || {});

  function getModules() {
    if (typeof require === 'function' && typeof module !== 'undefined' && module.exports) {
      return {
        Cost: SWDuel.Cost || require('./cost'),
        Engine: SWDuel.Engine || require('./engine'),
        Tokens: SWDuel.Tokens || require('../data/tokens'),
      };
    }
    return {
      Cost: SWDuel.Cost,
      Engine: SWDuel.Engine,
      Tokens: SWDuel.Tokens,
    };
  }

  function scoreWonderForDraft(wonder, existingWonders) {
    const e = wonder.effect || {};
    let score = (e.vp || 0) * 1.6;
    if (e.extraTurn) score += 10;
    if (e.coins) score += e.coins * 0.75;
    if (e.oppLoseCoins) score += e.oppLoseCoins * 0.6;
    if (e.shields) score += e.shields * 3.5;
    if (e.flexResources) score += 7.5;
    if (e.destroyOppColor) score += 5.5;
    if (e.drawProgressTokens) score += 8.5;
    if (e.buildFromDiscard) score += 7.5;

    const costCount = Object.values(wonder.cost || {}).reduce((a, b) => a + b, 0);
    score -= costCount * 1.1;

    // 이미 보유한 불가사의와 자원이 너무 겹치거나 과하게 비싸면 소폭 감점
    if (existingWonders.length > 0 && costCount >= 5) score -= 1.0;
    return score;
  }

  function chooseDraftWonder(state) {
    const pIdx = state.currentPlayer;
    const existing = state.players[pIdx].wonders;
    let best = state.draft.pool[0];
    let bestScore = -Infinity;
    for (const w of state.draft.pool) {
      const s = scoreWonderForDraft(w, existing);
      if (s > bestScore) {
        bestScore = s;
        best = w;
      }
    }
    return best.id;
  }

  function evaluateProgressToken(token, state, playerIndex) {
    const { Cost } = getModules();
    const player = state.players[playerIndex];
    const age = state.age;
    const e = token.effect || {};

    if (token.id === 'pt_law') {
      const unique = Cost.getUniqueScienceCount(player);
      if (unique >= 5) return 5000; // 즉시 승리!
      return 12 + unique * 2.5;
    }
    if (e.vpPerToken) {
      return 3 * (player.tokens.length + 1) + (age <= 2 ? 4 : 1);
    }
    if (token.id === 'pt_philosophy') return 11;
    if (token.id === 'pt_agriculture') return 6 * 0.8 + 4 * 1.5;
    if (token.id === 'pt_theology') {
      const unbuilt = player.wonders.filter((w) => !w.built && !w.removed).length;
      return unbuilt * 6.5;
    }
    if (token.id === 'pt_architecture') {
      const unbuilt = player.wonders.filter((w) => !w.built && !w.removed).length;
      return unbuilt * 4.5;
    }
    if (token.id === 'pt_masonry') {
      return age === 1 ? 11 : age === 2 ? 8 : 3;
    }
    if (token.id === 'pt_economy') {
      return age === 1 ? 12 : age === 2 ? 9 : 4;
    }
    if (token.id === 'pt_strategy') {
      return age === 1 ? 11 : age === 2 ? 8 : 4;
    }
    if (token.id === 'pt_urbanism') {
      return 6 * 0.8 + (age <= 2 ? 6 : 2);
    }
    return 5;
  }

  function evaluateCardStrategicValue(state, playerIndex, card, costInfo) {
    const { Cost } = getModules();
    const player = state.players[playerIndex];
    const opp = state.players[1 - playerIndex];
    const age = state.age;
    const e = card.effect || {};
    const prod = Cost.getPlayerProduction(player);

    let value = 0;

    // 1. 승점 (시대가 진행될수록 승점 가중치 증가)
    const vpWeight = age === 1 ? 1.4 : age === 2 ? 1.6 : 1.9;
    if (e.vp) value += e.vp * vpWeight;

    // 2. 군사 평가
    if (e.shields) {
      let shields = e.shields + (card.color === 'red' && Cost.hasToken(player, 'pt_strategy') ? 1 : 0);
      const currentLead = playerIndex === 0 ? state.militaryPos : -state.militaryPos;
      const nextLead = Math.min(9, currentLead + shields);
      if (nextLead >= 9) return 10000; // 즉시 군사 승리

      const currentVp = Cost.getMilitaryZoneVp(state.militaryPos, playerIndex);
      const nextPos = playerIndex === 0 ? nextLead : -nextLead;
      const nextVp = Cost.getMilitaryZoneVp(nextPos, playerIndex);
      value += (nextVp - currentVp) * 1.8;

      // 상대 약탈 토큰 발동 보너스
      const oppIdx = 1 - playerIndex;
      if (currentLead < 3 && nextLead >= 3 && !state.looted[oppIdx].tier1) value += 3.5;
      if (currentLead < 6 && nextLead >= 6 && !state.looted[oppIdx].tier2) value += 6.5;

      // 수비/압박 보너스
      if (currentLead < -4) value += shields * 5.0; // 위기 방어
      else value += shields * 2.8;
    }

    // 3. 과학 평가
    if (e.science) {
      const syms = Cost.getScienceSymbols(player);
      const uniqueCount = Object.keys(syms).length;
      if (!syms[e.science]) {
        if (uniqueCount + 1 >= 6) return 10000; // 즉시 과학 승리
        value += 7 + uniqueCount * 3.5;
      } else if (syms[e.science] === 1 && state.boardTokens.length > 0) {
        const bestTokenScore = Math.max(
          ...state.boardTokens.map((t) => evaluateProgressToken(t, state, playerIndex))
        );
        value += bestTokenScore * 0.95;
      }
    }

    // 4. 자원 생산 평가
    if (e.resources) {
      const ageFactor = age === 1 ? 1.0 : age === 2 ? 0.75 : 0.2;
      for (const [res, amt] of Object.entries(e.resources)) {
        const already = prod.fixed[res] || 0;
        const scarcityBonus = already === 0 ? 5.5 : already === 1 ? 3.5 : 1.8;
        value += amt * scarcityBonus * ageFactor;
      }
    }
    if (e.flexResources) {
      value += (age === 2 ? 9.5 : 6.0);
    }

    // 5. 교역 할인 & 코인 획득
    if (e.tradeDiscount) {
      const oppProd = Cost.getPlayerProduction(opp);
      let discScore = 0;
      for (const r of e.tradeDiscount) {
        discScore += (2 + (oppProd.brownGray[r] || 0)) * (age === 1 ? 2.2 : 1.5);
      }
      value += discScore;
    }
    if (e.coins) value += e.coins * 0.85;
    if (e.coinsPerColor) {
      const cnt = Cost.countCardsByColor(player, e.coinsPerColor.color);
      value += cnt * e.coinsPerColor.amount * 0.75;
    }
    if (e.coinsPerWonder) {
      const built = player.wonders.filter((w) => w.built).length;
      value += built * e.coinsPerWonder * 0.75;
    }

    // 6. 길드 평가
    if (e.guild) {
      const g = e.guild;
      if (g.type === 'color') {
        const maxCnt = Math.max(
          Cost.countCardsByColor(player, g.colors),
          Cost.countCardsByColor(opp, g.colors)
        );
        value += maxCnt * (g.coinPer * 0.65 + g.vpPer * 1.9);
      } else if (g.type === 'wonders') {
        const maxW = Math.max(
          player.wonders.filter((w) => w.built).length,
          opp.wonders.filter((w) => w.built).length
        );
        value += maxW * g.vpPer * 1.9;
      } else if (g.type === 'coins') {
        const maxC = Math.max(player.coins, opp.coins);
        value += Math.floor(maxC / 3) * 1.9;
      }
    }

    // 7. 연쇄 기호 미래 가치 & 도시화 보너스
    if (card.chainOut && age <= 2) {
      value += 2.6;
    }
    if (costInfo) {
      if (costInfo.urbanismBonus) value += costInfo.urbanismBonus * 0.85;
      // 비용 차감 (경제 토큰이 상대에게 있으면 교역 비용 페널티 가중)
      const oppHasEconomy = Cost.hasToken(opp, 'pt_economy');
      const coinPenalty = costInfo.totalCoins * 0.85 + (oppHasEconomy ? costInfo.tradeCoins * 0.7 : 0);
      value -= coinPenalty;
    }

    return value;
  }

  function estimateDenialBonus(state, playerIndex, card) {
    const { Cost } = getModules();
    const oppIdx = 1 - playerIndex;
    const opp = state.players[oppIdx];
    const e = card.effect || {};
    let denial = 0;

    // 상대의 과학 즉시 승리 또는 진보 토큰 견제
    if (e.science) {
      const oppSyms = Cost.getScienceSymbols(opp);
      const unique = Object.keys(oppSyms).length;
      if (!oppSyms[e.science] && unique >= 5) denial += 300;
      else if (oppSyms[e.science] === 1 && state.boardTokens.length > 0) denial += 8;
      else if (!oppSyms[e.science] && unique >= 3) denial += 5;
    }

    // 상대의 군사 즉시 승리 견제
    if (e.shields) {
      const oppShields = e.shields + (card.color === 'red' && Cost.hasToken(opp, 'pt_strategy') ? 1 : 0);
      const oppLead = oppIdx === 0 ? state.militaryPos : -state.militaryPos;
      if (oppLead + oppShields >= 9) denial += 300;
      else if (oppLead + oppShields >= 6) denial += 7;
    }

    return denial;
  }

  function evaluateWonderBuild(state, playerIndex, wonder, costInfo) {
    const { Cost } = getModules();
    const player = state.players[playerIndex];
    const opp = state.players[1 - playerIndex];
    const e = wonder.effect || {};
    let value = (e.vp || 0) * (state.age === 3 ? 1.9 : 1.6);

    if (e.extraTurn || Cost.hasToken(player, 'pt_theology')) {
      value += 11.5;
    }
    if (e.coins) value += e.coins * 0.85;
    if (e.oppLoseCoins) value += Math.min(e.oppLoseCoins, opp.coins) * 0.7;
    if (e.shields) {
      const currentLead = playerIndex === 0 ? state.militaryPos : -state.militaryPos;
      const nextLead = Math.min(9, currentLead + e.shields);
      if (nextLead >= 9) return 10000;
      value += e.shields * 3.2;
    }
    if (e.flexResources) value += (state.age === 3 ? 2.5 : 8.0);
    if (e.destroyOppColor) {
      const targets = opp.cards.filter((c) => c.color === e.destroyOppColor);
      if (targets.length > 0) value += 7.5;
    }
    if (e.drawProgressTokens && state.unusedTokens.length > 0) {
      value += 9.0;
    }
    if (e.buildFromDiscard && state.discardPile.length > 0) {
      const bestDiscard = Math.max(
        ...state.discardPile.map((c) => evaluateCardStrategicValue(state, playerIndex, c, null))
      );
      value += Math.max(3, bestDiscard * 0.9);
    }

    // 7번째 불가사의 선점 보너스
    const { Engine } = getModules();
    if (Engine.getTotalBuiltWonders(state) === 6) {
      value += 4.5;
    }

    const oppHasEconomy = Cost.hasToken(opp, 'pt_economy');
    value -= costInfo.totalCoins * 0.85 + (oppHasEconomy ? costInfo.tradeCoins * 0.7 : 0);
    return value;
  }

  function chooseTurnAction(state) {
    const { Cost, Engine } = getModules();
    const pIdx = state.currentPlayer;
    const player = state.players[pIdx];
    const opp = state.players[1 - pIdx];
    const availableSlots = Engine.getAvailableSlots(state);
    const totalBuiltWonders = Engine.getTotalBuiltWonders(state);
    const discardGain = Cost.getDiscardValue(player);

    const candidates = [];

    for (const slot of availableSlots) {
      const card = slot.card;
      const denial = estimateDenialBonus(state, pIdx, card);

      // 이 카드를 가져갔을 때 새로 열리는 뒷면 카드 수에 따른 소폭 리스크 조정
      let newlyUncoveredCount = 0;
      for (const other of state.pyramid) {
        if (!other.removed && other.coveredBy.includes(slot.slotIndex)) {
          const remainingBlockers = other.coveredBy.filter(
            (idx) => idx !== slot.slotIndex && !state.pyramid[idx].removed
          );
          if (remainingBlockers.length === 0) newlyUncoveredCount += 1;
        }
      }
      const exposePenalty = newlyUncoveredCount * (state.age === 3 ? 1.5 : 0.8);

      // 1) 건물 건설
      const buildCost = Cost.calculateCardCost(player, opp, card);
      if (buildCost.affordable) {
        const buildScore = evaluateCardStrategicValue(state, pIdx, card, buildCost);
        const total = buildScore >= 5000 ? buildScore : buildScore + denial * 0.35 - exposePenalty;
        candidates.push({
          action: { type: 'BUILD', slotIndex: slot.slotIndex },
          score: total,
        });
      }

      // 2) 불가사의 건설
      if (totalBuiltWonders < 7) {
        for (const wonder of player.wonders) {
          if (wonder.built || wonder.removed) continue;
          const wCost = Cost.calculateWonderCost(player, opp, wonder);
          if (wCost.affordable) {
            const wScore = evaluateWonderBuild(state, pIdx, wonder, wCost);
            const hasExtraTurn = (wonder.effect && wonder.effect.extraTurn) || Cost.hasToken(player, 'pt_theology');
            const total = wScore >= 5000
              ? wScore
              : wScore + denial * 0.35 - (hasExtraTurn ? 0 : exposePenalty);
            candidates.push({
              action: { type: 'WONDER', slotIndex: slot.slotIndex, wonderId: wonder.id },
              score: total,
            });
          }
        }
      }

      // 3) 카드 버리기
      const discardScore = discardGain * 0.85 + denial * 0.45 - exposePenalty - (card.color === 'purple' ? 1.5 : 0);
      candidates.push({
        action: { type: 'DISCARD', slotIndex: slot.slotIndex },
        score: discardScore,
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].action;
  }

  function choosePendingAction(state) {
    const { Cost, Tokens } = getModules();
    const pending = state.pendingAction;
    if (!pending) return null;

    if (pending.type === 'PICK_PROGRESS_TOKEN') {
      let bestId = pending.choices[0];
      let bestScore = -Infinity;
      for (const id of pending.choices) {
        const token = Tokens.TOKENS_BY_ID[id];
        const score = evaluateProgressToken(token, state, pending.playerIndex);
        if (score > bestScore) {
          bestScore = score;
          bestId = id;
        }
      }
      return { tokenId: bestId };
    }

    if (pending.type === 'DESTROY_OPPONENT_CARD') {
      const target = state.players[pending.targetIndex];
      const self = state.players[pending.playerIndex];
      const selfProd = Cost.getPlayerProduction(self);

      let bestCardId = pending.eligibleCardIds[0];
      let bestImpact = -Infinity;

      for (const cardId of pending.eligibleCardIds) {
        const card = target.cards.find((c) => c.id === cardId);
        let impact = 0;
        if (card.effect && card.effect.resources) {
          for (const [res, amt] of Object.entries(card.effect.resources)) {
            // 생산량 2개짜리이거나 내가 부족한 자원을 상대가 독점할 때 우선 파괴
            const myHave = selfProd.fixed[res] || 0;
            impact += amt * (myHave === 0 ? 5 : 3);
          }
        }
        if (impact > bestImpact) {
          bestImpact = impact;
          bestCardId = cardId;
        }
      }
      return { cardId: bestCardId };
    }

    if (pending.type === 'BUILD_FROM_DISCARD') {
      let bestCardId = state.discardPile[0].id;
      let bestScore = -Infinity;
      for (const card of state.discardPile) {
        const score = evaluateCardStrategicValue(state, pending.playerIndex, card, null);
        if (score > bestScore) {
          bestScore = score;
          bestCardId = card.id;
        }
      }
      return { cardId: bestCardId };
    }

    return null;
  }

  function chooseAgeStarter(state) {
    const { Engine } = getModules();
    const pIdx = state.starterChooser;
    const available = Engine.getAvailableSlots(state);
    // 1순위 노출 카드 중 매력적인 무료/즉시 카드가 있으면 선공, 아니면 후공 선택
    let maxVal = 0;
    for (const slot of available) {
      if (!slot.faceUp) continue;
      const val = evaluateCardStrategicValue(state, pIdx, slot.card, null);
      if (val > maxVal) maxVal = val;
    }
    return maxVal >= 12 ? pIdx : 1 - pIdx;
  }

  SWDuel.AI = {
    chooseDraftWonder,
    chooseTurnAction,
    choosePendingAction,
    chooseAgeStarter,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SWDuel.AI;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
