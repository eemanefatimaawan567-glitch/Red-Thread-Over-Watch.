import { useRef, type ButtonHTMLAttributes } from 'react';

/** Activate a deliberate touch on release, while leaving page scrolling available. */
export function NavigationButton({ onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);
  return <button {...props} type="button"
    onPointerDown={event => {
      if (event.pointerType !== 'mouse') start.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }}
    onPointerMove={event => {
      const point = start.current;
      if (point && Math.hypot(event.clientX - point.x, event.clientY - point.y) > 12) start.current = null;
    }}
    onPointerCancel={() => { start.current = null; }}
    onPointerUp={event => {
      const point = start.current;
      start.current = null;
      if (!point || point.id !== event.pointerId) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
      event.preventDefault();
      event.stopPropagation();
      // Dispatch the standard activation synchronously, then ignore its delayed compatibility click.
      event.currentTarget.click();
      suppressClickUntil.current = Date.now() + 700;
    }}
    onClick={event => {
      if (Date.now() < suppressClickUntil.current) { event.preventDefault(); return; }
      onClick?.(event);
    }}
  />;
}
