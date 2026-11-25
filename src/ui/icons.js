/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) SVG 아이콘 및 배지 유틸리티
 */
(function (root) {
  const SWDuel = (root.SWDuel = root.SWDuel || {});

  const RESOURCE_META = {
    wood: { label: '목재', color: '#5b3a1e', bg: '#d7b48b', short: '목' },
    clay: { label: '점토', color: '#9c3e26', bg: '#e8a28c', short: '점' },
    stone: { label: '석재', color: '#4d5561', bg: '#cfd5de', short: '석' },
    glass: { label: '유리', color: '#1b6f8a', bg: '#a6e0f0', short: '유' },
    papyrus: { label: '파피루스', color: '#8f6b18', bg: '#f2dea3', short: '파' },
  };

  const SCIENCE_META = {
    wheel: { label: '바퀴', symbol: '☸' },
    mortar: { label: '절구', symbol: '⚗' },
    quill: { label: '깃펜', symbol: '✒' },
    plumb: { label: '측량추', symbol: '📐' },
    globe: { label: '혼천의', symbol: '🌐' },
    sundial: { label: '해시계', symbol: '☀' },
    law: { label: '법률', symbol: '⚖' },
  };

  const CHAIN_META = {
    mask: { label: '가면', symbol: '🎭' },
    moon: { label: '달', symbol: '🌙' },
    drop: { label: '물방울', symbol: '💧' },
    vase: { label: '주전자', symbol: '🏺' },
    horseshoe: { label: '말굽', symbol: '🧲' },
    sword: { label: '검', symbol: '⚔' },
    tower: { label: '탑', symbol: '🗼' },
    book: { label: '책', symbol: '📖' },
    gear: { label: '톱니', symbol: '⚙' },
    pillar: { label: '기둥', symbol: '🏛' },
    sun: { label: '태양', symbol: '☀' },
    capitol: { label: '신전', symbol: '⛩' },
    barrel: { label: '오크통', symbol: '🛢' },
    target: { label: '과녁', symbol: '🎯' },
    helmet: { label: '투구', symbol: '🪖' },
    lamp: { label: '등불', symbol: '🪔' },
    harp: { label: '하프', symbol: '🎵' },
  };

  function resourcePill(res, count = 1) {
    const m = RESOURCE_META[res];
    if (!m) return '';
    return `<span class="res-pill res-${res}" title="${m.label} ${count}">${m.short}${count > 1 ? `×${count}` : ''}</span>`;
  }

  function renderCostPills(cost) {
    if (!cost) return '<span class="cost-free">무료</span>';
    const parts = [];
    if (cost.coins) {
      parts.push(`<span class="coin-pill" title="코인 ${cost.coins}원">${cost.coins}원</span>`);
    }
    for (const res of ['wood', 'clay', 'stone', 'glass', 'papyrus']) {
      if (cost[res]) {
        for (let i = 0; i < cost[res]; i++) {
          parts.push(resourcePill(res, 1));
        }
      }
    }
    return parts.length ? parts.join('') : '<span class="cost-free">무료</span>';
  }

  function scienceBadge(sym, count = 1) {
    const m = SCIENCE_META[sym] || { label: sym, symbol: '?' };
    return `<span class="sci-badge" title="${m.label}">${m.symbol}${count > 1 ? `<small>×${count}</small>` : ''}</span>`;
  }

  function chainBadge(chainKey, direction = 'out') {
    const m = CHAIN_META[chainKey] || { label: chainKey, symbol: '🔗' };
    const dirLabel = direction === 'in' ? '선행 연쇄' : '후속 연쇄';
    return `<span class="chain-badge chain-${direction}" title="${dirLabel}: ${m.label}">${m.symbol}</span>`;
  }

  SWDuel.Icons = {
    RESOURCE_META,
    SCIENCE_META,
    CHAIN_META,
    resourcePill,
    renderCostPills,
    scienceBadge,
    chainBadge,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
