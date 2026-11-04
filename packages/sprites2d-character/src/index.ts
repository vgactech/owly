/**
 * SPRITES 2D — Character Engine
 * SpeciesRegistry, MorphologyEngine, CharacterDNA Builder
 *
 * Projet : OWLY / SPRITES 2D Universal Asset Creation Engine
 * Module : sprites2d-character
 *
 * RÈGLE : Ce module est 100% déterministe. Aucun appel réseau ici.
 *         La génération visuelle est déléguée à sprites2d-ai.
 *
 * DEBUG MODE ACTIVE | CERTIFIED_100=false | unique_human_proven=false
 */

import type {
  Species,
  SpeciesId,
  SpeciesFamily,
  AnatomicTrait,
  Morphology,
  MorphologySize,
  MorphologyBuild,
  MorphologyProportions,
  CharacterPalette,
  Skeleton,
  SkeletonType,
  CharacterDNA,
  HeroClassDNA,
  GraphicStyle,
  CharacterDNAHistoryEntry,
} from "@sprites2d/schema";

// ─── Species Registry ─────────────────────────────────────────────────────────

/**
 * Registre canonique de toutes les espèces SPRITES 2D.
 * Chaque espèce définit ses traits anatomiques et ses compatibilités hybrides.
 */
export const SPECIES_REGISTRY: Record<SpeciesId, Species> = {
  owl: {
    id: "owl",
    name: "Hibou",
    family: "avian",
    emoji: "🦉",
    anatomicTraits: ["wings", "feathers", "beak", "claws", "ears_animal"],
    hybridCompatible: ["avian", "feline", "canine", "draconic"],
  },
  cat: {
    id: "cat",
    name: "Chat",
    family: "feline",
    emoji: "🐱",
    anatomicTraits: ["tail", "fur", "ears_animal", "claws", "whiskers", "fangs"],
    hybridCompatible: ["feline", "canine", "draconic", "avian"],
  },
  wolf: {
    id: "wolf",
    name: "Loup",
    family: "canine",
    emoji: "🐺",
    anatomicTraits: ["tail", "fur", "ears_animal", "fangs", "claws"],
    hybridCompatible: ["canine", "feline", "ursine", "draconic"],
  },
  fox: {
    id: "fox",
    name: "Renard",
    family: "canine",
    emoji: "🦊",
    anatomicTraits: ["tail", "fur", "ears_animal", "whiskers"],
    hybridCompatible: ["canine", "feline", "avian"],
  },
  dragon: {
    id: "dragon",
    name: "Dragon",
    family: "draconic",
    emoji: "🐉",
    anatomicTraits: ["tail", "wings", "scales", "horns", "claws", "fangs"],
    hybridCompatible: ["draconic", "reptilian", "avian", "feline"],
  },
  rabbit: {
    id: "rabbit",
    name: "Lapin",
    family: "lagomorph",
    emoji: "🐰",
    anatomicTraits: ["tail", "fur", "ears_animal"],
    hybridCompatible: ["lagomorph", "feline", "canine"],
  },
  bear: {
    id: "bear",
    name: "Ours",
    family: "ursine",
    emoji: "🐻",
    anatomicTraits: ["fur", "claws", "fangs"],
    hybridCompatible: ["ursine", "canine", "draconic"],
  },
  eagle: {
    id: "eagle",
    name: "Aigle",
    family: "avian",
    emoji: "🦅",
    anatomicTraits: ["wings", "feathers", "beak", "claws", "tail"],
    hybridCompatible: ["avian", "draconic", "feline"],
  },
  reptile: {
    id: "reptile",
    name: "Reptile",
    family: "reptilian",
    emoji: "🦎",
    anatomicTraits: ["tail", "scales", "claws", "fangs"],
    hybridCompatible: ["reptilian", "draconic", "aquatic"],
  },
  lion: {
    id: "lion",
    name: "Lion",
    family: "feline",
    emoji: "🦁",
    anatomicTraits: ["tail", "fur", "mane", "claws", "fangs"],
    hybridCompatible: ["feline", "canine", "draconic", "ursine"],
  },
  panther: {
    id: "panther",
    name: "Panthère",
    family: "feline",
    emoji: "🐆",
    anatomicTraits: ["tail", "fur", "claws", "fangs", "whiskers"],
    hybridCompatible: ["feline", "canine", "draconic"],
  },
  phoenix: {
    id: "phoenix",
    name: "Phénix",
    family: "avian",
    emoji: "🦅",
    anatomicTraits: ["wings", "feathers", "tail", "beak", "claws"],
    hybridCompatible: ["avian", "draconic"],
  },
  raven: {
    id: "raven",
    name: "Corbeau",
    family: "avian",
    emoji: "🐦‍⬛",
    anatomicTraits: ["wings", "feathers", "beak", "claws", "tail"],
    hybridCompatible: ["avian", "feline"],
  },
  deer: {
    id: "deer",
    name: "Cerf",
    family: "custom",
    emoji: "🦌",
    anatomicTraits: ["tail", "fur", "horns", "ears_animal"],
    hybridCompatible: ["lagomorph", "canine"],
  },
  shark: {
    id: "shark",
    name: "Requin",
    family: "aquatic",
    emoji: "🦈",
    anatomicTraits: ["tail", "scales", "fangs", "gills"],
    hybridCompatible: ["aquatic", "reptilian"],
  },
  custom: {
    id: "custom",
    name: "Personnalisé",
    family: "custom",
    emoji: "✨",
    anatomicTraits: [],
    hybridCompatible: ["avian", "feline", "canine", "ursine", "draconic", "lagomorph", "reptilian", "aquatic", "custom"],
  },
};

