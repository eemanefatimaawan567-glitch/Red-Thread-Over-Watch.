import { useEffect, useRef, useState } from 'react';
import { NavigationButton } from './NavigationButton';

const lessons = [
  ['Follow Pip', 'Move right to reach Pip. Use → / D, or hold the glowing Move button.', 'Nice! Pip promises not to fly quite so fast.'],
  ['Small bird, good cover', 'Tap Crouch or press C. The crate blocks the practice guard’s view.', 'Hidden! Crouching helps, but solid cover is what blocks a guard’s view.'],
  ['Pop the practice target', 'Tap Fire or press Space three times. Aim assist handles this clear shot.', 'Pop, pop, pop! That was a target—not Pip.'],
  ['A clue worth keeping', 'Tap Collect or press E beside the glowing clue. In the mission, walk close to collect clues automatically.', 'A message from Ren: “Trust what you find, not every voice you hear.”'],
  ['Cut the transmission', 'Hold Interact or E until the circle fills. In the mission, find all three clues first.', 'Signal stopped. You’re ready, little bird.'],
];

export function FieldTraining({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [distance, setDistance] = useState(0);
  const [shots, setShots] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const held = useRef(false);
  const lastPointer = useRef(0);
  const actionRef = useRef<() => void>(() => {});
  const action = () => {
    if (done) return;
    if (step === 0 || step === 4) held.current = true;
    if (step === 1 || step === 3) setDone(true);
    if (step === 2) setShots(value => Math.min(3, value + 1));
  };
  actionRef.current = action;
  useEffect(() => {
    if (shots === 3 && step === 2) setDone(true);
  }, [shots, step]);
  useEffect(() => {
    if (distance >= 100 && step === 0 || progress >= 100 && step === 4) { held.current = false; setDone(true); }
  }, [distance, progress, step]);
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (!held.current || done) return;
      if (step === 0) setDistance(value => Math.min(100, value + 5));
      if (step === 4) setProgress(value => Math.min(100, value + 5));
    }, 60);
    return () => clearInterval(tick);
  }, [step, done]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const valid = step === 0 ? ['d', 'arrowright'] : step === 1 ? ['c'] : step === 2 ? [' '] : ['e', 'f'];
      if (!valid.includes(key)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat) actionRef.current();
    };
    const release = () => { held.current = false; };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', release);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', release);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
    };
  }, [step]);
  const labels = ['Hold Move →', 'Crouch', `Fire · ${shots}/3`, 'Collect clue', 'Hold Interact'];
  return <div className="mission-overlay training-overlay" onClick={event => event.stopPropagation()} data-testid="tutorial-overlay">
    <section>
      <span className="overlay-kicker">PIP’S PRACTICE ROOF · SAFE TRAINING</span>
      <div className="training-steps" aria-label={`Lesson ${step + 1} of 5`}>{lessons.map((_, i) => <i key={i} className={i < step || i === step && done ? 'done' : i === step ? 'current' : ''} />)}</div>
      <h2>{lessons[step][0]}</h2>
      <p>{lessons[step][1]}</p>
      <svg className="training-roof" viewBox="0 0 320 130" role="img" aria-label={done ? 'Practice action completed' : lessons[step][0]}>
        <path d="M10 109H310M20 120H300" stroke="#696081" strokeWidth="2" />
        {step === 1 && <><path d="M257 45L169 107V65Z" fill={done ? '#87debb22' : '#ffad7d44'} /><rect x="160" y="55" width="35" height="54" rx="5" fill="#656482" /><circle cx="267" cy="60" r="12" fill="#eaa78d" /></>}
        <g transform={`translate(${step === 0 ? 40 + distance * 1.6 : 120},${step === 1 && done ? 35 : 0}) scale(1,${step === 1 && done ? .65 : 1})`}>
          <rect x="-13" y="63" width="26" height="38" rx="10" fill="#999ce5" /><circle cy="48" r="18" fill="#f2bba9" /><path d="M-19 47Q-22 17 10 29Q27 31 17 45Z" fill="#6d548f" /><circle cx="6" cy="49" r="2.5" fill="#25283b" /><path d="M-6 100V110M8 100V110" stroke="#d8dcec" strokeWidth="7" />
        </g>
        {step === 0 && <g><ellipse cx="229" cy="54" rx="16" ry="12" fill="#c9b790" /><path d="M207 53L196 60M247 53L258 60" stroke="#97ddd7" strokeWidth="6" /><text x="229" y="28" textAnchor="middle" fill="#a2e8d3" fontSize="12">PIP</text></g>}
        {step === 2 && <g opacity={done ? .25 : 1}><circle cx="240" cy="64" r={25 - shots * 4} fill="#ffaf92" /><circle cx="240" cy="64" r="9" fill="#32344f" /><path d="M240 90V110" stroke="#77778f" strokeWidth="5" /></g>}
        {step === 3 && <g opacity={done ? .2 : 1}><path d="M235 38L251 60L235 82L219 60Z" fill="#96e6d1" /><text x="236" y="108" textAnchor="middle" fill="#96e6d1" fontSize="12">CLUE</text></g>}
        {step === 4 && <><rect x="210" y="30" width="55" height="78" rx="9" fill="#434b62" /><circle cx="237" cy="64" r="21" fill="none" stroke="#91e6cf" strokeWidth="5" strokeDasharray={`${progress * 1.32} 132`} transform="rotate(-90 237 64)" /><text x="237" y="69" textAnchor="middle" fill="#fff" fontSize="12">{progress}%</text></>}
      </svg>
      <div className="training-feedback" role="status" aria-live="polite">{done ? lessons[step][2] : 'No damage. No countdown. Take your time.'}</div>
      {!done ? <button className="primary-cta training-action" type="button"
        onPointerDown={event => { event.preventDefault(); lastPointer.current = Date.now(); event.currentTarget.setPointerCapture(event.pointerId); action(); }}
        onPointerUp={() => { held.current = false; }} onPointerCancel={() => { held.current = false; }} onLostPointerCapture={() => { held.current = false; }}
        onClick={event => { if (event.detail === 0 && Date.now() - lastPointer.current > 700) { if (step === 0) setDistance(100); else if (step === 4) setProgress(100); else action(); } }}
      >{labels[step]}</button> : <NavigationButton className="primary-cta" onClick={() => { held.current = false; if (step === 4) onComplete(); else { setStep(step + 1); setDone(false); } }}>{step === 4 ? 'Start my mission →' : 'Next lesson →'}</NavigationButton>}
      <NavigationButton className="training-skip" onClick={onComplete}>I know the controls · skip practice</NavigationButton>
    </section>
  </div>;
}
