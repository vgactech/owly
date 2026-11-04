/**
 * SPRITES 2D — Core Engine
 * Point d'entrée central — orchestrateur de tous les modules sprites2d-*
 *
 * Projet : OWLY / SPRITES 2D Universal Asset Creation Engine
 * Module : sprites2d-core
 *
 * RÈGLE ABSOLUE : Ce package ne doit JAMAIS importer depuis OWLY.
 *                 C'est OWLY qui importe sprites2d-*, jamais l'inverse.
 *
 * DEBUG MODE ACTIVE | CERTIFIED_100=false | unique_human_proven=false
 */

// ─── Re-exports publics des sous-packages ─────────────────────────────────────

// Schema — tous les types partagés
export type {
  SpeciesId,
  SpeciesFamily,
  Species,
  AnatomicTrait,
  MorphologySize,
  MorphologyBuild,
  MorphologyProportions,
  Morphology,
  CharacterPalette,
  SkeletonType,
  SkeletonBone,
  Skeleton,
  EquipmentSlot,
  EquipmentType,
  EquipmentItem,
  CharacterDNA,
  HeroClassDNA,
  GraphicStyle,
  CharacterView,
  GeneratedView,
  CharacterDNAHistoryEntry,
  CharacterDNAMeta,
  QualityCheckResult,
  QualityFailure,
  SpriteGenerationRequest,
  SpriteGenerationResult,
  Sprites2DConfig,
} from "@sprites2d/schema";

// Character — moteur déterministe de personnages
export {
  SPECIES_REGISTRY,
  computeHybridTraits,
  MORPHOLOGY_PRESETS,
  buildSkeleton,
  buildCharacterDNA,
  updateCharacterDNA,
  OWLY_HERO_PRESETS,
  buildOwlyHeroPresets,
} from "@sprites2d/character";

// Quality — moteur de validation
export { QualityEngine, checkP1Acceptance } from "@sprites2d/quality";

// AI — providers de génération
export { GenerationRouter } from "@sprites2d/ai/providers";

// ─── Engine Principal ─────────────────────────────────────────────────────────

import type { Sprites2DConfig, CharacterDNA, SpriteGenerationRequest, SpriteGenerationResult, CharacterView } from "@sprites2d/schema";
import { buildCharacterDNA, updateCharacterDNA } from "@sprites2d/character";
import { QualityEngine } from "@sprites2d/quality";
import { GenerationRouter } from "@sprites2d/ai/providers";

/**
 * Sprites2DEngine — Façade principale du moteur.
 *
 * Instancier via createSprites2DEngine(config).
 *
 * Flux standard :
 *  1. engine.createCharacter(params) → CharacterDNA
 *  2. engine.generateView(dna, view) → SpriteGenerationResult
 *  3. engine.validateCharacter(dna) → QualityCheckResult
 *  4. engine.exportCharacter(dna) → ExportPackage
 */
export class Sprites2DEngine {
  private readonly config: Sprites2DConfig;
  private readonly qualityEngine: QualityEngine;
  private readonly generationRouter: GenerationRouter;

  /** Tous les personnages actifs — en mémoire durant la session */
  private readonly characters: Map<string, CharacterDNA> = new Map();

  constructor(config: Sprites2DConfig) {
    this.config = config;
    this.qualityEngine = new QualityEngine();
    this.generationRouter = new GenerationRouter(config);

    if (config.debug) {
      console.debug("[SPRITES2D:core] Engine initialisé", {
        debug: config.debug,
        defaultStyle: config.defaultStyle,
        providers: {
          openai: !!config.providers.openai,
          claude: !!config.providers.claude,
          bob: !!config.providers.bob,
          local: !!config.providers.local?.enabled,
        },
        autoValidate: config.autoValidate,
      });
    }
  }

  // ─── Lifecycle du personnage ─────────────────────────────────────────────────

  /**
   * Crée un nouveau personnage à partir de paramètres minimaux.
   * Retourne un CharacterDNA versionné.
   */
  createCharacter(params: {
    primarySpecies: import("@sprites2d/schema").SpeciesId;
    secondarySpecies?: import("@sprites2d/schema").SpeciesId;
    heroClass?: import("@sprites2d/schema").HeroClassDNA;
    graphicStyle?: import("@sprites2d/schema").GraphicStyle;
    palette?: Partial<import("@sprites2d/schema").CharacterPalette>;
  }): CharacterDNA {
    const dna = buildCharacterDNA({
      primarySpecies: params.primarySpecies,
      secondarySpecies: params.secondarySpecies ?? null,
      heroClass: params.heroClass ?? "CUSTOM",
      graphicStyle: params.graphicStyle ?? this.config.defaultStyle,
      ...(params.palette !== undefined ? { palette: params.palette } : {}),
    });

    this.characters.set(dna.id, dna);

    if (this.config.debug) {
      console.debug(`[SPRITES2D:core] Personnage créé: ${dna.id}`, {
        primarySpecies: dna.primarySpecies,
        secondarySpecies: dna.secondarySpecies,
        effectiveTraits: dna.effectiveTraits,
      });
    }

    return dna;
  }

  /**
   * Met à jour un champ du CharacterDNA.
   * Crée un nouveau snapshot versionné — ne modifie pas l'original.
   */
  updateCharacter(
    dnaId: string,
    changes: Parameters<typeof updateCharacterDNA>[1]
  ): CharacterDNA {
    const current = this.characters.get(dnaId);
    if (!current) {
      throw new Error(`[SPRITES2D:core] Personnage introuvable: ${dnaId}`);
    }

    const updated = updateCharacterDNA(current, changes);
    this.characters.set(updated.id, updated);

    if (this.config.debug) {
      console.debug(`[SPRITES2D:core] Personnage mis à jour: ${dnaId} → v${updated.version}`, {
        changedFields: Object.keys(changes),
      });
    }

    return updated;
  }

