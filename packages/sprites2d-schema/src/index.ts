/**
 * SPRITES 2D — Schema Package
 * Contrats de données centraux partagés entre tous les packages sprites2d-*
 *
 * Projet : OWLY / SPRITES 2D Universal Asset Creation Engine
 * Module : sprites2d-schema — types, interfaces, enums
 *
 * RULE: Ce package ne doit JAMAIS importer quoi que ce soit d'OWLY.
 *       C'est OWLY qui importe sprites2d-*, jamais l'inverse.
 *
 * DEBUG MODE ACTIVE | CERTIFIED_100=false | unique_human_proven=false
 */

// ─── Species ──────────────────────────────────────────────────────────────────

export type SpeciesId =
  | "owl"
  | "cat"
  | "wolf"
  | "fox"
  | "dragon"
  | "rabbit"
  | "bear"
  | "eagle"
  | "reptile"
  | "lion"
  | "panther"
  | "phoenix"
  | "raven"
  | "deer"
  | "shark"
  | "custom";

export type SpeciesFamily =
  | "avian"      // hibou, aigle, phénix, corbeau
  | "feline"     // chat, lion, panthère
  | "canine"     // loup, renard
  | "ursine"     // ours
  | "draconic"   // dragon
  | "lagomorph"  // lapin, lièvre
  | "reptilian"  // serpent, lézard, croco
  | "aquatic"    // requin, pieuvre
  | "custom";

export interface Species {
  id: SpeciesId;
  name: string;
  family: SpeciesFamily;
  emoji: string;
  /** Traits anatomiques portés par cette espèce */
  anatomicTraits: AnatomicTrait[];
  /** Familles compatibles pour hybridation */
  hybridCompatible: SpeciesFamily[];
}

export type AnatomicTrait =
  | "tail"
  | "wings"
  | "horns"
  | "feathers"
  | "scales"
  | "fur"
  | "mane"
  | "claws"
  | "beak"
  | "snout"
  | "ears_animal"
  | "whiskers"
  | "fangs"
  | "gills"
  | "tentacles";

// ─── Morphology ───────────────────────────────────────────────────────────────

export type MorphologySize = "tiny" | "small" | "medium" | "large" | "giant";
export type MorphologyBuild = "slim" | "average" | "athletic" | "stocky" | "massive";
export type MorphologyProportions = "chibi" | "realistic" | "heroic" | "caricature";

export interface Morphology {
  size: MorphologySize;
  build: MorphologyBuild;
  proportions: MorphologyProportions;
  /** Hauteur en "tiles" (unité SPRITES 2D) */
  heightTiles: number;
  /** 0.0–2.0 : 1.0 = jambes standard */
  legLengthFactor: number;
  /** 0.0–2.0 : 1.0 = bras standard */
  armLengthFactor: number;
  /** 0.0–2.0 : 1.0 = tête standard */
  headSizeFactor: number;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

export interface CharacterPalette {
  /** Couleur principale du corps / fourrure / peau */
  primary: string;     // hex #rrggbb
  secondary: string;   // hex
  accent: string;      // hex — yeux, points lumineux
  /** Couleur de la fourrure / plumes secondaires */
  marking: string;     // hex — rayures, taches
  outlineColor: string; // hex — contour des pixels
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export type SkeletonType =
  | "humanoid"
  | "quadruped"
  | "avian"
  | "serpentine"
  | "arachnid"
  | "hybrid";

export interface SkeletonBone {
  id: string;
  parentId: string | null;
  /** Position relative au parent (en pixels à résolution 32×32) */
  offsetX: number;
  offsetY: number;
  /** Angle en degrés */
  rotation: number;
  length: number;
}

export interface Skeleton {
  type: SkeletonType;
  bones: SkeletonBone[];
  /** Points d'attache nommés (weapon_right, weapon_left, cape, effect_1…) */
  attachPoints: Record<string, { boneId: string; offsetX: number; offsetY: number }>;
}

// ─── Equipment ────────────────────────────────────────────────────────────────

export type EquipmentSlot =
  | "head"
  | "body"
  | "legs"
  | "feet"
  | "hands"
  | "weapon_right"
  | "weapon_left"
  | "back"
  | "belt"
  | "accessory_1"
  | "accessory_2";

export type EquipmentType =
  | "helmet"
  | "armor_body"
  | "pants"
  | "boots"
  | "gloves"
  | "weapon_sword"
  | "weapon_axe"
  | "weapon_spear"
  | "weapon_bow"
  | "weapon_staff"
  | "weapon_gun"
  | "shield"
  | "cloak"
  | "wings_equipment"
  | "aura";

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  type: EquipmentType;
  /** Couche de rendu — ordre d'assemblage */
  layerOrder: number;
  /** Restrictions d'espèces (vide = universel) */
  speciesRestrictions: SpeciesId[];
  /** Traits anatomiques requis pour être équipé */
  requiredTraits: AnatomicTrait[];
  /** Traits anatomiques incompatibles */
  incompatibleTraits: AnatomicTrait[];
  /** Offsets de position par espèce */
  speciesOffsets: Partial<Record<SpeciesId, { dx: number; dy: number }>>;
}

// ─── Character DNA ────────────────────────────────────────────────────────────

/**
 * CharacterDNA — Identité technique persistante du personnage.
 * Toute modification passe par un nouveau snapshot versionné.
 * Un changement d'équipement ne peut pas modifier l'ADN de base.
 */
export interface CharacterDNA {
  /** Identifiant unique immuable */
  id: string;
  /** Version de ce snapshot (incrémentale) */
  version: number;
  /** Horodatage de création */
  createdAt: string;
  /** Horodatage de dernière modification */
  updatedAt: string;