// ─── Hybridization Engine ─────────────────────────────────────────────────────

/**
 * Calcule les traits anatomiques effectifs d'un hybride.
 * Les traits des deux espèces sont fusionnés et dédupliqués.
 * En cas d'incompatibilité anatomique, un avertissement est émis.
 */
export function computeHybridTraits(
  primary: SpeciesId,
  secondary: SpeciesId | null,
): AnatomicTrait[] {
  const primarySpecies = SPECIES_REGISTRY[primary];
  if (!primarySpecies) return [];

  if (!secondary || secondary === primary) {
    return [...primarySpecies.anatomicTraits];
  }

  const secondarySpecies = SPECIES_REGISTRY[secondary];
  if (!secondarySpecies) return [...primarySpecies.anatomicTraits];

  // Fusionner les traits (union sans doublons)
  const merged = new Set<AnatomicTrait>([
    ...primarySpecies.anatomicTraits,
    ...secondarySpecies.anatomicTraits,
  ]);

  const traits = Array.from(merged);
  console.debug(`[DEBUG][sprites2d-character] Hybrid ${primary}+${secondary} traits:`, traits);
  return traits;
}

/**
 * Détecte les conflits anatomiques (ex: bec + museau, plusieurs queues incompatibles)
 */
function detectAnatomicConflicts(traits: AnatomicTrait[]): string[] {
  const warnings: string[] = [];
  if (traits.includes("beak") && traits.includes("snout")) {
    warnings.push("[DEBUG] Conflit anatomique : beak + snout — le système choisira beak par défaut.");
  }
  if (traits.includes("gills") && traits.includes("fur")) {
    warnings.push("[DEBUG] Conflit anatomique : gills + fur — hybride aquatique/terrestre complexe.");
  }
  return warnings;
}

// ─── Morphology Presets ───────────────────────────────────────────────────────

export const MORPHOLOGY_PRESETS: Record<string, Morphology> = {
  chibi: {
    size: "small",
    build: "average",
    proportions: "chibi",
    heightTiles: 2,
    legLengthFactor: 0.6,
    armLengthFactor: 0.7,
    headSizeFactor: 1.4,
  },
  realistic: {
    size: "medium",
    build: "athletic",
    proportions: "realistic",
    heightTiles: 3,
    legLengthFactor: 1.0,
    armLengthFactor: 1.0,
    headSizeFactor: 1.0,
  },
  hero_standard: {
    size: "medium",
    build: "athletic",
    proportions: "heroic",
    heightTiles: 3,
    legLengthFactor: 1.1,
    armLengthFactor: 1.0,
    headSizeFactor: 1.0,
  },
  tank_heavy: {
    size: "large",
    build: "massive",
    proportions: "heroic",
    heightTiles: 3,
    legLengthFactor: 0.9,
    armLengthFactor: 1.3,
    headSizeFactor: 0.9,
  },
  mage_slim: {
    size: "medium",
    build: "slim",
    proportions: "realistic",
    heightTiles: 3,
    legLengthFactor: 1.1,
    armLengthFactor: 1.0,
    headSizeFactor: 1.0,
  },
  giant_boss: {
    size: "giant",
    build: "massive",
    proportions: "heroic",
    heightTiles: 5,
    legLengthFactor: 1.2,
    armLengthFactor: 1.5,
    headSizeFactor: 0.8,
  },
};

