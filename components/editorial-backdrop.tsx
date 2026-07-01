/**
 * Premium "printed-ink" backdrop for the login pages.
 * A dark base with a faint AI-hands video (robot reaching toward a human hand,
 * Creation-of-Adam motif), a green halftone dot grid, and fractal-noise film
 * grain. Keeps the dark/green brand theme.
 *
 * Footage: robot arm / human arm, washed-out and desaturated. The video plays
 * by default; `poster` covers loading and load-failure, and a static image is
 * shown instead when the user prefers reduced motion (see globals.css).
 * Style tunables live in globals.css: `.login-video` / `.login-photo` (opacity).
 */
export function EditorialBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 0a. faint AI-hands video — plays by default; poster is the load fallback */}
      <video
        className="login-video absolute inset-0 h-full w-full"
        autoPlay
        loop
        muted
        playsInline
        poster="/ai-hands.jpg"
      >
        <source src="/ai-hands.mp4" type="video/mp4" />
      </video>

      {/* 0b. static image — shown only for prefers-reduced-motion */}
      <div className="login-photo absolute inset-0" />

      {/* 1. radial glow — subtle green depth toward the center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,102,0.06),transparent_65%)]" />

      {/* 2. halftone dot grid — faint green dots, faded toward the edges */}
      <div className="login-dots absolute inset-0" />

      {/* 3. film grain — fractal noise blended over the dark base */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08] mix-blend-overlay">
        <filter id="editorial-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#editorial-grain)" />
      </svg>

      {/* 4. edge vignette — blends the footage into the dark background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--background))]" />
    </div>
  );
}
