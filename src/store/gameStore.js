export const initialState = {
  connected:        false,
  phase:            "wager",
  round:            1,
  balance:          1000,
  startingBalance:  1000,
  wager:            0,
  stagedWager:      0,

  // Each card: { rank, suit, value, color, symbol, hidden }
  playerHand:       [],
  dealerHand:       [],
  playerCount:      0,
  dealerCount:      0,

  shoe:             [],
  shoeIndex:        0,

  splitMode:        false,
  splitHands:       [],
  currentSplitHand: 0,

  outcome:          null,
  resultText:       null,
  showInsurance:    false,
  showSplitPrompt:  false,
  actionsLocked:    false,
  dealt:            false,
  pendingBalance:   null,

  // Session stats
  sessionWins:      0,
  sessionLosses:    0,
  sessionPushes:    0,
  sessionStart:     Date.now(),
  sessionEnded:     false,
  sessionEndedAt:   null,
};

export function gameReducer(state, action) {
  switch (action.type) {

    case "SET_CONNECTED":
      return { ...state, connected: action.payload };

    case "ADD_CHIP": {
      const next = state.stagedWager + action.payload;
      if (next > state.balance) return state;
      return { ...state, stagedWager: next };
    }
    case "CLEAR_WAGER":
      return { ...state, stagedWager: 0 };

    case "SET_WAGER":
      return { ...state, stagedWager: Math.min(action.payload, state.balance) };

    case "CONFIRM_WAGER":
      return { ...state, wager: state.stagedWager };

    case "SET_PHASE":
      return { ...state, phase: action.payload };

    case "SET_SHOE":
      return { ...state, shoe: action.payload, shoeIndex: 0 };

    case "START_ROUND":
      return {
        ...state,
        phase:            "dealing",
        playerHand:       [],
        dealerHand:       [],
        playerCount:      0,
        dealerCount:      0,
        outcome:          null,
        resultText:       null,
        splitMode:        false,
        splitHands:       [],
        currentSplitHand: 0,
        actionsLocked:    false,
        dealt:            false,
        pendingBalance:   null,
        showInsurance:    false,
        showSplitPrompt:  false,
        shoeIndex:        0,  // reset per round — tracks cards used THIS round only
      };

    case "DEAL_COMPLETE":
      return { ...state, phase: "playing", dealt: true };

    // Deal the next card from shoe to dealer (visible)
    case "DEAL_DEALER_CARD_FROM_SHOE": {
      const card = state.shoe[state.shoeIndex];
      if (!card) return state;
      return {
        ...state,
        dealerHand: [...state.dealerHand, { ...card, hidden: false }],
        shoeIndex:  state.shoeIndex + 1,
      };
    }

    // Deal the dealer hole card (face down — we know its value but hide it)
    case "DEAL_DEALER_HOLE_FROM_SHOE": {
      const card = state.shoe[state.shoeIndex];
      if (!card) return state;
      return {
        ...state,
        dealerHand: [...state.dealerHand, { ...card, hidden: true }],
        shoeIndex:  state.shoeIndex + 1,
      };
    }

    // Deal next card from shoe to player
    case "DEAL_PLAYER_CARD_FROM_SHOE": {
      const card = state.shoe[state.shoeIndex];
      if (!card) return state;
      return {
        ...state,
        playerHand: [...state.playerHand, { ...card, hidden: false }],
        shoeIndex:  state.shoeIndex + 1,
      };
    }

    // Player hits — deal next card from shoe
    case "HIT_PLAYER_FROM_SHOE": {
      const card = state.shoe[state.shoeIndex];
      if (!card) return state;
      return {
        ...state,
        playerHand: [...state.playerHand, { ...card, hidden: false }],
        shoeIndex:  state.shoeIndex + 1,
        actionsLocked: false,
      };
    }

    // Reveal dealer hole card
    case "REVEAL_DEALER_HOLE": {
      const updated = state.dealerHand.map((c, i) =>
        i === 1 ? { ...c, hidden: false } : c
      );
      return { ...state, dealerHand: updated };
    }

    // Dealer draws extra cards (values come from WS dealerHit event)
    case "ADD_DEALER_CARD": {
      // We use the value from WS but pull suit from shoe for display
      const shoCard = state.shoe[state.shoeIndex];
      const card = shoCard
        ? { ...shoCard, value: action.payload.value, hidden: false }
        : { rank: String(action.payload.value), suit: "S", value: action.payload.value,
            color: "black", symbol: "♠", hidden: false };
      return {
        ...state,
        dealerHand: [...state.dealerHand, card],
        shoeIndex:  state.shoeIndex + 1,
      };
    }

    case "UPDATE_PLAYER_COUNT":
      return { ...state, playerCount: action.payload };

    case "UPDATE_DEALER_COUNT":
      return { ...state, dealerCount: action.payload };

    case "LOCK_ACTIONS":
      return { ...state, actionsLocked: true };

    case "UNLOCK_ACTIONS":
      return { ...state, actionsLocked: false };

    // Two-phase outcome: pending keeps cards visible for bust card + sweep
    case "SET_OUTCOME_PENDING":
      return {
        ...state,
        outcome:        action.payload.outcome,
        resultText:     action.payload.text,
        pendingBalance: action.payload.newBalance ?? state.balance,
        // stay in "playing" so cards still render
      };

    case "COMMIT_OUTCOME": {
      const o = state.outcome;
      const newBalance = state.pendingBalance ?? state.balance;
      const wins   = o === "win"  ? state.sessionWins + 1   : state.sessionWins;
      const losses = o === "bust" ? state.sessionLosses + 1 : state.sessionLosses;
      const pushes = o === "push" ? state.sessionPushes + 1 : state.sessionPushes;
      const ended  = newBalance <= 0;
      return {
        ...state,
        phase:          "result",
        balance:        newBalance,
        sessionWins:    wins,
        sessionLosses:  losses,
        sessionPushes:  pushes,
        sessionEnded:   ended,
        sessionEndedAt: ended ? Date.now() : state.sessionEndedAt,
      };
    }

    case "END_SESSION":
      return { ...state, sessionEnded: true, sessionEndedAt: Date.now(), phase: "result" };

    case "SET_OUTCOME":
      return {
        ...state,
        outcome:    action.payload.outcome,
        resultText: action.payload.text,
        phase:      "result",
        balance:    action.payload.newBalance ?? state.balance,
      };

    case "UPDATE_BALANCE":
      return { ...state, balance: action.payload };

    case "INIT_SPLIT": {
      const hands = state.playerHand.map((card, idx) => ({
        cards:    [{ ...card, hidden: false }],
        count:    action.payload.counts[idx] ?? card.value,
        busted:   false,
        resolved: false,
        won:      null,
      }));
      return {
        ...state,
        phase:            "playing",
        splitMode:        true,
        splitHands:       hands,
        currentSplitHand: 0,
        actionsLocked:    false,
      };
    }

    case "UPDATE_SPLIT_HAND_COUNT": {
      const hands = state.splitHands.map((h, i) =>
        i === action.payload.handIndex ? { ...h, count: action.payload.count } : h
      );
      return { ...state, splitHands: hands };
    }

    case "ADVANCE_SPLIT_HAND": {
      const next = Math.min(action.payload, state.splitHands.length - 1);
      return { ...state, currentSplitHand: next, actionsLocked: false };
    }

    case "SPLIT_HIT_HAND": {
      const shoeCard = state.shoe[state.shoeIndex];
      const newCard = shoeCard
        ? { ...shoeCard, hidden: false }
        : { rank:"?", suit:"S", value:action.payload.count, color:"black", symbol:"♠", hidden:false };
      const hands = state.splitHands.map((h, i) =>
        i === action.payload.handIndex
          ? { ...h, count: action.payload.count, cards: [...h.cards, newCard] }
          : h
      );
      return { ...state, splitHands: hands, shoeIndex: state.shoeIndex + 1, actionsLocked: false };
    }

    case "SPLIT_BUST_HAND": {
      const hands = state.splitHands.map((h, i) =>
        i === action.payload ? { ...h, busted: true, resolved: true } : h
      );
      const next = Math.min(state.currentSplitHand + 1, hands.length - 1);
      return { ...state, splitHands: hands, currentSplitHand: next };
    }

    case "SPLIT_RESOLVE_HAND": {
      const hands = state.splitHands.map((h, i) =>
        i === action.payload.handIndex ? { ...h, resolved: true, won: action.payload.won } : h
      );
      return {
        ...state,
        splitHands: hands,
        balance:    action.payload.newBalance ?? state.balance,
      };
    }

    case "SPLIT_ROUND_DONE": {
      // Count wins and losses across all split hands for session stats
      const wins   = state.splitHands.filter(h => h.won === true).length;
      const losses = state.splitHands.filter(h => h.won === false || h.busted).length;
      const pushes = state.splitHands.filter(h => h.won === null && !h.busted).length;
      return {
        ...state,
        phase:         "result",
        sessionWins:   state.sessionWins   + wins,
        sessionLosses: state.sessionLosses + losses,
        sessionPushes: state.sessionPushes + pushes,
      };
    }

    case "SHOW_INSURANCE":
      return { ...state, showInsurance: true };
    case "HIDE_INSURANCE":
      return { ...state, showInsurance: false };
    case "SHOW_SPLIT_PROMPT":
      return { ...state, showSplitPrompt: true };
    case "HIDE_SPLIT_PROMPT":
      return { ...state, showSplitPrompt: false };

    case "NEXT_ROUND":
      return {
        ...initialState,
        balance:          state.balance,
        startingBalance:  state.startingBalance,
        round:            state.round + 1,
        connected:        state.connected,
        sessionWins:      state.sessionWins,
        sessionLosses:    state.sessionLosses,
        sessionPushes:    state.sessionPushes,
        sessionStart:     state.sessionStart,
        sessionEndedAt:   state.sessionEndedAt,
      };

    default:
      return state;
  }
}

// Appended: two-phase outcome for sweep animation
// SET_OUTCOME_PENDING — marks outcome but stays in "playing" so cards remain
// COMMIT_OUTCOME      — actually moves to result phase after sweep