// ─── Skeleton Factory ─────────────────────────────────────────────────────────

/**
 * Génère un squelette adapté aux traits anatomiques du personnage.
 * Le type de squelette est déterminé par l'espèce principale.
 */
export function buildSkeleton(
  primarySpecies: SpeciesId,
  traits: AnatomicTrait[],
): Skeleton {
  const type = inferSkeletonType(primarySpecies, traits);
  const bones = buildBonesForType(type, traits);
  const attachPoints = buildAttachPoints(type, traits);

  console.debug(`[DEBUG][sprites2d-character] Skeleton built: type=${type}, bones=${bones.length}`);
  return { type, bones, attachPoints };
}

function inferSkeletonType(species: SpeciesId, traits: AnatomicTrait[]): SkeletonType {
  const sp = SPECIES_REGISTRY[species];
  if (sp.family === "reptilian" && !traits.includes("wings")) return "serpentine";
  if (sp.family === "aquatic") return "serpentine";
  if (["owl", "eagle", "phoenix", "raven"].includes(species)) return "avian";
  if (sp.family === "draconic") return "hybrid";
  return "humanoid"; // Par défaut : humanoïde bipède
}

function buildBonesForType(type: SkeletonType, traits: AnatomicTrait[]): Skeleton["bones"] {
  const base: Skeleton["bones"] = [
    { id: "root",       parentId: null,       offsetX: 0,  offsetY: 0,  rotation: 0, length: 0 },
    { id: "spine",      parentId: "root",     offsetX: 0,  offsetY: -16, rotation: 0, length: 16 },
    { id: "chest",      parentId: "spine",    offsetX: 0,  offsetY: -8, rotation: 0, length: 8 },
    { id: "head",       parentId: "chest",    offsetX: 0,  offsetY: -12, rotation: 0, length: 12 },
    { id: "arm_l",      parentId: "chest",    offsetX: -8, offsetY: 0,  rotation: 0, length: 10 },
    { id: "forearm_l",  parentId: "arm_l",    offsetX: 0,  offsetY: -10, rotation: 0, length: 8 },
    { id: "hand_l",     parentId: "forearm_l",offsetX: 0,  offsetY: -8, rotation: 0, length: 4 },
    { id: "arm_r",      parentId: "chest",    offsetX: 8,  offsetY: 0,  rotation: 0, length: 10 },
    { id: "forearm_r",  parentId: "arm_r",    offsetX: 0,  offsetY: -10, rotation: 0, length: 8 },
    { id: "hand_r",     parentId: "forearm_r",offsetX: 0,  offsetY: -8, rotation: 0, length: 4 },
    { id: "hip",        parentId: "root",     offsetX: 0,  offsetY: 4,  rotation: 0, length: 4 },
    { id: "thigh_l",    parentId: "hip",      offsetX: -4, offsetY: 4,  rotation: 0, length: 10 },
    { id: "shin_l",     parentId: "thigh_l",  offsetX: 0,  offsetY: 10, rotation: 0, length: 9 },
    { id: "foot_l",     parentId: "shin_l",   offsetX: 0,  offsetY: 9,  rotation: 0, length: 4 },
    { id: "thigh_r",    parentId: "hip",      offsetX: 4,  offsetY: 4,  rotation: 0, length: 10 },
    { id: "shin_r",     parentId: "thigh_r",  offsetX: 0,  offsetY: 10, rotation: 0, length: 9 },
    { id: "foot_r",     parentId: "shin_r",   offsetX: 0,  offsetY: 9,  rotation: 0, length: 4 },
  ];

  // Ajouter os optionnels selon les traits
  if (traits.includes("tail")) {
    base.push(
      { id: "tail_1", parentId: "root", offsetX: 0, offsetY: 8, rotation: 0, length: 8 },
      { id: "tail_2", parentId: "tail_1", offsetX: 0, offsetY: 8, rotation: 0, length: 6 },
      { id: "tail_3", parentId: "tail_2", offsetX: 0, offsetY: 6, rotation: 0, length: 4 },
    );
  }
  if (traits.includes("wings")) {
    base.push(
      { id: "wing_l_1", parentId: "chest", offsetX: -12, offsetY: -2, rotation: 0, length: 12 },
      { id: "wing_l_2", parentId: "wing_l_1", offsetX: -8, offsetY: 4, rotation: 0, length: 8 },
      { id: "wing_r_1", parentId: "chest", offsetX: 12, offsetY: -2, rotation: 0, length: 12 },
      { id: "wing_r_2", parentId: "wing_r_1", offsetX: 8, offsetY: 4, rotation: 0, length: 8 },
    );
  }
  if (traits.includes("horns")) {
    base.push(
      { id: "horn_l", parentId: "head", offsetX: -4, offsetY: -10, rotation: -20, length: 8 },
      { id: "horn_r", parentId: "head", offsetX: 4, offsetY: -10, rotation: 20, length: 8 },
    );
  }

  return base;
}