  /**
   * Récupère un personnage par son ID.
   */
  getCharacter(dnaId: string): CharacterDNA | null {
    return this.characters.get(dnaId) ?? null;
  }

  /**
   * Liste tous les personnages actifs.
   */
  listCharacters(): CharacterDNA[] {
    return Array.from(this.characters.values());
  }

  // ─── Génération visuelle ─────────────────────────────────────────────────────

  /**
   * Génère la vue d'un personnage via le provider disponible.
   * Ordre de priorité : DALL-E → Claude → local déterministe.
   */
  async generateView(
    dna: CharacterDNA,
    view: CharacterView,
    options?: { forceRegenerate?: boolean }
  ): Promise<SpriteGenerationResult> {
    const request: SpriteGenerationRequest = {
      dna,
      view,
      forceRegenerate: options?.forceRegenerate ?? false,
    };

    if (this.config.debug) {
      console.debug(`[SPRITES2D:core] Génération vue "${view}" pour ${dna.id}`, {
        graphicStyle: dna.graphicStyle,
        primarySpecies: dna.primarySpecies,
      });
    }

    const result = await this.generationRouter.generate(request);

    if (this.config.debug) {
      console.debug(`[SPRITES2D:core] Résultat génération`, {
        success: result.success,
        provider: result.providerUsed,
        durationMs: result.durationMs,
      });
    }

    // Mise à jour du DNA avec la vue générée
    if (result.success && result.view) {
      const currentDna = this.characters.get(dna.id);
      if (currentDna) {
        const updatedDna: CharacterDNA = {
          ...currentDna,
          views: {
            ...currentDna.views,
            [view]: result.view,
          },
          updatedAt: new Date().toISOString(),
        };
        this.characters.set(dna.id, updatedDna);
      }
    }

    return result;
  }

  // ─── Validation ──────────────────────────────────────────────────────────────

  /**
   * Valide un CharacterDNA — retourne un rapport QualityCheckResult.
   */
  validateCharacter(dna: CharacterDNA) {
    const result = this.qualityEngine.validateCharacterDNA(dna);

    if (this.config.debug) {
      console.debug(`[SPRITES2D:core] Validation ${dna.id}`, {
        passed: result.passed,
        failures: result.failures.length,
        warnings: result.warnings.length,
      });
    }

    return result;
  }

  // ─── Export ───────────────────────────────────────────────────────────────────

  /**
   * Sérialise un CharacterDNA en package exportable (JSON + métadonnées).
   * Ne génère pas les images — appeler generateView() avant.
   */
  exportCharacter(dna: CharacterDNA): CharacterExportPackage {
    const validation = this.qualityEngine.validateCharacterDNA(dna);

    const pkg: CharacterExportPackage = {
      formatVersion: "sprites2d-v1",
      exportedAt: new Date().toISOString(),
      dna,
      validation,
      views: dna.views,
      canBeUsedInGame: validation.passed && dna.meta.exportReady,
    };

    if (this.config.debug) {
      console.debug(`[SPRITES2D:core] Export ${dna.id}`, {
        canBeUsedInGame: pkg.canBeUsedInGame,
        viewsCount: Object.keys(dna.views).length,
      });
    }

    return pkg;
  }

  // ─── Diagnostics ─────────────────────────────────────────────────────────────

  /**
   * Retourne les informations de santé du moteur.
   */
  getEngineInfo(): EngineInfo {
    return {
      version: "0.1.0",
      debug: this.config.debug,
      charactersInMemory: this.characters.size,
      providers: {
        openai: !!this.config.providers.openai,
        claude: !!this.config.providers.claude,
        bob: !!this.config.providers.bob,
        local: !!this.config.providers.local?.enabled,
      },
      defaultStyle: this.config.defaultStyle,
      autoValidate: this.config.autoValidate,
    };
  }
}

// ─── Types exportés par ce module ─────────────────────────────────────────────

export interface CharacterExportPackage {
  formatVersion: "sprites2d-v1";
  exportedAt: string;
  dna: CharacterDNA;
  validation: import("@sprites2d/schema").QualityCheckResult;
  views: CharacterDNA["views"];
  /** true si le personnage a passé la validation et peut être intégré dans un jeu */
  canBeUsedInGame: boolean;
}

export interface EngineInfo {
  version: string;
  debug: boolean;
  charactersInMemory: number;
  providers: {
    openai: boolean;
    claude: boolean;
    bob: boolean;
    local: boolean;
  };
  defaultStyle: import("@sprites2d/schema").GraphicStyle;
  autoValidate: boolean;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * createSprites2DEngine — Fonction de création du moteur.
 *
 * @example
 * ```typescript
 * const engine = createSprites2DEngine({
 *   debug: true,
 *   providers: {
 *     openai: { apiKey: process.env.OPENAI_API_KEY!, model: "dall-e-3" },
 *   },
 *   defaultStyle: "pixel_art_32",
 *   cacheDir: ".sprites2d-cache",
 *   autoValidate: true,
 * });
 * ```
 */
export function createSprites2DEngine(config: Sprites2DConfig): Sprites2DEngine {
  if (config.debug) {
    console.debug("[SPRITES2D:core] Création du moteur SPRITES 2D...");
  }
  return new Sprites2DEngine(config);
}
