const CHIP_CONFIG = {
  1:    { bg: "#8B3A6B", edge: "#A0447D", label: "$1"    },
  5:    { bg: "#B5006E", edge: "#C8007C", label: "$5"    },
  25:   { bg: "#B8860B", edge: "#C99A1A", label: "$25"   },
  50:   { bg: "#1A7A6E", edge: "#1E8F81", label: "$50"   },
  100:  { bg: "#9B1C1C", edge: "#B52020", label: "$100"  },
  500:  { bg: "#2A5C2A", edge: "#336633", label: "$500"  },
  1000: { bg: "#1A3D8A", edge: "#1E4AA3", label: "$1000" },
  5000: { bg: "#5C1A8A", edge: "#6E1FA5", label: "$5000" },
  allin:{ bg: "#1a1a1a", edge: "#444444", label: "ALL IN" },
};

function ChipSVG({ cfg, value, fontSize, isAllIn }) {
  const sz = 62, cx = sz / 2;
  const NOTCHES = 16;
  const notchPaths = Array.from({ length: NOTCHES }).map((_, i) => {
    const startDeg = (i * (360 / NOTCHES) - 90) * Math.PI / 180;
    const endDeg   = ((i + 0.55) * (360 / NOTCHES) - 90) * Math.PI / 180;
    const ro = 30, ri = 25.5;
    const x1o = cx + ro * Math.cos(startDeg), y1o = cx + ro * Math.sin(startDeg);
    const x2o = cx + ro * Math.cos(endDeg),   y2o = cx + ro * Math.sin(endDeg);
    const x1i = cx + ri * Math.cos(startDeg), y1i = cx + ri * Math.sin(startDeg);
    const x2i = cx + ri * Math.cos(endDeg),   y2i = cx + ri * Math.sin(endDeg);
    // Inverted: white on even, color on odd
    return { path: `M${x1i},${y1i} L${x1o},${y1o} A${ro},${ro} 0 0,1 ${x2o},${y2o} L${x2i},${y2i} A${ri},${ri} 0 0,0 ${x1i},${y1i}Z`, isWhite: i % 2 === 0 };
  });

  return (
    <svg viewBox={`0 0 ${sz} ${sz}`} width={sz} height={sz} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`face-${value}`} cx="42%" cy="36%" r="60%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.18)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.0)"/>
        </radialGradient>
        <filter id={`shadow-${value}`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.45"/>
        </filter>
      </defs>

      {/* Outer rim base — colored */}
      <circle cx={cx} cy={cx} r="30.5" fill={cfg.edge} filter={`url(#shadow-${value})`}/>

      {/* Notch segments: white stripes on colored rim */}
      {notchPaths.map(({ path, isWhite }, i) => (
        <path key={i} d={path} fill={isWhite ? "#e8e8e8" : cfg.edge}/>
      ))}

      {/* White inlay ring */}
      <circle cx={cx} cy={cx} r="25.5" fill="white"/>
      <circle cx={cx} cy={cx} r="25.5" fill="none" stroke="#bbb" strokeWidth="0.6"/>

      {/* Colored face */}
      <circle cx={cx} cy={cx} r="22" fill={cfg.bg}/>
      <circle cx={cx} cy={cx} r="22" fill={`url(#face-${value})`}/>

      {/* Inner ring details */}
      <circle cx={cx} cy={cx} r="22"   fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4"/>
      <circle cx={cx} cy={cx} r="19.5" fill="none" stroke="rgba(255,255,255,0.2)"  strokeWidth="0.7"/>

      {/* Label */}
      <text
        x={cx} y={cx + fontSize * 0.38}
        textAnchor="middle"
        fontFamily="'Cinzel', Georgia, serif"
        fontWeight="900"
        fontSize={fontSize}
        fill="white"
        letterSpacing="0.3"
      >
        {cfg.label}
      </text>
    </svg>
  );
}

export default function Chip({ value, onClick, disabled, allIn }) {
  if (allIn) {
    const cfg = CHIP_CONFIG.allin;
    return (
      <button className="chip chip--svg chip--allin-svg" onClick={onClick} disabled={disabled} type="button">
        <ChipSVG cfg={cfg} value="allin" fontSize={7.5} isAllIn />
      </button>
    );
  }

  const cfg = CHIP_CONFIG[value] || CHIP_CONFIG[100];
  const fontSize = value >= 1000 ? 7.2 : value >= 100 ? 8.8 : 10.5;

  return (
    <button className="chip chip--svg" onClick={onClick} disabled={disabled} type="button">
      <ChipSVG cfg={cfg} value={value} fontSize={fontSize} />
    </button>
  );
}