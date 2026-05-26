// Static configuration for hero appearance customization options.
// Matches Travian live site structure exactly.

export type AppearanceCategory =
  | 'jaw'
  | 'eyes'
  | 'brows'
  | 'nose'
  | 'mouth'
  | 'ears'
  | 'hair'
  | 'beard'
  | 'scar'
  | 'tattoo';

export type ColorOption = {
  id: string;
  label: string;
  hex: string;
};

export type CategoryConfig = {
  id: AppearanceCategory;
  label: string;
  icon: string;
  featureType: string;
  layerName: string;
  variantKey: string;
  colorGroup: 'skin' | 'hair' | 'eye' | 'none';
  allowNone: boolean;
  price: number;
  crop?: { x: number; y: number; w: number; h: number };
};

// Travian live site skin colors
export const SKIN_COLORS: ColorOption[] = [
  { id: 'skin1', label: 'Light', hex: '#edd8c8' },
  { id: 'skin2', label: 'Medium', hex: '#a58168' },
  { id: 'skin3', label: 'Tan', hex: '#785a3d' },
  { id: 'skin4', label: 'Dark', hex: '#342519' },
];

export const HAIR_COLORS: ColorOption[] = [
  { id: 'black', label: 'Black', hex: '#2c1b0e' },
  { id: 'brown', label: 'Brown', hex: '#6b3a2a' },
  { id: 'blonde', label: 'Blonde', hex: '#e8c860' },
  { id: 'red', label: 'Red', hex: '#a0522d' },
  { id: 'grey', label: 'Grey', hex: '#808080' },
  { id: 'white', label: 'White', hex: '#d4d4d4' },
];

export const EYE_COLORS: ColorOption[] = [
  { id: 'brown', label: 'Brown', hex: '#654321' },
  { id: 'black', label: 'Black', hex: '#1a1a1a' },
  { id: 'blue', label: 'Blue', hex: '#4a90d9' },
  { id: 'green', label: 'Green', hex: '#3d8b37' },
  { id: 'grey', label: 'Grey', hex: '#808080' },
  { id: 'red', label: 'Red', hex: '#b22222' },
];

export const TRIBE_OPTIONS = [
  { id: 'roman', label: 'Roman Armor' },
  { id: 'teuton', label: 'Teuton Armor' },
  { id: 'gaul', label: 'Gaul Armor' },
  { id: 'egyptian', label: 'Egyptian Armor' },
  { id: 'hun', label: 'Hun Armor' },
  { id: 'spartan', label: 'Spartan Armor' },
];

// Categories matching Travian live site order and naming
export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'jaw',
    label: 'Face Shape',
    icon: '/hero-assets/icons/jaw.png',
    featureType: 'skinColor',
    layerName: 'jaw',
    variantKey: 'jawId',
    colorGroup: 'skin',
    allowNone: false,
    price: 0,
    crop: { x: 340, y: 240, w: 195, h: 160 },
  },
  {
    id: 'eyes',
    label: 'Eyes',
    icon: '/hero-assets/icons/eyes.png',
    featureType: 'eyeColor',
    layerName: 'eyes',
    variantKey: 'eyesId',
    colorGroup: 'eye',
    allowNone: false,
    price: 0,
    crop: { x: 370, y: 210, w: 135, h: 70 },
  },
  {
    id: 'brows',
    label: 'Eyebrows',
    icon: '/hero-assets/icons/brows.png',
    featureType: 'hairColor',
    layerName: 'brows',
    variantKey: 'browsId',
    colorGroup: 'hair',
    allowNone: false,
    price: 0,
    crop: { x: 370, y: 190, w: 135, h: 55 },
  },
  {
    id: 'nose',
    label: 'Nose',
    icon: '/hero-assets/icons/nose.png',
    featureType: 'skinColor',
    layerName: 'nose',
    variantKey: 'noseId',
    colorGroup: 'skin',
    allowNone: false,
    price: 0,
    crop: { x: 395, y: 205, w: 85, h: 95 },
  },
  {
    id: 'mouth',
    label: 'Mouth',
    icon: '/hero-assets/icons/mouth.png',
    featureType: 'skinColor',
    layerName: 'mouth',
    variantKey: 'mouthId',
    colorGroup: 'skin',
    allowNone: false,
    price: 0,
    crop: { x: 390, y: 260, w: 95, h: 65 },
  },
  {
    id: 'ears',
    label: 'Ears',
    icon: '/hero-assets/icons/ears.png',
    featureType: 'skinColor',
    layerName: 'ears',
    variantKey: 'earsId',
    colorGroup: 'skin',
    allowNone: true,
    price: 0,
    crop: { x: 350, y: 200, w: 175, h: 80 },
  },
  {
    id: 'hair',
    label: 'Hair',
    icon: '/hero-assets/icons/hair.png',
    featureType: 'hairColor',
    layerName: 'frontHair',
    variantKey: 'hairId',
    colorGroup: 'hair',
    allowNone: true,
    price: 0,
    crop: { x: 330, y: 130, w: 215, h: 180 },
  },
  {
    id: 'beard',
    label: 'Beard',
    icon: '/hero-assets/icons/beard.png',
    featureType: 'hairColor',
    layerName: 'beard',
    variantKey: 'beardId',
    colorGroup: 'hair',
    allowNone: true,
    price: 0,
    crop: { x: 350, y: 230, w: 175, h: 140 },
  },
  {
    id: 'scar',
    label: 'Scar',
    icon: '/hero-assets/icons/scar.png',
    featureType: 'skinColor',
    layerName: 'scar',
    variantKey: 'scarId',
    colorGroup: 'none',
    allowNone: true,
    price: 0,
    crop: { x: 350, y: 200, w: 175, h: 175 },
  },
  {
    id: 'tattoo',
    label: 'Tattoo',
    icon: '/hero-assets/icons/tattoo.png',
    featureType: 'tattoo',
    layerName: 'tattoo',
    variantKey: 'tattooId',
    colorGroup: 'none',
    allowNone: true,
    price: 0,
    crop: { x: 350, y: 200, w: 175, h: 175 },
  },
];
