import React, { useEffect, useState, useReducer, useCallback, useRef } from "react";
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

const DEAL_INTERVAL  = 340;
const SWEEP_DELAY    = 800;   // ms after outcome before cards sweep off
const SWEEP_DURATION = 600;   // ms for sweep animation

export default function App() {
  const [state, dispatch]    = useReducer(gameReducer, initialState);
  const stateRef             = useRef(state);
  const api                  = useGameApi();
  const { toasts, addToast } = useToasts();
  const addToastRef          = useRef(addToast);
  const timersRef            = useRef([]);
  const isDealingRef         = useRef(false);
  const wsQueueRef           = useRef([]);

  // sweeping = cards flying off after outcome
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => { stateRef.current = state; },       [state]);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  // ─── Trigger sweep then move to result phase ─────────────────────
  function triggerSweep(outcomePayload) {
    dispatch({ type: "SET_OUTCOME_PENDING", payload: outcomePayload });
    // Short delay so bust card animates in first
    const t1 = setTimeout(() => {
      setSweeping(true);
      const t2 = setTimeout(() => {
        setSweeping(false);
        dispatch({ type: "COMMIT_OUTCOME" });
      }, SWEEP_DURATION + 100);
      timersRef.current.push(t2);
    }, SWEEP_DELAY);
    timersRef.current.push(t1);
  }

  // ═══════════════════════════════════════════
  //  WS EVENT PROCESSOR
  // ═══════════════════════════════════════════
  const processEvent = useCallback((msg) => {
    const s     = stateRef.current;
    const toast = addToastRef.current;

    switch (msg.event) {
      case "__connected":    dispatch({ type:"SET_CONNECTED", payload:true  }); break;
      case "__disconnected": dispatch({ type:"SET_CONNECTED", payload:false }); break;

      case "updateCount":
        dispatch({ type:"UPDATE_PLAYER_COUNT", payload:msg.count });
        break;

      case "updateDealerCount":
        dispatch({ type:"UPDATE_DEALER_COUNT", payload:msg.count });
        break;

      case "hit":
        dispatch({ type:"HIT_PLAYER_FROM_SHOE" });
        break;

      case "dealerHit": {
        dispatch({ type:"REVEAL_DEALER_HOLE" });
        (msg.values||[]).forEach((v,i) => {
          const t = setTimeout(() => dispatch({ type:"ADD_DEALER_CARD", payload:{value:v} }), (i+1)*420);
          timersRef.current.push(t);
        });
        const newTotal = (msg.values||[]).reduce((a,v)=>a+v, s.dealerCount);
        const t = setTimeout(() => dispatch({ type:"UPDATE_DEALER_COUNT", payload:newTotal }),
          ((msg.values||[]).length+1)*420);
        timersRef.current.push(t);
        break;
      }

      // Player busts — deal the card first, THEN sweep after it lands
      case "playerBust": {
        dispatch({ type:"HIT_PLAYER_FROM_SHOE" }); // bust card comes out
        const payload = { outcome:"bust", text:"BUST", newBalance: s.balance - s.wager };
        toast(`${msg.playerName||"You"} busted!`, "bust");
        triggerSweep(payload);
        break;
      }

      case "dealerBust": {
        const payload = { outcome:"win", text:"DEALER BUSTS!", newBalance: s.balance + s.wager };
        toast("Dealer busted — you win!", "win");
        triggerSweep(payload);
        break;
      }

      case "playerWin": {
        const payload = { outcome:"win", text:"YOU WIN!", newBalance: s.balance + s.wager };
        toast(`+$${s.wager}`, "win");
        triggerSweep(payload);
        break;
      }

      case "dealerWin": {
        const payload = { outcome:"bust", text:"DEALER WINS", newBalance: s.balance - s.wager };
        toast(`-$${s.wager}`, "bust");
        triggerSweep(payload);
        break;
      }

      case "push": {
        const payload = { outcome:"push", text:"PUSH" };
        toast("Push — bet returned", "push");
        triggerSweep(payload);
        break;
      }

      case "playerInsuranceChoice": dispatch({ type:"SHOW_INSURANCE"   }); break;
      case "playerSplitChoice":     dispatch({ type:"SHOW_SPLIT_PROMPT"}); break;

      case "firstSplitCounter":  dispatch({ type:"UPDATE_PLAYER_COUNT", payload:msg.count }); break;
      case "secondSplitCounter": dispatch({ type:"INIT_SPLIT", payload:{counts:[s.playerCount,msg.count]}}); break;
      case "newSplitCounter": {
        const ex = s.splitHands.map(h=>h.count);
        dispatch({ type:"INIT_SPLIT", payload:{counts:[...ex,msg.count]}}); break;
      }
      case "splitHit":        dispatch({ type:"SPLIT_HIT_HAND",    payload:{handIndex:msg.currentHand,count:msg.currentHandCount}}); break;
      case "playerSplitBust": dispatch({ type:"SPLIT_BUST_HAND",   payload:msg.hand }); toast(`Hand ${msg.hand+1} busted`,"bust"); break;
      case "playerSplitWin":  dispatch({ type:"SPLIT_RESOLVE_HAND",payload:{handIndex:msg.handCount,won:true, newBalance:msg.updateBalance}}); toast(`Hand ${msg.handCount+1} wins!`,"win"); break;
      case "dealerSplitWin":  dispatch({ type:"SPLIT_RESOLVE_HAND",payload:{handIndex:msg.handCount,won:false,newBalance:msg.updateBalance}}); toast(`Dealer wins hand ${msg.handCount+1}`,"bust"); break;
      case "playerSplitPush": dispatch({ type:"SPLIT_RESOLVE_HAND",payload:{handIndex:msg.handCount,won:null, newBalance:s.balance}}); toast(`Hand ${msg.handCount+1} — push`,"push"); break;
      default: break;
    }
  }, []);

  const handleMessage = useCallback((msg) => {
    if (isDealingRef.current) wsQueueRef.current.push(msg);
    else processEvent(msg);
  }, [processEvent]);

  useGameSocket(handleMessage);

  // ═══════════════════════════════════════════
  //  DEAL
  // ═══════════════════════════════════════════
  async function handleDeal() {
    if (state.stagedWager <= 0) { addToast("Place a wager first!",""); return; }

    const shoe   = generateShoe(6);
    const parsed = shoe.map(parseCard);

    dispatch({ type:"CONFIRM_WAGER" });
    dispatch({ type:"SET_SHOE",    payload:parsed });
    dispatch({ type:"START_ROUND" });

    isDealingRef.current = true;
    wsQueueRef.current   = [];
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    try {
      await api.sendWager(state.stagedWager);
      await api.sendShuffle(shoe);
    } catch {
      addToast("Server error — is the backend running?","bust");
      isDealingRef.current = false;
      dispatch({ type:"SET_PHASE", payload:"wager" });
      return;
    }

    const steps = [
      "DEAL_DEALER_CARD_FROM_SHOE",
      "DEAL_PLAYER_CARD_FROM_SHOE",
      "DEAL_DEALER_HOLE_FROM_SHOE",
      "DEAL_PLAYER_CARD_FROM_SHOE",
    ];
    steps.forEach((action,i) => {
      const t = setTimeout(() => dispatch({ type:action }), i * DEAL_INTERVAL);
      timersRef.current.push(t);
    });

    const flush = setTimeout(() => {
      isDealingRef.current = false;
      dispatch({ type:"DEAL_COMPLETE" });
      const q = [...wsQueueRef.current];
      wsQueueRef.current = [];
      q.forEach(msg => processEvent(msg));
    }, steps.length * DEAL_INTERVAL + 400);
    timersRef.current.push(flush);
  }

  async function handleHit() {
    dispatch({ type:"LOCK_ACTIONS" });
    try { await api.sendDecision("hit"); } catch { dispatch({ type:"UNLOCK_ACTIONS" }); }
  }
  async function handleStand() {
    dispatch({ type:"LOCK_ACTIONS" });
    try { await api.sendDecision("stand"); } catch { dispatch({ type:"UNLOCK_ACTIONS" }); }
  }
  async function handleDouble() {
    const doubled = state.wager * 2;
    if (doubled > state.balance) { addToast("Can't afford double!","bust"); return; }
    dispatch({ type:"LOCK_ACTIONS" });
    try { await api.sendWager(doubled); dispatch({ type:"CONFIRM_WAGER" }); await api.sendDecision("stand"); }
    catch { dispatch({ type:"UNLOCK_ACTIONS" }); }
  }
  async function handleInsurance(yes) {
    dispatch({ type:"HIDE_INSURANCE" });
    await api.sendInsurance(yes?"yes":"no");
  }
  async function handleSplit(yes) {
    dispatch({ type:"HIDE_SPLIT_PROMPT" });
    if (yes) await api.sendSplit(true);
  }
  async function handleSplitDecision(action) {
    dispatch({ type:"LOCK_ACTIONS" });
    await api.sendSplitDecision(action, state.currentSplitHand);
  }

  const {
    phase, balance, wager, stagedWager,
    playerHand, dealerHand, playerCount, dealerCount,
    splitMode, splitHands, currentSplitHand,
    outcome, resultText, showInsurance, showSplitPrompt,
    actionsLocked, connected,
  } = state;

  const betAmount  = phase === "wager" ? stagedWager : wager;
  const isPlaying  = phase === "playing";
  const isWagering = phase === "wager";
  const isDealing  = phase === "dealing";
  const isResult   = phase === "result";

  return (
    <>
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

      <Modal open={showInsurance} suit="♠" title="Insurance?"
        body="Dealer is showing an Ace. Take insurance for half your wager?"
        yesLabel="Take Insurance" noLabel="Decline"
        onYes={() => handleInsurance(true)} onNo={() => handleInsurance(false)} />

      <Modal open={showSplitPrompt} suit="♣" title="Split Hand?"
        body="You've been dealt a matching pair. Split into two hands?"
        yesLabel="Split" noLabel="Stay"
        onYes={() => handleSplit(true)} onNo={() => handleSplit(false)} />

      <div className="room">
        <div className="ceiling-light" />

        {/* ════ TABLE ════ */}
        <div className="table-wrap">
          <div className="table-rail">
            <div className="table-surface">

              {/* ── DEALER ZONE ── */}
              <section className="zone zone--dealer">
                {/* Count badge pinned to left, slides in after deal */}
                <div className={["zone-count-left", state.dealt && dealerCount > 0 ? "zone-count-left--visible" : ""].filter(Boolean).join(" ")}
                     style={{ opacity: state.dealt && dealerCount > 0 ? 1 : 0 }}>
                  {dealerCount > 0 && (
                    <CountRing count={isPlaying ? "?" : dealerCount} />
                  )}
                </div>
                <span className="zone-label">D E A L E R</span>
                <div className={["hand-area", sweeping ? "hand-area--sweep-up" : ""].filter(Boolean).join(" ")}>
                  {dealerHand.map((card,i) => (
                    <Card key={i} rank={card.rank} suit={card.suit}
                      color={card.color} symbol={card.symbol}
                      hidden={card.hidden} dealing delay={i*80}
                      dimmed={outcome==="win"} />
                  ))}
                </div>
              </section>

              {/* Felt rules — curved along the arc, above the gold line */}
              <svg className="felt-rules-svg" viewBox="0 0 700 44" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <path id="feltCurve" d="M 40,38 Q 350,4 660,38" />
                </defs>
                <text className="felt-rules-text">
                  <textPath href="#feltCurve" startOffset="50%" textAnchor="middle">
                    BLACKJACK PAYS 3 TO 2  ♦  DEALER MUST STAND ON 17  ♦  INSURANCE PAYS 2 TO 1
                  </textPath>
                </text>
              </svg>

              <div className="table-arc">
                <svg viewBox="0 0 800 30" preserveAspectRatio="none">
                  <path d="M0,30 Q400,0 800,30" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="1.5"/>
                </svg>
              </div>

              {/* ── PLAYER ZONE ── */}
              <section className="zone zone--player">
                {/* Count badge pinned to left, slides in after deal */}
                <div className={["zone-count-left", state.dealt && playerCount > 0 && !splitMode ? "zone-count-left--visible" : ""].filter(Boolean).join(" ")}
                     style={{ opacity: state.dealt && playerCount > 0 && !splitMode ? 1 : 0 }}>
                  {playerCount > 0 && !splitMode && (
                    <CountRing count={playerCount} />
                  )}
                </div>
                <span className="zone-label">
                  {splitMode ? "S P L I T   H A N D S" : "Y O U R   H A N D"}
                </span>

                {!splitMode && (
                  <div className={["hand-area",
                    outcome==="win"  ? "hand-area--winner" : "",
                    outcome==="bust" ? "hand-area--loser"  : "",
                    sweeping         ? "hand-area--sweep-down" : "",
                  ].filter(Boolean).join(" ")}>
                    {playerHand.map((card,i) => (
                      <Card key={i} rank={card.rank} suit={card.suit}
                        color={card.color} symbol={card.symbol}
                        hidden={card.hidden} dealing delay={i*80}
                        dimmed={outcome==="bust"} />
                    ))}
                  </div>
                )}

                {splitMode && (
                  <div className={["split-row", sweeping ? "hand-area--sweep-down" : ""].filter(Boolean).join(" ")}>
                    {splitHands.map((hand,idx) => (
                      <div key={idx} className={["split-hand-block",
                        idx===currentSplitHand?"split-hand-block--active":"",
                      ].join(" ")}>
                        <div className="split-hand-title">Hand {idx+1}</div>
                        <div className={["hand-area",
                          hand.busted    ?"hand-area--loser" :"",
                          hand.won===true?"hand-area--winner":"",
                        ].filter(Boolean).join(" ")}>
                          {hand.cards.map((c,ci) => (
                            <Card key={ci} rank={c.rank} suit={c.suit}
                              color={c.color} symbol={c.symbol} dealing delay={ci*100} />
                          ))}
                        </div>
                        <CountRing count={hand.count} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Betting circle — only visible during wager phase */}
              {isWagering && (
              <div className="bet-circle-wrap">
                <div className={["bet-circle", betAmount>0?"bet-circle--active":""].join(" ")}>
                  <span className="bet-circle__label">BET</span>
                  <span className="bet-circle__amount">${betAmount}</span>
                </div>
              </div>
              )}

            </div>{/* /table-surface */}
          </div>{/* /table-rail */}
        </div>{/* /table-wrap */}

        {/* ════ HUD ════ */}
        <div className="hud">

          {/* Stats bar */}
          <div className="hud-stats">
            <div className="hud-stat">
              <span className="hud-label">Balance</span>
              <span className="hud-val">${balance.toLocaleString()}</span>
            </div>

            <div className="hud-stat hud-stat--center">
              <span className="hud-label">
                {isWagering?"Place Your Wager":isDealing?"Dealing…":isPlaying?"Your Turn":"Round Over"}
              </span>
              {(isPlaying||isDealing||isResult) && betAmount > 0 && (
                <div className="hud-wager-pill">
                  <span className="hud-wager-pill__label">Wager</span>
                  <span>${betAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="hud-stat hud-stat--right">
              <span className="hud-label">Game</span>
              <span className="hud-val">#{state.round}</span>
            </div>
          </div>

          {/* Action panel */}
          <div className="hud-actions">

            {isWagering && (
              <>
                <div className="chip-tray">
                  {[5,25,50,100,500].map(v => (
                    <Chip key={v} value={v}
                      disabled={stagedWager+v>balance}
                      onClick={() => dispatch({ type:"ADD_CHIP", payload:v })} />
                  ))}
                </div>
                <div className="wager-row">
                  <button className="btn btn--ghost"
                    onClick={() => dispatch({type:"CLEAR_WAGER"})}
                    disabled={stagedWager===0}>Clear Bet</button>
                  <button className="btn btn--deal"
                    onClick={handleDeal}
                    disabled={stagedWager<=0}>Deal ›</button>
                </div>
              </>
            )}

            {isDealing && (
              <div className="dealing-status">
                <div className="dealing-spinner"/><span>Dealing…</span>
              </div>
            )}

            {isPlaying && !splitMode && (
              <div className="action-row">
                <button className="btn btn--hit"    onClick={handleHit}    disabled={actionsLocked}>HIT</button>
                <button className="btn btn--stand"  onClick={handleStand}  disabled={actionsLocked}>STAND</button>
                <button className="btn btn--double" onClick={handleDouble} disabled={actionsLocked||wager*2>balance}>DOUBLE</button>
              </div>
            )}

            {isPlaying && splitMode && (
              <div className="split-controls">
                <div className="split-controls__label">Playing Hand {currentSplitHand+1} of {splitHands.length}</div>
                <div className="action-row">
                  <button className="btn btn--hit"   onClick={()=>handleSplitDecision("hit")}   disabled={actionsLocked}>HIT HAND</button>
                  <button className="btn btn--stand" onClick={()=>handleSplitDecision("stand")} disabled={actionsLocked}>STAND HAND</button>
                </div>
              </div>
            )}

            {isResult && (
              <button className="btn btn--deal btn--wide"
                onClick={() => dispatch({type:"NEXT_ROUND"})}>Next Round ›</button>
            )}

          </div>
        </div>
      </div>
    </>
  );
}