import { Link } from 'react-router';
import { Button } from 'app/components/ui/button';

const StoneTexture = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
    role="presentation"
  >
    <filter id="stone-noise">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.65"
        numOctaves="3"
        stitchTiles="stitch"
      />
      <feColorMatrix
        type="saturate"
        values="0"
      />
    </filter>
    <rect
      width="100%"
      height="100%"
      filter="url(#stone-noise)"
    />
  </svg>
);

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

const SectionNumeral = ({ children }: { children: string }) => (
  <span
    className="font-[Cinzel] text-[var(--war-gold)] text-sm tracking-[0.2em] uppercase select-none"
    aria-hidden
  >
    {children}
  </span>
);

const IconDivider = () => (
  <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-center gap-3 py-2">
    <div className="h-px flex-1 bg-linear-to-r from-transparent to-[var(--stone-700)]" />
    <img
      src="/graphic-packs/day/icons/resources/lumber_tiny.png"
      alt=""
      loading="lazy"
      className="size-6 opacity-30"
      aria-hidden
    />
    <img
      src="/graphic-packs/day/icons/resources/clay_tiny.png"
      alt=""
      loading="lazy"
      className="size-6 opacity-30"
      aria-hidden
    />
    <img
      src="/graphic-packs/day/icons/resources/iron_tiny.png"
      alt=""
      loading="lazy"
      className="size-6 opacity-30"
      aria-hidden
    />
    <img
      src="/graphic-packs/day/icons/resources/crop_tiny.png"
      alt=""
      loading="lazy"
      className="size-6 opacity-30"
      aria-hidden
    />
    <div className="h-px flex-1 bg-linear-to-l from-transparent to-[var(--stone-700)]" />
  </div>
);

const PillarImage = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative group overflow-hidden rounded border border-[var(--stone-700)] bg-[var(--stone-900)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,147,58,0.3)]">
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full h-40 md:h-48 object-contain p-4 transition-transform duration-500 group-hover:scale-105"
    />
  </div>
);

