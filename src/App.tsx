import { type CSSProperties, type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Check, Crosshair, Eye, Pause, Play, RefreshCw, RotateCcw, ShoppingBag, Sparkles, Volume2, VolumeX } from 'lucide-react';
import * as THREE from 'three';
import { addRooftopIdentity } from '@/lib/rooftop-art';
import { TouchControl } from '@/components/TouchControl';
import { FieldTraining } from '@/components/FieldTraining';
import { NavigationButton } from '@/components/NavigationButton';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { loadWardrobeStore, purchaseWardrobe, restoreWardrobeAccess, type WardrobeStoreState } from '@/lib/revenuecat';
import { useAmbientMusic } from '@/hooks/use-ambient-music';
import { flushGameEvents, trackGameEvent } from '@/lib/analytics';

import { clearSight, quietAccess } from '@/lib/combat';

const queryClient = new QueryClient();

type Screen = 'prologue' | 'cover' | 'briefing' | 'chapter' | 'game' | 'complete' | 'teaser' | 'failed';
type Keys = { w: boolean; a: boolean; s: boolean; d: boolean };
type TargetId = 'director' | 'courier' | 'ghost';
type DisguiseId = 'inspector' | 'courier' | 'technician';
type Difficulty = 'story' | 'agent';
type OutfitId = 'classic' | 'moonlight' | 'rose';

const outfits: Record<OutfitId, { name: string; access: string; hair: string; hairShine: string; jacket: string; jacketLight: string; scarf: string; boots: string }> = {
  classic: { name: 'Classic Bird', access: 'Free', hair: '#59457e', hairShine: '#8974bd', jacket: '#8297df', jacketLight: '#aebbf1', scarf: '#ff7f78', boots: '#323a55' },
  moonlight: { name: 'Moonlight', access: 'Agent Pass', hair: '#302755', hairShine: '#b28ce8', jacket: '#553a82', jacketLight: '#c19bf0', scarf: '#ffb36d', boots: '#211d3d' },
  rose: { name: 'Rose Signal', access: 'Agent Pass', hair: '#653a62', hairShine: '#e18bad', jacket: '#a34f75', jacketLight: '#f3a6bd', scarf: '#8ee2d3', boots: '#3a2848' },
};

const targets: Record<TargetId, { name: string; alias: string; risk: string; clue: string }> = {
  director: { name: 'Director Han', alias: 'The Smiling Man', risk: 'High protection', clue: 'Approved the missing-name protocol.' },
  courier: { name: 'Mira Sol', alias: 'Paper Crane', risk: 'Mobile target', clue: 'Carries Moth’s handwritten route.' },
  ghost: { name: 'Unknown 04', alias: 'The Fourth Voice', risk: 'Signal anomaly', clue: 'Uses a voice Kiri remembers from home.' },
};

const disguises: Record<DisguiseId, { name: string; perk: string; exposure: number }> = {
  inspector: { name: 'Safety Inspector', perk: 'Patrols notice you more slowly', exposure: 4 },
  courier: { name: 'Night Courier', perk: 'Sprint with less suspicion', exposure: 8 },
  technician: { name: 'Relay Technician', perk: 'Terminal access is easier', exposure: 6 },
};

const storyBeats = [
  {
    chapter: 'Before the silence',
    title: 'A city watched over by little lights',
    body: 'By day, Kiri Vale checks rooftop safety permits. By night, she is Kingfisher, a former Threadkeeper who knows how to disappear. Her brother Ren built Pip, the little guide at her shoulder. Six months ago, Ren followed a city mascot home—and never arrived.',
    speaker: 'Kiri “Kingfisher” Vale',
    quote: 'I promised I would bring him home. Pip still saves his seat.',
    portrait: 'portrait-kingfisher',
    scene: 'scene-dawn',
  },
  {
    chapter: 'The night the thread broke',
    title: 'Then the friendly voices changed',
    body: 'Tonight at 02:17, three more people vanished after receiving familiar voices through the city’s helper mascots. Echo intercepted the next broadcast. It speaks in Ren’s voice, using a phrase only Kiri should remember. Someone calling themselves Moth left a route to the source.',
    speaker: 'Echo Lin',
    quote: 'A familiar voice is not proof he is alive. Get the evidence first.',
    portrait: 'portrait-echo',
    scene: 'scene-blackout',
  },
  {
    chapter: 'Tonight / Sector 07',
    title: 'One relay is still awake',
    body: 'Sector 07’s relay holds three pieces of the broadcast key. Recover them before the next transmission, then disable the relay. Slip past its guards or fight through them. Stop tonight’s calls first. Find Ren second. Trust Moth only as far as the evidence leads.',
    speaker: 'Moth / unknown',
    quote: 'Do not follow his voice. Follow what they tried to erase.',
    portrait: 'portrait-moth',
    scene: 'scene-signal',
  },
];

function Prologue({ onComplete }: { onComplete: () => void }) {
  const [beat, setBeat] = useState(0);
  const story = storyBeats[beat];
  const next = () => beat === storyBeats.length - 1 ? onComplete() : setBeat((value) => value + 1);

  return (
    <main className={`prologue ${story.scene}`} data-testid="screen-prologue">
      <div className="prologue-stars" aria-hidden="true" />
      <div className="prologue-illustration" aria-hidden="true">
        <div className={`hero-portrait ${story.portrait}`}><span /></div>
        <div className="pip-orbit"><i className="pip-face" /></div>
        <div className="red-thread-line" />
        <svg className="identity-crane" viewBox="0 0 200 150"><path d="M18 35L91 79L160 17L128 91L184 110L110 105L80 137L84 94Z" fill="#ffe3c1"/><path d="M18 35L84 94L91 79L128 91L160 17M84 94L110 105" fill="none" stroke="#b589a7" strokeWidth="2"/><path d="M90 95Q120 170 189 135" fill="none" stroke="#ff798f" strokeWidth="3"/></svg>
      </div>
      <section className="prologue-panel">
        <div className="prologue-topline">
          <span>RED THREAD · THE VOICES WE KEEP</span>
          <button onClick={onComplete} data-testid="button-skip-story">Skip story</button>
        </div>
        <div className="story-count">0{beat + 1} <i /> 0{storyBeats.length}</div>
        <div className="eyebrow">{story.chapter}</div>
        <h1>{story.title}</h1>
        <p>{story.body}</p>
        <blockquote>
          “{story.quote}”
          <cite>{story.speaker}</cite>
        </blockquote>
        <div className="prologue-actions">
          <div className="story-dots" aria-label={`Story page ${beat + 1} of ${storyBeats.length}`}>
            {storyBeats.map((_, index) => <i key={index} className={index === beat ? 'active' : ''} />)}
          </div>
          <button className="primary-cta" onClick={next} data-testid="button-next-story">
            {beat === storyBeats.length - 1 ? 'View mission' : 'Continue'} <ChevronMark />
          </button>
        </div>
      </section>
    </main>
  );
}

function CoverScene({ onComplete }: { onComplete: (suspicion: number) => void }) {
  const [choice, setChoice] = useState<'kind' | 'sharp' | null>(null);
  return (
    <main className="cover-scene" data-testid="screen-cover-life">
      <div className="cover-window" aria-hidden="true"><i /><i /><i /><i /></div>
      <section className="cover-copy">
        <div className="eyebrow">Chapter 04 · 08:42 / Luma Civic Office</div>
        <span className="cover-badge">DAYLIGHT IDENTITY</span>
        <h1>Kiri Vale is<br /><em>perfectly ordinary.</em></h1>
        <p>By day, Kiri approves rooftop safety permits, remembers everyone’s tea order, and hides a legendary aim behind a shy smile. Then her desk phone rings on a line that does not exist.</p>
        <blockquote>“Ms. Vale, why does your inspection report include a drawing of a tiny bird?”<cite>Supervisor Dae</cite></blockquote>
        {!choice ? (
          <div className="cover-choices">
            <button onClick={() => setChoice('kind')}><b>Smile and improvise</b><span>“It improves workplace morale.” · − suspicion</span></button>
            <button onClick={() => setChoice('sharp')}><b>Change the subject</b><span>“The east relay failed inspection.” · + suspicion</span></button>
          </div>
        ) : (
          <div className="cover-result">
            <span>{choice === 'kind' ? 'COVER MAINTAINED · SUPERVISOR CHARMED' : 'COVER STRAINED · SUPERVISOR CURIOUS'}</span>
            <p>{choice === 'kind' ? 'Dae laughs. Beneath the desk, Pip quietly deletes the incoming call log.' : 'Dae glances toward the east windows. Echo whispers: “Smooth, Kingfisher. Very smooth.”'}</p>
            <button className="primary-cta" onClick={() => onComplete(choice === 'kind' ? 2 : 14)}>Answer the secret line <ChevronMark /></button>
          </div>
        )}
      </section>
      <aside className="cover-desk" aria-label="Kiri at her civilian office desk">
        <div className="office-card"><span>EMPLOYEE 0417</span><b>KIRI VALE</b><small>Rooftop Safety · Level II</small></div>
        <div className="office-kiri"><div className="portrait portrait-kingfisher"><span /></div><i className="civilian-glasses" /></div>
        <div className="desk-surface"><span className="mug">K</span><span className="paperwork">ROOF 07<br />APPROVED ✓</span><button className="secret-phone" aria-label="Secret phone">02:17</button></div>
        <div className="pip-hide">•ᴗ•<small>PIP / HIDING</small></div>
      </aside>
    </main>
  );
}

type BriefingProps = {
  onStart: (target: TargetId, disguise: DisguiseId) => void;
  onBack: () => void;
  wardrobe: WardrobeStoreState;
  wardrobeBusy: boolean;
  onRestoreWardrobe: () => void;
  outfit: OutfitId;
  onPurchaseWardrobe: () => void;
  onOutfitChange: (outfit: OutfitId) => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
};

function Briefing({ onStart, onBack, wardrobe, wardrobeBusy, outfit, onPurchaseWardrobe, onRestoreWardrobe, onOutfitChange, difficulty, onDifficultyChange }: BriefingProps) {
  const [target, setTarget] = useState<TargetId>('director');
  const [disguise, setDisguise] = useState<DisguiseId>('inspector');
  return (
    <main className="start-screen" data-testid="screen-briefing">
      <div className="start-glow" aria-hidden="true" />
      <div className="start-content">
        <div className="start-topline">
          <div className="brand-mark"><b>RED THREAD</b> / CASE FILE 04</div>
          <div className="status-chip"><i className="status-dot" /> Cast uplink · 02:17 local</div>
        </div>
        <div className="briefing-layout">
          <section className="briefing-copy">
            <div className="eyebrow">Operation 04 / Night ingress / Sector 07</div>
            <h1 className="start-title">Over<span>watch</span></h1>
            <div className="story-hook">
              <span>Three victims. One relay. A voice that should be dead.</span>
              <p>
                Someone is using the city’s friendly mascots to lure people away with voices they trust.
                Tonight, the network is using Kiri’s missing brother. Collect three pieces of evidence,
                stop the next broadcast, and discover who recorded him. Your selected lead determines which file Echo decrypts.
              </p>
            </div>
            <div className="start-grid">
              <button className="primary-cta" onClick={() => onStart(target, disguise)} data-testid="button-start-mission">
                Confirm operation <ChevronMark />
              </button>
              <button className="secondary-cta" onClick={onBack} data-testid="button-replay-story">Replay story</button>
            </div>
          </section>

          <aside className="character-deck planner-deck" data-testid="card-mission-brief">
            <div className="deck-heading">
              <span>Choose tonight’s lead</span>
              <b>CLASSIFIED</b>
            </div>
            <div className="target-list">
              {(Object.keys(targets) as TargetId[]).map((id) => <button key={id} className={target === id ? 'selected' : ''} onClick={() => setTarget(id)}>
                <span>{targets[id].alias}</span><strong>{targets[id].name}</strong><small>{targets[id].clue}</small><em>{targets[id].risk}</em>
              </button>)}
            </div>
            <div className="disguise-picker">
              <span>Cover identity</span>
              <div>{(Object.keys(disguises) as DisguiseId[]).map((id) => <button key={id} className={disguise === id ? 'selected' : ''} onClick={() => setDisguise(id)}><b>{disguises[id].name}</b><small>{disguises[id].perk}</small></button>)}</div>
            </div>
            <div className="difficulty-picker" aria-label="Mission difficulty">
              <span>Mission mode</span>
              <button className={difficulty === 'story' ? 'selected' : ''} onClick={() => onDifficultyChange('story')}><b>Story</b><small>More time · lighter damage</small></button>
              <button className={difficulty === 'agent' ? 'selected' : ''} onClick={() => onDifficultyChange('agent')}><b>Agent</b><small>Original tactical challenge</small></button>
            </div>
            <div className={`wardrobe-pass ${wardrobe.unlocked ? 'unlocked' : ''}`} data-testid="card-wardrobe-pass">
              <div className="wardrobe-heading"><span><Sparkles size={13} /> Field wardrobe</span><b>{wardrobe.unlocked ? 'AGENT PASS OWNED' : `UNLOCK ALL · ${wardrobe.price}`}</b></div>
              <div className="outfit-options">
                {(Object.keys(outfits) as OutfitId[]).map((id) => {
                  const locked = id !== 'classic' && !wardrobe.unlocked;
                  return <button key={id} className={`${outfit === id ? 'selected' : ''} ${locked ? 'locked' : ''}`} disabled={locked} onClick={() => onOutfitChange(id)} data-testid={`outfit-${id}`}>
                    <span className={`outfit-preview outfit-${id}`} aria-hidden="true"><i /><em /></span>
                    <strong>{outfits[id].name}</strong><small>{locked ? 'Locked' : outfit === id ? 'Equipped' : outfits[id].access}</small>
                  </button>;
                })}
              </div>
              {!wardrobe.unlocked && <button className="wardrobe-buy" disabled={wardrobeBusy || !wardrobe.available} onClick={onPurchaseWardrobe} data-testid="button-buy-wardrobe">
                <ShoppingBag size={13} /> {wardrobeBusy ? 'Opening Test Store…' : wardrobe.available ? `Unlock two outfits · ${wardrobe.price}` : 'Store offline'}
              </button>}
              <button className="wardrobe-restore" disabled={wardrobeBusy || !wardrobe.configured} onClick={onRestoreWardrobe} data-testid="button-restore-purchases">
                <RefreshCw size={12} /> {wardrobeBusy ? 'Checking access…' : wardrobe.unlocked ? 'Refresh purchases' : 'Restore purchases'}
              </button>
            </div>
            {wardrobe.message !== 'Test Store ready' && !wardrobe.unlocked && <p className="wardrobe-note">{wardrobe.message}</p>}
          </aside>
        </div>
      </div>
    </main>
  );
}

