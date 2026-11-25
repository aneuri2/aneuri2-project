/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) BGA 스타일 UI 렌더러
 */
(function (root) {
  const SWDuel = (root.SWDuel = root.SWDuel || {});

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderCardEffectMain(card) {
    const { Cards, Icons } = SWDuel;
    const e = card.effect || {};
    const parts = [];
    if (e.resources) {
      for (const [res, amt] of Object.entries(e.resources)) {
        for (let i = 0; i < amt; i++) parts.push(Icons.resourcePill(res, 1));
      }
    }
    if (e.flexResources) {
      parts.push(
        `<span class="eff-flex">${e.flexResources.map((r) => Icons.RESOURCE_META[r].short).join('/')} 택1</span>`
      );
    }
    if (e.tradeDiscount) {
      parts.push(
        `<span class="eff-trade">${e.tradeDiscount.map((r) => Icons.RESOURCE_META[r].short).join('·')} 1원교역</span>`
      );
    }
    if (e.coins) parts.push(`<span class="eff-coin">+${e.coins}원</span>`);
    if (e.coinsPerColor) {
      const cName = { brown: '갈', gray: '회', red: '빨', yellow: '노' }[e.coinsPerColor.color];
      parts.push(`<span class="eff-coin">${cName}×${e.coinsPerColor.amount}원</span>`);
    }
    if (e.coinsPerWonder) parts.push(`<span class="eff-coin">불가×${e.coinsPerWonder}원</span>`);
    if (e.shields) parts.push(`<span class="eff-shield">⚔+${e.shields}</span>`);
    if (e.science) parts.push(Icons.scienceBadge(e.science));
    if (e.vp) parts.push(`<span class="eff-vp">🏆${e.vp}</span>`);
    if (e.guild) {
      parts.push(`<span class="eff-guild">${escapeHtml(e.guild.desc)}</span>`);
    }
    return parts.join(' ') || escapeHtml(Cards.describeCardEffect(card));
  }

  function renderCostBadge(costInfo, viewerIsCurrent) {
    if (!viewerIsCurrent || !costInfo) return '';
    if (costInfo.isFreeChain) {
      const bonus = costInfo.urbanismBonus ? ` +${costInfo.urbanismBonus}원` : '';
      return `<div class="live-badge badge-chain" title="연쇄 무료 건설 가능">연쇄 무료${bonus}</div>`;
    }
    if (costInfo.affordable) {
      const cls = costInfo.totalCoins === 0 ? 'badge-free' : 'badge-ok';
      const label = costInfo.totalCoins === 0 ? '건설 무료' : `건설 ${costInfo.totalCoins}원`;
      const title =
        costInfo.tradeCoins > 0
          ? `기본 ${costInfo.baseCoins}원 + 교역 ${costInfo.tradeCoins}원`
          : `기본 ${costInfo.baseCoins}원`;
      return `<div class="live-badge ${cls}" title="${title}">${label}</div>`;
    }
    return `<div class="live-badge badge-no" title="필요 코인 ${costInfo.totalCoins}원 (교역 ${costInfo.tradeCoins}원 포함)">부족 ${costInfo.totalCoins}원</div>`;
  }

  function renderPyramid(state, uiState) {
    const { Engine, Cost, Icons, Cards } = SWDuel;
    if (state.phase === 'WONDER_DRAFT') {
      return '<div class="pyramid-placeholder">불가사의 드래프트가 완료되면 피라미드가 배치됩니다.</div>';
    }

    const availableSet = new Set(Engine.getAvailableSlots(state).map((s) => s.slotIndex));
    const pIdx = state.currentPlayer;
    const activePlayer = state.players[pIdx];
    const oppPlayer = state.players[1 - pIdx];
    const viewerCanAct = state.phase === 'PLAYING' && !state.pendingAction && !activePlayer.isAI;

    const maxRow = Math.max(...state.pyramid.map((s) => s.row));
    const maxCol = Math.max(...state.pyramid.map((s) => s.col));
    const minCol = Math.min(...state.pyramid.map((s) => s.col));
    const spanCols = maxCol - minCol + 2; // 반칸 단위 전체 너비

    const cardsHtml = state.pyramid
      .map((slot) => {
        if (slot.removed) return '';
        const isOpen = availableSet.has(slot.slotIndex);
        const isSelected = uiState.selectedSlot === slot.slotIndex;
        const leftPct = ((slot.col - minCol) / spanCols) * 100;
        const widthPct = (1.85 / spanCols) * 100;
        const topPct = (slot.row / (maxRow + 1.15)) * 100;

        if (!slot.faceUp) {
          const backType = slot.card.isGuild ? 'guild' : `age${state.age}`;
          const backLabel = slot.card.isGuild ? '길드' : ['', 'I', 'II', 'III'][state.age];
          return `
            <div class="pyr-slot card-back back-${backType}"
              style="left:${leftPct}%; top:${topPct}%; width:${widthPct}%;">
              <div class="card-back-inner">
                <span class="back-emblem">${backLabel}</span>
              </div>
            </div>
          `;
        }

        const card = slot.card;
        const costInfo = isOpen ? Cost.calculateCardCost(activePlayer, oppPlayer, card) : null;
        const tooltip = `${card.name} (${Cards.COLOR_LABELS[card.color]}) - ${Cards.describeCardEffect(card)}`;

        return `
          <div class="pyr-slot card-front color-${card.color} ${isOpen ? 'is-open' : 'is-blocked'} ${isSelected ? 'is-selected' : ''} ${viewerCanAct && isOpen ? 'is-clickable' : ''}"
            data-slot="${slot.slotIndex}"
            title="${escapeHtml(tooltip)}"
            style="left:${leftPct}%; top:${topPct}%; width:${widthPct}%;">
            <div class="card-header">
              <span class="card-cost">${Icons.renderCostPills(card.cost)}</span>
              <span class="card-chains">
                ${card.chainIn ? Icons.chainBadge(card.chainIn, 'in') : ''}
                ${card.chainOut ? Icons.chainBadge(card.chainOut, 'out') : ''}
              </span>
            </div>
            <div class="card-name">${escapeHtml(card.name)}</div>
            <div class="card-effect-box">${renderCardEffectMain(card)}</div>
            ${isOpen ? renderCostBadge(costInfo, true) : ''}
          </div>
        `;
      })
      .join('');

    return `
      <div class="pyramid-canvas age-${state.age}">
        ${cardsHtml}
      </div>
    `;
  }

  function renderMilitaryAndTokens(state) {
    const pos = state.militaryPos;
    const cells = [];
    for (let i = -9; i <= 9; i++) {
      const isPawn = i === pos;
      let cellClass = 'mil-cell';
      if (i === 0) cellClass += ' mil-center';
      else if (Math.abs(i) === 9) cellClass += ' mil-capital';
      else if (Math.abs(i) >= 6) cellClass += ' mil-zone-10';
      else if (Math.abs(i) >= 3) cellClass += ' mil-zone-5';
      else cellClass += ' mil-zone-2';

      let badge = '';
      if (i === -9) badge = 'P1 수도';
      else if (i === 9) badge = 'P2 수도';
      else if (i === -6) badge = state.looted[0].tier2 ? '✕5' : '-5원';
      else if (i === -3) badge = state.looted[0].tier1 ? '✕2' : '-2원';
      else if (i === 3) badge = state.looted[1].tier1 ? '✕2' : '-2원';
      else if (i === 6) badge = state.looted[1].tier2 ? '✕5' : '-5원';
      else if (i === 0) badge = '0';

      const lootUsed =
        (i === -6 && state.looted[0].tier2) ||
        (i === -3 && state.looted[0].tier1) ||
        (i === 3 && state.looted[1].tier1) ||
        (i === 6 && state.looted[1].tier2);

      cells.push(`
        <div class="${cellClass} ${isPawn ? 'has-pawn' : ''} ${lootUsed ? 'loot-used' : ''}" title="군사 위치 ${i}">
          <span class="mil-label">${badge}</span>
          ${isPawn ? '<span class="conflict-pawn" title="분쟁 말">⚔️</span>' : ''}
        </div>
      `);
    }

    const tokensHtml = state.boardTokens
      .map(
        (t) => `
      <div class="progress-token" title="${escapeHtml(t.name)}: ${escapeHtml(t.desc)}">
        <div class="pt-name">${escapeHtml(t.name)}</div>
        <div class="pt-desc">${escapeHtml(t.desc)}</div>
      </div>
    `
      )
      .join('');

    return `
      <div class="center-strip">
        <div class="military-box">
          <div class="strip-title">
            <span>군사 트랙 <small>(← ${escapeHtml(state.players[1].name)} 우세 | ${escapeHtml(state.players[0].name)} 우세 →)</small></span>
            <span class="mil-status">현재 위치: <strong>${pos > 0 ? `+${pos} (P1)` : pos < 0 ? `${pos} (P2)` : '0 (균형)'}</strong></span>
          </div>
          <div class="military-track">${cells.join('')}</div>
          <div class="mil-vp-legend">
            <span>수도 즉시승리</span><span>10점</span><span>5점</span><span>2점</span><span>0</span><span>2점</span><span>5점</span><span>10점</span><span>수도 즉시승리</span>
          </div>
        </div>
        <div class="tokens-box">
          <div class="strip-title">
            <span>진보 토큰 (${state.boardTokens.length}개 남음)</span>
            <button class="btn-mini" data-action="view-discard">버림 더미 (${state.discardPile.length}장)</button>
          </div>
          <div class="progress-tokens-row">
            ${tokensHtml || '<span class="muted">보드 위의 진보 토큰이 모두 획득되었습니다.</span>'}
          </div>
        </div>
      </div>
    `;
  }

  function renderPlayerPanel(state, playerIndex, isOpponentTop) {
    const { Cost, Icons, Cards } = SWDuel;
    const player = state.players[playerIndex];
    const opp = state.players[1 - playerIndex];
    const isCurrent = state.currentPlayer === playerIndex && state.phase !== 'GAME_OVER';
    const prod = Cost.getPlayerProduction(player);
    const oppProd = Cost.getPlayerProduction(opp);
    const sciSyms = Cost.getScienceSymbols(player);
    const sciUnique = Object.keys(sciSyms).length;
    const milVp = Cost.getMilitaryZoneVp(state.militaryPos, playerIndex);

    // 색상별 카드 그룹핑
    const colorOrder = ['brown', 'gray', 'yellow', 'red', 'green', 'blue', 'purple'];
    const groupedHtml = colorOrder
      .map((color) => {
        const cards = player.cards.filter((c) => c.color === color);
        if (cards.length === 0) return '';
        const chips = cards
          .map(
            (c) => `
          <span class="city-chip color-${c.color}" title="${escapeHtml(c.name)}: ${escapeHtml(Cards.describeCardEffect(c))}">
            ${escapeHtml(c.name)}${c.chainOut ? ` ${Icons.CHAIN_META[c.chainOut].symbol}` : ''}
          </span>
        `
          )
          .join('');
        return `<div class="city-stack"><span class="stack-count badge-${color}">${cards.length}</span>${chips}</div>`;
      })
      .filter(Boolean)
      .join('');

    // 불가사의 목록
    const wondersHtml = player.wonders
      .map((w) => {
        const wCost = !w.built && !w.removed ? Cost.calculateWonderCost(player, opp, w) : null;
        const statusLabel = w.built
          ? `건설 완료 (${w.builtCardAge}시대)`
          : w.removed
            ? '7개 제한으로 제거'
            : wCost.affordable
              ? `건설 가능 (${wCost.totalCoins}원)`
              : `필요 ${wCost.totalCoins}원`;
        return `
          <div class="wonder-mini ${w.built ? 'w-built' : w.removed ? 'w-removed' : 'w-unbuilt'}" title="${escapeHtml(w.desc)}">
            <div class="w-top">
              <span class="w-name">${escapeHtml(w.name)}</span>
              <span class="w-vp">${w.effect.vp ? `🏆${w.effect.vp}` : ''}</span>
            </div>
            <div class="w-cost">${Icons.renderCostPills(w.cost)}</div>
            <div class="w-desc">${escapeHtml(w.desc)}</div>
            <div class="w-status">${statusLabel}</div>
          </div>
        `;
      })
      .join('');

    // 교역 단가 요약
    const tradePrices = ['wood', 'clay', 'stone', 'glass', 'papyrus']
      .map((r) => {
        const price = Cost.getTradeUnitPrice(prod, oppProd, r);
        return `<span class="trade-chip ${price === 1 ? 'discounted' : ''}" title="${Icons.RESOURCE_META[r].label} 교역 비용">${Icons.RESOURCE_META[r].short}:${price}원</span>`;
      })
      .join('');

    const sciHtml = Object.entries(sciSyms)
      .map(([sym, cnt]) => Icons.scienceBadge(sym, cnt))
      .join('');

    const tokensHtml = player.tokens
      .map((t) => `<span class="owned-token" title="${escapeHtml(t.desc)}">${escapeHtml(t.name)}</span>`)
      .join('');

    return `
      <section class="player-panel ${isOpponentTop ? 'panel-top' : 'panel-bottom'} ${isCurrent ? 'is-turn' : ''}">
        <div class="player-header">
          <div class="player-identity">
            <span class="turn-dot"></span>
            <h3>${escapeHtml(player.name)}</h3>
            ${player.isAI ? '<span class="ai-tag">AI</span>' : ''}
            ${isCurrent ? '<span class="active-turn-pill">현재 차례</span>' : ''}
          </div>
          <div class="player-stats">
            <span class="stat-pill stat-coin" title="보유 코인">🪙 <strong>${player.coins}원</strong></span>
            <span class="stat-pill stat-mil" title="군사 영역 점수">⚔️ 우세 ${milVp}점</span>
            <span class="stat-pill stat-sci" title="수집한 고유 과학 기호">🧪 ${sciUnique}/6 ${sciHtml}</span>
            <span class="stat-pill stat-trade" title="부족 자원 1개당 교역 단가">${tradePrices}</span>
          </div>
        </div>

        ${tokensHtml ? `<div class="owned-tokens-bar">보유 진보 토큰: ${tokensHtml}</div>` : ''}

        <div class="player-body">
          <div class="city-area">
            <div class="area-subtitle">건설된 건물 (${player.cards.length}장)</div>
            <div class="city-stacks">${groupedHtml || '<span class="muted">아직 건설된 건물이 없습니다.</span>'}</div>
          </div>
          <div class="wonders-area">
            <div class="area-subtitle">불가사의 (${player.wonders.filter((w) => w.built).length}/${player.wonders.length})</div>
            <div class="wonders-grid">${wondersHtml}</div>
          </div>
        </div>
      </section>
    `;
  }

  function renderActionDock(state, uiState) {
    if (state.phase !== 'PLAYING' || state.pendingAction) return '';
    const pIdx = state.currentPlayer;
    const player = state.players[pIdx];
    if (player.isAI) {
      return `<div class="action-dock ai-thinking">🤖 ${escapeHtml(player.name)}이(가) 최선의 수를 계산하고 있습니다...</div>`;
    }

    const { Engine, Cost, Cards, Icons } = SWDuel;
    if (uiState.selectedSlot === null || uiState.selectedSlot === undefined) {
      return `<div class="action-dock dock-hint">피라미드에서 밝게 표시된 카드를 클릭하여 <strong>건설 / 버리기 / 불가사의 건설</strong>을 선택하세요.</div>`;
    }

    const slot = state.pyramid.find((s) => s.slotIndex === uiState.selectedSlot);
    if (!slot || !Engine.isSlotAvailable(state.pyramid, slot)) {
      return `<div class="action-dock dock-hint">선택 가능한 카드를 클릭하세요.</div>`;
    }

    const opp = state.players[1 - pIdx];
    const card = slot.card;
    const costInfo = Cost.calculateCardCost(player, opp, card);
    const discardGain = Cost.getDiscardValue(player);
    const totalBuilt = Engine.getTotalBuiltWonders(state);
    const oppHasEconomy = Cost.hasToken(opp, 'pt_economy');

    const tradeDetails = Object.entries(costInfo.tradeBreakdown || {})
      .map(([res, info]) => `${Icons.RESOURCE_META[res].label} ${info.count}개×${info.unitPrice}원`)
      .join(', ');

    const buildBtnLabel = costInfo.isFreeChain
      ? `연쇄 무료 건설${costInfo.urbanismBonus ? ` (+${costInfo.urbanismBonus}원)` : ''}`
      : costInfo.affordable
        ? `건물 건설 (${costInfo.totalCoins === 0 ? '무료' : `${costInfo.totalCoins}원`})`
        : `건설 불가 (${costInfo.totalCoins}원 필요)`;

    const wondersBtns = player.wonders
      .filter((w) => !w.built && !w.removed)
      .map((w) => {
        const wCost = Cost.calculateWonderCost(player, opp, w);
        const disabled = totalBuilt >= 7 || !wCost.affordable;
        return `
          <button class="btn-wonder-act" data-action="build-wonder" data-slot="${slot.slotIndex}" data-wonder="${w.id}" ${disabled ? 'disabled' : ''}>
            <span class="bw-name">${escapeHtml(w.name)}</span>
            <span class="bw-cost">${totalBuilt >= 7 ? '7개 제한' : wCost.affordable ? (wCost.totalCoins === 0 ? '무료' : `${wCost.totalCoins}원`) : `부족(${wCost.totalCoins}원)`}</span>
          </button>
        `;
      })
      .join('');

    return `
      <div class="action-dock dock-active">
        <div class="dock-card-info">
          <div class="dock-title">
            <span class="color-dot color-${card.color}"></span>
            <strong>${escapeHtml(card.name)}</strong>
            <span class="dock-effect">${escapeHtml(Cards.describeCardEffect(card))}</span>
          </div>
          <div class="dock-breakdown">
            ${
              costInfo.isFreeChain
                ? '연쇄 건설 기호 충족으로 무료 건설됩니다.'
                : `기본 비용 ${costInfo.baseCoins}원 + 교역 비용 ${costInfo.tradeCoins}원${tradeDetails ? ` (${tradeDetails})` : ''}${costInfo.discountApplied ? ` · 진보 토큰 할인 ${costInfo.discountApplied}자원 적용` : ''}`
            }
            ${oppHasEconomy && costInfo.tradeCoins > 0 ? `<span class="econ-warn">⚠ 상대 '경제' 토큰으로 교역비 ${costInfo.tradeCoins}원이 상대에게 전달됩니다.</span>` : ''}
          </div>
        </div>
        <div class="dock-buttons">
          <button class="btn-primary" data-action="build-card" data-slot="${slot.slotIndex}" ${costInfo.affordable ? '' : 'disabled'}>
            ${buildBtnLabel}
          </button>
          <button class="btn-secondary" data-action="discard-card" data-slot="${slot.slotIndex}">
            카드 버리기 (+${discardGain}원)
          </button>
          <button class="btn-ghost" data-action="cancel-select">선택 취소</button>
        </div>
        <div class="dock-wonders">
          <span class="dw-label">이 카드로 불가사의 건설 (${totalBuilt}/7):</span>
          <div class="dw-list">${wondersBtns || '<span class="muted">건설 가능한 불가사의 없음</span>'}</div>
        </div>
      </div>
    `;
  }

  function renderGameLog(state) {
    const entries = state.log
      .slice()
      .reverse()
      .map(
        (entry) => `
      <div class="log-entry log-${entry.type}">
        <span class="log-meta">[${entry.age}시대 · T${entry.turn}]</span>
        <span class="log-msg">${escapeHtml(entry.message)}</span>
      </div>
    `
      )
      .join('');
    return `
      <aside class="log-panel">
        <div class="log-header">실시간 게임 기록 (BGA Log)</div>
        <div class="log-list">${entries}</div>
      </aside>
    `;
  }

  function renderModals(state, uiState) {
    const { Icons, Tokens, Cards } = SWDuel;

    if (uiState.showNewGameModal) {
      return `
        <div class="modal-backdrop">
          <div class="modal-box modal-sm">
            <h2>세븐 원더스 듀얼 — 새 게임</h2>
            <p class="modal-sub">보드게임 아레나(BGA) 공식 규칙 기반 완벽 구현</p>
            <div class="form-group">
              <label>게임 모드</label>
              <div class="mode-grid">
                <button class="mode-card ${uiState.newGameMode === 'ai' ? 'selected' : ''}" data-action="set-mode" data-mode="ai">
                  <strong>🤖 스마트 AI 대전</strong>
                  <small>자원·과학·군사·불가사의를 평가하는 휴리스틱 AI와 대결</small>
                </button>
                <button class="mode-card ${uiState.newGameMode === 'local' ? 'selected' : ''}" data-action="set-mode" data-mode="local">
                  <strong>👥 로컬 2인 (Hot-seat)</strong>
                  <small>한 화면에서 두 플레이어가 번갈아 플레이</small>
                </button>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" data-action="start-new-game">게임 시작</button>
              ${state ? '<button class="btn-ghost" data-action="close-new-game">닫기</button>' : ''}
            </div>
          </div>
        </div>
      `;
    }

    if (uiState.showRulesModal) {
      return `
        <div class="modal-backdrop">
          <div class="modal-box modal-lg">
            <h2>세븐 원더스 듀얼 핵심 규칙 안내</h2>
            <div class="rules-grid">
              <div><strong>승리 조건 3가지</strong><br>1) <b>군사적 패권</b>: 분쟁 말이 상대 수도(±9)에 도달 시 즉시 승리<br>2) <b>과학적 패권</b>: 서로 다른 과학 기호 6종 수집 시 즉시 승리<br>3) <b>시민 승리</b>: 3시대 종료 후 총점 비교 (동점 시 파란색 건물 점수)</div>
              <div><strong>턴 행동 3가지</strong><br>1) <b>건물 건설</b>: 자원 부족 시 부족 1개당 <code>2 + 상대 갈/회 생산량</code> 교역비 지불<br>2) <b>카드 버리기</b>: <code>2 + 내 노란색 카드 수</code> 코인 획득<br>3) <b>불가사의 건설</b>: 게임 전체 최대 7개까지 건설 가능</div>
              <div><strong>진보 토큰</strong><br>같은 과학 기호 2개를 모을 때마다 보드 위의 진보 토큰 5개 중 1개 선택</div>
              <div><strong>시대 전환</strong><br>1·2시대 종료 시 군사력이 약한 플레이어(동률 시 직전 턴 플레이어)가 다음 시대 선공 결정</div>
            </div>
            <div class="modal-actions">
              <button class="btn-primary" data-action="close-rules">확인</button>
            </div>
          </div>
        </div>
      `;
    }

    if (uiState.showDiscardModal) {
      const cardsHtml = state.discardPile
        .map(
          (c) => `
        <div class="modal-card-item color-${c.color}">
          <strong>${escapeHtml(c.name)}</strong> <small>(${c.age}시대)</small>
          <div>${escapeHtml(Cards.describeCardEffect(c))}</div>
        </div>
      `
        )
        .join('');
      return `
        <div class="modal-backdrop">
          <div class="modal-box modal-lg">
            <h2>버림 더미 (${state.discardPile.length}장)</h2>
            <div class="discard-grid">${cardsHtml || '<p class="muted">버려진 카드가 없습니다.</p>'}</div>
            <div class="modal-actions">
              <button class="btn-primary" data-action="close-discard">닫기</button>
            </div>
          </div>
        </div>
      `;
    }

    if (!state) return '';

    // 불가사의 드래프트 모달
    if (state.phase === 'WONDER_DRAFT') {
      const picker = state.players[state.currentPlayer];
      const stepLabels = state.draft.round === 1 ? '1차 드래프트 (순서 1-2-1)' : '2차 드래프트 (순서 2-1-2)';
      const poolHtml = state.draft.pool
        .map(
          (w) => `
        <button class="draft-wonder-card" data-action="draft-wonder" data-wonder="${w.id}" ${picker.isAI ? 'disabled' : ''}>
          <div class="dw-head">
            <strong>${escapeHtml(w.name)}</strong>
            ${w.effect.vp ? `<span class="eff-vp">🏆${w.effect.vp}</span>` : ''}
          </div>
          <div class="dw-cost">${Icons.renderCostPills(w.cost)}</div>
          <div class="dw-desc">${escapeHtml(w.desc)}</div>
        </button>
      `
        )
        .join('');

      return `
        <div class="modal-backdrop">
          <div class="modal-box modal-lg">
            <h2>불가사의 드래프트 — ${stepLabels}</h2>
            <p class="modal-sub">현재 선택 차례: <strong>${escapeHtml(picker.name)}</strong> (남은 선택지 ${state.draft.pool.length}개 · 마지막 1장은 다음 순번에게 자동 배정)</p>
            <div class="draft-summary">
              <div><strong>${escapeHtml(state.players[0].name)}</strong>: ${state.players[0].wonders.map((w) => w.name).join(', ') || '없음'}</div>
              <div><strong>${escapeHtml(state.players[1].name)}</strong>: ${state.players[1].wonders.map((w) => w.name).join(', ') || '없음'}</div>
            </div>
            <div class="draft-grid">${poolHtml}</div>
          </div>
        </div>
      `;
    }

    // 시대 선공 선택 모달
    if (state.phase === 'CHOOSE_STARTER') {
      const chooser = state.players[state.starterChooser];
      if (chooser.isAI) return '';
      return `
        <div class="modal-backdrop">
          <div class="modal-box modal-sm">
            <h2>${state.age}시대 선공 선택</h2>
            <p class="modal-sub"><strong>${escapeHtml(chooser.name)}</strong>님이 ${state.age}시대를 먼저 시작할 플레이어를 선택하세요.</p>
            <div class="modal-actions">
              <button class="btn-primary" data-action="choose-starter" data-starter="0">${escapeHtml(state.players[0].name)} 선공</button>
              <button class="btn-primary" data-action="choose-starter" data-starter="1">${escapeHtml(state.players[1].name)} 선공</button>
            </div>
          </div>
        </div>
      `;
    }

    // 대기 행동 모달 (진보 토큰 선택 / 상대 카드 파괴 / 버림 더미 건설)
    if (state.pendingAction) {
      const pa = state.pendingAction;
      const actor = state.players[pa.playerIndex];
      if (actor.isAI) return '';

      if (pa.type === 'PICK_PROGRESS_TOKEN') {
        const title = pa.source === 'great_library' ? '알렉산드리아 도서관 — 진보 토큰 1개 선택' : '과학 기호 쌍 완성 — 진보 토큰 1개 선택';
        const btns = pa.choices
          .map((id) => {
            const t = Tokens.TOKENS_BY_ID[id];
            return `
              <button class="modal-choice-btn" data-action="pick-token" data-token="${t.id}">
                <strong>${escapeHtml(t.name)}</strong>
                <span>${escapeHtml(t.desc)}</span>
              </button>
            `;
          })
          .join('');
        return `
          <div class="modal-backdrop">
            <div class="modal-box modal-md">
              <h2>${title}</h2>
              <p class="modal-sub"><strong>${escapeHtml(actor.name)}</strong>님이 획득할 진보 토큰을 선택하세요.</p>
              <div class="choice-list">${btns}</div>
            </div>
          </div>
        `;
      }

      if (pa.type === 'DESTROY_OPPONENT_CARD') {
        const target = state.players[pa.targetIndex];
        const colorName = pa.color === 'brown' ? '갈색(원자재)' : '회색(제조품)';
        const btns = pa.eligibleCardIds
          .map((id) => {
            const c = target.cards.find((card) => card.id === id);
            return `
              <button class="modal-choice-btn" data-action="destroy-card" data-card="${c.id}">
                <strong>${escapeHtml(c.name)}</strong>
                <span>${escapeHtml(Cards.describeCardEffect(c))}</span>
              </button>
            `;
          })
          .join('');
        return `
          <div class="modal-backdrop">
            <div class="modal-box modal-md">
              <h2>상대 ${colorName} 카드 파괴</h2>
              <p class="modal-sub">${escapeHtml(target.name)}의 도시에서 파괴할 카드를 선택하세요.</p>
              <div class="choice-list">${btns}</div>
            </div>
          </div>
        `;
      }

      if (pa.type === 'BUILD_FROM_DISCARD') {
        const btns = state.discardPile
          .map(
            (c) => `
          <button class="modal-choice-btn color-${c.color}" data-action="build-discard" data-card="${c.id}">
            <strong>${escapeHtml(c.name)}</strong> <small>(${c.age}시대)</small>
            <span>${escapeHtml(Cards.describeCardEffect(c))}</span>
          </button>
        `
          )
          .join('');
        return `
          <div class="modal-backdrop">
            <div class="modal-box modal-lg">
              <h2>마우솔로스의 영묘 — 버림 더미 무료 건설</h2>
              <p class="modal-sub">버림 더미에서 무료로 즉시 건설할 카드 1장을 선택하세요.</p>
              <div class="discard-grid">${btns}</div>
            </div>
          </div>
        `;
      }
    }

    // 게임 종료 점수판 모달
    if (state.phase === 'GAME_OVER' && state.result) {
      const r = state.result;
      const victoryMap = {
        military: '군사적 패권 승리 ⚔️',
        science: '과학적 패권 승리 🧪',
        civilian: '시민 승리 🏆',
      };
      const s0 = r.scores[0];
      const s1 = r.scores[1];
      const headline = r.tie
        ? '무승부!'
        : `${state.players[r.winner].name} 승리!`;

      const rows = [
        ['파란색 (시민 건물)', s0.blueVp, s1.blueVp],
        ['초록색 (과학 건물)', s0.greenVp, s1.greenVp],
        ['노란색 (상업 건물)', s0.yellowVp, s1.yellowVp],
        ['보라색 (길드)', s0.guildVp, s1.guildVp],
        ['불가사의', s0.wonderVp, s1.wonderVp],
        ['진보 토큰', s0.tokenVp, s1.tokenVp],
        ['군사 트랙', s0.militaryVp, s1.militaryVp],
        ['남은 코인 (3원당 1점)', s0.coinVp, s1.coinVp],
      ];

      return `
        <div class="modal-backdrop">
          <div class="modal-box modal-md">
            <div class="victory-banner">${victoryMap[r.victoryType]}</div>
            <h2>${escapeHtml(headline)}</h2>
            <table class="score-table">
              <thead>
                <tr>
                  <th>점수 항목</th>
                  <th>${escapeHtml(state.players[0].name)}</th>
                  <th>${escapeHtml(state.players[1].name)}</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(([label, a, b]) => `<tr><td>${label}</td><td>${a}</td><td>${b}</td></tr>`).join('')}
                <tr class="score-total">
                  <td>총점</td>
                  <td>${s0.total}점</td>
                  <td>${s1.total}점</td>
                </tr>
              </tbody>
            </table>
            <div class="modal-actions">
              <button class="btn-primary" data-action="open-new-game">다시 플레이</button>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  function renderApp(container, state, uiState) {
    if (!state) {
      container.innerHTML = renderModals(null, uiState);
      return;
    }

    const ageLabel = ['', 'I 시대', 'II 시대', 'III 시대'][state.age];
    const current = state.players[state.currentPlayer];
    const modeLabel = state.mode === 'ai' ? '스마트 AI 대전' : '로컬 2인 플레이';

    container.innerHTML = `
      <header class="top-bar">
        <div class="brand">
          <span class="brand-logo">🏛️</span>
          <div>
            <h1>세븐 원더스 듀얼 <small>7 Wonders Duel</small></h1>
          </div>
        </div>
        <div class="turn-banner">
          <span class="age-pill">${ageLabel}</span>
          <span class="turn-pill">턴 ${state.turnNumber}</span>
          <span class="current-pill">${state.phase === 'GAME_OVER' ? '게임 종료' : `${escapeHtml(current.name)}의 차례`}</span>
        </div>
        <div class="top-controls">
          <span class="mode-badge">${modeLabel}</span>
          <button class="btn-mini" data-action="open-rules">규칙 안내</button>
          <button class="btn-mini btn-accent" data-action="open-new-game">새 게임</button>
        </div>
      </header>

      <main class="arena-grid">
        <div class="arena-main">
          ${renderPlayerPanel(state, 1, true)}
          ${renderMilitaryAndTokens(state)}
          <section class="pyramid-section">
            ${renderPyramid(state, uiState)}
            ${renderActionDock(state, uiState)}
          </section>
          ${renderPlayerPanel(state, 0, false)}
        </div>
        ${renderGameLog(state)}
      </main>
      ${renderModals(state, uiState)}
    `;
  }

  SWDuel.UI = {
    renderApp,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
