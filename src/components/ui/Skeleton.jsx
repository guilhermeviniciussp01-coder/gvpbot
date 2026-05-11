export function Skeleton({ width = '100%', height = '16px', borderRadius = '8px', style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      ...style
    }} />
  );
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', padding: '1.5rem', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px' }}>
      <Skeleton height="20px" width="60%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="14px" width={i === rows - 1 ? '40%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem', padding: '.75rem', background: 'rgba(255,255,255,.02)', borderRadius: '8px' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="14px" width={j === 0 ? '80%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function addShimmerCSS() {
  if (!document.getElementById('shimmer-css')) {
    const s = document.createElement('style');
    s.id = 'shimmer-css';
    s.textContent = `@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`;
    document.head.appendChild(s);
  }
}
