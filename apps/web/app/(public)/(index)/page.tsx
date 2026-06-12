import { Link } from 'react-router';
import { Button } from 'app/components/ui/button';

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

const GoldFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative p-[3px] bg-linear-to-b from-[#cba467] via-[#efbf7b] to-[#835e35]">
    <div className="bg-[#272727]">{children}</div>
  </div>
);

const SectionDivider = () => (
  <div className="flex items-center gap-3 justify-center py-1">
    <div className="h-px flex-1 max-w-40 bg-linear-to-r from-transparent to-[#cba467]" />
    <div className="flex gap-1">
      <img
        src="/graphic-packs/day/icons/resources/lumber_tiny.png"
        alt=""
        loading="lazy"
        className="size-5 opacity-50"
        aria-hidden
      />
      <img
        src="/graphic-packs/day/icons/resources/clay_tiny.png"
        alt=""
        loading="lazy"
        className="size-5 opacity-50"
        aria-hidden
      />
      <img
        src="/graphic-packs/day/icons/resources/iron_tiny.png"
        alt=""
        loading="lazy"
        className="size-5 opacity-50"
        aria-hidden
      />
      <img
        src="/graphic-packs/day/icons/resources/crop_tiny.png"
        alt=""
        loading="lazy"
        className="size-5 opacity-50"
        aria-hidden
      />
    </div>
    <div className="h-px flex-1 max-w-40 bg-linear-to-l from-transparent to-[#cba467]" />
  </div>
);

