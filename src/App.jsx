import React, { useReducer, useCallback, useRef } from "react";
import { gameReducer, initialState } from "./store/gameStore";
import useGameSocket from "./hooks/useGameSocket";
import useGameApi    from "./hooks/useGameApi";
import { generateShoe, parseCard, SUIT_SYMBOLS, RED_SUITS } from "./utils/deck";
import Card          from "./components/Card";
import CountRing     from "./components/CountRing";
import Chip          from "./components/Chip";
import Modal         from "./components/Modal";
import ResultBanner  from "./components/ResultBanner";
import Toasts, { useToasts } from "./components/Toasts";

const DEAL_INTERVAL = 340; // ms between each card sliding in

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const api  = useGameApi();
  const { toasts, addToast } = useToasts();
  const timersRef = useRef([]);

  // ═══════════════════════════════════════════════════════
  //  WEBSOCKET EVENTS
  // ═══════════════════════════════════════════════════════
  const handleMessage = useCallback((msg) => {
    switch (msg.event) {

      case "__connected":
        dispatch({ type: "SET_CONNECTED", payload: true });
        break;

      case "__disconnected":
        dispatch({ type: "SET_CONNECTED", payload: false });
        break;

      // Player count updated (after deal or hit)
      case "updateCount":
        dispatch({ type: "UPDATE_PLAYER_COUNT", payload: msg.count });
        break;

      // Dealer's visible card count on reconnect
      case "updateDealerCount":
        dispatch({ type: "UPDATE_DEALER_COUNT", payload: msg.count });
        break;

      // Player hit — add card to hand, unlock buttons
      case "hit":
        dispatch({ type: "DEAL_PLAYER_CARD", payload: { value: null, suit: null, hidden: false } });
        dispatch({ type: "UNLOCK_ACTIONS" });
        break;

      // Dealer reveals + draws after player stands
      case "dealerHit": {
        dispatch({ type: "REVEAL_DEALER_CARD", payload: { index: 1, value: state.dealerCount } });
        (msg.values || []).forEach((v, i) => {
          const t = setTimeout(() => {
            dispatch({ type: "ADD_DEALER_CARD", payload: { value: v, suit: null, hidden: false } });
          }, (i + 1) * 420);
          timersRef.current.push(t);
        });
        const newTotal = (msg.values || []).reduce((s, v) => s + v, state.dealerCount);
        const t = setTimeout(() => {
          dispatch({ type: "UPDATE_DEALER_COUNT", payload: newTotal });
        }, ((msg.values || []).length + 1) * 420);
        timersRef.current.push(t);
        break;
      }

      // ── Outcomes ────────────────────────────────────────
      case "playerBust":
        dispatch({ type: "SET_OUTCOME", payload: {
          outcome: "bust", text: "BUST",
          newBalance: state.balance - state.wager,
        }});
        addToast(`${msg.playerName || "You"} busted!`, "bust");
        break;

      case "dealerBust":
        dispatch({ type: "SET_OUTCOME", payload: {
          outcome: "win", text: "DEALER BUSTS!",
          newBalance: state.balance + state.wager,
        }});
        addToast("Dealer busted — you win!", "win");
        break;

      case "playerWin":
        dispatch({ type: "SET_OUTCOME", payload: {
          outcome: "win", text: "YOU WIN!",
          newBalance: state.balance + state.wager,
        }});
        addToast(`+$${state.wager}`, "win");
        break;

      case "dealerWin":
        dispatch({ type: "SET_OUTCOME", payload: {
          outcome: "bust", text: "DEALER WINS",
          newBalance: state.balance - state.wager,
        }});
        addToast(`-$${state.wager}`, "bust");
        break;

      case "push":
        dispatch({ type: "SET_OUTCOME", payload: { outcome: "push", text: "PUSH" } });
        addToast("Push — bet returned", "push");
        break;

      // ── Prompts — only fire if cards are already dealt ──
      // (dealt flag in reducer gates these)
      case "playerInsuranceChoice":
        dispatch({ type: "SHOW_INSURANCE" });
        break;

      case "playerSplitChoice":
        dispatch({ type: "SHOW_SPLIT_PROMPT" });
        break;

      // ── Split setup ────────────────────────────────────
      case "firstSplitCounter":
        dispatch({ type: "UPDATE_PLAYER_COUNT", payload: msg.count });
        break;

      case "secondSplitCounter":
        dispatch({ type: "INIT_SPLIT", payload: {
          counts: [state.playerCount, msg.count],
        }});
        break;

      case "newSplitCounter": {
        const existing = state.splitHands.map(h => h.count);
        dispatch({ type: "INIT_SPLIT", payload: { counts: [...existing, msg.count] } });
        break;
      }

      case "splitHit":
        dispatch({ type: "SPLIT_HIT_HAND", payload: {
          handIndex: msg.currentHand,
          count: msg.currentHandCount,
        }});
        break;

      case "playerSplitBust":
        dispatch({ type: "SPLIT_BUST_HAND", payload: msg.hand });
        addToast(`Hand ${msg.hand + 1} busted`, "bust");
        break;

      case "playerSplitWin":
        dispatch({ type: "SPLIT_RESOLVE_HAND", payload: {
          handIndex: msg.handCount, won: true, newBalance: msg.updateBalance,
        }});
        addToast(`Hand ${msg.handCount + 1} wins!`, "win");
        break;

      case "dealerSplitWin":
        dispatch({ type: "SPLIT_RESOLVE_HAND", payload: {
          handIndex: msg.handCount, won: false, newBalance: msg.updateBalance,
        }});
        addToast(`Dealer wins hand ${msg.handCount + 1}`, "bust");
        break;

      case "playerSplitPush":
        dispatch({ type: "SPLIT_RESOLVE_HAND", payload: {
          handIndex: msg.handCount, won: null, newBalance: state.balance,
        }});
        addToast(`Hand ${msg.handCount + 1} — push`, "push");
        break;

      default:
        break;
    }
  }, [state.balance, state.wager, state.dealerCount, state.playerCount, state.splitHands, addToast]);

  useGameSocket(handleMessage);

  // ═══════════════════════════════════════════════════════
  //  DEAL FLOW
  //  1. Confirm wager → POST /api/wager
  //  2. Generate shoe → POST /api/shuffle  (backend deals cards + fires WS)
  //  3. Animate 4 cards onto table
  //  4. Mark as dealt → unlock action buttons
  // ═══════════════════════════════════════════════════════
  async function handleDeal() {
    if (state.stagedWager <= 0) { addToast("Place a wager first!", ""); return; }

    dispatch({ type: "CONFIRM_WAGER" });
    dispatch({ type: "START_ROUND" });

    // Step 1 — send wager
    try {
      await api.sendWager(state.stagedWager);
    } catch {
      addToast("Server error on wager", "bust");
      dispatch({ type: "SET_PHASE", payload: "wager" });
      return;
    }

    // Step 2 — generate shuffled shoe and send to backend
    // Backend's /api/shuffle deals the cards and fires WS events
    const shoe = generateShoe(6);
    try {
      await api.sendShuffle(shoe);
    } catch {
      addToast("Server error on shuffle", "bust");
      dispatch({ type: "SET_PHASE", payload: "wager" });
      return;
    }

    // Step 3 — animate cards onto table
    // Authentic casino deal order:
    //   Dealer face-up → Player card 1 → Dealer face-DOWN → Player card 2
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const dealOrder = [
      { who: "dealer", hidden: false },
      { who: "player", hidden: false },
      { who: "dealer", hidden: true  },  // ← dealer hole card (face down)
      { who: "player", hidden: false },
    ];

    dealOrder.forEach(({ who, hidden }, i) => {
      const t = setTimeout(() => {
        const action = who === "dealer" ? "DEAL_DEALER_CARD" : "DEAL_PLAYER_CARD";
        dispatch({ type: action, payload: { value: null, suit: null, hidden } });
      }, i * DEAL_INTERVAL);
      timersRef.current.push(t);
    });

    // Step 4 — after all 4 cards are on the table, mark dealt & unlock
    const doneTimer = setTimeout(() => {
      dispatch({ type: "DEAL_COMPLETE" });
    }, dealOrder.length * DEAL_INTERVAL + 200);
    timersRef.current.push(doneTimer);
  }

  async function handleHit() {
    dispatch({ type: "LOCK_ACTIONS" });
    try { await api.sendDecision("hit"); }
    catch { dispatch({ type: "UNLOCK_ACTIONS" }); }
  }

  async function handleStand() {
    dispatch({ type: "LOCK_ACTIONS" });
    try { await api.sendDecision("stand"); }
    catch { dispatch({ type: "UNLOCK_ACTIONS" }); }
  }

  async function handleDouble() {
    const doubled = state.wager * 2;
    if (doubled > state.balance) { addToast("Can't afford double!", "bust"); return; }
    dispatch({ type: "LOCK_ACTIONS" });
    try {
      await api.sendWager(doubled);
      dispatch({ type: "CONFIRM_WAGER" });
      await api.sendDecision("stand");
    } catch { dispatch({ type: "UNLOCK_ACTIONS" }); }
  }

  async function handleInsurance(yes) {
    dispatch({ type: "HIDE_INSURANCE" });
    await api.sendInsurance(yes ? "yes" : "no");
  }

  async function handleSplit(yes) {
    dispatch({ type: "HIDE_SPLIT_PROMPT" });
    if (yes) await api.sendSplit(true);
  }

  async function handleSplitDecision(action) {
    dispatch({ type: "LOCK_ACTIONS" });
    await api.sendSplitDecision(action, state.currentSplitHand);
  }

  // ═══════════════════════════════════════════════════════
  //  RENDER HELPERS
  // ═══════════════════════════════════════════════════════

  // Render a card — value from WS count events gets mapped onto placeholder cards
  function renderCard(card, i, opts = {}) {
    return (
      <Card
        key={i}
        value={card.value}
        suit={card.suit}
        hidden={card.hidden}
        dealing
        delay={i * 80}
        dimmed={opts.dimmed}
      />
    );
  }

  const {
    phase, balance, wager, stagedWager,
    playerHand, dealerHand, playerCount, dealerCount,
    splitMode, splitHands, currentSplitHand,
    outcome, resultText, showInsurance, showSplitPrompt,
    actionsLocked, connected,
  } = state;

  const betAmount = phase === "wager" ? stagedWager : wager;

  return (
    <>
      {/* ── Connection screen ── */}
      {!connected && (
        <div className="conn-overlay">
          <div className="conn-inner">
            <div className="conn-suits">♠ ♥ ♦ ♣</div>
            <h1 className="conn-title">BLACKJACK</h1>
            <div className="conn-divider" />
            <div className="conn-spinner" />
            <p className="conn-status">Connecting to table…</p>
          </div>
        </div>
      )}

      <Toasts toasts={toasts} />
      <ResultBanner text={resultText} type={outcome} />

      {/* Insurance only after cards dealt */}
      <Modal
        open={showInsurance}
        suit="♠" title="Insurance?"
        body="Dealer is showing an Ace. Take insurance for half your wager?"
        yesLabel="Take Insurance" noLabel="Decline"
        onYes={() => handleInsurance(true)}
        onNo={() => handleInsurance(false)}
      />

      {/* Split only after cards dealt */}
      <Modal
        open={showSplitPrompt}
        suit="♣" title="Split Hand?"
        body="You've been dealt a matching pair. Split into two hands?"
        yesLabel="Split" noLabel="Stay"
        onYes={() => handleSplit(true)}
        onNo={() => handleSplit(false)}
      />

      <div className="room">
        <div className="ceiling-light" />

        <div className="table-wrap">
          <div className="table-rail">
            <div className="table-surface">

              <div className="felt-rules">
                <span>BLACKJACK PAYS 3 TO 2</span>
                <span className="felt-dot">♦</span>
                <span>DEALER MUST STAND ON ALL 17s</span>
                <span className="felt-dot">♦</span>
                <span>INSURANCE PAYS 2 TO 1</span>
              </div>

              {/* ── DEALER ── */}
              <section className="zone">
                <span className="zone-label">D E A L E R</span>
                <div className="hand-area">
                  {dealerHand.map((card, i) => renderCard(card, i, {
                    dimmed: outcome === "win"
                  }))}
                </div>
                <CountRing count={dealerCount} hidden={phase === "playing"} />
              </section>

              <div className="table-arc">
                <svg viewBox="0 0 800 30" preserveAspectRatio="none">
                  <path d="M0,30 Q400,0 800,30" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="1.5" />
                </svg>
              </div>

              {/* ── PLAYER ── */}
              <section className="zone">
                <span className="zone-label">
                  {splitMode ? "S P L I T   H A N D S" : "Y O U R   H A N D"}
                </span>

                {!splitMode && (
                  <>
                    <div className={[
                      "hand-area",
                      outcome === "win"  ? "hand-area--winner" : "",
                      outcome === "bust" ? "hand-area--loser"  : "",
                    ].filter(Boolean).join(" ")}>
                      {playerHand.map((card, i) => renderCard(card, i, {
                        dimmed: outcome === "bust"
                      }))}
                    </div>
                    <CountRing count={playerCount} />
                  </>
                )}

                {splitMode && (
                  <div className="split-row">
                    {splitHands.map((hand, idx) => (
                      <div key={idx} className={[
                        "split-hand-block",
                        idx === currentSplitHand ? "split-hand-block--active" : "",
                      ].join(" ")}>
                        <div className="split-hand-title">Hand {idx + 1}</div>
                        <div className={[
                          "hand-area",
                          hand.busted       ? "hand-area--loser"  : "",
                          hand.won === true ? "hand-area--winner" : "",
                        ].filter(Boolean).join(" ")}>
                          {hand.cards.map((card, ci) => renderCard(card, ci))}
                        </div>
                        <CountRing count={hand.count} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Betting circle */}
              <div className="bet-circle-wrap">
                <div className={["bet-circle", betAmount > 0 ? "bet-circle--active" : ""].join(" ")}>
                  <span className="bet-circle__label">BET</span>
                  <span className="bet-circle__amount">${betAmount}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── HUD ── */}
        <div className="hud">
          <div className="hud-stats">
            <div className="hud-stat">
              <span className="hud-label">Balance</span>
              <span className="hud-val">${balance.toLocaleString()}</span>
            </div>
            <div className="hud-stat hud-stat--center">
              <span className="hud-label">
                {phase === "wager"   ? "Place Your Wager"  :
                 phase === "dealing" ? "Dealing…"          :
                 phase === "playing" ? "Your Turn"         : "Round Over"}
              </span>
              <div className="ws-indicator">
                <div className={`ws-dot ${connected ? "" : "ws-dot--off"}`} />
                <span className="ws-label">{connected ? "Live" : "Reconnecting…"}</span>
              </div>
            </div>
            <div className="hud-stat hud-stat--right">
              <span className="hud-label">Wager</span>
              <span className="hud-val">${betAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* WAGER PHASE */}
          {phase === "wager" && (
            <>
              <div className="chip-tray">
                {[5, 25, 50, 100, 500].map((v) => (
                  <Chip
                    key={v} value={v}
                    disabled={stagedWager + v > balance}
                    onClick={() => dispatch({ type: "ADD_CHIP", payload: v })}
                  />
                ))}
              </div>
              <div className="wager-row">
                <button
                  className="btn btn--ghost"
                  onClick={() => dispatch({ type: "CLEAR_WAGER" })}
                  disabled={stagedWager === 0}
                >
                  Clear Bet
                </button>
                <button
                  className="btn btn--deal"
                  onClick={handleDeal}
                  disabled={stagedWager <= 0}
                >
                  Deal ›
                </button>
              </div>
            </>
          )}

          {/* DEALING PHASE — spinner while cards animate in */}
          {phase === "dealing" && (
            <div className="dealing-status">
              <div className="dealing-spinner" />
              <span>Dealing…</span>
            </div>
          )}

          {/* PLAYING — normal */}
          {phase === "playing" && !splitMode && (
            <div className="action-row">
              <button className="btn btn--hit"    onClick={handleHit}    disabled={actionsLocked}>HIT</button>
              <button className="btn btn--stand"  onClick={handleStand}  disabled={actionsLocked}>STAND</button>
              <button className="btn btn--double" onClick={handleDouble} disabled={actionsLocked || wager * 2 > balance}>DOUBLE</button>
            </div>
          )}

          {/* PLAYING — split */}
          {phase === "playing" && splitMode && (
            <div className="split-controls">
              <div className="split-controls__label">
                Playing Hand {currentSplitHand + 1} of {splitHands.length}
              </div>
              <div className="action-row">
                <button className="btn btn--hit"   onClick={() => handleSplitDecision("hit")}   disabled={actionsLocked}>HIT HAND</button>
                <button className="btn btn--stand" onClick={() => handleSplitDecision("stand")} disabled={actionsLocked}>STAND HAND</button>
              </div>
            </div>
          )}

          {/* RESULT */}
          {phase === "result" && (
            <button
              className="btn btn--deal btn--wide"
              onClick={() => dispatch({ type: "NEXT_ROUND" })}
            >
              Next Round ›
            </button>
          )}
        </div>
      </div>
    </>
  );
}