function ChapterCard({ target, disguise, onContinue }: { target: TargetId; disguise: DisguiseId; onContinue: () => void }) {
  return <main className="chapter-card-screen" data-testid="screen-chapter-card">
    <div className="chapter-thread" />
    <section>
      <span>RED THREAD · CHAPTER 04</span>
      <h1>The Smile<br />Before the Shot</h1>
      <p>Target: <b>{targets[target].name}</b> · Cover: <b>{disguises[disguise].name}</b></p>
      <blockquote>“Come home before the kettle cools.” <cite>— Ren’s voice, intercepted tonight. Recording date unknown.</cite></blockquote>
      <button className="primary-cta" onClick={onContinue}>Begin infiltration <ChevronMark /></button>
    </section>
  </main>;
}

function ChevronMark() {
  return <span aria-hidden="true" style={{ fontSize: 21, lineHeight: 0 }}>›</span>;
}

function MissionComplete({ onContinue, onRestart, target, exposure, outfit, quiet }: { quiet: boolean; onContinue: () => void; onRestart: () => void; target: TargetId; exposure: number; outfit: OutfitId }) {
  return (
    <main className="complete-screen" data-testid="screen-mission-complete">
      <section className="complete-card">
        <div className="complete-mark"><Check size={23} /></div>
        <div className={`completion-outfit outfit-${outfit}`} aria-label={`${outfits[outfit].name} outfit equipped`}><i /><em /><span /></div>
        <div className="eyebrow">Case file 04 · Sector 07</div>
        <h1>{quiet ? "Silent thread" : "Network dark"}</h1>
        <div className="outcome-thread">{quiet ? "GHOST ROUTE · You bypassed the surviving patrols." : "CLEARANCE ROUTE · Every patrol neutralized."}</div>
        <p>{quiet ? 'Echo copies the relay log while the surviving guards watch an unchanged status light. The next broadcast never leaves the roof.' : 'With the guards neutralized, Echo copies the relay log. An emergency alarm escapes, but the next voice broadcast does not.'} Tonight’s calls are stopped. The missing people are still out there.</p>
        <p>{target === 'director' ? 'Han’s authorization lists Ren as a witness, not a volunteer. Beside his name: TRANSFER — LUMA CENTRAL. Someone wanted his testimony silenced.' : target === 'courier' ? 'Mira’s delivery route contains a handwritten correction: carriage seven, Luma Central. She was moving people off the official list. Was she rescuing them—or hiding them?' : 'The Fourth Voice is assembled from old recordings. It cannot prove Ren is alive. But its source log points to a physical archive beneath Luma Central.'}</p>
        <p>For the first time in six months, Kiri has a place to search—not a voice to chase. Pip opens the route home. She changes the destination.</p>
        <div className="debrief">
          <div>Operative<b>Kingfisher</b></div>
          <div>Exposure<b>{exposure < 30 ? 'Low' : exposure < 65 ? 'Guarded' : 'High'}</b></div>
          <div>Next lead<b>Unlocked</b></div>
        </div>
        <div className="outcome-thread">The red thread is cut. The case is not.</div>
        <div className="complete-actions">
          <NavigationButton className="primary-cta" onClick={onContinue} data-testid="button-next-mission"><Play size={15} /> Next case teaser</NavigationButton>
          <NavigationButton className="secondary-cta" onClick={onRestart} data-testid="button-replay-mission"><RotateCcw size={15} /> Replay</NavigationButton>
        </div>
      </section>
    </main>
  );
}

function MissionTwoTeaser({ onRestart }: { onRestart: () => void }) {
  return (
    <main className="teaser-screen" data-testid="screen-mission-two-teaser">
      <div className="teaser-rain" aria-hidden="true" />
      <section className="teaser-card">
        <span className="overlay-kicker">NEXT TRANSMISSION · CASE FILE 05</span>
        <h1>The Paper<br /><em>Crane</em></h1>
        <p>The recovered log leads to Luma Central. An empty train arrives with a paper crane on the seventh carriage window. Inside it: Ren’s handwriting, and tomorrow’s date. A recording can lie. Can a letter?</p>
        <div className="teaser-signal"><i /> INCOMING VOICEPRINT: 94% MATCH</div>
        <blockquote>“You cut one thread, little bird. Now follow the one tied around your own wrist.”<cite>— Moth</cite></blockquote>
        <div className="teaser-meta"><span>NEW LOCATION<b>Luma Central</b></span><span>NEW OBJECTIVE<b>Board the ghost train</b></span><span>STATUS<b>Coming next</b></span></div>
        <NavigationButton className="primary-cta" onClick={onRestart}><RotateCcw size={15} /> Return to case file 04</NavigationButton>
      </section>
    </main>
  );
}

function MissionFailed({ onRestart }: { onRestart: () => void }) {
  return (
    <main className="complete-screen failure-screen" data-testid="screen-mission-failed">
      <section className="complete-card">
        <div className="complete-mark failure-mark"><Crosshair size={21} /></div>
        <div className="eyebrow">Case file 04 · Sector 07</div>
        <h1>Signal lost</h1>
        <p>The transmission completed before Kingfisher reached the relay. Somewhere in the district, a friendly voice says the fourth name out loud.</p>
        <div className="debrief">
          <div>Operative<b>Kingfisher</b></div>
          <div>Exposure<b>Critical</b></div>
          <div>Case<b>Escalating</b></div>
        </div>
        <div className="outcome-thread failure-thread">Moth is still listening.</div>
        <button className="primary-cta" onClick={onRestart} data-testid="button-retry-mission">
          <RotateCcw size={15} /> Retry operation
        </button>
      </section>
    </main>
  );
}

type ThreeSceneProps = {
  position: { x: number; y: number };
  moving: boolean;
  moveDirection: { x: number; y: number };
  firing: boolean;
  scoped: boolean;
  overwatch: boolean;
  terminalDone: boolean;
  fragmentsCollected: boolean[];
  enemyHealth: number[];
  hitEnemyIndex: number | null;
  underFire: boolean;
  decoyActive: boolean;
  crouched: boolean;
  outfit: OutfitId;
};

const EVIDENCE = [
  { title: '01 · A borrowed voice', text: 'Echo: These are stitched recordings, not live calls. Someone is turning memories into bait.', response: 'Kiri: Then hearing Ren does not mean he is here.' },
  { title: '02 · The missing names', text: 'Pip recovered a transfer list. The three missing citizens are marked WITNESS, not LOST. The destination has been erased.', response: 'Kiri: They did not wander away. Someone chose them.' },
  { title: '03 · A route, not a promise', text: 'A note signed Moth: Copy the log before you cut the relay. The voices are a distraction. The route is real.', response: 'Echo: I can copy it while you hold the connection. Then we stop the broadcast.' },
];

const SIGNAL_FRAGMENTS = [
  { x: 25, y: 54 },
  { x: 49, y: 44 },
  // Keep the final fragment below the east concrete cover so its pickup
  // radius never overlaps an unreachable collision area.
  { x: 72, y: 70 },
];

const ENEMY_POINTS = [
  { x: 51, y: 40, world: [0.4, 0, -3.9] as [number, number, number], scale: 1, accent: '#d98972' },
  { x: 72, y: 53, world: [7.2, 0, -1.1] as [number, number, number], scale: 0.9, accent: '#82b9a8' },
  { x: 28, y: 50, world: [-7.1, 0, -1.8] as [number, number, number], scale: 0.82, accent: '#aa8bc5' },
];

// Screen-space collision bounds match the major 3D rooftop props. Keeping the
// collision model in the same coordinate system as player movement makes it
// predictable on keyboards, trackpads and touch screens.
const ROOFTOP_COLLIDERS = [
  { x1: 21, x2: 53, y1: 55, y2: 66 }, // west concrete cover
  { x1: 58, x2: 81, y1: 57, y2: 68 }, // east concrete cover
  { x1: 35, x2: 44, y1: 38, y2: 44 }, // upper utility crate
  { x1: 67, x2: 76, y1: 72, y2: 79 }, // lower utility crate
  { x1: 22, x2: 31, y1: 68, y2: 75 }, // rooftop planter
  { x1: 12, x2: 22, y1: 74, y2: 83 }, // snack kiosk
];

const isBlockedPosition = (x: number, y: number) => ROOFTOP_COLLIDERS.some((box) => (
  x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2
));

const movementKey = (key: string): keyof Keys | null => {
  if (key === 'w' || key === 'arrowup') return 'w';
  if (key === 'a' || key === 'arrowleft') return 'a';
  if (key === 's' || key === 'arrowdown') return 's';
  if (key === 'd' || key === 'arrowright') return 'd';
  return null;
};

