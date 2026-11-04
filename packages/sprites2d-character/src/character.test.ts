/**
 * SPRITES 2D — Tests sprites2d-character
 *
 * Projet : OWLY / SPRITES 2D Universal Asset Creation Engine
 * Module : sprites2d-character — tests unitaires complets
 *
 * DEBUG MODE ACTIVE | CERTIFIED_100=false
 *
 * Couverture T01–T25 : SPECIES_REGISTRY, hybridation, morphologie,
 *   squelette, buildCharacterDNA, updateCharacterDNA, presets OWLY.
 */

import { describe, it, expect } from "vitest";
import {
  SPECIES_REGISTRY,
  computeHybridTraits,
  MORPHOLOGY_PRESETS,
  buildSkeleton,
  buildCharacterDNA,
  updateCharacterDNA,
  OWLY_HERO_PRESETS,
  buildOwlyHeroPresets,
} from "./index";

// ─── T01–T02 : SPECIES_REGISTRY ───────────────────────────────────────────────

describe("SPECIES_REGISTRY", () => {
  it("T01 — contient toutes les espèces de base", () => {
    const expected = ["owl", "cat", "wolf", "fox", "dragon", "rabbit", "bear", "eagle"];
    for (const s of expected) {
      expect(SPECIES_REGISTRY).toHaveProperty(s);
    }
  });

  it("T02 — OWL : traits anatomiques corrects (family avian, feathers, wings, beak)", () => {
    const owl = SPECIES_REGISTRY["owl"];
    expect(owl).toBeDefined();
    expect(owl.family).toBe("avian");
    expect(owl.anatomicTraits).toContain("feathers");
    expect(owl.anatomicTraits).toContain("wings");
    expect(owl.anatomicTraits).toContain("beak");
  });
});

// ─── T03–T04 : computeHybridTraits ────────────────────────────────────────────

describe("computeHybridTraits", () => {
  it("T03 — owl + cat : traits des deux espèces fusionnés", () => {
    const traits = computeHybridTraits("owl", "cat");
    expect(traits).toContain("feathers");
    expect(traits).toContain("fur");
    expect(traits).toContain("wings");
  });

  it("T04 — même espèce × 2 : pas de doublons dans les traits", () => {
    const traits = computeHybridTraits("wolf", "wolf");
    const unique = new Set(traits);
    expect(traits.length).toBe(unique.size);
  });
});

// ─── T05 : MORPHOLOGY_PRESETS ─────────────────────────────────────────────────

describe("MORPHOLOGY_PRESETS", () => {
  it("T05 — chibi et realistic disponibles avec proportions correctes", () => {
    expect(MORPHOLOGY_PRESETS).toHaveProperty("chibi");
    expect(MORPHOLOGY_PRESETS).toHaveProperty("realistic");
    expect(MORPHOLOGY_PRESETS["chibi"]!.proportions).toBe("chibi");
    expect(MORPHOLOGY_PRESETS["realistic"]!.proportions).toBe("realistic");
  });
});

// ─── T06–T07 : buildSkeleton ──────────────────────────────────────────────────

describe("buildSkeleton", () => {
  it("T06 — wolf (canine) → skeleton humanoid, bones non vides", () => {
    // buildSkeleton(primarySpecies, traits) — wolf = humanoid par défaut
    const sk = buildSkeleton("wolf", ["fur"]);
    expect(sk.type).toBe("humanoid");
    expect(sk.bones.length).toBeGreaterThan(0);
  });

  it("T07 — owl (avian) avec wings → attachPoints wing_left et wing_right", () => {
    // owl appartient à ["owl","eagle","phoenix","raven"] → type avian
    const sk = buildSkeleton("owl", ["feathers", "wings", "beak"]);
    expect(sk.type).toBe("avian");
    expect(sk.attachPoints).toHaveProperty("wing_l_tip");
    expect(sk.attachPoints).toHaveProperty("wing_r_tip");
  });
});

// ─── T08–T17 : buildCharacterDNA & updateCharacterDNA ─────────────────────────

describe("buildCharacterDNA", () => {
  it("T08 — crée un DNA avec un id unique entre deux appels", () => {
    const dna1 = buildCharacterDNA({ primarySpecies: "owl", secondarySpecies: null, heroClass: "MAGE", graphicStyle: "pixel_art_32" });
    const dna2 = buildCharacterDNA({ primarySpecies: "owl", secondarySpecies: null, heroClass: "MAGE", graphicStyle: "pixel_art_32" });
    expect(dna1.id).toBeTruthy();
    expect(dna1.id).not.toBe(dna2.id);
  });

  it("T09 — primarySpecies conservé exactement", () => {
    const dna = buildCharacterDNA({ primarySpecies: "dragon", secondarySpecies: null, heroClass: "MAGE", graphicStyle: "pixel_art_32" });
    expect(dna.primarySpecies).toBe("dragon");
  });

  it("T10 — secondarySpecies null quand non fourni", () => {
    const dna = buildCharacterDNA({ primarySpecies: "cat", secondarySpecies: null, heroClass: "NINJA", graphicStyle: "pixel_art_16" });
    expect(dna.secondarySpecies).toBeNull();
  });

  it("T11 — effectiveTraits non vides", () => {
    const dna = buildCharacterDNA({ primarySpecies: "wolf", secondarySpecies: null, heroClass: "WARRIOR", graphicStyle: "pixel_art_32" });
    expect(dna.effectiveTraits.length).toBeGreaterThan(0);
  });

  it("T12 — history[0].changeType === creation", () => {
    const dna = buildCharacterDNA({ primarySpecies: "fox", secondarySpecies: null, heroClass: "ARCHER", graphicStyle: "pixel_art_32" });
    expect(dna.history.length).toBeGreaterThan(0);
    expect(dna.history[0]!.changeType).toBe("creation");
  });

  it("T13 — meta.viewsConsistent === false (pas encore de vues générées)", () => {
    const dna = buildCharacterDNA({ primarySpecies: "bear", secondarySpecies: null, heroClass: "TANK", graphicStyle: "pixel_art_32" });
    expect(dna.meta.viewsConsistent).toBe(false);
  });

  it("T25 — graphicStyle conservé exactement", () => {
    const dna = buildCharacterDNA({ primarySpecies: "rabbit", secondarySpecies: null, heroClass: "BARD", graphicStyle: "chibi" });
    expect(dna.graphicStyle).toBe("chibi");
  });
});