const Pillar = ({
  numeral,
  title,
  description,
  imageSrc,
  imageAlt,
  align = 'left',
}: {
  numeral: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  align?: 'left' | 'right';
}) => {
  const imageOrder = align === 'right' ? 'md:order-2' : 'md:order-1';
  const textOrder = align === 'right' ? 'md:order-1' : 'md:order-2';
  const textAlign =
    align === 'right'
      ? 'md:items-end md:text-right'
      : 'md:items-start md:text-left';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center py-6">
      <div className={imageOrder}>
        <PillarImage
          src={imageSrc}
          alt={imageAlt}
        />
      </div>
      <div className={`flex flex-col gap-3 ${textOrder} ${textAlign}`}>
        <SectionNumeral>{numeral}</SectionNumeral>
        <h3 className="font-[Cinzel] text-[var(--parchment)] text-xl md:text-2xl font-semibold tracking-wide">
          {title}
        </h3>
        <p className="font-[Crimson_Pro] text-[var(--parchment-dim)] text-base md:text-lg leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

const HomePage = () => {
  return (
    <>
      <title>Pillage First! (Ask Questions Later)</title>
      <style>{`
        .cta-shimmer {
          background-image: linear-gradient(
            110deg,
            var(--war-gold) 0%,
            var(--war-gold) 40%,
            #e8b85e 50%,
            var(--war-gold) 60%,
            var(--war-gold) 100%
          );
          background-size: 200% 100%;
        }
        .cta-shimmer:hover {
          animation: shimmer-sweep 1.5s ease-in-out infinite;
        }
      `}</style>
      <main className="bg-[var(--stone-950)] min-h-screen overflow-x-hidden">
        {/* ── SECTION 1: Hero ── */}
        <section className="relative flex flex-col min-h-[100dvh]">
          {/* Village background image */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src="/graphic-packs/day/backgrounds/bgBuildings.jpg"
              alt=""
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-20"
              aria-hidden
            />
            {/* Dark gradient overlay — stronger on left for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, rgba(26,22,17,0.95) 0%, rgba(26,22,17,0.7) 50%, rgba(26,22,17,0.4) 100%)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, var(--stone-950) 0%, transparent 30%)',
              }}
            />
          </div>

          {/* Atmospheric resource icons — scattered in background */}
          <img
            src="/graphic-packs/day/icons/resources/lumber_small.png"
            alt=""
            loading="eager"
            className="absolute top-[15%] right-[8%] size-16 opacity-[0.05] pointer-events-none hidden md:block"
            aria-hidden
          />
          <img
            src="/graphic-packs/day/icons/resources/clay_small.png"
            alt=""
            loading="eager"
            className="absolute top-[60%] right-[15%] size-14 opacity-[0.04] pointer-events-none hidden md:block"
            aria-hidden
          />
          <img
            src="/graphic-packs/day/icons/resources/iron_small.png"
            alt=""
            loading="eager"
            className="absolute bottom-[25%] left-[5%] size-12 opacity-[0.05] pointer-events-none hidden md:block"
            aria-hidden
          />
          <img
            src="/graphic-packs/day/icons/resources/crop_small.png"
            alt=""
            loading="eager"
            className="absolute top-[30%] left-[12%] size-10 opacity-[0.04] pointer-events-none hidden md:block"
            aria-hidden
          />

          <StoneTexture />

          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-[var(--war-gold-dim)] to-transparent opacity-60 z-10" />

          {/* Content: text left, building right on desktop */}
          <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center max-w-7xl mx-auto w-full px-4 gap-8 md:gap-12">
            {/* Left: text content */}
            <div className="flex flex-col gap-5 md:gap-6 md:flex-1 text-center md:text-left">
              <h1
                className="font-[Cinzel] text-[var(--parchment)] text-4xl sm:text-5xl md:text-6xl font-black tracking-wider leading-tight uppercase"
                style={{ textShadow: '0 2px 30px rgba(0,0,0,0.7)' }}
              >
                Pillage First!
              </h1>
              <p className="font-[Cinzel] text-[var(--war-gold)] text-base sm:text-lg md:text-xl font-semibold tracking-[0.15em] uppercase">
                Build. Raid. Conquer. Repeat.
              </p>
              <p className="font-[Crimson_Pro] text-[var(--parchment-dim)] text-lg md:text-xl leading-relaxed">
                Single-player strategy. No waiting for other players.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mt-2">
                <Link to="/game-worlds/create">
                  <Button
                    size="lg"
                    className="cta-shimmer font-[Cinzel] text-[var(--stone-950)] text-base md:text-lg px-8 py-6 font-bold tracking-wider uppercase shadow-lg shadow-[var(--war-gold)]/20 transition-all hover:shadow-[var(--war-gold)]/40 cursor-pointer"
                  >
                    <SwordIcon />
                    Begin Your Campaign
                  </Button>
                </Link>
                <Link to="/game-worlds">
                  <Button
                    variant="outline"
                    className="font-[Crimson_Pro] border-[var(--stone-600)] text-[var(--parchment-dim)] hover:bg-[var(--stone-800)] hover:text-[var(--parchment)] cursor-pointer"
                  >
                    Existing game worlds
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Main Building image — emerging from darkness */}
            <div className="relative md:flex-1 flex justify-center md:justify-end">
              <div className="relative">
                {/* Ambient glow behind building */}
                <div
                  className="absolute inset-0 blur-3xl opacity-20"
                  style={{
                    background:
                      'radial-gradient(circle, var(--war-gold-dim) 0%, transparent 70%)',
                  }}
                  aria-hidden
                />
                <img
                  src="/graphic-packs/day/buildings/roman/g31Top.png"
                  alt="Roman Main Building — the heart of your village"
                  loading="eager"
                  className="relative w-56 sm:w-64 md:w-80 lg:w-96 h-auto drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
                />
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[var(--stone-950)] to-transparent z-10" />
        </section>

        {/* ── SECTION 2: What is this game ── */}
        <section className="relative px-4 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-start">
              <div className="max-w-2xl">
                <SectionNumeral>The Game</SectionNumeral>
                <h2 className="font-[Cinzel] text-[var(--parchment)] text-2xl md:text-3xl font-bold tracking-wide mt-4 mb-6">
                  A village is only as strong as its last raid.
                </h2>
                <div className="font-[Crimson_Pro] text-[var(--parchment-dim)] text-lg md:text-xl leading-relaxed space-y-4">
                  <p>
                    You start with a handful of settlers and a plot of land.
                    Harvest resources. Raise buildings. Train soldiers from
                    nothing into a war machine.
                  </p>
                  <p>
                    Send your troops to plunder NPC villages, seize control of
                    oases for vital bonuses, and send your hero into dangerous
                    adventures across the map. Every decision shapes your
                    dominion.
                  </p>
                  <p>
                    There are no other players to outmaneuver or wait on. The
                    world exists for you to conquer at your own pace.
                  </p>
                </div>
                <div className="mt-8 flex gap-3">
                  <Link to="/frequently-asked-questions">
                    <Button
                      variant="ghost"
                      className="font-[Crimson_Pro] text-[var(--parchment-dim)] hover:bg-[var(--stone-800)] hover:text-[var(--parchment)] cursor-pointer"
                    >
                      Frequently asked questions
                    </Button>
                  </Link>
                  <Link to="/latest-updates">
                    <Button
                      variant="ghost"
                      className="font-[Crimson_Pro] text-[var(--parchment-dim)] hover:bg-[var(--stone-800)] hover:text-[var(--parchment)] cursor-pointer"
                    >
                      Latest updates
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Village map tile decoration */}
              <div className="hidden md:flex flex-col gap-2 items-center opacity-40 pt-12">
                <img
                  src="/graphic-packs/default/map/villages/dorf3_5.png"
                  alt=""
                  loading="lazy"
                  className="w-24 h-auto"
                  aria-hidden
                />
                <img
                  src="/graphic-packs/default/map/villages/dorf2_3.png"
                  alt=""
                  loading="lazy"
                  className="w-20 h-auto"
                  aria-hidden
                />
                <img
                  src="/graphic-packs/default/map/villages/dorf1_1.png"
                  alt=""
                  loading="lazy"
                  className="w-16 h-auto"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </section>

        <IconDivider />

        {/* ── SECTION 3: Core gameplay pillars ── */}
        <section className="relative px-4 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <SectionNumeral>Mechanics</SectionNumeral>
              <h2 className="font-[Cinzel] text-[var(--parchment)] text-2xl md:text-3xl font-bold tracking-wide mt-4">
                The pillars of your campaign
              </h2>
            </div>

            <div className="flex flex-col gap-6">
              <Pillar
                numeral="I"
                title="Build"
                description="Raise a village from dirt roads and timber frames into a fortified settlement. Expand resource fields, construct specialized buildings, and optimize production to fuel your war effort."
                imageSrc="/graphic-packs/day/buildings/roman/g17.png"
                imageAlt="Barracks — where your army begins"
              />
              <Pillar
                numeral="II"
                title="Train"
                description="Recruit infantry, cavalry, and siege engines from your barracks and stables. Each unit has strengths and weaknesses — your army composition determines victory or defeat."
                imageSrc="/graphic-packs/day/icons/units/roman/section/t5.png"
                imageAlt="Roman legionnaire ready for battle"
                align="right"
              />
              <Pillar
                numeral="III"
                title="Raid"
                description="Launch raids against NPC villages to plunder resources. The spoils of war are what keep your empire growing. Strike fast, strike hard, and carry the loot home."
                imageSrc="/graphic-packs/day/icons/units/teuton/section/t3.png"
                imageAlt="Teuton cavalry — the raiding force"
              />
              <Pillar
                numeral="IV"
                title="Conquer Oases"
                description="Seize resource oases scattered across the map. Each conquered oasis grants passive bonuses to your production — wood, clay, iron, or wheat. Territory means power."
                imageSrc="/graphic-packs/default/map/oasis/wheat/2-0-0-0.avif"
                imageAlt="A wheat oasis on the map — conquer it for resource bonuses"
                align="right"
              />
              <Pillar
                numeral="V"
                title="Hero Adventures"
                description="Send your hero on dangerous adventures to earn experience, equipment, and rare rewards. Level up your champion and equip them with artifacts that tip the scales in battle."
                imageSrc="/hero-assets/backgrounds/heroPageBackground.jpg"
                imageAlt="Your hero's domain — equip, customize, and send to battle"
              />
            </div>

            <div className="mt-12 flex gap-3">
              <Link to="/get-involved">
                <Button
                  variant="outline"
                  className="font-[Crimson_Pro] border-[var(--stone-600)] text-[var(--parchment-dim)] hover:bg-[var(--stone-800)] hover:text-[var(--parchment)] cursor-pointer"
                >
                  Get involved
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <IconDivider />

        {/* ── SECTION 4: Why single player ── */}
        <section className="relative px-4 py-16 md:py-24">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 30% 50%, var(--stone-900) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-center">
              <div className="max-w-2xl">
                <SectionNumeral>Design Philosophy</SectionNumeral>
                <h2 className="font-[Cinzel] text-[var(--parchment)] text-2xl md:text-3xl font-bold tracking-wide mt-4 mb-6">
                  No allies. No enemies. No schedule.
                </h2>
                <div className="font-[Crimson_Pro] text-[var(--parchment-dim)] text-lg md:text-xl leading-relaxed space-y-4">
                  <p>
                    This is not a game where you log in to find your village in
                    ashes because someone attacked while you slept. There is no
                    arms race, no alliances to maintain, no politics.
                  </p>
                  <p>
                    Pure strategy. You fight the world on your terms. Every
                    raid, every building upgrade, every troop movement happens
                    when you decide — not when a timer or another player forces
                    your hand.
                  </p>
                </div>
              </div>

              {/* Resource icons as decorative column */}
              <div className="hidden md:flex flex-col gap-4 items-center opacity-30">
                <img
                  src="/graphic-packs/day/icons/resources/resources_medium.png"
                  alt=""
                  loading="lazy"
                  className="w-20 h-auto"
                  aria-hidden
                />
                <div className="grid grid-cols-2 gap-3">
                  <img
                    src="/graphic-packs/day/icons/resources/lumber_medium.png"
                    alt=""
                    loading="lazy"
                    className="size-10"
                    aria-hidden
                  />
                  <img
                    src="/graphic-packs/day/icons/resources/clay_medium.png"
                    alt=""
                    loading="lazy"
                    className="size-10"
                    aria-hidden
                  />
                  <img
                    src="/graphic-packs/day/icons/resources/iron_medium.png"
                    alt=""
                    loading="lazy"
                    className="size-10"
                    aria-hidden
                  />
                  <img
                    src="/graphic-packs/day/icons/resources/crop_medium.png"
                    alt=""
                    loading="lazy"
                    className="size-10"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <IconDivider />

        {/* ── SECTION 5: Final CTA ── */}
        <section className="relative px-4 py-16 md:py-24">
          <StoneTexture />
          {/* Faint building silhouettes in background */}
          <img
            src="/graphic-packs/day/buildings/roman/g31Top.png"
            alt=""
            loading="lazy"
            className="absolute bottom-0 right-[5%] w-48 md:w-72 opacity-[0.04] pointer-events-none"
            aria-hidden
          />
          <img
            src="/graphic-packs/day/buildings/roman/g17.png"
            alt=""
            loading="lazy"
            className="absolute bottom-0 left-[10%] w-32 md:w-48 opacity-[0.03] pointer-events-none"
            aria-hidden
          />

          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <h2 className="font-[Cinzel] text-[var(--parchment)] text-2xl md:text-4xl font-bold tracking-wide mb-4">
              Ready to pillage?
            </h2>
            <p className="font-[Crimson_Pro] text-[var(--parchment-dim)] text-lg md:text-xl mb-8">
              No account needed. Your progress saves locally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/game-worlds/create">
                <Button
                  size="lg"
                  className="cta-shimmer font-[Cinzel] text-[var(--stone-950)] text-base md:text-lg px-8 py-6 font-bold tracking-wider uppercase shadow-lg shadow-[var(--war-gold)]/20 transition-all hover:shadow-[var(--war-gold)]/40 cursor-pointer"
                >
                  <SwordIcon />
                  Begin Your Campaign
                </Button>
              </Link>
              <Link to="/game-worlds">
                <Button
                  variant="outline"
                  className="font-[Crimson_Pro] border-[var(--stone-600)] text-[var(--parchment-dim)] hover:bg-[var(--stone-800)] hover:text-[var(--parchment)] cursor-pointer"
                >
                  Existing game worlds
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-2 justify-center">
              <a
                href="https://discord.gg/Ep7NKVXUZA"
                rel="noopener noreferrer"
                target="_blank"
                className="font-[Crimson_Pro] text-[var(--stone-600)] hover:text-[var(--parchment-dim)] text-sm transition-colors"
              >
                Discord
              </a>
              <span className="text-[var(--stone-700)] hidden sm:inline">
                |
              </span>
              <a
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                rel="noopener noreferrer"
                target="_blank"
                className="font-[Crimson_Pro] text-[var(--stone-600)] hover:text-[var(--parchment-dim)] text-sm transition-colors"
              >
                GitHub
              </a>
              <span className="text-[var(--stone-700)] hidden sm:inline">
                |
              </span>
              <Link
                to="/get-involved"
                className="font-[Crimson_Pro] text-[var(--stone-600)] hover:text-[var(--parchment-dim)] text-sm transition-colors"
              >
                Get involved
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default HomePage;