function buildAttachPoints(type: SkeletonType, traits: AnatomicTrait[]): Skeleton["attachPoints"] {
  const points: Skeleton["attachPoints"] = {
    weapon_right: { boneId: "hand_r", offsetX: 0, offsetY: -2 },
    weapon_left:  { boneId: "hand_l", offsetX: 0, offsetY: -2 },
    head_top:     { boneId: "head", offsetX: 0, offsetY: -12 },
    chest_center: { boneId: "chest", offsetX: 0, offsetY: 0 },
    back:         { boneId: "chest", offsetX: 0, offsetY: 2 },
    belt:         { boneId: "hip", offsetX: 0, offsetY: 0 },
    effect_right: { boneId: "hand_r", offsetX: 0, offsetY: -6 },
    effect_left:  { boneId: "hand_l", offsetX: 0, offsetY: -6 },
  };

  if (traits.includes("tail")) {
    points["tail_tip"] = { boneId: "tail_3", offsetX: 0, offsetY: 4 };
  }
  if (traits.includes("wings")) {
    points["wing_l_tip"] = { boneId: "wing_l_2", offsetX: -8, offsetY: 4 };
    points["wing_r_tip"] = { boneId: "wing_r_2", offsetX: 8, offsetY: 4 };
  }

  return points;
}

// ─── Default Palettes by Species ──────────────────────────────────────────────

export const DEFAULT_PALETTES: Partial<Record<SpeciesId, CharacterPalette>> = {
  owl:     { primary: "#8B6914", secondary: "#F5DEB3", accent: "#FFD700", marking: "#3D2B0C", outlineColor: "#1a1a1a" },
  cat:     { primary: "#F4A460", secondary: "#FFE4B5", accent: "#00CED1", marking: "#8B4513", outlineColor: "#1a1a1a" },
  wolf:    { primary: "#708090", secondary: "#C0C0C0", accent: "#FFD700", marking: "#2F2F2F", outlineColor: "#1a1a1a" },
  fox:     { primary: "#D2691E", secondary: "#FFF5E4", accent: "#FF4500", marking: "#8B0000", outlineColor: "#1a1a1a" },
  dragon:  { primary: "#006400", secondary: "#228B22", accent: "#FF4500", marking: "#8B0000", outlineColor: "#1a1a1a" },
  rabbit:  { primary: "#F5F5DC", secondary: "#FFF8DC", accent: "#FF69B4", marking: "#DEB887", outlineColor: "#1a1a1a" },
  bear:    { primary: "#8B4513", secondary: "#D2691E", accent: "#FFD700", marking: "#4a2508", outlineColor: "#1a1a1a" },
  eagle:   { primary: "#8B6914", secondary: "#F5DEB3", accent: "#FFFF00", marking: "#2F1B0A", outlineColor: "#1a1a1a" },
  lion:    { primary: "#DAA520", secondary: "#F5DEB3", accent: "#FF6347", marking: "#8B4513", outlineColor: "#1a1a1a" },
  custom:  { primary: "#A855F7", secondary: "#DDD6FE", accent: "#00F5FF", marking: "#6D28D9", outlineColor: "#1a1a1a" },
};

