import { useRef, useState, useEffect, memo } from 'react';

// Renders children only when the placeholder enters the viewport (+ rootMargin buffer).
// Reserves `minHeight` space while invisible to reduce layout shift.
function LazySection({ children, minHeight = 400, rootMargin = '200px 0px' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={!visible ? { minHeight } : undefined}>
      {visible && children}
    </div>
  );
}

export default memo(LazySection);