  // — Espèces —
  primarySpecies: SpeciesId;
  secondarySpecies: SpeciesId | null;
  /** Traits anatomiques effectifs après hybridation */
  effectiveTraits: AnatomicTrait[];

  // — Morphologie —
  morphology: Morphology;

  // — Palette —
  palette: CharacterPalette;

  // — Squelette —
  skeleton: Skeleton;

  // — Équipements actuels —
  equipment: Partial<Record<EquipmentSlot, EquipmentItem>>;

  // — Classe de héros (overlay de jeu, ne change pas l'ADN) —
  heroClass: HeroClassDNA;

  // — Style graphique —
  graphicStyle: GraphicStyle;

  // — Vues générées —
  views: Partial<Record<CharacterView, GeneratedView>>;

  // — Historique des modifications —
  history: CharacterDNAHistoryEntry[];

  // — Metadata —
  meta: CharacterDNAMeta;
}

export type HeroClassDNA =
  | "SAMURAI" | "CYBERPUNK" | "MAGE" | "ARCHER"
  | "KNIGHT" | "PIRATE" | "NINJA" | "TANK"
  | "WARRIOR" | "ASSASSIN" | "PALADIN" | "DRUID"
  | "SUMMONER" | "ENGINEER" | "PRIEST" | "NECROMANCER"
  | "BARD" | "BERSERKER" | "CUSTOM";

export type GraphicStyle =
  | "pixel_art_16"   // 16×16 pixels
  | "pixel_art_32"   // 32×32 pixels
  | "pixel_art_64"   // 64×64 pixels
  | "pixel_art_128"  // 128×128 pixels
  | "chibi"
  | "anime"
  | "cartoon"
  | "isometric";

export type CharacterView =
  | "front"
  | "back"
  | "left"
  | "right"
  | "three_quarters"
  | "isometric"
  | "top_down";

export interface GeneratedView {
  view: CharacterView;
  /** URL ou data:image/png;base64,... */
  imageUrl: string;
  /** Dimensions en pixels */
  width: number;
  height: number;
  /** SHA-256 du contenu de l'image */
  checksum: string;
  generatedAt: string;
  /** Provider utilisé : "deterministic" | "dalle" | "claude_vision" | "local" */
  provider: string;
}

export interface CharacterDNAHistoryEntry {
  version: number;
  timestamp: string;
  changeType: "species" | "morphology" | "palette" | "equipment" | "class" | "style" | "creation";
  changedFields: string[];
  previousValues: Record<string, unknown>;
}

export interface CharacterDNAMeta {
  /** Provider IA utilisé pour la dernière génération visuelle */
  lastGenerationProvider: string | null;
  /** true si toutes les vues sont cohérentes entre elles */
  viewsConsistent: boolean;
  /** Score de qualité global [0–100] */
  qualityScore: number | null;
  /** true si le personnage peut être exporté */
  exportReady: boolean;
  /** Avertissements de compatibilité équipement */
  compatibilityWarnings: string[];
}

// ─── Asset Quality ────────────────────────────────────────────────────────────

export interface QualityCheckResult {
  assetId: string;
  assetType: "character" | "sprite" | "animation" | "tileset" | "vfx";
  timestamp: string;
  passed: boolean;
  scores: {
    visualFidelity: number | null;       // 0–100
    anatomicalConsistency: number | null;
    animationQuality: number | null;
    pixelIntegrity: number | null;
    equipmentCompatibility: number | null;
    runtimeReadiness: number | null;
    licenseCompliance: number | null;
  };
  failures: QualityFailure[];
  warnings: string[];
}

export interface QualityFailure {
  code: string;
  severity: "blocking" | "warning" | "info";
  message: string;
  field?: string;
}

// ─── Generation Request ───────────────────────────────────────────────────────

export interface SpriteGenerationRequest {
  dna: CharacterDNA;
  view: CharacterView;
  /** Provider préféré — le router choisit le fallback si indisponible */
  preferredProvider?: "dalle" | "claude_vision" | "deterministic" | "local";
  forceRegenerate?: boolean;
}

export interface SpriteGenerationResult {
  request: SpriteGenerationRequest;
  success: boolean;
  view: GeneratedView | null;
  error: string | null;
  providerUsed: string;
  durationMs: number;
}

// ─── SPRITES 2D Engine Config ─────────────────────────────────────────────────

export interface Sprites2DConfig {
  /** Mode debug — logs verbeux */
  debug: boolean;
  /** Fournisseurs IA disponibles */
  providers: {
    openai?: { apiKey: string; model: string };
    claude?: { apiKey: string };
    bob?: { apiKey: string; baseUrl: string };
    mistral?: { apiKey: string; model?: string };
    local?: { enabled: boolean };
  };
  /** Résolution par défaut */
  defaultStyle: GraphicStyle;
  /** Dossier de cache local */
  cacheDir: string;
  /** Activer la validation automatique */
  autoValidate: boolean;
}