// ─── Character DNA Builder ────────────────────────────────────────────────────

let _dnaCounter = 0;

function generateDnaId(): string {
  _dnaCounter++;
  return `dna_${Date.now().toString(36)}_${_dnaCounter.toString(36).padStart(4, "0")}`;
}

export interface CharacterDNABuilderOptions {
  primarySpecies: SpeciesId;
  secondarySpecies?: SpeciesId | null;
  morphologyPreset?: keyof typeof MORPHOLOGY_PRESETS | Morphology;
  palette?: Partial<CharacterPalette>;
  heroClass?: HeroClassDNA;
  graphicStyle?: GraphicStyle;
}

/**
 * Construit un CharacterDNA complet à partir d'options minimales.
 * Le squelette et les traits sont calculés automatiquement.
 */
export function buildCharacterDNA(opts: CharacterDNABuilderOptions): CharacterDNA {
  console.debug("[DEBUG][sprites2d-character] buildCharacterDNA:", opts);

  const traits = computeHybridTraits(
    opts.primarySpecies,
    opts.secondarySpecies ?? null,
  );
  const warnings: string[] = [];

  const morphology: Morphology =
    typeof opts.morphologyPreset === "object"
      ? opts.morphologyPreset
      : (MORPHOLOGY_PRESETS[opts.morphologyPreset ?? "hero_standard"] as Morphology);

  const defaultPalette = DEFAULT_PALETTES[opts.primarySpecies] ?? DEFAULT_PALETTES.custom!;
  const palette: CharacterPalette = { ...defaultPalette, ...opts.palette };

  const skeleton = buildSkeleton(opts.primarySpecies, traits);

  const now = new Date().toISOString();
  const id = generateDnaId();

  const dna: CharacterDNA = {
    id,
    version: 1,
    createdAt: now,
    updatedAt: now,
    primarySpecies: opts.primarySpecies,
    secondarySpecies: opts.secondarySpecies ?? null,
    effectiveTraits: traits,
    morphology,
    palette,
    skeleton,
    equipment: {},
    heroClass: opts.heroClass ?? "WARRIOR",
    graphicStyle: opts.graphicStyle ?? "pixel_art_32",
    views: {},
    history: [
      {
        version: 1,
        timestamp: now,
        changeType: "creation",
        changedFields: ["primarySpecies", "secondarySpecies", "morphology", "palette", "skeleton"],
        previousValues: {},
      },
    ],
    meta: {
      lastGenerationProvider: null,
      viewsConsistent: false,
      qualityScore: null,
      exportReady: false,
      compatibilityWarnings: warnings,
    },
  };

  console.debug(`[DEBUG][sprites2d-character] DNA built: id=${id}, species=${opts.primarySpecies}+${opts.secondarySpecies ?? "none"}, traits=${traits.join(",")}`);
  return dna;
}

/**
 * Met à jour un champ du DNA et incrémente la version.
 * Enregistre l'historique des modifications.
 */
export function updateCharacterDNA(
  dna: CharacterDNA,
  changes: Partial<Pick<CharacterDNA, "morphology" | "palette" | "equipment" | "heroClass" | "graphicStyle">>,
  changeType: CharacterDNAHistoryEntry["changeType"] = "morphology",
): CharacterDNA {
  const now = new Date().toISOString();
  const newVersion = dna.version + 1;

  const previousValues: Record<string, unknown> = {};
  for (const key of Object.keys(changes)) {
    previousValues[key] = (dna as unknown as Record<string, unknown>)[key];
  }

  const newId = generateDnaId();
  const updated: CharacterDNA = {
    ...dna,
    id: newId,
    ...changes,
    version: newVersion,
    updatedAt: now,
    history: [
      ...dna.history,
      {
        version: newVersion,
        timestamp: now,
        changeType,
        changedFields: Object.keys(changes),
        previousValues,
      },
    ],
  };

  console.debug(`[DEBUG][sprites2d-character] DNA updated: id=${dna.id}, v${dna.version}→v${newVersion}, changed=${Object.keys(changes).join(",")}`);
  return updated;
}

