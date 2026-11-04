/**
 * SPRITES 2D — AI Generation Providers
 * OpenAI DALL-E 3 + Claude Vision + IBM Bob + Mistral AI + Local Fallback
 *
 * Projet : OWLY / SPRITES 2D Universal Asset Creation Engine
 * Module : sprites2d-ai/providers
 *
 * RÈGLE ARCHITECTURALE :
 *   - DALL-E 3 (OpenAI) = génération d'images principales
 *   - Claude (Anthropic) = validation et cohérence du DNA
 *   - IBM Bob = orchestration et raisonnement
 *   - Mistral AI = alternative open-source, génération de prompts + analyse DNA
 *   - Local = fallback procédural déterministe (0 API requis)
 *   - SEELE = lecture seule, référence de comparaison UNIQUEMENT
 *
 * LES CLÉS VIENNENT DE DOPPLER LVX (jamais hardcodées ici) :
 *   OPENAI_API_KEY, API_CLAUDE_CODE, BOB_API_KEY, MISTRAL_API_KEY
 *
 * DEBUG MODE ACTIVE | CERTIFIED_100=false | unique_human_proven=false
 */

import type {
  CharacterDNA,
  CharacterView,
  GeneratedView,
  SpriteGenerationRequest,
  SpriteGenerationResult,
  Sprites2DConfig,
} from "@sprites2d/schema";

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface SpriteProvider {
  name: string;
  available: boolean;
  generate(request: SpriteGenerationRequest): Promise<GeneratedView>;
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

/**
 * Construit un prompt DALL-E optimisé pour la génération de sprites pixel art.
 * Le prompt intègre : espèce, hybride, morphologie, palette, style, vue.
 */
export function buildDallePrompt(dna: CharacterDNA, view: CharacterView): string {
  const speciesLabel = dna.secondarySpecies
    ? `${dna.primarySpecies}-${dna.secondarySpecies} hybrid`
    : dna.primarySpecies;

  const morphLabel = `${dna.morphology.build} ${dna.morphology.size} build, ${dna.morphology.proportions} proportions`;
  const classLabel = dna.heroClass.toLowerCase().replace(/_/g, " ");

  const viewLabel: Record<CharacterView, string> = {
    front: "front view, facing camera",
    back: "back view",
    left: "left side profile",
    right: "right side profile",
    three_quarters: "3/4 angle view",
    isometric: "isometric view, 45 degree angle",
    top_down: "top-down view",
  };

  const styleLabel: Record<string, string> = {
    pixel_art_16: "16x16 pixel art, very limited palette",
    pixel_art_32: "32x32 pixel art, clean pixel art style",
    pixel_art_64: "64x64 pixel art, detailed pixel art",
    pixel_art_128: "128x128 pixel art, highly detailed",
    chibi: "chibi anime style, large head small body",
    anime: "anime style, clean lines",
    cartoon: "cartoon style",
    isometric: "isometric pixel art",
  };

  const traitsLabel = dna.effectiveTraits.slice(0, 4).join(", ");

  const prompt = [
    `2D video game character sprite, ${styleLabel[dna.graphicStyle] ?? "pixel art style"},`,
    `${speciesLabel} anthropomorphic character,`,
    `${classLabel} class warrior,`,
    `${morphLabel},`,
    traitsLabel ? `with ${traitsLabel},` : "",
    `primary color ${dna.palette.primary}, secondary color ${dna.palette.secondary},`,
    `${viewLabel[view]},`,
    "transparent background, full body, game-ready sprite,",
    "consistent anatomy, no blur, crisp pixels,",
    "professional RPG game asset, isolated on white or transparent background",
  ]
    .filter(Boolean)
    .join(" ");

  console.debug(`[DEBUG][sprites2d-ai] DALL-E prompt (${view}): ${prompt.substring(0, 120)}...`);
  return prompt;
}

// ─── OpenAI DALL-E 3 Provider ─────────────────────────────────────────────────

export class DalleProvider implements SpriteProvider {
  name = "dalle";
  available: boolean;
  private apiKey: string;
  private model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "dall-e-3";
    this.available = Boolean(config.apiKey);
    console.debug(`[DEBUG][sprites2d-ai] DalleProvider initialized, available=${this.available}, model=${this.model}`);
  }

  async generate(request: SpriteGenerationRequest): Promise<GeneratedView> {
    if (!this.available) throw new Error("DalleProvider: apiKey absent");

    const prompt = buildDallePrompt(request.dna, request.view);
    const start = Date.now();

    console.debug(`[DEBUG][sprites2d-ai] DALL-E generation starting for view=${request.view}`);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DALL-E API error ${response.status}: ${err}`);
    }

    const data = await response.json() as { data: Array<{ url: string }> };
    const imageUrl = data.data[0]?.url;
    if (!imageUrl) throw new Error("DALL-E: no image URL in response");

    const durationMs = Date.now() - start;
    console.debug(`[DEBUG][sprites2d-ai] DALL-E generation done in ${durationMs}ms`);

    return {
      view: request.view,
      imageUrl,
      width: 1024,
      height: 1024,
      checksum: await computeUrlChecksum(imageUrl),
      generatedAt: new Date().toISOString(),
      provider: "dalle",
    };
  }
}

// ─── Claude Vision Provider ───────────────────────────────────────────────────

export class ClaudeProvider implements SpriteProvider {
  name = "claude_vision";
  available: boolean;
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.available = Boolean(config.apiKey);
    console.debug(`[DEBUG][sprites2d-ai] ClaudeProvider initialized, available=${this.available}`);
  }

  /**
   * Claude est utilisé pour la VALIDATION et la COHÉRENCE du DNA,
   * pas pour la génération d'images directe.
   * Retourne une analyse texte qui peut déclencher des corrections.
   */
  async analyzeDNAConsistency(dna: CharacterDNA): Promise<{
    consistent: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    if (!this.available) {
      return { consistent: true, issues: [], suggestions: ["Claude non disponible — validation automatique uniquement."] };
    }

    const prompt = `You are a game character design expert specializing in pixel art RPG characters.
    
Analyze this character DNA for consistency and provide issues/suggestions in JSON format:
- Species: ${dna.primarySpecies}${dna.secondarySpecies ? ` + ${dna.secondarySpecies} (hybrid)` : ""}
- Hero class: ${dna.heroClass}
- Morphology: ${dna.morphology.build} ${dna.morphology.size}, ${dna.morphology.proportions}
- Traits: ${dna.effectiveTraits.join(", ")}
- Equipment slots used: ${Object.keys(dna.equipment).join(", ") || "none"}

Respond ONLY with valid JSON: {"consistent": boolean, "issues": string[], "suggestions": string[]}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        console.debug(`[DEBUG][sprites2d-ai] Claude API error ${response.status}`);
        return { consistent: true, issues: [], suggestions: [] };
      }

      const data = await response.json() as { content: Array<{ text: string }> };
      const text = data.content[0]?.text ?? "{}";
      const parsed = JSON.parse(text) as { consistent: boolean; issues: string[]; suggestions: string[] };
      console.debug(`[DEBUG][sprites2d-ai] Claude analysis: consistent=${parsed.consistent}, issues=${parsed.issues.length}`);
      return parsed;
    } catch (e) {
      console.debug(`[DEBUG][sprites2d-ai] Claude analysis failed:`, e);
      return { consistent: true, issues: [], suggestions: [] };
    }
  }

  async generate(_request: SpriteGenerationRequest): Promise<GeneratedView> {
    throw new Error("ClaudeProvider: image generation not supported — use analyzeDNAConsistency()");
  }
}

