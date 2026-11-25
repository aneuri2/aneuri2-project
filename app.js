/**
 * 세븐 원더스 듀얼 (7 Wonders Duel) 애플리케이션 컨트롤러
 */
(function () {
  const { Engine, AI, UI } = window.SWDuel;

  const rootEl = document.getElementById('app');

  let gameState = Engine.createInitialState({ mode: 'ai' });
  const uiState = {
    selectedSlot: null,
    showNewGameModal: true,
    newGameMode: 'ai',
    showRulesModal: false,
    showDiscardModal: false,
  };

  let aiTimer = null;

  function render() {
    UI.renderApp(rootEl, gameState, uiState);
    scheduleAIIfNeeded();
  }

  function scheduleAIIfNeeded() {
    if (aiTimer) {
      clearTimeout(aiTimer);
      aiTimer = null;
    }
    if (!gameState || uiState.showNewGameModal || gameState.phase === 'GAME_OVER') return;

    const actorIndex =
      gameState.phase === 'CHOOSE_STARTER'
        ? gameState.starterChooser
        : gameState.pendingAction
          ? gameState.pendingAction.playerIndex
          : gameState.currentPlayer;

    const actor = gameState.players[actorIndex];
    if (!actor || !actor.isAI) return;

    aiTimer = setTimeout(() => {
      aiTimer = null;
      if (!gameState || gameState.phase === 'GAME_OVER') return;

      if (gameState.phase === 'WONDER_DRAFT') {
        const wonderId = AI.chooseDraftWonder(gameState);
        gameState = Engine.draftWonder(gameState, wonderId);
      } else if (gameState.phase === 'CHOOSE_STARTER') {
        const starter = AI.chooseAgeStarter(gameState);
        gameState = Engine.chooseAgeStarter(gameState, starter);
      } else if (gameState.pendingAction) {
        const choice = AI.choosePendingAction(gameState);
        gameState = Engine.resolvePendingChoice(gameState, choice);
      } else if (gameState.phase === 'PLAYING') {
        const action = AI.chooseTurnAction(gameState);
        gameState = Engine.applyPlayerAction(gameState, action);
      }

      uiState.selectedSlot = null;
      render();
    }, 450);
  }

  function handleClick(e) {
    const slotEl = e.target.closest('[data-slot].is-clickable');
    if (slotEl) {
      const slotIndex = Number(slotEl.dataset.slot);
      uiState.selectedSlot = uiState.selectedSlot === slotIndex ? null : slotIndex;
      render();
      return;
    }

    const actionEl = e.target.closest('[data-action]');
    if (!actionEl || actionEl.disabled) return;
    const action = actionEl.dataset.action;

    switch (action) {
      case 'set-mode':
        uiState.newGameMode = actionEl.dataset.mode;
        render();
        break;

      case 'start-new-game':
        gameState = Engine.createInitialState({ mode: uiState.newGameMode });
        uiState.selectedSlot = null;
        uiState.showNewGameModal = false;
        render();
        break;

      case 'open-new-game':
        uiState.showNewGameModal = true;
        render();
        break;

      case 'close-new-game':
        uiState.showNewGameModal = false;
        render();
        break;

      case 'open-rules':
        uiState.showRulesModal = true;
        render();
        break;

      case 'close-rules':
        uiState.showRulesModal = false;
        render();
        break;

      case 'view-discard':
        uiState.showDiscardModal = true;
        render();
        break;

      case 'close-discard':
        uiState.showDiscardModal = false;
        render();
        break;

      case 'draft-wonder': {
        const wonderId = actionEl.dataset.wonder;
        gameState = Engine.draftWonder(gameState, wonderId);
        render();
        break;
      }

      case 'choose-starter': {
        const starter = Number(actionEl.dataset.starter);
        gameState = Engine.chooseAgeStarter(gameState, starter);
        uiState.selectedSlot = null;
        render();
        break;
      }

      case 'build-card': {
        const slotIndex = Number(actionEl.dataset.slot);
        gameState = Engine.applyPlayerAction(gameState, { type: 'BUILD', slotIndex });
        uiState.selectedSlot = null;
        render();
        break;
      }

      case 'discard-card': {
        const slotIndex = Number(actionEl.dataset.slot);
        gameState = Engine.applyPlayerAction(gameState, { type: 'DISCARD', slotIndex });
        uiState.selectedSlot = null;
        render();
        break;
      }

      case 'build-wonder': {
        const slotIndex = Number(actionEl.dataset.slot);
        const wonderId = actionEl.dataset.wonder;
        gameState = Engine.applyPlayerAction(gameState, { type: 'WONDER', slotIndex, wonderId });
        uiState.selectedSlot = null;
        render();
        break;
      }

      case 'cancel-select':
        uiState.selectedSlot = null;
        render();
        break;

      case 'pick-token':
        gameState = Engine.resolvePendingChoice(gameState, { tokenId: actionEl.dataset.token });
        render();
        break;

      case 'destroy-card':
        gameState = Engine.resolvePendingChoice(gameState, { cardId: actionEl.dataset.card });
        render();
        break;

      case 'build-discard':
        gameState = Engine.resolvePendingChoice(gameState, { cardId: actionEl.dataset.card });
        render();
        break;

      default:
        break;
    }
  }

  rootEl.addEventListener('click', handleClick);
  render();
})();