describe("updateCharacterDNA", () => {
  it("T14 — version incrémentée après mise à jour", () => {
    const original = buildCharacterDNA({ primarySpecies: "owl", secondarySpecies: null, heroClass: "SAMURAI", graphicStyle: "pixel_art_32" });
    const updated = updateCharacterDNA(original, { heroClass: "NINJA" });
    expect(updated.version).toBe(original.version + 1);
  });

  it("T15 — id DIFFÉRENT du DNA source (snapshot immuable)", () => {
    const original = buildCharacterDNA({ primarySpecies: "cat", secondarySpecies: null, heroClass: "MAGE", graphicStyle: "pixel_art_32" });
    const updated = updateCharacterDNA(original, { heroClass: "WARRIOR" });
    expect(updated.id).not.toBe(original.id);
  });

  it("T16 — history accumule les changements à chaque update", () => {
    const original = buildCharacterDNA({ primarySpecies: "wolf", secondarySpecies: null, heroClass: "KNIGHT", graphicStyle: "pixel_art_32" });
    const v2 = updateCharacterDNA(original, { heroClass: "PALADIN" });
    const v3 = updateCharacterDNA(v2, { heroClass: "SAMURAI" });
    expect(v3.history.length).toBeGreaterThan(original.history.length);
  });

  it("T17 — palette modifiée sans toucher la morphologie", () => {
    const original = buildCharacterDNA({ primarySpecies: "fox", secondarySpecies: null, heroClass: "ARCHER", graphicStyle: "pixel_art_32" });
    const newPalette = { primary: "#ff0000", secondary: "#00ff00", accent: "#0000ff", marking: "#ffffff", outlineColor: "#000000" };
    const updated = updateCharacterDNA(original, { palette: newPalette });
    expect(updated.palette.primary).toBe("#ff0000");
    expect(updated.morphology.size).toBe(original.morphology.size);
  });
});

// ─── T18–T24 : OWLY presets ───────────────────────────────────────────────────

describe("OWLY_HERO_PRESETS", () => {
  it("T18 — 8 presets définis (SAMURAI, CYBERPUNK, MAGE, ARCHER, KNIGHT, PIRATE, NINJA, TANK)", () => {
    const keys = Object.keys(OWLY_HERO_PRESETS);
    expect(keys.length).toBe(8);
    for (const cls of ["SAMURAI", "CYBERPUNK", "MAGE", "ARCHER", "KNIGHT", "PIRATE", "NINJA", "TANK"]) {
      expect(OWLY_HERO_PRESETS).toHaveProperty(cls);
    }
  });
});

describe("buildOwlyHeroPresets", () => {
  it("T19 — retourne exactement 8 DNA valides", () => {
    const presets = buildOwlyHeroPresets();
    expect(Object.keys(presets).length).toBe(8);
    for (const dna of Object.values(presets)) {
      expect(dna.id).toBeTruthy();
      expect(dna.primarySpecies).toBeTruthy();
    }
  });

  it("T20 — chaque DNA a un id unique", () => {
    const presets = buildOwlyHeroPresets();
    const ids = Object.values(presets).map((d) => d.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("T21 — SAMURAI a heroClass === SAMURAI", () => {
    const presets = buildOwlyHeroPresets();
    expect(presets["SAMURAI"]!.heroClass).toBe("SAMURAI");
  });

  it("T22 — MAGE a primarySpecies owl", () => {
    const presets = buildOwlyHeroPresets();
    expect(presets["MAGE"]!.primarySpecies).toBe("owl");
  });
});

// ─── T23–T24 : Hybrides anatomiques ──────────────────────────────────────────

describe("Hybrides anatomiques", () => {
  it("T23 — owl + dragon : wings ET feathers présents dans effectiveTraits", () => {
    const dna = buildCharacterDNA({ primarySpecies: "owl", secondarySpecies: "dragon", heroClass: "MAGE", graphicStyle: "pixel_art_32" });
    expect(dna.effectiveTraits).toContain("wings");
    expect(dna.effectiveTraits).toContain("feathers");
  });

  it("T24 — cat + wolf : fur présent dans effectiveTraits", () => {
    const dna = buildCharacterDNA({ primarySpecies: "cat", secondarySpecies: "wolf", heroClass: "WARRIOR", graphicStyle: "pixel_art_32" });
    expect(dna.effectiveTraits).toContain("fur");
  });
});
