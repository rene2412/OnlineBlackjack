export const initialState = {
  connected:        false,
  phase:            "wager",  // 'wager' | 'dealing' | 'playing' | 'result'
  round:            1,
  balance:          1000,
  wager:            0,
  stagedWager:      0,
  playerHand:       [],  // { value, suit, hidden }
  dealerHand:       [],
  playerCount:      0,
  dealerCount:      0,
  splitMode:        false,
  splitHands:       [],
  currentSplitHand: 0,
  outcome:          null,
  resultText:       null,
  showInsurance:    false,
  showSplitPrompt:  false,
  actionsLocked:    false,
  dealt:            false,   // true after /api/shuffle completes
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
      };

    // Cards are dealt after /api/shuffle responds — move to playing
    case "DEAL_COMPLETE":
      return { ...state, phase: "playing", dealt: true };

    case "DEAL_PLAYER_CARD":
      return { ...state, playerHand: [...state.playerHand, action.payload] };

    case "DEAL_DEALER_CARD":
      return { ...state, dealerHand: [...state.dealerHand, action.payload] };

    case "REVEAL_DEALER_CARD": {
      const updated = state.dealerHand.map((c, i) =>
        i === action.payload.index
          ? { ...c, hidden: false, value: action.payload.value }
          : c
      );
      return { ...state, dealerHand: updated };
    }

    case "ADD_DEALER_CARD":
      return { ...state, dealerHand: [...state.dealerHand, action.payload] };

    case "UPDATE_PLAYER_COUNT":
      return { ...state, playerCount: action.payload };

    case "UPDATE_DEALER_COUNT":
      return { ...state, dealerCount: action.payload };

    case "LOCK_ACTIONS":
      return { ...state, actionsLocked: true };

    case "UNLOCK_ACTIONS":
      return { ...state, actionsLocked: false };

    case "SET_OUTCOME":
      return {
        ...state,
        outcome:     action.payload.outcome,
        resultText:  action.payload.text,
        phase:       "result",
        balance:     action.payload.newBalance ?? state.balance,
      };

    case "UPDATE_BALANCE":
      return { ...state, balance: action.payload };

    case "INIT_SPLIT": {
      const hands = action.payload.counts.map(count => ({
        cards:    [{ value: count, suit: null, hidden: false }],
        count,
        busted:   false,
        resolved: false,
        won:      null,
      }));
      return {
        ...state,
        splitMode:        true,
        splitHands:       hands,
        currentSplitHand: 0,
        actionsLocked:    false,
      };
    }

    case "SPLIT_HIT_HAND": {
      const hands = state.splitHands.map((h, i) =>
        i === action.payload.handIndex
          ? { ...h, count: action.payload.count, cards: [...h.cards, { value: null, suit: null, hidden: false }] }
          : h
      );
      return { ...state, splitHands: hands, actionsLocked: false };
    }

    case "SPLIT_BUST_HAND": {
      const hands = state.splitHands.map((h, i) =>
        i === action.payload ? { ...h, busted: true, resolved: true } : h
      );
      return { ...state, splitHands: hands, currentSplitHand: state.currentSplitHand + 1 };
    }

    case "SPLIT_RESOLVE_HAND": {
      const hands = state.splitHands.map((h, i) =>
        i === action.payload.handIndex
          ? { ...h, resolved: true, won: action.payload.won }
          : h
      );
      const allDone = hands.every(h => h.resolved);
      return {
        ...state,
        splitHands: hands,
        balance:    action.payload.newBalance ?? state.balance,
        phase:      allDone ? "result" : state.phase,
      };
    }

    case "ADVANCE_SPLIT_HAND":
      return { ...state, currentSplitHand: state.currentSplitHand + 1, actionsLocked: false };

    // Only show these prompts if cards have actually been dealt
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