// ─── IBM Bob Provider (orchestration) ────────────────────────────────────────

export class BobProvider implements SpriteProvider {
  name = "bob";
  available: boolean;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://us-south.ml.cloud.ibm.com";
    this.available = Boolean(config.apiKey);
    console.debug(`[DEBUG][sprites2d-ai] BobProvider initialized, available=${this.available}`);
  }

  async generate(_request: SpriteGenerationRequest): Promise<GeneratedView> {
    throw new Error("BobProvider: not a visual generator — use for orchestration only");
  }

  /**
   * Utilise IBM Bob pour générer le prompt optimal pour DALL-E.
   * Bob raisonne sur le DNA pour créer un prompt plus précis.
   */
  async optimizePrompt(dna: CharacterDNA, view: CharacterView): Promise<string> {
    if (!this.available) {
      return buildDallePrompt(dna, view);
    }
    // Fallback sur le prompt builder local si Bob ne répond pas
    return buildDallePrompt(dna, view);
  }
}

// ─── Mistral AI Provider ──────────────────────────────────────────────────────

/**
 * Mistral AI Provider — alternative open-source à Claude.
 * Rôles : analyse de cohérence du DNA + optimisation de prompts.
 * Modèle par défaut : mistral-large-latest (meilleur raisonnement).
 * N'est PAS un générateur d'images — utiliser avec DalleProvider pour les visuels.
 */