function ThreeScene({ position, moving, moveDirection, firing, scoped, overwatch, terminalDone, fragmentsCollected, enemyHealth, hitEnemyIndex, underFire, decoyActive, crouched, outfit }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ position, moving, moveDirection, firing, scoped, overwatch, terminalDone, fragmentsCollected, enemyHealth, hitEnemyIndex, underFire, decoyActive, crouched });
  stateRef.current = { position, moving, moveDirection, firing, scoped, overwatch, terminalDone, fragmentsCollected, enemyHealth, hitEnemyIndex, underFire, decoyActive, crouched };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#13172d');
    scene.fog = new THREE.FogExp2('#171b36', 0.024);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
    camera.position.set(6.2, 4.7, 8.1);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      mount.dataset.fallback = 'true';
      mount.parentElement?.classList.add('webgl-fallback');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.domElement.className = 'tactical-canvas';
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight('#d9ddff', '#24203b', 2.15);
    scene.add(ambient);
    const moon = new THREE.DirectionalLight('#9ab3bb', 2.6);
    moon.position.set(-10, 14, 7);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    scene.add(moon);

    const amber = new THREE.PointLight('#ffb792', 13, 17, 2);
    amber.position.set(2, 4.3, -3.5);
    scene.add(amber);
    const red = new THREE.PointLight('#9a78e8', 7, 16, 2);
    red.position.set(-7, 2.8, -7);
    scene.add(red);

    const addBox = (
      size: [number, number, number],
      color: string,
      at: [number, number, number],
      options: { metalness?: number; roughness?: number; emissive?: string } = {},
    ) => {
      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: options.metalness ?? 0.18,
        roughness: options.roughness ?? 0.78,
        emissive: options.emissive ?? '#000000',
        emissiveIntensity: options.emissive ? 1.5 : 0,
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...at);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    const floor = addBox([34, 0.22, 25], '#252944', [0, -0.12, 0], { roughness: 0.88 });
    floor.receiveShadow = true;

    const laneLines = new THREE.Group();
    const laneMaterial = new THREE.MeshBasicMaterial({ color: '#8a8fca', transparent: true, opacity: 0.08 });
    for (let index = -4; index <= 4; index += 1) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, 24), laneMaterial);
      stripe.position.set(index * 3.4, 0.01, 0);
      laneLines.add(stripe);
    }
    for (let index = -3; index <= 3; index += 1) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(31, 0.01, 0.035), laneMaterial);
      stripe.position.set(0, 0.012, index * 3.2);
      laneLines.add(stripe);
    }
    scene.add(laneLines);

    // Layered skyline, lit windows, ductwork and roof equipment make the
    // playable space read as a real city rooftop instead of an empty arena.
    const skylineMaterial = new THREE.MeshStandardMaterial({ color: '#171b35', roughness: 0.9 });
    const windowMaterial = new THREE.MeshBasicMaterial({ color: '#ffd19b', transparent: true, opacity: 0.72 });
    [-14, -9.5, -5, 0, 5, 10, 15].forEach((x, index) => {
      const height = 4.5 + (index % 3) * 2.1;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(3.8, height, 3.4), skylineMaterial);
      tower.position.set(x, height / 2 - 1.2, -16.5 - (index % 2) * 2.2);
      scene.add(tower);
      for (let row = 0; row < Math.floor(height / 1.2); row += 1) {
        for (let column = -1; column <= 1; column += 1) {
          if ((row + column + index) % 3 === 0) continue;
          const windowPane = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.25, 0.03), windowMaterial);
          windowPane.position.set(x + column * 0.72, row * 0.83 + 0.35, tower.position.z + 1.72);
          scene.add(windowPane);
        }
      }
    });
    const billboard = addBox([4.8, 2.1, 0.18], '#7e4d83', [10.2, 4.2, -11.25], { metalness: 0.35, roughness: 0.45, emissive: '#512f6f' });
    billboard.rotation.y = -0.08;
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024; signCanvas.height = 448;
    const sign = signCanvas.getContext('2d');
    if (sign) {
      sign.fillStyle = '#211d3b'; sign.fillRect(0, 0, 1024, 448);
      sign.strokeStyle = '#ff887f'; sign.lineWidth = 9; sign.strokeRect(20,20,984,408);
      sign.fillStyle = '#ffe7ce'; sign.font = 'bold 88px sans-serif'; sign.textAlign = 'center';
      sign.fillText('COME HOME',512,174);
      sign.fillStyle = '#99dbcd'; sign.font = '32px monospace'; sign.fillText('LUMA · WE KNOW YOUR WAY',512,251);
      sign.fillStyle = '#ff887f'; sign.font = '22px monospace'; sign.fillText('A FAMILIAR VOICE IS NOT ALWAYS A FRIEND',512,357);
      const texture = new THREE.CanvasTexture(signCanvas); texture.colorSpace = THREE.SRGBColorSpace;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(4.65,2.0), new THREE.MeshBasicMaterial({map:texture}));
      face.position.set(10.2,4.2,-11.14); face.rotation.y = -0.08; scene.add(face);
    }
    // Red memorial ribbons connect the city's friendly design to its missing people.
    for (let i = 0; i < 11; i++) {
      const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.1,0.65 + (i % 3)*0.17), new THREE.MeshStandardMaterial({color:'#ed6d7d', emissive:'#4e1028', side:THREE.DoubleSide}));
      ribbon.position.set(-12+i*1.9,1.15,-10.95); ribbon.rotation.z = (i%2 ? 1 : -1)*0.16; scene.add(ribbon);
    }
    const decoyRing = new THREE.Mesh(new THREE.RingGeometry(0.95,1,48), new THREE.MeshBasicMaterial({color:'#ffa1ab',transparent:true,opacity:0.65,side:THREE.DoubleSide,depthWrite:false}));
    decoyRing.rotation.x = -Math.PI/2; scene.add(decoyRing);

    addBox([0.16, 3.2, 0.16], '#3e435b', [8.7, 1.6, -11.1], { metalness: 0.7, roughness: 0.4 });
    addBox([0.16, 3.2, 0.16], '#3e435b', [11.7, 1.6, -11.1], { metalness: 0.7, roughness: 0.4 });
    const ventMaterial = new THREE.MeshStandardMaterial({ color: '#59647d', metalness: 0.72, roughness: 0.38 });
    [[-11, -1], [1.6, 5.7], [10.2, 2.4]].forEach(([x, z], index) => {
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 1.15 + index * 0.12, 14), ventMaterial);
      vent.position.set(x, 0.58, z);
      vent.castShadow = true;
      scene.add(vent);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.13, 14), ventMaterial);
      cap.position.set(x, 1.2 + index * 0.12, z);
      scene.add(cap);
    });
    [[-8.8, -5.8], [4.7, -6.7]].forEach(([x, z]) => {
      const panel = addBox([3.2, 0.12, 1.7], '#263b62', [x, 0.86, z], { metalness: 0.55, roughness: 0.32, emissive: '#14234c' });
      panel.rotation.x = -0.3;
      addBox([0.1, 0.8, 0.1], '#535a70', [x, 0.42, z], { metalness: 0.72, roughness: 0.42 });
    });

    addBox([5.4, 2.1, 2.5], '#424b70', [-12.2, 1.05, -9.4], { metalness: 0.22, roughness: 0.8 });
    addBox([5.0, 2.5, 2.3], '#374263', [12.4, 1.25, -9.5], { metalness: 0.22, roughness: 0.8 });
    addBox([8.8, 0.8, 2.1], '#596382', [-4.3, 0.4, 0.6], { metalness: 0.35, roughness: 0.68 });
    addBox([6.6, 0.72, 2], '#4a5c70', [6.2, 0.36, 1.1], { metalness: 0.34, roughness: 0.7 });
    addBox([2.3, 0.95, 1.15], '#655e88', [-3.4, 0.47, -3.9], { metalness: 0.28, roughness: 0.66 });
    addBox([2.1, 0.82, 1.1], '#4e7081', [6.8, 0.41, 3.8], { metalness: 0.28, roughness: 0.68 });

    const pathGlow = new THREE.MeshBasicMaterial({ color: '#8d83d8', transparent: true, opacity: 0.32 });
    [-5.8, -1.9, 2.0, 5.9].forEach((x) => {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.025, 1.05), pathGlow);
      tile.position.set(x, 0.02, 4.8);
      scene.add(tile);
    });

    // Rooftop garden cover, glowing railings and a compact snack kiosk make
    // Sector 07 feel like a lived-in neon district rather than an empty yard.
    const leafMaterial = new THREE.MeshStandardMaterial({ color: '#72b49f', roughness: 0.84 });
    const blossomMaterial = new THREE.MeshStandardMaterial({ color: '#ef9fb5', emissive: '#713d61', emissiveIntensity: 0.25, roughness: 0.7 });
    [[-7.5, 2.9], [3.1, -4.7], [8.6, 5.2]].forEach(([x, z], planterIndex) => {
      addBox([2.2, 0.55, 1.1], planterIndex === 1 ? '#59688a' : '#4a5878', [x, 0.27, z], { metalness: 0.25, roughness: 0.72 });
      for (let sprout = -1; sprout <= 1; sprout += 1) {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 9), sprout === 0 ? blossomMaterial : leafMaterial);
        crown.position.set(x + sprout * 0.48, 0.78 + Math.abs(sprout) * 0.06, z);
        crown.castShadow = true;
        scene.add(crown);
      }
    });
    [-11, 11].forEach((z) => addBox([31, 0.12, 0.12], '#8d79c7', [0, 0.72, z], { metalness: 0.68, roughness: 0.3, emissive: '#574482' }));
    const kiosk = addBox([2.5, 2.5, 1.7], '#445477', [-10.7, 1.25, 4.8], { metalness: 0.25, roughness: 0.68 });
    const kioskSign = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.38, 0.05), new THREE.MeshStandardMaterial({ color: '#f1a1bd', emissive: '#a85078', emissiveIntensity: 1.5 }));
    kioskSign.position.set(kiosk.position.x, 1.88, kiosk.position.z + 0.88);
    scene.add(kioskSign);

    const lamps = [-4.6, 4.8];
    lamps.forEach((x, index) => {
      const pole = addBox([0.09, 5.2, 0.09], '#4c5655', [x, 2.6, -1.7 + index * 1.4], { metalness: 0.7, roughness: 0.42 });
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 8),
        new THREE.MeshStandardMaterial({ color: index ? '#99eadc' : '#ffc09b', emissive: index ? '#4a9e9a' : '#b56e5d', emissiveIntensity: 2.8 }),
      );
      beacon.position.set(pole.position.x, 5.15, pole.position.z);
      scene.add(beacon);
      const lampLight = new THREE.PointLight(index ? '#91dfd2' : '#ffae8d', index ? 8 : 10, 9, 2);
      lampLight.position.copy(beacon.position);
      scene.add(lampLight);
    });

    const terminalGroup = new THREE.Group();
    terminalGroup.position.set(7.9, 0, -0.2);
    const terminalBody = addBox([1.25, 1.8, 0.72], '#283538', [0, 1.0, 0], { metalness: 0.55, roughness: 0.48, emissive: '#000000' });
    scene.remove(terminalBody);
    terminalGroup.add(terminalBody);
    const terminalScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.48, 0.03),
      new THREE.MeshStandardMaterial({ color: '#9aaa80', emissive: '#64794d', emissiveIntensity: 1.4 }),
    );
    terminalScreen.position.set(0, 1.1, 0.38);
    terminalGroup.add(terminalScreen);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), new THREE.MeshStandardMaterial({ color: '#7f8982', metalness: 0.8, roughness: 0.35 }));
    antenna.position.set(0.3, 2.9, 0);
    terminalGroup.add(antenna);
    scene.add(terminalGroup);

    const signalNodes = SIGNAL_FRAGMENTS.map((fragment, index) => {
      const node = new THREE.Group();
      const worldX = (fragment.x - 50) * 0.32;
      const worldZ = (fragment.y - 58) * 0.22;
      node.position.set(worldX, 0.72, worldZ);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 0),
        new THREE.MeshStandardMaterial({
          color: index === 1 ? '#ffad9d' : '#8fe5d6',
          emissive: index === 1 ? '#a34d62' : '#3a9992',
          emissiveIntensity: 1.5,
          metalness: 0.25,
          roughness: 0.28,
        }),
      );
      crystal.castShadow = true;
      node.add(crystal);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.47, 0.025, 8, 30),
        new THREE.MeshBasicMaterial({ color: index === 1 ? '#ffb6aa' : '#9af0e3', transparent: true, opacity: 0.72 }),
      );
      ring.rotation.x = Math.PI / 2;
      node.add(ring);
      const glow = new THREE.PointLight(index === 1 ? '#ff9a92' : '#83e7da', 4, 4.5, 2);
      node.add(glow);
      scene.add(node);
      return node;
    });

    const makeEnemy = (at: [number, number, number], scale: number, accent: string) => {
      const enemy = new THREE.Group();
      enemy.position.set(...at);
      enemy.scale.setScalar(scale);
      enemy.userData.baseScale = scale;
      const accentMaterial = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.68 });
      const uniformMaterial = new THREE.MeshStandardMaterial({ color: '#53647d', roughness: 0.72 });
      const darkMaterial = new THREE.MeshStandardMaterial({ color: '#252c43', roughness: 0.6 });
      const faceMaterial = new THREE.MeshStandardMaterial({ color: '#e9b39f', roughness: 0.78 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.48, 6, 12), uniformMaterial);
      body.position.y = 1.06;
      body.castShadow = true;
      enemy.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12), faceMaterial);
      head.position.y = 1.72;
      head.scale.set(1, 1.02, 0.92);
      head.castShadow = true;
      enemy.add(head);
      const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), accentMaterial);
      hairCap.position.set(0, 1.87, 0.02);
      enemy.add(hairCap);
      [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.21, 4), accentMaterial);
        ear.position.set(side * 0.2, 2.05, 0);
        ear.rotation.z = side * -0.18;
        enemy.add(ear);
        const eyeDot = new THREE.Mesh(new THREE.SphereGeometry(0.047, 10, 7), darkMaterial);
        eyeDot.position.set(side * 0.12, 1.72, 0.31);
        enemy.add(eyeDot);
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 5, 9), darkMaterial);
        leg.position.set(side * 0.14, 0.52, 0);
        leg.castShadow = true;
        enemy.add(leg);
        const boot = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 7), accentMaterial);
        boot.position.set(side * 0.14, 0.25, 0.06);
        boot.scale.set(1, 0.68, 1.3);
        enemy.add(boot);
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.33, 5, 9), uniformMaterial);
        arm.position.set(side * 0.35, 1.06, 0.01);
        arm.rotation.z = side * -0.18;
        enemy.add(arm);
      });
      const chestBadge = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 7), accentMaterial);
      chestBadge.position.set(0, 1.17, 0.27);
      enemy.add(chestBadge);
      const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.82), darkMaterial);
      weapon.position.set(0.28, 1.03, 0.24);
      weapon.rotation.set(-0.22, 0, -0.3);
      enemy.add(weapon);
      const healthSegments = [0, 1].map((segmentIndex) => {
        const segment = new THREE.Mesh(
          new THREE.BoxGeometry(0.17, 0.045, 0.035),
          new THREE.MeshBasicMaterial({ color: segmentIndex ? '#ffb08e' : '#8ee1c9' }),
        );
        segment.position.set((segmentIndex - 0.5) * 0.2, 2.27, 0.04);
        enemy.add(segment);
        return segment;
      });
      enemy.userData.healthSegments = healthSegments;
      scene.add(enemy);
      return enemy;
    };

    const enemies = ENEMY_POINTS.map((enemy) => {
      const mesh = makeEnemy(enemy.world, enemy.scale, enemy.accent);
      mesh.userData.home = mesh.position.clone();
      return mesh;
    });

    const impactBursts = ENEMY_POINTS.map((enemy) => {
      const burst = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.28, 0),
        new THREE.MeshBasicMaterial({ color: '#ffb47d', transparent: true, opacity: 0.92, wireframe: true }),
      );
      burst.position.set(enemy.world[0], 1.35, enemy.world[2]);
      burst.visible = false;
      scene.add(burst);
      return burst;
    });

    const targetRings = ENEMY_POINTS.map((enemy) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.48, 0.62, 28),
        new THREE.MeshBasicMaterial({ color: '#ff977e', transparent: true, opacity: 0.78, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(enemy.world[0], 0.035, enemy.world[2]);
      ring.visible = false;
      scene.add(ring);
      return ring;
    });

    const playerGroup = new THREE.Group();
    const kingfisher = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: '#f2bba9', roughness: 0.78 });
    const palette = outfits[outfit];
    const premium = outfit !== 'classic';
    const hair = new THREE.MeshStandardMaterial({ color: palette.hair, roughness: 0.72 });
    const hairShine = new THREE.MeshStandardMaterial({ color: palette.hairShine, emissive: premium ? palette.hair : '#000000', emissiveIntensity: premium ? 0.22 : 0, roughness: 0.62 });
    const jacket = new THREE.MeshStandardMaterial({ color: palette.jacket, roughness: 0.72 });
    const jacketLight = new THREE.MeshStandardMaterial({ color: palette.jacketLight, roughness: 0.7 });
    const scarf = new THREE.MeshStandardMaterial({ color: palette.scarf, emissive: premium ? palette.scarf : '#000000', emissiveIntensity: premium ? 0.16 : 0, roughness: 0.68 });
    const boots = new THREE.MeshStandardMaterial({ color: palette.boots, roughness: 0.67 });
    const cream = new THREE.MeshStandardMaterial({ color: '#fff0dc', roughness: 0.74 });
    const eye = new THREE.MeshStandardMaterial({ color: '#312c49', roughness: 0.4 });
    const tealGlow = new THREE.MeshStandardMaterial({ color: '#8ee5d7', emissive: '#4aa89d', emissiveIntensity: 0.75, roughness: 0.35 });

    const addCharacterMesh = (geometry: THREE.BufferGeometry, material: THREE.Material, parent = kingfisher) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // Big head, soft silhouette, pastel armour and expressive eyes deliberately
    // match the illustrated Kingfisher shown throughout the story screens.
    const hairBack = addCharacterMesh(new THREE.SphereGeometry(0.49, 24, 18), hair);
    hairBack.position.set(0, 2.22, -0.035);
    hairBack.scale.set(1.02, 1.08, 0.92);
    const face = addCharacterMesh(new THREE.SphereGeometry(0.42, 24, 18), skin);
    face.position.set(0, 2.2, 0.09);
    face.scale.set(0.96, 1.02, 0.88);
    const fringe = addCharacterMesh(new THREE.SphereGeometry(0.36, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), hairShine);
    fringe.position.set(-0.04, 2.37, 0.24);
    fringe.rotation.z = -0.18;
    fringe.scale.set(1.13, 0.78, 0.78);
    [-1, 1].forEach((side) => {
      const sideLock = addCharacterMesh(new THREE.CapsuleGeometry(0.09, 0.36, 5, 10), hair);
      sideLock.position.set(side * 0.38, 1.98, 0.02);
      sideLock.rotation.z = side * 0.13;
      const eyeMesh = addCharacterMesh(new THREE.SphereGeometry(0.075, 14, 10), eye);
      eyeMesh.position.set(side * 0.16, 2.2, 0.43);
      eyeMesh.scale.set(0.78, 1.15, 0.36);
      const eyeSpark = addCharacterMesh(new THREE.SphereGeometry(0.022, 8, 6), cream);
      eyeSpark.position.set(side * 0.145, 2.235, 0.472);
      const cheek = addCharacterMesh(new THREE.SphereGeometry(0.055, 10, 7), scarf);
      cheek.position.set(side * 0.265, 2.08, 0.405);
      cheek.scale.set(1.5, 0.5, 0.3);
    });
    const smile = addCharacterMesh(new THREE.TorusGeometry(0.07, 0.012, 6, 14, Math.PI), eye);
    smile.position.set(0, 2.06, 0.46);
    smile.rotation.set(0, 0, Math.PI);

    const torso = addCharacterMesh(new THREE.CapsuleGeometry(0.3, 0.52, 8, 16), jacket);
    torso.position.y = 1.43;
    torso.scale.set(1.1, 1, 0.76);
    const chestPanel = addCharacterMesh(new THREE.BoxGeometry(0.34, 0.3, 0.08), jacketLight);
    chestPanel.position.set(0, 1.48, 0.29);
    chestPanel.rotation.x = -0.08;
    const belt = addCharacterMesh(new THREE.CylinderGeometry(0.34, 0.36, 0.12, 18), boots);
    belt.position.y = 1.08;
    const skirt = addCharacterMesh(new THREE.CylinderGeometry(0.32, 0.46, 0.38, 18), hair);
    skirt.position.y = 0.9;
    const scarfKnot = addCharacterMesh(new THREE.SphereGeometry(0.12, 12, 9), scarf);
    scarfKnot.position.set(0.27, 1.75, 0.29);
    const scarfTail = addCharacterMesh(new THREE.BoxGeometry(0.13, 0.48, 0.06), scarf);
    scarfTail.position.set(0.36, 1.52, 0.14);
    scarfTail.rotation.z = -0.28;
    const birdClip = addCharacterMesh(new THREE.ConeGeometry(0.11, 0.26, 4), tealGlow);
    birdClip.position.set(-0.36, 2.51, 0.12);
    birdClip.rotation.set(0.2, 0, -0.52);

    const makeLimb = (side: number, isArm: boolean) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * (isArm ? 0.37 : 0.19), isArm ? 1.65 : 0.76, 0);
      kingfisher.add(pivot);
      const limb = addCharacterMesh(
        new THREE.CapsuleGeometry(isArm ? 0.09 : 0.12, isArm ? 0.44 : 0.49, 6, 10),
        isArm ? jacketLight : boots,
        pivot,
      );
      limb.position.y = isArm ? -0.28 : -0.34;
      if (isArm) limb.rotation.z = side * -0.08;
      const handOrBoot = addCharacterMesh(
        new THREE.SphereGeometry(isArm ? 0.105 : 0.145, 12, 8),
        isArm ? skin : cream,
        pivot,
      );
      handOrBoot.position.set(0, isArm ? -0.58 : -0.69, isArm ? 0.01 : 0.055);
      if (!isArm) handOrBoot.scale.set(1, 0.72, 1.35);
      return pivot;
    };
    const leftArm = makeLimb(-1, true);
    const rightArm = makeLimb(1, true);
    const leftLeg = makeLimb(-1, false);
    const rightLeg = makeLimb(1, false);

    const rifle = addCharacterMesh(new THREE.BoxGeometry(0.13, 0.13, 1.25), boots);
    rifle.position.set(0.38, 1.34, 0.35);
    rifle.rotation.set(-0.2, 0, -0.23);
    const rifleCharm = addCharacterMesh(new THREE.SphereGeometry(0.07, 10, 7), tealGlow);
    rifleCharm.position.set(0.39, 1.15, 0.35);
    const tracer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 5.8, 8),
      new THREE.MeshBasicMaterial({ color: '#e0a45d', transparent: true, opacity: 0.9 }),
    );
    tracer.rotation.z = Math.PI / 2;
    tracer.position.set(3.05, 1.32, 0.12);
    tracer.visible = false;
    playerGroup.add(tracer);
    const muzzleGlow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd29a' }));
    muzzleGlow.position.set(0.72, 1.34, 0.28);
    muzzleGlow.visible = false;
    playerGroup.add(muzzleGlow);
    const muzzleStar = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.62, 7),
      new THREE.MeshBasicMaterial({ color: '#fff0b7', transparent: true, opacity: 0.92 }),
    );
    muzzleStar.position.set(0.98, 1.34, 0.28);
    muzzleStar.rotation.z = -Math.PI / 2;
    muzzleStar.visible = false;
    playerGroup.add(muzzleStar);
    const muzzleLight = new THREE.PointLight('#ffb05f', 0, 5, 2);
    muzzleLight.position.set(0.85, 1.35, 0.35);
    playerGroup.add(muzzleLight);
    playerGroup.add(kingfisher);
    playerGroup.scale.setScalar(0.72);
    playerGroup.position.set(-0.9, 0, 4.9);
    scene.add(playerGroup);

    // Pip is Kingfisher's pocket-sized scout. Keeping the companion procedural
    // means the character is always visible, even if the optional GLB fails.
    const pip = new THREE.Group();
    const pipBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 20, 14),
      new THREE.MeshStandardMaterial({ color: '#ffd49d', metalness: 0.36, roughness: 0.36 }),
    );
    pip.add(pipBody);
    const pipFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.31, 0.14, 0.045),
      new THREE.MeshStandardMaterial({ color: '#354057', emissive: '#93e6db', emissiveIntensity: 0.75 }),
    );
    pipFace.position.set(0, 0.015, 0.245);
    pip.add(pipFace);
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 8),
        new THREE.MeshStandardMaterial({ color: '#93cfc6', transparent: true, opacity: 0.88, roughness: 0.32 }),
      );
      wing.scale.set(1.5, 0.28, 0.72);
      wing.position.x = side * 0.34;
      pip.add(wing);
    });
    const pipGlow = new THREE.PointLight('#94eadc', 2.2, 3.5, 2);
    pip.add(pipGlow);
    pip.scale.setScalar(0.78);
    pip.position.set(-0.1, 2.45, 4.7);
    scene.add(pip);

    const incomingTracer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 1, 6),
      new THREE.MeshBasicMaterial({ color: '#ff596b', transparent: true, opacity: 0.8 }),
    );
    incomingTracer.visible = false;
    scene.add(incomingTracer);
    const pointTracer = (mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3) => {
      const direction = new THREE.Vector3().subVectors(to, from);
      mesh.position.copy(from).add(to).multiplyScalar(0.5);
      mesh.scale.set(1, direction.length(), 1);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    };

    let walkPhase = 0;

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const animateIdentity = addRooftopIdentity(scene);
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;
      animateIdentity(elapsed);
      const current = stateRef.current;
      const tactical = current.firing || current.scoped;
      walkPhase += delta * (current.moving && !tactical ? 8.4 : 2.2);
      const swing = current.moving && !tactical ? Math.sin(walkPhase) : 0;
      leftLeg.rotation.x = swing * 0.58;
      rightLeg.rotation.x = -swing * 0.58;
      leftArm.rotation.x = -swing * 0.2;
      rightArm.rotation.x = swing * 0.2;
      kingfisher.position.y = current.moving ? Math.abs(swing) * 0.045 : Math.sin(elapsed * 2.2) * 0.018;
      kingfisher.rotation.z = current.moving ? Math.sin(walkPhase * 0.5) * 0.025 : 0;
      scarfTail.rotation.z = -0.28 + Math.sin(elapsed * 4.2) * 0.08 + (current.moving ? 0.13 : 0);
      rifle.rotation.x = current.firing ? -0.13 : -0.2;
      const targetX = (current.position.x - 50) * 0.32;
      const targetZ = (current.position.y - 58) * 0.22;
      playerGroup.position.x += (targetX - playerGroup.position.x) * 0.12;
      playerGroup.position.z += (targetZ - playerGroup.position.z) * 0.12;
      pip.position.x += (playerGroup.position.x - 0.72 - pip.position.x) * 0.085;
      pip.position.z += (playerGroup.position.z + 0.18 - pip.position.z) * 0.085;
      decoyRing.visible = current.decoyActive;
      decoyRing.position.set(playerGroup.position.x,0.08,playerGroup.position.z);
      decoyRing.scale.setScalar(1 + (elapsed % 1.3)*3);
      (decoyRing.material as THREE.MeshBasicMaterial).opacity = 0.65 * (1 - (elapsed % 1.3)/1.3);
      pip.position.y = 2.15 + Math.sin(elapsed * 3.1) * 0.13;
      pip.rotation.y = Math.sin(elapsed * 2) * 0.18;
      signalNodes.forEach((node, index) => {
        node.visible = !current.fragmentsCollected[index];
        node.rotation.y = elapsed * (0.8 + index * 0.12);
        node.position.y = 0.72 + Math.sin(elapsed * 2.4 + index) * 0.12;
      });
      if (current.moving && (current.moveDirection.x || current.moveDirection.y)) {
        // The model faces +Z; screen-map Y also increases along world +Z.
        // Match the unequal map-to-world scales used by targetX/targetZ.
        const movementAngle = Math.atan2(current.moveDirection.x * 0.32, current.moveDirection.y * 0.22);
        const angleDelta = Math.atan2(
          Math.sin(movementAngle - playerGroup.rotation.y),
          Math.cos(movementAngle - playerGroup.rotation.y),
        );
        playerGroup.rotation.y += angleDelta * Math.min(1, delta * 10);
      }
      playerGroup.scale.y += ((current.crouched ? 0.48 : 0.72) - playerGroup.scale.y) * Math.min(1, delta * 12);
      tracer.visible = current.firing;
      muzzleGlow.visible = current.firing;
      muzzleStar.visible = current.firing;
      muzzleStar.rotation.x = elapsed * 19;
      muzzleLight.intensity = current.firing ? 8 : 0;
      const screenMaterial = terminalScreen.material as THREE.MeshStandardMaterial;
      screenMaterial.color.set(current.terminalDone ? '#8da678' : '#9aaa80');
      screenMaterial.emissive.set(current.terminalDone ? '#58764e' : '#64794d');
      screenMaterial.emissiveIntensity = current.terminalDone ? 2.2 : 1.4;
      enemies.forEach((enemy, index) => {
        const defeated = current.enemyHealth[index] <= 0;
        if (defeated && enemy.userData.defeatStarted === undefined) enemy.userData.defeatStarted = elapsed;
        const defeatAge = defeated ? elapsed - (enemy.userData.defeatStarted as number) : 0;
        enemy.visible = !defeated || defeatAge < 0.85;
        const home = enemy.userData.home as THREE.Vector3;
        enemy.position.x = home.x;
        enemy.position.z = home.z;
        enemy.rotation.y = Math.sin(elapsed * 0.48 + index) * 0.38 + (defeated ? defeatAge * 1.6 : 0);
        const baseScale = enemy.userData.baseScale as number;
        const defeatScale = defeated ? Math.max(0.04, 1 - defeatAge * 1.1) : 1;
        const pulseScale = (current.hitEnemyIndex === index ? baseScale * (1.08 + Math.sin(elapsed * 30) * 0.06) : baseScale) * defeatScale;
        enemy.scale.setScalar(pulseScale);
        enemy.position.y = defeated ? Math.max(-0.5, -defeatAge * 0.65) : 0;
        (enemy.userData.healthSegments as THREE.Mesh[]).forEach((segment, segmentIndex) => {
          segment.visible = current.enemyHealth[index] > segmentIndex;
        });
        const head = enemy.children[1];
        if (head instanceof THREE.Mesh) {
          const material = head.material as THREE.MeshStandardMaterial;
          if (current.hitEnemyIndex === index) material.emissive.set('#ff3d55');
          else if (current.overwatch && index === 0) material.emissive.set('#8f3028');
          else material.emissive.set('#000000');
        }
        const burst = impactBursts[index];
        burst.visible = current.hitEnemyIndex === index;
        if (burst.visible) {
          burst.position.copy(enemy.position).add(new THREE.Vector3(0, 1.35, 0));
          burst.rotation.x += delta * 8;
          burst.rotation.y += delta * 11;
          burst.scale.setScalar(0.8 + Math.sin(elapsed * 24) * 0.3);
        }
      });
      const nearestTarget = ENEMY_POINTS
        .map((enemy, index) => ({ index, distance: Math.hypot(current.position.x - enemy.x, current.position.y - enemy.y) }))
        .filter(({ index }) => current.enemyHealth[index] > 0 && clearSight(current.position, ENEMY_POINTS[index], ROOFTOP_COLLIDERS))
        .sort((a, b) => a.distance - b.distance)[0]?.index ?? -1;
      targetRings.forEach((ring, index) => {
        ring.visible = index === nearestTarget;
        if (ring.visible) {
          ring.position.x = enemies[index].position.x;
          ring.position.z = enemies[index].position.z;
          ring.scale.setScalar(0.92 + Math.sin(elapsed * 5) * 0.12);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.58 + Math.sin(elapsed * 6) * 0.2;
        }
      });
      const livingEnemy = enemies.find((_, index) => current.enemyHealth[index] > 0);
      incomingTracer.visible = current.underFire && Boolean(livingEnemy);
      if (incomingTracer.visible && livingEnemy) pointTracer(incomingTracer, livingEnemy.position.clone().add(new THREE.Vector3(0, 1.05, 0)), playerGroup.position.clone().add(new THREE.Vector3(0, 1.15, 0)));
      const portrait = camera.aspect < 1;
      const cameraTarget = new THREE.Vector3(playerGroup.position.x, 0.8, playerGroup.position.z - (portrait ? 0.7 : 1.85));
      camera.position.lerp(new THREE.Vector3(playerGroup.position.x + (portrait ? 4.6 : 6.15), portrait ? 8.2 : 5.8, playerGroup.position.z + (portrait ? 6.7 : 7.55)), current.firing ? 0.1 : 0.052);
      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    let frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
          (material as THREE.MeshStandardMaterial).map?.dispose(); material.dispose();
        });
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="three-layer" aria-label="Rendered Sector 07 tactical scene" />;
}

