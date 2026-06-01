import { clsx } from 'clsx';
import {
  Component,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { GiPerspectiveDiceSixFacesRandom } from 'react-icons/gi';
import { IoFemale, IoMale } from 'react-icons/io5';
import { MdZoomIn, MdZoomOut } from 'react-icons/md';
import { RxReset } from 'react-icons/rx';
import type { HeroAppearance } from '@pillage-first/types/models/hero-appearance';
import {
  type AppearanceCategory,
  CATEGORIES,
  EYE_COLORS,
  HAIR_COLORS,
  SKIN_COLORS,
  TRIBE_OPTIONS,
} from 'app/(game)/(village-slug)/(hero)/components/hero-appearance/appearance-config';
import { HeroAvatar } from 'app/(game)/(village-slug)/(hero)/components/hero-avatar/hero-avatar';
import { getAvailableVariants } from 'app/(game)/(village-slug)/(hero)/components/hero-avatar/hero-avatar-renderer';
import { useHeroAppearance } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-hero-appearance';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import styles from './hero-appearance.module.css';

class HeroAppearanceErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-red-500">
          <p>Failed to load hero appearance.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-amber-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type ColorGroup = 'skin' | 'hair' | 'eye' | 'none';

function getColorGroupLabel(group: ColorGroup): string {
  switch (group) {
    case 'skin':
      return 'Skin color';
    case 'hair':
      return 'Hair color';
    case 'eye':
      return 'Eye color';
    default:
      return '';
  }
}

function getColorsForGroup(group: ColorGroup) {
  switch (group) {
    case 'skin':
      return SKIN_COLORS;
    case 'hair':
      return HAIR_COLORS;
    case 'eye':
      return EYE_COLORS;
    default:
      return [];
  }
}

function getColorIdForGroup(draft: HeroAppearance, group: ColorGroup): string {
  switch (group) {
    case 'skin':
      return draft.skinColor;
    case 'hair':
      return draft.hairColor;
    case 'eye':
      return draft.eyeColor;
    default:
      return '';
  }
}

const HeroAppearancePanelInner = () => {
  const { t } = useTranslation();
  const { appearance: savedAppearance, updateAppearance } = useHeroAppearance();

  const [draft, setDraft] = useState<HeroAppearance>(savedAppearance);
  const [activeCategory, setActiveCategory] =
    useState<AppearanceCategory>('jaw');
  const [viewMode, setViewMode] = useState<'head' | 'body'>('head');
  const [variants, setVariants] = useState<number[]>([]);

  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(savedAppearance) || false;

  useEffect(() => {
    setDraft(savedAppearance);
  }, [savedAppearance]);

  const activeCategoryConfig = useMemo(
    () => CATEGORIES.find((c) => c.id === activeCategory)!,
    [activeCategory],
  );

  const colorForCategory = useMemo(() => {
    switch (activeCategoryConfig.colorGroup) {
      case 'skin':
        return draft.skinColor;
      case 'hair':
        return draft.hairColor;
      case 'eye':
        return draft.eyeColor;
      default:
        return draft.skinColor;
    }
  }, [activeCategoryConfig, draft.skinColor, draft.hairColor, draft.eyeColor]);

  const visibleColorGroups = useMemo(() => {
    const groups = new Set<ColorGroup>();
    for (const c of CATEGORIES) {
      groups.add(c.colorGroup);
    }
    groups.delete('none');
    return Array.from(groups) as ColorGroup[];
  }, []);

  useEffect(() => {
    const loadVariants = async () => {
      const ids = await getAvailableVariants(
        draft.gender,
        activeCategoryConfig.featureType,
        colorForCategory,
        activeCategoryConfig.layerName,
      );
      setVariants(ids);
    };
    loadVariants();
  }, [draft.gender, activeCategoryConfig, colorForCategory]);

  const handleVariantSelect = useCallback(
    (variantId: number) => {
      setDraft((prev) => ({
        ...prev,
        [activeCategoryConfig.variantKey]: variantId,
      }));
    },
    [activeCategoryConfig],
  );

  const handleColorChange = useCallback(
    (group: ColorGroup, colorId: string) => {
      setDraft((prev) => {
        switch (group) {
          case 'skin':
            return { ...prev, skinColor: colorId };
          case 'hair':
            return { ...prev, hairColor: colorId };
          case 'eye':
            return { ...prev, eyeColor: colorId };
          default:
            return prev;
        }
      });
    },
    [],
  );

  const handleGenderToggle = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      gender: prev.gender === 'male' ? 'female' : 'male',
    }));
  }, []);

  const handleRandomize = useCallback(async () => {
    const skinColors = SKIN_COLORS.map((c) => c.id);
    const hairColors = HAIR_COLORS.map((c) => c.id);
    const eyeColors = EYE_COLORS.map((c) => c.id);

    const randomPick = <T,>(arr: T[]): T =>
      arr[Math.floor(Math.random() * arr.length)];

    const randomSkin = randomPick(skinColors);
    const randomHair = randomPick(hairColors);
    const randomEye = randomPick(eyeColors);
    const randomGender = randomPick(['male', 'female'] as const);

    const loadRandom = async (
      featureType: string,
      color: string,
      layerName: string,
    ): Promise<number> => {
      const ids = await getAvailableVariants(
        randomGender,
        featureType,
        color,
        layerName,
      );
      return ids.length > 0 ? randomPick(ids) : 1;
    };

    const [
      jawId,
      eyesId,
      browsId,
      noseId,
      mouthId,
      earsId,
      hairId,
      beardId,
      tattooId,
      scarId,
    ] = await Promise.all([
      loadRandom('skinColor', randomSkin, 'jaw'),
      loadRandom('eyeColor', randomEye, 'eyes'),
      loadRandom('hairColor', randomHair, 'brows'),
      loadRandom('skinColor', randomSkin, 'nose'),
      loadRandom('skinColor', randomSkin, 'mouth'),
      loadRandom('skinColor', randomSkin, 'ears'),
      loadRandom('hairColor', randomHair, 'frontHair'),
      loadRandom('hairColor', randomHair, 'beard'),
      loadRandom('skinColor', randomSkin, 'tattoo'),
      loadRandom('skinColor', randomSkin, 'scar'),
    ]);

    setDraft({
      gender: randomGender,
      skinColor: randomSkin,
      hairColor: randomHair,
      eyeColor: randomEye,
      jawId,
      eyesId,
      browsId,
      noseId,
      mouthId,
      earsId,
      hairId,
      beardId: Math.random() > 0.5 ? beardId : 0,
      tattooId: Math.random() > 0.7 ? tattooId : 0,
      scarId: Math.random() > 0.7 ? scarId : 0,
      bodyArmor: draft.bodyArmor,
    });
  }, [draft.bodyArmor]);

  const handleSave = useCallback(() => {
    updateAppearance(draft);
  }, [draft, updateAppearance]);

  const handleReset = useCallback(() => {
    setDraft(savedAppearance);
  }, [savedAppearance]);

  const allOptions = useMemo(() => {
    return activeCategoryConfig.allowNone ? [0, ...variants] : variants;
  }, [activeCategoryConfig, variants]);

  return (
    <div className={styles.appearanceWrapper}>
      {/* Category row: 10 circular icons */}
      <div className={styles.categories}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={clsx(styles.category, {
              [styles.selected]: cat.id === activeCategory,
            })}
            title={cat.label}
          >
            <i style={{ backgroundImage: `url(${cat.icon})` }} />
          </button>
        ))}
      </div>

      {/* Main content: options grid + preview column */}
      <div className={styles.mainContent}>
        {/* Options grid (left) */}
        <div className={styles.optionsColumn}>
          <div className={styles.optionsWrapper}>
            {allOptions.map((id) => (
              <OptionTile
                key={id}
                id={id}
                appearance={draft}
                isSelected={
                  (draft as Record<string, unknown>)[
                    activeCategoryConfig.variantKey
                  ] === id
                }
                onSelect={handleVariantSelect}
                variantKey={activeCategoryConfig.variantKey}
                crop={activeCategoryConfig.crop}
              />
            ))}
          </div>
        </div>

        {/* Preview column (right) */}
        <div className={styles.previewColumn}>
          {/* Hero preview */}
          <div className={styles.previewContainer}>
            <div className={styles.preview}>
              <HeroAvatar
                appearance={draft}
                tribe={draft.bodyArmor}
                mode="head"
                className={styles.previewCanvas}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleGenderToggle}
              className={styles.actionBtn}
              title={t('Toggle gender')}
            >
              {draft.gender === 'male' ? <IoMale /> : <IoFemale />}
            </button>
            <button
              type="button"
              onClick={handleRandomize}
              className={styles.actionBtn}
              title={t('Randomize')}
            >
              <GiPerspectiveDiceSixFacesRandom />
            </button>
            <button
              type="button"
              onClick={() =>
                setViewMode((v) => (v === 'head' ? 'body' : 'head'))
              }
              className={styles.actionBtn}
              title={t('Toggle view')}
            >
              {viewMode === 'head' ? <MdZoomOut /> : <MdZoomIn />}
            </button>
          </div>

          {/* Tribe Robe */}
          <div className="flex flex-col gap-1 w-full px-4 mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {t('Tribe Robe')}
            </span>
            <Select
              value={draft.bodyArmor}
              onValueChange={(val: string) =>
                setDraft((prev) => ({ ...prev, bodyArmor: val }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIBE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.id}
                    value={opt.id}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color palettes */}
          <div className={styles.colorsColumn}>
            {visibleColorGroups.map((group) => (
              <ColorPalette
                key={group}
                group={group}
                colors={getColorsForGroup(group)}
                selectedId={getColorIdForGroup(draft, group)}
                onSelect={(id) => handleColorChange(group, id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className={styles.buttonWrapper}>
        <button
          type="button"
          onClick={handleReset}
          disabled={!isDirty}
          className={clsx(styles.bottomBtn, styles.resetBtn, {
            [styles.disabled]: !isDirty,
          })}
        >
          <RxReset />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className={clsx(styles.bottomBtn, styles.saveBtn, {
            [styles.disabled]: !isDirty,
          })}
        >
          {t('Save changes')}
        </button>
      </div>
    </div>
  );
};

type OptionTileProps = {
  id: number;
  appearance: HeroAppearance;
  isSelected: boolean;
  onSelect: (id: number) => void;
  variantKey: string;
  crop?: { x: number; y: number; w: number; h: number };
};

const OptionTile = memo<OptionTileProps>(
  ({ id, appearance, isSelected, onSelect, variantKey, crop }) => {
    const tileAppearance =
      id === 0 || !(variantKey in appearance)
        ? appearance
        : { ...appearance, [variantKey]: id };
    return (
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={clsx(styles.option, { [styles.selected]: isSelected })}
      >
        {id === 0 ? (
          <div className={styles.optionNone}>—</div>
        ) : (
          <div className={styles.optionPreview}>
            <HeroAvatar
              appearance={tileAppearance}
              tribe={tileAppearance.bodyArmor}
              mode="head"
              crop={crop}
              className={styles.optionCanvas}
            />
          </div>
        )}
        {isSelected && <div className={styles.selectedIndicator} />}
      </button>
    );
  },
);
OptionTile.displayName = 'OptionTile';

type ColorPaletteProps = {
  group: ColorGroup;
  colors: { id: string; label: string; hex: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const ColorPalette = memo<ColorPaletteProps>(
  ({ group, colors, selectedId, onSelect }) => {
    return (
      <div className={styles.colorPalette}>
        <span className={styles.colorLabel}>{getColorGroupLabel(group)}</span>
        <div className={styles.colors}>
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onSelect(color.id)}
              className={clsx(styles.color, {
                [styles.selected]: color.id === selectedId,
              })}
              title={color.label}
            >
              <div
                className={styles.colorPreview}
                style={{ backgroundColor: color.hex }}
              />
            </button>
          ))}
        </div>
      </div>
    );
  },
);
ColorPalette.displayName = 'ColorPalette';

export const HeroAppearancePanel = () => {
  return (
    <HeroAppearanceErrorBoundary>
      <HeroAppearancePanelInner />
    </HeroAppearanceErrorBoundary>
  );
};
