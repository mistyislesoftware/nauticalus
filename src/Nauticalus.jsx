import React, { useEffect, useRef, useState, useCallback } from "react";

/* ════════════════════════════════════════════════════════════════════════
   NAUTICALUS — Where the Ocean Makes Its Own Light
   A scroll-driven descent from the night surface to the Challenger Deep.
   React for structure + UI, a single HTML5 canvas engine for the ocean.
   ════════════════════════════════════════════════════════════════════════ */

/* ───────────────────────────── utilities ───────────────────────────── */
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const interp = (table, x) => {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      return lerp(y0, y1, (x - x0) / (x1 - x0));
    }
  }
  return table[table.length - 1][1];
};
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const sup = (n) => String(n).split("").map((c) => SUP[c] || c).join("");

/* ───────────────────────────── content ───────────────────────────── */
const ZONES = [
  {
    num: "I",
    short: "Sunlight",
    label: "The Sunlit Sea",
    layer: "Epipelagic",
    range: "0 — 200 m",
    depth: 0,
    accent: "#7ff0ff",
    title: "The Sunlit Sea, After Dark",
    intro:
      "When the sun goes down, the upper ocean switches on. Trillions of single-celled dinoflagellates drift in the surface water, each carrying a chemical flash. Disturb them and they answer in blue.",
    hint: ["Move to stir the plankton · click to send a pulse", "Drag to stir the plankton · tap to send a pulse"],
    cards: [
      {
        key: "noctiluca",
        name: "Sea Sparkle",
        latin: "Noctiluca scintillans",
        depth: "Surface waters",
        light: "≈ 475 nm",
        color: "#49c8ff",
        text:
          "A single cell, barely a millimetre across, that flashes when the water around it is bent or sheared — by a wave, an oar, a passing fish. The light comes from thousands of tiny pockets called scintillons, each firing for about a tenth of a second.",
        aside: "Why flash? The ‘burglar alarm’ theory: a grazer suddenly lit up becomes visible to its own predators.",
      },
      {
        key: "aequorea",
        name: "Crystal Jelly",
        latin: "Aequorea victoria",
        depth: "Upper waters · North Pacific",
        light: "≈ 509 nm",
        color: "#7dffb2",
        text:
          "Its bell is rimmed with light organs. A protein called aequorin makes blue light; a second protein re-emits it as green. That second protein — GFP — was isolated by Osamu Shimomura in 1962 and now lets scientists watch living cells from the inside.",
        aside: "GFP earned Shimomura, Chalfie and Tsien the 2008 Nobel Prize in Chemistry.",
      },
      {
        key: "ctenophore",
        name: "Comb Jelly",
        latin: "Mnemiopsis leidyi",
        depth: "Coastal & surface waters",
        light: "≈ 485 nm",
        color: "#5fe6ff",
        text:
          "The rainbows racing along its eight rows of combs aren’t its own light — they’re light scattering off beating cilia. Its true bioluminescence is subtler: blue-green flashes along the same rows when it’s touched in the dark.",
        aside: "Comb jellies are the largest animals known to swim using cilia.",
      },
    ],
    pull: {
      text: "In 1995, the crew of the SS Lima sailed for six hours through a sea that glowed white to the horizon.",
      sub: "Satellites later showed the ‘milky sea’ covered roughly 15,400 km² — most likely lit by luminous bacteria.",
      src: "Miller et al., PNAS, 2005",
    },
  },
  {
    num: "II",
    short: "Twilight",
    label: "The Twilight Zone",
    layer: "Mesopelagic",
    range: "200 — 1,000 m",
    depth: 200,
    accent: "#9db4ff",
    title: "The Twilight Zone",
    intro:
      "Sunlight fades to a faint blue ceiling. Down here your silhouette is what gets you eaten — so animals use light to vanish, to signal, and to find each other in the gloom.",
    hint: ["You are the predator · move through the school · click to startle", "You are the predator · drag through the school · tap to startle"],
    cards: [
      {
        key: "lanternfish",
        name: "Lanternfish",
        latin: "Family Myctophidae",
        depth: "≈ 300 — 1,200 m by day",
        light: "≈ 470 — 490 nm",
        color: "#7aa8ff",
        text:
          "Around 250 species, and among the most abundant vertebrates on Earth. Each carries rows of photophores in a pattern unique to its species — a living barcode for recognising a mate in the dark.",
        aside: "Their schools reflect sonar so strongly that wartime operators mistook them for a false sea floor: the ‘deep scattering layer’.",
      },
      {
        key: "hatchetfish",
        name: "Silver Hatchetfish",
        latin: "Argyropelecus aculeatus",
        depth: "≈ 100 — 600 m",
        light: "Matched to daylight",
        color: "#a9c4ff",
        text:
          "Thin as a blade and lined with downward-facing photophores. It tunes their glow to match the dim light filtering from above, erasing its own silhouette for any predator looking up.",
        aside: "Counter-illumination is one of the most widespread uses of light in the ocean.",
      },
      {
        key: "firefly",
        name: "Firefly Squid",
        latin: "Watasenia scintillans",
        depth: "≈ 200 — 600 m",
        light: "≈ 470 nm",
        color: "#5b9dff",
        text:
          "About 7 cm long, studded with hundreds of tiny photophores and tipped with three brilliant ones on each of its fourth pair of arms. Each spring, millions rise to spawn in Japan’s Toyama Bay, turning the shoreline electric blue.",
        aside: "Tap or click near one to make it flash.",
      },
    ],
    pull: {
      text: "Every night, billions of animals rise hundreds of metres to feed — and sink back before dawn.",
      sub: "Diel vertical migration: the largest migration on Earth, repeated every 24 hours.",
      src: "",
    },
  },
  {
    num: "III",
    short: "Midnight",
    label: "The Midnight Zone",
    layer: "Bathypelagic",
    range: "1,000 — 4,000 m",
    depth: 1000,
    accent: "#5b8cff",
    title: "The Midnight Zone",
    intro:
      "No sunlight has ever reached this deep. Every photon here was made by something alive — a lure, an alarm, a decoy. In permanent night, a glow is either an invitation or a warning.",
    hint: ["Press & hold to sound the alarm · beware the lure", "Touch & hold to sound the alarm · beware the lure"],
    cards: [
      {
        key: "angler",
        name: "Humpback Anglerfish",
        latin: "Melanocetus johnsonii",
        depth: "Down to ≈ 4,500 m",
        light: "Bacterial · blue-white",
        color: "#bfe8ff",
        text:
          "The lure isn’t the fish’s own light. Its tip, the esca, is a culture chamber for luminous bacteria that the fish hosts and feeds. Prey drift toward the glow; the jaws do the rest.",
        aside: "In some anglerfish families, tiny males fuse permanently to the female, sharing her bloodstream.",
      },
      {
        key: "atolla",
        name: "Atolla Jellyfish",
        latin: "Atolla wyvillei",
        depth: "Deep sea, worldwide",
        light: "≈ 470 nm",
        color: "#4d7dff",
        text:
          "When something grabs it, it sets off a spinning pinwheel of blue light — a ‘burglar alarm’ that can summon a bigger predator to attack its attacker. Its deep red bell is invisible here, where red light doesn’t exist.",
        aside: "In 2012, a lure mimicking this display — the e-Jelly — helped film a giant squid in its natural habitat for the first time.",
      },
      {
        key: "loosejaw",
        name: "Stoplight Loosejaw",
        latin: "Malacosteus niger",
        depth: "≈ 500 — 4,000 m",
        light: "≈ 705 nm · red",
        color: "#ff3347",
        text:
          "It shines a red searchlight that almost nothing else down here can see — a private sniper scope for spotting prey. To see its own beam it appears to use a chlorophyll-derived pigment, obtained from its diet.",
        aside: "Most deep-sea fish have no visual pigment tuned to red at all — to them, the beam is pitch black.",
      },
    ],
    pull: {
      text: "Blue travels farthest through seawater — so almost all deep-sea light is blue, and most deep-sea eyes are blind to red.",
      sub: "Most marine bioluminescence is blue-green, peaking near 470–490 nanometres.",
      src: "",
    },
  },
  {
    num: "IV",
    short: "Abyss",
    label: "The Abyss",
    layer: "Abyssopelagic · Hadal",
    range: "4,000 — 10,935 m",
    depth: 4000,
    accent: "#c9d6ff",
    title: "The Abyss",
    intro:
      "Near-freezing, crushing, and almost perfectly dark. Food arrives as a slow snowfall from the sunlit world far above. Light is rarer now — which makes every flash matter.",
    hint: ["Steer the lamp · click to flare · press S to ping sonar", "Drag to steer the lamp · tap SONAR to ping"],
    cards: [
      {
        key: "snow",
        name: "Marine Snow",
        latin: "Organic detritus",
        depth: "Surface → sea floor",
        light: "Bacterial · blue-green",
        color: "#9ff5e0",
        text:
          "A ceaseless fall of dead plankton, mucus and waste — the main food supply of the deep. Some flakes glow: luminous bacteria colonise them, possibly to get eaten, since a fish gut is a richer home than open water.",
        aside: "A single flake can take weeks to reach the bottom.",
      },
      {
        key: "cucumber",
        name: "Swimming Sea Cucumber",
        latin: "Enypniastes eximia",
        depth: "Deep slopes & plains",
        light: "Blue flash",
        color: "#7fb4ff",
        text:
          "Translucent enough to see its gut, and nicknamed the ‘headless chicken monster’. When attacked it glows, and can shed its sticky, luminous skin onto the attacker — tagging it for other predators to find.",
        aside: "Hold the lamp on one to see what happens.",
      },
      {
        key: "snailfish",
        name: "Hadal Snailfish",
        latin: "Genus Pseudoliparis",
        depth: "Deepest fish · 8,336 m",
        light: "None",
        color: "#ffd6e0",
        text:
          "In 2022 a snailfish was filmed 8,336 m down in the Izu-Ogasawara Trench — the deepest fish ever recorded. It makes no light at all. Beyond about 8,200 m, the chemistry that shields fish proteins from pressure is thought to reach its limit.",
        aside: "Only your lamp can find it.",
      },
    ],
    pull: {
      text: "At the bottom of the Challenger Deep, the water presses down with more than a thousand atmospheres.",
      sub: "That is more than a tonne pressing on every square centimetre.",
      src: "",
    },
  },
];

const LOG = [
  { id: "stir", zone: "I", title: "Sea sparkle", desc: "You stirred a bloom of dinoflagellates into light." },
  { id: "gfp", zone: "I", title: "Green fluorescence", desc: "You lingered on a crystal jelly until its ring glowed green." },
  { id: "school", zone: "II", title: "Panic in the school", desc: "You scattered a school of lanternfish — watch the flash ripple through." },
  { id: "squid", zone: "II", title: "Firefly flash", desc: "You startled a firefly squid into a full-body flash." },
  { id: "lure", zone: "III", title: "Too close to the light", desc: "You followed the anglerfish’s lure. It did not end well." },
  { id: "alarm", zone: "III", title: "Burglar alarm", desc: "You set off a bioluminescent burglar alarm." },
  { id: "giant", zone: "III", title: "Something bigger", desc: "A full alarm drew in Architeuthis — the giant squid, whose eyes can reach 27 cm across." },
  { id: "lastlight", zone: "II–III", title: "The last light", desc: "You watched the final trace of sunlight vanish near 1,000 m — the limit of the most sensitive eyes on Earth." },
  { id: "leviathan", zone: "II–III", title: "Leviathan", desc: "In total darkness, a sperm whale passed within metres — revealed only by the plankton it set alight." },
  { id: "cucumber", zone: "IV", title: "Tagged", desc: "A swimming sea cucumber shed its glowing skin to mark you." },
  { id: "vent", zone: "IV", title: "Black smokers", desc: "Sonar traced hydrothermal chimneys venting fluid at up to ~400 °C. Vents also give off a faint glow of their own — invisible to us, first detected in 1988." },
  { id: "whalefall", zone: "IV", title: "Whale fall", desc: "An echo off bone. A sunken whale can feed a deep-sea community for decades — including Osedax, the ‘bone-eating’ worms formally described in 2004." },
  { id: "dumbo", zone: "IV", title: "Curious dumbo", desc: "A dumbo octopus came to investigate your ping. One filmed at 6,957 m in the Java Trench in 2020 is the deepest octopus ever recorded." },
  { id: "phantom", zone: "IV", title: "The phantom", desc: "You tracked an unknown contact to Stygiomedusa gigantea, the giant phantom jelly — seen only about a hundred times since 1899." },
  { id: "floor", zone: "IV", title: "Challenger Deep", desc: "You reached 10,935 metres — the deepest known point on Earth." },
];

const HUD_ZONE = ["Surface · Night", "I · The Sunlit Sea", "II · The Twilight Zone", "III · The Midnight Zone", "IV · The Abyss"];
const CURSOR_LABEL = ["stir", "stir", "hunt", "hold", "lamp"];

/* ───────────────────────────── styles ───────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Manrope:wght@300;400;500&family=JetBrains+Mono:wght@300;400&display=swap');

html,body{margin:0;padding:0;background:#01030a;}
html{scrollbar-width:none;}
html::-webkit-scrollbar{display:none;}

.nx{
  --serif:"Cormorant Garamond","Cormorant","Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;
  --sans:"Manrope","Inter","Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;
  --mono:"JetBrains Mono","IBM Plex Mono","SF Mono",ui-monospace,Menlo,Consolas,monospace;
  --ink:#e4f1ff; --ink2:rgba(214,232,252,.66); --ink3:rgba(214,232,252,.38); --line:rgba(190,220,255,.14);
  --accent:#7ff0ff; --ease:cubic-bezier(.16,.84,.2,1);
  position:relative; color:var(--ink); font-family:var(--sans); background:#01030a;
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; overflow-x:clip;
  user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; -webkit-tap-highlight-color:transparent;
}
.nx *{box-sizing:border-box;}
.nx[data-zone="0"],.nx[data-zone="1"]{--accent:#7ff0ff;}
.nx[data-zone="2"]{--accent:#a3b8ff;}
.nx[data-zone="3"]{--accent:#6b97ff;}
.nx[data-zone="4"]{--accent:#cfdaff;}
.nx.has-cursor, .nx.has-cursor *{cursor:none !important;}

.nx-canvas{position:fixed;left:0;top:0;width:100vw;height:100vh;display:block;z-index:0;touch-action:pan-y;}
.nx-vignette{position:fixed;inset:0;pointer-events:none;z-index:1;
  background:radial-gradient(130% 95% at 50% 45%,transparent 50%,rgba(0,0,0,.62) 100%);}
.nx-grain{position:fixed;left:-50%;top:-50%;width:200%;height:200%;pointer-events:none;z-index:2;opacity:.06;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  animation:nxGrain 1.2s steps(6) infinite;}
@keyframes nxGrain{0%{transform:translate(0,0)}17%{transform:translate(-4%,3%)}33%{transform:translate(3%,-5%)}50%{transform:translate(-6%,-2%)}67%{transform:translate(5%,4%)}83%{transform:translate(-2%,6%)}100%{transform:translate(0,0)}}
.nx-flash{position:fixed;inset:0;pointer-events:none;z-index:9;background:#000;opacity:0;}
.nx-edge{position:fixed;left:0;right:0;pointer-events:none;z-index:8;}
.nx-edge.t{top:0;height:130px;background:linear-gradient(to bottom,rgba(1,3,10,.78),rgba(1,3,10,.35) 55%,rgba(1,3,10,0));}
.nx-edge.b{bottom:0;height:200px;background:linear-gradient(to top,rgba(1,3,10,.8),rgba(1,3,10,.4) 50%,rgba(1,3,10,0));}

/* ── header ── */
.nx-head{position:fixed;top:0;left:0;right:0;z-index:30;display:flex;align-items:center;justify-content:space-between;
  padding:22px clamp(18px,3vw,40px);pointer-events:none;opacity:0;transform:translateY(-10px);transition:opacity 1.4s var(--ease) .2s,transform 1.4s var(--ease) .2s;}
.nx.is-ready .nx-head{opacity:1;transform:none;}
.nx-head > *{pointer-events:auto;}
.nx-logo{display:flex;align-items:center;gap:12px;font-family:var(--mono);font-size:11px;letter-spacing:.42em;color:var(--ink);text-decoration:none;background:none;border:0;padding:0;cursor:pointer;}
.nx-logo svg{width:22px;height:22px;overflow:visible;}
.nx-logo .pulse{transform-origin:11px 17px;animation:nxPulse 2.6s ease-in-out infinite;}
@keyframes nxPulse{0%,100%{opacity:.35;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}
.nx-zlabel{position:absolute;left:50%;transform:translateX(-50%);font-family:var(--mono);font-size:10.5px;letter-spacing:.32em;text-transform:uppercase;color:var(--ink2);white-space:nowrap;pointer-events:none;}
.nx-zlabel span{display:inline-block;animation:nxFadeUp .9s var(--ease) both;}
.nx-zlabel i{font-style:normal;color:var(--accent);transition:color 1s;}
@keyframes nxFadeUp{from{opacity:0;transform:translateY(8px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
.nx-tools{display:flex;gap:10px;align-items:center;}
.nx-btn{font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink);background:rgba(3,10,22,.35);
  border:1px solid var(--line);border-radius:40px;padding:10px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:border-color .4s,background .4s,color .4s;}
.nx-btn:hover{border-color:color-mix(in srgb,var(--accent) 55%,transparent);background:rgba(10,30,50,.45);}
.nx-btn:focus-visible,.nx-mark:focus-visible,.nx-cta:focus-visible,.nx-card:focus-visible{outline:1px solid var(--accent);outline-offset:4px;}
.nx-bars{display:flex;gap:2px;align-items:flex-end;height:10px;}
.nx-bars i{display:block;width:2px;height:2px;background:var(--accent);transition:height .3s;}
.nx-bars.on i{animation:nxBar 1s ease-in-out infinite;}
.nx-bars.on i:nth-child(2){animation-delay:-.3s}.nx-bars.on i:nth-child(3){animation-delay:-.6s}.nx-bars.on i:nth-child(4){animation-delay:-.15s}
@keyframes nxBar{0%,100%{height:2px}50%{height:10px}}
.nx-count{color:var(--accent);}

/* ── depth gauge ── */
.nx-gauge{position:fixed;right:clamp(14px,2.4vw,34px);top:50%;height:56vh;width:120px;transform:translateY(-50%);z-index:20;
  opacity:0;transition:opacity 1.6s var(--ease) .5s;pointer-events:none;}
.nx.is-ready .nx-gauge{opacity:1;}
.nx-track{position:absolute;right:0;top:0;bottom:0;width:1px;background:var(--line);}
.nx-ticks{position:absolute;right:0;top:0;bottom:0;width:6px;
  background:repeating-linear-gradient(to bottom,rgba(190,220,255,.18) 0 1px,transparent 1px 2.5%);}
.nx-fill{position:absolute;right:0;top:0;width:1px;height:100%;transform-origin:top;transform:scaleY(0);
  background:linear-gradient(to bottom,transparent,var(--accent));box-shadow:0 0 8px var(--accent);transition:background 1s;}
.nx-mark{position:absolute;right:-6px;transform:translateY(-50%);display:flex;align-items:center;gap:10px;background:none;border:0;padding:6px 0 6px 10px;
  cursor:pointer;color:var(--ink3);font-family:var(--mono);font-size:9.5px;letter-spacing:.18em;pointer-events:auto;transition:color .5s;text-align:right;}
.nx-mark b{font-weight:400;display:block;}
.nx-mark em{font-style:normal;display:block;opacity:0;transform:translateX(6px);transition:opacity .5s,transform .5s;color:var(--ink2);font-size:8.5px;letter-spacing:.22em;text-transform:uppercase;margin-top:3px;}
.nx-mark:hover,.nx-mark.on{color:var(--ink);}
.nx-mark:hover em,.nx-mark.on em{opacity:1;transform:none;}
.nx-mark::after{content:"";width:13px;height:13px;border:1px solid currentColor;border-radius:50%;transform:scale(.45);transition:transform .5s var(--ease),border-color .5s;flex:none;}
.nx-mark.on::after{transform:scale(1);border-color:var(--accent);}
.nx-dot{position:absolute;right:-3px;top:0;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px 2px var(--accent);transform:translateY(-50%);transition:background 1s;}
.nx-now{position:absolute;right:16px;top:0;transform:translateY(-50%);font-family:var(--mono);font-size:10px;letter-spacing:.12em;color:var(--accent);white-space:nowrap;opacity:0;transition:opacity .4s;}
.nx-gauge.moving .nx-now{opacity:1;}

/* ── readout ── */
.nx-readout{position:fixed;left:clamp(18px,3vw,40px);bottom:clamp(18px,3.4vh,36px);z-index:20;pointer-events:none;opacity:0;transform:translateY(10px);
  transition:opacity 1.6s var(--ease) .7s,transform 1.6s var(--ease) .7s;}
.nx.is-ready .nx-readout{opacity:1;transform:none;}
.nx-depth{font-family:var(--serif);font-weight:300;font-size:clamp(2.4rem,5.2vw,4.6rem);line-height:.9;letter-spacing:-.01em;font-variant-numeric:lining-nums tabular-nums;display:flex;align-items:baseline;gap:.18em;}
.nx-depth small{font-family:var(--mono);font-size:.2em;letter-spacing:.2em;color:var(--accent);transition:color 1s;}
.nx-stats{display:flex;gap:18px;margin-top:12px;font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;color:var(--ink3);text-transform:uppercase;}
.nx-stats b{display:block;font-weight:400;color:var(--ink2);font-size:11px;letter-spacing:.06em;margin-top:4px;text-transform:none;font-variant-numeric:tabular-nums;}

/* ── hint ── */
.nx-hint{position:fixed;left:50%;bottom:clamp(18px,3.4vh,36px);transform:translateX(-50%);z-index:20;pointer-events:none;font-family:var(--mono);font-size:9.5px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--ink2);display:flex;align-items:center;gap:12px;white-space:nowrap;opacity:0;transition:opacity 1.6s var(--ease) 1s;}
.nx.is-ready .nx-hint{opacity:1;}
.nx-hint span{animation:nxFadeUp 1s var(--ease) both;}
.nx-hint i{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);animation:nxPulse 2s ease-in-out infinite;flex:none;}

/* ── cursor ── */
.nx-cur{position:fixed;left:0;top:0;width:48px;height:48px;margin:-24px 0 0 -24px;z-index:60;pointer-events:none;will-change:transform;transition:opacity .4s;}
.nx-cur svg{width:100%;height:100%;overflow:visible;transition:transform .5s var(--ease);}
.nx-cur .r1{fill:none;stroke:rgba(220,240,255,.5);stroke-width:1;}
.nx-cur .r2{fill:none;stroke:var(--accent);stroke-width:2;stroke-dasharray:113.1;stroke-dashoffset:113.1;transform:rotate(-90deg);transform-origin:24px 24px;filter:drop-shadow(0 0 4px var(--accent));}
.nx-cur.hover svg{transform:scale(1.7);}
.nx-cur.hover .r1{stroke:var(--accent);}
.nx-cur b{position:absolute;left:50%;top:100%;transform:translate(-50%,6px);font-family:var(--mono);font-weight:400;font-size:8.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--ink2);white-space:nowrap;transition:opacity .3s;}
.nx-cur.hover b{opacity:0;}
.nx-cdot{position:fixed;left:0;top:0;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:#fff;z-index:61;pointer-events:none;box-shadow:0 0 8px 2px var(--accent);will-change:transform;}
.nx:not(.has-cursor) .nx-cur,.nx:not(.has-cursor) .nx-cdot{display:none;}

/* ── content ── */
.nx-main{position:relative;z-index:5;}
.nx-sec{position:relative;padding:0 clamp(22px,8vw,140px);}
.nx-hero{height:100vh;min-height:520px;}
.nx-eyebrow{position:absolute;left:0;right:0;top:auto;bottom:calc(100% - var(--ty,38vh) + var(--fs,150px)*.72);text-align:center;line-height:2;font-family:var(--mono);font-size:10px;letter-spacing:.48em;text-transform:uppercase;color:var(--ink2);
  opacity:0;transition:opacity 2s var(--ease) .3s;padding:0 20px;}
.nx-tag{position:absolute;left:0;right:0;top:calc(var(--ty,38vh) + var(--fs,150px)*.52);text-align:center;margin:0;font-family:var(--serif);font-style:italic;font-weight:300;
  font-size:clamp(1.15rem,2.2vw,1.9rem);letter-spacing:.02em;color:var(--ink2);padding:0 20px;}
.nx-tag .w>span{transition-delay:calc(.25s + var(--i)*90ms);}
.nx.is-ready .nx-eyebrow{opacity:1;}
.nx-cta{position:absolute;left:50%;bottom:clamp(70px,11vh,120px);transform:translateX(-50%);width:104px;height:104px;border-radius:50%;background:none;border:0;padding:0;cursor:pointer;color:var(--ink);
  opacity:0;transition:opacity 2s var(--ease) .9s;}
.nx.is-ready .nx-cta{opacity:1;}
.nx-cta svg{width:100%;height:100%;overflow:visible;}
.nx-cta .spin{transform-origin:52px 52px;animation:nxSpin 18s linear infinite;}
.nx-cta text{font-family:var(--mono);font-size:7.6px;letter-spacing:.34em;fill:var(--ink2);text-transform:uppercase;}
.nx-cta .arrow{stroke:var(--accent);fill:none;stroke-width:1;animation:nxDrop 2.2s var(--ease) infinite;}
.nx-cta:hover .ring{stroke:var(--accent);}
.nx-cta .ring{stroke:var(--line);fill:none;transition:stroke .4s;}
@keyframes nxSpin{to{transform:rotate(360deg)}}
@keyframes nxDrop{0%{transform:translateY(-8px);opacity:0}40%{opacity:1}100%{transform:translateY(10px);opacity:0}}

.nx-zone{padding-top:28vh;padding-bottom:12vh;}
.nx-zone:last-child{padding-bottom:0;}
.nx-zhead{position:relative;min-height:92vh;display:flex;flex-direction:column;justify-content:center;max-width:980px;}
.nx-znum{position:absolute;right:-2vw;top:50%;margin-top:-.5em;font-family:var(--serif);font-weight:300;font-size:clamp(9rem,30vw,28rem);line-height:1;color:transparent;
  -webkit-text-stroke:1px color-mix(in srgb,var(--zc) 32%,transparent);pointer-events:none;letter-spacing:-.04em;will-change:transform;}
.nx-zmeta{font-family:var(--mono);font-size:10.5px;letter-spacing:.32em;text-transform:uppercase;color:var(--zc);display:flex;gap:14px;align-items:center;flex-wrap:wrap;}
.nx-zmeta::before{content:"";width:38px;height:1px;background:var(--zc);box-shadow:0 0 8px var(--zc);}
.nx-h2{font-family:var(--serif);font-weight:300;font-size:clamp(3rem,8.2vw,8rem);line-height:.92;letter-spacing:-.015em;margin:.32em 0 .38em;max-width:11em;}
.nx-h2 em{font-style:italic;color:var(--zc);}
.nx-intro{font-size:clamp(1rem,1.22vw,1.18rem);line-height:1.75;font-weight:300;color:var(--ink2);max-width:33em;margin:0;}
.nx-zhint{margin-top:34px;display:inline-flex;align-items:center;gap:12px;font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink);}
.nx-zhint::before{content:"";width:8px;height:8px;border-radius:50%;border:1px solid var(--zc);box-shadow:0 0 12px var(--zc);animation:nxPulse 2.2s ease-in-out infinite;}

.nx-card{position:relative;width:min(470px,100%);margin:52vh 0;padding:30px 32px 30px 34px;
  background:linear-gradient(100deg,rgba(1,6,16,.72),rgba(1,6,16,.32) 62%,rgba(1,6,16,0));
  border-left:1px solid color-mix(in srgb,var(--zc) 45%,transparent);cursor:default;outline:none;
  transition:border-color .5s,background .6s;}
.nx-card.right{margin-left:auto;}
.nx-card::before{content:"";position:absolute;left:-1px;top:0;width:1px;height:0;background:var(--zc);box-shadow:0 0 10px var(--zc);transition:height 1.1s var(--ease);}
.nx-card:hover::before,.nx-card.focus::before{height:100%;}
.nx-idx{font-family:var(--mono);font-size:9.5px;letter-spacing:.3em;color:var(--ink3);display:flex;justify-content:space-between;gap:12px;text-transform:uppercase;}
.nx-idx span:last-child{color:var(--zc);opacity:0;transform:translateX(-6px);transition:opacity .5s,transform .5s;}
.nx-card:hover .nx-idx span:last-child,.nx-card.focus .nx-idx span:last-child{opacity:1;transform:none;}
.nx-card h3{font-family:var(--serif);font-weight:400;font-size:clamp(2rem,3.3vw,2.9rem);line-height:1;margin:16px 0 6px;letter-spacing:-.005em;}
.nx-latin{font-family:var(--serif);font-style:italic;font-weight:300;font-size:1.12rem;color:var(--ink2);}
.nx-facts{display:flex;gap:26px;margin:20px 0 18px;padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.nx-facts div{font-family:var(--mono);font-size:8.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink3);}
.nx-facts b{display:flex;align-items:center;gap:8px;margin-top:6px;font-weight:400;font-size:11px;letter-spacing:.04em;color:var(--ink);text-transform:none;}
.nx-chip{width:8px;height:8px;border-radius:50%;flex:none;}
.nx-card p{margin:0;font-size:.95rem;line-height:1.72;font-weight:300;color:var(--ink2);}
.nx-aside{margin-top:14px !important;padding-left:14px;border-left:1px solid var(--line);font-family:var(--serif);font-style:italic;font-size:1.02rem !important;line-height:1.5 !important;color:var(--ink) !important;opacity:.82;}

.nx-pull{max-width:1040px;margin:40vh auto;text-align:center;position:relative;}
.nx-pull blockquote{margin:0;font-family:var(--serif);font-weight:300;font-style:italic;font-size:clamp(1.8rem,4.1vw,3.9rem);line-height:1.12;letter-spacing:-.005em;}
.nx-pull p{margin:26px auto 0;max-width:36em;font-size:.98rem;line-height:1.7;color:var(--ink2);font-weight:300;}
.nx-pull cite{display:block;margin-top:18px;font-style:normal;font-family:var(--mono);font-size:9.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--ink3);}
.nx-pull::before{content:"";display:block;width:1px;height:80px;margin:0 auto 38px;background:linear-gradient(to bottom,transparent,var(--zc));}

.nx-finale{height:100vh;min-height:600px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;padding-top:clamp(90px,15vh,150px);margin-top:30vh;}
.nx-fmeta{font-family:var(--mono);font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:var(--ink2);}
.nx-big{font-family:var(--serif);font-weight:300;font-size:clamp(4.6rem,min(16vw,21vh),14rem);line-height:.86;letter-spacing:-.03em;margin:.12em 0 .08em;
  background:linear-gradient(180deg,#ffffff 10%,#9fdcff 55%,rgba(90,140,255,.35));-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 40px rgba(100,170,255,.35));}
.nx-big i{font-style:italic;font-size:.42em;vertical-align:.6em;margin:0 .1em;}
.nx-ftext{max-width:36em;font-size:clamp(.98rem,1.2vw,1.12rem);line-height:1.7;font-weight:300;color:var(--ink2);margin:0 auto;}
.nx-finale .nx-credits{margin-top:16px;}
.nx-ascend{margin-top:30px;font-family:var(--mono);font-size:10.5px;letter-spacing:.32em;text-transform:uppercase;color:var(--ink);background:none;border:1px solid var(--line);
  border-radius:60px;padding:18px 28px;display:inline-flex;gap:14px;align-items:center;cursor:pointer;transition:border-color .5s,box-shadow .5s;}
.nx-ascend:hover{border-color:var(--accent);box-shadow:0 0 30px -6px var(--accent);}
.nx-ascend svg{width:12px;height:12px;stroke:var(--accent);fill:none;}
.nx-credits{margin-top:60px;font-family:var(--mono);font-size:9px;letter-spacing:.22em;color:var(--ink3);text-transform:uppercase;line-height:2;}

/* ── reveal ── */
[data-r]{opacity:0;transform:translateY(36px);transition:opacity 1.4s var(--ease),transform 1.6s var(--ease);}
[data-r].is-in{opacity:1;transform:none;}
.w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em;}
.w>span{display:inline-block;transform:translateY(108%);transition:transform 1.3s var(--ease);transition-delay:calc(var(--i)*70ms);}
.is-in .w>span,.nx.is-ready .nx-tag .w>span{transform:none;}
[data-r] .nx-fade{opacity:0;transition:opacity 1.6s var(--ease) .5s;}
[data-r].is-in .nx-fade{opacity:1;}

/* ── toast + log ── */
.nx-toast{position:fixed;right:clamp(18px,3vw,40px);top:78px;z-index:40;transform:translate(0,-14px);opacity:0;pointer-events:none;transition:opacity .6s var(--ease),transform .8s var(--ease);
  width:min(340px,calc(100vw - 36px));padding:16px 20px;background:rgba(2,8,20,.7);border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 20px 60px -20px rgba(0,0,0,.8),0 0 40px -18px var(--accent);}
.nx-toast.show{opacity:1;transform:none;}
.nx-toast small{display:flex;justify-content:space-between;font-family:var(--mono);font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:var(--accent);}
.nx-toast strong{display:block;font-family:var(--serif);font-weight:400;font-size:1.55rem;margin:6px 0 2px;}
.nx-toast span{font-size:.86rem;line-height:1.55;color:var(--ink2);font-weight:300;}

.nx-log{position:fixed;top:0;right:0;bottom:0;width:min(400px,100vw);z-index:50;background:rgba(2,6,16,.88);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border-left:1px solid var(--line);transform:translateX(102%);transition:transform .8s var(--ease);padding:90px 32px 40px;overflow-y:auto;}
.nx-log.open{transform:none;}
.nx-log h4{margin:0 0 6px;font-family:var(--serif);font-weight:300;font-size:2.4rem;}
.nx-log > p{margin:0 0 28px;font-size:.88rem;color:var(--ink2);line-height:1.6;font-weight:300;}
.nx-log ol{list-style:none;margin:0;padding:0;}
.nx-log li{display:grid;grid-template-columns:44px 1fr;gap:4px 10px;padding:16px 0;border-top:1px solid var(--line);}
.nx-log li .z{font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;color:var(--ink3);padding-top:4px;}
.nx-log li strong{font-family:var(--serif);font-weight:400;font-size:1.2rem;}
.nx-log li span{grid-column:2;font-size:.82rem;line-height:1.5;color:var(--ink2);font-weight:300;}
.nx-log li.locked strong{color:var(--ink3);letter-spacing:.2em;}
.nx-log li.got .z{color:var(--accent);}
.nx-close{position:absolute;top:24px;right:24px;}

.nx-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}

/* ── sonar instrument ── */
.nx-sonar{position:fixed;right:clamp(18px,3vw,40px);bottom:clamp(18px,3.4vh,36px);z-index:22;display:flex;flex-direction:row-reverse;align-items:center;gap:16px;
  opacity:0;transform:translateY(18px) scale(.94);pointer-events:none;transition:opacity 1.1s var(--ease),transform 1.1s var(--ease);}
.nx[data-zone="4"] .nx-sonar{opacity:1;transform:none;pointer-events:auto;transition-delay:.4s;}
.nx-sonar-btn{position:relative;width:84px;height:84px;border-radius:50%;padding:0;border:1px solid rgba(120,255,210,.3);background:#020a0e;cursor:pointer;flex:none;
  box-shadow:0 0 34px -8px rgba(90,255,190,.5),inset 0 0 18px rgba(0,0,0,.7);transition:transform .5s var(--ease),box-shadow .5s,border-color .5s;}
.nx-sonar-btn::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1px solid rgba(120,255,210,.16);animation:nxSonarHalo 3.2s ease-out infinite;pointer-events:none;}
@keyframes nxSonarHalo{0%{transform:scale(.92);opacity:.9}100%{transform:scale(1.35);opacity:0}}
.nx-sonar-btn:hover{transform:scale(1.06);border-color:rgba(150,255,225,.7);box-shadow:0 0 46px -6px rgba(90,255,190,.8),inset 0 0 18px rgba(0,0,0,.7);}
.nx-sonar-btn:active{transform:scale(.95);}
.nx-sonar-btn:focus-visible{outline:1px solid #8fffd6;outline-offset:6px;}
.nx-scope{width:100%;height:100%;border-radius:50%;display:block;}
.nx-sonar-meta{text-align:right;font-family:var(--mono);text-transform:uppercase;pointer-events:none;}
.nx-sonar-meta b{display:block;font-weight:400;font-size:10px;letter-spacing:.42em;color:#8fffd6;}
.nx-sonar-meta span{display:block;margin-top:7px;font-size:9px;letter-spacing:.2em;color:var(--ink2);white-space:nowrap;}
.nx-sonar-meta kbd{font-family:var(--mono);font-size:8.5px;border:1px solid var(--line);border-radius:3px;padding:1px 5px;margin-left:6px;color:var(--ink);}

/* ── sonar intro block (inside the Abyss) ── */
.nx-sintro{position:relative;width:min(520px,100%);margin:40vh 0 0 auto;padding:30px 32px;border:1px solid rgba(120,255,210,.16);
  background:linear-gradient(135deg,rgba(2,16,18,.72),rgba(1,6,12,.4));}
.nx-sintro::before{content:"";position:absolute;left:-1px;top:-1px;width:26px;height:26px;border-left:1px solid #8fffd6;border-top:1px solid #8fffd6;}
.nx-sintro::after{content:"";position:absolute;right:-1px;bottom:-1px;width:26px;height:26px;border-right:1px solid #8fffd6;border-bottom:1px solid #8fffd6;}
.nx-sintro .nx-idx span:last-child{opacity:1;transform:none;color:#8fffd6;}
.nx-sintro h3{font-family:var(--serif);font-weight:300;font-size:clamp(2.2rem,3.6vw,3.2rem);line-height:1;margin:16px 0 14px;}
.nx-sintro h3 em{color:#8fffd6;}
.nx-sintro p{margin:0;font-size:.95rem;line-height:1.72;font-weight:300;color:var(--ink2);}
.nx-sstats{display:flex;gap:30px;margin:22px 0 24px;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.nx-sstats b{display:block;font-family:var(--serif);font-weight:300;font-size:2.2rem;line-height:1;color:var(--ink);}
.nx-sstats small{display:block;margin-top:8px;font-family:var(--mono);font-size:8.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink3);max-width:18em;line-height:1.6;}
.nx-pingbtn{font-family:var(--mono);font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#d8fff1;background:rgba(40,120,100,.12);border:1px solid rgba(120,255,210,.35);
  border-radius:40px;padding:15px 22px;display:inline-flex;align-items:center;gap:12px;cursor:pointer;transition:background .4s,box-shadow .4s,border-color .4s;}
.nx-pingbtn:hover{background:rgba(60,160,130,.2);border-color:#8fffd6;box-shadow:0 0 32px -8px rgba(90,255,190,.8);}
.nx-pingbtn i{width:8px;height:8px;border-radius:50%;background:#8fffd6;box-shadow:0 0 10px #8fffd6;animation:nxPulse 1.6s ease-in-out infinite;}
.nx-pingbtn kbd{font-family:var(--mono);font-size:9px;border:1px solid rgba(120,255,210,.3);border-radius:3px;padding:2px 6px;letter-spacing:.1em;}

/* ── THE LAST LIGHT ── */
.nx-ll{position:relative;height:660vh;}
.nx-llb{position:absolute;left:0;right:0;transform:translateY(-50%);display:flex;justify-content:center;padding:0 clamp(22px,8vw,140px);pointer-events:none;}
.nx-llb > div{max-width:820px;text-align:center;}
.nx-llhead .nx-zmeta{justify-content:center;}
.nx-llhead .nx-zmeta::before{display:none;}
.nx-llhead .nx-h2{margin-left:auto;margin-right:auto;}
.nx-llhead .nx-intro{margin:0 auto;}
.nx-llbeat p{margin:0;font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(1.5rem,3.1vw,2.7rem);line-height:1.22;color:var(--ink);text-shadow:0 0 40px rgba(0,0,0,.9);}
.nx-llbeat small{display:block;margin-top:20px;font-family:var(--mono);font-size:9.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--ink3);}
.nx-llbeat.big p{font-style:normal;font-size:clamp(2.8rem,8vw,7.4rem);letter-spacing:-.02em;line-height:1;
  background:linear-gradient(180deg,#f4f8ff 20%,#8fa8ff 70%,rgba(70,100,255,.2));-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;
  filter:drop-shadow(0 0 30px rgba(110,150,255,.35));}
.nx-photon{position:fixed;left:50%;top:74px;transform:translate(-50%,-10px);z-index:21;text-align:center;pointer-events:none;opacity:0;
  transition:opacity 1.4s var(--ease),transform 1.4s var(--ease);}
.nx[data-ll="1"] .nx-photon{opacity:1;transform:translate(-50%,0);}
.nx[data-cine="1"] .nx-photon{opacity:0 !important;}
.nx-photon small{display:block;font-family:var(--mono);font-size:8.5px;letter-spacing:.32em;text-transform:uppercase;color:var(--ink3);}
.nx-photon b{display:block;margin-top:7px;font-family:var(--serif);font-weight:300;font-size:clamp(1.5rem,2.6vw,2.2rem);line-height:1;
  font-variant-numeric:lining-nums tabular-nums;color:#c6d4ff;text-shadow:0 0 24px rgba(110,150,255,.45);}
.nx-mark.minor{font-size:8.5px;}
.nx-mark.minor::after{width:9px;height:9px;border-style:dashed;}

/* ── cinematic mode (rare encounter) ── */
.nx-lb{position:fixed;left:0;right:0;height:13vh;min-height:74px;background:#000;z-index:45;display:flex;justify-content:center;pointer-events:none;transition:transform 1.5s var(--ease);}
.nx-lb.t{top:0;transform:translateY(-101%);align-items:flex-end;padding-bottom:16px;}
.nx-lb.b{bottom:0;transform:translateY(101%);align-items:flex-start;padding-top:18px;}
.nx[data-cine="1"] .nx-lb{transform:none;}
.nx-lb span{font-family:var(--mono);font-size:10px;letter-spacing:.36em;text-transform:uppercase;color:#ff7fc2;text-align:center;padding:0 16px;}
.nx-lb p{margin:0;max-width:44em;padding:0 24px;text-align:center;font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(1rem,1.75vw,1.4rem);line-height:1.45;color:var(--ink);min-height:1.45em;}
.nx-main{transition:opacity 1.2s var(--ease);}
.nx[data-cine="1"] .nx-head,.nx[data-cine="1"] .nx-gauge,.nx[data-cine="1"] .nx-readout,.nx[data-cine="1"] .nx-hint,.nx[data-cine="1"] .nx-sonar,.nx[data-cine="1"] .nx-toast{opacity:0 !important;pointer-events:none !important;transition:opacity 1s var(--ease) !important;}
.nx[data-cine="1"] .nx-main{opacity:0;pointer-events:none;}

@media (max-width:760px){
  .nx-zlabel{display:none;}
  .nx-gauge{width:26px;right:10px;height:46vh;}
  .nx-mark{right:-6px;}
  .nx-mark .lbl{display:none;}
  .nx-now{display:none;}
  .nx-stats{gap:12px;}
  .nx-stats .opt{display:none;}
  .nx-hint{left:auto;right:40px;transform:none;bottom:22px;font-size:8px;letter-spacing:.16em;line-height:1.7;white-space:normal;text-align:right;width:44vw;justify-content:flex-end;}
  .nx-hint i{display:none;}
  .nx-eyebrow .rng{display:block;}
  .nx-eyebrow .dot{display:none;}
  .nx-znum{opacity:.55;}
  .nx-stats{margin-top:8px;}
  .nx-card{margin:44vh 0;padding:24px 22px 24px 24px;}
  .nx-card.right{margin-left:0;}
  .nx-facts{gap:18px;}
  .nx-zone{padding-top:18vh;}
  .nx-btn .t{display:none;}
  .nx-btn{padding:10px 12px;}
  .nx-logo{letter-spacing:.3em;}
  .nx[data-zone="4"] .nx-hint{display:none;}
  .nx-photon{top:64px;}
  .nx-photon small{font-size:7.5px;letter-spacing:.2em;}
  .nx-sonar{gap:10px;bottom:18px;right:14px;}
  .nx-sonar-btn{width:66px;height:66px;}
  .nx-sonar-meta kbd{display:none;}
  .nx-sonar-meta span{font-size:8px;letter-spacing:.14em;white-space:normal;max-width:100px;line-height:1.5;}
  .nx-sintro{margin-top:36vh;padding:24px 22px;}
  .nx-sstats{gap:18px;}
  .nx-sstats b{font-size:1.8rem;}
}
@media (prefers-reduced-motion:reduce){
  .nx-grain{animation:none;}
  [data-r]{transition-duration:.6s;}
}
`;

/* ───────────────────────────── sound ─────────────────────────────
   Fully synthesised: brown-noise "water" through a depth-controlled
   low-pass, a surf swell, a sub drone, and a feedback-delay "space"
   for pentatonic glints, alarms and sonar.                           */
class Sound {
  constructor() {
    this.on = false;
    this.ac = null;
    this.lastBlip = 0;
    this.scale = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349.3, 2637];
  }
  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const c = (this.ac = new AC());
    const master = (this.master = c.createGain());
    master.gain.value = 0;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master.connect(comp);
    comp.connect(c.destination);

    // space: two cross-fed delays with damping
    this.fx = c.createGain();
    const d1 = c.createDelay(2), d2 = c.createDelay(2);
    d1.delayTime.value = 0.37;
    d2.delayTime.value = 0.53;
    const f1 = c.createGain(), f2 = c.createGain();
    f1.gain.value = 0.46;
    f2.gain.value = 0.42;
    const damp = c.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = 2400;
    const wet = c.createGain();
    wet.gain.value = 0.55;
    this.fx.connect(d1);
    this.fx.connect(d2);
    d1.connect(damp);
    damp.connect(f1);
    f1.connect(d2);
    d2.connect(f2);
    f2.connect(d1);
    damp.connect(wet);
    d2.connect(wet);
    wet.connect(master);
    this.fx.connect(master);

    // brown noise bed
    const len = c.sampleRate * 4;
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let l = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        l = (l + 0.02 * w) / 1.02;
        d[i] = l * 3.2;
      }
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    this.lp = c.createBiquadFilter();
    this.lp.type = "lowpass";
    this.lp.frequency.value = 900;
    this.lp.Q.value = 0.6;
    this.nbuf = buf;
    this.noise = c.createGain();
    this.noise.gain.value = 0.4;
    src.connect(this.lp);
    this.lp.connect(this.noise);
    this.noise.connect(master);

    // surf swell
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 520;
    bp.Q.value = 0.7;
    const swell = c.createGain();
    swell.gain.value = 0.4;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoG = c.createGain();
    lfoG.gain.value = 0.38;
    lfo.connect(lfoG);
    lfoG.connect(swell.gain);
    this.surf = c.createGain();
    this.surf.gain.value = 0;
    src.connect(bp);
    bp.connect(swell);
    swell.connect(this.surf);
    this.surf.connect(master);

    // drone
    this.drone = c.createGain();
    this.drone.gain.value = 0.03;
    const dl = c.createBiquadFilter();
    dl.type = "lowpass";
    dl.frequency.value = 260;
    [55, 82.4, 110.3, 41.2].forEach((f, i) => {
      const o = c.createOscillator();
      o.type = i === 2 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = rand(-6, 6);
      const g = c.createGain();
      g.gain.value = i === 2 ? 0.18 : 0.5;
      const m = c.createOscillator();
      m.frequency.value = rand(0.03, 0.09);
      const mg = c.createGain();
      mg.gain.value = 0.25;
      m.connect(mg);
      mg.connect(g.gain);
      o.connect(g);
      g.connect(dl);
      o.start();
      m.start();
    });
    dl.connect(this.drone);
    this.drone.connect(master);
    this.drone.connect(this.fx);

    src.start();
    lfo.start();
    return true;
  }
  setOn(on) {
    if (on && !this.ac && !this.init()) return;
    if (!this.ac) return;
    this.on = on;
    if (on && this.ac.state === "suspended") this.ac.resume();
    const g = this.master.gain, now = this.ac.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(on ? 0.85 : 0, now, on ? 0.8 : 0.25);
  }
  update(depthN, w) {
    if (!this.on || !this.ac) return;
    const now = this.ac.currentTime;
    this.lp.frequency.setTargetAtTime(lerp(1100, 110, Math.sqrt(depthN)), now, 0.6);
    this.surf.gain.setTargetAtTime((w[0] * 0.9 + w[1] * 0.25) * 0.55, now, 0.6);
    this.noise.gain.setTargetAtTime(0.34 - depthN * 0.12, now, 0.6);
    this.drone.gain.setTargetAtTime(0.02 + depthN * 0.09, now, 0.8);
  }
  tone(freq, vol, dur, type = "sine", dest, glide) {
    if (!this.on || !this.ac) return;
    const c = this.ac, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.fx);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  blip(intensity = 1) {
    if (!this.on || !this.ac) return;
    const now = performance.now();
    if (now - this.lastBlip < 85) return;
    this.lastBlip = now;
    const f = this.scale[(Math.random() * this.scale.length) | 0];
    this.tone(f, 0.018 + 0.02 * intensity, 0.5);
  }
  chord(base = 523.25) {
    [1, 1.25, 1.5, 2, 2.5].forEach((m, i) => setTimeout(() => this.tone(base * m, 0.05, 1.6), i * 70));
  }
  alarm(power = 1) {
    [0, 1, 2, 3, 4, 5].forEach((i) =>
      setTimeout(() => this.tone(this.scale[(i * 3) % 8] * (i % 2 ? 1 : 0.5), 0.05 * power, 0.9, "triangle"), i * 90)
    );
  }
  ping() {
    this.tone(1180, 0.05, 2.4);
    setTimeout(() => this.tone(1180, 0.015, 2), 420);
  }
  thud() {
    if (!this.on || !this.ac) return;
    this.tone(90, 0.5, 0.9, "sine", this.master, 32);
    this.tone(180, 0.12, 0.25, "triangle", this.master, 60);
  }
  rumble() {
    if (!this.on || !this.ac) return;
    this.tone(46, 0.45, 4.5, "sine", this.master, 30);
    this.tone(69, 0.18, 3.5, "triangle", this.fx, 52);
  }
  // ── sonar ──
  sonar() {
    if (!this.on || !this.ac) return;
    this.tone(1240, 0.1, 3.2, "sine");
    this.tone(2480, 0.02, 0.4, "sine");
    this.tone(110, 0.28, 0.8, "sine", this.master, 42);
  }
  echo(kind) {
    if (!this.on || !this.ac) return;
    const now = performance.now();
    if (now - (this.lastEcho || 0) < 110) return;
    this.lastEcho = now;
    const f = { rock: 610, bone: 980, plume: 420, bio: 1560, far: 520, unk: 300 }[kind] || 900;
    this.tone(f, kind === "far" ? 0.012 : 0.028, kind === "rock" ? 0.9 : 0.6, kind === "rock" || kind === "unk" ? "triangle" : "sine");
    if (kind === "bone") setTimeout(() => this.tone(f * 1.006, 0.018, 0.5), 120);
  }
  contact() {
    if (!this.on || !this.ac) return;
    this.tone(233, 0.12, 1.8, "sine", this.fx, 150);
    setTimeout(() => this.tone(196, 0.1, 2, "sine", this.fx, 130), 420);
  }
  // ── the last light / leviathan ──
  click(vol = 0.2) {
    if (!this.on || !this.ac) return;
    const c = this.ac, t = c.currentTime;
    if (!this.clickBuf) {
      const n = Math.floor(c.sampleRate * 0.02), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.1));
      this.clickBuf = b;
    }
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.clickBuf;
    bp.type = "bandpass";
    bp.frequency.value = 1800 + Math.random() * 900;
    bp.Q.value = 0.8;
    g.gain.value = vol;
    s.connect(bp);
    bp.connect(g);
    g.connect(this.fx);
    g.connect(this.master);
    s.start(t);
  }
  whoosh(dur = 6, vol = 0.55) {
    if (!this.on || !this.ac || !this.nbuf) return;
    const c = this.ac, t = c.currentTime;
    const s = c.createBufferSource(), lp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nbuf;
    s.loop = true;
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(120, t);
    lp.frequency.linearRampToValueAtTime(620, t + dur * 0.45);
    lp.frequency.linearRampToValueAtTime(110, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.45);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    s.start(t);
    s.stop(t + dur + 0.1);
  }
  lastLight() {
    [1318.5, 1174.7, 987.8, 880, 659.3].forEach((f, i) => setTimeout(() => this.tone(f, 0.028, 4), i * 460));
  }
  leviathan() {
    if (!this.on || !this.ac) return;
    this.tone(36.7, 0.5, 12, "sine", this.master, 30);
    this.tone(55, 0.16, 10, "triangle", this.fx, 46);
    setTimeout(() => this.whoosh(9, 0.6), 1600);
  }
  swell() {
    if (!this.on || !this.ac) return;
    this.tone(41, 0.5, 10, "sine", this.master, 33);
    this.tone(61.7, 0.16, 9, "triangle", this.fx, 52);
    [329.6, 392, 493.9, 587.3].forEach((f, i) => setTimeout(() => this.tone(f, 0.022, 7, "sine", this.fx, f * 0.985), 4500 + i * 300));
  }
}

/* ═════════════════════════════ ENGINE ═════════════════════════════
   One canvas, one rAF loop. React never re-renders per frame: the
   engine writes HUD numbers / cursor transforms straight to the DOM. */
function createEngine(o) {
  const { canvas, root, flashEl, getSections, getLL, refs, marks, onZone, onLog, onReady, onLL, sound } = o;
  const R = (k) => refs[k] && refs[k].current;
  const ctx = canvas.getContext("2d");
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = window.innerWidth, H = window.innerHeight, DPR = 1;
  let dprCap = Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 1.6);
  const Q = clamp((W * H) / (1440 * 900), 0.42, 1.2) * (isTouch ? 0.75 : 1) * (reduced ? 0.6 : 1);
  const SZ = clamp(Math.min(W, H) / 850, 0.62, 1.25);
  let raf = 0, last = performance.now(), alive = true;

  /* ── glow sprites: pre-rendered radial gradients, drawn additively ── */
  const SP = {};
  const mkSprite = (r, g, b, soft) => {
    const s = 64, c = document.createElement("canvas");
    c.width = c.height = s;
    const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (soft) {
      gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
      gr.addColorStop(0.45, `rgba(${r},${g},${b},.38)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    } else {
      const h = (v) => Math.min(255, v + 150);
      gr.addColorStop(0, `rgba(${h(r)},${h(g)},${h(b)},1)`);
      gr.addColorStop(0.09, `rgba(${r},${g},${b},.92)`);
      gr.addColorStop(0.28, `rgba(${r},${g},${b},.34)`);
      gr.addColorStop(0.6, `rgba(${r},${g},${b},.075)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    }
    x.fillStyle = gr;
    x.fillRect(0, 0, s, s);
    return c;
  };
  [
    ["cyan", 70, 215, 255], ["blue", 60, 125, 255], ["green", 90, 255, 150], ["aqua", 110, 255, 220],
    ["red", 255, 36, 56], ["white", 205, 225, 255], ["violet", 150, 120, 255], ["pink", 255, 130, 170],
    ["bio", 255, 100, 205], ["bone", 255, 228, 185], ["phos", 90, 255, 190],
  ].forEach(([n, r, g, b]) => {
    SP[n] = mkSprite(r, g, b);
    SP[n + "S"] = mkSprite(r, g, b, true);
  });
  const G = (spr, x, y, r, a) => {
    if (a < 0.004 || r < 0.25) return;
    ctx.globalAlpha = a > 1 ? 1 : a;
    ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
  };
  const ADD = () => { ctx.globalCompositeOperation = "lighter"; };
  const NRM = () => { ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; };

  /* ── state ── */
  const S = {
    t: 0, scrollY: window.scrollY, sScroll: window.scrollY, dScroll: 0, vScroll: 0,
    c: 0.5, cMax: 4.9, depth: 0, w: [1, 0, 0, 0, 0], zone: -1, tops: [0, 0, 0, 0, 0], hs: [1, 1, 1, 1, 1],
    maxScroll: 1, hz: H * 0.62, intro: 0, burst: -1, titleReady: false, readySent: false,
    flash: 0, shake: 0, lampFlare: 0, found: new Set(), focus: null, pars: [], scrollAnim: 0,
    waves: [], stirCount: 0, hud: {}, lastLabel: "", moving: false, fx: [0, 0], noLens: reduced,
    llTop: 0, llH: 0, sun: 1,
  };
  const P = {
    x: W * 0.5, y: H * 0.66, px: W * 0.5, py: H * 0.66, vx: 0, vy: 0, speed: 0,
    down: false, downT: 0, downX: 0, downY: 0, moved: 0, active: false, lastMove: -99, hold: 0,
    ex: W * 0.5, ey: H * 0.6, rx: W * 0.5, ry: H * 0.6, hover: false, present: false,
  };
  const log = (id) => {
    if (S.found.has(id)) return;
    S.found.add(id);
    onLog && onLog(id);
  };

  /* ── layout / scroll mapping ── */
  // Zone coordinate c: 0 hero, [1,2) Sunlit, [2,2.78) Twilight, [2.78,3) THE LAST LIGHT, [3,4) Midnight, [4,5) Abyss.
  // The Last Light is its own DOM section, folded into the zone coordinate so that
  // depth, palette and weights all flow continuously through it.
  const LL_C0 = 2.78;
  function cFrom(scroll) {
    const center = scroll + H * 0.5, n = S.tops.length;
    if (S.llH > 1 && center >= S.llTop && center < S.llTop + S.llH) return LL_C0 + (3 - LL_C0) * ((center - S.llTop) / S.llH);
    for (let i = n - 1; i >= 0; i--) {
      if (center < S.tops[i]) continue;
      const f = (center - S.tops[i]) / S.hs[i];
      if (i === 2 && S.llH > 1) return 2 + Math.min(f, 0.9999) * (LL_C0 - 2);
      return Math.min(n - 0.0001, i + f);
    }
    return 0;
  }
  function depthFrom(c) {
    if (c <= 1) return 0;
    if (c <= 2) return (c - 1) * 200;
    if (c <= LL_C0) return 200 + ((c - 2) / (LL_C0 - 2)) * 550;
    if (c <= 3) return 750 + ((c - LL_C0) / (3 - LL_C0)) * 400;
    if (c <= 4) return 1150 + (c - 3) * 2850;
    // last stretch is mapped on raw scroll so the very bottom reads exactly 10,935 m
    const s4 = S.tops[4] - H * 0.5;
    return 4000 + clamp((S.sScroll - s4) / Math.max(1, S.maxScroll - s4)) * 6935;
  }
  // The page normally scrolls the window, but if a host wraps us in a scrolling
  // container (some embeds do), drive everything from that element instead.
  let SC = null;
  function findScroller() {
    let el = root.parentElement;
    while (el && el !== document.body && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      if (/(auto|scroll|overlay)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2) return el;
      el = el.parentElement;
    }
    return null;
  }
  const getY = () => (SC ? SC.scrollTop : window.scrollY);
  const setY = (y) => (SC ? (SC.scrollTop = y) : window.scrollTo(0, y));
  const maxY = () => Math.max(1, SC ? SC.scrollHeight - SC.clientHeight : document.documentElement.scrollHeight - H);
  function measure() {
    const secs = getSections();
    if (!secs || !secs.length) return;
    const sc = findScroller();
    if (sc !== SC) {
      if (SC) SC.removeEventListener("wheel", cancelScrollAnim);
      SC = sc;
      if (SC) SC.addEventListener("wheel", cancelScrollAnim, { passive: true });
    }
    const sy = getY(), vt = SC ? SC.getBoundingClientRect().top : 0;
    secs.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      S.tops[i] = r.top - vt + sy;
      S.hs[i] = Math.max(1, r.height);
    });
    const ll = getLL && getLL();
    if (ll) {
      const r = ll.getBoundingClientRect();
      S.llTop = r.top - vt + sy;
      S.llH = Math.max(1, r.height);
    }
    S.maxScroll = maxY();
    S.cMax = cFrom(S.maxScroll);
    S.pars = Array.from(root.querySelectorAll("[data-par]")).map((el) => {
      const r = el.getBoundingClientRect();
      return { el, mid: r.top - vt + sy - (el._py || 0) + r.height / 2, f: parseFloat(el.dataset.par) || 0.2 };
    });
    // gauge markers sit where their depth actually occurs along the scroll journey
    if (marks) {
      marks.forEach((m) => {
        if (!m) return;
        m.style.top = gaugeP(scrollOfDepth(parseFloat(m.dataset.depth) || 0)) * 100 + "%";
      });
    }
  }
  // inverse of the scroll→depth mapping (used by the gauge)
  function scrollOfDepth(d) {
    const h2 = H * 0.5;
    if (d <= 200) return S.tops[1] + (d / 200) * S.hs[1] - h2;
    if (d <= 750) return S.tops[2] + ((d - 200) / 550) * S.hs[2] - h2;
    if (d <= 1150 && S.llH > 1) return S.llTop + ((d - 750) / 400) * S.llH - h2;
    if (d <= 4000) return S.tops[3] + ((d - 1150) / 2850) * S.hs[3] - h2;
    const s4 = S.tops[4] - h2;
    return s4 + ((d - 4000) / 6935) * (S.maxScroll - s4);
  }
  const gaugeP = (scroll) => {
    const s0 = S.tops[1] - H * 0.5;
    return clamp((scroll - s0) / Math.max(1, S.maxScroll - s0));
  };
  /* ─────────────── ambient motes (every zone, parallax + streaks) ─────────────── */
  const MN = Math.round(210 * Q + 60);
  const mo = { x: new Float32Array(MN), y: new Float32Array(MN), z: new Float32Array(MN), ph: new Float32Array(MN), lum: new Uint8Array(MN) };
  {
    const zs = Array.from({ length: MN }, () => 0.08 + Math.pow(Math.random(), 1.7) * 0.92).sort((a, b) => a - b);
    for (let i = 0; i < MN; i++) {
      mo.x[i] = rand(W);
      mo.y[i] = rand(H);
      mo.z[i] = zs[i];
      mo.ph[i] = rand(TAU);
      mo.lum[i] = Math.random() < 0.08 ? 1 : 0;
    }
  }
  const MOTE_COL = [[170, 210, 255], [150, 225, 255], [150, 170, 255], [120, 140, 210], [215, 225, 242]];
  const MOTE_A = [0.28, 0.42, 0.42, 0.3, 0.6];
  function updateMotes(dt) {
    const w = S.w;
    const fall = w[4] * 15 + w[3] * 5 + w[2] * 2 - w[1] * 4;
    for (let i = 0; i < MN; i++) {
      const z = mo.z[i];
      mo.y[i] += fall * z * dt - S.dScroll * (0.12 + z * 1.1);
      mo.x[i] += Math.sin(S.t * 0.25 + mo.ph[i]) * z * 7 * dt;
      if (mo.y[i] < -30) { mo.y[i] += H + 60; mo.x[i] = rand(W); }
      else if (mo.y[i] > H + 30) { mo.y[i] -= H + 60; mo.x[i] = rand(W); }
      if (mo.x[i] < -10) mo.x[i] += W + 20;
      else if (mo.x[i] > W + 10) mo.x[i] -= W + 20;
    }
  }
  function drawMotes() {
    const w = S.w;
    let r = 0, g = 0, b = 0, a = 0, sum = 0;
    for (let k = 0; k < 5; k++) {
      r += MOTE_COL[k][0] * w[k]; g += MOTE_COL[k][1] * w[k]; b += MOTE_COL[k][2] * w[k]; a += MOTE_A[k] * w[k]; sum += w[k];
    }
    sum = sum || 1;
    r = (r / sum) | 0; g = (g / sum) | 0; b = (b / sum) | 0; a /= sum;
    const ox = (P.ex - W / 2) * -0.03, oy = (P.ey - H / 2) * -0.02;
    const streak = clamp(S.vScroll * 0.05, -160, 160);
    const layers = [[0, 0.55], [0.55, 0.86], [0.86, 1]];
    ADD();
    ctx.globalAlpha = 1;
    for (let L = 0; L < 3; L++) {
      const i0 = Math.floor(MN * layers[L][0]), i1 = Math.floor(MN * layers[L][1]);
      const zl = (L + 1) / 3, al = a * (0.35 + zl * 0.65);
      if (Math.abs(streak) > 3) {
        ctx.strokeStyle = `rgba(${r},${g},${b},${al * 0.75})`;
        ctx.lineWidth = 0.5 + zl * 1.3;
        ctx.beginPath();
        for (let i = i0; i < i1; i++) {
          const z = mo.z[i], x = mo.x[i] + ox * z, y = mo.y[i] + oy * z;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + streak * z);
        }
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${r},${g},${b},${al})`;
        const s = 0.7 + zl * 1.5;
        for (let i = i0; i < i1; i++) {
          const z = mo.z[i];
          ctx.fillRect(mo.x[i] + ox * z - s / 2, mo.y[i] + oy * z - s / 2, s, s);
        }
      }
    }
    // out-of-focus foreground flakes (depth of field)
    const bokeh = SP.whiteS;
    for (let i = Math.floor(MN * 0.94); i < MN; i++) {
      const z = mo.z[i];
      G(bokeh, mo.x[i] + ox * z * 1.6, mo.y[i] + oy * z * 1.6, (5 + z * 11) * SZ, 0.05 * a + 0.03 * w[4]);
    }
    // luminous flakes (bacteria) deeper down
    const lw = w[2] * 0.25 + w[3] * 0.6 + w[4];
    if (lw > 0.02) {
      for (let i = 0; i < MN; i++) {
        if (!mo.lum[i]) continue;
        const z = mo.z[i];
        G(SP.aqua, mo.x[i] + ox * z, mo.y[i] + oy * z, (5 + z * 9) * SZ, lw * (0.18 + 0.22 * Math.sin(S.t * 1.3 + mo.ph[i] * 3)));
      }
    }
    // The Last Light: snow glitters inside the dying shafts, and glows around living lights
    if (LL.w > 0.01 && (LL.rays.length || LL.lights.length)) {
      for (let i = 0; i < MN; i++) {
        const z = mo.z[i], x = mo.x[i] + ox * z, y = mo.y[i] + oy * z;
        const rl = LL.rays.length ? rayLight(x, y) : 0;
        let cl = 0;
        for (let k = 0; k < LL.lights.length; k++) {
          const L = LL.lights[k], dx = x - L.x, dy = y - L.y, d2 = dx * dx + dy * dy, r2 = L.r * L.r;
          if (d2 < r2) cl += L.i * (1 - d2 / r2);
        }
        if (rl > 0.02) G(SP.white, x, y, (1.6 + z * 5) * SZ, Math.min(1, rl) * 0.8 * LL.w);
        if (cl > 0.02) G(SP.blue, x, y, (2 + z * 6) * SZ, Math.min(1, cl) * 0.95 * LL.w);
      }
    }
    // lamp-lit snow
    if (w[4] > 0.02) {
      for (let i = 0; i < MN; i++) {
        const z = mo.z[i], x = mo.x[i] + ox * z, y = mo.y[i] + oy * z;
        const l = lampAt(x, y);
        if (l > 0.03) G(SP.white, x, y, (2 + z * 7) * SZ, l * w[4] * 0.9);
      }
      // sonar scattering: each flake flares as the wavefront crosses it, then smoulders
      if (PINGS.length) {
        for (let i = 0; i < MN; i++) {
          const z = mo.z[i], x = mo.x[i] + ox * z, y = mo.y[i] + oy * z;
          const e = echoAt(x, y);
          if (e < 0.03) continue;
          G(SP.phos, x, y, (2.5 + z * 6 + e * 5) * SZ, e * 0.75 * w[4]);
          if (e > 0.55) G(SP.white, x, y, (1.5 + z * 2) * SZ, (e - 0.55) * 2 * w[4]);
        }
      }
    }
  }

  /* ─────────────── light shafts ─────────────── */
  const RAYS = Array.from({ length: 7 }, (_, i) => ({
    x: (i + rand(0.2, 0.8)) / 7, w: rand(40, 150) * SZ, a: rand(0.35, 1), ph: rand(TAU), sp: rand(0.08, 0.22), tilt: rand(0.06, 0.24),
  }));
  function drawRays(alpha, col, top) {
    if (alpha < 0.01) return;
    ADD();
    ctx.globalAlpha = 1;
    const len = H * 1.15 - top;
    const px = (P.ex - W / 2) * -0.05;
    for (const r of RAYS) {
      const x0 = r.x * W + Math.sin(S.t * r.sp + r.ph) * 50 + px;
      const ww = r.w * (0.7 + 0.3 * Math.sin(S.t * 0.5 + r.ph * 2));
      const x1 = x0 + len * r.tilt;
      const gr = ctx.createLinearGradient(0, top, 0, top + len);
      gr.addColorStop(0, `rgba(${col},${0.1 * r.a * alpha})`);
      gr.addColorStop(0.45, `rgba(${col},${0.035 * r.a * alpha})`);
      gr.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(x0 - ww * 0.5, top);
      ctx.lineTo(x0 + ww * 0.5, top);
      ctx.lineTo(x1 + ww * 1.7, top + len);
      ctx.lineTo(x1 - ww * 1.7, top + len);
      ctx.closePath();
      ctx.fill();
    }
  }

  /* ─────────────── sparks, ripples, expanding light-waves ─────────────── */
  const SPK = [];
  const SPK_MAX = isTouch ? 280 : 560;
  function spark(x, y, vx, vy, life, size, spr) {
    if (SPK.length >= SPK_MAX) SPK.splice(0, 24);
    SPK.push({ x, y, vx, vy, life, max: life, size, spr });
  }
  function updateSparks(dt) {
    let j = 0;
    const d = Math.exp(-2 * dt);
    for (let i = 0; i < SPK.length; i++) {
      const p = SPK[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vx *= d; p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt - S.dScroll * 0.9;
      SPK[j++] = p;
    }
    SPK.length = j;
  }
  function drawSparks() {
    ADD();
    for (const p of SPK) {
      const l = p.life / p.max;
      G(p.spr, p.x, p.y, p.size * (0.45 + 0.55 * l), l * l * 0.95);
    }
  }
  const RIP = [];
  function ripple(x, y, R, col, dur = 1.6) { RIP.push({ x, y, R, col, t: 0, dur }); }
  function drawRipples(dt) {
    NRM();
    for (let i = RIP.length - 1; i >= 0; i--) {
      const r = RIP[i];
      r.t += dt;
      const p = r.t / r.dur;
      if (p >= 1) { RIP.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - p, 3);
      ctx.strokeStyle = `rgba(${r.col},${(1 - p) * (1 - p) * 0.55})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.R * e, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${r.col},${(1 - p) * 0.18})`;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.R * e * 0.72, 0, TAU);
      ctx.stroke();
    }
  }
  function addWave(x, y) {
    S.waves.push({ x, y, t0: S.t, max: 440 * SZ });
    if (S.waves.length > 4) S.waves.shift();
    ripple(x, y, 440 * SZ, "130,230,255", 1.4);
  }
  function pruneWaves() {
    for (let i = S.waves.length - 1; i >= 0; i--) if ((S.t - S.waves[i].t0) * 400 * SZ > S.waves[i].max) S.waves.splice(i, 1);
  }

  /* ═══════════════ SURFACE · night sky, glowing surf, plankton title ═══════════════ */
  const STARS = Array.from({ length: Math.round(170 * Q + 60) }, () => ({
    x: Math.random(), y: Math.pow(Math.random(), 1.3), s: rand(0.5, 1.6), ph: rand(TAU), sp: rand(0.4, 2.4),
  }));
  const WL = isTouch ? 16 : 22, WV = isTouch ? 48 : 72;
  const wexc = new Float32Array(WL * WV), wyy = new Float32Array(WL * WV), wxx = new Float32Array(WV);
  const wjx = new Float32Array(WL * WV).map(() => rand(-0.5, 0.5)), wjy = new Float32Array(WL * WV).map(() => rand(-1, 1));
  const moonPos = () => [W * 0.8, S.hz - H * 0.62 * 0.72, Math.max(11, Math.min(W, H) * 0.024)];

  function updateSurf(dt) {
    const hz = S.hz;
    const surfA = 1 - smooth(0, H * 0.32, S.sScroll);
    if (surfA <= 0.01 || hz > H) return;
    const span = H - hz + 60;
    for (let j = 0; j < WV; j++) wxx[j] = (j / (WV - 1)) * (W + 40) - 20;
    const dec = Math.exp(-1.5 * dt);
    for (let i = 0; i < WL; i++) {
      const u = (i + 1) / WL;
      const base = hz + Math.pow(u, 2.1) * span;
      const A = (0.5 + u * 7) * SZ, fq = 0.02 / (0.25 + u);
      for (let j = 0; j < WV; j++) {
        const x = wxx[j], k = i * WV + j;
        wyy[k] = base + Math.sin(x * fq + S.t * (0.6 + u * 0.8) + i * 1.3) * A + Math.sin(x * fq * 2.6 - S.t * 0.9 + i) * A * 0.4;
        wexc[k] *= dec;
      }
    }
    // stir the surf
    if (P.present && P.y > hz && P.speed > 30) {
      const amt = clamp(P.speed / 900, 0.2, 1);
      for (let i = 0; i < WL; i++) {
        const u = (i + 1) / WL, y = wyy[i * WV + (WV >> 1)];
        if (Math.abs(P.y - y) > (26 + u * 46) * SZ) continue;
        const Rx = (36 + u * 90) * SZ;
        for (let j = 0; j < WV; j++) {
          const dx = Math.abs(wxx[j] - P.x);
          if (dx < Rx) {
            const k = i * WV + j;
            wexc[k] = Math.min(1, wexc[k] + (1 - dx / Rx) * amt * dt * 9);
          }
        }
      }
      S.stirCount += amt * dt * 40;
      if (S.stirCount > 320) log("stir");
      sound.blip(amt * 0.7);
    }
    // breaking crests light up on their own
    if (Math.random() < dt * 5) {
      const i = Math.floor(Math.pow(Math.random(), 0.7) * WL), c = Math.floor(rand(WV));
      const spanJ = 2 + Math.floor(((i + 1) / WL) * 8);
      for (let j = -spanJ; j <= spanJ; j++) {
        const jj = c + j;
        if (jj < 0 || jj >= WV) continue;
        const k = i * WV + jj;
        wexc[k] = Math.max(wexc[k], (1 - Math.abs(j) / (spanJ + 1)) * rand(0.35, 0.75));
      }
    }
    // light-waves from clicks
    for (const wv of S.waves) {
      const rw = (S.t - wv.t0) * 400 * SZ, fade = 1 - rw / wv.max;
      for (let i = 0; i < WL; i++) {
        for (let j = 0; j < WV; j++) {
          const k = i * WV + j, d = Math.hypot(wxx[j] - wv.x, (wyy[k] - wv.y) * 1.8);
          if (Math.abs(d - rw) < 22 * SZ) wexc[k] = Math.max(wexc[k], fade * 0.95);
        }
      }
    }
  }

  function drawSurface() {
    const hz = S.hz, intro = S.intro, skyH = H * 0.62;
    const surfA = 1 - smooth(0, H * 0.32, S.sScroll);
    NRM();
    if (hz > 0) {
      const g = ctx.createLinearGradient(0, hz - skyH, 0, hz);
      g.addColorStop(0, "#010208");
      g.addColorStop(0.55, "#040b1c");
      g.addColorStop(1, "#0c2140");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, hz + 1);
      ctx.fillStyle = "#dfeaff";
      for (const s of STARS) {
        const y = hz - skyH + s.y * skyH * 0.93;
        if (y < 0 || y > hz - 6) continue;
        const tw = 0.45 + 0.55 * Math.sin(S.t * s.sp + s.ph);
        ctx.globalAlpha = intro * (0.12 + 0.6 * tw * (1 - s.y * 0.55));
        ctx.fillRect(s.x * W, y, s.s, s.s);
      }
      const [mx, my, mr] = moonPos();
      ADD();
      G(SP.whiteS, mx, my, mr * 10, 0.09 * intro);
      G(SP.white, mx, my, mr * 4.2, 0.22 * intro);
      NRM();
      ctx.globalAlpha = intro;
      const mg = ctx.createRadialGradient(mx - mr * 0.35, my - mr * 0.35, 0, mx, my, mr);
      mg.addColorStop(0, "#fbfdff");
      mg.addColorStop(1, "#b7c8e2");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(110,130,170,.22)";
      ctx.beginPath();
      ctx.arc(mx + mr * 0.28, my - mr * 0.12, mr * 0.3, 0, TAU);
      ctx.moveTo(mx - mr * 0.2, my + mr * 0.35);
      ctx.arc(mx - mr * 0.32, my + mr * 0.35, mr * 0.2, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (surfA > 0.01 && hz < H) {
      ctx.globalAlpha = surfA;
      const sg = ctx.createLinearGradient(0, hz, 0, H);
      sg.addColorStop(0, "#0a1f38");
      sg.addColorStop(0.25, "#051326");
      sg.addColorStop(1, "#01060d");
      ctx.fillStyle = sg;
      ctx.fillRect(0, Math.max(0, hz), W, H - Math.max(0, hz));
      ctx.globalAlpha = 1;
      // horizon haze
      ADD();
      const hg = ctx.createLinearGradient(0, hz - 50, 0, hz + 40);
      hg.addColorStop(0, "rgba(70,130,220,0)");
      hg.addColorStop(0.6, `rgba(90,150,230,${0.13 * intro})`);
      hg.addColorStop(1, "rgba(70,130,220,0)");
      ctx.fillStyle = hg;
      ctx.fillRect(0, hz - 50, W, 90);
      NRM();
      // wave lines
      for (let i = 0; i < WL; i++) {
        const u = (i + 1) / WL;
        ctx.beginPath();
        for (let j = 0; j < WV; j++) {
          const k = i * WV + j;
          if (j === 0) ctx.moveTo(wxx[j], wyy[k]);
          else ctx.lineTo(wxx[j], wyy[k]);
        }
        ctx.strokeStyle = `rgba(150,185,228,${(0.035 + 0.12 * u) * surfA * intro})`;
        ctx.lineWidth = 0.6 + u * 0.9;
        ctx.stroke();
      }
      // moon path
      const [mx] = moonPos();
      const jm = clamp(Math.round(((mx + 20) / (W + 40)) * (WV - 1)), 0, WV - 1);
      ADD();
      ctx.fillStyle = "#dce8ff";
      for (let i = 0; i < WL; i++) {
        const u = (i + 1) / WL, y = wyy[i * WV + jm];
        const half = (3 + u * 62) * (0.35 + 0.65 * Math.abs(Math.sin(S.t * 0.8 + i * 1.9))) * SZ;
        ctx.globalAlpha = (0.06 + 0.32 * (1 - u)) * surfA * intro * (0.6 + 0.4 * Math.sin(S.t * 3 + i));
        ctx.fillRect(mx - half + Math.sin(S.t * 1.1 + i * 2.3) * u * 16, y - 0.6, half * 2, 1 + u * 1.3);
      }
      // bioluminescent crests: glowing foam strokes bucketed by intensity + jittered sparkles
      ctx.globalAlpha = 1;
      ctx.lineCap = "round";
      const fa = surfA * intro;
      for (let i = 0; i < WL; i++) {
        const u = (i + 1) / WL;
        for (let lv = 1; lv <= 4; lv++) {
          const lo = lv * 0.22 - 0.19, hi = lv === 4 ? 9 : lo + 0.22;
          let any = false;
          ctx.beginPath();
          for (let j = 0; j < WV - 1; j++) {
            const k = i * WV + j, e = (wexc[k] + wexc[k + 1]) * 0.5;
            if (e >= lo && e < hi) { ctx.moveTo(wxx[j], wyy[k]); ctx.lineTo(wxx[j + 1], wyy[k + 1]); any = true; }
          }
          if (!any) continue;
          const ea = Math.min(1, lo + 0.11);
          ctx.strokeStyle = `rgba(70,200,255,${0.22 * ea * fa})`;
          ctx.lineWidth = (5 + u * 14) * SZ;
          ctx.stroke();
          ctx.strokeStyle = `rgba(150,240,255,${0.85 * ea * fa})`;
          ctx.lineWidth = (0.8 + u * 1.8) * SZ;
          ctx.stroke();
        }
        const rr = (3 + u * 11) * SZ;
        for (let j = 0; j < WV; j++) {
          const k = i * WV + j, e = wexc[k];
          if (e > 0.12) {
            const tw = 0.5 + 0.5 * Math.sin(S.t * 23 + k * 7.3);
            G(SP.cyan, wxx[j] + wjx[k] * (W / WV), wyy[k] + wjy[k] * (2 + u * 4), rr * (0.6 + e * 0.6), e * tw * 0.8 * fa);
          }
        }
      }
      ctx.lineCap = "butt";
      NRM();
    }
    // the waterline as we slip under
    const under = smooth(0, H * 0.3, S.sScroll);
    if (under > 0 && hz > -40 && hz < H + 20) {
      ADD();
      const top = Math.max(0, hz);
      const lg = ctx.createLinearGradient(0, top, 0, top + H * 0.5);
      lg.addColorStop(0, `rgba(120,205,255,${0.24 * under})`);
      lg.addColorStop(1, "rgba(120,205,255,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(0, top, W, H * 0.5);
      ctx.beginPath();
      for (let x = -10; x <= W + 16; x += 16) {
        const y = hz + Math.sin(x * 0.013 + S.t * 1.4) * 4 + Math.sin(x * 0.037 - S.t) * 2;
        if (x < 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(210,245,255,${0.6 * under})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = `rgba(120,210,255,${0.14 * under})`;
      ctx.lineWidth = 9;
      ctx.stroke();
      NRM();
    }
  }

  // underside of the surface: Snell's window shimmer, fades with depth
  function drawSurfaceFromBelow() {
    const a = clamp(1 - S.depth / 110) * smooth(0, H * 0.3, S.sScroll);
    if (a < 0.01) return;
    const top = Math.max(0, S.hz);
    ADD();
    const g = ctx.createLinearGradient(0, top, 0, top + H * 0.38);
    g.addColorStop(0, `rgba(140,215,255,${0.16 * a})`);
    g.addColorStop(1, "rgba(140,215,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, H * 0.38);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      for (let x = -10; x <= W + 14; x += 14) {
        const y = top + 8 + k * 13 + Math.sin(x * 0.02 + S.t * (1 + k * 0.3) + k) * 5 + Math.sin(x * 0.051 - S.t * 1.7) * 3;
        if (x < 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(195,238,255,${(0.17 - k * 0.035) * a})`;
      ctx.stroke();
    }
    NRM();
  }

  /* ── NAUTICALUS title, assembled from ~2k plankton that flare when disturbed ── */
  const T = { n: 0, step: 3, fs: 120, ty: H * 0.38 };
  const TITLE_N = Math.round((isTouch ? 1000 : 1900) * clamp(Q, 0.65, 1.1));
  function layoutTitle(fresh) {
    const text = "NAUTICALUS";
    const ty = H * (W < 700 ? 0.36 : 0.38);
    const oc = document.createElement("canvas"), o2 = oc.getContext("2d");
    let fs = Math.min(W * 0.125, H * 0.2, 210);
    const font = (f) => `400 ${f}px "Cormorant Garamond","Cormorant","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif`;
    const sp = W < 700 ? 0.09 : 0.2;
    o2.font = font(fs);
    const mw = () => {
      let s = 0;
      for (const ch of text) s += o2.measureText(ch).width;
      return s + sp * fs * (text.length - 1);
    };
    let tw = mw();
    const maxW = W * (W < 700 ? 0.9 : 0.8);
    if (tw > maxW) { fs *= maxW / tw; o2.font = font(fs); tw = mw(); }
    const pad = 10;
    oc.width = Math.ceil(tw + pad * 2);
    oc.height = Math.ceil(fs * 1.4 + pad * 2);
    o2.font = font(fs);
    o2.fillStyle = "#fff";
    const asc = o2.measureText("N").actualBoundingBoxAscent || fs * 0.64;
    const by = oc.height / 2 + asc / 2;
    let x = pad;
    for (const ch of text) { o2.fillText(ch, x, by); x += o2.measureText(ch).width + sp * fs; }
    const data = o2.getImageData(0, 0, oc.width, oc.height).data;
    let filled = 0;
    for (let i = 3; i < data.length; i += 16) if (data[i] > 120) filled++;
    filled *= 4;
    const step = Math.max(1.5, Math.sqrt(filled / TITLE_N));
    const pts = [];
    let row = 0;
    for (let yy = 0; yy < oc.height; yy += step, row++) {
      for (let xx = (row % 2) * step * 0.5; xx < oc.width; xx += step) {
        if (data[((yy | 0) * oc.width + (xx | 0)) * 4 + 3] > 120)
          pts.push(xx - oc.width / 2 + W / 2 + rand(-0.35, 0.35) * step, yy - oc.height / 2 + ty + rand(-0.35, 0.35) * step);
      }
    }
    const n = pts.length / 2;
    T.step = step; T.fs = fs; T.ty = ty;
    root.style.setProperty("--fs", fs + "px");
    root.style.setProperty("--ty", ty + "px");
    if (fresh || n !== T.n) {
      T.x = new Float32Array(n); T.y = new Float32Array(n); T.vx = new Float32Array(n); T.vy = new Float32Array(n);
      T.hx = new Float32Array(n); T.hy = new Float32Array(n); T.e = new Float32Array(n); T.ph = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        T.hx[i] = pts[i * 2]; T.hy[i] = pts[i * 2 + 1]; T.ph[i] = rand(TAU);
        T.x[i] = fresh ? W / 2 : T.hx[i];
        T.y[i] = fresh ? ty : T.hy[i];
      }
    } else {
      for (let i = 0; i < n; i++) { T.hx[i] = pts[i * 2]; T.hy[i] = pts[i * 2 + 1]; }
    }
    T.n = n;
  }
  function burstTitle() {
    for (let i = 0; i < T.n; i++) {
      const a = rand(TAU), v = Math.pow(Math.random(), 0.6) * 900 * SZ;
      T.vx[i] = Math.cos(a) * v;
      T.vy[i] = Math.sin(a) * v * 0.6;
      T.e[i] = rand(0.4, 1);
    }
  }
  function titleBlast(x, y, force = 1) {
    const py = y + S.sScroll, R = 300 * SZ;
    for (let i = 0; i < T.n; i++) {
      const dx = T.x[i] - x, dy = T.y[i] - py, d = Math.hypot(dx, dy) + 0.01;
      if (d < R) {
        const f = (1 - d / R) * force;
        T.vx[i] += (dx / d) * f * 1300;
        T.vy[i] += (dy / d) * f * 1300;
        T.e[i] = Math.max(T.e[i], f * 1.3);
      }
    }
  }
  function updateTitle(dt) {
    if (!T.n || S.burst < 0 || S.sScroll > H * 1.3) return;
    const since = S.t - S.burst;
    const k = 34 * smooth(0.25, 2.4, since), damp = 2.2 + 4.5 * smooth(0.2, 2.2, since);
    const disperse = smooth(H * 0.04, H * 0.55, S.sScroll);
    const px = P.x, py = P.y + S.sScroll;
    const Rr = (isTouch ? 62 : 88) * SZ, R2 = Rr * Rr;
    const spd = clamp(P.speed / 1200);
    const on = P.present;
    const ed = Math.exp(-2.3 * dt), vd = Math.exp(-damp * dt), kk = k * (1 - disperse);
    for (let i = 0; i < T.n; i++) {
      let ax = (T.hx[i] - T.x[i]) * kk, ay = (T.hy[i] - T.y[i]) * kk;
      if (disperse > 0) {
        ax += Math.sin(T.ph[i] * 3 + S.t) * 60 * disperse;
        ay += (Math.cos(T.ph[i] * 5 + S.t * 0.8) * 60 + 40) * disperse;
      }
      if (on) {
        const dx = T.x[i] - px, dy = T.y[i] - py, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 0.001, f = 1 - d / Rr, F = f * (1700 + 5600 * spd);
          ax += (dx / d) * F;
          ay += (dy / d) * F;
          const ne = Math.min(1, f * (0.55 + spd * 1.3));
          if (ne > T.e[i]) T.e[i] = ne;
        }
      }
      T.vx[i] = (T.vx[i] + ax * dt) * vd;
      T.vy[i] = (T.vy[i] + ay * dt) * vd;
      T.x[i] += T.vx[i] * dt;
      T.y[i] += T.vy[i] * dt;
      T.e[i] *= ed;
    }
  }
  function drawTitle() {
    const off = S.sScroll;
    if (off > H * 1.3) return;
    ADD();
    const since = S.burst < 0 ? -1 : S.t - S.burst;
    // the single first spark
    if (S.burst < 0 || since < 0.5) {
      const a = smooth(0.05, 0.7, S.t) * (S.burst < 0 ? 1 : 1 - smooth(0, 0.45, since));
      const pr = 1 + 0.3 * Math.sin(S.t * 6.5);
      G(SP.white, W / 2, T.ty - off, 24 * pr, 0.95 * a);
      G(SP.cyan, W / 2, T.ty - off, 110 * pr, 0.3 * a);
    }
    if (S.burst < 0 || !T.n) return;
    if (since < 1.8) {
      NRM();
      ctx.globalAlpha = (1 - since / 1.8) * 0.5;
      ctx.strokeStyle = "#8fe9ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(W / 2, T.ty - off, 20 + Math.pow(since, 0.7) * W * 0.5, 0, TAU);
      ctx.stroke();
      ADD();
    }
    const r0 = T.step * 2.1, settle = smooth(0.3, 2.6, since);
    for (let i = 0; i < T.n; i++) {
      const x = T.x[i], y = T.y[i] - off;
      if (y < -30 || y > H + 30) continue;
      const sh = Math.max(0, Math.sin(T.hx[i] * 0.005 - S.t * 1.05 + T.hy[i] * 0.003));
      const sh4 = sh * sh * sh * sh;
      const tw = 0.55 + 0.2 * Math.sin(S.t * 2.3 + T.ph[i] * 7) + 0.5 * sh4;
      const e = T.e[i];
      G(SP.white, x, y, r0 * (1 + e * 0.5), (0.3 + 0.26 * tw) * (0.45 + 0.55 * settle) + 0.15 * (1 - settle));
      if (e > 0.03) G(SP.cyan, x, y, r0 * 4.6, e * 0.7);
    }
    NRM();
  }

  /* ═══════════════ ZONE I · dinoflagellates, crystal jellies, comb jellies ═══════════════ */
  const DN = Math.round(520 * Q + 80);
  const dn = {
    x: new Float32Array(DN), y: new Float32Array(DN), z: new Float32Array(DN), e: new Float32Array(DN),
    vx: new Float32Array(DN), vy: new Float32Array(DN), ph: new Float32Array(DN),
  };
  for (let i = 0; i < DN; i++) {
    dn.x[i] = rand(W); dn.y[i] = rand(H); dn.z[i] = rand(0.2, 1); dn.ph[i] = rand(TAU);
  }
  const exciteAt = (x, y, R, amt) => {
    for (let i = 0; i < DN; i++) {
      const d = Math.hypot(dn.x[i] - x, dn.y[i] - y);
      if (d < R) dn.e[i] = Math.max(dn.e[i], (1 - d / R) * amt);
    }
  };
  function updatePlankton(dt, wv) {
    const stir = P.present && P.speed > 40;
    const x0 = P.px, y0 = P.py, sx = P.x - x0, sy = P.y - y0, sl2 = sx * sx + sy * sy || 1;
    const Rr = (54 + clamp(P.speed / 1500) * 56) * SZ, R2 = Rr * Rr;
    const amt = clamp(P.speed / 900, 0.3, 1);
    const ed = Math.exp(-2.1 * dt), vd = Math.exp(-1.8 * dt);
    let lit = 0;
    const waves = S.waves.map((w) => [w.x, w.y, (S.t - w.t0) * 400 * SZ, 1 - ((S.t - w.t0) * 400 * SZ) / w.max]);
    for (let i = 0; i < DN; i++) {
      const z = dn.z[i];
      dn.x[i] += dn.vx[i] * dt + Math.sin(S.t * 0.4 + dn.ph[i]) * 4 * dt;
      dn.y[i] += dn.vy[i] * dt - S.dScroll * (0.25 + z * 0.85) - 2 * dt;
      dn.vx[i] *= vd; dn.vy[i] *= vd;
      if (dn.y[i] < -20) { dn.y[i] += H + 40; dn.x[i] = rand(W); dn.e[i] = 0; }
      else if (dn.y[i] > H + 20) { dn.y[i] -= H + 40; dn.x[i] = rand(W); dn.e[i] = 0; }
      if (dn.x[i] < -20) dn.x[i] += W + 40;
      else if (dn.x[i] > W + 20) dn.x[i] -= W + 40;
      if (stir) {
        let tt = ((dn.x[i] - x0) * sx + (dn.y[i] - y0) * sy) / sl2;
        tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
        const dx = dn.x[i] - (x0 + sx * tt), dy = dn.y[i] - (y0 + sy * tt), d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const f = 1 - Math.sqrt(d2) / Rr, ne = Math.min(1, f * amt * 1.35);
          if (ne > dn.e[i]) { if (dn.e[i] < 0.2 && ne > 0.4) lit++; dn.e[i] = ne; }
          dn.vx[i] += P.vx * 0.16 * f;
          dn.vy[i] += P.vy * 0.16 * f;
        }
      }
      for (let k = 0; k < waves.length; k++) {
        const [wx, wy, rw, fade] = waves[k];
        const dx = dn.x[i] - wx, dy = dn.y[i] - wy, d = Math.sqrt(dx * dx + dy * dy) + 0.01;
        if (Math.abs(d - rw) < 24 * SZ) {
          dn.e[i] = Math.max(dn.e[i], fade);
          dn.vx[i] += (dx / d) * 40 * fade;
          dn.vy[i] += (dy / d) * 40 * fade;
        }
      }
      dn.e[i] *= ed;
    }
    if (lit > 0 && wv > 0.3) {
      S.stirCount += lit;
      if (S.stirCount > 320) log("stir");
      sound.blip(amt);
    }
    if (stir && wv > 0.2 && P.y > S.hz) {
      const n = Math.min(5, Math.floor(P.speed / 260) + 1);
      for (let k = 0; k < n; k++) {
        const tt = Math.random();
        spark(x0 + sx * tt + rand(-8, 8), y0 + sy * tt + rand(-8, 8), P.vx * 0.07 + rand(-24, 24), P.vy * 0.07 + rand(-24, 24),
          rand(0.5, 1.3), rand(5, 13) * SZ, Math.random() < 0.15 ? SP.white : SP.cyan);
      }
    }
  }
  function drawPlankton(a) {
    ADD();
    const ox = (P.ex - W / 2) * -0.02;
    for (let i = 0; i < DN; i++) {
      const z = dn.z[i], x = dn.x[i] + ox * z, y = dn.y[i];
      if (y < S.hz) continue;
      const e = dn.e[i];
      G(SP.cyan, x, y, (2.2 + z * 3.2) * SZ, (0.09 + 0.13 * z) * (0.6 + 0.4 * Math.sin(S.t * 1.7 + dn.ph[i] * 5)) * a);
      if (e > 0.02) {
        const fl = 0.75 + 0.25 * Math.sin(S.t * 38 + dn.ph[i] * 20);
        G(SP.cyan, x, y, (6 + z * 15 + e * 10) * SZ, e * fl * a);
        if (e > 0.55) G(SP.white, x, y, 3.2 * SZ, (e - 0.55) * 1.6 * a);
      }
    }
  }

  // Aequorea victoria — crystal jelly with GFP ring
  const JEL = Array.from({ length: W > 900 ? 4 : 3 }, (_, i) => ({
    key: "aequorea", x: W * (0.15 + i * 0.25 + rand(-0.05, 0.05)), y: rand(H * 0.2, H * 0.85), r: rand(34, 62) * SZ,
    ang: rand(-0.4, 0.4), vx: 0, vy: 0, ph: rand(1), rate: rand(0.32, 0.5), glow: 0, z: rand(0.55, 1), seed: rand(TAU), s: 0, touchT: 0,
  }));
  JEL.forEach((j) => (j.fr = j.r * 1.3));
  function updateJelly(j, dt) {
    j.ph = (j.ph + dt * j.rate) % 1;
    j.s = j.ph < 0.22 ? smooth(0, 0.22, j.ph) : 1 - smooth(0.22, 1, j.ph);
    const hx = Math.sin(j.ang), hy = -Math.cos(j.ang);
    if (j.ph < 0.22) { j.vx += hx * 58 * dt; j.vy += hy * 58 * dt; }
    j.vx *= Math.exp(-1.1 * dt);
    j.vy *= Math.exp(-1.1 * dt);
    j.vy += 4 * dt;
    j.ang += Math.sin(S.t * 0.2 + j.seed) * 0.12 * dt - j.ang * 0.12 * dt;
    const dx = j.x - P.x, dy = j.y - j.r * 0.4 - P.y, d = Math.hypot(dx, dy) + 0.01;
    if (P.present && d < j.r * 2.2) {
      const f = 1 - d / (j.r * 2.2);
      j.glow = Math.min(1, j.glow + f * dt * 5);
      j.vx += (dx / d) * f * 80 * dt;
      j.vy += (dy / d) * f * 80 * dt;
      j.ang += angDiff(Math.atan2(dx, -dy), j.ang) * f * dt * 1.2;
      j.touchT += dt;
      if (j.touchT > 0.5 && S.w[1] > 0.5) log("gfp");
    } else j.touchT = Math.max(0, j.touchT - dt);
    for (const w of S.waves) {
      const rw = (S.t - w.t0) * 400 * SZ;
      if (Math.abs(Math.hypot(j.x - w.x, j.y - w.y) - rw) < j.r) j.glow = Math.max(j.glow, 0.8);
    }
    j.glow *= Math.exp(-0.7 * dt);
    j.x += j.vx * dt;
    j.y += j.vy * dt - S.dScroll * 0.35 * j.z;
    if (j.y < -j.r * 4) { j.y = H + j.r * 1.5; j.x = rand(W * 0.1, W * 0.9); }
    if (j.y > H + j.r * 4) { j.y = -j.r * 1.5; j.x = rand(W * 0.1, W * 0.9); }
    if (j.x < -j.r * 3) j.x = W + j.r * 2;
    if (j.x > W + j.r * 3) j.x = -j.r * 2;
  }
  function drawJelly(j, a) {
    const r = j.r, s = j.s, bw = r * (1 - 0.16 * s), bh = r * (0.78 + 0.14 * s);
    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.rotate(j.ang);
    const c = Math.cos(-j.ang), sn = Math.sin(-j.ang);
    const lvx = j.vx * c - j.vy * sn, lvy = j.vx * sn + j.vy * c;
    ADD();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(165,220,255,${0.15 * a})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    const NT = 14;
    for (let i = 0; i < NT; i++) {
      const u = (i / (NT - 1)) * 2 - 1, bx = u * bw * 0.95;
      const L = r * (2 + 1.1 * Math.pow(Math.sin(i * 12.9 + j.seed), 2));
      ctx.moveTo(bx, 0);
      for (let k = 1; k <= 10; k++) {
        const f = k / 10, sw = Math.sin(S.t * 1.6 + f * 4 + i * 0.9 + j.seed) * r * 0.13 * f;
        ctx.lineTo(bx * (1 - f * 0.3) + sw - lvx * f * 0.55, f * L - Math.max(0, -lvy) * f * 0.25);
      }
    }
    ctx.stroke();
    // bell
    const g = ctx.createRadialGradient(0, -bh * 0.55, 0, 0, -bh * 0.4, r * 1.15);
    g.addColorStop(0, `rgba(200,240,255,${0.17 * a})`);
    g.addColorStop(1, `rgba(110,200,255,${0.03 * a})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-bw, 0);
    ctx.bezierCurveTo(-bw, -bh * 0.75, -bw * 0.6, -bh, 0, -bh);
    ctx.bezierCurveTo(bw * 0.6, -bh, bw, -bh * 0.75, bw, 0);
    ctx.quadraticCurveTo(0, -bh * 0.3, -bw, 0);
    ctx.fill();
    ctx.strokeStyle = `rgba(195,242,255,${0.36 * a})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    // radial canals
    ctx.beginPath();
    for (let i = 0; i < 11; i++) {
      const u = (i / 10) * 2 - 1;
      ctx.moveTo(u * bw * 0.16, -bh * 0.66);
      ctx.quadraticCurveTo(u * bw * 0.72, -bh * 0.6, u * bw * 0.96, -2);
    }
    ctx.strokeStyle = `rgba(180,235,255,${0.11 * a})`;
    ctx.stroke();
    // manubrium
    ctx.fillStyle = `rgba(200,240,255,${0.08 * a})`;
    ctx.beginPath();
    ctx.ellipse(0, -bh * 0.22, bw * 0.18, bh * 0.16, 0, 0, TAU);
    ctx.fill();
    // the GFP ring: blue aequorin light re-emitted as green
    const NG = 26;
    for (let k = 0; k < NG; k++) {
      const th = (k / NG) * TAU, mx = Math.cos(th) * bw * 0.97, my = Math.sin(th) * bh * 0.1 - 1;
      const front = Math.sin(th) > 0 ? 1 : 0.45, fl = 0.6 + 0.4 * Math.sin(S.t * 3 + k * 1.7);
      G(SP.green, mx, my, (4.5 + j.glow * 10) * SZ, (0.16 + j.glow * 0.84) * front * fl * a);
    }
    if (j.glow > 0.05) G(SP.greenS, 0, -bh * 0.35, r * 2.3, j.glow * 0.2 * a);
    ctx.restore();
    NRM();
  }

  // Comb jelly — diffraction rainbows + blue-green flash
  const COMB = Array.from({ length: 3 }, () => ({
    key: "ctenophore", x: rand(W * 0.1, W * 0.9), y: rand(H * 0.15, H * 0.9), s: rand(16, 30) * SZ, ang: rand(-0.5, 0.5),
    vx: rand(-6, 6), vy: rand(-12, -4), glow: 0, seed: rand(TAU), z: rand(0.5, 1),
  }));
  COMB.forEach((c) => (c.fr = c.s * 1.6));
  function updateComb(c, dt) {
    c.ang += Math.sin(S.t * 0.3 + c.seed) * 0.2 * dt;
    const sp = 14 + Math.sin(S.t * 0.7 + c.seed) * 4;
    c.vx += (Math.sin(c.ang) * sp - c.vx) * dt;
    c.vy += (-Math.cos(c.ang) * sp - c.vy) * dt;
    const dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy) + 0.01;
    if (P.present && d < c.s * 3) {
      const f = 1 - d / (c.s * 3);
      c.glow = Math.min(1, c.glow + f * dt * 6);
      c.vx += (dx / d) * f * 120 * dt;
      c.vy += (dy / d) * f * 120 * dt;
    }
    for (const w of S.waves) {
      const rw = (S.t - w.t0) * 400 * SZ;
      if (Math.abs(Math.hypot(c.x - w.x, c.y - w.y) - rw) < c.s * 1.5) c.glow = 1;
    }
    c.glow *= Math.exp(-1.1 * dt);
    c.x += c.vx * dt;
    c.y += c.vy * dt - S.dScroll * 0.4 * c.z;
    if (c.y < -c.s * 6) { c.y = H + c.s * 3; c.x = rand(W); }
    if (c.y > H + c.s * 6) { c.y = -c.s * 3; c.x = rand(W); }
    if (c.x < -c.s * 4) c.x = W + c.s * 3;
    if (c.x > W + c.s * 4) c.x = -c.s * 3;
  }
  function drawComb(c, a) {
    const s = c.s, rx = s * 0.62, ry = s;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.ang);
    ADD();
    ctx.globalAlpha = 1;
    // two trailing tentacles with side filaments
    ctx.strokeStyle = `rgba(200,230,255,${0.14 * a})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      let px = side * rx * 0.4, py = ry * 0.3;
      ctx.moveTo(px, py);
      for (let k = 1; k <= 16; k++) {
        const f = k / 16;
        const nx = side * rx * (0.4 + f * 0.5) + Math.sin(S.t * 2 + f * 6 + c.seed) * s * 0.35 * f;
        const ny = ry * (0.3 + f * 4.2);
        ctx.lineTo(nx, ny);
        if (k % 2 === 0) { ctx.moveTo(nx, ny); ctx.lineTo(nx + side * s * 0.3, ny + s * 0.15); ctx.moveTo(nx, ny); }
        px = nx; py = ny;
      }
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(190,225,255,${0.07 * a})`;
    ctx.strokeStyle = `rgba(205,235,255,${0.26 * a})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // eight comb rows (we see ~6): travelling diffraction rainbow
    for (let m = 0; m < 6; m++) {
      const mm = -0.85 + m * 0.34;
      for (let k = 0; k < 12; k++) {
        const v = -0.86 + k * (1.72 / 11), x = rx * mm * Math.sqrt(1 - v * v) * 0.98, y = ry * v;
        const wave = 0.5 + 0.5 * Math.sin(S.t * 9 - k * 0.8 + m);
        const hue = (S.t * 120 + k * 24 + m * 50) % 360;
        ctx.fillStyle = `hsla(${hue | 0},100%,72%,${(0.12 + 0.62 * wave) * a * (1 - Math.abs(mm) * 0.4)})`;
        ctx.fillRect(x - 1.3, y - 0.7, 2.6, 1.6);
        if (c.glow > 0.05 && k % 2 === 0) G(SP.aqua, x, y, 7 * SZ, c.glow * 0.7 * wave * a);
      }
    }
    if (c.glow > 0.05) G(SP.aquaS, 0, 0, s * 2.4, c.glow * 0.2 * a);
    ctx.restore();
    NRM();
  }

  /* ═══════════════ ZONE II · lanternfish school, hatchetfish, firefly squid ═══════════════ */
  const BN = Math.round(105 * Q + 24);
  const bo = {
    x: new Float32Array(BN), y: new Float32Array(BN), vx: new Float32Array(BN), vy: new Float32Array(BN),
    len: new Float32Array(BN), st: new Float32Array(BN), ph: new Float32Array(BN),
  };
  for (let i = 0; i < BN; i++) {
    const school = i % 2, cx = W * (school ? 0.3 : 0.7), cy = H * (school ? 0.4 : 0.62);
    bo.x[i] = cx + rand(-120, 120) * SZ;
    bo.y[i] = cy + rand(-70, 70) * SZ;
    const a = school ? 0.1 : Math.PI + 0.1;
    bo.vx[i] = Math.cos(a) * 50;
    bo.vy[i] = Math.sin(a) * 50;
    bo.len[i] = rand(11, 19) * SZ;
    bo.ph[i] = rand(TAU);
  }
  function updateBoids(dt) {
    const flee = (P.present || P.down) ? 150 * SZ : 0;
    let fleeing = 0;
    for (let i = 0; i < BN; i++) {
      let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0, pan = 0;
      const xi = bo.x[i], yi = bo.y[i];
      for (let j = 0; j < BN; j++) {
        if (j === i) continue;
        const dx = bo.x[j] - xi, dy = bo.y[j] - yi, d2 = dx * dx + dy * dy;
        if (d2 < 3600 * SZ * SZ) {
          cx += dx; cy += dy; ax += bo.vx[j]; ay += bo.vy[j]; n++;
          if (bo.st[j] > pan) pan = bo.st[j];
          if (d2 < 220 * SZ * SZ) { sx -= dx / (d2 + 1); sy -= dy / (d2 + 1); }
        }
      }
      let fx = 0, fy = 0;
      if (n) {
        fx += (cx / n) * 0.9 + (ax / n - bo.vx[i]) * 1.1 + sx * 2600;
        fy += (cy / n) * 0.9 + (ay / n - bo.vy[i]) * 1.1 + sy * 2600;
        // panic spreads through the school as a travelling wave of flashes
        if (pan * 0.86 > bo.st[i]) bo.st[i] = pan * 0.86;
      }
      if (flee) {
        const dx = xi - P.x, dy = yi - P.y, d = Math.hypot(dx, dy) + 0.01;
        if (d < flee) {
          const f = 1 - d / flee;
          fx += (dx / d) * f * 2400;
          fy += (dy / d) * f * 2400;
          bo.st[i] = Math.max(bo.st[i], f + 0.3);
          fleeing++;
        }
      }
      if (yi < H * 0.12) fy += 90;
      if (yi > H * 0.88) fy -= 90;
      fx += Math.sin(S.t * 0.3 + (i & 1) * 3) * 10;
      bo.vx[i] += fx * dt;
      bo.vy[i] += fy * dt;
      const sp = Math.hypot(bo.vx[i], bo.vy[i]) + 0.01;
      const mx = 62 + bo.st[i] * 200, mn = 26;
      const k = sp > mx ? mx / sp : sp < mn ? mn / sp : 1;
      bo.vx[i] *= k;
      bo.vy[i] *= k;
      bo.st[i] *= Math.exp(-1.3 * dt);
    }
    for (let i = 0; i < BN; i++) {
      bo.x[i] += bo.vx[i] * dt;
      bo.y[i] += bo.vy[i] * dt - S.dScroll * 0.5;
      if (bo.x[i] < -40) bo.x[i] += W + 80;
      else if (bo.x[i] > W + 40) bo.x[i] -= W + 80;
      if (bo.y[i] < -60) bo.y[i] += H + 120;
      else if (bo.y[i] > H + 60) bo.y[i] -= H + 120;
    }
    if (fleeing > 10 && S.w[2] > 0.5) log("school");
    if (fleeing > 4) sound.blip(0.4);
  }
  function startle(x, y) {
    for (let i = 0; i < BN; i++) {
      const dx = bo.x[i] - x, dy = bo.y[i] - y, d = Math.hypot(dx, dy) + 0.01;
      if (d < 280 * SZ) {
        const f = 1 - d / (280 * SZ);
        bo.st[i] = 1.2;
        bo.vx[i] += (dx / d) * 260 * f;
        bo.vy[i] += (dy / d) * 260 * f;
      }
    }
    for (const q of FFS) if (Math.hypot(q.x - x, q.y - y) < 200 * SZ) { q.flash = 1; log("squid"); }
    ripple(x, y, 280 * SZ, "140,170,255", 1.2);
    sound.chord(659.25);
  }
  // As daylight dies (S.sun → 0), silhouettes dissolve and photophores gain contrast.
  const silOf = () => 0.08 + 0.92 * S.sun;
  const glowOf = () => Math.min(2.2, 1 + 1.3 * (1 - S.sun));
  function drawBoids(a) {
    const sil = silOf(), glow = glowOf(), gsz = 1 + 0.35 * (1 - S.sun);
    NRM();
    for (let i = 0; i < BN; i++) {
      const L = bo.len[i], ang = Math.atan2(bo.vy[i], bo.vx[i]);
      const tail = Math.sin(S.t * (10 + bo.st[i] * 12) + bo.ph[i]) * 0.35;
      ctx.save();
      ctx.translate(bo.x[i], bo.y[i]);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(L * 0.5, 0);
      ctx.quadraticCurveTo(L * 0.2, -L * 0.22, -L * 0.34, -L * 0.05);
      ctx.lineTo(-L * 0.52, -L * 0.17 + tail * L * 0.2);
      ctx.lineTo(-L * 0.44, tail * L * 0.1);
      ctx.lineTo(-L * 0.52, L * 0.17 + tail * L * 0.2);
      ctx.lineTo(-L * 0.34, L * 0.05);
      ctx.quadraticCurveTo(L * 0.2, L * 0.22, L * 0.5, 0);
      ctx.fillStyle = `rgba(22,34,72,${0.92 * a * sil})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(140,170,255,${0.22 * a * sil})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.fillStyle = `rgba(190,210,255,${0.55 * a * sil})`;
      ctx.beginPath();
      ctx.arc(L * 0.3, -L * 0.03, L * 0.07, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ADD();
    for (let i = 0; i < BN; i++) {
      const L = bo.len[i], ang = Math.atan2(bo.vy[i], bo.vx[i]), c = Math.cos(ang), s = Math.sin(ang);
      const st = Math.min(1, bo.st[i]);
      const fl = 0.7 + 0.3 * Math.sin(S.t * 3 + bo.ph[i]);
      for (let k = 0; k < 5; k++) {
        const lx = L * (0.3 - k * 0.15), ly = L * 0.11;
        G(SP.blue, bo.x[i] + lx * c - ly * s, bo.y[i] + lx * s + ly * c, (2.6 + st * 6) * SZ * gsz, (0.38 + 0.62 * st) * fl * a * glow);
      }
      G(SP.cyan, bo.x[i] + L * 0.36 * c, bo.y[i] + L * 0.36 * s, (2 + st * 4) * SZ * gsz, (0.3 + 0.7 * st) * a * glow);
    }
    NRM();
  }

  // Silver hatchetfish — counter-illumination
  const HAT = Array.from({ length: 3 }, (_, i) => ({
    key: "hatchetfish", x: W * (0.2 + i * 0.3), y: rand(H * 0.25, H * 0.8), L: rand(40, 58) * SZ, dir: Math.random() < 0.5 ? -1 : 1,
    vx: 0, seed: rand(TAU), z: rand(0.6, 1),
  }));
  HAT.forEach((h) => (h.fr = h.L * 0.8));
  function updateHatchet(h, dt) {
    const tgt = h.dir * (10 + Math.sin(S.t * 0.3 + h.seed) * 5);
    h.vx += (tgt - h.vx) * dt * 0.8;
    const dx = h.x - P.x, dy = h.y - P.y, d = Math.hypot(dx, dy) + 0.01;
    if (P.present && d < 150 * SZ) {
      h.vx += (dx / d) * 120 * dt;
      if (Math.sign(dx) !== h.dir && d < 100 * SZ) h.dir = Math.sign(dx) || 1;
    }
    h.x += h.vx * dt;
    h.y += Math.sin(S.t * 0.8 + h.seed) * 6 * dt - S.dScroll * 0.55 * h.z;
    if (h.x < -h.L * 2) h.x = W + h.L * 1.5;
    if (h.x > W + h.L * 2) h.x = -h.L * 1.5;
    if (h.y < -h.L * 2) { h.y = H + h.L; }
    if (h.y > H + h.L * 2) { h.y = -h.L; }
  }
  function drawHatchet(h, a) {
    const L = h.L, hh = L * 0.8, sil = silOf(), glow = glowOf();
    const face = h.vx >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(Math.sin(S.t * 0.8 + h.seed) * 0.05);
    ctx.scale(face, 1);
    // counter-illumination: photophores pour light downward to erase the silhouette
    ADD();
    ctx.globalAlpha = 1;
    const cg = ctx.createLinearGradient(0, hh * 0.3, 0, hh * 2.4);
    cg.addColorStop(0, `rgba(110,160,255,${0.16 * a * S.sun})`); // matched to daylight: dims as daylight dies
    cg.addColorStop(1, "rgba(110,160,255,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(-L * 0.3, hh * 0.2);
    ctx.lineTo(L * 0.3, hh * 0.2);
    ctx.lineTo(L * 0.55, hh * 2.4);
    ctx.lineTo(-L * 0.55, hh * 2.4);
    ctx.closePath();
    ctx.fill();
    NRM();
    ctx.beginPath();
    ctx.moveTo(L * 0.42, -hh * 0.12);
    ctx.quadraticCurveTo(L * 0.3, -hh * 0.46, L * 0.05, -hh * 0.42);
    ctx.lineTo(-L * 0.2, -hh * 0.3);
    ctx.quadraticCurveTo(-L * 0.32, -hh * 0.12, -L * 0.42, -hh * 0.06);
    ctx.lineTo(-L * 0.6, -hh * 0.22);
    ctx.lineTo(-L * 0.55, 0);
    ctx.lineTo(-L * 0.6, hh * 0.2);
    ctx.lineTo(-L * 0.42, hh * 0.06);
    ctx.quadraticCurveTo(-L * 0.2, hh * 0.2, -L * 0.05, hh * 0.5);
    ctx.quadraticCurveTo(L * 0.2, hh * 0.46, L * 0.38, hh * 0.12);
    ctx.closePath();
    const sg = ctx.createLinearGradient(0, -hh * 0.45, 0, hh * 0.5);
    sg.addColorStop(0, `rgba(200,215,238,${0.6 * a * sil})`);
    sg.addColorStop(0.45, `rgba(110,130,170,${0.55 * a * sil})`);
    sg.addColorStop(1, `rgba(30,42,78,${0.7 * a * sil})`);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = `rgba(215,228,255,${0.35 * a * sil})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = `rgba(235,245,255,${0.1 * a * sil})`;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const x = L * (0.25 - k * 0.1);
      ctx.moveTo(x, -hh * 0.32);
      ctx.quadraticCurveTo(x - L * 0.04, 0, x - L * 0.02, hh * 0.3);
    }
    ctx.stroke();
    // upward-looking tubular eye
    ctx.fillStyle = `rgba(8,12,28,${0.95 * a * sil})`;
    ctx.beginPath();
    ctx.arc(L * 0.26, -hh * 0.26, L * 0.085, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(220,235,255,${0.5 * a * sil})`;
    ctx.stroke();
    ADD();
    G(SP.white, L * 0.24, -hh * 0.29, L * 0.05, 0.5 * a * sil);
    for (let k = 0; k < 10; k++) {
      const f = k / 9, x = lerp(L * 0.3, -L * 0.3, f), y = hh * (0.18 + Math.sin(f * Math.PI) * 0.3);
      G(SP.blue, x, y, 4.5 * SZ, (0.55 + 0.25 * Math.sin(S.t * 2 + k)) * a * (0.4 + 0.6 * S.sun) * glow);
    }
    ctx.restore();
    NRM();
  }

  // Firefly squid — jet-propelled constellations
  const FFS = Array.from({ length: W > 900 ? 6 : 4 }, () => {
    const L = rand(28, 40) * SZ;
    const pts = Array.from({ length: 26 }, () => {
      const u = Math.random();
      const half = L * 0.13 * Math.sin(Math.min(1, u * 1.1) * Math.PI * 0.9 + 0.2);
      return [lerp(-L * 0.52, L * 0.05, u), rand(-half, half), rand(TAU), rand(1.5, 4)];
    });
    return { key: "firefly", x: rand(W), y: rand(H * 0.15, H * 0.85), L, vx: 0, vy: 0, h: rand(TAU), timer: rand(0.5, 2.5), flash: 0, pts, seed: rand(TAU), jet: 0, fr: L };
  });
  function updateSquid(q, dt) {
    q.timer -= dt;
    if (q.timer <= 0) {
      q.h += rand(-0.9, 0.9);
      if (q.y < H * 0.15) q.h = Math.PI / 2 + rand(-0.5, 0.5);
      if (q.y > H * 0.85) q.h = -Math.PI / 2 + rand(-0.5, 0.5);
      const imp = rand(80, 150) * SZ;
      q.vx += Math.cos(q.h) * imp;
      q.vy += Math.sin(q.h) * imp;
      q.timer = rand(1.2, 2.8);
      q.jet = 1;
    }
    const dx = q.x - P.x, dy = q.y - P.y, d = Math.hypot(dx, dy) + 0.01;
    if (P.present && d < 90 * SZ && P.speed > 200) { q.flash = Math.max(q.flash, 0.8); }
    q.jet *= Math.exp(-3 * dt);
    q.vx *= Math.exp(-1.8 * dt);
    q.vy *= Math.exp(-1.8 * dt);
    q.x += q.vx * dt;
    q.y += q.vy * dt - S.dScroll * 0.6;
    q.flash *= Math.exp(-1.4 * dt);
    if (q.x < -60) q.x = W + 50;
    if (q.x > W + 60) q.x = -50;
    if (q.y < -80) q.y = H + 60;
    if (q.y > H + 80) q.y = -60;
  }
  function drawSquid(q, a) {
    const L = q.L, sp = Math.hypot(q.vx, q.vy);
    const ang = sp > 4 ? Math.atan2(q.vy, q.vx) : q.h;
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(ang + Math.PI); // squid jet mantle-first: arms trail
    NRM();
    ctx.beginPath();
    ctx.moveTo(-L * 0.55, 0);
    ctx.quadraticCurveTo(-L * 0.3, -L * 0.16, L * 0.05, -L * 0.12);
    ctx.lineTo(L * 0.05, L * 0.12);
    ctx.quadraticCurveTo(-L * 0.3, L * 0.16, -L * 0.55, 0);
    ctx.moveTo(-L * 0.55, 0);
    ctx.lineTo(-L * 0.4, -L * 0.14);
    ctx.lineTo(-L * 0.3, 0);
    ctx.lineTo(-L * 0.4, L * 0.14);
    ctx.closePath();
    ctx.fillStyle = `rgba(60,84,150,${0.32 * a * silOf()})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(160,190,255,${0.3 * a * silOf()})`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(L * 0.11, 0, L * 0.07, L * 0.09, 0, 0, TAU);
    ctx.fill();
    const spread = 0.35 - q.jet * 0.25;
    ctx.beginPath();
    const tips = [];
    for (let k = 0; k < 8; k++) {
      const u = (k / 7) * 2 - 1, al = L * (0.42 + (k === 0 || k === 7 ? 0.08 : 0));
      const ex = L * 0.16 + al, ey = u * al * spread + Math.sin(S.t * 4 + k + q.seed) * L * 0.03;
      ctx.moveTo(L * 0.16, u * L * 0.05);
      ctx.quadraticCurveTo(L * 0.16 + al * 0.5, u * L * 0.06, ex, ey);
      tips.push([ex, ey]);
    }
    ctx.stroke();
    ADD();
    const fl = q.flash;
    for (const [px, py, ph, r] of q.pts) {
      const tw = 0.35 + 0.65 * Math.max(0, Math.sin(S.t * r + ph));
      G(SP.blue, px, py, (2.5 + fl * 4) * SZ, (0.25 + 0.45 * tw + fl * 0.6) * a);
    }
    // the three bright photophores on each fourth arm
    for (const [ex, ey] of [tips[0], tips[7]]) {
      for (let k = 0; k < 3; k++) G(SP.blue, ex - k * L * 0.05, ey * (1 - k * 0.08), (5 + fl * 8) * SZ, (0.75 + fl * 0.25) * a);
    }
    G(SP.cyan, L * 0.11, -L * 0.05, 2.5 * SZ, 0.7 * a);
    G(SP.cyan, L * 0.11, L * 0.05, 2.5 * SZ, 0.7 * a);
    if (fl > 0.05) G(SP.blueS, -L * 0.15, 0, L * 2.2, fl * 0.3 * a);
    ctx.restore();
    NRM();
  }

  /* ═══════════════ ZONE III · darkness, lures, alarms, red searchlights ═══════════════ */
  // Everything here is invisible unless lit. LIGHTS is rebuilt every frame.
  const LIGHTS = [];
  const illum = (x, y, skip) => {
    let s = 0;
    for (let i = 0; i < LIGHTS.length; i++) {
      const L = LIGHTS[i];
      if (L.tag && L.tag === skip) continue;
      const dx = x - L.x, dy = y - L.y, d2 = dx * dx + dy * dy, r2 = L.r * L.r;
      if (d2 < r2) s += L.i * (1 - d2 / r2);
    }
    return s;
  };

  // Humpback anglerfish
  const ANG = {
    key: "angler", x: W * 0.68, y: H * 0.58, fx: -1, fxT: -1, vx: 0, vy: 0, mode: "lurk", mt: 0, jaw: 0.1, snapT: 0,
    s: clamp(Math.min(W, H) * 0.3, 110, 270), dim: 1, tx: 0, ty: 0, real: false, lx: 0, ly: 0,
  };
  ANG.fr = ANG.s * 0.55;
  function anglerEscaLocal() {
    const s = ANG.s;
    return [s * 0.6 + Math.sin(S.t * 0.9) * s * 0.04, -s * 0.56 + Math.sin(S.t * 1.3) * s * 0.03];
  }
  function updateAngler(dt) {
    const A = ANG, s = A.s;
    const [lx, ly] = anglerEscaLocal();
    const ex = A.x + lx * A.fx, ey = A.y + ly;
    A.ex = ex; A.ey = ey;
    const real = P.present;
    if (A.mode === "lurk") {
      if (Math.abs(P.ex - A.x) > s * 0.35) A.fxT = P.ex > A.x ? 1 : -1;
      let tx, ty;
      if (real || isTouch) {
        tx = P.ex - A.fxT * s * 1.05;
        ty = P.ey + s * 0.6;
      } else {
        tx = W * 0.64 + Math.sin(S.t * 0.13) * W * 0.12;
        ty = H * 0.58 + Math.sin(S.t * 0.17) * H * 0.08;
      }
      tx = clamp(tx, -s * 0.1, W + s * 0.1);
      ty = clamp(ty, H * 0.25, H * 0.92);
      A.vx += (tx - A.x) * 0.5 * dt;
      A.vy += (ty - A.y) * 0.5 * dt;
      const sp = Math.hypot(A.vx, A.vy), mx = 120 * SZ;
      if (sp > mx) { A.vx *= mx / sp; A.vy *= mx / sp; }
      A.vx *= Math.exp(-1.2 * dt);
      A.vy *= Math.exp(-1.2 * dt);
      A.jaw = 0.08 + 0.05 * Math.sin(S.t * 1.2);
      const dp = Math.hypot(P.ex - ex, P.ey - ey);
      if (dp < (30 + (isTouch ? 22 : 0)) * SZ && S.w[3] > 0.6) A.snapT += dt;
      else A.snapT = Math.max(0, A.snapT - dt * 2);
      if (A.snapT > 0.22) { A.mode = "lunge"; A.mt = 0; A.tx = P.ex; A.ty = P.ey; A.real = real; A.snapT = 0; }
    } else if (A.mode === "lunge") {
      A.mt += dt;
      A.jaw = Math.max(0.08, smooth(0, 0.12, A.mt) - smooth(0.24, 0.32, A.mt));
      const mxw = A.x + s * 0.44 * A.fx, myw = A.y;
      const k = Math.min(1, dt * 16);
      A.x += (A.tx - mxw) * k;
      A.y += (A.ty - myw) * k;
      A.vx = 0; A.vy = 0;
      if (A.mt > 0.27 && !A.snapped) {
        A.snapped = true;
        if (A.real) { S.flash = 0.9; S.shake = 16; log("lure"); }
        else S.shake = 5;
        sound.thud();
      }
      if (A.mt > 0.55) { A.mode = "recover"; A.mt = 0; A.snapped = false; }
    } else {
      A.mt += dt;
      A.jaw = 0.08;
      A.dim = smooth(0.4, 2.6, A.mt);
      A.vx += (A.fx * -30 - A.vx) * dt;
      if (A.mt > 3) { A.mode = "lurk"; A.dim = 1; }
    }
    A.fx += (A.fxT - A.fx) * (1 - Math.exp(-dt * 2.2));
    A.x += A.vx * dt;
    A.y += A.vy * dt;
    A.x = clamp(A.x, -s * 0.4, W + s * 0.4);
    A.y = clamp(A.y, s * 0.2, H + s * 0.3);
  }
  function drawAngler(a) {
    const A = ANG, s = A.s;
    const [lx, ly] = anglerEscaLocal();
    ctx.save();
    ctx.translate(A.x, A.y);
    ctx.scale(A.fx, 1);
    NRM();
    const th = A.jaw * 0.62, cx = s * 0.1, cy = s * 0.04, cs = Math.cos(th), sn = Math.sin(th);
    const rot = (px, py) => [cx + (px - cx) * cs - (py - cy) * sn, cy + (px - cx) * sn + (py - cy) * cs];
    const [ltx, lty] = rot(s * 0.54, -s * 0.05);
    const [chx, chy] = rot(s * 0.34, s * 0.22);
    const [c2x, c2y] = rot(s * 0.52, s * 0.12);
    const wag = Math.sin(S.t * 2) * s * 0.03;
    // tail fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, 0);
    ctx.quadraticCurveTo(-s * 0.7, -s * 0.2 + wag, -s * 0.82, -s * 0.17 + wag);
    ctx.quadraticCurveTo(-s * 0.74, wag, -s * 0.82, s * 0.17 + wag);
    ctx.quadraticCurveTo(-s * 0.7, s * 0.2 + wag, -s * 0.55, 0);
    ctx.fillStyle = `rgba(6,8,14,${0.95 * a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(120,160,210,${0.14 * a})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    // body
    const body = new Path2D();
    body.moveTo(s * 0.47, -s * 0.1);
    body.bezierCurveTo(s * 0.4, -s * 0.36, s * 0.08, -s * 0.47, -s * 0.22, -s * 0.32);
    body.quadraticCurveTo(-s * 0.42, -s * 0.2, -s * 0.58, -s * 0.06);
    body.lineTo(-s * 0.58, s * 0.06);
    body.quadraticCurveTo(-s * 0.4, s * 0.26, -s * 0.1, s * 0.34);
    body.quadraticCurveTo(s * 0.18, s * 0.38, chx, chy);
    body.quadraticCurveTo(c2x, c2y, ltx, lty);
    body.lineTo(cx, cy);
    body.closePath();
    ctx.fillStyle = `rgba(5,7,12,${0.97 * a})`;
    ctx.fill(body);
    const li = A.dim;
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, s * 1.0);
    lg.addColorStop(0, `rgba(140,195,235,${0.42 * li * a})`);
    lg.addColorStop(0.3, `rgba(55,90,135,${0.22 * li * a})`);
    lg.addColorStop(0.7, `rgba(25,40,70,${0.08 * li * a})`);
    lg.addColorStop(1, "rgba(10,16,30,0)");
    ctx.fillStyle = lg;
    ctx.fill(body);
    const ext = Math.min(1, illum(A.x, A.y, "angler"));
    if (ext > 0.02) { ctx.fillStyle = `rgba(60,100,210,${0.35 * ext * a})`; ctx.fill(body); }
    ctx.strokeStyle = `rgba(140,180,230,${(0.1 + 0.2 * li) * a})`;
    ctx.stroke(body);
    // lateral-line pores & skin texture
    ctx.fillStyle = `rgba(150,190,235,${0.16 * li * a})`;
    for (let k = 0; k < 9; k++) {
      const f = k / 8;
      ctx.beginPath();
      ctx.arc(lerp(s * 0.2, -s * 0.45, f), lerp(-s * 0.14, -s * 0.02, f) + Math.sin(k * 2) * s * 0.015, s * 0.008, 0, TAU);
      ctx.fill();
    }
    // pectoral fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, s * 0.06);
    ctx.quadraticCurveTo(-s * 0.22, s * 0.12 + wag, -s * 0.24, s * 0.24 + wag);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.2, -s * 0.05, s * 0.06);
    ctx.fillStyle = `rgba(70,100,140,${0.22 * li * a})`;
    ctx.fill();
    // teeth
    ctx.strokeStyle = `rgba(220,235,252,${(0.35 + 0.5 * li) * a})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      const f = (k + 0.5) / 9, px = lerp(s * 0.46, cx, f), py = lerp(-s * 0.1, cy, f);
      const len = s * (0.075 - f * 0.045) * (0.7 + 0.3 * ((k * 7) % 3) / 2);
      ctx.moveTo(px, py);
      ctx.lineTo(px + s * 0.008, py + len);
    }
    for (let k = 0; k < 8; k++) {
      const f = (k + 0.5) / 8, px = lerp(ltx, cx, f), py = lerp(lty, cy, f);
      const len = s * (0.085 - f * 0.05) * (0.7 + 0.3 * ((k * 5) % 3) / 2);
      ctx.moveTo(px, py);
      ctx.lineTo(px + sn * len + s * 0.006, py - cs * len);
    }
    ctx.stroke();
    // eye
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.beginPath();
    ctx.arc(s * 0.27, -s * 0.2, s * 0.03, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(150,190,230,${0.3 * li * a})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    // illicium
    ctx.strokeStyle = `rgba(120,150,190,${0.55 * a})`;
    ctx.lineWidth = Math.max(1.2, s * 0.008);
    ctx.beginPath();
    ctx.moveTo(s * 0.2, -s * 0.4);
    ctx.quadraticCurveTo(s * 0.44, -s * 0.86, lx, ly);
    ctx.stroke();
    ADD();
    G(SP.white, s * 0.262, -s * 0.21, s * 0.022, 0.55 * li * a);
    const fl = (0.85 + 0.15 * Math.sin(S.t * 5.3) * Math.sin(S.t * 3.1)) * li;
    G(SP.cyanS, lx, ly, s * 0.95, 0.16 * fl * a);
    G(SP.cyan, lx, ly, s * 0.42, 0.5 * fl * a);
    G(SP.white, lx, ly, s * 0.13, 0.95 * fl * a);
    ctx.restore();
    NRM();
  }

  // Atolla — the burglar-alarm jellyfish
  const ATL = Array.from({ length: W > 900 ? 3 : 2 }, (_, i) => ({
    key: "atolla", x: W * (0.2 + i * 0.32 + rand(-0.05, 0.05)), y: rand(H * 0.2, H * 0.75), r: rand(26, 40) * SZ,
    al: 0, alT: 0, seed: rand(TAU), z: rand(0.6, 1), vx: 0,
  }));
  ATL.forEach((t) => (t.fr = t.r * 1.5));
  function triggerAtolla(t) {
    if (t.al > 0.5) return;
    t.al = 1;
    t.alT = 0;
    log("alarm");
    sound.alarm(0.6);
  }
  function updateAtolla(t, dt) {
    t.x += Math.sin(S.t * 0.1 + t.seed) * 7 * dt;
    t.y += Math.sin(S.t * 0.3 + t.seed) * 6 * dt - S.dScroll * 0.4 * t.z;
    if (t.al > 0) {
      t.alT += dt;
      t.al = 1 - smooth(2.4, 3.8, t.alT);
      if (t.alT > 3.8) t.al = 0;
      LIGHTS.push({ x: t.x, y: t.y, r: t.r * 7, i: 0.55 * t.al });
    }
    if (P.down && Math.hypot(P.x - t.x, P.y - t.y) < t.r * 1.6 && S.t - P.downT < 0.2) triggerAtolla(t);
    if (t.y < -t.r * 7) { t.y = H + t.r * 2; t.x = rand(W * 0.1, W * 0.9); }
    if (t.y > H + t.r * 7) { t.y = -t.r * 2; t.x = rand(W * 0.1, W * 0.9); }
  }
  function drawAtolla(t, a) {
    const r = t.r, pulse = 0.5 + 0.5 * Math.sin(S.t * 1.4 + t.seed);
    const lit = Math.min(1, 0.1 + illum(t.x, t.y) * 1.1 + t.al * 0.5);
    const rx = r * (1 - 0.06 * pulse), ry = r * 0.42 * (1 - 0.06 * pulse);
    ctx.save();
    ctx.translate(t.x, t.y);
    ADD();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(210,70,90,${(0.05 + 0.2 * lit) * a})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let k = 0; k < 20; k++) {
      const th = (k / 20) * TAU, mx = Math.cos(th) * rx, my = Math.sin(th) * ry + r * 0.05;
      ctx.moveTo(mx, my);
      ctx.lineTo(mx * 1.15 + Math.sin(S.t + k) * 3, my + r * 0.55 + Math.sin(S.t * 1.3 + k) * 3);
    }
    ctx.stroke();
    // the single hypertrophied trailing tentacle
    ctx.beginPath();
    ctx.moveTo(r * 0.3, r * 0.3);
    for (let k = 1; k <= 26; k++) {
      const f = k / 26;
      ctx.lineTo(r * 0.3 + Math.sin(S.t * 0.8 + f * 6 + t.seed) * r * 0.4 * f, r * 0.3 + f * r * 5.4);
    }
    ctx.strokeStyle = `rgba(230,100,120,${(0.05 + 0.22 * lit) * a})`;
    ctx.stroke();
    NRM();
    ctx.fillStyle = `rgba(105,8,26,${(0.22 + 0.6 * lit) * a})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(150,18,40,${(0.18 + 0.6 * lit) * a})`;
    ctx.beginPath();
    for (let k = 0; k < 22; k++) {
      const th = (k / 22) * TAU, px = Math.cos(th) * rx * 1.06, py = Math.sin(th) * ry * 1.06;
      ctx.moveTo(px + r * 0.09, py);
      ctx.ellipse(px, py, r * 0.09, r * 0.045, th, 0, TAU);
    }
    ctx.fill();
    const dg = ctx.createRadialGradient(0, -r * 0.3, 0, 0, -r * 0.15, r * 0.6);
    dg.addColorStop(0, `rgba(190,40,70,${(0.25 + 0.6 * lit) * a})`);
    dg.addColorStop(1, `rgba(60,5,16,${(0.2 + 0.5 * lit) * a})`);
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.17, r * 0.55, r * 0.32, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(240,90,110,${0.28 * lit * a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.74, ry * 0.74, 0, 0, TAU);
    ctx.stroke();
    ADD();
    for (let k = 0; k < 6; k++) {
      const th = t.seed + k * 1.1 + S.t * 0.2, tw = Math.pow(Math.max(0, Math.sin(S.t * 2.3 + k * 2.1 + t.seed)), 8);
      G(SP.blue, Math.cos(th) * rx, Math.sin(th) * ry, 7 * SZ, tw * 0.55 * a);
    }
    if (t.al > 0.01) {
      for (let k = 0; k < 16; k++) {
        const th = (k / 16) * TAU + t.alT * 5, br = Math.pow(Math.max(0, Math.sin((k / 16) * TAU * 2 - t.alT * 14)), 2);
        G(SP.blue, Math.cos(th) * rx * 1.1, Math.sin(th) * ry * 1.1, (8 + br * 22) * SZ, (0.2 + 0.8 * br) * t.al * a);
      }
      G(SP.blueS, 0, 0, r * 4.5, 0.16 * t.al * a);
    }
    ctx.restore();
    NRM();
  }

  // Stoplight loosejaw — red searchlight
  const LJ = Array.from({ length: 2 }, (_, i) => ({
    key: "loosejaw", x: rand(W), y: H * (0.3 + i * 0.4), dir: i ? -1 : 1, L: rand(95, 130) * SZ, seed: rand(TAU), spd: rand(14, 24), ba: 0,
  }));
  LJ.forEach((l) => (l.fr = l.L * 0.5));
  const beamOf = (l) => {
    const ox = l.x + l.dir * l.L * 0.36, oy = l.y + l.L * 0.015;
    const ang = l.dir > 0 ? l.ba : Math.PI - l.ba;
    return { ox, oy, ang, len: 360 * SZ, half: 0.2 };
  };
  const inBeam = (b, x, y) => {
    const dx = x - b.ox, dy = y - b.oy, c = Math.cos(b.ang), s = Math.sin(b.ang);
    const along = dx * c + dy * s;
    if (along <= 0 || along > b.len) return 0;
    const perp = Math.abs(-dx * s + dy * c), hw = along * Math.tan(b.half);
    if (perp > hw) return 0;
    return (1 - along / b.len) * (1 - perp / hw);
  };
  function updateLoosejaw(l, dt) {
    const near = P.present && Math.hypot(P.x - l.x, P.y - l.y) < 140 * SZ;
    l.x += l.dir * l.spd * (near ? 3 : 1) * dt;
    l.y += Math.sin(S.t * 0.4 + l.seed) * 6 * dt - S.dScroll * 0.45;
    l.ba = Math.sin(S.t * 0.5 + l.seed) * 0.28;
    if (l.dir > 0 && l.x > W + l.L * 2) { l.x = -l.L * 2 - rand(200); l.y = rand(H * 0.2, H * 0.8); }
    if (l.dir < 0 && l.x < -l.L * 2) { l.x = W + l.L * 2 + rand(200); l.y = rand(H * 0.2, H * 0.8); }
    if (l.y < -l.L) l.y = H + l.L * 0.5;
    if (l.y > H + l.L) l.y = -l.L * 0.5;
  }
  function drawLoosejaw(l, a) {
    const L = l.L, b = beamOf(l);
    ADD();
    ctx.save();
    ctx.translate(b.ox, b.oy);
    ctx.rotate(b.ang);
    const hw = Math.tan(b.half) * b.len;
    for (const [k, al] of [[1, 0.11], [0.6, 0.08], [0.3, 0.07]]) {
      const g = ctx.createLinearGradient(0, 0, b.len, 0);
      g.addColorStop(0, `rgba(255,40,60,${al * a})`);
      g.addColorStop(1, "rgba(255,40,60,0)");
      ctx.fillStyle = g;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(b.len, -hw * k);
      ctx.lineTo(b.len, hw * k);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.scale(l.dir, 1);
    NRM();
    const und = Math.sin(S.t * 3 + l.seed) * L * 0.02;
    ctx.beginPath();
    ctx.moveTo(L * 0.46, -L * 0.01);
    ctx.quadraticCurveTo(L * 0.3, -L * 0.085, 0, -L * 0.07);
    ctx.quadraticCurveTo(-L * 0.35, -L * 0.05 + und, -L * 0.5, -L * 0.015 + und);
    ctx.lineTo(-L * 0.6, -L * 0.06 + und * 1.5);
    ctx.lineTo(-L * 0.56, und);
    ctx.lineTo(-L * 0.6, L * 0.06 + und * 1.5);
    ctx.lineTo(-L * 0.5, L * 0.015 + und);
    ctx.quadraticCurveTo(-L * 0.35, L * 0.05 + und, 0, L * 0.07);
    ctx.quadraticCurveTo(L * 0.3, L * 0.07, L * 0.34, L * 0.05);
    ctx.lineTo(L * 0.56, L * 0.045);
    ctx.lineTo(L * 0.3, L * 0.028);
    ctx.closePath();
    ctx.fillStyle = `rgba(3,3,6,${0.96 * a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,70,85,${0.2 * a})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = `rgba(10,6,10,${0.9 * a})`;
    ctx.beginPath();
    ctx.moveTo(-L * 0.32, -L * 0.055);
    ctx.lineTo(-L * 0.42, -L * 0.13);
    ctx.lineTo(-L * 0.45, -L * 0.035);
    ctx.moveTo(-L * 0.32, L * 0.055);
    ctx.lineTo(-L * 0.42, L * 0.13);
    ctx.lineTo(-L * 0.45, L * 0.035);
    ctx.fill();
    ADD();
    G(SP.red, L * 0.36, L * 0.015, 13 * SZ, 0.95 * a);
    G(SP.redS, L * 0.36, L * 0.015, 40 * SZ, 0.18 * a);
    G(SP.blue, L * 0.27, -L * 0.005, 6 * SZ, 0.6 * a);
    G(SP.white, L * 0.41, -L * 0.02, 2 * SZ, 0.5 * a);
    for (let k = 0; k < 7; k++) G(SP.blue, lerp(L * 0.15, -L * 0.4, k / 6), L * 0.045, 2.2 * SZ, 0.35 * a);
    ctx.restore();
    NRM();
  }

  // Copepods: invisible until a light (or a red beam) finds them
  const CPN = Math.round(110 * Q + 30);
  const cp = { x: new Float32Array(CPN), y: new Float32Array(CPN), ph: new Float32Array(CPN) };
  for (let i = 0; i < CPN; i++) { cp.x[i] = rand(W); cp.y[i] = rand(H); cp.ph[i] = rand(TAU); }
  function updateCopepods(dt) {
    for (let i = 0; i < CPN; i++) {
      cp.x[i] += Math.sin(S.t * 2 + cp.ph[i]) * 6 * dt;
      cp.y[i] += Math.cos(S.t * 1.3 + cp.ph[i] * 2) * 5 * dt - S.dScroll * 0.7;
      if (cp.y[i] < -10) { cp.y[i] += H + 20; cp.x[i] = rand(W); }
      else if (cp.y[i] > H + 10) { cp.y[i] -= H + 20; cp.x[i] = rand(W); }
    }
  }
  function drawCopepods(a, beams) {
    ADD();
    for (let i = 0; i < CPN; i++) {
      const x = cp.x[i], y = cp.y[i];
      let red = 0;
      for (const b of beams) red = Math.max(red, inBeam(b, x, y));
      if (red > 0.02) G(SP.red, x, y, 5 * SZ, red * a);
      const l = illum(x, y);
      if (l > 0.03) G(SP.white, x, y, 3.5 * SZ, Math.min(1, l) * 0.8 * a);
    }
    NRM();
  }

  // Siphonophores — colonial chains with travelling light
  const SIPH = Array.from({ length: 2 }, (_, i) => {
    const n = 38, x0 = rand(W), y0 = rand(H);
    return { n, x: new Float32Array(n).fill(x0), y: new Float32Array(n).map((_, k) => y0 + k * 9), seed: rand(TAU) + i * 3, h: rand(TAU), sp: 9 * SZ };
  });
  function updateSiph(s, dt) {
    const tx = W * (0.5 + 0.45 * Math.sin(S.t * 0.045 + s.seed)), ty = H * (0.5 + 0.4 * Math.sin(S.t * 0.06 + s.seed * 2));
    s.h += angDiff(Math.atan2(ty - s.y[0], tx - s.x[0]), s.h) * dt * 0.6;
    s.x[0] += Math.cos(s.h) * 16 * dt;
    s.y[0] += Math.sin(s.h) * 16 * dt;
    for (let k = 0; k < s.n; k++) s.y[k] -= S.dScroll * 0.3;
    for (let k = 1; k < s.n; k++) {
      const dx = s.x[k - 1] - s.x[k], dy = s.y[k - 1] - s.y[k], d = Math.hypot(dx, dy) + 0.001;
      if (d > s.sp) { const f = 1 - s.sp / d; s.x[k] += dx * f; s.y[k] += dy * f; }
      s.y[k] += Math.sin(S.t + k * 0.3) * 1.5 * dt;
    }
  }
  function drawSiph(s, a) {
    ADD();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(110,150,255,${0.13 * a})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = 0; k < s.n; k++) (k ? ctx.lineTo : ctx.moveTo).call(ctx, s.x[k], s.y[k]);
    for (let k = 2; k < s.n; k += 2) {
      ctx.moveTo(s.x[k], s.y[k]);
      ctx.lineTo(s.x[k] + Math.sin(S.t * 1.3 + k) * 4, s.y[k] + (10 + (k % 5) * 4) * SZ);
    }
    ctx.stroke();
    for (let k = 0; k < s.n; k++) {
      const p = Math.pow(Math.max(0, Math.sin(S.t * 2.2 - k * 0.35 + s.seed)), 3);
      G(SP.blue, s.x[k], s.y[k], (4 + p * 8) * SZ, (0.12 + p * 0.55) * a);
    }
    G(SP.violet, s.x[0], s.y[0], 10 * SZ, 0.6 * a);
    NRM();
  }

  // Global alarms — the press-and-hold interaction
  const ALARMS = [];
  function alarm(x, y, pow) {
    ALARMS.push({ x, y, t: 0, dur: 2.4 + pow * 1.8, pow, rot: rand(TAU) });
    sound.alarm(0.5 + pow * 0.5);
    if (pow > 0.3) log("alarm");
    for (const t of ATL) if (Math.hypot(t.x - x, t.y - y) < 420 * SZ * (0.5 + pow)) { t.al = 1; t.alT = rand(-0.3, 0); }
    for (let i = 0; i < CPN; i++) {
      const d = Math.hypot(cp.x[i] - x, cp.y[i] - y);
      if (d < 200) cp.x[i] += ((cp.x[i] - x) / (d + 1)) * 30;
    }
    if (pow >= 0.97) summonSquid(x, y);
  }
  function updateAlarms(dt) {
    for (let i = ALARMS.length - 1; i >= 0; i--) {
      const A = ALARMS[i];
      A.t += dt;
      A.y -= S.dScroll * 0.5;
      if (A.t > A.dur) { ALARMS.splice(i, 1); continue; }
      const p = A.t / A.dur, R = (30 + (1 - Math.pow(1 - p, 3)) * 320 * (0.6 + A.pow * 0.7)) * SZ, fade = (1 - p) * (1 - p);
      LIGHTS.push({ x: A.x, y: A.y, r: R * 1.7, i: (0.95 * fade + 0.05) * (0.4 + A.pow * 0.6) });
      A.R = R;
      A.fade = fade;
    }
  }
  function drawAlarms(a) {
    for (const A of ALARMS) {
      const R = A.R || 30, fade = A.fade || 1;
      ADD();
      G(SP.blueS, A.x, A.y, R * 1.3, 0.2 * fade * A.pow * a + 0.05);
      for (let k = 0; k < 16; k++) {
        const th = A.rot + (k / 16) * TAU + A.t * 3.4;
        const br = Math.pow(Math.max(0, Math.sin((k / 16) * TAU * 2 - A.t * 9)), 2);
        const rr = R * 0.42 + Math.sin(A.t * 5 + k) * 6;
        G(SP.blue, A.x + Math.cos(th) * rr, A.y + Math.sin(th) * rr * 0.9, (10 + br * 24) * SZ, (0.22 + 0.78 * br) * fade * (0.5 + A.pow * 0.5) * a);
      }
      NRM();
      ctx.strokeStyle = `rgba(100,160,255,${0.35 * fade * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(A.x, A.y, R, 0, TAU);
      ctx.stroke();
    }
  }
  function drawCharge(a) {
    if (P.hold <= 0.01) return;
    const h = P.hold, R = (24 + h * 34) * SZ;
    ADD();
    for (let k = 0; k < 12; k++) {
      const th = (k / 12) * TAU + S.t * (2 + h * 9);
      const on = k / 12 < h ? 1 : 0.15;
      G(SP.blue, P.x + Math.cos(th) * R, P.y + Math.sin(th) * R, (6 + h * 10) * SZ, on * (0.3 + h * 0.7) * a);
    }
    G(SP.blueS, P.x, P.y, R * 2.2, h * 0.22 * a);
    NRM();
  }

  // Architeuthis — only appears when a full alarm calls it in
  const GS = { on: false, t: 0, side: 1, x: 0, y: 0, M: 0, ax: 0, ay: 0, lastT: -99, reveal: 0, key: "giant" };
  function summonSquid(x, y) {
    if (GS.on || S.t - GS.lastT < 5) return;
    Object.assign(GS, { on: true, t: 0, side: x < W / 2 ? 1 : -1, ax: x, ay: y, M: clamp(H * 0.9, 380, 900), y: clamp(y, H * 0.3, H * 0.7), logged: false });
    sound.rumble();
  }
  function updateGiant(dt) {
    if (!GS.on) return;
    GS.t += dt;
    const M = GS.M, t = GS.t;
    const enter = smooth(0, 2.6, t), exit = smooth(6.2, 9, t), k = enter * (1 - exit);
    const restX = GS.side === 1 ? Math.max(GS.ax + M * 0.55, W * 0.5) : Math.min(GS.ax - M * 0.55, W * 0.5);
    const startX = GS.side === 1 ? W + M * 1.05 : -M * 1.05;
    GS.x = lerp(startX, restX, k);
    GS.ay -= S.dScroll * 0.5;
    GS.y += (clamp(GS.ay, H * 0.3, H * 0.7) - GS.y) * dt;
    GS.reveal = smooth(0, 1.4, t) * (1 - smooth(6.6, 9, t));
    LIGHTS.push({ x: GS.ax, y: GS.ay, r: 520 * SZ, i: 0.3 * GS.reveal });
    if (t > 2 && !GS.logged) { GS.logged = true; log("giant"); }
    if (t > 9.2) { GS.on = false; GS.lastT = S.t; }
  }
  function drawGiant(a) {
    if (!GS.on || GS.reveal < 0.01) return;
    const M = GS.M, rv = GS.reveal * a, t = S.t;
    ctx.save();
    ctx.translate(GS.x, GS.y);
    ctx.scale(-GS.side, 1);
    NRM();
    // shared shading: a near-black body, faint maroon where our light grazes it, cold blue rim
    const shade = ctx.createLinearGradient(0, -M * 0.16, 0, M * 0.16);
    shade.addColorStop(0, `rgba(120,52,70,${0.3 * rv})`);
    shade.addColorStop(0.45, `rgba(50,18,30,${0.14 * rv})`);
    shade.addColorStop(1, "rgba(0,0,0,0)");
    const paint = (path, rim = 0.22) => {
      ctx.fillStyle = `rgba(13,6,10,${0.97 * rv})`;
      ctx.fill(path);
      ctx.fillStyle = shade;
      ctx.fill(path);
      ctx.strokeStyle = `rgba(130,165,255,${rim * rv})`;
      ctx.lineWidth = 1;
      ctx.stroke(path);
    };
    // tapered limb from a spine
    const limb = (pts, w0, w1) => {
      const Lf = [], Rt = [], n = pts.length;
      for (let j = 0; j < n; j++) {
        const p0 = pts[Math.max(0, j - 1)], p1 = pts[Math.min(n - 1, j + 1)];
        let nx = -(p1[1] - p0[1]), ny = p1[0] - p0[0];
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl; ny /= nl;
        const w = lerp(w0, w1, Math.pow(j / (n - 1), 0.75));
        Lf.push([pts[j][0] + nx * w, pts[j][1] + ny * w]);
        Rt.push([pts[j][0] - nx * w, pts[j][1] - ny * w]);
      }
      const p = new Path2D();
      p.moveTo(Lf[0][0], Lf[0][1]);
      for (let j = 1; j < n; j++) p.lineTo(Lf[j][0], Lf[j][1]);
      for (let j = n - 1; j >= 0; j--) p.lineTo(Rt[j][0], Rt[j][1]);
      p.closePath();
      return p;
    };
    const reach = smooth(1.2, 3.2, GS.t) * (1 - smooth(6, 8, GS.t));
    // two feeding tentacles reach for the light, ending in toothed clubs
    for (const sd of [-1, 1]) {
      const L = M * (0.62 + reach * 0.6), pts = [];
      for (let j = 0; j <= 24; j++) {
        const f = j / 24;
        pts.push([M * 0.17 + f * L, sd * M * 0.016 * (1 + f * 3) + Math.sin(t * 1.1 + f * 6 + sd) * M * 0.05 * f]);
      }
      paint(limb(pts, M * 0.007, M * 0.0035), 0.18);
      const e = pts[24], e0 = pts[21], ang = Math.atan2(e[1] - e0[1], e[0] - e0[0]);
      const club = new Path2D();
      club.ellipse(e[0] - Math.cos(ang) * M * 0.02, e[1] - Math.sin(ang) * M * 0.02, M * 0.05, M * 0.013, ang, 0, TAU);
      paint(club, 0.3);
    }
    // eight muscular arms
    for (let k = 0; k < 8; k++) {
      const by = (k - 3.5) * M * 0.013, La = M * (0.3 + ((k * 37) % 7) * 0.012), pts = [];
      for (let j = 0; j <= 14; j++) {
        const f = j / 14;
        pts.push([M * 0.16 + f * La, by * (1 + f * 2.6) + Math.sin(t * 1.3 + k * 0.9 + f * 4.5) * M * 0.04 * f]);
      }
      paint(limb(pts, M * 0.017, M * 0.0025), 0.2);
    }
    // head, tucked under the mantle collar
    const head = new Path2D();
    head.ellipse(M * 0.1, 0, M * 0.1, M * 0.07, 0, 0, TAU);
    paint(head, 0.25);
    // torpedo mantle with terminal fins and a rounded collar
    const breathe = 1 + Math.sin(t * 0.9) * 0.02;
    const body = new Path2D();
    body.moveTo(M * 0.045, -M * 0.088 * breathe);
    body.bezierCurveTo(-M * 0.22, -M * 0.145 * breathe, -M * 0.66, -M * 0.1, -M * 0.96, -M * 0.016);
    body.lineTo(-M * 0.84, -M * 0.1);
    body.quadraticCurveTo(-M * 1.04, -M * 0.075, -M * 1.15, 0);
    body.quadraticCurveTo(-M * 1.04, M * 0.075, -M * 0.84, M * 0.1);
    body.lineTo(-M * 0.96, M * 0.016);
    body.bezierCurveTo(-M * 0.66, M * 0.1, -M * 0.22, M * 0.145 * breathe, M * 0.045, M * 0.088 * breathe);
    body.quadraticCurveTo(M * 0.08, 0, M * 0.045, -M * 0.088 * breathe);
    body.closePath();
    paint(body, 0.24);
    // dorsal sheen + chromatophore speckle
    ctx.strokeStyle = `rgba(170,120,150,${0.1 * rv})`;
    ctx.lineWidth = M * 0.01;
    ctx.beginPath();
    ctx.moveTo(0, -M * 0.07);
    ctx.bezierCurveTo(-M * 0.25, -M * 0.11, -M * 0.6, -M * 0.075, -M * 0.9, -M * 0.02);
    ctx.stroke();
    if (!GS.dots) GS.dots = Array.from({ length: 70 }, () => [rand(0.02, 0.9), rand(-0.85, 0.85), rand(0.5, 1.4)]);
    ctx.fillStyle = `rgba(170,60,75,${0.11 * rv})`;
    ctx.beginPath();
    for (const [u, v, r] of GS.dots) {
      const hw = M * (0.13 - u * 0.11), x = -u * M, y = v * hw;
      ctx.moveTo(x + M * 0.004 * r, y);
      ctx.arc(x, y, M * 0.004 * r, 0, TAU);
    }
    ctx.fill();
    // the eye — the largest in the animal kingdom — catching our light
    const ex = M * 0.11, ey = -M * 0.018, er = M * 0.03;
    ctx.fillStyle = `rgba(6,4,8,${rv})`;
    ctx.beginPath();
    ctx.ellipse(ex, ey, er * 1.35, er * 1.2, 0, 0, TAU);
    ctx.fill();
    const eg = ctx.createRadialGradient(ex + er * 0.25, ey - er * 0.2, 0, ex, ey, er);
    eg.addColorStop(0, `rgba(60,90,130,${rv})`);
    eg.addColorStop(0.55, `rgba(14,22,40,${rv})`);
    eg.addColorStop(1, `rgba(2,2,6,${rv})`);
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(150,195,255,${0.35 * rv})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = `rgba(0,0,0,${rv})`;
    ctx.beginPath();
    ctx.ellipse(ex, ey, er * 0.42, er * 0.3, 0, 0, TAU);
    ctx.fill();
    ADD();
    G(SP.blueS, ex, ey, er * 3.2, 0.16 * rv);
    G(SP.white, ex + er * 0.35, ey - er * 0.35, er * 0.55, 0.85 * rv);
    G(SP.cyan, ex - er * 0.3, ey + er * 0.25, er * 0.35, 0.35 * rv * (0.5 + 0.5 * Math.sin(t * 2)));
    ctx.restore();
    NRM();
  }

  /* ═══════════════════════ THE LAST LIGHT · 750 → 1,150 m ═══════════════════════
     One continuous, scroll-driven hand-over from Twilight to Midnight. Sunlight is
     extinguished progressively: shafts shorten, narrow and blue-shift one by one; the
     in-scattered skylight overhead collapses; silhouettes dissolve while photophores
     take over. A last thread of light flickers out near 1,000 m. Then, in total
     darkness, something enormous passes — visible only as the plankton it disturbs. */
  const LL = { q: -9, w: 0, amb: 1, on: false, counter: "", dataLL: "", rays: [], lights: [], lastDone: false };
  const llAmbient = (q) => Math.pow(1 - smooth(0, 0.58, q), 1.5);
  function hashN(n) { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); } // hoisted: used during init
  const LLRAYS = Array.from({ length: 9 }, (_, i) => ({
    x: 0.07 + 0.86 * hashN(i * 3.7 + 1), w: 34 + hashN(i * 9.1) * 130, end: 0.12 + (i / 8) * 0.36 + hashN(i * 2.2) * 0.03,
    ph: rand(TAU), sp: rand(0.05, 0.14), tilt: rand(-0.16, 0.16),
  }));
  const LAST_RAY = { x: 0.76, tilt: -0.07, ph: rand(TAU) };
  function buildRays() {
    const q = LL.q, out = [];
    const px = (P.ex - W / 2) * -0.04;
    for (const r of LLRAYS) {
      const life = 1 - smooth(r.end - 0.12, r.end, q);
      if (life < 0.01) continue;
      out.push({
        x0: r.x * W + Math.sin(S.t * r.sp + r.ph) * 40 * SZ + px, tilt: r.tilt,
        w: r.w * SZ * (0.3 + 0.7 * life), len: H * (0.3 + 0.85 * life), a: life * (0.3 + 0.7 * LL.amb),
      });
    }
    // the last thread of sunlight lingers, flickers, and breaks
    const life = 1 - smooth(0.5, 0.605, q);
    if (life > 0.01 && q > -0.3) {
      const fl = q > 0.5 ? 0.5 + 0.5 * Math.abs(Math.sin(S.t * 5.3) * Math.sin(S.t * 2.1 + 1)) : 1;
      out.push({
        x0: LAST_RAY.x * W + Math.sin(S.t * 0.09 + LAST_RAY.ph) * 30 * SZ + px, tilt: LAST_RAY.tilt,
        w: 18 * SZ * (0.45 + 0.55 * life), len: H * (0.45 + 0.7 * life), a: Math.min(1, life * 1.4) * fl, last: true,
      });
    }
    LL.rays = out;
  }
  // how much shaft light falls on a point (for in-scattering on drifting particles)
  function rayLight(x, y) {
    let s = 0;
    for (const r of LL.rays) {
      if (y < 0 || y > r.len) continue;
      const cx = r.x0 + r.tilt * y, half = r.w * (0.5 + (y / r.len) * 0.8) * 0.5, d = Math.abs(x - cx);
      if (d < half) s += r.a * (1 - d / half) * (1 - y / r.len) * (r.last ? 1.6 : 1);
    }
    return s;
  }
  function drawLLAtmos(a) {
    const amb = LL.amb, q = clamp(LL.q);
    ADD();
    ctx.globalAlpha = 1;
    if (amb > 0.004) {
      // the dome of in-scattered skylight overhead, collapsing as the sun goes
      const b = mix3([90, 140, 255], [40, 60, 200], q), R0 = H * (0.5 + 0.55 * amb);
      const g = ctx.createRadialGradient(W * 0.5, -H * 0.15, 0, W * 0.5, -H * 0.15, R0);
      g.addColorStop(0, `rgba(${b[0] | 0},${b[1] | 0},${b[2] | 0},${0.32 * amb * a})`);
      g.addColorStop(0.5, `rgba(${b[0] | 0},${b[1] | 0},${b[2] | 0},${0.09 * amb * a})`);
      g.addColorStop(1, "rgba(40,60,200,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // scattering veil: a blue haze that limits how far we can see
      const v = ctx.createLinearGradient(0, 0, 0, H);
      v.addColorStop(0, `rgba(60,90,200,${0.08 * amb * a})`);
      v.addColorStop(1, `rgba(20,30,90,${0.025 * amb * a})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }
    // volumetric shafts: red and green are absorbed first, so the light blue-shifts as it dies
    const col = mix3([150, 195, 255], [70, 95, 235], smooth(0, 0.55, q));
    const cs = `${col[0] | 0},${col[1] | 0},${col[2] | 0}`;
    for (const r of LL.rays) {
      for (const [k, al] of [[1, 0.5], [0.42, 0.8]]) {
        const w0 = r.w * k, w1 = r.w * k * 1.8, x1 = r.x0 + r.tilt * r.len;
        const gr = ctx.createLinearGradient(0, 0, 0, r.len);
        gr.addColorStop(0, `rgba(${cs},${(r.last ? 0.34 : 0.12) * al * r.a * a})`);
        gr.addColorStop(0.55, `rgba(${cs},${(r.last ? 0.12 : 0.04) * al * r.a * a})`);
        gr.addColorStop(1, `rgba(${cs},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(r.x0 - w0 / 2, 0);
        ctx.lineTo(r.x0 + w0 / 2, 0);
        ctx.lineTo(x1 + w1 / 2, r.len);
        ctx.lineTo(x1 - w1 / 2, r.len);
        ctx.closePath();
        ctx.fill();
      }
      if (r.last) G(SP.whiteS, r.x0 + r.tilt * r.len * 0.55, r.len * 0.55, 40 * SZ, 0.1 * r.a * a);
    }
    NRM();
  }

  // A field of dormant bioluminescent plankton: invisible until mechanically disturbed.
  const FN = Math.round((isTouch ? 950 : 1700) * clamp(Q, 0.6, 1.1));
  const fd = {
    x: new Float32Array(FN), y: new Float32Array(FN), z: new Float32Array(FN), e: new Float32Array(FN),
    vx: new Float32Array(FN), vy: new Float32Array(FN), ph: new Float32Array(FN), ns: new Int8Array(FN),
  };
  for (let i = 0; i < FN; i++) { fd.x[i] = rand(W); fd.y[i] = rand(H); fd.z[i] = rand(0.25, 1); fd.ph[i] = rand(TAU); }
  // Krill: tiny crustaceans whose ventral photophores only become visible as the light dies
  const KR = Array.from({ length: isTouch ? 50 : 95 }, () => ({
    x: rand(W), y: rand(H * 0.08, H * 0.95), vx: rand(8, 18) * (Math.random() < 0.5 ? -1 : 1), ph: rand(TAU), st: 0, s: rand(0.7, 1.3),
  }));
  // Helmet jellies (Periphylla): deep red domes that pulse with waves of blue light
  const PERI = Array.from({ length: W > 760 ? 3 : 2 }, (_, i) => ({
    x: W * (0.22 + i * 0.3) + rand(-40, 40), y: rand(H * 0.3, H * 0.8), s: rand(24, 38) * SZ, seed: rand(TAU), vx: rand(-5, 5),
  }));

  /* the whale: Physeter macrocephalus, ~16 m — at this scale, two screens long */
  const WTOP = [[0, 0.078], [0.012, 0.098], [0.06, 0.106], [0.26, 0.106], [0.31, 0.098], [0.36, 0.094], [0.5, 0.098], [0.6, 0.094], [0.63, 0.103], [0.66, 0.09], [0.7, 0.085], [0.73, 0.08], [0.76, 0.075], [0.79, 0.069], [0.84, 0.054], [0.9, 0.036], [0.96, 0.022], [1.0, 0.016]];
  const WBOT = [[0, -0.055], [0.015, -0.082], [0.05, -0.09], [0.28, -0.092], [0.34, -0.1], [0.45, -0.106], [0.55, -0.1], [0.65, -0.084], [0.75, -0.064], [0.85, -0.042], [0.93, -0.026], [0.98, -0.017], [1.0, -0.015]];
  const WH = { st: "idle", t: 0, wt: 0, L: 0, sp: 0, clickT: 0, panicT: 0, frame: null, slow: 0, eyeT: -1, capI: -1, capT: 0, top: "", bot: "", cTop: null, cBot: null, shook: false, vort: [], vortT: 0, vortFlip: false, lostT: -1 };
  const whOff = (u) => (u < 0.5 ? 0 : 0.034 * Math.pow((u - 0.5) / 0.6, 2) * Math.sin(WH.t * 1.5 - u * 3.2));
  // the flukes turn as they stroke, so from the side they flash from edge-on to broad
  const flukeK = () => 0.25 + 0.75 * Math.abs(Math.sin(WH.t * 1.5 - 3.4));
  function whTop(u) {
    if (u <= 1) return interp(WTOP, u);
    const k = flukeK();
    return u < 1.1 ? lerp(0.016, 0.05 * k, (u - 1) / 0.1) : lerp(0.05 * k, 0.004, clamp((u - 1.1) / 0.04));
  }
  function whBot(u) {
    if (u <= 1) return interp(WBOT, u);
    const k = flukeK();
    return u < 1.1 ? lerp(-0.015, -0.05 * k, (u - 1) / 0.1) : lerp(-0.05 * k, -0.004, clamp((u - 1.1) / 0.04));
  }
  function whaleFrame() {
    const L = WH.L, s = WH.wt - 1.8, vy = (H * 0.16) / 10.5, m = Math.hypot(WH.sp, vy);
    const ax = WH.sp / m, ay = -vy / m;
    return { nx: W + 0.17 * L - WH.sp * s, ny: H * 0.43 + clamp(s / 10.5, -0.2, 1.2) * H * 0.16, ax, ay, mx: ay, my: -ax, L };
  }
  const WCAPS = [
    { top: "Unidentified · clicking", bot: "" },
    { bot: "Down here, plankton light up wherever the water is disturbed. Something is disturbing a great deal of it." },
    { top: "Physeter macrocephalus · sperm whale", bot: "A sperm whale, about sixteen metres long — diving toward the squid of the midnight zone below." },
    { bot: "It can dive beyond 2,000 m and hold its breath for over an hour, hunting by sound with the loudest clicks made by any animal." },
    { top: "Contact lost · added to field log", bot: "" },
  ];
  function capWrite(which, text) {
    const k = which === "top" ? "cTop" : "cBot";
    if (WH[k] === text) return;
    WH[k] = text;
    const el = R(which === "top" ? "capTop" : "capBot");
    if (el) el.textContent = text;
  }
  function whaleStart() {
    // ~16 m of whale: a little over two screen-widths on desktop, four on a phone held upright
    Object.assign(WH, { st: "pass", t: 0, wt: 0, L: Math.max(W, H) * 1.55, clickT: 0.25, panicT: 0.6, eyeT: -1, capI: -1, cTop: null, cBot: null, shook: false, lostT: -1, vort: [], vortT: 0, vortFlip: false });
    WH.sp = (W + 1.37 * WH.L) / 10.5;
    WH.frame = whaleFrame();
    PH.lastTop = PH.lastBot = null;
    sound.leviathan();
  }
  function whaleEnd(complete) {
    WH.st = complete ? "done" : "idle";
    WH.frame = null;
    WH.vort.length = 0;
    if (root.dataset.cine === "1") root.dataset.cine = "";
    capWrite("top", "");
    capWrite("bot", "");
    if (complete) log("leviathan");
  }
  function panicAt(x, y, Rr) {
    for (let i = 0; i < BN; i++) {
      const dx = bo.x[i] - x, dy = bo.y[i] - y, d = Math.hypot(dx, dy) + 1;
      if (d < Rr) { bo.st[i] = 1.3; bo.vx[i] += (dx / d) * 160; bo.vy[i] += (dy / d) * 160; }
    }
    for (const k of KR) { const d = Math.hypot(k.x - x, k.y - y); if (d < Rr) { k.st = 1; k.vx = Math.sign(k.x - x || 1) * 60; } }
    for (const q2 of FFS) if (q2.flash < 0.08 && Math.hypot(q2.x - x, q2.y - y) < Rr) q2.flash = 0.55;
  }
  function updateWhale(dt) {
    if (WH.st !== "pass") return;
    // if the visitor scrolls well away, let it go
    if (LL.q < 0.4 || LL.q > 1.15) { whaleEnd(WH.eyeT > 0); return; }
    WH.t += dt;
    const F0 = whaleFrame(), ex = F0.nx + F0.ax * 0.3 * F0.L;
    // time dilates as the eye crosses the frame
    WH.slow = 1 - smooth(0, W * 0.3, Math.abs(ex - W * 0.5));
    WH.wt += dt * (1 - 0.62 * WH.slow);
    WH.frame = whaleFrame();
    if (WH.eyeT < 0 && ex < W * 0.46) WH.eyeT = WH.t;
    // echolocation: slow regular clicks, then an accelerating "creak" as it closes on prey below
    WH.clickT -= dt;
    if (WH.clickT <= 0) {
      const creak = WH.wt > 10.6;
      sound.click(creak ? 0.11 : 0.22);
      WH.clickT = creak ? Math.max(0.045, 0.32 - (WH.wt - 10.6) * 0.22) : 0.6 + Math.random() * 0.12;
    }
    WH.panicT -= dt;
    if (WH.panicT <= 0 && WH.wt < 11) {
      WH.panicT = 0.45;
      const f = WH.frame;
      panicAt(f.nx + f.ax * f.L * 0.25, f.ny + f.ay * f.L * 0.25, 720 * SZ);
    }
    // each fluke stroke sheds a vortex from the upper and lower tips (alternating spin)
    {
      const f = WH.frame, k = flukeK();
      WH.vortT -= dt;
      const tx0 = f.nx + f.ax * 1.1 * f.L;
      if (WH.vortT <= 0 && tx0 > -f.L * 0.1 && tx0 < W + f.L * 0.1) {
        WH.vortT = 0.32;
        const sgn = WH.vortFlip ? 1 : -1;
        WH.vortFlip = !WH.vortFlip;
        const v = sgn * 0.05 * k + whOff(1.1);
        WH.vort.push({ x: tx0 + f.mx * v * f.L, y: f.ny + f.ay * 1.1 * f.L + f.my * v * f.L, r: 0.06 * f.L, s: sgn * WH.sp * 0.4, life: 1 });
        if (WH.vort.length > 28) WH.vort.shift();
      }
      for (let i = WH.vort.length - 1; i >= 0; i--) {
        const V = WH.vort[i];
        V.life -= dt / 7;
        V.r *= 1 + dt * 0.08; // eddies spread as they weaken
        V.x -= f.ax * WH.sp * 0.05 * dt;
        V.y -= S.dScroll * 0.6;
        if (V.life <= 0) WH.vort.splice(i, 1);
      }
    }
    // the flukes pass: a pressure wave you can feel
    const tailX = WH.frame.nx + WH.frame.ax * WH.frame.L;
    if (!WH.shook && tailX < W * 0.55) { WH.shook = true; if (!reduced) S.shake = 7; }
    if (WH.t > 1.1 && root.dataset.cine !== "1") root.dataset.cine = "1";
    // captions: the identity is withheld until the eye has crossed the frame
    let ci = WH.t > 1.1 ? 0 : -1;
    if (WH.t > 2.6) ci = 1;
    if (WH.eyeT > 0 && WH.t > WH.eyeT + 0.4) ci = 2;
    if (WH.eyeT > 0 && WH.t > WH.eyeT + 4.4) ci = 3;
    // hold the dark (and the slowly turning wake) until the last fact has been read
    if (WH.wt > 11.6 && WH.eyeT > 0 && WH.t > WH.eyeT + 10.2) ci = 4;
    if (ci === 4 && WH.lostT < 0) WH.lostT = WH.t;
    if (ci !== WH.capI && ci >= 0) {
      WH.capI = ci;
      WH.capT = WH.t;
      if (WCAPS[ci].top !== undefined) WH.top = WCAPS[ci].top;
      if (WCAPS[ci].bot !== undefined) WH.bot = WCAPS[ci].bot;
    }
    if (WH.capI >= 0) {
      capWrite("top", WH.top);
      capWrite("bot", WH.bot.slice(0, Math.floor((WH.t - WH.capT) * 55)));
    }
    if ((WH.lostT > 0 && WH.t > WH.lostT + 1.8) || WH.t > 28) whaleEnd(true);
  }

  function updateLL(dt) {
    const q = LL.q;
    buildRays();
    // photon counter: how much of the surface sunlight still reaches this depth
    const d = S.depth;
    const txt = q < 0.605 && d < 1000 ? "1 in " + Math.round(Math.pow(10, d / 100)).toLocaleString("en-US") : "none";
    if (txt !== LL.counter) {
      LL.counter = txt;
      const el = R("photon");
      if (el) el.textContent = txt;
    }
    const on = LL.w > 0.5 && q < 0.7 && q > -0.05 ? "1" : "";
    if (on !== LL.dataLL) { LL.dataLL = on; root.dataset.ll = on; }
    if (!LL.lastDone && q > 0.605 && q < 0.8 && Math.abs(S.vScroll) < H * 1.2) { LL.lastDone = true; sound.lastLight(); log("lastlight"); }
    // only for visitors actually travelling through (not flying past via the depth gauge)
    if (WH.st === "idle" && q > 0.63 && q < 0.85 && Math.abs(S.vScroll) < H * 1.2 && !S.scrollAnim) whaleStart();
    updateWhale(dt);
    // light sources for the particle field
    LL.lights.length = 0;
    const vis = 0.35 + 0.65 * (1 - LL.amb);
    // the field
    const stir = P.present && P.speed > 40;
    const x0 = P.px, y0 = P.py, sx = P.x - x0, sy = P.y - y0, sl2 = sx * sx + sy * sy || 1, Rr = (50 + clamp(P.speed / 1500) * 50) * SZ, R2 = Rr * Rr;
    const amt = clamp(P.speed / 900, 0.3, 1), ed = Math.exp(-1.25 * dt), vd = Math.exp(-1.4 * dt);
    const waves = S.waves.map((wv) => [wv.x, wv.y, (S.t - wv.t0) * 400 * SZ, 1 - ((S.t - wv.t0) * 400 * SZ) / wv.max]);
    const F = WH.st === "pass" ? WH.frame : null;
    const BAND = 0.012;
    for (let i = 0; i < FN; i++) {
      const z = fd.z[i];
      fd.x[i] += fd.vx[i] * dt + Math.sin(S.t * 0.3 + fd.ph[i]) * 3 * dt;
      fd.y[i] += fd.vy[i] * dt - S.dScroll * (0.2 + z * 0.8) - 1.5 * dt;
      fd.vx[i] *= vd;
      fd.vy[i] *= vd;
      if (fd.y[i] < -20) { fd.y[i] += H + 40; fd.x[i] = rand(W); fd.e[i] = 0; }
      else if (fd.y[i] > H + 20) { fd.y[i] -= H + 40; fd.x[i] = rand(W); fd.e[i] = 0; }
      if (fd.x[i] < -20) fd.x[i] += W + 40;
      else if (fd.x[i] > W + 20) fd.x[i] -= W + 40;
      if (stir) {
        let tt = ((fd.x[i] - x0) * sx + (fd.y[i] - y0) * sy) / sl2;
        tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
        const dx = fd.x[i] - (x0 + sx * tt), dy = fd.y[i] - (y0 + sy * tt), d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const f = 1 - Math.sqrt(d2) / Rr;
          fd.e[i] = Math.max(fd.e[i], Math.min(1, f * amt * 1.3));
          fd.vx[i] += P.vx * 0.12 * f;
          fd.vy[i] += P.vy * 0.12 * f;
        }
      }
      for (let k = 0; k < waves.length; k++) {
        const [wx, wy, rw, fade] = waves[k];
        const d = Math.hypot(fd.x[i] - wx, fd.y[i] - wy);
        if (Math.abs(d - rw) < 24 * SZ) fd.e[i] = Math.max(fd.e[i], fade);
      }
      fd.ns[i] = 0;
      // water refills the channel the body clears: dormant (dark, hence invisible) cells are reseeded
      if ((F || WH.vort.length) && fd.e[i] < 0.02 && Math.random() < dt * 0.35) { fd.x[i] = rand(W); fd.y[i] = rand(H); fd.vx[i] = fd.vy[i] = 0; }
      if (F) {
        // the whale displaces the water: everything it touches flashes
        const rx = fd.x[i] - F.nx, ry = fd.y[i] - F.ny, L = F.L;
        const u = (rx * F.ax + ry * F.ay) / L;
        if (u > -0.17 && u < 1.5) {
          const v = (rx * F.mx + ry * F.my) / L - whOff(Math.min(u, 1.14));
          if (u >= 0 && u <= 1.14) {
            const tp = whTop(u), bt = whBot(u);
            if (v < tp && v > bt) {
              // jittered displacement, so cells don't stack on the exact surface and blow out
              const up = tp - v < v - bt, j = 0.003 + Math.random() * 0.016, dv = ((up ? tp + j : bt - j) - v) * L;
              fd.x[i] += F.mx * dv;
              fd.y[i] += F.my * dv;
              const s = up ? 1 : -1;
              // gentle: displaced cells slide along the skin instead of being blown away
              fd.vx[i] = F.mx * s * 25 - F.ax * WH.sp * 0.3;
              fd.vy[i] = F.my * s * 25 - F.ay * WH.sp * 0.3;
              fd.e[i] = 1;
              fd.ns[i] = s;
            } else {
              // the disturbed boundary layer: a halo that falls off sharply away from the skin,
              // with water entrained along the flank as the body slides past
              const above = v >= tp, dd = above ? v - tp : bt - v, HALO = BAND * 3.6;
              if (dd < HALO) {
                const f = 1 - dd / HALO, f2 = Math.pow(f, 2.2);
                fd.e[i] = Math.max(fd.e[i], f2);
                fd.ns[i] = dd < BAND * 2 ? (above ? 1 : -1) : 0;
                // ahead of the widest point water is pushed out; behind it, cells simply slide along
                const s = above ? 1 : -1, k = f2 * Math.min(1, dt * 4), nrm = u < 0.42 ? 30 : 0;
                fd.vx[i] += (-F.ax * WH.sp * 0.32 + F.mx * s * nrm - fd.vx[i]) * k;
                fd.vy[i] += (-F.ay * WH.sp * 0.32 + F.my * s * nrm - fd.vy[i]) * k;
              }
            }
          } else if (u < 0) {
            // bow wave rolling ahead of the blunt head
            if (v < 0.12 && v > -0.1) {
              const f = 1 + u / 0.17, g = 1 - Math.abs(v - 0.01) / 0.11;
              fd.e[i] = Math.max(fd.e[i], f * f * g * 0.8);
              fd.vx[i] -= F.ax * f * 260 * dt;
              fd.vy[i] -= F.ay * f * 260 * dt;
            }
          } else if (Math.abs(v) < 0.08) {
            // directly behind the flukes: churned water
            const f = 1 - (u - 1.14) / 0.36;
            fd.e[i] = Math.max(fd.e[i], f * 0.8);
          }
        }
      }
      // shed vortices keep turning the lit water long after the tail has gone
      for (let k = 0; k < WH.vort.length; k++) {
        const V = WH.vort[k], dx = fd.x[i] - V.x, dy = fd.y[i] - V.y, d2 = dx * dx + dy * dy;
        if (d2 > V.r * V.r) continue;
        const d = Math.sqrt(d2) + 0.001, f = (1 - d / V.r) * V.life;
        fd.vx[i] += (-dy / d) * V.s * f * dt * 9;
        fd.vy[i] += (dx / d) * V.s * f * dt * 9;
        fd.e[i] = Math.max(fd.e[i], f * 0.85);
      }
      fd.e[i] *= ed;
    }
    // krill
    for (const k of KR) {
      k.x += k.vx * dt * (1 + k.st * 3);
      k.y += Math.sin(S.t * 0.7 + k.ph) * 4 * dt - S.dScroll * 0.55;
      if (P.present && Math.hypot(P.x - k.x, P.y - k.y) < 90 * SZ) { k.st = Math.max(k.st, 0.8); k.vx = Math.sign(k.x - P.x || 1) * Math.abs(k.vx); }
      k.st *= Math.exp(-1.2 * dt);
      if (k.x < -20) k.x = W + 20;
      if (k.x > W + 20) k.x = -20;
      if (k.y < -20) k.y += H + 40;
      if (k.y > H + 20) k.y -= H + 40;
    }
    // helmet jellies + firefly squid are the strongest lights: they illuminate the snow around them
    for (const p of PERI) {
      p.x += (p.vx + Math.sin(S.t * 0.2 + p.seed) * 6) * dt;
      p.y += Math.sin(S.t * 0.35 + p.seed) * 5 * dt - S.dScroll * 0.45;
      if (p.y < -p.s * 4) { p.y = H + p.s * 2; p.x = rand(W * 0.1, W * 0.9); }
      if (p.y > H + p.s * 4) { p.y = -p.s * 2; p.x = rand(W * 0.1, W * 0.9); }
      if (p.x < -p.s * 3) p.x = W + p.s * 2;
      if (p.x > W + p.s * 3) p.x = -p.s * 2;
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(S.t * 1.1 + p.seed), 2);
      LL.lights.push({ x: p.x, y: p.y - p.s * 0.6, r: p.s * 6, i: (0.25 + 0.45 * pulse) * vis });
    }
    if (S.w[2] > 0.05) for (const q2 of FFS) LL.lights.push({ x: q2.x, y: q2.y, r: 70 * SZ, i: (0.15 + 0.5 * q2.flash) * vis * S.w[2] });
  }

  function drawLLLife(a) {
    const vis = 0.35 + 0.65 * (1 - LL.amb), F = WH.st === "pass" ? WH.frame : null;
    ADD();
    // plankton field: moving, disturbed cells leave short luminous streaks (bucketed strokes)
    ctx.globalAlpha = 1;
    ctx.lineCap = "round";
    for (let lv = 0; lv < 3; lv++) {
      const lo = 0.2 + lv * 0.27, hi = lv === 2 ? 9 : lo + 0.27;
      ctx.beginPath();
      let any = false;
      for (let i = 0; i < FN; i++) {
        const e = fd.e[i];
        if (e < lo || e >= hi) continue;
        const vx = fd.vx[i], vy = fd.vy[i], sp2 = vx * vx + vy * vy;
        if (sp2 < 900) continue;
        const k = sp2 > 90000 ? 300 / Math.sqrt(sp2) : 1; // cap trail length
        ctx.moveTo(fd.x[i], fd.y[i]);
        ctx.lineTo(fd.x[i] - vx * 0.07 * k, fd.y[i] - vy * 0.07 * k);
        any = true;
      }
      if (!any) continue;
      ctx.strokeStyle = `rgba(110,170,255,${Math.min(1, lo + 0.15) * 0.55 * a * vis})`;
      ctx.lineWidth = (1 + lv * 0.6) * SZ;
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    for (let i = 0; i < FN; i++) {
      const e = fd.e[i];
      if (e < 0.025) continue;
      const z = fd.z[i], x = fd.x[i], y = fd.y[i];
      const fl = 0.78 + 0.22 * Math.sin(S.t * 31 + fd.ph[i] * 20);
      G(fd.ph[i] > 5.2 ? SP.cyan : SP.blue, x, y, (2 + z * 4.5 + e * 3.5) * SZ, e * fl * 0.78 * a * vis);
      if (e > 0.7) G(SP.white, x, y, (1 + z * 1.4) * SZ, (e - 0.7) * 1.6 * a * vis);
    }
    // krill
    for (const k of KR) {
      if (LL.amb > 0.05) {
        NRM();
        ctx.fillStyle = `rgba(20,30,60,${0.6 * LL.amb * a})`;
        ctx.fillRect(k.x - 4 * k.s, k.y - 1, 8 * k.s, 2);
        ADD();
      }
      const tw = 0.25 + 0.5 * Math.max(0, Math.sin(S.t * 1.3 + k.ph)) + k.st;
      G(SP.aqua, k.x, k.y + 1, (2.2 + k.st * 3) * SZ * k.s, Math.min(1, tw) * 0.8 * vis * a);
      G(SP.blue, k.x - 3 * k.s, k.y + 1, 1.8 * SZ * k.s, Math.min(1, tw) * 0.6 * vis * a);
    }
    // helmet jellies
    for (const p of PERI) {
      const s = p.s, pulse = Math.pow(0.5 + 0.5 * Math.sin(S.t * 1.1 + p.seed), 2);
      const own = (0.25 + 0.55 * pulse) * vis;
      ctx.save();
      ctx.translate(p.x, p.y);
      ADD();
      G(SP.blueS, 0, -s * 0.6, s * 5, 0.13 * own * a);
      NRM();
      ctx.strokeStyle = `rgba(190,70,100,${(0.08 + 0.25 * own) * a})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        const th = (k / 11) * Math.PI, bx = Math.cos(th) * s * 0.55;
        ctx.moveTo(bx, 0);
        ctx.quadraticCurveTo(bx * 1.8, s * 0.3, bx * 2.3 + Math.sin(S.t * 0.8 + k) * s * 0.15, -s * 0.3 + Math.sin(S.t + k) * s * 0.1);
      }
      ctx.stroke();
      const dome = new Path2D();
      dome.moveTo(-s * 0.56, 0);
      dome.bezierCurveTo(-s * 0.6, -s * 0.7, -s * 0.26, -s * 1.28, 0, -s * 1.32);
      dome.bezierCurveTo(s * 0.26, -s * 1.28, s * 0.6, -s * 0.7, s * 0.56, 0);
      dome.quadraticCurveTo(0, s * 0.1, -s * 0.56, 0);
      const dg = ctx.createLinearGradient(0, -s * 1.3, 0, 0);
      // the deep red that makes it invisible here: seen only by its own light
      dg.addColorStop(0, `rgba(150,26,52,${(0.06 + 0.3 * own + 0.1 * LL.amb) * a})`);
      dg.addColorStop(1, `rgba(60,6,20,${(0.1 + 0.2 * own) * a})`);
      ctx.fillStyle = dg;
      ctx.fill(dome);
      ctx.strokeStyle = `rgba(150,170,255,${(0.06 + 0.22 * own) * a})`;
      ctx.stroke(dome);
      // travelling waves of blue light over the dome
      ADD();
      for (let m = 0; m < 7; m++) {
        const mm = -0.8 + m * 0.267;
        for (let k = 0; k < 6; k++) {
          const f = k / 5, x = mm * s * 0.5 * Math.sin(f * Math.PI * 0.5 + 0.3), y = -f * s * 1.2;
          const wv = Math.pow(Math.max(0, Math.sin(S.t * 3 - k * 0.9 + m * 0.6 + p.seed)), 4);
          G(SP.blue, x, y, 5 * SZ, wv * own * a);
        }
      }
      ctx.restore();
    }
    // the whale
    if (F) drawWhaleBody(F, a);
    NRM();
  }
  function drawWhaleBody(F, a) {
    const { nx, ny, ax, ay, mx, my, L } = F;
    const P2 = (u, v) => [nx + ax * u * L + mx * v * L, ny + ay * u * L + my * v * L];
    const body = new Path2D();
    const N = 70, U = 1.14;
    for (let k = 0; k <= N; k++) {
      const u = (k / N) * U, [x, y] = P2(u, whTop(u) + whOff(u));
      k ? body.lineTo(x, y) : body.moveTo(x, y);
    }
    for (let k = N; k >= 0; k--) {
      const u = (k / N) * U, [x, y] = P2(u, whBot(u) + whOff(u));
      body.lineTo(x, y);
    }
    body.closePath();
    const fin = new Path2D();
    const [f0x, f0y] = P2(0.35, -0.075), [f1x, f1y] = P2(0.45, -0.15 + Math.sin(WH.t * 1.1) * 0.01), [f2x, f2y] = P2(0.42, -0.088);
    fin.moveTo(f0x, f0y);
    fin.quadraticCurveTo((f0x + f1x) / 2 - mx * 0.01 * L, (f0y + f1y) / 2 - my * 0.01 * L, f1x, f1y);
    fin.quadraticCurveTo((f1x + f2x) / 2, (f1y + f2y) / 2, f2x, f2y);
    fin.closePath();
    NRM();
    // a void: darker than the darkness around it
    ctx.fillStyle = `rgba(0,1,4,${0.975 * a})`;
    ctx.fill(body);
    ctx.fill(fin);
    const sl = WH.slow;
    ctx.strokeStyle = `rgba(100,150,255,${(0.08 + 0.12 * sl) * a})`;
    ctx.lineWidth = 1;
    ctx.stroke(body);
    // corrugated skin along the flank, caught faintly by the plankton light
    ctx.strokeStyle = `rgba(110,150,255,${(0.03 + 0.05 * sl) * a})`;
    ctx.beginPath();
    for (let r = 0; r < 7; r++) {
      const vv = -0.07 + r * 0.022;
      for (let k = 0; k <= 40; k++) {
        const u = 0.4 + (k / 40) * 0.45, [x, y] = P2(u, vv * (1 - (u - 0.4) * 0.9) + whOff(u) + Math.sin(u * 90 + r) * 0.002);
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
    // the long, narrow lower jaw
    ctx.strokeStyle = `rgba(120,160,255,${(0.06 + 0.1 * sl) * a})`;
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) {
      const u = 0.03 + (k / 20) * 0.27, [x, y] = P2(u, -0.072 - Math.sin((k / 20) * Math.PI) * 0.004);
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    // skin catching the light of the plankton it disturbs
    ADD();
    for (let i = 0; i < FN; i++) {
      const s = fd.ns[i];
      if (!s || fd.e[i] < 0.3) continue;
      G(SP.blueS, fd.x[i] - mx * s * 0.008 * L, fd.y[i] - my * s * 0.008 * L, 0.014 * L, fd.e[i] * 0.05 * a);
    }
    // the eye — the moment of recognition
    const [ex, ey] = P2(0.3, -0.035), el = 0.35 + 0.65 * sl, rot = Math.atan2(ay, ax);
    NRM();
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(rot);
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, L * 0.0078, L * 0.0042, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(150,190,255,${0.4 * el * a})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = `rgba(120,160,255,${0.12 * el * a})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, L * 0.011, L * 0.0065, 0, 0, TAU);
    ctx.stroke();
    ADD();
    G(SP.white, -L * 0.0018, -L * 0.0012, L * 0.0035, 0.85 * el * a);
    G(SP.blueS, 0, 0, L * 0.03, 0.12 * el * a);
    ctx.restore();
    NRM();
  }

  /* ═══════════════ ZONE IV · the lamp, marine snow, the abyssal floor ═══════════════ */
  const LAMP = { ox: W / 2, oy: -70, ang: Math.PI / 2, len: H, half: 0.17, on: 0 };
  function updateLamp() {
    LAMP.on = S.w[4] * (1 - (PH.dark || 0) * 0.94);
    LAMP.ox = W * 0.5 + (P.ex - W * 0.5) * 0.22;
    LAMP.oy = -70;
    const dx = P.ex - LAMP.ox, dy = P.ey - LAMP.oy;
    LAMP.ang = Math.atan2(dy, dx);
    LAMP.len = Math.hypot(dx, dy) + 320 * SZ;
    LAMP.half = 0.16 + S.lampFlare * 0.13;
  }
  function lampAt(x, y) {
    if (LAMP.on < 0.02) return 0;
    const dx = x - LAMP.ox, dy = y - LAMP.oy, d = Math.hypot(dx, dy);
    let v = 0;
    if (d < LAMP.len) {
      const a = Math.abs(angDiff(Math.atan2(dy, dx), LAMP.ang));
      if (a < LAMP.half) {
        const e = 1 - a / LAMP.half;
        v = e * e * (0.35 + 0.65 * (1 - d / LAMP.len));
      }
    }
    const hx = x - P.ex, hy = y - P.ey, h2 = hx * hx + hy * hy, hr = 140 * SZ;
    if (h2 < hr * hr) v += (1 - h2 / (hr * hr)) * 0.7;
    return Math.min(1.2, v * (1 + S.lampFlare * 0.8)) * LAMP.on;
  }
  function drawLamp(a) {
    if (a < 0.01) return;
    ADD();
    ctx.save();
    ctx.translate(LAMP.ox, LAMP.oy);
    ctx.rotate(LAMP.ang);
    const L = LAMP.len;
    for (const [k, al] of [[1, 0.05], [0.72, 0.05], [0.45, 0.06], [0.2, 0.06]]) {
      const hw = Math.tan(LAMP.half * k) * L;
      const g = ctx.createLinearGradient(0, 0, L, 0);
      g.addColorStop(0, `rgba(210,228,255,${al * 1.6 * a * (1 + S.lampFlare)})`);
      g.addColorStop(0.5, `rgba(170,200,255,${al * 0.8 * a * (1 + S.lampFlare)})`);
      g.addColorStop(1, "rgba(150,180,255,0)");
      ctx.fillStyle = g;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(L, -hw);
      ctx.lineTo(L, hw);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    G(SP.whiteS, P.ex, P.ey, 170 * SZ, (0.08 + S.lampFlare * 0.12) * a);
    NRM();
  }

  // Enypniastes eximia — sheds luminous skin to tag attackers
  const CUC = Array.from({ length: 2 }, (_, i) => ({
    key: "cucumber", x: W * (0.3 + i * 0.4), y: rand(H * 0.3, H * 0.7), L: rand(56, 82) * SZ, vx: 0, vy: 0, ph: rand(1),
    flash: 0, cd: 0, lampT: 0, seed: rand(TAU), beat: 0,
  }));
  CUC.forEach((c) => (c.fr = c.L * 0.7));
  function updateCucumber(c, dt) {
    c.ph = (c.ph + dt * 0.55) % 1;
    c.beat = Math.sin(c.ph * TAU);
    c.vy -= Math.max(0, c.beat) * 16 * dt;
    c.vy += 5 * dt;
    c.vx += (Math.sin(S.t * 0.1 + c.seed) * 9 - c.vx) * dt;
    c.vy *= Math.exp(-0.8 * dt);
    c.x += c.vx * dt;
    c.y += c.vy * dt - S.dScroll * 0.5;
    const l = lampAt(c.x, c.y), near = P.present && Math.hypot(P.x - c.x, P.y - c.y) < c.L * 0.7;
    if (l > 0.5 || near) c.lampT += dt;
    else c.lampT = Math.max(0, c.lampT - dt);
    c.cd -= dt;
    // a sonar pressure wave is a "touch" too: defensive glow + shed skin
    const hitBy = pingHit(c, c.x, c.y);
    if (hitBy) {
      blip(c.x, c.y, ECHO.bio);
      sonarLabel("cuc" + CUC.indexOf(c), "BIO · HOLOTHURIAN · LIGHT DEFENCE", c.x, c.y - c.L * 0.4, ECHO.bio, 0.5);
      if (c.cd <= 0) c.lampT = 9;
    }
    if (c.lampT > 0.9 && c.cd <= 0) {
      c.flash = 1;
      c.cd = 5;
      c.lampT = 0;
      for (let k = 0; k < 30; k++)
        spark(c.x + rand(-c.L / 2, c.L / 2), c.y + rand(-c.L / 3, c.L / 3), rand(-26, 26), rand(-26, 8), rand(3.5, 6.5), rand(5, 11) * SZ, Math.random() < 0.3 ? SP.blue : SP.aqua);
      sound.chord(392);
      if (P.present || isTouch || hitBy) log("cucumber");
    }
    c.flash *= Math.exp(-1.3 * dt);
    if (c.y < -c.L * 2) { c.y = H + c.L; c.x = rand(W * 0.15, W * 0.85); }
    if (c.y > H + c.L * 2) { c.y = -c.L; c.x = rand(W * 0.15, W * 0.85); }
    if (c.x < -c.L) c.x = W + c.L * 0.5;
    if (c.x > W + c.L) c.x = -c.L * 0.5;
  }
  function drawCucumber(c, a) {
    const L = c.L, lit = Math.min(1, 0.1 + lampAt(c.x, c.y) * 1.3 + focusLight(c.x, c.y) + c.flash * 0.6 + (PINGS.length ? echoAt(c.x, c.y) * 0.5 : 0));
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(Math.sin(S.t * 0.4 + c.seed) * 0.15);
    ADD();
    ctx.globalAlpha = 1;
    const b = c.beat;
    ctx.beginPath();
    ctx.moveTo(-L * 0.42, -L * 0.04);
    for (let k = 0; k <= 18; k++) {
      const f = k / 18;
      ctx.lineTo(lerp(-L * 0.44, L * 0.44, f), -L * 0.14 - Math.sin(f * Math.PI) * L * (0.3 + 0.12 * b) + Math.sin(f * 9 + S.t * 4) * L * 0.02);
    }
    ctx.lineTo(L * 0.42, -L * 0.04);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,120,150,${0.1 * lit * a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,170,195,${0.28 * lit * a})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    const bg = ctx.createRadialGradient(0, L * 0.02, 0, 0, L * 0.06, L * 0.5);
    bg.addColorStop(0, `rgba(255,160,185,${0.2 * lit * a})`);
    bg.addColorStop(1, `rgba(255,110,150,${0.05 * lit * a})`);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, L * 0.06, L * 0.46, L * 0.25, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,150,70,${0.5 * lit * a})`;
    ctx.lineWidth = 2 * SZ;
    ctx.beginPath();
    ctx.moveTo(-L * 0.32, L * 0.02);
    ctx.bezierCurveTo(-L * 0.1, L * 0.2 + Math.sin(S.t) * 3, L * 0.05, -L * 0.08, L * 0.32, L * 0.12);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,180,200,${0.2 * lit * a})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      const x = lerp(-L * 0.36, L * 0.36, k / 8);
      ctx.moveTo(x, L * 0.28);
      ctx.lineTo(x + Math.sin(S.t * 2 + k) * 2, L * 0.36);
    }
    ctx.stroke();
    if (c.flash > 0.02) {
      for (let k = 0; k < 12; k++) {
        const th = (k / 12) * TAU + c.seed;
        G(SP.aqua, Math.cos(th) * L * 0.38, L * 0.06 + Math.sin(th) * L * 0.2, 12 * SZ, c.flash * 0.8 * a);
      }
      G(SP.aquaS, 0, 0, L * 1.5, c.flash * 0.3 * a);
    }
    ctx.restore();
    NRM();
  }

  // Hadal snailfish — no light of its own
  const SNAIL = { key: "snailfish", x: W * 0.3, y: H * 0.65, L: 120 * SZ, dir: 1, seed: rand(TAU) };
  SNAIL.fr = SNAIL.L * 0.5;
  function updateSnail(dt) {
    const s = SNAIL;
    s.x += s.dir * 12 * SZ * dt;
    s.y += Math.sin(S.t * 0.3 + s.seed) * 5 * dt;
    if (s.x > W + s.L) { s.dir = -1; s.y = rand(H * 0.45, H * 0.8); }
    if (s.x < -s.L) { s.dir = 1; s.y = rand(H * 0.45, H * 0.8); }
    if (pingHit(s, s.x, s.y) && s.x > 0 && s.x < W) {
      sonarLabel("snail", "BIO · SNAILFISH · NO GAS BLADDER", s.x, s.y - s.L * 0.2, ECHO.bio, 0);
      blip(s.x, s.y, ECHO.bio);
    }
  }
  function drawSnail(a) {
    const s = SNAIL, L = s.L;
    // no swim bladder → a weak, soft echo (compare the grenadiers' white-hot returns)
    const se = PINGS.length ? echoAt(s.x, s.y) : 0;
    if (se > 0.02) { ADD(); G(SP.bioS, s.x, s.y, L * 0.7, se * 0.18 * a); NRM(); }
    const lit = Math.min(1, lampAt(s.x, s.y) * 1.2 + focusLight(s.x, s.y) + 0.025 + se * 0.35);
    if (lit < 0.02) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(s.dir, 1);
    NRM();
    const top = [], bot = [];
    for (let k = 0; k <= 16; k++) {
      const f = k / 16, sx = L * 0.28 - f * L * 1.0, sy = Math.sin(S.t * 3 - f * 5) * f * L * 0.06;
      const hw = L * 0.15 * Math.pow(1 - f, 0.75) + L * 0.008;
      top.push([sx, sy - hw]);
      bot.push([sx, sy + hw * 0.9]);
    }
    ctx.beginPath();
    ctx.moveTo(L * 0.36, 0);
    for (const [x, y] of top) ctx.lineTo(x, y);
    for (let k = bot.length - 1; k >= 0; k--) ctx.lineTo(bot[k][0], bot[k][1]);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,214,226,${0.42 * lit * a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,232,240,${0.5 * lit * a})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,220,235,${0.18 * lit * a})`;
    ctx.beginPath();
    for (let k = 3; k < 16; k++) {
      ctx.moveTo(top[k][0], top[k][1]);
      ctx.lineTo(top[k][0] - 3, top[k][1] - L * 0.05);
      ctx.moveTo(bot[k][0], bot[k][1]);
      ctx.lineTo(bot[k][0] - 3, bot[k][1] + L * 0.05);
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(60,30,45,${0.8 * lit * a})`;
    ctx.beginPath();
    ctx.arc(L * 0.2, -L * 0.04, L * 0.022, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Floor: appears as we near 10,935 m
  const PENS = Array.from({ length: 9 }, (_, i) => ({ x: (i + rand(0.15, 0.85)) / 9, h: rand(60, 140) * SZ, seed: rand(TAU), glow: 0 }));
  const BRIT = Array.from({ length: 6 }, (_, i) => ({ x: (i + rand(0.2, 0.8)) / 6, r: rand(10, 18) * SZ, seed: rand(TAU), rot: rand(TAU), glow: 0 }));
  const floorY = () => H + 30 - smooth(4.5, Math.max(4.55, S.cMax - 0.02), S.c) * H * 0.24;
  const fh = (x, fy) => fy + Math.sin(x * 0.005 + 1.3) * 18 * SZ + Math.sin(x * 0.013 + 0.2) * 9 * SZ + Math.sin(x * 0.041) * 3;
  function drawFloor(a, dt) {
    const fy = floorY();
    if (fy > H + 20) return;
    NRM();
    const px = (P.ex - W / 2) * 0.03;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, fy - 56 * SZ + Math.sin((x + px) * 0.003 + 2) * 36 * SZ + Math.sin((x + px) * 0.011) * 12 * SZ);
    ctx.lineTo(W, H);
    ctx.fillStyle = `rgba(9,11,22,${a})`;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 16) ctx.lineTo(x, fh(x, fy));
    ctx.lineTo(W, H);
    const g = ctx.createLinearGradient(0, fy - 30, 0, H);
    g.addColorStop(0, `rgba(18,22,38,${a})`);
    g.addColorStop(0.3, `rgba(6,7,14,${a})`);
    g.addColorStop(1, `rgba(2,2,5,${a})`);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = `rgba(140,160,210,${0.14 * a})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (PINGS.length) {
      const fp = [];
      for (let x = 0; x <= W + 16; x += 12) fp.push(x, fh(x, fy));
      echoLine(fp, ECHO.rock, 1.2, false, 0, 0, a);
      NRM();
    }
    // sediment speckle lit by lamp
    ADD();
    for (let k = 0; k < 70; k++) {
      const x = ((k * 97.3) % 1) * W + ((k * 131) % W), xx = x % W, y = fh(xx, fy) + ((k * 37) % 60) * SZ + 4;
      const l = lampAt(xx, y);
      if (l > 0.05) G(SP.white, xx, y, 2.5 * SZ, l * 0.5 * a);
    }
    // sea pens: waves of light run up the colony when touched by the lamp
    for (const p of PENS) {
      const bx = p.x * W, by = fh(bx, fy) + 2;
      const sway = Math.sin(S.t * 0.7 + p.seed) * 0.1;
      const tx = bx + Math.sin(sway) * p.h, ty = by - Math.cos(sway) * p.h;
      const l = lampAt(tx, ty) + (P.present ? Math.max(0, 1 - Math.hypot(P.x - tx, P.y - ty) / (90 * SZ)) : 0);
      if (l > 0.35) p.glow = Math.min(1, p.glow + dt * 2);
      if (PINGS.length && echoAt(tx, ty) > 0.55) p.glow = 1; // the wavefront sets each colony off as it passes
      p.glow *= Math.exp(-0.35 * dt);
      NRM();
      ctx.strokeStyle = `rgba(160,180,220,${(0.18 + Math.min(1, l) * 0.4) * a})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + Math.sin(sway) * p.h * 0.3, by - p.h * 0.5, tx, ty);
      ctx.stroke();
      ADD();
      for (let k = 0; k < 10; k++) {
        const f = 0.45 + (k / 9) * 0.55;
        const sx = lerp(bx, tx, f), sy = lerp(by, ty, f), lw = 11 * SZ * (1 - Math.abs(f - 0.72) * 2.2);
        const wv = Math.pow(Math.max(0, Math.sin(f * 14 - S.t * 3.2 + p.seed)), 4) * p.glow;
        NRM();
        ctx.strokeStyle = `rgba(170,200,230,${(0.12 + Math.min(1, l) * 0.3) * a})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - lw, sy - lw * 0.5);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx + lw, sy - lw * 0.5);
        ctx.stroke();
        ADD();
        G(SP.aqua, sx - lw, sy - lw * 0.5, 5 * SZ, (0.06 + wv * 0.9) * a);
        G(SP.aqua, sx + lw, sy - lw * 0.5, 5 * SZ, (0.06 + wv * 0.9) * a);
      }
    }
    // brittle stars
    for (const b of BRIT) {
      const bx = b.x * W, by = fh(bx, fy) + 6 * SZ;
      const l = lampAt(bx, by);
      if (l > 0.3) b.glow = Math.min(1, b.glow + dt * 2.5);
      if (PINGS.length && echoAt(bx, by) > 0.55) b.glow = 1;
      b.glow *= Math.exp(-0.6 * dt);
      NRM();
      ctx.strokeStyle = `rgba(170,185,215,${(0.14 + Math.min(1, l) * 0.45) * a})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const th = b.rot + (k * TAU) / 5;
        ctx.moveTo(bx, by);
        for (let j = 1; j <= 6; j++) {
          const f = j / 6, w = Math.sin(S.t * 1.2 + k + f * 3 + b.seed) * 0.5 * f;
          ctx.lineTo(bx + Math.cos(th + w) * b.r * 1.8 * f, by + Math.sin(th + w) * b.r * 0.55 * f);
        }
      }
      ctx.stroke();
      ADD();
      if (b.glow > 0.02) {
        for (let k = 0; k < 5; k++) {
          const th = b.rot + (k * TAU) / 5;
          G(SP.green, bx + Math.cos(th) * b.r * 1.2, by + Math.sin(th) * b.r * 0.38, 6 * SZ, b.glow * 0.8 * a);
        }
      }
    }
    NRM();
  }

  /* ═══════════════════════ SONAR · seeing the abyss with sound ═══════════════════════
     A ping is a circle expanding at constant speed. Every echo is computed from arrival
     time (distance ÷ speed), so things light up exactly when the wavefront physically
     reaches them — then decay like phosphor on an old sonar tube. Different materials
     answer in different "voices": rock (cyan contours + stipple), bone (warm double
     echo), vent plumes (green turbulent speckle), flesh (magenta), gas bladders
     (white-hot cores), distant geology (violet, late and faint).                      */
  const PINGS = [];
  let pingId = 0;
  const SON = { cd: 0, count: 0, blips: [], labels: [], stat: "", contact: null, announceAt: -1, echoes: 0, lastPingT: -99, ox: 0, oy: 0 };
  const ECHO = { rock: "130,240,255", bio: "255,120,210", bone: "255,232,190", plume: "120,255,170", far: "160,145,255", unk: "255,80,160" };
  const hash = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
  const vessel = () => [W * 0.5, H * 0.46];
  const abScroll = () => S.sScroll - (S.tops[4] - H * 0.5);
  const narrow = () => W < 760;

  function emitPing(x, y, pow, auto) {
    const v = Math.hypot(W, H) / 3.1;
    const maxR = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 60;
    PINGS.push({ id: ++pingId, x, y, t0: S.t, v, maxR, pow, auto });
    if (PINGS.length > 5) PINGS.shift();
    SON.lastPingT = S.t;
    SON.ox = x;
    SON.oy = y;
    SON.echoes = 0;
    if (!reduced) S.shake = Math.max(S.shake, 2.5);
    sound.sonar();
    if (!auto) { SON.count++; SON.cd = 1.25; advanceContact(); }
  }
  function sonarPing(fromCursor) {
    if (S.zone !== 4 || SON.cd > 0 || PH.st === "enc") return false;
    const o = fromCursor && P.active && !isTouch ? [P.x, P.y] : vessel();
    emitPing(o[0], o[1], 1, false);
    return true;
  }
  // echo brightness at a point: sharp flash on arrival + long phosphor tail
  function echoAt(x, y, delay = 0) {
    let best = 0;
    for (let i = 0; i < PINGS.length; i++) {
      const p = PINGS[i], d = Math.hypot(x - p.x, y - p.y);
      const dt = S.t - delay - p.t0 - d / p.v;
      if (dt < 0 || dt > 7) continue;
      const v = p.pow * (0.6 * Math.exp(-dt * 8) + 0.4 * Math.exp(-dt * 0.65)) * (1 - 0.4 * Math.min(1, d / p.maxR));
      if (v > best) best = v;
    }
    return best;
  }
  // has a new wavefront just reached this entity? (fires once per ping)
  function pingHit(ent, x, y) {
    for (const p of PINGS) {
      if (p.id <= (ent.lp || 0)) continue;
      const dt = S.t - p.t0 - Math.hypot(x - p.x, y - p.y) / p.v;
      if (dt >= 0) { ent.lp = p.id; if (dt < 0.5) return p; }
    }
    return null;
  }
  function sonarLabel(key, text, x, y, col, par = 0.6) {
    if (PH.st === "enc") return; // keep the frame clean during the encounter
    if (SON.labels.some((l) => l.key === key && S.t - l.t0 < 3.5)) return;
    SON.labels.push({ key, text, x, y, col, par, t0: S.t });
    if (SON.labels.length > 7) SON.labels.shift();
    SON.echoes++;
  }
  function blip(x, y, col) {
    SON.blips.push({ a: Math.atan2(y - SON.oy, x - SON.ox), r: clamp(Math.hypot(x - SON.ox, y - SON.oy) / (Math.hypot(W, H) * 0.55), 0.04, 0.95), col, t0: S.t });
    if (SON.blips.length > 60) SON.blips.shift();
  }
  // draws a polyline whose every vertex is lit by its own echo arrival (+ optional lamp light)
  function echoLine(pts, rgb, lw, closed, lampK = 0, delay = 0, scale = 1) {
    const n = pts.length / 2;
    if (n < 2) return 0;
    const e = new Float32Array(n);
    let mx = 0;
    for (let i = 0; i < n; i++) {
      const x = pts[2 * i], y = pts[2 * i + 1];
      e[i] = ((PINGS.length ? echoAt(x, y, delay) : 0) + (lampK ? lampK * lampAt(x, y) : 0)) * scale;
      if (e[i] > mx) mx = e[i];
    }
    if (mx < 0.02) return 0;
    ADD();
    ctx.globalAlpha = 1;
    ctx.lineCap = "round";
    const segs = closed ? n : n - 1;
    for (let lv = 0; lv < 4; lv++) {
      const lo = 0.03 + lv * 0.22, hi = lv === 3 ? 9 : lo + 0.22;
      let any = false;
      ctx.beginPath();
      for (let i = 0; i < segs; i++) {
        const j = (i + 1) % n, ee = (e[i] + e[j]) * 0.5;
        if (ee >= lo && ee < hi) { ctx.moveTo(pts[2 * i], pts[2 * i + 1]); ctx.lineTo(pts[2 * j], pts[2 * j + 1]); any = true; }
      }
      if (!any) continue;
      const al = Math.min(1, lo + 0.14);
      ctx.strokeStyle = `rgba(${rgb},${0.14 * al})`;
      ctx.lineWidth = lw * 5;
      ctx.stroke();
      ctx.strokeStyle = `rgba(${rgb},${0.92 * al})`;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    return mx;
  }

  /* ── hidden geology: a trench the lamp never reaches ── */
  const WPAR = 0.85;
  const nz = (y) => 0.5 * Math.sin(y * 0.0042 + 1.3) + 0.3 * Math.sin(y * 0.0113 + 0.4) + 0.15 * Math.sin(y * 0.029 + 2.1);
  const LEDGES = [
    { side: -1, f: 2.25, len: 0.17, th: 70, feat: "vent" }, // rises beside the sonar intro: the first ping finds it
    { side: 1, f: 3.4, len: 0.22, th: 60, feat: "whale" },
    { side: -1, f: 4.6, len: 0.12, th: 50 },
  ];
  const shelf = (u) => (u < -1 ? 0 : u < -0.82 ? smooth(-1, -0.82, u) : u < 0.2 ? 1 : 1 - smooth(0.2, 1.9, u));
  const ledgeLen = (L) => L.len * W * (narrow() ? 1.6 : 1);
  const wallBase = (side, wy) =>
    W * (narrow() ? 0.035 : 0.07) + W * 0.03 * nz(wy + side * 777) + 5 * SZ * Math.sin(wy * 0.19) * Math.sin(wy * 0.043 + 1);
  function wallX(side, wy) {
    let led = 0;
    for (const L of LEDGES) if (L.side === side) led = Math.max(led, shelf((wy - L.f * H) / (L.th * SZ)) * ledgeLen(L));
    const off = wallBase(side, wy) + led;
    return side < 0 ? off : W - off;
  }
  function ledgeTop(L) {
    const wyTop = L.f * H - L.th * SZ;
    return { y: wyTop - abScroll() * WPAR, base: wallBase(L.side, wyTop), len: ledgeLen(L), side: L.side };
  }
  const ledgeX = (T, q) => (T.side < 0 ? T.base + T.len * q : W - T.base - T.len * q);
  const wallEnt = { "-1": { lp: 0 }, 1: { lp: 0 } };
  function drawTrench(a) {
    const off = abScroll() * WPAR, step = 7;
    const wy0 = Math.floor((off - 30) / step) * step;
    for (const side of [-1, 1]) {
      const pts = [], wys = [];
      for (let wy = wy0; wy <= off + H + 30; wy += step) {
        const x = wallX(side, wy), y = wy - off;
        const n = pts.length;
        // subdivide long (ledge) segments so the shelf top gets echo detail too
        if (n >= 2) {
          const px = pts[n - 2], py = pts[n - 1], gap = Math.abs(x - px);
          for (let k = 1, m = Math.floor(gap / 9); k < m; k++) { pts.push(lerp(px, x, k / m), lerp(py, y, k / m)); wys.push(wy - step + (step * k) / m); }
        }
        pts.push(x, y);
        wys.push(wy);
      }
      // the rock mass: barely darker than the water
      NRM();
      ctx.beginPath();
      ctx.moveTo(side < 0 ? -10 : W + 10, pts[1]);
      for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.lineTo(side < 0 ? -10 : W + 10, pts[pts.length - 1]);
      ctx.closePath();
      ctx.fillStyle = `rgba(0,0,2,${0.5 * a})`;
      ctx.fill();
      const mx = echoLine(pts, ECHO.rock, 1.3, false, 0.45, 0, a);
      if (mx < 0.02) continue;
      // basalt stipple behind the contour
      ctx.fillStyle = `rgb(${ECHO.rock})`;
      for (let i = 0; i < pts.length; i += 4) {
        const x = pts[i], y = pts[i + 1], e = ((PINGS.length ? echoAt(x, y) : 0) + 0.3 * lampAt(x, y)) * a;
        if (e < 0.05) continue;
        const wy = wys[i >> 1];
        for (let k = 0; k < 3; k++) {
          const h = hash(wy * 0.37 + k * 7.7), d = (4 + h * 52) * SZ;
          ctx.globalAlpha = Math.min(1, e * (1 - d / (60 * SZ)) * 0.9);
          ctx.fillRect(x + (side < 0 ? -d : d), y + (hash(wy + k * 3.1) - 0.5) * step * 2, 1.4, 1.4);
        }
      }
      ctx.globalAlpha = 1;
      const mid = Math.floor(pts.length / 4) * 2;
      const p = pingHit(wallEnt[side], pts[mid], pts[mid + 1]);
      if (p) {
        if (side < 0 || !narrow()) sonarLabel("wall" + side, "ROCK · TRENCH WALL", pts[mid] + (side < 0 ? 8 : -8), pts[mid + 1], ECHO.rock, WPAR);
        for (let i = 0; i < pts.length; i += 24) blip(pts[i], pts[i + 1], ECHO.rock);
        sound.echo("rock");
      }
    }
  }

  // distant seamount — echoes late, faint and violet
  const RIDGE = Array.from({ length: 72 }, (_, i) => {
    const f = i / 71;
    return 0.55 * Math.pow(Math.sin(f * Math.PI), 1.5) + 0.12 * Math.sin(f * 17.3) + 0.05 * Math.sin(f * 43) + 0.25 * Math.exp(-Math.pow((f - 0.68) * 6, 2));
  });
  const ridgeEnt = { lp: 0 };
  function drawRidge(a) {
    const baseY = H * 2.35 - abScroll() * 0.35;
    if (baseY < -20 || baseY - H * 0.55 > H + 20) return;
    const pts = [];
    for (let i = 0; i < RIDGE.length; i++) pts.push((i / (RIDGE.length - 1)) * W * 1.2 - W * 0.1, baseY - RIDGE[i] * H * 0.5);
    NRM();
    ctx.beginPath();
    ctx.moveTo(pts[0], H + 10);
    for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.lineTo(pts[pts.length - 2], H + 10);
    ctx.fillStyle = `rgba(0,0,3,${0.35 * a})`;
    ctx.fill();
    echoLine(pts, ECHO.far, 1, false, 0, 0, 0.65 * a);
    // sediment layering on the flanks
    for (let L = 1; L <= 3; L++) {
      const lp = [];
      for (let i = 6; i < RIDGE.length - 6; i += 2) lp.push(pts[i * 2], pts[i * 2 + 1] + L * 26 * SZ + Math.sin(i * 0.7 + L) * 4);
      echoLine(lp, ECHO.far, 0.7, false, 0, L * 0.05, 0.35 * a);
    }
    const k = 2 * Math.floor(RIDGE.length * 0.68);
    if (pingHit(ridgeEnt, pts[k], pts[k + 1])) {
      sonarLabel("ridge", "SEAMOUNT · FAR FIELD", pts[k], pts[k + 1], ECHO.far, 0.35);
      for (let i = 0; i < pts.length; i += 12) blip(pts[i], pts[i + 1], ECHO.far);
      sound.echo("far");
    }
  }

  // black smokers on the first ledge
  const VENTS = [{ q: 0.3, h: 80 }, { q: 0.56, h: 124 }, { q: 0.8, h: 60 }].map((v) => ({
    ...v, seed: rand(TAU), parts: Array.from({ length: 40 }, () => ({ age: rand(7), sx: rand(-1, 1), s: rand(0.7, 1.3) })),
  }));
  const ventEnt = { lp: 0 };
  function drawVents(a, dt) {
    const T = ledgeTop(LEDGES[0]);
    if (T.y < -40 || T.y > H + 260) return;
    const sc = narrow() ? 0.7 : 1;
    let topX = 0, topY = 0;
    for (const v of VENTS) {
      const bx = ledgeX(T, v.q), by = T.y + 3, h = v.h * SZ * sc;
      const L = [], Rr = [];
      const lean = Math.sin(v.seed) * 0.18;
      for (let j = 0; j <= 16; j++) {
        const f = j / 16, cx0 = bx + lean * h * f * f;
        // knobbly sulphide chimney: flanges and beehive lumps
        const base = (11 - 6.5 * f) * SZ * sc;
        const knob = 0.3 * Math.sin(f * 13 + v.seed) + 0.18 * Math.sin(f * 31 + v.seed * 2) + (hash(v.seed * 10 + j) - 0.5) * 0.5;
        L.push(cx0 - base * (1 + knob), by - h * f);
        Rr.unshift(cx0 + base * (1 + 0.8 * knob + (hash(v.seed + j * 3) - 0.5) * 0.4), by - h * f);
      }
      const pts = L.concat(Rr);
      NRM();
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) (i ? ctx.lineTo : ctx.moveTo).call(ctx, pts[i], pts[i + 1]);
      ctx.closePath();
      ctx.fillStyle = `rgba(0,0,2,${0.7 * a})`;
      ctx.fill();
      echoLine(pts, ECHO.rock, 1.1, true, 0.5, 0, a);
      // the plume: superheated, mineral-laden water — a turbulent, grainy echo
      const tx = bx + lean * h, ty = by - h;
      if (v.h > 100) { topX = tx; topY = ty; }
      for (const p of v.parts) {
        p.age += dt * p.s;
        if (p.age > 7) { p.age = 0; p.sx = rand(-1, 1); }
        const px = tx + p.sx * (3 + p.age * 7) * SZ + Math.sin(p.age * 1.4 + v.seed + p.sx * 3) * p.age * 5 * SZ;
        const py = ty - p.age * 30 * SZ;
        const e = PINGS.length ? echoAt(px, py) : 0, l = lampAt(px, py);
        ADD();
        if (e > 0.02) {
          // turbulent scatter: each parcel of plume flickers rather than glowing steadily
          const fl = 0.6 + 0.4 * Math.sin(S.t * 17 + p.sx * 40 + p.age * 9);
          G(SP.green, px, py, (3 + p.age * 2.4) * SZ, e * (0.75 - p.age * 0.08) * fl * a);
        }
        if (l > 0.05) { NRM(); ctx.fillStyle = `rgba(90,80,70,${l * 0.25 * (1 - p.age / 7) * a})`; ctx.beginPath(); ctx.arc(px, py, (3 + p.age * 3) * SZ, 0, TAU); ctx.fill(); }
      }
      // vent glow: real, faint, and far too dim for human eyes
      ADD();
      G(SP.redS, tx, ty, 9 * SZ, 0.07 * a * (0.7 + 0.3 * Math.sin(S.t * 3 + v.seed)));
    }
    NRM();
    if (pingHit(ventEnt, topX, topY) && topY > 0 && topY < H) {
      sonarLabel("vent", "HYDROTHERMAL VENT · ≈ 400 °C", topX, topY, ECHO.plume, WPAR);
      blip(topX, topY, ECHO.plume);
      sound.echo("plume");
      log("vent");
    }
  }

  // a whale fall on the second ledge: only bone answers like this
  const WHALE = (() => {
    const polys = [];
    polys.push({ c: true, p: [0, 2, 0.02, 6, 0.08, 11, 0.16, 15, 0.22, 17, 0.25, 12, 0.25, 3] });
    polys.push({ c: false, p: [0.01, 4, 0.1, 8, 0.2, 11] });
    for (const o of [0, 3]) {
      const p = [];
      for (let k = 0; k <= 12; k++) { const f = k / 12; p.push(f * 0.3, 1 + o + Math.sin(f * Math.PI) * 5); }
      polys.push({ c: false, p });
    }
    for (let k = 0; k < 24; k++) {
      const u = 0.28 + k * 0.029, s = 8 * (1 - k / 32), hw = 0.009 * (1 - k / 40);
      polys.push({ c: true, p: [u - hw, 1, u + hw, 1, u + hw, 1 + s, u - hw, 1 + s] });
      if (k < 14) polys.push({ c: false, p: [u, 1 + s, u + 0.004, 1 + s * 1.9] });
    }
    for (let k = 0; k < 10; k++) {
      const u = 0.3 + k * 0.027, hh = 22 * (1 - Math.abs(k - 4) / 7), p = [];
      for (let j = 0; j <= 6; j++) { const f = j / 6; p.push(u + f * 0.035 + Math.sin(f * Math.PI) * 0.006, 2 + Math.sin(f * Math.PI) * hh * (k % 2 ? 0.86 : 1)); }
      polys.push({ c: false, p });
    }
    polys.push({ c: false, p: [0.31, 1, 0.36, 0, 0.42, 1.5] });
    polys.push({ c: false, p: [0.45, 1, 0.5, 0.2, 0.55, 1] });
    return polys;
  })();
  const whaleEnt = { lp: 0 };
  function drawWhale(a) {
    const T = ledgeTop(LEDGES[1]);
    if (T.y < -40 || T.y > H + 80) return;
    const vs = (T.len * 0.84) / 300;
    const map = (u, v) => [ledgeX(T, 0.08 + u * 0.84), T.y + 1 - v * vs];
    for (const poly of WHALE) {
      const pts = [];
      for (let i = 0; i < poly.p.length; i += 2) { const [x, y] = map(poly.p[i], poly.p[i + 1]); pts.push(x, y); }
      // bone rings twice: the primary return and a fainter internal reflection
      echoLine(pts, ECHO.bone, 1.1, poly.c, 0.6, 0, a);
      const ghost = pts.map((v, i) => (i % 2 ? v - 3 : v));
      echoLine(ghost, ECHO.bone, 0.7, poly.c, 0, 0.16, 0.45 * a);
    }
    // Osedax: bone-eating worms, only visible in the lamp
    ADD();
    for (let k = 0; k < 16; k++) {
      const [x, y] = map(0.3 + k * 0.04, 6 + (k % 3) * 2);
      const l = lampAt(x, y);
      if (l > 0.05) G(SP.red, x, y, 3 * SZ, l * 0.8 * a);
    }
    NRM();
    const [cx, cy] = map(0.3, 8);
    if (pingHit(whaleEnt, cx, cy) && cy > 0 && cy < H) {
      sonarLabel("whale", "BONE · WHALE FALL", cx, cy, ECHO.bone, WPAR);
      blip(cx, cy, ECHO.bone);
      sound.echo("bone");
      log("whalefall");
    }
  }

  /* ── sonar-reactive creatures ── */
  // Abyssal grenadiers: gas-filled swim bladders return blinding echoes; they bolt.
  const GREN = Array.from({ length: W > 760 ? 9 : 6 }, () => ({
    key: "grenadier", x: rand(W * 0.25, W * 0.75), y: rand(H * 0.45, H * 0.85), ox: rand(-140, 140) * SZ, oy: rand(-70, 70) * SZ,
    L: rand(60, 92) * SZ, vx: rand(-12, 12), vy: rand(-3, 3), st: 0, seed: rand(TAU), lp: 0,
  }));
  function updateGren(dt) {
    const gx = W * (0.5 + 0.28 * Math.sin(S.t * 0.05)), gy = H * (0.64 + 0.14 * Math.sin(S.t * 0.07 + 1));
    let hit = null, cx = 0, cy = 0;
    for (const g of GREN) {
      const p = pingHit(g, g.x, g.y);
      if (p) {
        const dx = g.x - p.x, dy = g.y - p.y, d = Math.hypot(dx, dy) + 1;
        g.vx += (dx / d) * 280;
        g.vy += (dy / d) * 200;
        g.st = 1;
        hit = p;
        blip(g.x, g.y, ECHO.bio);
      }
      const k = 1 - g.st;
      g.vx += ((gx + g.ox - g.x) * 0.05 * k - g.vx * 0.4) * dt;
      g.vy += ((gy + g.oy - g.y) * 0.05 * k - g.vy * 0.4) * dt;
      const sp = Math.hypot(g.vx, g.vy), mx = 24 + g.st * 300;
      if (sp > mx) { g.vx *= mx / sp; g.vy *= mx / sp; }
      g.st *= Math.exp(-0.9 * dt);
      g.x += g.vx * dt;
      g.y += g.vy * dt - S.dScroll * 0.6;
      cx += g.x; cy += g.y;
      if (g.y < -H * 0.5) g.y += H * 1.8;
      if (g.y > H * 1.5) g.y -= H * 1.8;
    }
    if (hit) {
      sonarLabel("gren", `BIO · GRENADIER ×${GREN.length} · GAS BLADDERS`, cx / GREN.length, cy / GREN.length - 40, ECHO.bio);
      sound.echo("bio");
    }
  }
  function drawGren(a) {
    for (const g of GREN) {
      const e = PINGS.length ? echoAt(g.x, g.y) : 0, lit = Math.min(1, lampAt(g.x, g.y) * 1.1 + focusLight(g.x, g.y));
      if (lit < 0.02 && e < 0.02) continue;
      const L = g.L, ang = Math.atan2(g.vy, g.vx || 0.001);
      const face = Math.cos(ang) >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.scale(face, 1);
      ctx.rotate((face > 0 ? ang : Math.PI - ang) + 0.28 * (1 - g.st)); // rattails cruise head-down
      const top = [], bot = [];
      for (let k = 0; k <= 14; k++) {
        const f = k / 14, sx = L * 0.3 - f * L, sy = Math.sin(S.t * (4 + g.st * 12) - f * 5 + g.seed) * f * L * 0.05;
        const hw = L * 0.11 * Math.pow(1 - f, 1.3) + 0.6;
        top.push(sx, sy - hw);
        bot.push(sx, sy + hw * 0.85);
      }
      const path = new Path2D();
      path.moveTo(L * 0.36, 0);
      for (let i = 0; i < top.length; i += 2) path.lineTo(top[i], top[i + 1]);
      for (let i = bot.length - 2; i >= 0; i -= 2) path.lineTo(bot[i], bot[i + 1]);
      path.closePath();
      NRM();
      if (lit > 0.02) {
        ctx.fillStyle = `rgba(150,140,135,${0.55 * lit * a})`;
        ctx.fill(path);
        ctx.fillStyle = `rgba(20,20,30,${0.8 * lit * a})`;
        ctx.beginPath();
        ctx.arc(L * 0.24, -L * 0.02, L * 0.045, 0, TAU);
        ctx.fill();
      }
      if (e > 0.02) {
        ctx.strokeStyle = `rgba(${ECHO.bio},${Math.min(1, e) * 0.85 * a})`;
        ctx.lineWidth = 1;
        ctx.stroke(path);
        ADD();
        G(SP.bioS, 0, 0, L * 0.55, e * 0.22 * a);
        G(SP.white, L * 0.1, L * 0.01, (5 + e * 5) * SZ, Math.min(1, e * 1.2) * a); // gas bladder: the brightest thing in the sea
      }
      ctx.restore();
    }
    NRM();
  }

  // Dumbo octopus: curious first, defensive if you push it
  const DUMBO = { key: "dumbo", x: W * 0.78, y: H * 0.7, vx: 0, vy: 0, mode: "wander", mt: 0, R: 30 * SZ, tx: W * 0.7, ty: H * 0.6, flap: 0, web: 0, lp: 0, seed: rand(TAU) };
  DUMBO.fr = DUMBO.R * 1.4;
  function updateDumbo(dt) {
    const D = DUMBO;
    D.mt += dt;
    const p = pingHit(D, D.x, D.y);
    if (p) {
      blip(D.x, D.y, ECHO.bio);
      const dOrigin = Math.hypot(D.x - p.x, D.y - p.y);
      if ((D.mode === "hover" || D.mode === "approach") && dOrigin < 260 * SZ) {
        D.mode = "umbrella";
        D.mt = 0;
        sonarLabel("dumbo", "BIO · CIRRATE OCTOPUS · DEFENSIVE", D.x, D.y - D.R, ECHO.bio, 0.5);
      } else if (D.mode !== "umbrella") {
        D.mode = "approach";
        D.mt = 0;
        const side = D.x < p.x ? -1 : 1;
        D.tx = clamp(p.x + side * 120 * SZ, W * 0.12, W * 0.88);
        D.ty = clamp(p.y + 50 * SZ, H * 0.2, H * 0.85);
        sonarLabel("dumbo", "BIO · CIRRATE OCTOPUS · APPROACHING", D.x, D.y - D.R, ECHO.bio, 0.5);
      }
      sound.echo("bio");
    }
    let tx = D.tx, ty = D.ty, speed = 18;
    if (D.mode === "wander") {
      if (D.mt > 6) { D.mt = 0; D.tx = rand(W * 0.55, W * 0.88); D.ty = rand(H * 0.3, H * 0.8); }
    } else if (D.mode === "approach") {
      speed = 48;
      if (Math.hypot(D.x - tx, D.y - ty) < 24 * SZ) { D.mode = "hover"; D.mt = 0; log("dumbo"); }
    } else if (D.mode === "hover") {
      tx += Math.sin(S.t * 0.7) * 14;
      ty += Math.sin(S.t * 1.1) * 8;
      speed = 14;
      if (D.mt > 10) { D.mode = "wander"; D.mt = 0; }
    } else if (D.mode === "umbrella") {
      const dx = D.x - SON.ox, dy = D.y - SON.oy, d = Math.hypot(dx, dy) + 1;
      tx = D.x + (dx / d) * 200;
      ty = D.y + (dy / d) * 200;
      speed = 60;
      if (D.mt > 3.5) { D.mode = "wander"; D.mt = 0; }
    }
    D.web += ((D.mode === "umbrella" ? 1 : 0) - D.web) * (1 - Math.exp(-dt * 5));
    const dx = tx - D.x, dy = ty - D.y, d = Math.hypot(dx, dy) + 0.01;
    D.vx += ((dx / d) * Math.min(speed, d) - D.vx) * dt * 1.5;
    D.vy += ((dy / d) * Math.min(speed, d) - D.vy) * dt * 1.5;
    D.flap += dt * (2.5 + Math.hypot(D.vx, D.vy) * 0.08);
    D.x += D.vx * dt;
    D.y += D.vy * dt - S.dScroll * 0.5;
    D.ty -= S.dScroll * 0.5;
    D.tx = clamp(D.tx, W * 0.08, W * 0.92);
    D.ty = clamp(D.ty, -H * 0.2, H * 1.2);
    if (D.y < -H * 0.4) D.y += H * 1.6;
    if (D.y > H * 1.4) D.y -= H * 1.6;
  }
  function drawDumbo(a) {
    const D = DUMBO, R = D.R;
    const e = PINGS.length ? echoAt(D.x, D.y) : 0;
    const lit = Math.min(1, lampAt(D.x, D.y) * 1.2 + focusLight(D.x, D.y) + (D.mode === "hover" ? 0.08 : 0.02));
    if (lit < 0.03 && e < 0.02) return;
    const web = D.web, flap = Math.sin(D.flap);
    ctx.save();
    ctx.translate(D.x, D.y);
    ctx.rotate(Math.sin(S.t * 0.8 + D.seed) * 0.08 + clamp(D.vx * 0.004, -0.3, 0.3));
    const skirt = new Path2D();
    const tips = [];
    for (let k = 0; k < 8; k++) {
      const s = (k / 7) * 2 - 1;
      tips.push([s * lerp(R * 0.7, R * 1.75, web), lerp(R * 1.05 - Math.abs(s) * R * 0.25, -R * 0.55 + Math.abs(s) * R * 0.25, web) + Math.sin(S.t * 2 + k) * R * 0.05]);
    }
    skirt.moveTo(-R * 0.5, -R * 0.1);
    skirt.lineTo(tips[0][0], tips[0][1]);
    for (let k = 1; k < 8; k++) {
      const [x0, y0] = tips[k - 1], [x1, y1] = tips[k];
      skirt.quadraticCurveTo((x0 + x1) * 0.5 * 0.85, (y0 + y1) * 0.5 * (web > 0.5 ? 1.2 : 0.85), x1, y1);
    }
    skirt.lineTo(R * 0.5, -R * 0.1);
    skirt.closePath();
    const head = new Path2D();
    head.ellipse(0, -R * 0.38, R * 0.6, R * 0.68, 0, 0, TAU);
    const fins = new Path2D();
    for (const s of [-1, 1]) {
      fins.moveTo(s * R * 0.5, -R * 0.65);
      fins.ellipse(s * R * 0.78, -R * 0.7 - flap * R * 0.12, R * 0.34, R * 0.16, s * (0.5 + flap * 0.45), 0, TAU);
    }
    NRM();
    if (lit > 0.03) {
      ctx.fillStyle = `rgba(255,180,160,${0.45 * lit * a})`;
      ctx.fill(skirt);
      ctx.fillStyle = `rgba(255,200,180,${0.62 * lit * a})`;
      ctx.fill(head);
      ctx.fill(fins);
      ctx.strokeStyle = `rgba(255,225,210,${0.45 * lit * a})`;
      ctx.lineWidth = 0.8;
      ctx.stroke(skirt);
      ctx.fillStyle = `rgba(40,20,25,${0.9 * lit * a})`;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * R * 0.26, -R * 0.18, R * 0.08, 0, TAU); ctx.fill(); }
    }
    if (e > 0.02) {
      ctx.strokeStyle = `rgba(${ECHO.bio},${Math.min(1, e) * 0.8 * a})`;
      ctx.lineWidth = 1;
      ctx.stroke(skirt);
      ctx.stroke(head);
      ctx.stroke(fins);
      ADD();
      G(SP.bioS, 0, -R * 0.2, R * 2.2, e * 0.3 * a);
    }
    ctx.restore();
    NRM();
  }

  /* ── the rare encounter: an unknown contact that closes with every ping ── */
  const PH = { st: "dormant", t: 0, x: 0, y: 0, R: 0, flood: 0, dark: 0, pendingAt: -1, cap: -1, capT: 0, lastTop: "", lastBot: "", fish: { a: 0 } };
  const PH_CLOUD = (() => {
    const c = [];
    for (let i = 0; i < 84; i++) { const th = (i / 83) * Math.PI; c.push([Math.cos(th), -Math.sin(th) * 0.8, 0]); }
    for (let i = 0; i < 26; i++) c.push([(i / 25) * 2 - 1, 0.04, 0]);
    for (let i = 0; i < 160; i++) {
      const u = rand(-0.95, 0.95), v = rand(0, 1) * Math.sqrt(1 - u * u);
      c.push([u, -v * 0.7, 1]);
    }
    return c;
  })();
  const PH_CAPS = [
    { t: 0.3, top: "@contact", bot: "Something large is rising beneath the vessel." },
    { t: 3.2, bot: "Sonar return: soft-bodied. No gas bladder. A bell more than a metre across." },
    { t: 4.7, top: "Floodlights on · Stygiomedusa gigantea", bot: "The giant phantom jelly. Four curtain-like arms up to ten metres long — and not a single stinging tentacle." },
    { t: 9.2, bot: "It gathers prey in those arms. Seen only about a hundred times since it was first collected in 1899." },
    { t: 13.1, top: "Contact lost · added to field log", bot: "" },
  ];
  function advanceContact() {
    if (PH.st !== "dormant") return;
    if (!SON.contact) {
      if (SON.count >= 2 && S.depth > 4800) {
        // bearing: off the left flank (clear of the HUD and the sonar control)
        SON.contact = { range: 430 + ((Math.random() * 40) | 0), bear: Math.random() < 0.5 ? 2.9 : 3.45, seen: S.t + 1.3, shown: 0 };
        SON.announceAt = S.t + 1.3;
      }
      return;
    }
    const C = SON.contact;
    C.track = (C.track || 0) + 1;
    // three tracking pings always bring it in: 4xx → 3xx → 1xx → contact
    C.range = C.track >= 3 ? 38 : Math.max(60, C.range - (130 + ((Math.random() * 25) | 0)));
    C.seen = S.t + 1.1;
    SON.announceAt = S.t + 1.1;
    if (C.track >= 3) PH.pendingAt = S.t + 2;
  }
  function contactEdge() {
    const C = SON.contact, cx = W / 2, cy = H / 2, dx = Math.cos(C.bear), dy = Math.sin(C.bear), m = 46;
    const t = Math.min(dx ? ((dx > 0 ? W - m : m) - cx) / dx : 1e9, dy ? ((dy > 0 ? H - m : m) - cy) / dy : 1e9);
    return [cx + dx * t, cy + dy * t, dx, dy];
  }
  function startEncounter() {
    const R = clamp(Math.min(W, H) * 0.3, 110, 300);
    const fromLeft = SON.contact ? Math.cos(SON.contact.bear) < 0 : Math.random() < 0.5;
    Object.assign(PH, { st: "enc", t: 0, R, x: W * (fromLeft ? 0.4 : 0.6), y: H + R * 1.4, cap: -1, flood: 0, dark: 0 });
    SON.contact = null;
    SON.labels.length = 0;
    PH.lastTop = PH.lastBot = null;
    WH.cTop = WH.cBot = null;
    root.dataset.cine = "1";
    S.shake = 9;
    sound.swell();
  }
  function endEncounter(complete) {
    // left too early? the contact slips back into the dark and can be found again
    PH.st = complete ? "done" : "dormant";
    if (!complete) SON.count = 1;
    PH.flood = 0;
    PH.dark = 0;
    root.dataset.cine = "";
    if (complete) log("phantom");
  }
  function setCaption(key, text) {
    if (PH[key] === text) return;
    PH[key] = text;
    const el = R(key === "lastTop" ? "capTop" : "capBot");
    if (el) el.textContent = text;
  }
  function updateEncounter(dt) {
    if (PH.st !== "enc") return;
    if (S.w[4] < 0.45) { endEncounter(PH.t > 6); return; } // visitor swam away
    PH.t += dt;
    const t = PH.t;
    // rises into frame under sonar, hangs in place as the floodlights come on, then ascends out of reach
    const yA = H + PH.R * 0.95, yB = H * 0.6, yC = -PH.R * 0.9;
    PH.y = t < 4.8 ? lerp(yA, yB, 1 - Math.pow(1 - clamp(t / 4.8), 3)) : lerp(yB, yC, smooth(4.9, 14.3, t));
    PH.x += Math.sin(t * 0.35) * 9 * dt;
    for (const at of [0.7, 2.9, 5.2, 7.6, 10]) if (t - dt < at && t >= at) emitPing(...vessel(), 0.95, true);
    PH.dark = smooth(0, 0.7, t) * (1 - smooth(4.5, 5, t)); // lights out: sonar only…
    PH.flood = smooth(4.6, 5.6, t) * (1 - smooth(12, 14, t)); // …then floodlights
    if (t > 4.6 && t - dt <= 4.6) { S.flash = 0; sound.chord(293.66); S.shake = 4; }
    PH.fish.a += dt * 0.9;
    // captions (typewriter)
    let ci = -1;
    for (let i = 0; i < PH_CAPS.length; i++) if (t >= PH_CAPS[i].t) ci = i;
    if (ci !== PH.cap && ci >= 0) {
      PH.cap = ci;
      PH.capT = t;
      const C = PH_CAPS[ci];
      if (C.top !== undefined) PH.topText = C.top;
      if (C.bot !== undefined) PH.botText = C.bot;
    }
    const top = PH.topText === "@contact" ? `Unknown contact · ${Math.max(4, Math.round(38 - t * 9))} m · closing` : PH.topText || "";
    setCaption("lastTop", top);
    const bt = PH.botText || "";
    setCaption("lastBot", bt.slice(0, Math.floor((t - PH.capT) * 55)));
    if (t > 14.4) endEncounter(true);
  }
  function phantomArms() {
    const R = PH.R, arms = [];
    for (let i = 0; i < 4; i++) {
      const x0 = (-0.45 + i * 0.3) * R, spine = [];
      const Larm = R * (5.2 + (i % 2) * 0.8);
      // long, slow travelling waves — the arms fan out and twist like heavy silk in a current;
      // |cos(twist)| makes each ribbon turn edge-on and back as it undulates
      for (let k = 0; k <= 40; k++) {
        const f = k / 40;
        const twist = Math.abs(Math.cos(f * 4.6 - S.t * 0.55 + i * 1.3));
        spine.push([
          PH.x + x0 * (1 + f * 1.4) + Math.sin(S.t * 0.45 - f * 3 + i * 1.7) * R * 0.85 * f + Math.sin(S.t * 0.8 - f * 6.5 + i) * R * 0.12 * f,
          PH.y - R * 0.06 + f * Larm,
          R * 0.26 * (1 - 0.62 * f) * (0.18 + 0.82 * twist),
        ]);
      }
      arms.push(spine);
    }
    return arms;
  }
  function drawPhantom(a) {
    if (PH.st !== "enc") return;
    const R = PH.R, arms = phantomArms();
    const lit = Math.max(PH.flood, lampAt(PH.x, PH.y) * 0.6);
    // floodlights from the vessel
    if (PH.flood > 0.01) {
      ADD();
      const fg = ctx.createRadialGradient(W / 2, -H * 0.25, 0, W / 2, -H * 0.25, H * 1.5);
      fg.addColorStop(0, `rgba(205,220,255,${0.16 * PH.flood})`);
      fg.addColorStop(1, "rgba(205,220,255,0)");
      ctx.fillStyle = fg;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, W, H);
    }
    // the real animal, in light
    if (lit > 0.01) {
      NRM();
      const la = lit * a;
      const armLen = R * 6;
      // curtain arms: translucent, ruffled, dissolving into the dark below
      arms.forEach((sp, i) => {
        const Lf = [], Rt = [];
        for (let k = 0; k < sp.length; k++) {
          const p0 = sp[Math.max(0, k - 1)], p1 = sp[Math.min(sp.length - 1, k + 1)];
          let nx = -(p1[1] - p0[1]), ny = p1[0] - p0[0];
          const nl = Math.hypot(nx, ny) || 1;
          nx /= nl; ny /= nl;
          const w = sp[k][2], f = k / (sp.length - 1);
          const rl = 1 + 0.1 * Math.sin(f * 22 - S.t * 2.1 + i * 2), rr = 1 + 0.1 * Math.sin(f * 19 - S.t * 1.8 + i * 3 + 1);
          Lf.push([sp[k][0] + nx * w * rl, sp[k][1] + ny * w * rl]);
          Rt.push([sp[k][0] - nx * w * rr, sp[k][1] - ny * w * rr]);
        }
        const curve = (pts, start) => {
          if (start) ctx.moveTo(pts[0][0], pts[0][1]);
          for (let k = 1; k < pts.length - 1; k++) ctx.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2);
          ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
        };
        const ag = ctx.createLinearGradient(0, PH.y, 0, PH.y + armLen);
        ag.addColorStop(0, `rgba(140,34,50,${0.55 * la})`);
        ag.addColorStop(0.3, `rgba(105,22,38,${0.42 * la})`);
        ag.addColorStop(0.75, `rgba(70,14,28,${0.16 * la})`);
        ag.addColorStop(1, "rgba(60,10,24,0)");
        ctx.beginPath();
        curve(Lf, true);
        const back = Rt.slice().reverse();
        ctx.lineTo(back[0][0], back[0][1]);
        curve(back, false);
        ctx.closePath();
        ctx.fillStyle = ag;
        ctx.fill();
        const eg = ctx.createLinearGradient(0, PH.y, 0, PH.y + armLen);
        eg.addColorStop(0, `rgba(255,150,160,${0.4 * la})`);
        eg.addColorStop(1, "rgba(255,150,160,0)");
        ctx.strokeStyle = eg;
        ctx.lineWidth = 1;
        ctx.stroke();
        // inner folds of the curtain
        const fg2 = ctx.createLinearGradient(0, PH.y, 0, PH.y + armLen * 0.8);
        fg2.addColorStop(0, `rgba(70,10,25,${0.45 * la})`);
        fg2.addColorStop(1, "rgba(70,10,25,0)");
        ctx.strokeStyle = fg2;
        for (const o of [-0.35, 0.3]) {
          ctx.beginPath();
          curve(sp.map(([x, y, w], k) => [x + o * w * (1 + 0.3 * Math.sin(k * 0.5 + S.t + i)), y]), true);
          ctx.stroke();
        }
      });
      // the bell: a slow-pulsing translucent dome with a scalloped margin
      const pu = 0.5 + 0.5 * Math.sin(PH.t * 1.05);
      const bw = R * (1 - 0.05 * pu), bh = R * (0.8 + 0.06 * pu), bx = PH.x, by = PH.y;
      const bell = new Path2D();
      bell.moveTo(bx - bw, by);
      bell.bezierCurveTo(bx - bw * 1.02, by - bh * 0.72, bx - bw * 0.56, by - bh, bx, by - bh);
      bell.bezierCurveTo(bx + bw * 0.56, by - bh, bx + bw * 1.02, by - bh * 0.72, bx + bw, by);
      const NL = 22;
      for (let k = 0; k < NL; k++) {
        const x0 = bx + bw - (k / NL) * 2 * bw, x1 = bx + bw - ((k + 1) / NL) * 2 * bw;
        const sag = R * (0.05 + 0.02 * Math.sin(k * 1.3 + PH.t * 1.6));
        bell.quadraticCurveTo((x0 + x1) / 2, by + sag, x1, by + R * 0.01);
      }
      bell.closePath();
      const bg = ctx.createRadialGradient(bx - R * 0.15, by - bh * 0.7, 0, bx, by - bh * 0.3, R * 1.15);
      bg.addColorStop(0, `rgba(165,55,70,${0.6 * la})`);
      bg.addColorStop(0.4, `rgba(110,22,40,${0.56 * la})`);
      bg.addColorStop(1, `rgba(52,8,20,${0.5 * la})`);
      ctx.fillStyle = bg;
      ctx.fill(bell);
      // gastric core glimpsed through the jelly
      const cg = ctx.createRadialGradient(bx, by - bh * 0.25, 0, bx, by - bh * 0.25, R * 0.55);
      cg.addColorStop(0, `rgba(55,6,18,${0.45 * la})`);
      cg.addColorStop(1, "rgba(55,6,18,0)");
      ctx.fillStyle = cg;
      ctx.fill(bell);
      // radial canals
      ctx.save();
      ctx.clip(bell);
      ctx.fillStyle = `rgba(35,4,14,${0.14 * la})`;
      for (let k = 0; k < 16; k++) {
        const u = hash(k * 3.3) * 2 - 1, v = hash(k * 7.1 + 1);
        ctx.beginPath();
        ctx.arc(bx + u * bw * 0.8, by - v * bh * 0.85, R * (0.04 + hash(k + 0.5) * 0.09), 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = `rgba(255,160,170,${0.09 * la})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 28; k++) {
        const th = Math.PI + (k / 27) * Math.PI;
        ctx.moveTo(bx + Math.cos(th) * bw * 0.12, by - bh * 0.55 + Math.sin(th) * bh * 0.08);
        ctx.quadraticCurveTo(bx + Math.cos(th) * bw * 0.7, by + Math.sin(th) * bh * 0.8, bx + Math.cos(th) * bw * 1.02, by + 2);
      }
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = `rgba(255,175,185,${0.38 * la})`;
      ctx.lineWidth = 1.2;
      ctx.stroke(bell);
      ADD();
      G(SP.pinkS, bx - bw * 0.3, by - bh * 0.72, R * 0.55, 0.14 * la); // floodlight sheen
      G(SP.pinkS, bx, by - bh * 0.4, R * 1.3, 0.05 * la);
      NRM();
      // Thalassobathia pelagica: a small fish often seen sheltering with the phantom
      const fx = PH.x + Math.cos(PH.fish.a) * R * 0.85, fy = PH.y + R * 0.35 + Math.sin(PH.fish.a * 1.7) * R * 0.25, fs = R * 0.12;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(Math.sin(PH.fish.a) > 0 ? -1 : 1, 1);
      ctx.fillStyle = `rgba(30,20,28,${0.85 * lit * a})`;
      ctx.beginPath();
      ctx.moveTo(fs, 0);
      ctx.quadraticCurveTo(0, -fs * 0.35, -fs, 0);
      ctx.lineTo(-fs * 1.3, -fs * 0.25);
      ctx.lineTo(-fs * 1.3, fs * 0.25);
      ctx.lineTo(-fs, 0);
      ctx.quadraticCurveTo(0, fs * 0.35, fs, 0);
      ctx.fill();
      ctx.restore();
    }
    // the sonar image: a point cloud that forms wherever the wavefront sweeps across it
    ADD();
    const ca = a * (1 - 0.55 * PH.flood); // the scan recedes once we can see it for real
    // continuous echo contours: bell silhouette and the edges of every arm
    {
      const op = [];
      for (let i = 0; i <= 48; i++) { const th = (i / 48) * Math.PI; op.push(PH.x + Math.cos(th) * R, PH.y - Math.sin(th) * R * 0.8); }
      for (let i = 1; i < 16; i++) op.push(PH.x - R + (i / 16) * 2 * R, PH.y + R * 0.04);
      echoLine(op, ECHO.bio, 1.6, true, 0, 0, ca);
      for (const sp of arms) {
        const le = [], re = [];
        for (const [x, y, w] of sp) { if (y > H + 40) break; le.push(x - w, y); re.push(x + w, y); }
        echoLine(le, ECHO.bio, 1, false, 0, 0, 0.85 * ca);
        echoLine(re, ECHO.bio, 1, false, 0, 0, 0.85 * ca);
      }
      ADD();
    }
    for (const [u, v, inner] of PH_CLOUD) {
      const x = PH.x + u * R, y = PH.y + v * R;
      const e = echoAt(x, y);
      if (e < 0.02) continue;
      G(inner ? SP.bioS : SP.bio, x, y, (inner ? 5 : 3.8) * SZ, e * (inner ? 0.5 : 1) * ca);
      if (e > 0.7 && !inner) G(SP.white, x, y, 2 * SZ, (e - 0.7) * 2.5 * ca);
    }
    for (let i = 0; i < 4; i++) {
      const sp = arms[i];
      for (let k = 0; k < sp.length; k += 1) {
        const [x, y, w] = sp[k];
        if (y > H + 20) break;
        for (const s of [-1, 0, 1]) {
          const px = x + s * w, e = echoAt(px, y);
          if (e > 0.02) G(s ? SP.bio : SP.bioS, px, y, (s ? 3.2 : 4.5) * SZ, e * (s ? 0.85 : 0.35) * ca);
        }
      }
    }
    NRM();
  }
  function drawContactMarker() {
    const C = SON.contact;
    if (!C || !C.shown || PH.st !== "dormant") return;
    const [x, y, dx, dy] = contactEdge();
    const near = 1 - C.shown / 470, pulse = 0.5 + 0.5 * Math.sin(S.t * (3 + near * 5));
    // something vast just beyond the edge, caught by the wave
    const e = PINGS.length ? echoAt(x + dx * 60, y + dy * 60) : 0;
    ADD();
    if (e > 0.02) {
      const sz = lerp(90, 300, near) * SZ;
      G(SP.bioS, x + dx * sz * 0.6, y + dy * sz * 0.6, sz, e * 0.5);
      for (let k = 0; k < 26; k++) {
        const th = Math.atan2(dy, dx) + Math.PI + ((k / 25) - 0.5) * 1.6;
        const rr = sz * (0.75 + 0.08 * Math.sin(k * 2.3));
        G(SP.bio, x + dx * sz * 0.6 + Math.cos(th) * rr, y + dy * sz * 0.6 + Math.sin(th) * rr, 3 * SZ, e * 0.8);
      }
    }
    NRM();
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.strokeStyle = `rgba(${ECHO.unk},${0.5 + 0.5 * pulse})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, -9);
    ctx.lineTo(6, 0);
    ctx.lineTo(-6, 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 16 + pulse * 6, 0, TAU);
    ctx.strokeStyle = `rgba(${ECHO.unk},${0.25 * (1 - pulse)})`;
    ctx.stroke();
    ctx.restore();
    ctx.font = `400 ${W < 760 ? 8.5 : 9.5}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
    ctx.fillStyle = `rgba(${ECHO.unk},0.9)`;
    ctx.textAlign = dx > 0.3 ? "right" : dx < -0.3 ? "left" : "center";
    const tx = x - dx * 30, ty = y - dy * 30;
    ctx.fillText(`UNKNOWN · ${C.shown} M`, tx, ty);
    ctx.fillStyle = "rgba(220,236,255,0.55)";
    ctx.fillText("PING TO TRACK", tx, ty + 13);
    ctx.textAlign = "left";
  }

  /* ── the wave itself: refraction, scattering, phosphor ── */
  // Refraction: the band around the newest wavefront is redrawn from the canvas itself,
  // magnified about the origin, so the world bulges as the pressure wave passes.
  // (Self-copy forces a mid-frame flush, so adaptive quality drops this first.)
  function lensPass() {
    if (S.noLens || !PINGS.length) return;
    {
      const p = PINGS[PINGS.length - 1];
      const r = (S.t - p.t0) * p.v;
      if (r < 24 || r > p.maxR) return;
      const a = p.pow * Math.pow(1 - r / p.maxR, 0.6);
      if (a < 0.04) return;
      const k = 0.03 * a;
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 10, 0, TAU);
      ctx.arc(p.x, p.y, Math.max(1, r - 38), 0, TAU, true);
      ctx.clip();
      ctx.translate(p.x, p.y);
      ctx.scale(1 + k, 1 + k);
      ctx.translate(-p.x, -p.y);
      NRM();
      // copy only the annulus' bounding box
      const x0 = Math.max(0, p.x - r - 14), y0 = Math.max(0, p.y - r - 14);
      const x1 = Math.min(W, p.x + r + 14), y1 = Math.min(H, p.y + r + 14);
      if (x1 - x0 > 2 && y1 - y0 > 2) ctx.drawImage(canvas, x0 * DPR, y0 * DPR, (x1 - x0) * DPR, (y1 - y0) * DPR, x0, y0, x1 - x0, y1 - y0);
      ctx.restore();
    }
  }
  function drawPings() {
    for (const p of PINGS) {
      const age = S.t - p.t0, r = age * p.v;
      // transducer mark at the origin
      if (age < 1.6) {
        const f = 1 - age / 1.6;
        ADD();
        G(SP.phos, p.x, p.y, 40 * SZ, 0.5 * f * p.pow);
        NRM();
        ctx.strokeStyle = `rgba(${ECHO.plume},${0.8 * f})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 7); ctx.lineTo(p.x + 7, p.y); ctx.lineTo(p.x, p.y + 7); ctx.lineTo(p.x - 7, p.y); ctx.closePath();
        ctx.stroke();
      }
      if (r > p.maxR + 60) continue;
      const fall = Math.pow(clamp(1 - r / p.maxR), 0.7) * p.pow;
      if (fall < 0.01) continue;
      ADD();
      ctx.globalAlpha = 1;
      // fading phosphorescent wake
      const r0 = Math.max(0, r - 280 * SZ);
      const tg = ctx.createRadialGradient(p.x, p.y, r0, p.x, p.y, r + 2);
      tg.addColorStop(0, "rgba(60,255,170,0)");
      tg.addColorStop(0.8, `rgba(70,255,190,${0.035 * fall})`);
      tg.addColorStop(1, `rgba(120,255,220,${0.08 * fall})`);
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 2, 0, TAU);
      ctx.arc(p.x, p.y, Math.max(0.1, r0), 0, TAU, true);
      ctx.fill();
      // the wavefront: soft leading scatter, hot core, cold fringe
      const ri = Math.max(0, r - 30);
      const fg = ctx.createRadialGradient(p.x, p.y, ri, p.x, p.y, r + 20);
      fg.addColorStop(0, "rgba(120,255,230,0)");
      fg.addColorStop(0.5, `rgba(140,255,230,${0.16 * fall})`);
      fg.addColorStop(0.6, `rgba(230,255,250,${0.55 * fall})`);
      fg.addColorStop(0.66, `rgba(150,225,255,${0.16 * fall})`);
      fg.addColorStop(1, "rgba(120,200,255,0)");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 20, 0, TAU);
      ctx.arc(p.x, p.y, Math.max(0.1, ri), 0, TAU, true);
      ctx.fill();
      // turbulent shimmer on the front
      ctx.strokeStyle = `rgba(220,255,250,${0.22 * fall})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let k = 0; k <= 120; k++) {
        const th = (k / 120) * TAU, rr = r - 8 + Math.sin(th * 9 + age * 6) * 2.5 + Math.sin(th * 23 - age * 9) * 1.2;
        (k ? ctx.lineTo : ctx.moveTo).call(ctx, p.x + Math.cos(th) * rr, p.y + Math.sin(th) * rr);
      }
      ctx.stroke();
      // multipath: a weaker reflection trailing the front
      ctx.strokeStyle = `rgba(120,255,210,${0.1 * fall})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.86, 0, TAU);
      ctx.stroke();
      // scattering glints
      for (let k = 0; k < 18; k++) {
        const th = Math.random() * TAU;
        G(Math.random() < 0.3 ? SP.white : SP.phos, p.x + Math.cos(th) * r, p.y + Math.sin(th) * r, rand(3, 9) * SZ, fall * rand(0.2, 0.7));
      }
      // range rings left behind, like a sonar display
      NRM();
      ctx.setLineDash([2, 7]);
      for (let rr = 140 * SZ; rr < r - 40; rr += 140 * SZ) {
        const ra = 0.12 * fall * Math.exp(-(age - rr / p.v) * 0.9);
        if (ra < 0.01) continue;
        ctx.strokeStyle = `rgba(${ECHO.plume},${ra})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rr, 0, TAU);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    NRM();
  }
  function drawSonarLabels() {
    if (!SON.labels.length) return;
    NRM();
    ctx.font = `400 ${W < 760 ? 8.5 : 9.5}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
    for (let i = SON.labels.length - 1; i >= 0; i--) {
      const L = SON.labels[i];
      L.y -= S.dScroll * L.par;
      const age = S.t - L.t0;
      if (age > 4.4) { SON.labels.splice(i, 1); continue; }
      const al = smooth(0, 0.2, age) * (1 - smooth(3.2, 4.4, age));
      const dir = L.x > W * 0.6 ? -1 : 1, tx = L.x + dir * 30, ty = L.y - 24;
      const txt = L.text.slice(0, Math.floor(age * 70));
      const tw = ctx.measureText(txt).width;
      ctx.strokeStyle = `rgba(${L.col},${0.65 * al})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(L.x - 3.5, L.y - 3.5, 7, 7);
      ctx.beginPath();
      ctx.moveTo(L.x + dir * 4, L.y - 4);
      ctx.lineTo(tx, ty + 5);
      ctx.lineTo(tx + dir * (tw + 4), ty + 5);
      ctx.stroke();
      ctx.fillStyle = `rgba(${L.col},${0.95 * al})`;
      ctx.textAlign = dir > 0 ? "left" : "right";
      ctx.fillText(txt, tx + dir * 2, ty);
    }
    ctx.textAlign = "left";
  }
  function updateSonar(dt) {
    SON.cd = Math.max(0, SON.cd - dt);
    for (let i = PINGS.length - 1; i >= 0; i--) if (S.t - PINGS[i].t0 > PINGS[i].maxR / PINGS[i].v + 7) PINGS.splice(i, 1);
    if (SON.announceAt > 0 && S.t >= SON.announceAt) { SON.announceAt = -1; sound.contact(); }
    if (SON.contact && S.t >= SON.contact.seen) SON.contact.shown = SON.contact.range;
    if (PH.pendingAt > 0 && S.t >= PH.pendingAt && PH.st === "dormant") { PH.pendingAt = -1; if (S.w[4] > 0.6) startEncounter(); }
    if (SON.blips.length && S.t - SON.blips[0].t0 > 7) SON.blips.shift();
    updateEncounter(dt);
    let st;
    if (PH.st === "enc") st = "Tracking · classifying";
    else if (SON.contact && SON.contact.shown) st = `Unknown contact · ${SON.contact.shown} m`;
    else if (SON.cd > 0) st = "Pinging…";
    else if (S.t - SON.lastPingT < 5 && SON.echoes) st = `${SON.echoes} return${SON.echoes > 1 ? "s" : ""} classified`;
    else st = isTouch ? "Tap to ping" : "Ready · press S";
    if (st !== SON.stat) { SON.stat = st; const el = R("sonStat"); if (el) el.textContent = st; }
  }
  // the instrument: a living sonar scope inside the control
  let scopeCtx = null;
  function drawScope() {
    const cv = R("scope");
    if (!cv) return;
    const s = cv.clientWidth || 84, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(s * dpr)) { cv.width = cv.height = Math.round(s * dpr); scopeCtx = null; }
    const c = scopeCtx || (scopeCtx = cv.getContext("2d"));
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, s, s);
    const cx = s / 2, cy = s / 2, r = s / 2 - 4;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(8,36,36,0.94)");
    g.addColorStop(1, "rgba(2,10,14,0.94)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, r, 0, TAU);
    c.fill();
    c.strokeStyle = "rgba(120,255,210,0.16)";
    c.lineWidth = 1;
    for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(cx, cy, (r * k) / 3, 0, TAU); c.stroke(); }
    c.beginPath();
    c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.moveTo(cx, cy - r); c.lineTo(cx, cy + r);
    c.stroke();
    const sa = S.t * 1.8;
    for (let k = 0; k < 16; k++) {
      c.fillStyle = `rgba(90,255,190,${0.13 * (1 - k / 16)})`;
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, r, sa - (k + 1) * 0.055, sa - k * 0.055);
      c.closePath();
      c.fill();
    }
    c.strokeStyle = "rgba(160,255,220,0.7)";
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(sa) * r, cy + Math.sin(sa) * r);
    c.stroke();
    const scale = Math.hypot(W, H) * 0.55;
    for (const p of PINGS) {
      const rr = (((S.t - p.t0) * p.v) / scale) * r;
      if (rr > r) continue;
      c.strokeStyle = `rgba(200,255,235,${0.8 * (1 - rr / r)})`;
      c.beginPath();
      c.arc(cx, cy, rr, 0, TAU);
      c.stroke();
    }
    for (const b of SON.blips) {
      const age = S.t - b.t0;
      const sweep = Math.exp(-Math.abs(angDiff(sa, b.a)) * 5) * 0.6;
      const al = Math.exp(-age * 0.45) * (0.5 + sweep);
      c.fillStyle = `rgba(${b.col},${Math.min(1, al)})`;
      c.beginPath();
      c.arc(cx + Math.cos(b.a) * b.r * r, cy + Math.sin(b.a) * b.r * r, 1.7, 0, TAU);
      c.fill();
    }
    const C = SON.contact;
    if (C && C.shown) {
      const rr = clamp(C.shown / 470, 0.15, 0.98) * r, pulse = 0.5 + 0.5 * Math.sin(S.t * 6);
      c.fillStyle = `rgba(${ECHO.unk},${0.6 + 0.4 * pulse})`;
      c.beginPath();
      c.arc(cx + Math.cos(C.bear) * rr, cy + Math.sin(C.bear) * rr, 2.6 + pulse * 1.4, 0, TAU);
      c.fill();
    }
    if (SON.cd > 0) {
      c.strokeStyle = "rgba(120,255,210,0.85)";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(cx, cy, r + 1.5, -Math.PI / 2, -Math.PI / 2 + (1 - SON.cd / 1.25) * TAU);
      c.stroke();
    }
    c.fillStyle = "rgba(210,255,240,0.9)";
    c.beginPath();
    c.arc(cx, cy, 1.8, 0, TAU);
    c.fill();
  }

  /* ═══════════════ specimen focus (hover a card → reticle locks on) ═══════════════ */
  const REG = {
    aequorea: () => JEL, ctenophore: () => COMB, hatchetfish: () => HAT, firefly: () => FFS,
    angler: () => [ANG], atolla: () => ATL, loosejaw: () => LJ, cucumber: () => CUC, snailfish: () => [SNAIL],
  };
  const ACC = { 1: "127,240,255", 2: "163,184,255", 3: "107,151,255", 4: "207,218,255", 0: "127,240,255" };
  let focusPos = null;
  function focusLight(x, y) {
    if (!focusPos) return 0;
    const d = Math.hypot(x - focusPos.x, y - focusPos.y), r = focusPos.r * 3;
    return d < r ? (1 - d / r) * 0.8 * focusPos.a : 0;
  }
  function setFocus(key, el) {
    if (!key) { S.focus = null; return; }
    S.focus = { key, el, t0: S.t, ent: null, idx: -1, vp: null };
  }
  function onScreen(x, y, m = 30) { return x > m && x < W - m && y > m && y < H - m; }
  function resolveFocus() {
    focusPos = null;
    const f = S.focus;
    if (!f || !f.el) return null;
    const r = f.el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return null;
    const narrow = W < 760;
    const leftCard = r.left + r.width / 2 < W / 2;
    const want = narrow
      ? { x: W * 0.5, y: r.top > H * 0.42 ? clamp(r.top * 0.5, H * 0.15, H * 0.45) : clamp((r.bottom + H) / 2, H * 0.55, H * 0.88) }
      : { x: leftCard ? W * 0.68 : W * 0.32, y: clamp(r.top + r.height * 0.42, H * 0.22, H * 0.78) };
    let x, y, fr = 34 * SZ;
    if (f.key === "noctiluca") {
      if (!f.vp) f.vp = { x: want.x, y: want.y };
      f.vp.y += (want.y - f.vp.y) * 0.05;
      const th = S.t * 3.2;
      const sx = f.vp.x + Math.cos(th) * 38 * SZ, sy = f.vp.y + Math.sin(th) * 38 * SZ;
      exciteAt(sx, sy, 34 * SZ, 0.95);
      if (Math.random() < 0.5) spark(sx, sy, rand(-30, 30), rand(-30, 30), rand(0.5, 1), rand(6, 12) * SZ, SP.cyan);
      x = f.vp.x; y = f.vp.y; fr = 56 * SZ;
    } else if (f.key === "lanternfish") {
      if (f.idx < 0 || !onScreen(bo.x[f.idx], bo.y[f.idx])) {
        let best = 0, bd = 1e9;
        for (let i = 0; i < BN; i++) {
          const d = Math.hypot(bo.x[i] - want.x, bo.y[i] - want.y);
          if (d < bd) { bd = d; best = i; }
        }
        f.idx = best;
      }
      x = bo.x[f.idx]; y = bo.y[f.idx]; fr = 22 * SZ;
    } else if (f.key === "snow") {
      if (f.idx < 0 || !onScreen(mo.x[f.idx], mo.y[f.idx], 60)) {
        let best = -1, bd = 1e9;
        for (let i = 0; i < MN; i++) {
          if (!mo.lum[i]) continue;
          const d = Math.hypot(mo.x[i] - want.x, mo.y[i] - want.y);
          if (d < bd) { bd = d; best = i; }
        }
        if (best < 0) return null;
        if (bd > 260) { mo.x[best] = want.x; mo.y[best] = want.y; }
        f.idx = best;
      }
      x = mo.x[f.idx]; y = mo.y[f.idx]; fr = 18 * SZ;
    } else {
      const list = REG[f.key] ? REG[f.key]() : null;
      if (!list || !list.length) return null;
      if (!f.ent || !onScreen(f.ent.x, f.ent.y)) {
        let best = list[0], bd = 1e9;
        for (const e of list) {
          const d = Math.hypot(e.x - want.x, e.y - want.y) + (onScreen(e.x, e.y) ? 0 : 5000);
          if (d < bd) { bd = d; best = e; }
        }
        if (!onScreen(best.x, best.y)) {
          best.x = want.x; best.y = want.y;
          if (best.vx !== undefined) { best.vx *= 0.2; best.vy *= 0.2; }
        }
        f.ent = best;
      }
      x = f.ent.x; y = f.ent.y; fr = f.ent.fr || 34 * SZ;
      if (f.key === "aequorea") y -= f.ent.r * 0.4;
      if (f.key === "angler") { x = ANG.x + ANG.s * 0.05 * ANG.fx; y = ANG.y - ANG.s * 0.1; }
    }
    const a = smooth(0, 0.5, S.t - f.t0);
    focusPos = { x, y, r: fr, a, rect: r, narrow };
    LIGHTS.push({ x, y, r: fr * 3.2, i: 0.7 * a });
    return focusPos;
  }
  function drawFocus() {
    const fp = focusPos;
    if (!fp || !S.focus) return;
    const { x, y, r: fr, a, rect } = fp, col = ACC[S.zone] || ACC[1];
    const rr = fr * (1.7 - 0.6 * a) + 6;
    NRM();
    ctx.globalAlpha = a;
    ctx.strokeStyle = `rgba(${col},0.9)`;
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const ang = k * (Math.PI / 2) + S.t * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, rr, ang - 0.3, ang + 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(ang + Math.PI / 4) * (rr + 4), y + Math.sin(ang + Math.PI / 4) * (rr + 4));
      ctx.lineTo(x + Math.cos(ang + Math.PI / 4) * (rr + 11), y + Math.sin(ang + Math.PI / 4) * (rr + 11));
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(${col},0.35)`;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(x, y, rr * 1.45, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    // leader line from card to specimen
    let sx, sy;
    if (fp.narrow) {
      sx = clamp(x, rect.left + 24, rect.right - 24);
      sy = y < rect.top ? rect.top - 8 : rect.bottom + 8;
    } else {
      sx = x > rect.right ? rect.right + 10 : rect.left - 10;
      sy = rect.top + 44;
    }
    const dx = x - sx, dy = y - sy, d = Math.hypot(dx, dy) + 0.01;
    const endX = x - (dx / d) * (rr * 1.45), endY = y - (dy / d) * (rr * 1.45);
    const prog = smooth(0.05, 0.6, S.t - S.focus.t0);
    const mx = fp.narrow ? sx : sx + (endX - sx) * 0.3, my = sy;
    ctx.strokeStyle = `rgba(${col},0.55)`;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    const seg1 = Math.hypot(mx - sx, my - sy), seg2 = Math.hypot(endX - mx, endY - my), tot = seg1 + seg2 || 1;
    const drawn = prog * tot;
    if (drawn <= seg1) ctx.lineTo(sx + (mx - sx) * (drawn / (seg1 || 1)), my);
    else {
      ctx.lineTo(mx, my);
      const f = (drawn - seg1) / (seg2 || 1);
      ctx.lineTo(mx + (endX - mx) * f, my + (endY - my) * f);
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(${col},0.9)`;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.2, 0, TAU);
    ctx.fill();
    ctx.font = `400 ${W < 760 ? 8.5 : 9.5}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
    ctx.fillStyle = `rgba(${col},${0.85 * prog})`;
    ctx.textAlign = x > W * 0.72 ? "right" : "left";
    const tx = x > W * 0.72 ? x - rr - 14 : x + rr + 14;
    ctx.fillText(`LOCK · ${Math.round(S.depth).toLocaleString("en-US")} M`, tx, y - rr * 0.6);
    ctx.fillStyle = `rgba(220,236,255,${0.5 * prog})`;
    ctx.fillText(`X ${String(Math.round(x)).padStart(4, "0")}  Y ${String(Math.round(y)).padStart(4, "0")}`, tx, y - rr * 0.6 + 14);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  // crossing a zone boundary: a luminous layer sweeps past in the direction of travel
  const CROSS_LABEL = ["", "0 M — THE SUNLIT SEA", "200 M — THE TWILIGHT ZONE", "1,000 M — THE MIDNIGHT ZONE", "4,000 M — THE ABYSS"];
  function drawCrossing() {
    const C = S.cross;
    if (!C) return;
    const p = (S.t - C.t0) / 2.6;
    if (p >= 1) { S.cross = null; return; }
    const e = 1 - Math.pow(1 - p, 3), al = Math.sin(p * Math.PI);
    const y = C.down ? lerp(H * 0.86, H * 0.14, e) : lerp(H * 0.14, H * 0.86, e);
    const col = ACC[C.z] || ACC[1];
    ADD();
    const band = ctx.createLinearGradient(0, y - 70, 0, y + 70);
    band.addColorStop(0, `rgba(${col},0)`);
    band.addColorStop(0.5, `rgba(${col},${0.06 * al})`);
    band.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = band;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, y - 70, W, 140);
    const lg = ctx.createLinearGradient(0, 0, W, 0);
    lg.addColorStop(0, `rgba(${col},0)`);
    lg.addColorStop(0.5, `rgba(${col},${0.75 * al})`);
    lg.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = lg;
    const half = W * 0.5 * smooth(0, 0.35, p);
    ctx.fillRect(W / 2 - half, y - 0.5, half * 2, 1);
    NRM();
    ctx.font = `400 ${W < 760 ? 9 : 10}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
    ctx.fillStyle = `rgba(${col},${0.9 * al})`;
    ctx.textAlign = "center";
    const label = CROSS_LABEL[C.z] || "";
    const spaced = label.split("").join(String.fromCharCode(8202));
    ctx.fillText(spaced, W / 2, y - 12);
    ctx.textAlign = "left";
  }

  /* ═══════════════ input ═══════════════ */
  // Buttons & drawers swallow input. Cards don't on desktop (you can hold / click "through" them),
  // but on touch a tap on a card means "locate this specimen", so it doesn't also pulse the water.
  const isUI = (el) => !!(el && el.closest && el.closest(isTouch ? "button,a,[data-ui],.nx-log,[data-card]" : "button,a,[data-ui],.nx-log"));
  function onMove(e) {
    P.x = e.clientX;
    P.y = e.clientY;
    P.active = true;
    P.lastMove = S.t;
    if (P.down) P.moved = Math.max(P.moved, Math.hypot(P.x - P.downX, P.y - P.downY));
  }
  function onTouchMove(e) {
    const t = e.touches && e.touches[0];
    if (!t) return;
    P.x = t.clientX;
    P.y = t.clientY;
    P.active = true;
    P.lastMove = S.t;
    if (P.down) P.moved = Math.max(P.moved, Math.hypot(P.x - P.downX, P.y - P.downY));
  }
  function onDown(e) {
    if (e.button > 0 || isUI(e.target)) return;
    P.down = true;
    P.downT = S.t;
    P.downX = P.x = e.clientX;
    P.downY = P.y = e.clientY;
    P.px = P.x; P.py = P.y;
    P.moved = 0;
    P.active = true;
    P.lastMove = S.t;
  }
  function onUp() {
    if (!P.down) return;
    P.down = false;
    const dur = S.t - P.downT;
    if (P.hold > 0.12) alarm(P.x, P.y, P.hold);
    else if (dur < 0.45 && P.moved < 14) click(P.x, P.y);
    P.hold = 0;
  }
  function onCancel() { P.down = false; P.hold = 0; }
  function onOver(e) {
    const h = !!(e.target && e.target.closest && e.target.closest("button,a,[data-hover]"));
    if (h !== P.hover) {
      P.hover = h;
      const c = R("cur");
      if (c) c.classList.toggle("hover", h);
    }
  }
  function onLeave() { if (!isTouch) P.active = false; }
  function click(x, y) {
    const z = S.zone;
    if (z <= 1) {
      if (y > S.hz) addWave(x, y);
      else { titleBlast(x, y); ripple(x, y, 260 * SZ, "190,235,255", 1.3); }
      sound.chord(z === 0 ? 523.25 : 587.33);
    } else if (z === 2) {
      startle(x, y);
      if (LL.on) addWave(x, y); // in the dark, a pulse through the plankton
    }
    else if (z === 3) {
      let hit = false;
      for (const t of ATL) if (Math.hypot(t.x - x, t.y - y) < t.r * 2.4) { triggerAtolla(t); hit = true; }
      if (!hit) alarm(x, y, 0.3);
    } else {
      S.lampFlare = 1;
      sound.ping();
      ripple(x, y, 200 * SZ, "210,225,255", 1.6);
    }
  }
  function cancelScrollAnim() {
    if (S.scrollAnim) { cancelAnimationFrame(S.scrollAnim); S.scrollAnim = 0; }
  }
  function scrollToY(y, dur) {
    cancelScrollAnim();
    const st = getY(), d = y - st;
    if (Math.abs(d) < 2) return;
    dur = dur || clamp((Math.abs(d) / H) * 380, 900, 4200);
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setY(st + d * e);
      S.scrollAnim = p < 1 ? requestAnimationFrame(step) : 0;
    };
    S.scrollAnim = requestAnimationFrame(step);
  }
  function goZone(k) {
    measure();
    if (k === "ll") return scrollToY(Math.min(S.maxScroll, S.llTop + S.llH * 0.07 - H * 0.5));
    if (k <= 0) return scrollToY(0);
    if (k >= 5) return scrollToY(S.maxScroll);
    scrollToY(Math.min(S.maxScroll, S.tops[k] + H * 0.3));
  }
  function onKey(e) {
    cancelScrollAnim();
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (/^[0-5]$/.test(e.key)) goZone(+e.key);
    if ((e.key === "s" || e.key === "S") && !e.metaKey && !e.ctrlKey) sonarPing(true);
    if (e.key === "Escape" && PH.st === "enc") endEncounter(true);
    if (e.key === "Escape" && WH.st === "pass") whaleEnd(true);
  }

  /* ═══════════════ frame ═══════════════ */
  const BG = [[[8, 30, 52], [2, 11, 24]], [[8, 46, 72], [2, 16, 32]], [[13, 22, 68], [3, 7, 28]], [[4, 6, 18], [1, 1, 6]], [[2, 2, 9], [0, 0, 2]], [[9, 15, 48], [2, 5, 20]]];
  const BGS = [[0.5, 0], [1.5, 1], [2.45, 2], [LL_C0, 5], [2.92, 3], [3.5, 3], [4.5, 4]];
  let fc = 0, ft = 0;
  function rescale(sx, sy) {
    const arrs = [[mo.x, mo.y, MN], [dn.x, dn.y, DN], [bo.x, bo.y, BN], [cp.x, cp.y, CPN], [fd.x, fd.y, FN]];
    for (const list of [KR, PERI]) for (const e of list) { e.x *= sx; e.y *= sy; }
    for (const [ax, ay, n] of arrs) for (let i = 0; i < n; i++) { ax[i] *= sx; ay[i] *= sy; }
    for (const list of [JEL, COMB, HAT, FFS, ATL, LJ, CUC, GREN, [ANG, SNAIL, DUMBO]]) for (const e of list) { e.x *= sx; e.y *= sy; }
    DUMBO.tx *= sx;
    DUMBO.ty *= sy;
    for (const s of SIPH) for (let k = 0; k < s.n; k++) { s.x[k] *= sx; s.y[k] *= sy; }
  }
  function resize() {
    const ow = W, oh = H;
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    if (ow !== W || oh !== H) rescale(W / ow, H / oh);
    measure();
    if (S.titleReady && (ow !== W || Math.abs(oh - H) > 140)) layoutTitle(false);
  }

  function updateHUD() {
    const d = S.depth, h = S.hud;
    const ds = Math.round(d).toLocaleString("en-US");
    if (ds !== h.d) {
      h.d = ds;
      if (R("depth")) R("depth").textContent = ds;
      if (R("now")) R("now").textContent = ds + " m";
    }
    const pr = 1 + d / 10.06;
    const ps = (pr < 100 ? pr.toFixed(1) : Math.round(pr).toLocaleString("en-US")) + " atm";
    if (ps !== h.p) { h.p = ps; if (R("pres")) R("pres").textContent = ps; }
    const tc = interp([[0, 22], [100, 18], [200, 13.5], [500, 8], [1000, 4.5], [2000, 3], [4000, 1.8], [10935, 2.4]], d);
    const ts = tc.toFixed(1) + " °C";
    if (ts !== h.tt) { h.tt = ts; if (R("temp")) R("temp").textContent = ts; }
    let ls;
    if (d < 0.5) ls = "100 %";
    else if (d > 1000) ls = "none";
    else {
      const I = 100 * Math.pow(10, -d / 100);
      ls = I >= 0.01 ? (I >= 1 ? I.toFixed(1) : I.toFixed(2)) + " %" : "10" + sup(Math.floor(Math.log10(I))) + " %";
    }
    if (ls !== h.l) { h.l = ls; if (R("light")) R("light").textContent = ls; }
    const gp = gaugeP(S.sScroll);
    if (Math.abs(gp - (h.gp ?? -1)) > 0.0005) {
      h.gp = gp;
      if (R("fill")) R("fill").style.transform = `scaleY(${gp})`;
      if (R("gdot")) R("gdot").style.top = gp * 100 + "%";
      if (R("now")) R("now").style.top = gp * 100 + "%";
    }
    const moving = Math.abs(S.vScroll) > 25;
    if (moving !== S.moving) { S.moving = moving; if (R("gauge")) R("gauge").classList.toggle("moving", moving); }
  }
  function updateCursor(dt) {
    if (isTouch) return;
    const k = 1 - Math.exp(-dt * 16);
    P.rx += (P.x - P.rx) * k;
    P.ry += (P.y - P.ry) * k;
    const c = R("cur"), d = R("cdot"), ch = R("charge"), lb = R("clabel");
    if (c) { c.style.transform = `translate3d(${P.rx}px,${P.ry}px,0)`; c.style.opacity = P.active ? 1 : 0; }
    if (d) { d.style.transform = `translate3d(${P.x}px,${P.y}px,0)`; d.style.opacity = P.active ? 1 : 0; }
    if (ch) ch.style.strokeDashoffset = String(113.1 * (1 - P.hold));
    const lab = LL.on ? "stir" : CURSOR_LABEL[S.zone] || "";
    if (lb && lab !== S.lastLabel) { S.lastLabel = lab; lb.textContent = lab; }
  }

  function frame(now) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (!(dt > 0)) dt = 0.001;
    if (dt > 0.05) dt = 0.05;
    S.t += dt;
    // adaptive resolution
    fc++;
    ft += dt;
    if (fc >= 90) {
      if (ft / fc > 1 / 42 && PINGS.length && !S.noLens) S.noLens = true; // first sacrifice: wavefront refraction
      else if (ft / fc > 1 / 42 && dprCap > 1) { dprCap = Math.max(1, dprCap - 0.25); resize(); }
      else measure(); // cheap safety net for late layout shifts (fonts, images, URL bars)
      fc = 0;
      ft = 0;
    }

    // scroll → depth (read layout before any DOM writes this frame)
    S.scrollY = getY();
    const ms = maxY();
    if (Math.abs(ms - S.maxScroll) > 1) { S.maxScroll = ms; S.cMax = cFrom(ms); }
    const prev = S.sScroll;
    S.sScroll += (S.scrollY - S.sScroll) * (1 - Math.exp(-dt * 9));
    if (Math.abs(S.scrollY - S.sScroll) < 0.05) S.sScroll = S.scrollY;
    S.dScroll = S.sScroll - prev;
    S.vScroll = lerp(S.vScroll, S.dScroll / dt, 1 - Math.exp(-dt * 10));
    S.c = cFrom(S.sScroll);
    const c = S.c, w = S.w;
    // crossfade windows per boundary; Twilight→Midnight is owned by The Last Light, so its window is a hairline
    const XB = [null, [0.7, 1.1], [1.7, 2.1], [2.985, 3.0], [3.7, 4.1]];
    for (let k = 0; k < 5; k++) {
      const fin = k === 0 ? 1 : smooth(XB[k][0], XB[k][1], c);
      const fout = k === 4 ? 1 : 1 - smooth(XB[k + 1][0], XB[k + 1][1], c);
      w[k] = fin * fout;
    }
    // ── The Last Light: scroll progress q through its section drives the hand-over ──
    LL.q = S.llH > 1 ? (S.sScroll + H * 0.5 - S.llTop) / S.llH : -9;
    LL.w = smooth(-0.14, 0.02, LL.q) * (1 - smooth(0.97, 1.14, LL.q));
    if (WH.st === "pass") LL.w = Math.max(LL.w, 1);
    LL.amb = LL.q < 0 ? 1 : LL.q > 1 ? 0 : llAmbient(LL.q);
    if (LL.q >= 0 && LL.q < 1) {
      w[0] = w[1] = w[4] = 0;
      w[2] = 1 - smooth(0.5, 0.98, LL.q);
      w[3] = smooth(0.78, 1, LL.q);
    }
    S.sun = LL.q < 0 ? 1 : LL.amb; // how much daylight silhouettes the twilight crowd
    const llOn = LL.w > 0.5;
    if (llOn !== LL.on) { LL.on = llOn; onLL && onLL(llOn); }
    S.depth = depthFrom(c);
    let zi = 0;
    for (let k = 1; k < 5; k++) if (w[k] > w[zi]) zi = k;
    if (zi !== S.zone) {
      const pz = S.zone;
      S.zone = zi;
      onZone && onZone(zi);
      if (pz >= 0 && S.t > 2.5 && zi > 0 && !LL.on) { S.cross = { t0: S.t, z: zi, down: zi > pz }; sound.ping(); }
    }
    S.hz = H * 0.62 - S.sScroll;
    if (S.c > S.cMax - 0.06 && S.cMax > 4.2) log("floor");

    // intro sequence
    if (S.burst < 0 && S.titleReady && S.t > 0.95) { S.burst = S.t; burstTitle(); sound.chord(392); }
    S.intro = S.burst < 0 ? 0 : smooth(S.burst + 0.1, S.burst + 2.4, S.t);
    if (!S.readySent && S.burst >= 0 && S.t - S.burst > 1.0) { S.readySent = true; onReady && onReady(); }

    // pointer
    const pvx = (P.x - P.px) / dt, pvy = (P.y - P.py) / dt;
    P.vx = lerp(P.vx, pvx, 0.5);
    P.vy = lerp(P.vy, pvy, 0.5);
    P.speed = Math.hypot(P.vx, P.vy);
    P.present = isTouch ? P.down || S.t - P.lastMove < 0.35 : P.active;
    const idle = isTouch ? !P.down && S.t - P.lastMove > 2.5 : !P.active || S.t - P.lastMove > 9;
    if (idle) {
      const gx = W * (0.5 + 0.3 * Math.sin(S.t * 0.23)), gy = H * (0.55 + 0.22 * Math.sin(S.t * 0.31 + 1));
      P.ex += (gx - P.ex) * (1 - Math.exp(-dt * 1.5));
      P.ey += (gy - P.ey) * (1 - Math.exp(-dt * 1.5));
    } else {
      P.ex += (P.x - P.ex) * (1 - Math.exp(-dt * 12));
      P.ey += (P.y - P.ey) * (1 - Math.exp(-dt * 12));
    }
    if (P.down && S.zone === 3 && P.moved < 14 && S.t - P.downT > 0.2) P.hold = Math.min(1, P.hold + dt / 1.35);
    else if (!P.down) P.hold = Math.max(0, P.hold - dt * 3);
    S.lampFlare *= Math.exp(-2.2 * dt);
    S.flash *= Math.exp(-2.6 * dt);
    S.shake *= Math.exp(-7 * dt);
    if (flashEl) {
      const fo = S.flash > 0.01 ? S.flash.toFixed(3) : "0";
      if (fo !== S.lastFlash) { S.lastFlash = fo; flashEl.style.opacity = fo; }
    }

    // parallax DOM
    for (const p of S.pars) {
      const rel = p.mid - (S.sScroll + H / 2);
      if (Math.abs(rel) > H * 2) continue;
      const y = rel * p.f;
      p.el._py = y;
      p.el.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    }

    updateHUD();
    updateCursor(dt);
    if (sound) sound.update(clamp(S.depth / 10935), w);

    // ── update ──
    LIGHTS.length = 0;
    const wPl = w[1] + w[0] * smooth(0, H * 0.3, S.sScroll);
    pruneWaves();
    updateMotes(dt);
    updateSparks(dt);
    // spontaneous flashes: unseen ostracods, krill and jellies signalling in the dark
    const flashRate = w[2] * 0.6 + w[3] * 2.2 + w[4] * 0.9;
    if (Math.random() < dt * flashRate) {
      const fx = rand(W * 0.05, W * 0.95), fy = rand(H * 0.1, H * 0.9), n = 3 + ((Math.random() * 7) | 0);
      const spr = w[4] > 0.5 ? (Math.random() < 0.5 ? SP.aqua : SP.blue) : Math.random() < 0.8 ? SP.blue : SP.cyan;
      const far = rand(0.4, 1);
      for (let k = 0; k < n; k++) spark(fx + rand(-14, 14), fy + rand(-14, 14), rand(-16, 16), rand(-16, 16), rand(0.5, 1.6), rand(4, 11) * SZ * far, spr);
    }
    if (w[0] > 0.001) { updateTitle(dt); updateSurf(dt); }
    if (wPl > 0.001) {
      updatePlankton(dt, wPl);
      JEL.forEach((j) => updateJelly(j, dt));
      COMB.forEach((c2) => updateComb(c2, dt));
    }
    if (w[2] > 0.001) {
      updateBoids(dt);
      HAT.forEach((h) => updateHatchet(h, dt));
      FFS.forEach((q) => updateSquid(q, dt));
    }
    if (LL.w > 0.001 || WH.st === "pass") updateLL(dt);
    else if (LL.dataLL) { LL.dataLL = ""; root.dataset.ll = ""; }
    if (w[3] > 0.001 || GS.on || ALARMS.length) {
      if (P.present && !isTouch) LIGHTS.push({ x: P.x, y: P.y, r: 150 * SZ, i: 0.45 });
      LIGHTS.push({ x: ANG.ex || 0, y: ANG.ey || 0, r: ANG.s * 1.2, i: 0.55 * ANG.dim, tag: "angler" });
      updateAlarms(dt);
      ATL.forEach((t) => updateAtolla(t, dt));
      LJ.forEach((l) => updateLoosejaw(l, dt));
      SIPH.forEach((s) => updateSiph(s, dt));
      updateCopepods(dt);
      updateAngler(dt);
      updateGiant(dt);
    }
    updateSonar(dt);
    if (w[4] > 0.001) {
      updateLamp();
      CUC.forEach((c2) => updateCucumber(c2, dt));
      updateSnail(dt);
      updateGren(dt);
      updateDumbo(dt);
    } else LAMP.on = 0;
    resolveFocus();

    // ── draw ──
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (S.shake > 0.3) ctx.translate(rand(-S.shake, S.shake), rand(-S.shake, S.shake));
    NRM();
    // palette stops along the descent (c), with The Last Light darkening from twilight to midnight
    let si = 0;
    while (si < BGS.length - 2 && c > BGS[si + 1][0]) si++;
    const [c0, i0] = BGS[si], [c1, i1] = BGS[si + 1], bt = smooth(0, 1, clamp((c - c0) / (c1 - c0)));
    const top = mix3(BG[i0][0], BG[i1][0], bt), bot = mix3(BG[i0][1], BG[i1][1], bt);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `rgb(${top[0] | 0},${top[1] | 0},${top[2] | 0})`);
    bg.addColorStop(1, `rgb(${bot[0] | 0},${bot[1] | 0},${bot[2] | 0})`);
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    if (w[0] > 0.001 && S.hz > -80) drawSurface();
    const clipped = S.hz > 0;
    if (clipped) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20, S.hz, W + 40, H - S.hz + 20);
      ctx.clip();
    }
    drawSurfaceFromBelow();
    const llFree = 1 - LL.w; // The Last Light takes over sky, shafts and haze
    const rayA = clamp(1 - S.depth / 800) * (w[0] * smooth(0, H * 0.3, S.sScroll) + w[1] + w[2] * 0.55) * llFree;
    drawRays(rayA, w[2] > w[1] ? "110,150,255" : "150,215,255", Math.max(0, S.hz));
    if (LL.w > 0.001) drawLLAtmos(LL.w);
    if (w[2] * llFree > 0.01) {
      ADD();
      const dg = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      dg.addColorStop(0, `rgba(70,110,230,${0.16 * w[2] * llFree})`);
      dg.addColorStop(1, "rgba(70,110,230,0)");
      ctx.fillStyle = dg;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, W, H * 0.5);
      NRM();
    }
    drawMotes();
    if (wPl > 0.001) {
      drawPlankton(wPl);
      COMB.forEach((c2) => drawComb(c2, wPl));
      JEL.forEach((j) => drawJelly(j, wPl));
    }
    if (w[2] > 0.001) {
      HAT.forEach((h) => drawHatchet(h, w[2]));
      drawBoids(w[2]);
      FFS.forEach((q) => drawSquid(q, w[2]));
    }
    if (LL.w > 0.001) drawLLLife(LL.w);
    if (w[3] > 0.001 || GS.on) {
      const a3 = Math.max(w[3], GS.on ? 0.001 : 0);
      SIPH.forEach((s) => drawSiph(s, a3));
      const beams = w[3] > 0.01 ? LJ.map(beamOf) : [];
      drawCopepods(a3, beams);
      drawGiant(Math.max(w[3], 0.3));
      ATL.forEach((t) => drawAtolla(t, a3));
      LJ.forEach((l) => drawLoosejaw(l, a3));
      drawAngler(a3);
      if (P.present && !isTouch) {
        ADD();
        G(SP.cyanS, P.x, P.y, 150 * SZ, 0.07 * w[3]);
        G(SP.cyan, P.x, P.y, 40 * SZ, 0.22 * w[3]);
        NRM();
      }
    }
    if (ALARMS.length) drawAlarms(1);
    if (w[4] > 0.001) {
      const a4 = w[4], wallA = a4 * (1 - 0.7 * smooth(4.6, Math.max(4.65, S.cMax), c));
      drawRidge(a4);
      drawTrench(wallA);
      drawVents(wallA, dt);
      drawWhale(wallA);
      drawLamp(a4);
      drawSnail(a4);
      drawGren(a4);
      drawDumbo(a4);
      CUC.forEach((c2) => drawCucumber(c2, a4));
      drawFloor(a4, dt);
      drawPhantom(a4);
    }
    drawSparks();
    drawRipples(dt);
    if (PINGS.length) {
      lensPass(); // refract the finished scene through each wavefront…
      drawPings(); // …then lay the wave itself over the seams
    }
    if (w[4] > 0.001) {
      drawSonarLabels();
      drawContactMarker();
    }
    if (clipped) ctx.restore();
    if (w[0] > 0.001) drawTitle();
    drawCrossing();
    drawCharge(1);
    drawFocus();
    NRM();
    if (w[4] > 0.02) drawScope();
  }

  /* ═══════════════ boot ═══════════════ */
  resize();
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
  if (ro && root) ro.observe(root);
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onCancel, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("wheel", cancelScrollAnim, { passive: true });
  window.addEventListener("touchstart", cancelScrollAnim, { passive: true });
  window.addEventListener("keydown", onKey);
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  document.documentElement.addEventListener("mouseleave", onLeave);
  const fontLoad =
    document.fonts && document.fonts.load
      ? Promise.race([
          Promise.all([document.fonts.load('400 100px "Cormorant Garamond"'), document.fonts.load('400 12px "JetBrains Mono"')]),
          new Promise((r) => setTimeout(r, 1500)),
        ])
      : Promise.resolve();
  fontLoad
    .catch(() => {})
    .then(() => {
      if (!alive) return;
      layoutTitle(true);
      S.titleReady = true;
      measure();
    });
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      cancelScrollAnim();
      ro && ro.disconnect();
      if (SC) SC.removeEventListener("wheel", cancelScrollAnim);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("wheel", cancelScrollAnim);
      window.removeEventListener("touchstart", cancelScrollAnim);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    },
    setFocus,
    goZone,
    ping: () => sonarPing(false),
    measure,
  };
}

/* ═════════════════════════════ REACT ═════════════════════════════ */

// Word-by-word masked reveal. Wrap words in *asterisks* for italic accent.
function Split({ text }) {
  return text.split(" ").map((w, i) => {
    const em = /^\*.*\*[,.]?$/.test(w);
    const clean = w.replace(/\*/g, "");
    return (
      <span className="w" key={i}>
        <span style={{ "--i": i }}>{em ? <em>{clean}</em> : clean}</span>
        {"\u00A0"}
      </span>
    );
  });
}

const TITLES = ["The Sunlit Sea, *After* *Dark*", "The *Twilight* Zone", "The *Midnight* Zone", "The *Abyss*"];

function Card({ c, i, z, side, focused, touch, onFocus, onBlur }) {
  const ref = useRef(null);
  const enter = () => onFocus(c.key, ref.current);
  // toggle imperatively: a React-controlled className would wipe the observer's "is-in" class
  useEffect(() => {
    ref.current && ref.current.classList.toggle("focus", !!focused);
  }, [focused]);
  return (
    <article
      ref={ref}
      className={`nx-card ${side}`}
      data-r=""
      data-card=""
      tabIndex={0}
      aria-label={`${c.name}, ${c.latin}`}
      onMouseEnter={touch ? undefined : enter}
      onMouseLeave={touch ? undefined : onBlur}
      onFocus={touch ? undefined : enter}
      onBlur={touch ? undefined : onBlur}
      onClick={touch ? () => (focused ? onBlur() : enter()) : undefined}
    >
      <div className="nx-idx">
        <span>
          {z.num} · 0{i + 1} — Specimen
        </span>
        <span>{touch ? "◎ Locating" : "◎ Locating specimen"}</span>
      </div>
      <h3>{c.name}</h3>
      <div className="nx-latin">{c.latin}</div>
      <div className="nx-facts">
        <div>
          Depth<b>{c.depth}</b>
        </div>
        <div>
          Light
          <b>
            <span className="nx-chip" style={{ background: c.color, boxShadow: `0 0 10px ${c.color}` }} />
            {c.light}
          </b>
        </div>
      </div>
      <p>{c.text}</p>
      <p className="nx-aside nx-fade">{c.aside}</p>
      {touch && (
        <div className="nx-idx" style={{ marginTop: 16 }}>
          <span>{focused ? "Tap again to release" : "Tap to locate in the water"}</span>
        </div>
      )}
    </article>
  );
}

// THE LAST LIGHT — a long, quiet section. The canvas does the storytelling; these beats are
// pinned to scroll progress q (each sits at top: q × section height, centred on the viewport).
const LL_BEATS = [
  { q: 0.25, text: "Up here, a silhouette is a death sentence. Watch the shapes overhead dissolve as the light goes — and the lights they carry take over." },
  { q: 0.41, text: "Every hundred metres of water steals roughly nine-tenths of the light that is left.", sub: "Red goes first, then green. What remains is blue." },
  { q: 0.555, text: "The last light.", big: true },
  { q: 0.95, text: "From here down, every photon is made by something alive." },
];
function LastLight({ llRef }) {
  return (
    <section className="nx-sec nx-ll" ref={llRef} aria-labelledby="nx-ll-t" style={{ "--zc": "#8fa8ff" }}>
      <div className="nx-llb" style={{ top: "7%" }}>
        <div className="nx-llhead" data-r="">
          <div className="nx-zmeta">
            <span>Interlude</span>
            <span>750 → 1,150 m</span>
          </div>
          <h2 className="nx-h2" id="nx-ll-t">
            <Split text="The *Last* Light" />
          </h2>
          <p className="nx-intro">
            Sunlight doesn’t end at a line. It thins, metre by metre, until somewhere near a thousand metres the last of it is gone
            — and the creatures that hid from it become the only light there is. Keep descending, slowly.
          </p>
        </div>
      </div>
      {LL_BEATS.map((b, i) => (
        <div className="nx-llb" style={{ top: `${b.q * 100}%` }} key={i}>
          <div className={`nx-llbeat ${b.big ? "big" : ""}`} data-r="">
            <p>{b.text}</p>
            {b.sub && <small>{b.sub}</small>}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Nauticalus() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const flashRef = useRef(null);
  const secRefs = useRef([]);
  const markRefs = useRef([]);
  const engRef = useRef(null);
  const soundRef = useRef(null);
  const toastTimer = useRef(0);
  const lastToast = useRef(null);
  const refs = {
    depth: useRef(null), pres: useRef(null), temp: useRef(null), light: useRef(null),
    fill: useRef(null), gdot: useRef(null), now: useRef(null), gauge: useRef(null),
    cur: useRef(null), cdot: useRef(null), charge: useRef(null), clabel: useRef(null),
    scope: useRef(null), sonStat: useRef(null), capTop: useRef(null), capBot: useRef(null), photon: useRef(null),
  };
  const [zone, setZone] = useState(0);
  const [ready, setReady] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [found, setFound] = useState([]);
  const [toast, setToast] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [touch, setTouch] = useState(false);
  const [focusKey, setFocusKey] = useState(null);
  const [llOn, setLlOn] = useState(false);
  const llRef = useRef(null);

  useEffect(() => {
    setTouch(window.matchMedia("(hover: none), (pointer: coarse)").matches);
    soundRef.current = new Sound();
    const eng = createEngine({
      canvas: canvasRef.current,
      root: rootRef.current,
      flashEl: flashRef.current,
      getSections: () => secRefs.current,
      getLL: () => llRef.current,
      onLL: setLlOn,
      refs,
      marks: markRefs.current,
      sound: soundRef.current,
      onZone: setZone,
      onReady: () => setReady(true),
      onLog: (id) => {
        setFound((f) => (f.includes(id) ? f : [...f, id]));
        const item = LOG.find((l) => l.id === id);
        if (!item) return;
        lastToast.current = item;
        setToast(item);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 4800);
      },
    });
    engRef.current = eng;
    // safety: reveal UI even if the intro is skipped for any reason
    const safety = setTimeout(() => setReady(true), 4000);
    // don't keep humming in a background tab
    const onVis = () => {
      const s = soundRef.current;
      if (!s || !s.ac || !s.on) return;
      if (document.hidden) s.ac.suspend();
      else s.ac.resume();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearTimeout(safety);
      clearTimeout(toastTimer.current);
      eng.destroy();
      try {
        soundRef.current && soundRef.current.ac && soundRef.current.ac.close();
      } catch (e) {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll-triggered reveals
  useEffect(() => {
    const els = rootRef.current.querySelectorAll("[data-r]");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const toggleSound = useCallback(() => {
    const s = soundRef.current;
    if (!s) return;
    const next = !s.on;
    s.setOn(next);
    setSoundOn(next && !!s.ac);
    if (next) setTimeout(() => s.chord(523.25), 300);
  }, []);
  const go = useCallback((k) => engRef.current && engRef.current.goZone(k), []);
  const ping = useCallback(() => engRef.current && engRef.current.ping(), []);
  const onFocus = useCallback((key, el) => {
    engRef.current && engRef.current.setFocus(key, el);
    setFocusKey(key);
  }, []);
  const onBlur = useCallback(() => {
    engRef.current && engRef.current.setFocus(null);
    setFocusKey(null);
  }, []);

  const shownToast = toast || lastToast.current;
  const marks = [
    { k: 1, depth: 0, d: "0 m", n: "Sunlight" },
    { k: 2, depth: 200, d: "200 m", n: "Twilight" },
    { k: "ll", depth: 750, d: "750 m", n: "The Last Light", minor: true },
    { k: 3, depth: 1000, d: "1,000 m", n: "Midnight" },
    { k: 4, depth: 4000, d: "4,000 m", n: "Abyss" },
    { k: 5, depth: 10935, d: "10,935 m", n: "Challenger Deep" },
  ];
  const markOn = (k) => (k === "ll" ? llOn : !llOn && (zone === k || (k === 1 && zone === 0)));

  return (
    <div ref={rootRef} className={`nx ${ready ? "is-ready" : ""} ${touch ? "" : "has-cursor"}`} data-zone={zone}>
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="nx-canvas" aria-hidden="true" />
      <div className="nx-vignette" />
      <div className="nx-grain" />
      <div ref={flashRef} className="nx-flash" />
      <div className="nx-edge t" />
      <div className="nx-edge b" />

      {/* header */}
      <header className="nx-head">
        <button className="nx-logo" onClick={() => go(0)} aria-label="Nauticalus — return to the surface">
          <svg viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="10" fill="none" stroke="currentColor" strokeOpacity=".35" />
            <line x1="11" y1="1" x2="11" y2="14" stroke="currentColor" strokeOpacity=".6" />
            <circle className="pulse" cx="11" cy="17" r="2.6" fill="var(--accent)" />
          </svg>
          NAUTICALUS
        </button>
        <div className="nx-zlabel" aria-live="polite">
          <span key={llOn ? "ll" : zone}>
            <i>●</i>&nbsp;&nbsp;{llOn ? "II → III · The Last Light" : HUD_ZONE[zone]}
          </span>
        </div>
        <div className="nx-tools">
          <button className="nx-btn" onClick={() => setLogOpen((o) => !o)} aria-expanded={logOpen} data-hover="">
            <span className="t">Field log</span>
            <span className="nx-count">
              {found.length}/{LOG.length}
            </span>
          </button>
          <button className="nx-btn" onClick={toggleSound} aria-pressed={soundOn} data-hover="">
            <span className={`nx-bars ${soundOn ? "on" : ""}`} aria-hidden="true">
              <i /><i /><i /><i />
            </span>
            <span className="t">Sound {soundOn ? "on" : "off"}</span>
          </button>
        </div>
      </header>

      {/* depth gauge / navigation */}
      <nav className="nx-gauge" ref={refs.gauge} aria-label="Depth navigation">
        <div className="nx-track" />
        <div className="nx-ticks" />
        <div className="nx-fill" ref={refs.fill} />
        {marks.map((m, i) => (
          <button
            key={m.k}
            ref={(el) => (markRefs.current[i] = el)}
            className={`nx-mark ${markOn(m.k) ? "on" : ""} ${m.minor ? "minor" : ""}`}
            data-depth={m.depth}
            style={{ top: `${i * 20}%` }}
            onClick={() => go(m.k)}
            aria-label={`Descend to ${m.n}, ${m.d}`}
            data-hover=""
          >
            <span className="lbl">
              <b>{m.d}</b>
              <em>{m.n}</em>
            </span>
          </button>
        ))}
        <div className="nx-dot" ref={refs.gdot} />
        <div className="nx-now" ref={refs.now}>
          0 m
        </div>
      </nav>

      {/* depth readout */}
      <div className="nx-readout" aria-hidden="true">
        <div className="nx-depth">
          <span ref={refs.depth}>0</span>
          <small>M</small>
        </div>
        <div className="nx-stats">
          <div>
            Pressure<b ref={refs.pres}>1.0 atm</b>
          </div>
          <div>
            Temp<b ref={refs.temp}>22.0 °C</b>
          </div>
          <div className="opt">
            Sunlight<b ref={refs.light}>100 %</b>
          </div>
        </div>
      </div>

      {/* contextual hint */}
      <div className="nx-hint" aria-live="polite">
        <i />
        <span key={llOn ? "ll" : zone}>
          {llOn
            ? touch
              ? "Drag to stir the dark · keep descending"
              : "Move to stir the dark · keep descending"
            : zone === 0
            ? touch
              ? "Drag across the water · tap the sky · scroll to descend"
              : "Move across the water · click the sky · scroll to descend"
            : ZONES[zone - 1].hint[touch ? 1 : 0]}
        </span>
      </div>

      {/* custom cursor */}
      <div className="nx-cur" ref={refs.cur} aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <circle className="r1" cx="24" cy="24" r="18" />
          <circle className="r2" ref={refs.charge} cx="24" cy="24" r="18" />
        </svg>
        <b ref={refs.clabel}>stir</b>
      </div>
      <div className="nx-cdot" ref={refs.cdot} aria-hidden="true" />

      {/* sonar instrument — appears in the Abyss */}
      <div className="nx-sonar" aria-hidden={zone !== 4}>
        <button
          className="nx-sonar-btn"
          onClick={ping}
          tabIndex={zone === 4 ? 0 : -1}
          aria-label="Emit a sonar pulse (keyboard: S)"
          data-hover=""
        >
          <canvas ref={refs.scope} className="nx-scope" aria-hidden="true" />
        </button>
        <div className="nx-sonar-meta" aria-live="polite">
          <b>
            Sonar<kbd>S</kbd>
          </b>
          <span ref={refs.sonStat}>Ready</span>
        </div>
      </div>

      {/* The Last Light: how much of the surface sunlight still reaches us */}
      <div className="nx-photon" aria-hidden="true">
        <small>Surface sunlight reaching this depth</small>
        <b ref={refs.photon}>—</b>
      </div>

      {/* cinematic letterbox for the rare encounter */}
      <div className="nx-lb t" aria-hidden="true">
        <span ref={refs.capTop} />
      </div>
      <div className="nx-lb b" aria-live="polite">
        <p ref={refs.capBot} />
      </div>

      {/* discovery toast */}
      <div className={`nx-toast ${toast ? "show" : ""}`} role="status">
        {shownToast && (
          <>
            <small>
              <span>Field log · Zone {shownToast.zone}</span>
              <span>
                {found.length}/{LOG.length}
              </span>
            </small>
            <strong>{shownToast.title}</strong>
            <span>{shownToast.desc}</span>
          </>
        )}
      </div>

      {/* field log drawer */}
      <aside className={`nx-log ${logOpen ? "open" : ""}`} aria-hidden={!logOpen} data-ui="">
        <button className="nx-btn nx-close" onClick={() => setLogOpen(false)} data-hover="">
          Close ✕
        </button>
        <h4>Field log</h4>
        <p>
          {LOG.length} observations are waiting in the dark. Interact with the water and its inhabitants to record them — and in the
          Abyss, listen with sonar. One contact is very rarely seen.
        </p>
        <ol>
          {LOG.map((l) => {
            const got = found.includes(l.id);
            return (
              <li key={l.id} className={got ? "got" : "locked"}>
                <span className="z">{l.zone}</span>
                <strong>{got ? l.title : "— — —"}</strong>
                <span>{got ? l.desc : "Not yet observed."}</span>
              </li>
            );
          })}
        </ol>
      </aside>

      <main className="nx-main">
        {/* hero: the night surface */}
        <section className="nx-sec nx-hero" ref={(el) => (secRefs.current[0] = el)}>
          <h1 className="nx-sr">NAUTICALUS — Where the Ocean Makes Its Own Light</h1>
          <div className="nx-eyebrow">
            A descent through four depths<span className="dot"> · </span>
            <span className="rng">0 → 10,935 m</span>
          </div>
          <p className="nx-tag">
            <Split text="Where the ocean makes its own light" />
          </p>
          <button className="nx-cta" onClick={() => go(1)} aria-label="Begin the descent" data-hover="">
            <svg viewBox="0 0 104 104" aria-hidden="true">
              <defs>
                <path id="nxCirc" d="M52,52 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <circle className="ring" cx="52" cy="52" r="51" />
              <g className="spin">
                <text>
                  <textPath href="#nxCirc" textLength="236" lengthAdjust="spacing">
                    Begin the descent · Begin the descent ·
                  </textPath>
                </text>
              </g>
              <path className="arrow" d="M52 41 L52 61 M46 55 L52 61 L58 55" />
            </svg>
          </button>
        </section>

        {ZONES.map((z, zi) => (
          <React.Fragment key={z.num}>
          {zi === 2 && <LastLight llRef={llRef} />}
          <section
            className="nx-sec nx-zone"
            ref={(el) => (secRefs.current[zi + 1] = el)}
            style={{ "--zc": z.accent }}
            aria-labelledby={`nx-z${zi}`}
          >
            <header className="nx-zhead">
              <div className="nx-znum" data-par="0.22" aria-hidden="true">
                {z.num}
              </div>
              <div data-r="">
                <div className="nx-zmeta">
                  <span>Zone {z.num}</span>
                  <span>{z.layer}</span>
                  <span>{z.range}</span>
                </div>
              </div>
              <h2 className="nx-h2" id={`nx-z${zi}`} data-r="">
                <Split text={TITLES[zi]} />
              </h2>
              <p className="nx-intro" data-r="">
                {z.intro}
              </p>
              <div data-r="">
                <div className="nx-zhint">{z.hint[touch ? 1 : 0]}</div>
              </div>
            </header>

            {zi === 3 && (
              <div className="nx-sintro" data-r="">
                <div className="nx-idx">
                  <span>IV · 00 — Instrument</span>
                  <span>◉ Active sonar online</span>
                </div>
                <h3>
                  Sound, <em>not light</em>
                </h3>
                <p>
                  Light dies within metres down here; sound carries for kilometres. A single ping returns the shape of things no lamp
                  can reach — it is how the sea floor has been mapped at all. Emit a pulse and watch the darkness answer: rock, bone,
                  vent plumes and living things each echo differently.
                </p>
                <div className="nx-sstats">
                  <div>
                    <b>1,500</b>
                    <small>m/s — speed of sound in seawater</small>
                  </div>
                  <div>
                    <b>≈ ¼</b>
                    <small>of the sea floor mapped in detail</small>
                  </div>
                </div>
                <button className="nx-pingbtn" onClick={ping} data-hover="">
                  <i /> Emit a pulse {!touch && <kbd>S</kbd>}
                </button>
              </div>
            )}
            <Card c={z.cards[0]} i={0} z={z} side="left" focused={focusKey === z.cards[0].key} touch={touch} onFocus={onFocus} onBlur={onBlur} />
            <div className="nx-pull" data-r="">
              <blockquote>{z.pull.text}</blockquote>
              <p className="nx-fade">{z.pull.sub}</p>
              {z.pull.src && <cite className="nx-fade">{z.pull.src}</cite>}
            </div>
            <Card c={z.cards[1]} i={1} z={z} side="right" focused={focusKey === z.cards[1].key} touch={touch} onFocus={onFocus} onBlur={onBlur} />
            <Card c={z.cards[2]} i={2} z={z} side="left" focused={focusKey === z.cards[2].key} touch={touch} onFocus={onFocus} onBlur={onBlur} />

            {zi === 3 && (
              <div className="nx-finale" data-r="">
                <div className="nx-fmeta">10,935 m · Challenger Deep · Mariana Trench</div>
                <div className="nx-big">
                  3<i>in</i>4
                </div>
                <p className="nx-ftext">
                  Of the animals filmed drifting through the water column off California over seventeen years, about three in four
                  could make their own light. Bioluminescence has evolved independently dozens of times. On a planet lit by a single
                  star, the ocean learned to make its own.
                </p>
                <div className="nx-credits">Martini &amp; Haddock · Scientific Reports · 2017</div>
                <button className="nx-ascend" onClick={() => go(0)} data-hover="">
                  Ascend to the surface
                  <svg viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M6 11 L6 1 M1.5 5.5 L6 1 L10.5 5.5" />
                  </svg>
                </button>
                <div className="nx-credits">
                  Every creature, photon &amp; sound generated live · React · Canvas · Web Audio · Keys 0–5 jump depths
                </div>
              </div>
            )}
          </section>
          </React.Fragment>
        ))}
      </main>
    </div>
  );
}