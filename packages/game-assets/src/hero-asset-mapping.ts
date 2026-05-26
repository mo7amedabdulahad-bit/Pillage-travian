// Maps game item IDs to their V2 sprite filenames.
// These filenames exist in /v2-overlays/{male|female}/ directories.
// Built by cross-referencing items.ts IDs with actual extracted Unity sprite names.

export const heroAssetMapping: Record<number, string> = {
  // ═══════════════════════════════════════════════════
  // HELMETS (IDs 1-15)
  // ═══════════════════════════════════════════════════
  1: 'helmet-xp1',
  2: 'helmet-xp2',
  3: 'helmet-xp3',
  4: 'helmet-health1',
  5: 'helmet-health2',
  6: 'helmet-health3',
  7: 'helmet-culture1',
  8: 'helmet-culture2',
  9: 'helmet-culture3',
  10: 'helmet-stable1',
  11: 'helmet-stable2', // May fallback to stable1
  12: 'helmet-stable3',
  13: 'helmet-barracks1', // May fallback to barracks2
  14: 'helmet-barracks2',
  15: 'helmet-barracks3',

  // ═══════════════════════════════════════════════════
  // ROMAN WEAPONS (IDs 16-30)
  // ═══════════════════════════════════════════════════
  16: 'sword-legionaire1',
  17: 'sword-legionaire2',
  18: 'sword-legionaire3',
  19: 'sword-preatorian1',
  20: 'sword-preatorian2',
  21: 'sword-preatorian3',
  22: 'sword-imperian1',
  23: 'sword-imperian2',
  24: 'sword-imperian3',
  25: 'sword-imperatoris1',
  26: 'sword-imperatoris2',
  27: 'sword-imperatoris3',
  28: 'lance-caesaris1',
  29: 'lance-caesaris2',
  30: 'lance-caesaris3',

  // ═══════════════════════════════════════════════════
  // GAUL WEAPONS (IDs 31-45)
  // ═══════════════════════════════════════════════════
  31: 'lance-phalanx1',
  32: 'lance-phalanx2',
  33: 'lance-phalanx3',
  34: 'sword-swordsman1',
  35: 'sword-swordsman2',
  36: 'sword-swordsman3',
  37: 'bow-theutates1',
  38: 'bow-theutates1', // bow-theutates2 missing, fallback
  39: 'bow-theutates3',
  40: 'staff-druidrider1',
  41: 'staff-druidrider2',
  42: 'staff-druidrider3',
  43: 'lance-haeduan1',
  44: 'lance-haeduan2',
  45: 'lance-haeduan3',

  // ═══════════════════════════════════════════════════
  // TEUTON WEAPONS (IDs 46-60)
  // ═══════════════════════════════════════════════════
  46: 'club-clubswinger1',
  47: 'club-clubswinger2',
  48: 'club-clubswinger3',
  49: 'spear-spearman1',
  50: 'spear-spearman2',
  51: 'spear-spearman2', // spear-spearman3 missing, fallback
  52: 'axe-axeman1',
  53: 'axe-axeman2',
  54: 'axe-axeman3',
  55: 'hammer-paladin1',
  56: 'hammer-paladin2',
  57: 'hammer-paladin3',
  58: 'sword-teutonicknight2', // teutonicknight1 missing, fallback
  59: 'sword-teutonicknight2',
  60: 'sword-teutonicknight3',

  // ═══════════════════════════════════════════════════
  // LEFT HAND (IDs 61-81)
  // ═══════════════════════════════════════════════════
  61: 'map1',
  62: 'map2',
  63: 'map3',
  64: 'pennant2', // pennant1 missing, fallback
  65: 'pennant2',
  66: 'pennant2', // pennant3 missing, fallback
  67: 'standard1',
  68: 'standard2',
  69: 'standard3',
  70: 'shield1', // spy sprites are inventory icons, use shield as fallback
  71: 'shield1',
  72: 'shield1',
  73: 'bag1',
  74: 'bag2',
  75: 'bag3',
  76: 'shield1',
  77: 'shield1', // shield2/3 may be missing for male
  78: 'shield1',
  79: 'horn1',
  80: 'horn2',
  81: 'horn3',

  // ═══════════════════════════════════════════════════
  // ARMOUR (IDs 82-93)
  // ═══════════════════════════════════════════════════
  82: 'health-armor1',
  83: 'health-armor2',
  84: 'health-armor3',
  85: 'damage-red-armor1',
  86: 'damage-red-armor2',
  87: 'damage-red-armor3',
  88: 'strength-armor1',
  89: 'strength-armor2',
  90: 'strength-armor3',
  91: 'strength-damage-red-armor1',
  92: 'strength-damage-red-armor2',
  93: 'strength-damage-red-armor3',

  // ═══════════════════════════════════════════════════
  // BOOTS (IDs 94-102)
  // ═══════════════════════════════════════════════════
  94: 'boots-health1',
  95: 'boots-health2',
  96: 'boots-health3',
  97: 'boots-speedarmy1',
  98: 'boots-speedarmy2',
  99: 'boots-speedarmy3',
  100: 'boots-speedhorse1',
  101: 'boots-speedhorse2',
  102: 'boots-speedhorse3',

  // ═══════════════════════════════════════════════════
  // HORSES (IDs 103-105) — No body overlay in APK, use CDN fallback
  // ═══════════════════════════════════════════════════
  // 103-105: handled separately via CDN overlays

  // ═══════════════════════════════════════════════════
  // EGYPTIAN WEAPONS (IDs 115-129)
  // ═══════════════════════════════════════════════════
  115: 'club-slaveMilitia2', // slaveMilitia1 missing
  116: 'club-slaveMilitia2',
  117: 'club-slaveMilitia3',
  118: 'axe-ashwarden1',
  119: 'axe-ashwarden2',
  120: 'axe-ashwarden3',
  121: 'khopesh-warrior1',
  122: 'khopesh-warrior2',
  123: 'khopesh-warrior3',
  124: 'spear-anhorguard1',
  125: 'spear-anhorguard2',
  126: 'spear-anhorguard3',
  127: 'bow-reshepchariot1',
  128: 'bow-reshepchariot2',
  129: 'bow-reshepchariot3',

  // ═══════════════════════════════════════════════════
  // HUN WEAPONS (IDs 130-144)
  // ═══════════════════════════════════════════════════
  130: 'axe-mercenary1',
  131: 'axe-mercenary2',
  132: 'axe-mercenary3',
  133: 'bow-bowman1',
  134: 'bow-bowman2',
  135: 'bow-bowman3',
  136: 'sword-steppeRider1',
  137: 'sword-steppeRider2',
  138: 'sword-steppeRider3',
  139: 'bow-marksman1',
  140: 'bow-marksman2',
  141: 'bow-marksman3',
  142: 'sword-marauder1',
  143: 'sword-marauder2',
  144: 'sword-marauder3',

  // ═══════════════════════════════════════════════════
  // SPARTAN WEAPONS (IDs 149-163)
  // ═══════════════════════════════════════════════════
  149: 'item149',
  150: 'item150',
  151: 'item151',
  152: 'item152',
  153: 'item153',
  154: 'item154',
  155: 'item155',
  156: 'item156',
  157: 'item157',
  158: 'item158',
  159: 'item159',
  160: 'item160',
  161: 'item161',
  162: 'item161', // item162 missing, fallback
  163: 'item163',
};