function MissionGame({ onComplete, onFailure, onAbort, target, disguise, initialSuspicion, outfit, difficulty, soundEnabled, onSoundChange }: { onComplete: (exposure: number, quiet: boolean) => void; onFailure: (reason: string) => void; onAbort: () => void; target: TargetId; disguise: DisguiseId; initialSuspicion: number; outfit: OutfitId; difficulty: Difficulty; soundEnabled: boolean; onSoundChange: (enabled: boolean) => void }) {
  const [ammo, setAmmo] = useState(17);
  const [health, setHealth] = useState(100);
  const [transmissionSeconds, setTransmissionSeconds] = useState(difficulty === 'story' ? 600 : 451);
  const [isReloading, setIsReloading] = useState(false);
  const [scoped, setScoped] = useState(false);
  const [overwatch, setOverwatch] = useState(false);
  const [terminalDone, setTerminalDone] = useState(false);
  const [fragmentsCollected, setFragmentsCollected] = useState([false, false, false]);
  const [enemyHealth, setEnemyHealth] = useState([2, 2, 2]);
  const [hitEnemyIndex, setHitEnemyIndex] = useState<number | null>(null);
  const [exposure, setExposure] = useState(Math.max(initialSuspicion, disguises[disguise].exposure));
  const [crouched, setCrouched] = useState(false);
  const [position, setPosition] = useState({ x: 54, y: 75 });
  const [movement, setMovement] = useState({ x: 0, y: 0 });
  const [firing, setFiring] = useState(false);
  const [hitMarker, setHitMarker] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [enemyWarning, setEnemyWarning] = useState(false);
  const [terminalProgress, setTerminalProgress] = useState(0);
  const [hackingTerminal, setHackingTerminal] = useState(false);
  const [message, setMessage] = useState('Find the three glowing signal fragments. Pip will mark them nearby.');
  const [showTutorial, setShowTutorial] = useState(() => window.localStorage.getItem('red-thread-practice-v2-seen') !== 'yes');
  const [paused, setPaused] = useState(false);
  const [decoySeconds, setDecoySeconds] = useState(0);
  const [decoyCooldown, setDecoyCooldown] = useState(0);
  const [storyClue, setStoryClue] = useState<number | null>(null);
  const deployDecoy = () => {
    if (paused || showTutorial || terminalDone || decoyCooldown > 0) return;
    setDecoySeconds(4); setDecoyCooldown(14);
    notify('PIP: BORROWED VOICE DEPLOYED / GUARDS DISTRACTED FOR 4 SECONDS');
    playTone(440, 0.2, 0.03);
  };
  useEffect(() => {
    if (paused || showTutorial || terminalDone) return;
    const timer = window.setInterval(() => {
      setDecoySeconds(value => Math.max(0, value - 1));
      setDecoyCooldown(value => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [paused, showTutorial, terminalDone]);

  const keys = useRef<Keys>({ w: false, a: false, s: false, d: false });
  const sprinting = useRef(false);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hackTimer = useRef<number | null>(null);
  const collisionNoticeAt = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);
  const [aimAssist, setAimAssist] = useState(true);
  const [lockdown, setLockdown] = useState(0);
  const lastDamage = useRef(0);
  const lastShot = useRef(0);
  const combatRef = useRef({ position, enemyHealth, crouched, paused, showTutorial, terminalDone, exposure, decoySeconds });
  combatRef.current = { position, enemyHealth, crouched, paused, showTutorial, terminalDone, exposure, decoySeconds };
  const visibleThreats = ENEMY_POINTS.filter((enemy, i) => enemyHealth[i] > 0 && Math.hypot(position.x-enemy.x, position.y-enemy.y) < 34 && clearSight(position, enemy, ROOFTOP_COLLIDERS));
  const safelyHidden = visibleThreats.length === 0;

  const syncMovement = () => {
    const active = keys.current;
    const next = {
      x: (active.d ? 1 : 0) - (active.a ? 1 : 0),
      y: (active.s ? 1 : 0) - (active.w ? 1 : 0),
    };
    setMovement((current) => current.x === next.x && current.y === next.y ? current : next);
  };

  useEffect(() => {
    const suspend = () => {
      keys.current = { w: false, a: false, s: false, d: false };
      sprinting.current = false; setMovement({ x: 0, y: 0 }); setPaused(true);
    };
    const visibility = () => { if (document.hidden) suspend(); };
    window.addEventListener('blur', suspend);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('blur', suspend); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  const setControlKey = (key: keyof Keys, pressed: boolean) => {
    keys.current[key] = pressed;
    syncMovement();
  };

  const notify = (nextMessage: string) => {
    setMessage(nextMessage);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(''), 3200);
  };

  const playTone = (frequency: number, duration = 0.08, volume = 0.035) => {
    if (!soundEnabled) return;
    try {
      const context = audioContext.current ?? new AudioContext();
      audioContext.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gain.gain.setValueAtTime(volume, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch {
      // Audio is enhancement-only; browsers may block it before first input.
    }
  };

  const playEffect = (effect: 'shot' | 'hit' | 'defeat' | 'alert' | 'victory' | 'reload') => {
    if (!soundEnabled) return;
    try {
      const context = audioContext.current ?? new AudioContext();
      audioContext.current = context;
      void context.resume();
      const now = context.currentTime;
      const burst = (frequency: number, endFrequency: number, duration: number, volume: number, type: OscillatorType) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration);
      };
      if (effect === 'shot') {
        burst(145, 46, 0.12, 0.085, 'square');
        burst(930, 180, 0.055, 0.035, 'sawtooth');
      } else if (effect === 'hit') {
        burst(210, 92, 0.13, 0.055, 'triangle');
        window.setTimeout(() => playTone(780, 0.045, 0.025), 35);
      } else if (effect === 'defeat') {
        burst(170, 42, 0.32, 0.075, 'sawtooth');
        window.setTimeout(() => playTone(98, 0.3, 0.055), 80);
      } else if (effect === 'alert') {
        burst(680, 310, 0.18, 0.055, 'square');
        window.setTimeout(() => playTone(680, 0.11, 0.045), 190);
      } else if (effect === 'reload') {
        burst(520, 280, 0.06, 0.024, 'square');
        window.setTimeout(() => playTone(760, 0.055, 0.022), 170);
      } else {
        [261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
          window.setTimeout(() => playTone(frequency, 0.34, 0.045), index * 145);
        });
      }
    } catch {
      // Sound effects are non-blocking enhancements.
    }
  };

  const damageEnemy = (enemyIndex: number, damage: number, silent = false) => {
    setHitEnemyIndex(enemyIndex);
    window.setTimeout(() => setHitEnemyIndex(null), 320);
    setEnemyHealth((current) => {
      if (current[enemyIndex] <= 0) return current;
      const next = [...current];
      next[enemyIndex] = Math.max(0, next[enemyIndex] - damage);
      playEffect(next[enemyIndex] === 0 ? 'defeat' : 'hit');
      if (next[enemyIndex] === 0) trackGameEvent('enemy_defeated', { enemy_index: enemyIndex + 1, method: silent ? 'silent' : 'standard' });
      window.setTimeout(() => notify(next[enemyIndex] === 0
        ? `TARGET ${enemyIndex + 1} NEUTRALIZED / ${next.filter((value) => value > 0).length} REMAINING`
        : `TARGET ${enemyIndex + 1} HIT / ARMOUR DAMAGED${silent ? ' / SILENT SHOT' : ''}`), 0);
      return next;
    });
  };

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'escape') {
        setPaused((value) => !value);
        return;
      }
      if (paused || showTutorial) return;
      const moveKey = movementKey(key);
      if (moveKey) {
        event.preventDefault();
        keys.current[moveKey] = true;
        syncMovement();
      }
      if (key === 'r' && ammo < 17 && !isReloading) reload();
      if ((key === 'e' || key === 'f' || key === 'enter') && !event.repeat) startTerminalHack();
      if (key === 'q' && !event.repeat) toggleOverwatch();
      if (key === 'x' && !event.repeat) deployDecoy();
      if (key === 'c') setCrouched((value) => !value);
      if (key === 'shift') sprinting.current = true;
      if (key === ' ') {
        event.preventDefault();
        if (!event.repeat) shoot();
      }
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const moveKey = movementKey(key);
      if (moveKey) {
        event.preventDefault();
        keys.current[moveKey] = false;
        syncMovement();
      }
      if (key === 'shift') sprinting.current = false;
      if (key === 'e' || key === 'f' || key === 'enter') stopTerminalHack();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [ammo, isReloading, paused, showTutorial, position, crouched, scoped, aimAssist, enemyHealth, fragmentsCollected, exposure, terminalDone, overwatch, decoyCooldown]);

useEffect(() => () => {
    if (hackTimer.current) clearInterval(hackTimer.current);
    if (audioContext.current && audioContext.current.state !== 'closed') {
      void audioContext.current.close().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const mover = window.setInterval(() => {
      if (paused || showTutorial) return;
      const active = keys.current;
      const dx = (active.d ? 1 : 0) - (active.a ? 1 : 0);
      const dy = (active.s ? 1 : 0) - (active.w ? 1 : 0);
      setMovement((current) => current.x === dx && current.y === dy ? current : { x: dx, y: dy });
      if (!dx && !dy) return;
      const disguisePace = disguise === 'courier' && sprinting.current ? 1.12 : 1;
      const pace = (crouched ? 0.48 : sprinting.current ? 1.25 : 0.8) * disguisePace;
      setPosition((current) => {
        const proposedX = Math.max(12, Math.min(87, current.x + dx * pace));
        const proposedY = Math.max(39, Math.min(82, current.y + dy * pace * 0.82));
        const nextX = isBlockedPosition(proposedX, current.y) ? current.x : proposedX;
        const nextY = isBlockedPosition(nextX, proposedY) ? current.y : proposedY;
        if (nextX === current.x && nextY === current.y && performance.now() - collisionNoticeAt.current > 1500) {
          collisionNoticeAt.current = performance.now();
          notify('PATH BLOCKED / MOVE AROUND THE COVER');
        }
        return { x: nextX, y: nextY };
      });
    }, 70);
    return () => window.clearInterval(mover);
  }, [crouched, disguise, paused, showTutorial]);

  useEffect(() => {
    if (paused || showTutorial || terminalDone) return;
    const fragmentIndex = SIGNAL_FRAGMENTS.findIndex((fragment, index) => (
      !fragmentsCollected[index] && Math.hypot(position.x - fragment.x, position.y - fragment.y) < 7
    ));
    if (fragmentIndex < 0) return;
    setFragmentsCollected((current) => current.map((collected, index) => index === fragmentIndex ? true : collected));
    const remaining = fragmentsCollected.filter(Boolean).length + 1;
    setStoryClue(fragmentIndex);
    setPaused(true);
    trackGameEvent('signal_collected', { fragment_index: fragmentIndex + 1, collected_total: remaining });
    notify(`${EVIDENCE[fragmentIndex].title.toUpperCase()} / CLUE SAVED IN PAUSE → CASE JOURNAL${remaining === 3 ? ' / REACH THE RELAY' : ''}`);
    playTone(remaining === SIGNAL_FRAGMENTS.length ? 720 : 540, 0.16, 0.035);
  }, [fragmentsCollected, position, paused, showTutorial, terminalDone]);

  useEffect(() => {
    if (!overwatch || paused || showTutorial || terminalDone || isReloading || ammo <= 0) return;
    const shot = window.setTimeout(() => shoot(), 1600);
    return () => clearTimeout(shot);
  }, [overwatch, paused, showTutorial, terminalDone, isReloading, ammo, position, enemyHealth, scoped, crouched, aimAssist]);

  useEffect(() => {
    if (terminalDone || paused || showTutorial) return;
    let pending: ReturnType<typeof setTimeout> | undefined;
    const enemyFire = window.setInterval(() => {
      const combat = combatRef.current;
      const threat = ENEMY_POINTS.find((enemy, i) => combat.enemyHealth[i] > 0 && Math.hypot(combat.position.x-enemy.x, combat.position.y-enemy.y) < 34 && clearSight(combat.position, enemy, ROOFTOP_COLLIDERS));
      if (combat.decoySeconds > 0 || !threat || performance.now() - lastDamage.current < 2400) return;
      if (Math.random() > (combat.crouched ? 0.22 : 0.65) - (disguise === 'inspector' ? 0.1 : 0)) return;
      const aimPoint = { ...combat.position };
      setEnemyWarning(true);
      playEffect('alert');
      notify('INCOMING / MOVE AWAY OR BREAK LINE OF SIGHT');
      pending = setTimeout(() => {
        setEnemyWarning(false);
        const now = combatRef.current;
        if (now.decoySeconds > 0 || now.paused || now.showTutorial || now.terminalDone || now.enemyHealth[ENEMY_POINTS.indexOf(threat)] <= 0) return;
        if (Math.hypot(now.position.x-aimPoint.x, now.position.y-aimPoint.y) > 3 || Math.hypot(now.position.x-threat.x, now.position.y-threat.y) >= 34 || !clearSight(now.position, threat, ROOFTOP_COLLIDERS)) {
          notify('SHOT EVADED / KEEP MOVING'); return;
        }
        lastDamage.current = performance.now();
        setHealth(value => Math.max(0, value - (difficulty === 'story' ? (now.crouched ? 2 : 4) : (now.crouched ? 3 : 7))));
        setDamageFlash(true);
        window.setTimeout(() => setDamageFlash(false), 450);
      }, 1100);
    }, difficulty === 'story' ? 4200 : 3400);
    return () => { clearInterval(enemyFire); clearTimeout(pending); setEnemyWarning(false); };
  }, [difficulty, disguise, paused, showTutorial, terminalDone]);

  useEffect(() => {
    if (paused || showTutorial || terminalDone) return;
    const tick = window.setInterval(() => {
      if (safelyHidden) {
        setExposure(value => Math.max(0, value - (crouched ? 6 : 3)));
        if (difficulty === 'story' && performance.now() - lastDamage.current > 6000) setHealth(value => Math.min(100, value + 2));
      }
      if (lockdown > 0) {
        if (safelyHidden && exposure < 70) { setLockdown(0); notify('SEARCH EVADED / IDENTITY PROTECTED'); }
        else if (lockdown <= 1) onFailure('lockdown');
        else setLockdown(value => value - 1);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [paused, showTutorial, terminalDone, safelyHidden, crouched, difficulty, lockdown, exposure, onFailure]);

  useEffect(() => {
    if (terminalDone || paused || showTutorial) return;
    const timer = window.setInterval(() => {
      setTransmissionSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paused, showTutorial, terminalDone]);

  useEffect(() => {
    if (!paused && !showTutorial) return;
    keys.current = { w: false, a: false, s: false, d: false };
    setMovement({ x: 0, y: 0 });
    sprinting.current = false;
    if (hackTimer.current) clearInterval(hackTimer.current);
    hackTimer.current = null;
    setHackingTerminal(false);
  }, [paused, showTutorial]);

  useEffect(() => {
    if (transmissionSeconds === 0 && !terminalDone) onFailure('transmission_timeout');
  }, [onFailure, terminalDone, transmissionSeconds]);

  useEffect(() => {
    if (health === 0 && !terminalDone) onFailure('health_depleted');
    else if (exposure >= 100 && !terminalDone && lockdown === 0) { setLockdown(15); notify('LOCKDOWN / HIDE TO LOWER EXPOSURE BELOW 70'); }
  }, [exposure, health, onFailure, terminalDone, lockdown]);

  const reload = () => {
    if (isReloading || ammo === 17) return;
    setIsReloading(true);
    playEffect('reload');
    notify('MAGAZINE CHANGE / HOLD POSITION');
    window.setTimeout(() => {
      setAmmo(17);
      setIsReloading(false);
      notify('CARBINE READY');
    }, 1150);
  };

  const toggleOverwatch = () => {
    if (overwatch) {
      setOverwatch(false);
      notify('OVERWATCH DISENGAGED');
      return;
    }
    setOverwatch(true);
    notify('OVERWATCH ACTIVE / WATCHING EASTERN SIGHTLINE');
  };

  const shoot = () => {
    if (paused || showTutorial || terminalDone) return;
    if (performance.now() - lastShot.current < 320) return;
    if (isReloading) return;
    if (!ammo) {
      notify('EMPTY MAGAZINE / PRESS R TO RELOAD');
      return;
    }
    lastShot.current = performance.now();
    setAmmo((value) => Math.max(0, value - 1));
    playEffect('shot');
    setFiring(true);
    window.setTimeout(() => setFiring(false), 115);
    const target = ENEMY_POINTS
      .map((enemy, index) => ({ index, distance: Math.hypot(position.x - enemy.x, position.y - enemy.y) }))
      .filter(({ index }) => enemyHealth[index] > 0 && clearSight(position, ENEMY_POINTS[index], ROOFTOP_COLLIDERS))
      .sort((a, b) => a.distance - b.distance)[0];
    if (!target || target.distance > 39) {
      setExposure((value) => Math.min(100, value + 3));
      notify('NO CLEAR TARGET / MOVE AROUND COVER');
      return;
    }
    const accuracy = scoped || aimAssist ? 1 : crouched ? 0.95 : 0.85;
    const hit = Math.random() <= accuracy;
    setExposure((value) => Math.min(100, value + (scoped ? 2 : crouched ? 3 : 7)));
    if (!hit) {
      playEffect('alert');
      notify('SHOT MISSED / ENEMY ALERTED');
      return;
    }
    setHitMarker(true);
    damageEnemy(target.index, scoped ? 2 : 1, scoped || crouched);
    window.setTimeout(() => setHitMarker(false), 420);
  };

  const validateTerminal = () => {
    if (terminalDone) return;
    if (!fragmentsCollected.every(Boolean)) {
      notify(`RELAY LOCKED / FIND ${fragmentsCollected.filter((value) => !value).length} MORE SIGNAL FRAGMENT${fragmentsCollected.filter((value) => !value).length === 1 ? '' : 'S'}`);
      return false;
    }
    if (!quietAccess(fragmentsCollected, enemyHealth, crouched, exposure)) {
      notify('QUIET ROUTE: CROUCH + EXPOSURE BELOW 35 / OR CLEAR PATROLS');
      return false;
    }
    if (Math.hypot(position.x - 79, position.y - 58) > 21) {
      notify('MOVE CLOSER TO THE RELAY / FOLLOW THE WAYPOINT');
      return false;
    }
    return true;
  };

  const startTerminalHack = () => {
    if (paused || showTutorial || hackTimer.current || !validateTerminal()) return;
    setHackingTerminal(true);
    notify('HOLD TO DISABLE RELAY / DO NOT BREAK CONNECTION');
    playTone(330, 0.12, 0.03);
    let progress = terminalProgress;
    hackTimer.current = window.setInterval(() => {
        const live = combatRef.current;
        if (live.paused || live.showTutorial || Math.hypot(live.position.x - 79, live.position.y - 58) > 21 || !quietAccess(fragmentsCollected, live.enemyHealth, live.crouched, live.exposure)) {
          stopTerminalHack();
          return;
        }
        const next = Math.min(100, progress + (disguise === 'technician' ? 10 : 6));
        progress = next;
        setTerminalProgress(next);
        if (next < 100) {
          if (next % 20 === 0) playTone(360 + next * 2, 0.05, 0.022);
          return;
        }
        if (hackTimer.current) clearInterval(hackTimer.current);
        hackTimer.current = null;
        setHackingTerminal(false);
        setTerminalDone(true);
        setOverwatch(false);
        playEffect('victory');
        notify('ACCESS GRANTED / CITY SIGNAL RESTORED');
        trackGameEvent('mission_completed', {
          difficulty,
          outfit,
          target,
          disguise,
          final_health: health,
          final_exposure: exposure,
          completion_seconds: (difficulty === 'story' ? 600 : 451) - transmissionSeconds,
        });
        window.setTimeout(() => onComplete(live.exposure, live.enemyHealth.some(hp => hp > 0)), 2100);
    }, 100);
  };

  const stopTerminalHack = () => {
    if (!hackTimer.current) return;
    clearInterval(hackTimer.current);
    hackTimer.current = null;
    setHackingTerminal(false);
    notify('CONNECTION PAUSED / HOLD E TO CONTINUE');
  };

  const onSceneClick = () => shoot();
  const onPointerMove = (event: MouseEvent<HTMLDivElement>) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    document.documentElement.style.setProperty('--aim-x', `${x * 6}px`);
    document.documentElement.style.setProperty('--aim-y', `${y * 3}px`);
  };
  const onMouseDown = (event: MouseEvent) => {
    if (event.button === 2) {
      event.preventDefault();
      setScoped(true);
    }
  };
  const onMouseUp = (event: MouseEvent) => {
    if (event.button === 2) setScoped(false);
  };
  const healthState = health < 55 ? 'damage' : '';
  const countdown = `${String(Math.floor(transmissionSeconds / 60)).padStart(2, '0')}:${String(transmissionSeconds % 60).padStart(2, '0')}`;
  const activeEnemies = enemyHealth.filter((value) => value > 0).length;
  const relayDistance = Math.max(0, Math.round(Math.hypot(position.x - 79, position.y - 58) * 0.42));
  const relayReady = fragmentsCollected.every(Boolean);
  const nextFragmentIndex = fragmentsCollected.findIndex((collected) => !collected);
  const nearestEnemyIndex = ENEMY_POINTS
    .map((enemy, index) => ({ index, distance: Math.hypot(position.x - enemy.x, position.y - enemy.y) }))
    .filter(({ index }) => enemyHealth[index] > 0 && clearSight(position, ENEMY_POINTS[index], ROOFTOP_COLLIDERS))
    .sort((a, b) => a.distance - b.distance)[0]?.index ?? -1;
  const navigationPoint = nextFragmentIndex >= 0
    ? SIGNAL_FRAGMENTS[nextFragmentIndex]
    : { x: 79, y: 58 };
  const navigationDx = navigationPoint.x - position.x;
  const navigationDy = navigationPoint.y - position.y;
  const navigationDirection = Math.abs(navigationDx) > Math.abs(navigationDy)
    ? navigationDx > 0 ? 'RIGHT' : 'LEFT'
    : navigationDy > 0 ? 'DOWN' : 'UP';
  const navigationDistance = Math.max(0, Math.round(Math.hypot(navigationDx, navigationDy) * 0.42));
  const navigationLabel = nextFragmentIndex >= 0
    ? `SIGNAL ${nextFragmentIndex + 1}`
    : 'COMMS RELAY';

  return (
    <main className="game-view" onClick={onSceneClick} onMouseMove={onPointerMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onContextMenu={(event) => event.preventDefault()} data-testid="screen-mission">
      <div className="scene three-dimensional" data-character-style="chibi-kingfisher">
        <ThreeScene
          position={position}
          moving={Boolean(movement.x || movement.y)}
          moveDirection={movement}
          firing={firing}
          scoped={scoped}
          overwatch={overwatch}
          terminalDone={terminalDone}
          fragmentsCollected={fragmentsCollected}
          enemyHealth={enemyHealth}
          hitEnemyIndex={hitEnemyIndex}
          underFire={damageFlash}
          decoyActive={decoySeconds > 0}
          crouched={crouched}
          outfit={outfit}
        />
        <div className="sky-line" />
        <div className="horizon-light" />
        <div className="ground" />
        <div className="warehouse warehouse-a"><div className="door"><span /></div></div>
        <div className="warehouse warehouse-b"><div className="door"><span /></div></div>
        <div className="lamp lamp-a" /><div className="lamp lamp-b" />
        <div className="container container-one" /><div className="container container-two" />
        <div className="cover cover-a" /><div className="cover cover-b" /><div className="smoke" />
        <div className={`patrol patrol-one patrol-saffron ${overwatch ? 'alert' : ''}`}><i className="awareness" /><i className="head" /><i className="body" /><i className="gun" /></div>
        <div className="patrol patrol-two patrol-mint"><i className="awareness" /><i className="head" /><i className="body" /><i className="gun" /></div>
        <div className="patrol patrol-three patrol-lilac"><i className="awareness" /><i className="head" /><i className="body" /><i className="gun" /></div>
        <div className={`terminal ${terminalDone ? 'done' : ''}`} onPointerDown={(event) => { event.stopPropagation(); startTerminalHack(); }} onPointerUp={(event) => { event.stopPropagation(); stopTerminalHack(); }} onPointerCancel={stopTerminalHack} data-testid="button-terminal">
          <div className="terminal-label">{terminalDone ? 'RELAY OFFLINE' : 'COMMS RELAY'}</div>
          <div className="screen">{terminalDone ? 'OFF' : '07:31'}</div><div className="stand" />
        </div>
        <div className={`player ${firing ? 'firing' : ''}`} style={{ left: `calc(${position.x}% + var(--aim-x, 0px))`, top: `calc(${position.y}% + var(--aim-y, 0px))` }} data-testid="player-kingfisher">
          <i className="helmet" /><i className="visor" /><i className="torso" /><i className="leg leg-a" /><i className="leg leg-b" /><i className="rifle" /><i className="muzzle" />
        </div>
      </div>

      <button className={`pip-decoy ${decoySeconds > 0 ? 'active' : ''}`} data-testid="button-decoy" disabled={paused || showTutorial || decoyCooldown > 0 || terminalDone} onClick={event => { event.stopPropagation(); deployDecoy(); }}><b>PIP · BORROWED VOICE</b><span>{decoySeconds > 0 ? `DISTRACTION ${decoySeconds}s` : decoyCooldown > 0 ? `RECHARGING ${decoyCooldown}s` : 'X / TAP · DISTRACT GUARDS'}</span></button>
      {!terminalDone && <div className="navigation-cue" data-testid="navigation-cue"><span>◆</span><b>{navigationLabel}</b><small>{navigationDistance}m · {navigationDirection}</small></div>}
      {relayReady && !terminalDone && <button type="button" className={`relay-waypoint ${relayDistance <= 9 ? 'in-range' : ''}`} style={{ '--hack-progress': `${terminalProgress * 3.6}deg` } as CSSProperties} onPointerDown={(event) => { event.stopPropagation(); startTerminalHack(); }} onPointerUp={(event) => { event.stopPropagation(); stopTerminalHack(); }} onPointerCancel={stopTerminalHack} data-testid="relay-waypoint"><span>◆</span><b>{relayDistance <= 9 ? 'DISABLE RELAY NOW' : 'COMMS RELAY'}</b><small>{relayDistance}m · {relayDistance <= 9 ? 'HOLD E/F OR HOLD HERE' : 'MOVE CLOSER'}</small><i /></button>}

      <div className="hud">
        <div className="hud-top">
          <div className="hud-block comms" data-testid="status-comms">
            <div className="signal-bars"><i /><i /><i /></div>
            <div><strong>RED THREAD // 04</strong><span>FIELD UPLINK · ENCRYPTED</span></div>
          </div>
          <div className="hud-block objective" data-testid="status-objective">
            <div className="label">Current objective</div>
            <strong>{terminalDone ? 'Relay disabled' : !fragmentsCollected.every(Boolean) ? 'Find 3 glowing clues' : activeEnemies > 0 ? 'Sneak to relay or clear patrols' : 'Hold Interact at the relay'}</strong>
            <small>{terminalDone ? 'Return home before sunrise' : !fragmentsCollected.every(Boolean) ? `${fragmentsCollected.filter(Boolean).length} / 3 signal files secured` : activeEnemies > 0 ? `${activeEnemies} armed patrol${activeEnemies === 1 ? '' : 's'} remaining` : 'Area clear · relay unlocked'} <span className="countdown" data-testid="status-countdown">TRANSMISSION {countdown}</span></small>
          </div>
        </div>
        <div className="mission-techniques" data-testid="status-techniques">
          <span className="active">ID {disguises[disguise].name.toUpperCase()}</span>
          <span className={crouched ? 'active' : ''}>◒ {crouched ? 'STEALTH ON' : 'C STEALTH'}</span>
          <span>⇧ SPRINT</span>
          <span className={fragmentsCollected.every(Boolean) ? 'active' : ''}>◇ SIGNAL {fragmentsCollected.filter(Boolean).length}/3</span>
          <span className={activeEnemies === 0 ? 'active' : ''}>⌖ TARGET {3 - activeEnemies}/3</span>
        </div>
        <button className="pause-button" onClick={(event) => { event.stopPropagation(); setPaused(true); }} aria-label="Pause mission" data-testid="button-pause"><Pause size={14} /></button>
        <div className="target-dossier" data-testid="status-target-dossier"><span>PRIMARY LEAD</span><strong>{targets[target].alias}</strong><small>{targets[target].name} · {targets[target].risk}</small></div>
        <div className="mission-cast" data-testid="status-cast">
          <div className="cast-label"><span>Field cast</span><b>live threads</b></div>
          <div className="cast-members">
            <div className="cast-member cast-lead">
              <div className="hud-portrait portrait-kingfisher" aria-hidden="true"><span /></div>
              <div><strong>Kingfisher</strong><small>lead / live</small></div>
            </div>
            <div className="cast-member">
              <div className="hud-portrait portrait-echo" aria-hidden="true"><span /></div>
              <div><strong>Echo</strong><small>uplink / listening</small></div>
            </div>
            <div className="cast-member cast-threat">
              <div className="hud-portrait portrait-moth" aria-hidden="true"><span /></div>
              <div><strong>Moth</strong><small>signal / unknown</small></div>
            </div>
          </div>
        </div>
        <div className={`reticle ${scoped ? 'scope' : ''}`} data-testid="aim-reticle" style={{ opacity: scoped ? 0.95 : undefined }} />
        {message && (
          <div className="toast-message dialogue-message" data-testid="status-message">
            <div className="dialogue-avatar portrait-echo" aria-hidden="true"><span /></div>
            <div><b>ECHO</b><span>{message}</span></div>
          </div>
        )}
        {hitMarker && <div className="hit-marker" data-testid="status-hit">×</div>}
        {<div className={`stealth-status ${safelyHidden ? "safe" : "seen"}`} role="status">{lockdown > 0 ? `LOCKDOWN: ${lockdown}s — HIDE NOW` : safelyHidden ? "HIDDEN · EXPOSURE RECOVERING" : "IN PATROL SIGHT · FIND COVER"}</div>}
        {enemyWarning && <div className="enemy-warning" data-testid="status-enemy-warning"><span>!</span> INCOMING FIRE</div>}
        {damageFlash && <div className="alert-flash" data-testid="status-damage" />}
        {terminalDone && <div className="shutdown-cinematic"><span>SIGNAL SEVERED</span><strong>SECTOR 07<br />IS BREATHING AGAIN</strong><small>The fourth voice has left a message for Kingfisher.</small></div>}
        <div className="hud-bottom">
          <div className="hud-block weapon-panel">
            <div className="weapon-row"><Crosshair className="weapon-icon" size={19} /><div><div className="weapon-name">K-14 CARBINE</div><div className="weapon-sub">SUPPRESSED / SEMI-AUTO</div></div><div className={`ammo ${isReloading ? 'reload' : ''}`}>{isReloading ? '...' : ammo}<em> / 17</em></div></div>
          </div>
          <div className="controls" data-testid="status-controls"><b>WASD / ARROWS</b> move · <b>SPACE / CLICK</b> fire · <b>E / F</b> interact</div>
          <div className="hud-block health">
            <div className="health-head"><span>VITALS</span><b>{health}%</b></div><div className={`bar ${healthState}`}><i style={{ width: `${health}%` }} /></div>
            <div className="exposure-head"><span>EXPOSURE</span><b>{exposure}%</b></div><div className="bar exposure"><i style={{ width: `${exposure}%` }} /></div>
          </div>
        </div>
        <button className={`ability ${overwatch ? 'active' : 'ready'}`} onClick={(event) => { event.stopPropagation(); toggleOverwatch(); }} data-testid="button-overwatch">
          <div className="ability-row"><span className="ability-mark"><Eye size={14} /></span><span className="ability-title">OVERWATCH</span><span className="ability-key">Q</span></div>
          <small>{overwatch ? 'Armed · line of sight active' : 'Auto-fire when patrol crosses sightline'}</small>
        </button>
        <div className="mobile-controls" aria-label="Touch controls" onClick={event => event.stopPropagation()}>
          <div className="touch-pad">
            <TouchControl className="touch-up" label="Move up" onPress={() => setControlKey('w', true)} onRelease={() => setControlKey('w', false)}>▲</TouchControl>
            <TouchControl className="touch-left" label="Move left" onPress={() => setControlKey('a', true)} onRelease={() => setControlKey('a', false)}>◀</TouchControl>
            <TouchControl className="touch-center" label="Hold to sprint" onPress={() => { sprinting.current = true; }} onRelease={() => { sprinting.current = false; }}>⇧</TouchControl>
            <TouchControl className="touch-right" label="Move right" onPress={() => setControlKey('d', true)} onRelease={() => setControlKey('d', false)}>▶</TouchControl>
            <TouchControl className="touch-down" label="Move down" onPress={() => setControlKey('s', true)} onRelease={() => setControlKey('s', false)}>▼</TouchControl>
          </div>
          <div className="touch-actions">
            <TouchControl className={`touch-stealth ${crouched ? 'active' : ''}`} label={crouched ? 'Stand up' : 'Crouch'} pressed={crouched} onPress={() => { if (!paused && !showTutorial) { setCrouched(value => !value); notify(crouched ? 'STANDING / MOVE FAST' : 'CROUCHED / GET BEHIND COVER TO HIDE'); } }}>◒<span>{crouched ? 'STAND' : 'CROUCH'}</span></TouchControl>
            <TouchControl className={`touch-interact ${hackingTerminal ? 'active' : ''}`} label="Hold to disable relay" onPress={startTerminalHack} onRelease={stopTerminalHack}>◇<span>INTERACT</span></TouchControl>
            <TouchControl label="Reload" className="touch-reload" onPress={reload}>R<span>RELOAD</span></TouchControl>
            <TouchControl className={`touch-watch ${overwatch ? 'active' : ''}`} label="Toggle overwatch" pressed={overwatch} onPress={toggleOverwatch}>Q<span>WATCH</span></TouchControl>
            <TouchControl label="Hold to fire at highlighted enemy" className="touch-fire" onPress={shoot} repeat>◎<span>FIRE</span></TouchControl>
          </div>
        </div>
      </div>
      {scoped && <div className="scope-vignette" aria-hidden="true" />}
      {showTutorial && <FieldTraining onComplete={() => {
        window.localStorage.setItem('red-thread-practice-v2-seen', 'yes');
        keys.current = { w: false, a: false, s: false, d: false };
        setMovement({ x: 0, y: 0 }); setPaused(false); setShowTutorial(false);
        notify('PIP: READY! FIND THREE GLOWING CLUES. I’M RIGHT HERE.');
      }} />}
      {paused && !showTutorial && storyClue !== null && (
        <div className="mission-overlay evidence-overlay" onClick={event => event.stopPropagation()} data-testid="evidence-overlay">
          <section>
            <div className="evidence-content">
              <span className="overlay-kicker">CLUE {storyClue + 1} OF 3 · MISSION PAUSED</span>
              <h2>{EVIDENCE[storyClue].title}</h2>
              <p>{EVIDENCE[storyClue].text}</p>
              <blockquote>{EVIDENCE[storyClue].response}</blockquote>
              <small>Saved in Pause → Case journal.</small>
            </div>
            <NavigationButton className="primary-cta evidence-continue" onClick={() => { setStoryClue(null); setPaused(false); }}><Play size={16} /> {fragmentsCollected.every(Boolean) ? 'Find the relay →' : 'Find the next clue →'}</NavigationButton>
          </section>
        </div>
      )}
      {paused && !showTutorial && storyClue === null && (
        <div className="mission-overlay pause-overlay" onClick={(event) => event.stopPropagation()} data-testid="pause-overlay">
          <section>
            <span className="overlay-kicker">OPERATION SUSPENDED</span>
            <h2>{storyClue !== null ? 'Evidence recovered' : 'Mission paused'}</h2>
            {storyClue !== null && <div className="clue-reveal"><span>RECOVERED TRANSMISSION</span><h3>{EVIDENCE[storyClue].title}</h3><p>{EVIDENCE[storyClue].text}</p><blockquote>{EVIDENCE[storyClue].response}</blockquote></div>}
            <p>The transmission timer and patrol fire are frozen.</p>
            <details className="case-journal field-map">
              <summary>Rooftop map · plan your route</summary>
              <svg viewBox="8 34 84 54" role="img" aria-label="Rooftop map: white is you, gold is evidence, red is guards, mint is relay">
                <rect x="12" y="39" width="75" height="43" rx="1" fill="#151b30" stroke="#56637f" strokeWidth="0.4" />
                {ROOFTOP_COLLIDERS.map((box, index) => <rect key={index} x={box.x1} y={box.y1} width={box.x2-box.x1} height={box.y2-box.y1} fill="#536078" />)}
                {SIGNAL_FRAGMENTS.map((point,index) => !fragmentsCollected[index] && <g key={index}><circle cx={point.x} cy={point.y} r="1.8" fill="#ffc689" /><text x={point.x+2.8} y={point.y+1} fill="#ffc689" fontSize="3">{index+1}</text></g>)}
                {ENEMY_POINTS.map((point,index) => enemyHealth[index]>0 && <circle key={index} cx={point.x} cy={point.y} r="1.5" fill="#ff8088" />)}
                <circle cx="79" cy="58" r="2" fill="#90e6d4" />
                <circle cx={position.x} cy={position.y} r="2" fill="#fff" stroke="#162036" strokeWidth="0.6" />
              </svg>
              <p>You: white · Clues: gold · Guards: red · Relay: mint. Grey blocks are solid cover. Use gaps to move around them.</p>
            </details>
            <details className="case-journal">
              <summary>Case journal · {fragmentsCollected.filter(Boolean).length}/3 clues</summary>
              <p>Stop the broadcast. Find evidence of Ren. A familiar voice is not proof of life.</p>
              {EVIDENCE.map((clue, index) => <article key={clue.title}><b>{fragmentsCollected[index] ? clue.title : `0${index + 1} · Evidence not recovered`}</b>{fragmentsCollected[index] && <><p>{clue.text}</p><p><em>{clue.response}</em></p></>}</article>)}
            </details>
            <button className="primary-cta" onClick={() => { setStoryClue(null); setPaused(false); }}><Play size={15} /> Continue</button>
            <button className="overlay-option" onClick={() => onSoundChange(!soundEnabled)}>{soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />} Music & sound {soundEnabled ? 'on' : 'off'}</button>
            <button className="overlay-option" onClick={() => setAimAssist(value => !value)}>Aim assist: {aimAssist ? "ON — guaranteed clear shots" : "OFF — accuracy challenge"}</button>
            <button className="overlay-option" onClick={() => { setPaused(false); setShowTutorial(true); }}>View controls</button>
            <button className="overlay-option" onClick={() => { setPosition({ x: 54, y: 75 }); setPaused(false); notify('PIP REPOSITIONED KINGFISHER TO A SAFE ROUTE'); }}>Unstuck / return to safe point</button>
            <button className="overlay-option danger" onClick={onAbort}>Return to briefing</button>
          </section>
        </div>
      )}
    </main>
  );
}

function Home() {
  const [screen, setScreen] = useState<Screen>(() =>
    new URLSearchParams(window.location.search).get('mode') === 'game' ? 'game' : 'prologue',
  );
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [screen]);
  const [target, setTarget] = useState<TargetId>('director');
  const [disguise, setDisguise] = useState<DisguiseId>('inspector');
  const [suspicion, setSuspicion] = useState(4);
  const [finalExposure, setFinalExposure] = useState(0);
  const [quietEnding, setQuietEnding] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeStoreState>({ configured: false, available: false, unlocked: false, price: '$3.99', package: null, message: 'Connecting to Test Store…' });
  const [wardrobeBusy, setWardrobeBusy] = useState(false);
  const [outfit, setOutfit] = useState<OutfitId>(() => {
    const saved = window.localStorage.getItem('red-thread-outfit');
    return saved === 'moonlight' || saved === 'rose' ? saved : 'classic';
  });
  const [difficulty, setDifficulty] = useState<Difficulty>(() => window.localStorage.getItem('red-thread-difficulty') === 'agent' ? 'agent' : 'story');
  const [soundEnabled, setSoundEnabled] = useState(() => window.localStorage.getItem('red-thread-sound') !== 'off');
  useAmbientMusic(soundEnabled);

  useEffect(() => {
    void flushGameEvents();
    const flush = () => { void flushGameEvents(); };
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, []);

  useEffect(() => {
    let active = true;
    void loadWardrobeStore().then((state) => {
      if (!active) return;
      setWardrobe(state);
      if (state.unlocked && window.localStorage.getItem('red-thread-outfit') === null) {
        setOutfit('moonlight');
        window.localStorage.setItem('red-thread-outfit', 'moonlight');
      }
    });
    return () => { active = false; };
  }, []);

  const buyWardrobe = async () => {
    if (!wardrobe.package || wardrobeBusy) return;
    setWardrobeBusy(true);
    trackGameEvent('purchase_started', { product: 'agent_wardrobe_pass', price: wardrobe.price });
    try {
      const unlocked = await purchaseWardrobe(wardrobe.package);
      const refreshed = await loadWardrobeStore();
      setWardrobe({ ...refreshed, unlocked: unlocked || refreshed.unlocked });
      if (unlocked || refreshed.unlocked) {
        trackGameEvent('purchase_completed', { product: 'agent_wardrobe_pass', price: wardrobe.price });
        setOutfit('moonlight');
        window.localStorage.setItem('red-thread-outfit', 'moonlight');
      } else {
        trackGameEvent('purchase_cancelled', { product: 'agent_wardrobe_pass' });
      }
    } catch (error) {
      setWardrobe((current) => ({ ...current, message: error instanceof Error ? error.message : 'Purchase could not be completed.' }));
    } finally {
      setWardrobeBusy(false);
    }
  };

  const restoreWardrobe = async () => {
    if (wardrobeBusy) return;
    setWardrobeBusy(true);
    trackGameEvent('purchase_restore_started', { product: 'agent_wardrobe_pass' });
    try {
      const unlocked = await restoreWardrobeAccess();
      const refreshed = await loadWardrobeStore();
      setWardrobe({
        ...refreshed,
        unlocked: unlocked || refreshed.unlocked,
        message: unlocked || refreshed.unlocked ? 'Agent Pass restored.' : 'No Agent Pass purchase was found for this player.',
      });
      trackGameEvent(unlocked || refreshed.unlocked ? 'purchase_restore_succeeded' : 'purchase_restore_empty', { product: 'agent_wardrobe_pass' });
    } catch (error) {
      setWardrobe((current) => ({ ...current, message: error instanceof Error ? error.message : 'Purchases could not be restored.' }));
    } finally {
      setWardrobeBusy(false);
    }
  };

  const changeDifficulty = (nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty);
    window.localStorage.setItem('red-thread-difficulty', nextDifficulty);
  };
  const changeSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    window.localStorage.setItem('red-thread-sound', enabled ? 'on' : 'off');
  };
  const changeOutfit = (nextOutfit: OutfitId) => {
    if (nextOutfit !== 'classic' && !wardrobe.unlocked) return;
    setOutfit(nextOutfit);
    window.localStorage.setItem('red-thread-outfit', nextOutfit);
    trackGameEvent('outfit_selected', { outfit: nextOutfit, premium: nextOutfit !== 'classic' });
  };

  if (screen === 'game') return <MissionGame target={target} disguise={disguise} initialSuspicion={suspicion} outfit={outfit} difficulty={difficulty} soundEnabled={soundEnabled} onSoundChange={changeSound} onComplete={(value, quiet) => { setQuietEnding(quiet); setFinalExposure(value); setScreen('complete'); }} onFailure={(reason) => { trackGameEvent('mission_failed', { reason, difficulty, outfit, target, disguise }); setScreen('failed'); }} onAbort={() => setScreen('briefing')} />;
  if (screen === 'complete') return <MissionComplete quiet={quietEnding} target={target} exposure={finalExposure} outfit={outfit} onContinue={() => setScreen('teaser')} onRestart={() => setScreen('prologue')} />;
  if (screen === 'teaser') return <MissionTwoTeaser onRestart={() => setScreen('prologue')} />;
  if (screen === 'failed') return <MissionFailed onRestart={() => setScreen('briefing')} />;
  if (screen === 'chapter') return <ChapterCard target={target} disguise={disguise} onContinue={() => { trackGameEvent('mission_started', { difficulty, outfit, target, disguise }); setScreen('game'); }} />;
  if (screen === 'briefing') return <Briefing wardrobe={wardrobe} wardrobeBusy={wardrobeBusy} outfit={outfit} difficulty={difficulty} onDifficultyChange={changeDifficulty} onPurchaseWardrobe={buyWardrobe} onRestoreWardrobe={restoreWardrobe} onOutfitChange={changeOutfit} onStart={(nextTarget, nextDisguise) => { setTarget(nextTarget); setDisguise(nextDisguise); setScreen('chapter'); }} onBack={() => setScreen('cover')} />;
  if (screen === 'cover') return <CoverScene onComplete={(value) => { setSuspicion(value); setScreen('briefing'); }} />;
  return <Prologue onComplete={() => setScreen('cover')} />;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
