import { Link } from 'react-router';
import { Button } from 'app/components/ui/button';

const StoneTexture = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
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

const DividerLine = () => (
  <div className="w-full max-w-7xl mx-auto px-4">
    <div className="h-px bg-linear-to-r from-transparent via-[var(--stone-600)] to-transparent" />
  </div>
);

const SectionNumeral = ({ children }: { children: string }) => (
  <span
    className="font-[Cinzel] text-[var(--war-gold)] text-sm tracking-[0.2em] uppercase select-none"
    aria-hidden
  >
    {children}
  </span>
);

const Pillar = ({
  numeral,
  title,
  description,
  align = 'left',
}: {
  numeral: string;
  title: string;
  description: string;
  align?: 'left' | 'right';
}) => (
  <div
    className={`flex flex-col gap-3 py-8 ${align === 'right' ? 'md:items-end md:text-right md:ml-auto md:pr-0' : 'md:items-start md:text-left md:mr-auto md:pl-0'} max-w-xl`}
  >
    <SectionNumeral>{numeral}</SectionNumeral>
    <h3 className="font-[Cinzel] text-[var(--parchment)] text-xl md:text-2xl font-semibold tracking-wide">
      {title}
    </h3>
    <p className="font-[Crimson_Pro] text-[var(--parchment-dim)] text-base md:text-lg leading-relaxed">
      {description}
    </p>
  </div>
);

const HomePage = () => {
  return (
    <>
      <title>Pillage First! (Ask Questions Later)</title>
      <main className="bg-[var(--stone-950)] min-h-screen overflow-x-hidden">
        {/* ── SECTION 1: Hero ── */}
        <section className="relative flex flex-col items-center justify-center min-h-[100dvh] px-4 text-center">
          {/* Background layers */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 40%, var(--stone-900) 0%, var(--stone-950) 70%)',
            }}
          />
          <StoneTexture />

          {/* Decorative border accents */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-[var(--war-gold-dim)] to-transparent opacity-60" />

          <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl mx-auto">
            <h1
              className="font-[Cinzel] text-[var(--parchment)] text-4xl sm:text-5xl md:text-6xl font-black tracking-wider leading-tight uppercase"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}
            >
              Pillage First!
            </h1>
            <p className="font-[Cinzel] text-[var(--war-gold)] text-base sm:text-lg md:text-xl font-semibold tracking-[0.15em] uppercase">
              Build. Raid. Conquer. Repeat.
            </p>
            <p className="font-[Crimson_Pro] text-[var(--parchment-dim)] text-lg md:text-xl leading-relaxed">
              Single-player strategy. No waiting for other players.
            </p>
            <div className="mt-4">
              <Link to="/game-worlds/create">
                <Button
                  size="lg"
                  className="font-[Cinzel] bg-[var(--war-gold)] text-[var(--stone-950)] hover:bg-[var(--war-gold-dim)] text-base md:text-lg px-8 py-6 font-bold tracking-wider uppercase shadow-lg shadow-[var(--war-gold)]/20 transition-all hover:shadow-[var(--war-gold)]/40 cursor-pointer"
                >
                  Begin Your Campaign
                </Button>
              </Link>
            </div>
            <div className="mt-2 flex gap-3">
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

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[var(--stone-950)] to-transparent" />
        </section>

        {/* ── SECTION 2: What is this game ── */}
        <section className="relative px-4 py-20 md:py-28">
          <div className="max-w-7xl mx-auto">
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
          </div>
        </section>

        <DividerLine />

        {/* ── SECTION 3: Core gameplay pillars ── */}
        <section className="relative px-4 py-20 md:py-28">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <SectionNumeral>Mechanics</SectionNumeral>
              <h2 className="font-[Cinzel] text-[var(--parchment)] text-2xl md:text-3xl font-bold tracking-wide mt-4">
                The pillars of your campaign
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <Pillar
                numeral="I"
                title="Build"
                description="Raise a village from dirt roads and timber frames into a fortified settlement. Expand resource fields, construct specialized buildings, and optimize production to fuel your war effort."
              />
              <Pillar
                numeral="II"
                title="Train"
                description="Recruit infantry, cavalry, and siege engines from your barracks and stables. Each unit has strengths and weaknesses — your army composition determines victory or defeat."
                align="right"
              />
              <Pillar
                numeral="III"
                title="Raid"
                description="Launch raids against NPC villages to plunder resources. The spoils of war are what keep your empire growing. Strike fast, strike hard, and carry the loot home."
              />
              <Pillar
                numeral="IV"
                title="Conquer Oases"
                description="Seize resource oases scattered across the map. Each conquered oasis grants passive bonuses to your production — wood, clay, iron, or wheat. Territory means power."
                align="right"
              />
              <Pillar
                numeral="V"
                title="Hero Adventures"
                description="Send your hero on dangerous adventures to earn experience, equipment, and rare rewards. Level up your champion and equip them with artifacts that tip the scales in battle."
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

        <DividerLine />

        {/* ── SECTION 4: Why single player ── */}
        <section className="relative px-4 py-20 md:py-28">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 30% 50%, var(--stone-900) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-7xl mx-auto relative z-10">
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
                  Pure strategy. You fight the world on your terms. Every raid,
                  every building upgrade, every troop movement happens when you
                  decide — not when a timer or another player forces your hand.
                </p>
              </div>
            </div>
          </div>
        </section>

        <DividerLine />

        {/* ── SECTION 5: Final CTA ── */}
        <section className="relative px-4 py-20 md:py-28">
          <StoneTexture />
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
                  className="font-[Cinzel] bg-[var(--war-gold)] text-[var(--stone-950)] hover:bg-[var(--war-gold-dim)] text-base md:text-lg px-8 py-6 font-bold tracking-wider uppercase shadow-lg shadow-[var(--war-gold)]/20 transition-all hover:shadow-[var(--war-gold)]/40 cursor-pointer"
                >
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