const PillarCard = ({
  imageSrc,
  imageAlt,
  title,
  description,
  flip = false,
}: {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  flip?: boolean;
}) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0 overflow-hidden ${flip ? 'md:[direction:rtl]' : ''}`}
  >
    <div className="bg-[#1f1f1f] flex items-center justify-center p-6 md:p-8">
      <img
        src={imageSrc}
        alt={imageAlt}
        loading="lazy"
        className="w-full max-w-[180px] h-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
      />
    </div>
    <div
      className="p-6 md:p-8 flex flex-col gap-3"
      style={{ direction: 'ltr' }}
    >
      <h3 className="font-[Red_Rose,serif] text-[#261f16] text-xl font-bold tracking-wide">
        {title}
      </h3>
      <p className="font-[Noto_Sans,sans-serif] text-[#5e463a] text-sm leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

const HomePage = () => {
  return (
    <>
      <title>Pillage First! (Ask Questions Later)</title>
      <style>{`
        .tv-green-btn {
          background-image: linear-gradient(to bottom, #84b253, #466428);
          border: 1px solid #4a6e26;
          box-shadow:
            inset 0 -4px 0 -2px #344a1d,
            inset 0 4px 0 -2px #84b253,
            inset 0 0 0 2px #679f1b;
          text-shadow: 0 -1px 0 rgba(0,0,0,0.3);
          transition: all 0.15s ease-out;
        }
        .tv-green-btn:hover {
          background-image: linear-gradient(to bottom, #98c96a, #5a8133);
          box-shadow:
            inset 0 -4px 0 -2px #48711e,
            inset 0 4px 0 -2px #98c96a,
            inset 0 0 0 2px #75c90d;
        }
        .tv-green-btn:active {
          box-shadow:
            inset 0 4px 0 -2px #344a1d,
            inset 0 -4px 0 -2px #84b253,
            inset 0 0 0 2px #4a6e26;
          transform: translateY(1px);
        }
        .tv-outline-btn {
          background-image: linear-gradient(to bottom, #f5f5f5, #d9d9d9);
          border: 1px solid #919191;
          box-shadow:
            inset 0 -4px 0 -2px #bcbcbc,
            inset 0 4px 0 -2px #fcfcfc,
            inset 0 0 0 2px #e0e0e0;
          color: #1f1f1f;
          text-shadow: none;
          transition: all 0.15s ease-out;
        }
        .tv-outline-btn:hover {
          background-image: linear-gradient(to bottom, #fff, #e6e6e6);
          box-shadow:
            inset 0 -4px 0 -2px #d0d0d0,
            inset 0 4px 0 -2px #fff,
            inset 0 0 0 2px #e6e6e6;
        }
        .tv-outline-btn:active {
          box-shadow:
            inset 0 4px 0 -2px #bcbcbc,
            inset 0 -4px 0 -2px #fcfcfc,
            inset 0 0 0 2px #d9d9d9;
          transform: translateY(1px);
        }
        .tv-hero-text {
          text-shadow:
            1px 0 0 rgba(27,26,26,0.8),
            1px 1px 0 rgba(27,26,26,0.8),
            0 1px 0 rgba(27,26,26,0.8),
            -1px 1px 0 rgba(27,26,26,0.8),
            -1px 0 0 rgba(27,26,26,0.8),
            -1px -1px 0 rgba(27,26,26,0.8),
            0 -1px 0 rgba(27,26,26,0.8),
            1px -1px 0 rgba(27,26,26,0.8);
        }
        .tv-gold-border {
          border-image: linear-gradient(180deg, #cba467 5%, #f3e2ae 13%, #efbf7b 32%, #aa8050 48%, #835e35 72%, #ad8a54 93%, #d7b672) 1;
        }
      `}</style>

      <main
        className="min-h-screen"
        style={{
          background:
            'linear-gradient(180deg, #c8a36c, #f2dfb9 30px, #fef0ce 200px, #fef0ce calc(100% - 200px), #f5e3bd calc(100% - 30px), #c8a46c)',
        }}
      >
        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden">
          {/* Background image with dark overlay */}
          <div className="absolute inset-0">
            <img
              src="/graphic-packs/day/backgrounds/bgBuildings.jpg"
              alt=""
              loading="eager"
              className="w-full h-full object-cover"
              aria-hidden
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(49,44,44,0.85), rgba(26,30,31,0.85))',
              }}
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] md:min-h-[80vh] px-4 py-16 text-center">
            {/* Game logo / title */}
            <img
              src="/pillage-first-logo-horizontal.svg"
              alt="Pillage First!"
              className="w-64 sm:w-80 md:w-96 h-auto mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            />

            <h1 className="font-[Red_Rose,serif] tv-hero-text text-[#fff9eb] text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide mb-4">
              Pillage First!
            </h1>

            <p className="font-[Red_Rose,serif] tv-hero-text text-[#f5e8c8] text-lg sm:text-xl md:text-2xl mb-2">
              Build. Raid. Conquer. Repeat.
            </p>

            <p className="font-[Noto_Sans,sans-serif] tv-hero-text text-[#e6dbc9] text-sm md:text-base mb-8 max-w-md">
              Single-player strategy inspired by Travian. No waiting for other
              players. No account needed.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Link to="/game-worlds/create">
                <button
                  type="button"
                  className="tv-green-btn font-[Red_Rose,serif] text-white text-lg font-bold px-10 py-3 cursor-pointer flex items-center gap-2"
                >
                  <SwordIcon />
                  PLAY NOW
                </button>
              </Link>
              <Link to="/game-worlds">
                <button
                  type="button"
                  className="tv-outline-btn font-[Noto_Sans,sans-serif] text-sm font-bold px-6 py-2.5 cursor-pointer"
                >
                  Existing game worlds
                </button>
              </Link>
            </div>

            {/* Tribe characters — decorative row of unit images */}
            <div className="mt-12 flex items-end justify-center gap-2 opacity-80">
              <img
                src="/graphic-packs/day/icons/units/roman/section/t5.png"
                alt=""
                loading="eager"
                className="w-12 md:w-16 h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                aria-hidden
              />
              <img
                src="/graphic-packs/day/icons/units/teuton/section/t3.png"
                alt=""
                loading="eager"
                className="w-14 md:w-20 h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                aria-hidden
              />
              <img
                src="/graphic-packs/day/icons/units/gaul/section/t5.png"
                alt=""
                loading="eager"
                className="w-14 md:w-20 h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                aria-hidden
              />
              <img
                src="/graphic-packs/day/icons/units/roman/section/t3.png"
                alt=""
                loading="eager"
                className="w-12 md:w-16 h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                aria-hidden
              />
            </div>
          </div>

          {/* Bottom vignette */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24"
            style={{
              background:
                'linear-gradient(180deg, transparent, rgba(254,240,206,1))',
            }}
          />
        </section>

        {/* ── SECTION 2: What is this game ── */}
        <section className="px-4 py-12 md:py-16">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start">
              <div>
                <h2 className="font-[Red_Rose,serif] text-[#261f16] text-2xl md:text-3xl font-bold mb-4">
                  A village is only as strong as its last raid.
                </h2>
                <div className="font-[Noto_Sans,sans-serif] text-[#5e463a] text-sm md:text-base leading-relaxed space-y-3">
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
                <div className="mt-6 flex gap-3">
                  <Link to="/frequently-asked-questions">
                    <Button
                      variant="ghost"
                      className="font-[Noto_Sans,sans-serif] text-[#5a9a0a] hover:text-[#75c90d] text-sm font-bold p-0 h-auto cursor-pointer"
                    >
                      Frequently asked questions
                    </Button>
                  </Link>
                  <span className="text-[#d2bda1]">|</span>
                  <Link to="/latest-updates">
                    <Button
                      variant="ghost"
                      className="font-[Noto_Sans,sans-serif] text-[#5a9a0a] hover:text-[#75c90d] text-sm font-bold p-0 h-auto cursor-pointer"
                    >
                      Latest updates
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Village preview */}
              <div className="hidden md:flex flex-col items-center gap-2">
                <GoldFrame>
                  <div className="p-4 flex flex-col items-center gap-2">
                    <img
                      src="/graphic-packs/default/map/villages/dorf3_5.png"
                      alt="Village map preview"
                      loading="lazy"
                      className="w-32 h-auto"
                    />
                    <span className="font-[Noto_Sans,sans-serif] text-[#c3c3c3] text-xs">
                      Your village on the map
                    </span>
                  </div>
                </GoldFrame>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ── SECTION 3: Core gameplay pillars ── */}
        <section className="px-4 py-12 md:py-16">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="font-[Red_Rose,serif] text-[#261f16] text-2xl md:text-3xl font-bold mb-8 text-center">
              The pillars of your campaign
            </h2>

            <div className="flex flex-col gap-0">
              <GoldFrame>
                <PillarCard
                  imageSrc="/graphic-packs/day/buildings/roman/g31Top.png"
                  imageAlt="Main Building — the heart of your village"
                  title="Build"
                  description="Raise a village from dirt roads and timber frames into a fortified settlement. Expand resource fields, construct specialized buildings, and optimize production to fuel your war effort."
                />
              </GoldFrame>

              <div className="h-3" />

              <GoldFrame>
                <PillarCard
                  imageSrc="/graphic-packs/day/icons/units/roman/section/t5.png"
                  imageAlt="Roman legionnaire ready for battle"
                  title="Train"
                  description="Recruit infantry, cavalry, and siege engines from your barracks and stables. Each unit has strengths and weaknesses — your army composition determines victory or defeat."
                  flip
                />
              </GoldFrame>

              <div className="h-3" />

              <GoldFrame>
                <PillarCard
                  imageSrc="/graphic-packs/day/icons/units/teuton/section/t3.png"
                  imageAlt="Teuton cavalry — the raiding force"
                  title="Raid"
                  description="Launch raids against NPC villages to plunder resources. The spoils of war are what keep your empire growing. Strike fast, strike hard, and carry the loot home."
                />
              </GoldFrame>

              <div className="h-3" />

              <GoldFrame>
                <PillarCard
                  imageSrc="/graphic-packs/default/map/oasis/wheat/2-0-0-0.avif"
                  imageAlt="A wheat oasis — conquer it for resource bonuses"
                  title="Conquer Oases"
                  description="Seize resource oases scattered across the map. Each conquered oasis grants passive bonuses to your production — wood, clay, iron, or wheat. Territory means power."
                  flip
                />
              </GoldFrame>

              <div className="h-3" />

              <GoldFrame>
                <PillarCard
                  imageSrc="/hero-assets/backgrounds/heroPageBackground.jpg"
                  imageAlt="Your hero's domain — equip, customize, and send to battle"
                  title="Hero Adventures"
                  description="Send your hero on dangerous adventures to earn experience, equipment, and rare rewards. Level up your champion and equip them with artifacts that tip the scales in battle."
                />
              </GoldFrame>
            </div>

            <div className="mt-8 text-center">
              <Link to="/get-involved">
                <button
                  type="button"
                  className="tv-outline-btn font-[Noto_Sans,sans-serif] text-sm font-bold px-6 py-2.5 cursor-pointer"
                >
                  Get involved
                </button>
              </Link>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ── SECTION 4: Why single player ── */}
        <section className="px-4 py-12 md:py-16">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8 items-center">
              <div>
                <h2 className="font-[Red_Rose,serif] text-[#261f16] text-2xl md:text-3xl font-bold mb-4">
                  No allies. No enemies. No schedule.
                </h2>
                <div className="font-[Noto_Sans,sans-serif] text-[#5e463a] text-sm md:text-base leading-relaxed space-y-3">
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

              {/* Resource icons */}
              <div className="hidden md:flex flex-col items-center gap-3">
                <GoldFrame>
                  <div className="p-5 flex flex-col items-center gap-3">
                    <img
                      src="/graphic-packs/day/icons/resources/resources_medium.png"
                      alt="Resource overview"
                      loading="lazy"
                      className="w-24 h-auto"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <img
                        src="/graphic-packs/day/icons/resources/lumber_small.png"
                        alt=""
                        loading="lazy"
                        className="size-8"
                        aria-hidden
                      />
                      <img
                        src="/graphic-packs/day/icons/resources/clay_small.png"
                        alt=""
                        loading="lazy"
                        className="size-8"
                        aria-hidden
                      />
                      <img
                        src="/graphic-packs/day/icons/resources/iron_small.png"
                        alt=""
                        loading="lazy"
                        className="size-8"
                        aria-hidden
                      />
                      <img
                        src="/graphic-packs/day/icons/resources/crop_small.png"
                        alt=""
                        loading="lazy"
                        className="size-8"
                        aria-hidden
                      />
                    </div>
                    <span className="font-[Noto_Sans,sans-serif] text-[#c3c3c3] text-xs">
                      Manage your resources
                    </span>
                  </div>
                </GoldFrame>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ── SECTION 5: Final CTA ── */}
        <section className="relative overflow-hidden">
          {/* Dark background with building silhouettes */}
          <div className="absolute inset-0 bg-[#1f1f1f]" />
          <img
            src="/graphic-packs/day/buildings/roman/g31Top.png"
            alt=""
            loading="lazy"
            className="absolute bottom-0 right-[5%] w-48 md:w-72 opacity-10 pointer-events-none"
            aria-hidden
          />
          <img
            src="/graphic-packs/day/buildings/roman/g17.png"
            alt=""
            loading="lazy"
            className="absolute bottom-0 left-[10%] w-32 md:w-48 opacity-[0.07] pointer-events-none"
            aria-hidden
          />

          <div className="relative z-10 px-4 py-16 md:py-20 text-center">
            <h2 className="font-[Red_Rose,serif] tv-hero-text text-[#fff9eb] text-2xl md:text-4xl font-bold mb-3">
              Ready to pillage?
            </h2>
            <p className="font-[Noto_Sans,sans-serif] text-[#d2bda1] text-sm md:text-base mb-8">
              No account needed. Your progress saves locally.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
              <Link to="/game-worlds/create">
                <button
                  type="button"
                  className="tv-green-btn font-[Red_Rose,serif] text-white text-lg font-bold px-10 py-3 cursor-pointer flex items-center gap-2"
                >
                  <SwordIcon />
                  PLAY NOW
                </button>
              </Link>
              <Link to="/game-worlds">
                <button
                  type="button"
                  className="tv-outline-btn font-[Noto_Sans,sans-serif] text-sm font-bold px-6 py-2.5 cursor-pointer"
                >
                  Existing game worlds
                </button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a
                href="https://discord.gg/Ep7NKVXUZA"
                rel="noopener noreferrer"
                target="_blank"
                className="font-[Noto_Sans,sans-serif] text-[#919191] hover:text-[#fff9eb] text-xs transition-colors"
              >
                Discord
              </a>
              <span className="text-[#4a494a] hidden sm:inline">|</span>
              <a
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                rel="noopener noreferrer"
                target="_blank"
                className="font-[Noto_Sans,sans-serif] text-[#919191] hover:text-[#fff9eb] text-xs transition-colors"
              >
                GitHub
              </a>
              <span className="text-[#4a494a] hidden sm:inline">|</span>
              <Link
                to="/get-involved"
                className="font-[Noto_Sans,sans-serif] text-[#919191] hover:text-[#fff9eb] text-xs transition-colors"
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
