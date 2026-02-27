export const initialState = {
  connected:        false,
  phase:            "wager",   // 'wager' | 'dealing' | 'playing' | 'result'
  round:            1,
  balance:          1000,
  wager:            0,
  stagedWager:      0,

  // Each card: { rank, suit, value, color, symbol, hidden }
  playerHand:       [],
  dealerHand:       [],
  playerCount:      0,
  dealerCount:      0,

  // The shoe we sent to backend — we pop from this to know real card values
  shoe:             [],
  shoeIndex:        0,   // next card to deal from shoe

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
        shoeIndex:        0,
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

    case "COMMIT_OUTCOME":
      return {
        ...state,
        phase:   "result",
        balance: state.pendingBalance ?? state.balance,
      };

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
      const hands = action.payload.counts.map((count, idx) => {
        // Each split hand starts with the card already in the player hand
        const card = state.playerHand[idx] || { rank:"?", suit:"S", value:count, color:"black", symbol:"♠" };
        return { cards: [card], count, busted: false, resolved: false, won: null };
      });
      return {
        ...state,
        splitMode:        true,
        splitHands:       hands,
        currentSplitHand: 0,
        actionsLocked:    false,
      };
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
      return { ...state, splitHands: hands, currentSplitHand: state.currentSplitHand + 1 };
    }

    case "SPLIT_RESOLVE_HAND": {
      const hands = state.splitHands.map((h, i) =>
        i === action.payload.handIndex ? { ...h, resolved: true, won: action.payload.won } : h
      );
      const allDone = hands.every(h => h.resolved);
      return {
        ...state,
        splitHands: hands,
        balance:    action.payload.newBalance ?? state.balance,
        phase:      allDone ? "result" : state.phase,
      };
    }

    case "SHOW_INSURANCE":
      return state.dealt ? { ...state, showInsurance: true } : state;
    case "HIDE_INSURANCE":
      return { ...state, showInsurance: false };
    case "SHOW_SPLIT_PROMPT":
      return state.dealt ? { ...state, showSplitPrompt: true } : state;
    case "HIDE_SPLIT_PROMPT":
      return { ...state, showSplitPrompt: false };

    case "NEXT_ROUND":
      return {
        ...initialState,
        balance:   state.balance,
        round:     state.round + 1,
        connected: state.connected,
      };

    default:
      return state;
  }
}

// Appended: two-phase outcome for sweep animation
// SET_OUTCOME_PENDING — marks outcome but stays in "playing" so cards remain
// COMMIT_OUTCOME      — actually moves to result phase after sweep