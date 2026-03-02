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
const CARD_ANIM_MS   = 820; // per dealer card during dealerHit
const SWEEP_DURATION = 600;

export default function App() {
  const [state, dispatch]    = useReducer(gameReducer, initialState);
  const stateRef             = useRef(state);
  const api                  = useGameApi();
  const { toasts, addToast } = useToasts();
  const addToastRef          = useRef(addToast);
  const timersRef            = useRef([]);
  const isDealingRef         = useRef(false);
  const wsQueueRef           = useRef([]);
  const postDealQueueRef     = useRef([]); // sequential queue for insurance/split/blackjack
  const postDealFiredRef     = useRef(false);
  const modalActiveRef       = useRef(false);
  const splitInitCountsRef   = useRef(null); // non-null while collecting init counts for split
  const parsedShoeRef        = useRef([]); // full persistent shoe — survives rounds
  const shoePositionRef      = useRef(0);  // current position in persistent shoe
  const shoeInitializedRef   = useRef(false); // have we sent the shoe to backend yet

  const [sweeping, setSweeping]         = useState(false);
  const [showCounters, setShowCounters] = useState(false);
  const [holeRevealed, setHoleRevealed] = useState(false);
  const [reshuffling, setReshuffling]   = useState(false);
  const [landed, setLanded]             = useState(false); // false = landing page, true = table
  const [connecting, setConnecting]     = useState(false); // show spinner after Play Now
  const [splitRevealIndex, setSplitRevealIndex] = useState(-1);
  const [splitBanner, setSplitBanner]           = useState({ text: null, type: null });
  const [splitRevealPending, setSplitRevealPending] = useState(false);
  // Extra delay before sweep — set when dealerHit fires so we wait for last card
  const sweepExtraDelayRef  = useRef(0);
  const pendingOutcomeRef   = useRef(null);
  const dealerAnimDoneRef   = useRef(true);
  const dealerCardIndexRef  = useRef(0); // tracks which dealer card we're on

  const [, forceTimerTick] = useState(0);
  useEffect(() => { stateRef.current = state; },       [state]);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  // When splitRoundDone fires, animate each hand sequentially using live state
  useEffect(() => {
    if (!splitRevealPending) return;
    setSplitRevealPending(false);
    const hands = state.splitHands;
    console.log("[splitReveal] hands at reveal time:", hands.map((h,i) => `hand${i}: won=${h.won} busted=${h.busted}`));
    const STEP = 2600;
    let bannerKey = 0;
    hands.forEach((hand, idx) => {
      const t = setTimeout(() => {
        setSplitRevealIndex(idx);
        let text, type;
        if (hand.busted)            { text = `HAND ${idx+1} BUST`;  type = "bust"; }
        else if (hand.won === true)  { text = `HAND ${idx+1} WINS`;  type = "win";  }
        else if (hand.won === false) { text = `HAND ${idx+1} LOSES`; type = "bust"; }
        else                         { text = `HAND ${idx+1} PUSH`;  type = "push"; }
        setSplitBanner({ text, type, key: ++bannerKey });
      }, idx * STEP);
      timersRef.current.push(t);
    });
    const done = setTimeout(() => {
      setSplitRevealIndex(-1);
      setSplitBanner({ text: null, type: null });
      dispatch({ type:"SPLIT_ROUND_DONE" });
    }, hands.length * STEP + 1000);
    timersRef.current.push(done);
  }, [splitRevealPending]);
  useEffect(() => {
    const interval = setInterval(() => forceTimerTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fire post-deal events one at a time — next fires only after modal is dismissed
  function fireNextPostDeal() {
    if (modalActiveRef.current) return;
    const next = postDealQueueRef.current.shift();
    if (!next) {
      dispatch({ type:"UNLOCK_ACTIONS" });
      return;
    }
    console.log(`[postDeal] firing ${next.event} at`, Date.now());
    dispatch({ type:"UNLOCK_ACTIONS" }); // unlock before showing prompt
    const isModal = ["playerInsuranceChoice", "playerSplitChoice"].includes(next.event);
    if (isModal) modalActiveRef.current = true;
    processEvent(next);
    if (!isModal) fireNextPostDeal();
  }

  function triggerSweep(outcomePayload) {
    dispatch({ type: "SET_OUTCOME_PENDING", payload: outcomePayload });
    const extra = sweepExtraDelayRef.current;
    sweepExtraDelayRef.current = 0;
    const t1 = setTimeout(() => {
      setSweeping(true);
      const t2 = setTimeout(() => {
        setSweeping(false);
        dispatch({ type: "COMMIT_OUTCOME" });
      }, SWEEP_DURATION + 100);
      timersRef.current.push(t2);
    }, 600 + extra); // 600ms base + however long dealer cards still need
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
        dispatch({ type:"UPDATE_PLAYER_COUNT", payload: msg.count });
        break;

      case "updateDealerCount":
        // Only used outside of dealerHit flow (e.g. initial deal)
        if (dealerAnimDoneRef.current) {
          dispatch({ type:"UPDATE_DEALER_COUNT", payload: msg.count });
        }
        break;

      case "hit":
        dispatch({ type:"HIT_PLAYER_FROM_SHOE" });
        break;

      case "dealerHit": {
        // values[] from backend = cumulative counts skipping card[0]:
        // e.g. dealer has 6(hidden)+10(visible), draws 4:
        //   GetSum() = [6, 16, 20]  → sent as [16, 20]
        // So values[0] = count after hole reveal, values[1..n] = after each new card
        const counts = msg.values || [];
        console.log("[dealerHit] values:", counts); // debug — remove later

        dealerAnimDoneRef.current  = false;
        dealerCardIndexRef.current = 0;

        if (counts.length === 0) {
          // No cards — just reveal hole
          dispatch({ type:"REVEAL_DEALER_HOLE" });
          const td = setTimeout(() => {
            dealerAnimDoneRef.current = true;
            if (pendingOutcomeRef.current) {
              const { payload, toastMsg, toastType } = pendingOutcomeRef.current;
              pendingOutcomeRef.current = null;
              addToastRef.current(toastMsg, toastType);
              triggerSweep(payload);
            }
          }, 400);
          timersRef.current.push(td);
          sweepExtraDelayRef.current = 400;
          break;
        }

        // Step 0: reveal hole card + update count to values[0]
        dispatch({ type:"REVEAL_DEALER_HOLE" });
        setHoleRevealed(true);
        dispatch({ type:"UPDATE_DEALER_COUNT", payload: counts[0] });

        // Steps 1..n: deal each extra card with staggered timing
        const extraCounts = counts.slice(1); // counts after each drawn card
        extraCounts.forEach((runningCount, i) => {
          const t = setTimeout(() => {
            dispatch({ type:"ADD_DEALER_CARD", payload:{ value: runningCount } });
            dispatch({ type:"UPDATE_DEALER_COUNT", payload: runningCount });
          }, (i + 1) * CARD_ANIM_MS);
          timersRef.current.push(t);
        });

        const lastCardTime = extraCounts.length > 0
          ? extraCounts.length * CARD_ANIM_MS + 350
          : 350;

        const td = setTimeout(() => {
          dealerAnimDoneRef.current = true;
          if (pendingOutcomeRef.current) {
            const { payload, toastMsg, toastType } = pendingOutcomeRef.current;
            pendingOutcomeRef.current = null;
            addToastRef.current(toastMsg, toastType);
            triggerSweep(payload);
          }
        }, lastCardTime);
        timersRef.current.push(td);

        sweepExtraDelayRef.current = lastCardTime;
        break;
      }

      case "playerBust": {
        dispatch({ type:"HIT_PLAYER_FROM_SHOE" });
        const payload = { outcome:"bust", text:"BUST", newBalance: s.balance - s.wager };
        toast(`Bust!`, "bust");
        triggerSweep(payload);
        break;
      }
      case "dealerBust": {
        const payload = { outcome:"win", text:"DEALER BUSTS!", newBalance: s.balance + s.wager };
        if (!dealerAnimDoneRef.current) {
          pendingOutcomeRef.current = { payload, toastMsg:"Dealer busted — you win!", toastType:"win" };
        } else {
          toast("Dealer busted — you win!", "win");
          triggerSweep(payload);
        }
        break;
      }
      case "playerWin": {
        const payload = { outcome:"win", text:"YOU WIN!", newBalance: s.balance + s.wager };
        if (!dealerAnimDoneRef.current) {
          pendingOutcomeRef.current = { payload, toastMsg:`+$${s.wager}`, toastType:"win" };
        } else {
          toast(`+$${s.wager}`, "win");
          triggerSweep(payload);
        }
        break;
      }
      case "dealerWin": {
        const payload = { outcome:"bust", text:"DEALER WINS", newBalance: s.balance - s.wager };
        if (!dealerAnimDoneRef.current) {
          pendingOutcomeRef.current = { payload, toastMsg:`-$${s.wager}`, toastType:"bust" };
        } else {
          toast(`-$${s.wager}`, "bust");
          triggerSweep(payload);
        }
        break;
      }
      case "push": {
        const payload = { outcome:"push", text:"PUSH" };
        if (!dealerAnimDoneRef.current) {
          pendingOutcomeRef.current = { payload, toastMsg:"Push — bet returned", toastType:"push" };
        } else {
          toast("Push — bet returned", "push");
          triggerSweep(payload);
        }
        break;
      }

      case "playerInsuranceChoice": dispatch({ type:"SHOW_INSURANCE"   }); break;
      case "playerSplitChoice":
        splitInitCountsRef.current = []; // arm collector now — updateCount arrives fast after yes
        dispatch({ type:"SHOW_SPLIT_PROMPT" });
        break;

      case "playerBlackJack": {
        const payout = Math.floor(s.wager * 1.5);
        const payload = { outcome:"win", text:"BLACKJACK!", newBalance: s.balance + payout };
        toast(`Blackjack! +$${payout}`, "win");
        triggerSweep(payload);
        break;
      }

      case "dealerBlackjack": {
        const payload = { outcome:"bust", text:"DEALER BLACKJACK", newBalance: s.balance - s.wager };
        dispatch({ type:"REVEAL_DEALER_HOLE" });
        setHoleRevealed(true);
        const t = setTimeout(() => {
          toast("Dealer has Blackjack!", "bust");
          triggerSweep(payload);
        }, 1400);
        timersRef.current.push(t);
        break;
      }

      case "blackjackPush": {
        const payload = { outcome:"push", text:"PUSH — BOTH BLACKJACK" };
        dispatch({ type:"REVEAL_DEALER_HOLE" });
        setHoleRevealed(true);
        const t = setTimeout(() => {
          toast("Both Blackjack — Push!", "push");
          triggerSweep(payload);
        }, 1400);
        timersRef.current.push(t);
        break;
      }

      case "endGame": {
        dispatch({ type: "END_SESSION" });
        break;
      }

      case "updateCount": {
        if (splitInitCountsRef.current !== null) {
          splitInitCountsRef.current.push(msg.count);
          // Only need first count to init — second card is on the other hand
          if (splitInitCountsRef.current.length >= 1) {
            const counts = [...splitInitCountsRef.current];
            splitInitCountsRef.current = null;
            // Build second hand count from playerHand[1] value
            const hand2Count = s.playerHand[1]?.value ?? 0;
            dispatch({ type:"INIT_SPLIT", payload:{ counts: [counts[0], hand2Count] }});
          }
        } else if (s.splitMode) {
          dispatch({ type:"UPDATE_SPLIT_HAND_COUNT", payload:{ handIndex: s.currentSplitHand, count: msg.count }});
        } else {
          dispatch({ type:"UPDATE_PLAYER_COUNT", payload: msg.count });
        }
        break;
      }

      case "secondSplitCounter":
        dispatch({ type:"INIT_SPLIT", payload:{ counts:[s.playerCount, msg.count] }});
        break;

      case "newSplitCounter": {
        const ex = s.splitHands.map(h => h.count);
        dispatch({ type:"INIT_SPLIT", payload:{ counts:[...ex, msg.count] }});
        break;
      }

      case "splitHit":
        dispatch({ type:"SPLIT_HIT_HAND", payload:{ handIndex: s.currentSplitHand, count: msg.currentHandCount }});
        break;

      case "playerSplitBust":
        dispatch({ type:"SPLIT_BUST_HAND", payload: msg.hand });
        dispatch({ type:"UPDATE_BALANCE", payload: msg.updateBalance });
        toast(`Hand ${msg.hand + 1} busted`, "bust");
        break;

      case "playerSplitWin":
        dispatch({ type:"SPLIT_RESOLVE_HAND", payload:{ handIndex: msg.handCount, won: true,  newBalance: msg.updateBalance }});
        break;

      case "dealerSplitWin":
        dispatch({ type:"SPLIT_RESOLVE_HAND", payload:{ handIndex: msg.handCount, won: false, newBalance: msg.updateBalance }});
        break;

      case "playerSplitPush":
        dispatch({ type:"SPLIT_RESOLVE_HAND", payload:{ handIndex: msg.handCount, won: null, newBalance: msg.updateBalance ?? s.balance }});
        break;

      case "playerSplitBlackjack":
        dispatch({ type:"SPLIT_RESOLVE_HAND", payload:{ handIndex: msg.handCount, won: true, newBalance: msg.updateBalance }});
        break;

      case "splitRoundDone": {
        // Wait for dealer to finish drawing before revealing results
        const waitForDealer = () => {
          if (!dealerAnimDoneRef.current) {
            const t = setTimeout(waitForDealer, 200);
            timersRef.current.push(t);
          } else {
            setSplitRevealPending(true);
          }
        };
        const t = setTimeout(waitForDealer, 400);
        timersRef.current.push(t);
        break;
      }
      default: break;
    }
  }, []);

  const handleMessage = useCallback((msg) => {
    const neverQueue = ["endGame", "__connected", "__disconnected"];
    if (neverQueue.includes(msg.event)) {
      processEvent(msg);
      return;
    }
    // All of these must wait for cards to be dealt and visible
    const postDeal = [
      "playerInsuranceChoice", "playerSplitChoice",
      "playerBlackJack", "dealerBlackjack", "blackjackPush",
    ];
    if (postDeal.includes(msg.event)) {
      console.log(`[handleMessage] ${msg.event} arrived at`, Date.now(), `postDealFired=${postDealFiredRef.current} isDeal=${isDealingRef.current}`);
      if (postDealFiredRef.current) {
        postDealQueueRef.current.push(msg);
        const t = setTimeout(() => fireNextPostDeal(), 1800);
        timersRef.current.push(t);
      } else {
        postDealQueueRef.current.push(msg);
      }
      return;
    }
    if (isDealingRef.current) wsQueueRef.current.push(msg);
    else processEvent(msg);
  }, [processEvent]);

  useGameSocket(handleMessage);

  // ═══════════════════════════════════════════
  //  DEAL
  // ═══════════════════════════════════════════
  async function handleDeal() {
    if (state.stagedWager <= 0) { addToast("Place a wager first!", ""); return; }

    // Need at least ~20 cards for a round (generous buffer)
    const remaining = parsedShoeRef.current.length - shoePositionRef.current;
    let needsShuffle = false;

    if (!shoeInitializedRef.current || remaining < 20) {
      // First time or running low — generate fresh shoe and send to backend
      setReshuffling(shoeInitializedRef.current); // only show animation on reshuffle, not first load
      if (shoeInitializedRef.current) {
        await new Promise(res => setTimeout(res, 1800));
        setReshuffling(false);
        addToast("Reshuffling…", "");
      }
      const freshShoe = generateShoe(6);
      parsedShoeRef.current   = freshShoe.map(parseCard);
      shoePositionRef.current = 0;
      shoeInitializedRef.current = true;
      needsShuffle = true;
    }

    const slicedParsed = parsedShoeRef.current.slice(shoePositionRef.current);

    dispatch({ type:"CONFIRM_WAGER" });
    dispatch({ type:"SET_SHOE",    payload: slicedParsed });
    dispatch({ type:"START_ROUND" });
    setShowCounters(false);
    setHoleRevealed(false);
    sweepExtraDelayRef.current  = 0;
    dealerAnimDoneRef.current   = true;
    pendingOutcomeRef.current   = null;
    dealerCardIndexRef.current  = 0;

    isDealingRef.current     = true;
    wsQueueRef.current       = [];
    // NOTE: do NOT clear postDealQueueRef here — events like dealerBlackjack
    // may arrive before deal starts and must survive into the flush
    postDealFiredRef.current = false;
    modalActiveRef.current   = false;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    try {
      await api.sendWager(state.stagedWager);
      if (needsShuffle) {
        const shoeStrings = parsedShoeRef.current.map(c => c.rank + c.suit);
        await api.sendShuffle(shoeStrings);
      }
    } catch {
      addToast("Server error — is the backend running?", "bust");
      isDealingRef.current = false;
      dispatch({ type:"SET_PHASE", payload:"wager" });
      return;
    }

    // Deal order: Dealer↑ Player↑ Dealer↓(hole) Player↑  — indices 0,1,2,3 in shoe
    const steps = [
      "DEAL_DEALER_CARD_FROM_SHOE",
      "DEAL_PLAYER_CARD_FROM_SHOE",
      "DEAL_DEALER_HOLE_FROM_SHOE",
      "DEAL_PLAYER_CARD_FROM_SHOE",
    ];
    steps.forEach((action, i) => {
      const t = setTimeout(() => dispatch({ type: action }), i * DEAL_INTERVAL);
      timersRef.current.push(t);
    });

    const flush = setTimeout(() => {
      console.log(`[flush] fired at`, Date.now(), `postDealQueue length=${postDealQueueRef.current.length}`);
      isDealingRef.current  = false;
      postDealFiredRef.current = true;

      // Flush regular queued WS events
      const q = [...wsQueueRef.current];
      wsQueueRef.current = [];
      q.forEach(msg => processEvent(msg));

      // After breathing room, fire first post-deal event (rest fire after each modal dismiss)
      if (postDealQueueRef.current.length > 0) {
        dispatch({ type:"LOCK_ACTIONS" }); // lock until prompt shows
        const t = setTimeout(() => fireNextPostDeal(), 1800);
        timersRef.current.push(t);
      }

      // Fallback counts from shoe if backend hasn't sent them
      const curState = stateRef.current;
      if (curState.playerCount === 0 && slicedParsed.length >= 4) {
        let v1 = slicedParsed[1]?.value ?? 0;
        let v2 = slicedParsed[3]?.value ?? 0;
        if (v1 + v2 > 21 && (v1 === 11 || v2 === 11)) {
          if (v1 === 11) v1 = 1; else v2 = 1;
        }
        dispatch({ type:"UPDATE_PLAYER_COUNT", payload: v1 + v2 });
      }
      if (curState.dealerCount === 0 && slicedParsed.length >= 1) {
        dispatch({ type:"UPDATE_DEALER_COUNT", payload: slicedParsed[0]?.value ?? 0 });
      }

      dispatch({ type:"DEAL_COMPLETE" });
      setShowCounters(true);
    }, steps.length * DEAL_INTERVAL + 500);
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
    if (doubled > state.balance) { addToast("Can't afford double!", "bust"); return; }
    dispatch({ type:"LOCK_ACTIONS" });
    try {
      await api.sendWager(doubled);
      dispatch({ type:"CONFIRM_WAGER" });
      await api.sendDecision("stand");
    } catch { dispatch({ type:"UNLOCK_ACTIONS" }); }
  }
  async function handleInsurance(yes) {
    dispatch({ type:"HIDE_INSURANCE" });
    modalActiveRef.current = false;
    fireNextPostDeal(); // fire next queued event (e.g. split prompt)
    await api.sendInsurance(yes ? "yes" : "no");
  }
  async function handleSplit(yes) {
    dispatch({ type:"HIDE_SPLIT_PROMPT" });
    modalActiveRef.current = false;
    fireNextPostDeal();
    if (yes) {
      splitInitCountsRef.current = null;
      dispatch({ type:"INIT_SPLIT", payload:{ counts:[0, 0] } }); // enter split mode now
      await api.sendSplit(true);
    } else {
      splitInitCountsRef.current = null;
    }
  }
  async function handleSplitDecision(action) {
    console.log("[split] handleSplitDecision called", action, "locked:", state.actionsLocked, "splitMode:", state.splitMode, "hand:", state.currentSplitHand);
    dispatch({ type:"LOCK_ACTIONS" });
    if (action === "stand") {
      dispatch({ type:"ADVANCE_SPLIT_HAND", payload: state.currentSplitHand + 1 });
    }
    await api.sendSplitDecision(action, state.currentSplitHand);
  }

  const {
    phase, balance, wager, stagedWager,
    playerHand, dealerHand, playerCount, dealerCount,
    splitMode, splitHands, currentSplitHand,
    outcome, resultText, showInsurance, showSplitPrompt,
    actionsLocked, connected,
    sessionWins, sessionLosses, sessionPushes, sessionStart, sessionEnded, sessionEndedAt, startingBalance,
  } = state;

  const now        = new Date();
  const clockStr   = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const betAmount  = phase === "wager" ? stagedWager : wager;
  const isPlaying  = phase === "playing";
  const isWagering = phase === "wager";
  const isDealing  = phase === "dealing";
  const isResult   = phase === "result";

  // Timer freezes when session ends
  const timerEnd       = sessionEndedAt ?? Date.now();
  const sessionElapsed = Math.floor((timerEnd - sessionStart) / 1000);
  const sessionMins    = Math.floor(sessionElapsed / 60);
  const sessionSecs    = sessionElapsed % 60;
  const sessionTimeStr = `${sessionMins}:${String(sessionSecs).padStart(2, "0")}`;
  const sessionProfit  = balance - startingBalance;
  const totalHands     = sessionWins + sessionLosses + sessionPushes;

  // Before hole revealed: show only face-up card value so player can't see full count.
  // After hole revealed (dealerHit): show live dealerCount which updates card by card.
  const dealerDisplayCount = holeRevealed
    ? dealerCount
    : (dealerHand[0]?.value ?? 0);

  return (
    <>
      {(!landed || !connected) && (
        <div className="conn-overlay">
          <div className="conn-inner">
            <div className="conn-suits">♠ ♥ ♦ ♣</div>
            <h1 className="conn-title">BLACKJACK</h1>
            <div className="conn-divider" />

            {!connecting && !landed && (
              <>
                <p className="conn-tagline">Casino-grade. No house advantage.</p>
                <button className="btn btn--play-now" onClick={() => {
                  setConnecting(true);
                  setTimeout(() => setLanded(true), 2200);
                }}>Play Now ›</button>
              </>
            )}

            {connecting && !connected && (
              <>
                <div className="conn-spinner" />
                <p className="conn-status">Connecting to table…</p>
              </>
            )}
          </div>
        </div>
      )}

      <Toasts toasts={toasts} />
      <ResultBanner text={resultText} type={outcome} />
      <ResultBanner key={splitBanner.key} text={splitBanner.text} type={splitBanner.type} />

      {/* ── SESSION ENDED OVERLAY ── */}
      {sessionEnded && (
        <div className="session-overlay">
          <div className="session-card">
            <div className="session-suits">♠ ♥ ♦ ♣</div>
            <h2 className="session-title">Session Over</h2>
            <div className="session-divider" />
            <div className="session-stats">
              <div className="session-stat">
                <span className="session-stat__label">Duration</span>
                <span className="session-stat__val">{sessionTimeStr}</span>
              </div>
              <div className="session-stat">
                <span className="session-stat__label">Hands Played</span>
                <span className="session-stat__val">{totalHands}</span>
              </div>
              <div className="session-stat">
                <span className="session-stat__label">Wins</span>
                <span className="session-stat__val session-stat__val--win">{sessionWins}</span>
              </div>
              <div className="session-stat">
                <span className="session-stat__label">Losses</span>
                <span className="session-stat__val session-stat__val--loss">{sessionLosses}</span>
              </div>
              <div className="session-stat">
                <span className="session-stat__label">Pushes</span>
                <span className="session-stat__val">{sessionPushes}</span>
              </div>
              <div className="session-stat session-stat--profit">
                <span className="session-stat__label">
                  {sessionProfit >= 0 ? "Profit" : "Deficit"}
                </span>
                <span className={`session-stat__val ${sessionProfit >= 0 ? "session-stat__val--win" : "session-stat__val--loss"}`}>
                  {sessionProfit >= 0 ? "+" : ""}${sessionProfit.toLocaleString()}
                </span>
              </div>
            </div>
            <button className="btn btn--deal btn--wide"
              onClick={async () => {
                await api.sendEndSession().catch(() => {});
                window.location.reload();
              }}>New Session</button>
          </div>
        </div>
      )}

      {reshuffling && (
        <div className="reshuffle-overlay">
          <div className="reshuffle-inner">
            <div className="reshuffle-cards">
              {["♠","♥","♦","♣"].map((s,i) => (
                <span key={i} className="reshuffle-suit" style={{ animationDelay:`${i*0.15}s` }}>{s}</span>
              ))}
            </div>
            <p className="reshuffle-text">Reshuffling…</p>
          </div>
        </div>
      )}

      <Modal open={showInsurance} suit="♠" title="Insurance?"
        body="Dealer is showing an Ace. Take insurance for half your wager?"
        yesLabel="Take Insurance" noLabel="Decline"
        onYes={() => handleInsurance(true)} onNo={() => handleInsurance(false)} />

      <Modal open={showSplitPrompt} suit="♣" title="Split Hand?"
        body="You've been dealt a matching pair. Split into two hands?"
        yesLabel="Split" noLabel="Stay"
        onYes={() => handleSplit(true)} onNo={() => handleSplit(false)} />

      <div className="top-clock">{clockStr}</div>

      <div className="room">
        <div className="ceiling-light" />

        {/* ════ TABLE ════ */}
        <div className="table-wrap">
          <div className="table-rail">
            <div className="table-surface">

              {/* ── DEALER ZONE ── */}
              <section className="zone">
                <span className="zone-label">D E A L E R</span>
                <div className="count-above-wrap">
                  {showCounters && dealerDisplayCount > 0 && (
                    <CountRing key={`d-${dealerDisplayCount}`} count={dealerDisplayCount} animate />
                  )}
                </div>
                <div className={["hand-area", sweeping ? "hand-area--sweep-up" : ""].filter(Boolean).join(" ")}>
                  {dealerHand.map((card, i) => (
                    <Card key={i} rank={card.rank} suit={card.suit}
                      color={card.color} symbol={card.symbol}
                      hidden={card.hidden} dealing delay={i * 80}
                      dimmed={outcome === "win"} />
                  ))}
                </div>
              </section>

              {/* Felt rules — curved SVG above arc */}
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
              <section className="zone">
                <span className="zone-label">
                  {splitMode ? "S P L I T   H A N D S" : "Y O U R   H A N D"}
                </span>

                {!splitMode && (
                  <>
                    <div className="count-above-wrap">
                      {showCounters && playerCount > 0 && (
                        <CountRing key={`p-${playerCount}`} count={playerCount} animate />
                      )}
                    </div>
                    <div className={["hand-area",
                      outcome === "win"  ? "hand-area--winner" : "",
                      outcome === "bust" ? "hand-area--loser"  : "",
                      sweeping           ? "hand-area--sweep-down" : "",
                    ].filter(Boolean).join(" ")}>
                      {playerHand.map((card, i) => (
                        <Card key={i} rank={card.rank} suit={card.suit}
                          color={card.color} symbol={card.symbol}
                          hidden={card.hidden} dealing delay={i * 80}
                          dimmed={outcome === "bust"} />
                      ))}
                    </div>
                  </>
                )}

                {splitMode && (
                  <div className={["split-row", sweeping ? "hand-area--sweep-down" : ""].filter(Boolean).join(" ")}>
                    {splitHands.map((hand, idx) => {
                      const isRevealing = splitRevealIndex === idx;
                      const wasRevealed = splitRevealIndex > idx;
                      const showWin  = isRevealing && hand.won === true  && !hand.busted;
                      const showLoss = isRevealing && (hand.won === false || hand.busted);
                      const dimmed   = wasRevealed && (hand.won === false || hand.busted);
                      return (
                        <div key={idx} className={["split-hand-block",
                          idx === currentSplitHand && splitRevealIndex === -1 ? "split-hand-block--active" : "",
                          hand.busted  ? "split-hand-block--busted" : "",
                        ].filter(Boolean).join(" ")}>
                          <div className="split-hand-title">Hand {idx + 1}</div>
                          <div className="count-above-wrap">
                            <CountRing
                              key={`split-${idx}-${hand.count}`}
                              count={hand.count}
                              animate={idx === currentSplitHand}
                            />
                          </div>
                          <div className={["split-hand-cards",
                            showWin  ? "split-hand-cards--win"  : "",
                            showLoss ? "split-hand-cards--loss" : "",
                            dimmed   ? "split-hand-cards--dim"  : "",
                          ].filter(Boolean).join(" ")}>
                            {hand.cards.map((c, ci) => (
                              <Card key={ci} rank={c.rank} suit={c.suit}
                                color={c.color} symbol={c.symbol}
                                dealing delay={ci * 100} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Betting circle — wager phase only */}
              {isWagering && (
                <div className="bet-circle-wrap">
                  <div className={["bet-circle", betAmount > 0 ? "bet-circle--active" : ""].join(" ")}>
                    <span className="bet-circle__label">BET</span>
                    <span className="bet-circle__amount">${betAmount}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ════ HUD ════ */}
        <div className="hud">
          <div className="hud-stats">
            <div className="hud-stat">
              <span className="hud-label">Balance</span>
              <span className="hud-val">${balance.toLocaleString()}</span>
            </div>

            <div className="hud-stat hud-stat--center">
              <span className="hud-label">
                {isWagering ? "Place Your Wager" : isDealing ? "Dealing…" : isPlaying ? "Your Turn" : "Game Over"}
              </span>
              {(isPlaying || isDealing || isResult) && betAmount > 0 && (
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

          {/* Session stats bar */}
          <div className="hud-session">
            <span className="hud-session__stat">
              <span className="hud-session__label">W</span>
              <span className="hud-session__val hud-session__val--win">{sessionWins}</span>
            </span>
            <span className="hud-session__divider">·</span>
            <span className="hud-session__stat">
              <span className="hud-session__label">L</span>
              <span className="hud-session__val hud-session__val--loss">{sessionLosses}</span>
            </span>
            <span className="hud-session__divider">·</span>
            <span className="hud-session__stat">
              <span className="hud-session__label">P</span>
              <span className="hud-session__val">{sessionPushes}</span>
            </span>
            <span className="hud-session__divider">·</span>
            <span className="hud-session__stat">
              <span className={`hud-session__val ${sessionProfit >= 0 ? "hud-session__val--win" : "hud-session__val--loss"}`}>
                {sessionProfit >= 0 ? "+" : ""}${sessionProfit.toLocaleString()}
              </span>
            </span>
            <span className="hud-session__divider">·</span>
            <span className="hud-session__time">{sessionTimeStr}</span>
            <button className="btn btn--end-session"
              onClick={() => dispatch({ type:"END_SESSION" })}>End Session</button>
          </div>

          <div className="hud-actions">
            {isWagering && (
              <>
                <div className="chip-tray">
                  {[5, 25, 50, 100, 500].map(v => (
                    <Chip key={v} value={v}
                      disabled={stagedWager + v > balance}
                      onClick={() => dispatch({ type:"ADD_CHIP", payload: v })} />
                  ))}
                  <Chip key="allin" value="ALL IN" allIn
                    disabled={stagedWager >= balance}
                    onClick={() => dispatch({ type:"SET_WAGER", payload: balance })} />
                </div>
                <div className="wager-row">
                  <button className="btn btn--ghost"
                    onClick={() => dispatch({ type:"CLEAR_WAGER" })}
                    disabled={stagedWager === 0}>Clear Bet</button>
                  <button className="btn btn--deal"
                    onClick={handleDeal}
                    disabled={stagedWager <= 0}>Deal ›</button>
                </div>
              </>
            )}

            {isDealing && (
              <div className="dealing-status">
                <div className="dealing-spinner" /><span>Dealing…</span>
              </div>
            )}

            {isPlaying && !splitMode && (
              <div className="action-row">
                <button className="btn btn--hit"    onClick={handleHit}    disabled={actionsLocked}>HIT</button>
                <button className="btn btn--stand"  onClick={handleStand}  disabled={actionsLocked}>STAND</button>
                <button className="btn btn--double" onClick={handleDouble} disabled={actionsLocked || wager * 2 > balance}>DOUBLE</button>
              </div>
            )}

            {isPlaying && splitMode && (
              <div className="split-controls">
                <div className="split-controls__label">Playing Hand {currentSplitHand + 1} of {splitHands.length}</div>
                <div className="action-row">
                  <button className="btn btn--hit"   onClick={() => handleSplitDecision("hit")}   disabled={actionsLocked}>HIT HAND</button>
                  <button className="btn btn--stand" onClick={() => handleSplitDecision("stand")} disabled={actionsLocked}>STAND HAND</button>
                </div>
              </div>
            )}

            {isResult && (
              <button className="btn btn--deal btn--wide"
                onClick={async () => {
                  shoePositionRef.current += stateRef.current.shoeIndex;
                  // Reset post-deal state so events from new round don't fire prematurely
                  postDealQueueRef.current = [];
                  postDealFiredRef.current = false;
                  modalActiveRef.current   = false;
                  splitInitCountsRef.current = null;
                  setSplitRevealIndex(-1);
                  setSplitBanner({ text: null, type: null });
                  setSplitRevealPending(false);
                  await api.sendNextGame().catch(() => {});
                  dispatch({ type:"NEXT_ROUND" });
                }}>Next Game ›</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}