/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) 비용·교역·할인·연쇄·점수 계산 순수 모듈
 */
(function (root) {
  const SWDuel = (root.SWDuel = root.SWDuel || {});

  const RAW_RESOURCES = ['wood', 'clay', 'stone'];
  const MFG_RESOURCES = ['glass', 'papyrus'];
  const ALL_RESOURCES = [...RAW_RESOURCES, ...MFG_RESOURCES];

  function hasToken(player, tokenId) {
    return player.tokens.some((t) => t.id === tokenId);
  }

  function countCardsByColor(player, colors) {
    const colorSet = Array.isArray(colors) ? colors : [colors];
    return player.cards.filter((c) => colorSet.includes(c.color)).length;
  }

  function getPlayerProduction(player) {
    const fixed = { wood: 0, clay: 0, stone: 0, glass: 0, papyrus: 0 };
    const brownGray = { wood: 0, clay: 0, stone: 0, glass: 0, papyrus: 0 };
    let flexRaw = 0;
    let flexMfg = 0;
    const tradeDiscounts = new Set();
    const chains = new Set();

    for (const card of player.cards) {
      const e = card.effect || {};
      if (e.resources) {
        for (const [res, amt] of Object.entries(e.resources)) {
          fixed[res] += amt;
          if (card.color === 'brown' || card.color === 'gray') {
            brownGray[res] += amt;
          }
        }
      }
      if (e.flexResources) {
        if (e.flexResources.includes('wood')) flexRaw += 1;
        else flexMfg += 1;
      }
      if (e.tradeDiscount) {
        for (const res of e.tradeDiscount) tradeDiscounts.add(res);
      }
      if (card.chainOut) {
        chains.add(card.chainOut);
      }
    }

    for (const w of player.wonders) {
      if (!w.built) continue;
      const e = w.effect || {};
      if (e.flexResources) {
        if (e.flexResources.includes('wood')) flexRaw += 1;
        else flexMfg += 1;
      }
    }

    return {
      fixed,
      brownGray,
      flexRaw,
      flexMfg,
      tradeDiscounts,
      chains,
    };
  }

  function getTradeUnitPrice(playerProd, opponentProd, res) {
    if (playerProd.tradeDiscounts.has(res)) return 1;
    return 2 + (opponentProd.brownGray[res] || 0);
  }

  function calculateResourceTrade(player, opponent, costObj, discountUnits = 0) {
    const playerProd = getPlayerProduction(player);
    const oppProd = getPlayerProduction(opponent);

    const missingRawUnits = [];
    for (const res of RAW_RESOURCES) {
      const need = costObj[res] || 0;
      const have = playerProd.fixed[res] || 0;
      const deficit = Math.max(0, need - have);
      const price = getTradeUnitPrice(playerProd, oppProd, res);
      for (let i = 0; i < deficit; i++) {
        missingRawUnits.push({ res, price });
      }
    }

    const missingMfgUnits = [];
    for (const res of MFG_RESOURCES) {
      const need = costObj[res] || 0;
      const have = playerProd.fixed[res] || 0;
      const deficit = Math.max(0, need - have);
      const price = getTradeUnitPrice(playerProd, oppProd, res);
      for (let i = 0; i < deficit; i++) {
        missingMfgUnits.push({ res, price });
      }
    }

    // 유동 자원 생산은 단가가 가장 비싼 부족 자원에 배정하는 것이 항상 최적
    missingRawUnits.sort((a, b) => b.price - a.price);
    const afterFlexRaw = missingRawUnits.slice(playerProd.flexRaw);

    missingMfgUnits.sort((a, b) => b.price - a.price);
    const afterFlexMfg = missingMfgUnits.slice(playerProd.flexMfg);

    const remaining = [...afterFlexRaw, ...afterFlexMfg];
    remaining.sort((a, b) => b.price - a.price);

    const waived = remaining.slice(0, discountUnits);
    const paidUnits = remaining.slice(discountUnits);

    const tradeCoins = paidUnits.reduce((sum, u) => sum + u.price, 0);
    const breakdown = {};
    for (const u of paidUnits) {
      if (!breakdown[u.res]) breakdown[u.res] = { count: 0, unitPrice: u.price };
      breakdown[u.res].count += 1;
    }

    return {
      tradeCoins,
      paidUnits,
      waivedUnits: waived,
      breakdown,
    };
  }

  function calculateCardCost(player, opponent, card) {
    const prod = getPlayerProduction(player);
    if (card.chainIn && prod.chains.has(card.chainIn)) {
      return {
        affordable: true,
        isFreeChain: true,
        baseCoins: 0,
        tradeCoins: 0,
        totalCoins: 0,
        discountApplied: 0,
        urbanismBonus: hasToken(player, 'pt_urbanism') ? 4 : 0,
        tradeBreakdown: {},
      };
    }

    const baseCoins = (card.cost && card.cost.coins) || 0;
    const discountUnits = card.color === 'blue' && hasToken(player, 'pt_masonry') ? 2 : 0;
    const trade = calculateResourceTrade(player, opponent, card.cost || {}, discountUnits);
    const totalCoins = baseCoins + trade.tradeCoins;

    return {
      affordable: player.coins >= totalCoins,
      isFreeChain: false,
      baseCoins,
      tradeCoins: trade.tradeCoins,
      totalCoins,
      discountApplied: trade.waivedUnits.length,
      urbanismBonus: 0,
      tradeBreakdown: trade.breakdown,
    };
  }

  function calculateWonderCost(player, opponent, wonder) {
    const discountUnits = hasToken(player, 'pt_architecture') ? 2 : 0;
    const trade = calculateResourceTrade(player, opponent, wonder.cost || {}, discountUnits);
    const totalCoins = trade.tradeCoins;
    return {
      affordable: player.coins >= totalCoins,
      baseCoins: 0,
      tradeCoins: trade.tradeCoins,
      totalCoins,
      discountApplied: trade.waivedUnits.length,
      tradeBreakdown: trade.breakdown,
    };
  }

  function getDiscardValue(player) {
    return 2 + countCardsByColor(player, 'yellow');
  }

  function getScienceSymbols(player) {
    const counts = {};
    for (const card of player.cards) {
      const sym = card.effect && card.effect.science;
      if (sym) counts[sym] = (counts[sym] || 0) + 1;
    }
    if (hasToken(player, 'pt_law')) {
      counts.law = (counts.law || 0) + 1;
    }
    return counts;
  }

  function getUniqueScienceCount(player) {
    return Object.keys(getScienceSymbols(player)).length;
  }

  function getMilitaryZoneVp(militaryPos, playerIndex) {
    // militaryPos > 0 이면 P0(Index 0) 우세, < 0 이면 P1(Index 1) 우세
    const lead = playerIndex === 0 ? militaryPos : -militaryPos;
    if (lead <= 0) return 0;
    if (lead <= 2) return 2;
    if (lead <= 5) return 5;
    return 10;
  }

  function computeGuildVpForCard(card, players) {
    const g = card.effect && card.effect.guild;
    if (!g) return 0;
    if (g.type === 'color') {
      const maxCount = Math.max(
        countCardsByColor(players[0], g.colors),
        countCardsByColor(players[1], g.colors)
      );
      return maxCount * g.vpPer;
    }
    if (g.type === 'wonders') {
      const maxWonders = Math.max(
        players[0].wonders.filter((w) => w.built).length,
        players[1].wonders.filter((w) => w.built).length
      );
      return maxWonders * g.vpPer;
    }
    if (g.type === 'coins') {
      const maxCoins = Math.max(players[0].coins, players[1].coins);
      return Math.floor(maxCoins / g.step) * g.vpPer;
    }
    return 0;
  }

  function computePlayerScore(state, playerIndex) {
    const player = state.players[playerIndex];
    let blueVp = 0;
    let greenVp = 0;
    let yellowVp = 0;
    let guildVp = 0;

    for (const card of player.cards) {
      const vp = (card.effect && card.effect.vp) || 0;
      if (card.color === 'blue') blueVp += vp;
      else if (card.color === 'green') greenVp += vp;
      else if (card.color === 'yellow') yellowVp += vp;
      else if (card.color === 'purple') guildVp += computeGuildVpForCard(card, state.players);
    }

    let wonderVp = 0;
    for (const w of player.wonders) {
      if (w.built) wonderVp += (w.effect && w.effect.vp) || 0;
    }

    let tokenVp = 0;
    for (const t of player.tokens) {
      if (t.effect.vp) tokenVp += t.effect.vp;
      if (t.effect.vpPerToken) tokenVp += t.effect.vpPerToken * player.tokens.length;
    }

    const militaryVp = getMilitaryZoneVp(state.militaryPos, playerIndex);
    const coinVp = Math.floor(player.coins / 3);
    const total = blueVp + greenVp + yellowVp + guildVp + wonderVp + tokenVp + militaryVp + coinVp;

    return {
      blueVp,
      greenVp,
      yellowVp,
      guildVp,
      wonderVp,
      tokenVp,
      militaryVp,
      coinVp,
      total,
    };
  }

  function computeScores(state) {
    return [computePlayerScore(state, 0), computePlayerScore(state, 1)];
  }

  SWDuel.Cost = {
    RAW_RESOURCES,
    MFG_RESOURCES,
    ALL_RESOURCES,
    hasToken,
    countCardsByColor,
    getPlayerProduction,
    getTradeUnitPrice,
    calculateResourceTrade,
    calculateCardCost,
    calculateWonderCost,
    getDiscardValue,
    getScienceSymbols,
    getUniqueScienceCount,
    getMilitaryZoneVp,
    computeGuildVpForCard,
    computePlayerScore,
    computeScores,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SWDuel.Cost;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
