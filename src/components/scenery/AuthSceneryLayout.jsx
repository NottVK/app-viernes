import { useEffect, useState } from 'react'
import { getAuthTimeConfig } from '../../utils/timeOfDay'
import './auth-scenery.css'

const BASE = import.meta.env.BASE_URL

const STARS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  left: `${(i * 19 + (i % 6) * 13) % 100}%`,
  top: `${(i * 11 + (i % 4) * 17) % 45}%`,
  size: 1 + (i % 3) * 0.5,
  twinkleDelay: `${(i % 8) * 0.3}s`,
  driftDur: `${10 + (i % 9) * 1.4}s`,
  driftDelay: `${(i % 12) * 0.35}s`,
  dx: `${((i % 5) - 2) * 1.2}px`,
  dy: `${(((i * 3) % 5) - 2) * 1.2}px`,
}))

export default function AuthSceneryLayout({
  title,
  subtitle,
  children,
  footer,
  variant = 'login',
}) {
  const [photoReady, setPhotoReady] = useState(false)
  const timeConfig = getAuthTimeConfig()

  useEffect(() => {
    const img = new Image()
    img.onload = () => setPhotoReady(true)
    img.onerror = () => setPhotoReady(false)
    img.src = `${BASE}auth/sakura-landscape.webp`
  }, [])

  return (
    <div className={`auth-scene auth-scene--${variant} auth-scene--time-${timeConfig.period}`}>
      <div className="auth-scene__sky" aria-hidden="true" />
      <div
        className={`auth-scene__photo ${photoReady ? 'auth-scene__photo--loaded' : ''}`}
        style={photoReady ? { backgroundImage: `url(${BASE}auth/sakura-landscape.webp)` } : undefined}
        aria-hidden="true"
      />
      <div className="auth-scene__photo-fallback" aria-hidden="true" />
      <div className="auth-scene__time-tint" aria-hidden="true" />
      <div className="auth-scene__mist" aria-hidden="true" />
      <div className="auth-scene__light" aria-hidden="true" />
      <div className="auth-scene__vignette" aria-hidden="true" />

      {timeConfig.showStars && (
        <div className="auth-scene__stars" aria-hidden="true">
          {STARS.map((s) => (
            <span
              key={s.id}
              className="auth-scene__star"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                '--star-twinkle-delay': s.twinkleDelay,
                '--star-drift-dur': s.driftDur,
                '--star-drift-delay': s.driftDelay,
                '--star-dx': s.dx,
                '--star-dy': s.dy,
              }}
            />
          ))}
        </div>
      )}

      <div className="auth-scene__scroll">
        <div className="auth-scene__brand">
          <span className="auth-scene__brand-greeting">{timeConfig.greeting}</span>
          <span className="auth-scene__brand-name">SofKev</span>
        </div>

        <div className="auth-glass">
          <header className="auth-glass__header">
            <h1 className="auth-glass__title">{title}</h1>
            {subtitle && <p className="auth-glass__subtitle">{subtitle}</p>}
          </header>
          {children}
          {footer && <footer className="auth-glass__footer">{footer}</footer>}
        </div>
      </div>
    </div>
  )
}
