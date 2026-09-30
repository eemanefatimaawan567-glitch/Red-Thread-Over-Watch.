import { useEffect, useRef, type ReactNode } from 'react';

/** Pointer capture keeps a held control reliable when a finger slides off it. */
export function TouchControl({ children, label, className, pressed, onPress, onRelease, repeat = false }: {
  children: ReactNode; label: string; className?: string; pressed?: boolean;
  onPress: () => void; onRelease?: () => void; repeat?: boolean;
}) {
  const callbacks = useRef({ onPress, onRelease });
  callbacks.current = { onPress, onRelease };
  const pointer = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const release = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (pointer.current !== null) callbacks.current.onRelease?.();
    pointer.current = null;
  };
  useEffect(() => {
    const hidden = () => { if (document.hidden) release(); };
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', hidden);
    return () => { release(); window.removeEventListener('blur', release); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  return <button type="button" className={className} aria-label={label} aria-pressed={pressed}
    onPointerDown={event => {
      event.preventDefault(); event.stopPropagation();
      if (pointer.current !== null) return;
      pointer.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      callbacks.current.onPress();
      if (repeat) timer.current = setInterval(() => callbacks.current.onPress(), 400);
    }}
    onPointerUp={event => { event.preventDefault(); event.stopPropagation(); if (event.pointerId === pointer.current) release(); }}
    onPointerCancel={event => { if (event.pointerId === pointer.current) release(); }}
    onLostPointerCapture={event => { if (event.pointerId === pointer.current) release(); }}
    onClick={event => { event.preventDefault(); event.stopPropagation(); if (event.detail === 0) { callbacks.current.onPress(); callbacks.current.onRelease?.(); } }}
  >{children}</button>;
}