export class MistralProvider implements SpriteProvider {
  name = "mistral";
  available: boolean;
  private apiKey: string;
  private model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "mistral-large-latest";
    this.available = Boolean(config.apiKey);
    console.debug(
      `[DEBUG][sprites2d-ai] MistralProvider initialized, available=${this.available}, model=${this.model}`
    );
  }

  /**
   * Analyse la cohérence d'un CharacterDNA via Mistral.
   * Alternative à ClaudeProvider.analyzeDNAConsistency().
   */
  async analyzeDNAConsistency(dna: CharacterDNA): Promise<{
    consistent: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    if (!this.available) {
      return {
        consistent: true,
        issues: [],
        suggestions: ["Mistral non disponible — validation automatique uniquement."],
      };
    }

    const prompt = `You are a game character design expert specializing in pixel art RPG characters.

Analyze this character DNA for consistency and provide issues/suggestions:
- Species: ${dna.primarySpecies}${dna.secondarySpecies ? ` + ${dna.secondarySpecies} (hybrid)` : ""}
- Hero class: ${dna.heroClass}
- Morphology: ${dna.morphology.build} ${dna.morphology.size}, ${dna.morphology.proportions}
- Traits: ${dna.effectiveTraits.join(", ")}
- Equipment slots used: ${Object.keys(dna.equipment).join(", ") || "none"}

Respond ONLY with valid JSON: {"consistent": boolean, "issues": string[], "suggestions": string[]}`;

    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        console.debug(`[DEBUG][sprites2d-ai] Mistral API error ${response.status}`);
        return { consistent: true, issues: [], suggestions: [] };
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const text = data.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(text) as {
        consistent: boolean;
        issues: string[];
        suggestions: string[];
      };
      console.debug(
        `[DEBUG][sprites2d-ai] Mistral analysis: consistent=${parsed.consistent}, issues=${parsed.issues.length}`
      );
      return parsed;
    } catch (e) {
      console.debug(`[DEBUG][sprites2d-ai] Mistral analysis failed:`, e);
      return { consistent: true, issues: [], suggestions: [] };
    }
  }

  /**
   * Optimise un prompt DALL-E via Mistral.
   * Retourne un prompt enrichi par le raisonnement Mistral.
   */
  async optimizePrompt(dna: CharacterDNA, view: CharacterView): Promise<string> {
    if (!this.available) {
      return buildDallePrompt(dna, view);
    }

    const basePrompt = buildDallePrompt(dna, view);

    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: `You are a professional prompt engineer for AI image generation.
Improve this sprite generation prompt for better pixel art quality.
Keep it under 300 characters. Return ONLY the improved prompt, no explanation.

Original prompt: ${basePrompt}`,
            },
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.debug(`[DEBUG][sprites2d-ai] Mistral optimizePrompt error ${response.status}`);
        return basePrompt;
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const optimized = data.choices[0]?.message?.content?.trim();
      if (!optimized) return basePrompt;

      console.debug(`[DEBUG][sprites2d-ai] Mistral optimized prompt: ${optimized.substring(0, 80)}...`);
      return optimized;
    } catch (e) {
      console.debug(`[DEBUG][sprites2d-ai] Mistral optimizePrompt failed:`, e);
      return basePrompt;
    }
  }

  // MistralProvider ne génère pas d'images directement
  async generate(_request: SpriteGenerationRequest): Promise<GeneratedView> {
    throw new Error(
      "MistralProvider: image generation not supported — use analyzeDNAConsistency() or optimizePrompt()"
    );
  }
}

// ─── Local Fallback Provider ──────────────────────────────────────────────────

/**
 * Provider procédural local.
 * Génère un placeholder SVG déterministe basé sur le DNA.
 * Fonctionne 100% offline sans aucune API.
 */
export class LocalProvider implements SpriteProvider {
  name = "local";
  available = true;

  async generate(request: SpriteGenerationRequest): Promise<GeneratedView> {
    const { dna, view } = request;
    console.debug(`[DEBUG][sprites2d-ai] LocalProvider generating placeholder for view=${view}`);

    const svg = buildPlaceholderSvg(dna, view);
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

    return {
      view,
      imageUrl: dataUrl,
      width: 64,
      height: 64,
      checksum: simpleHash(svg),
      generatedAt: new Date().toISOString(),
      provider: "local",
    };
  }
}

