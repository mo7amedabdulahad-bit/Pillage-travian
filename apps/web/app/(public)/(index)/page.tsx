import { useEffect, useRef } from 'react';
import { Link } from 'react-router';

const SwordIcon = () => (
  <svg
    className="size-5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="presentation"
  >
    <path d="M14.5 2l6 6-2 2-6-6z" />
    <path d="M12.5 4l-8 8 2 2 8-8z" />
    <path d="M4 20l4-4" />
    <path d="M2 22l4-4" />
    <path d="M18 14l4-4" />
  </svg>
);

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    const children = el.querySelectorAll('.lp-scroll-reveal');
    for (const child of children) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}

const HomePage = () => {
  const sectionsRef = useScrollReveal();

  return (
    <>
      <title>Pillage First! (Ask Questions Later)</title>
      <style>{`
        .lp-cta-btn {
          background: linear-gradient(135deg, var(--lp-gold), #a07530);
          border: 1px solid var(--lp-gold-light);
          color: #0d0b08;
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 1.125rem;
          padding: 0.875rem 2.5rem;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          min-height: 48px;
        }
        .lp-cta-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(232,185,106,0.3),
            transparent
          );
          transition: left 0.5s ease;
        }
        .lp-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(200,147,58,0.4);
        }
        .lp-cta-btn:hover::after {
          left: 100%;
        }
        .lp-cta-btn:active {
          transform: translateY(0);
        }
      `}</style>

      <main
        className="min-h-screen"
        style={{ background: 'var(--lp-bg)' }}
      >
        {/* ── SECTION 1: HERO ── */}
        <section
          className="relative flex items-center"
          style={{
            minHeight: '100dvh',
            background:
              'linear-gradient(to right, rgba(13,11,8,0.95) 0%, rgba(13,11,8,0.7) 50%, rgba(13,11,8,0.3) 100%), url("/landing/hero-bg.jpg") center/cover no-repeat',
          }}
        >
          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-16 flex items-center justify-center min-h-[70dvh]">
            <div className="lp-fade-up text-center max-w-[640px]">
              <h1
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  color: 'var(--lp-gold)',
                  fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                  lineHeight: 1.1,
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                }}
              >
                PILLAGE FIRST!
              </h1>
              <p
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: 'var(--lp-gold-light)',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.75rem)',
                  fontStyle: 'italic',
                  marginBottom: '1.5rem',
                }}
              >
                Ask Questions Later
              </p>
              <p
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  color: 'var(--lp-text)',
                  fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
                  lineHeight: 1.6,
                  maxWidth: '480px',
                  margin: '0 auto 2rem',
                }}
              >
                Single-player village strategy. Build your empire at your own
                pace. No opponents. No servers. No waiting.
              </p>
              <Link to="/game-worlds/create">
                <button
                  type="button"
                  className="lp-cta-btn flex items-center gap-2 mx-auto"
                >
                  <SwordIcon />
                  PLAY NOW
                </button>
              </Link>
            </div>
          </div>
        </section>

        <div ref={sectionsRef}>
          {/* ── SECTION 2: THE STORY ── */}
          <section
            className="lp-scroll-reveal py-16 md:py-24 px-6"
            style={{ background: 'var(--lp-bg)' }}
          >
            <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-center">
              {/* Left: text */}
              <div>
                <h2
                  style={{
                    fontFamily: "'Cinzel', serif",
                    color: 'var(--lp-gold)',
                    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                    fontWeight: 600,
                    marginBottom: '1.5rem',
                  }}
                >
                  One Village. One Commander. One Ambition.
                </h2>
                <div
                  style={{
                    fontFamily: "'Crimson Pro', serif",
                    color: 'var(--lp-text)',
                    fontSize: '1.1rem',
                    lineHeight: 1.7,
                  }}
                >
                  <p style={{ marginBottom: '1rem' }}>
                    You arrive with a handful of settlers and a plot of barren
                    land. What you do next defines history. Raise buildings from
                    timber and stone. Expand your resource fields to feed a
                    growing workforce. Every decision — from which quarry to
                    upgrade first to how many soldiers to train — shapes the
                    fate of your dominion.
                  </p>
                  <p>
                    Send your troops to plunder NPC villages for supplies. Seize
                    control of oases scattered across the wilderness for vital
                    production bonuses. Send your hero into dangerous adventures
                    to earn rare equipment and experience. There are no other
                    players to outmaneuver. The world exists for you to conquer
                    — at your own pace, on your own terms.
                  </p>
                </div>
              </div>

              {/* Right: village image */}
              <div className="hidden lg:block">
                <img
                  src="/landing/village.jpg"
                  alt="Village overview"
                  className="w-full h-auto object-cover rounded-sm"
                  style={{
                    border: '2px solid rgba(200,147,58,0.4)',
                    filter: 'sepia(20%) contrast(110%)',
                  }}
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* ── SECTION 3: GAMEPLAY PILLARS ── */}
          <section
            className="lp-scroll-reveal py-16 md:py-24 px-6"
            style={{ background: 'var(--lp-surface)' }}
          >
            <div className="max-w-[900px] mx-auto">
              <h2
                className="text-center"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: 'var(--lp-gold)',
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  fontWeight: 600,
                  marginBottom: '2.5rem',
                }}
              >
                The Path to Dominance
              </h2>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <PillarCard
                  imageSrc="/landing/feature-build.jpg"
                  imageAlt="Village construction"
                  title="BUILD"
                  description="Raise a village from dirt roads into a fortified settlement. Expand resource fields and construct specialized buildings."
                />
                <PillarCard
                  imageSrc="/landing/troops.jpg"
                  imageAlt="Troops training"
                  title="TRAIN"
                  description="Recruit infantry, cavalry, and siege engines. Your army composition determines victory or defeat."
                />
                <PillarCard
                  imageSrc="/landing/feature-raid.jpg"
                  imageAlt="Raiding party"
                  title="RAID"
                  description="Launch raids against NPC villages to plunder resources. Strike fast and carry the loot home."
                />
                <PillarCard
                  imageSrc="/landing/feature-conquer.jpg"
                  imageAlt="Conquering territory"
                  title="CONQUER"
                  description="Seize resource oases across the map. Each conquered oasis grants passive bonuses to your production."
                />
              </div>
            </div>
          </section>

          {/* ── SECTION 4: WHY SINGLE PLAYER ── */}
          <section
            className="lp-scroll-reveal py-16 md:py-24 px-6"
            style={{ background: 'var(--lp-bg)' }}
          >
            <div className="max-w-[700px] mx-auto text-center">
              <h2
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: 'var(--lp-gold)',
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  fontWeight: 600,
                  marginBottom: '2.5rem',
                }}
              >
                Your World. Your Pace.
              </h2>

              <div
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  color: 'var(--lp-text-muted)',
                  fontSize: '1.15rem',
                  lineHeight: 2,
                  textAlign: 'left',
                }}
              >
                <p>— No enemies attacking while you sleep</p>
                <p>— No alliances, diplomacy, or server politics</p>
                <p>— Progress saves locally. Play anywhere, anytime.</p>
              </div>
            </div>
          </section>

          {/* ── SECTION 5: FINAL CTA ── */}
          <section
            className="lp-scroll-reveal py-20 md:py-28 px-6"
            style={{ background: '#080706' }}
          >
            <div className="max-w-[600px] mx-auto text-center">
              <h2
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  color: 'var(--lp-gold)',
                  fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                  fontWeight: 700,
                  marginBottom: '1rem',
                }}
              >
                Your Village Awaits.
              </h2>
              <p
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  color: 'var(--lp-text-muted)',
                  fontSize: '1.1rem',
                  marginBottom: '2rem',
                }}
              >
                No account needed. Progress saved on your device.
              </p>
              <Link to="/game-worlds/create">
                <button
                  type="button"
                  className="lp-cta-btn flex items-center gap-2 mx-auto"
                >
                  <SwordIcon />
                  PLAY NOW
                </button>
              </Link>
              <p
                className="mt-12"
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  color: 'var(--lp-border)',
                  fontSize: '0.85rem',
                }}
              >
                Pillage First! — A private fan project
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

function PillarCard({
  imageSrc,
  imageAlt,
  title,
  description,
}: {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
}) {
  return (
    <article
      className="overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--lp-surface)',
        border: '1px solid var(--lp-border)',
        borderTop: '2px solid var(--lp-gold)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderTopColor = 'var(--lp-gold-light)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderTopColor = 'var(--lp-gold)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full object-cover"
        style={{ height: 160 }}
        loading="lazy"
      />
      <div className="p-4 md:p-5">
        <h3
          style={{
            fontFamily: "'Cinzel', serif",
            color: 'var(--lp-gold)',
            fontSize: '0.95rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "'Crimson Pro', serif",
            color: 'var(--lp-text-muted)',
            fontSize: '0.95rem',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
    </article>
  );
}

export default HomePage;