// ─── OWLY Presets — 8 héros de base ──────────────────────────────────────────

export const OWLY_HERO_PRESETS: Record<string, CharacterDNABuilderOptions> = {
  SAMURAI: {
    primarySpecies: "owl",
    heroClass: "SAMURAI",
    morphologyPreset: "hero_standard",
    palette: { primary: "#CC3333", secondary: "#F5DEB3", accent: "#CC3333", marking: "#8B0000" },
    graphicStyle: "pixel_art_32",
  },
  CYBERPUNK: {
    primarySpecies: "cat",
    secondarySpecies: "raven",
    heroClass: "ENGINEER",
    morphologyPreset: "hero_standard",
    palette: { primary: "#1a1a2e", secondary: "#00F5FF", accent: "#FF00FF", marking: "#0d0d1f" },
    graphicStyle: "pixel_art_32",
  },
  MAGE: {
    primarySpecies: "owl",
    secondarySpecies: "dragon",
    heroClass: "MAGE",
    morphologyPreset: "mage_slim",
    palette: { primary: "#6B21A8", secondary: "#DDD6FE", accent: "#C084FC", marking: "#3B0764" },
    graphicStyle: "pixel_art_32",
  },
  ARCHER: {
    primarySpecies: "fox",
    secondarySpecies: "eagle",
    heroClass: "ARCHER",
    morphologyPreset: "hero_standard",
    palette: { primary: "#D97706", secondary: "#FEF3C7", accent: "#4ADE80", marking: "#92400E" },
    graphicStyle: "pixel_art_32",
  },
  KNIGHT: {
    primarySpecies: "lion",
    heroClass: "PALADIN",
    morphologyPreset: "hero_standard",
    palette: { primary: "#3B82F6", secondary: "#EFF6FF", accent: "#60A5FA", marking: "#1D4ED8" },
    graphicStyle: "pixel_art_32",
  },
  PIRATE: {
    primarySpecies: "raven",
    secondarySpecies: "fox",
    heroClass: "WARRIOR",
    morphologyPreset: "hero_standard",
    palette: { primary: "#F97316", secondary: "#FFF7ED", accent: "#FB923C", marking: "#7C2D12" },
    graphicStyle: "pixel_art_32",
  },
  NINJA: {
    primarySpecies: "cat",
    secondarySpecies: "panther",
    heroClass: "ASSASSIN",
    morphologyPreset: "mage_slim",
    palette: { primary: "#1C1917", secondary: "#A78BFA", accent: "#A78BFA", marking: "#0C0A09" },
    graphicStyle: "pixel_art_32",
  },
  TANK: {
    primarySpecies: "bear",
    secondarySpecies: "dragon",
    heroClass: "WARRIOR",
    morphologyPreset: "tank_heavy",
    palette: { primary: "#059669", secondary: "#ECFDF5", accent: "#34D399", marking: "#064E3B" },
    graphicStyle: "pixel_art_32",
  },
};

/**
 * Génère les 8 CharacterDNA de base pour OWLY.
 * Retourne un dictionnaire hero_class → CharacterDNA.
 */
export function buildOwlyHeroPresets(): Record<string, CharacterDNA> {
  const result: Record<string, CharacterDNA> = {};
  for (const [heroClass, opts] of Object.entries(OWLY_HERO_PRESETS)) {
    result[heroClass] = buildCharacterDNA(opts);
    console.debug(`[DEBUG][sprites2d-character] Preset built: ${heroClass}`);
  }
  return result;
}

// Re-export des types pour les consumers
export type { 
  Species, SpeciesId, SpeciesFamily, AnatomicTrait,
  Morphology, CharacterPalette, Skeleton, CharacterDNA,
  HeroClassDNA, GraphicStyle,
} from "@sprites2d/schema";