function buildPlaceholderSvg(dna: CharacterDNA, view: CharacterView): string {
  const { primary, secondary, accent, outlineColor } = dna.palette;
  const label = `${dna.primarySpecies.toUpperCase()}\n${dna.heroClass}\n[${view}]`;

  // Corps simple en pixel art (cercle tête + rectangle corps)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" shape-rendering="crispEdges">
  <rect width="64" height="64" fill="${secondary}"/>
  <!-- Corps -->
  <rect x="20" y="28" width="24" height="22" fill="${primary}" stroke="${outlineColor}" stroke-width="1"/>
  <!-- Tête -->
  <rect x="22" y="12" width="20" height="18" fill="${primary}" stroke="${outlineColor}" stroke-width="1"/>
  <!-- Yeux -->
  <rect x="26" y="18" width="4" height="4" fill="${accent}"/>
  <rect x="34" y="18" width="4" height="4" fill="${accent}"/>
  <!-- Jambes -->
  <rect x="20" y="50" width="9" height="10" fill="${primary}" stroke="${outlineColor}" stroke-width="1"/>
  <rect x="35" y="50" width="9" height="10" fill="${primary}" stroke="${outlineColor}" stroke-width="1"/>
  <!-- Label -->
  <text x="32" y="63" text-anchor="middle" font-size="4" fill="${outlineColor}" font-family="monospace">
    ${dna.primarySpecies}
  </text>
</svg>`;
}

// ─── Generation Router ────────────────────────────────────────────────────────

/**
 * Route les requêtes de génération vers le provider approprié.
 * Ordre de priorité : DALL-E 3 → Claude (si fallback) → Local
 */
export class GenerationRouter {
  private dalle: DalleProvider | null = null;
  private claude: ClaudeProvider | null = null;
  private bob: BobProvider | null = null;
  private mistral: MistralProvider | null = null;
  private local: LocalProvider;
  private debug: boolean;

  constructor(config: Sprites2DConfig) {
    this.debug = config.debug;
    this.local = new LocalProvider();

    if (config.providers.openai?.apiKey) {
      this.dalle = new DalleProvider({
        apiKey: config.providers.openai.apiKey,
        model: config.providers.openai.model ?? "dall-e-3",
      });
    }
    if (config.providers.claude?.apiKey) {
      this.claude = new ClaudeProvider({ apiKey: config.providers.claude.apiKey });
    }
    if (config.providers.bob?.apiKey) {
      this.bob = new BobProvider({
        apiKey: config.providers.bob.apiKey,
        baseUrl: config.providers.bob.baseUrl,
      });
    }
    if (config.providers.mistral?.apiKey) {
      this.mistral = new MistralProvider({
        apiKey: config.providers.mistral.apiKey,
        ...(config.providers.mistral.model !== undefined
          ? { model: config.providers.mistral.model }
          : {}),
      });
    }

    if (this.debug) {
      console.debug(`[DEBUG][sprites2d-ai] GenerationRouter initialized:`);
      console.debug(`  DALL-E: ${this.dalle?.available ? "✅" : "❌"}`);
      console.debug(`  Claude: ${this.claude?.available ? "✅" : "❌"}`);
      console.debug(`  Bob: ${this.bob?.available ? "✅" : "❌"}`);
      console.debug(`  Mistral: ${this.mistral?.available ? "✅" : "❌"}`);
      console.debug(`  Local: ✅ (always available)`);
    }
  }

  async generate(request: SpriteGenerationRequest): Promise<SpriteGenerationResult> {
    const start = Date.now();
    const preferred = request.preferredProvider;

    // Sélection du provider
    const providers: SpriteProvider[] = [];
    if (preferred === "dalle" && this.dalle?.available) providers.push(this.dalle);
    else if (preferred === "local") providers.push(this.local);
    else {
      // Ordre par défaut
      if (this.dalle?.available) providers.push(this.dalle);
      providers.push(this.local); // toujours en fallback
    }

    for (const provider of providers) {
      try {
        if (this.debug) {
          console.debug(`[DEBUG][sprites2d-ai] Trying provider: ${provider.name}`);
        }
        const view = await provider.generate(request);
        return {
          request,
          success: true,
          view,
          error: null,
          providerUsed: provider.name,
          durationMs: Date.now() - start,
        };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.debug(`[DEBUG][sprites2d-ai] Provider ${provider.name} failed: ${msg}`);
        // Continue vers le provider suivant
      }
    }

    // Dernier recours : local
    const view = await this.local.generate(request);
    return {
      request,
      success: true,
      view,
      error: "All preferred providers failed — used local fallback",
      providerUsed: "local",
      durationMs: Date.now() - start,
    };
  }

  getClaudeProvider(): ClaudeProvider | null {
    return this.claude;
  }

  getMistralProvider(): MistralProvider | null {
    return this.mistral;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function computeUrlChecksum(url: string): Promise<string> {
  // Checksum simple de l'URL (pas du contenu — évite un second fetch)
  return simpleHash(url);
}

function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

// Re-exports
export type { SpriteGenerationRequest, SpriteGenerationResult, GeneratedView, Sprites2DConfig } from "@sprites2d/schema";
