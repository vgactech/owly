/**
 * SPRITES 2D — CharacterStudio
 * Parcours de création de personnage OWLY en 9 étapes
 *
 * Projet : OWLY / SPRITES 2D Universal Asset Creation Engine
 * Module : src/components/owly/CharacterStudio.tsx
 *
 * RÈGLE : Ce composant IMPORTE sprites2d-*, jamais l'inverse.
 *
 * Parcours :
 *   Étape 1 — Espèce primaire
 *   Étape 2 — Espèce secondaire (hybride, optionnel)
 *   Étape 3 — Palette de couleurs
 *   Étape 4 — Morphologie
 *   Étape 5 — Classe de héros
 *   Étape 6 — Style graphique
 *   Étape 7 — Prévisualisation DNA
 *   Étape 8 — Validation qualité
 *   Étape 9 — Confirmation & export
 *
 * DEBUG MODE ACTIVE | CERTIFIED_100=false | unique_human_proven=false
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  SPECIES_REGISTRY,
  buildCharacterDNA,
  MORPHOLOGY_PRESETS,
  OWLY_HERO_PRESETS,
} from "@sprites2d/character";
import {
  QualityEngine,
  checkP1Acceptance,
} from "@sprites2d/quality";
import type {
  SpeciesId,
  CharacterDNA,
  HeroClassDNA,
  GraphicStyle,
  CharacterPalette,
  Morphology,
} from "@sprites2d/schema";
import type { HeroClass, HeroAnimal } from "@/types/owly";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CharacterStudioResult {
  /** CharacterDNA complet généré */
  dna: CharacterDNA;
  /** Classe héros pour compatibilité avec le type Hero OWLY */
  heroClass: HeroClass;
  /** Animal principal pour compatibilité */
  animal: HeroAnimal;
  /** Nom du personnage */
  name: string;
}

export interface CharacterStudioProps {
  /** Appelé quand l'utilisateur confirme son personnage */
  onComplete: (result: CharacterStudioResult) => void;
  /** Appelé si l'utilisateur annule */
  onCancel?: () => void;
  /** Preset initial (optionnel — démarre sur un des 8 héros OWLY) */
  initialPreset?: keyof typeof OWLY_HERO_PRESETS;
}

// ─── Types internes ────────────────────────────────────────────────────────────

type StudioStep =
  | "species_primary"
  | "species_secondary"
  | "palette"
  | "morphology"
  | "hero_class"
  | "graphic_style"
  | "preview_dna"
  | "quality_check"
  | "confirm";

const STEPS: StudioStep[] = [
  "species_primary",
  "species_secondary",
  "palette",
  "morphology",
  "hero_class",
  "graphic_style",
  "preview_dna",
  "quality_check",
  "confirm",
];

const STEP_LABELS: Record<StudioStep, string> = {
  species_primary:   "1 — Espèce",
  species_secondary: "2 — Hybride",
  palette:           "3 — Couleurs",
  morphology:        "4 — Morphologie",
  hero_class:        "5 — Classe",
  graphic_style:     "6 — Style",
  preview_dna:       "7 — Aperçu DNA",
  quality_check:     "8 — Validation",
  confirm:           "9 — Confirmer",
};

// ─── Helpers de mapping OWLY ──────────────────────────────────────────────────

function dnaClassToHeroClass(cls: HeroClassDNA): HeroClass {
  const map: Partial<Record<HeroClassDNA, HeroClass>> = {
    SAMURAI: "SAMURAI", CYBERPUNK: "CYBERPUNK", MAGE: "MAGE",
    ARCHER: "ARCHER", KNIGHT: "KNIGHT", PIRATE: "PIRATE",
    NINJA: "NINJA", TANK: "TANK",
  };
  return map[cls] ?? "MAGE";
}

function speciesIdToHeroAnimal(id: SpeciesId): HeroAnimal {
  const sp = SPECIES_REGISTRY[id];
  return {
    id: String(id),
    name: sp?.name ?? String(id),
    emoji: sp?.emoji ?? "❓",
  };
}

// ─── Composant principal ──────────────────────────────────────────────────────

const qualityEngine = new QualityEngine({ debug: true });

export function CharacterStudio({ onComplete, onCancel, initialPreset }: CharacterStudioProps) {
  const [step, setStep] = useState<StudioStep>("species_primary");
  const [name, setName] = useState("Mon héros");

  // Sélections utilisateur
  const _presetData = initialPreset ? OWLY_HERO_PRESETS[initialPreset] : undefined;
  const [primarySpecies, setPrimarySpecies] = useState<SpeciesId>(
    _presetData?.primarySpecies ?? "owl"
  );
  const [secondarySpecies, setSecondarySpecies] = useState<SpeciesId | null>(null);
  const [palette, setPalette] = useState<CharacterPalette>({
    primary: "#8B6914",
    secondary: "#F5DEB3",
    accent: "#FFD700",
    marking: "#3D2B0C",
    outlineColor: "#1a1a1a",
  });
  const [morphologyKey, setMorphologyKey] = useState<string>("hero_standard");
  const [heroClass, setHeroClass] = useState<HeroClassDNA>(
    _presetData?.heroClass ?? "MAGE"
  );
  const [graphicStyle, setGraphicStyle] = useState<GraphicStyle>(
    _presetData?.graphicStyle ?? "pixel_art_32"
  );

  // DNA construit à la demande
  const [builtDNA, setBuiltDNA] = useState<CharacterDNA | null>(null);

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const currentStepIndex = STEPS.indexOf(step);

  const goNext = useCallback(() => {
    const next = STEPS[currentStepIndex + 1];
    if (!next) return;

    // Construire le DNA quand on arrive sur preview_dna
    if (next === "preview_dna") {
      const morphologyValue = MORPHOLOGY_PRESETS[morphologyKey];
      const morphology: Morphology | undefined =
        typeof morphologyValue === "object" ? (morphologyValue as Morphology) : undefined;

      const dna = buildCharacterDNA({
        primarySpecies,
        secondarySpecies,
        heroClass,
        graphicStyle,
        palette,
        ...(morphology !== undefined ? { morphologyPreset: morphology } : {}),
      });

      console.debug("[DEBUG][CharacterStudio] DNA built:", { id: dna.id, version: dna.version });
      setBuiltDNA(dna);
    }

    setStep(next);
  }, [currentStepIndex, primarySpecies, secondarySpecies, heroClass, graphicStyle, palette, morphologyKey]);

  const goPrev = useCallback(() => {
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setStep(prev);
  }, [currentStepIndex]);

  // ─── Confirmation finale ─────────────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    if (!builtDNA) return;

    const result: CharacterStudioResult = {
      dna: builtDNA,
      heroClass: dnaClassToHeroClass(heroClass),
      animal: speciesIdToHeroAnimal(primarySpecies),
      name,
    };

    console.debug("[DEBUG][CharacterStudio] Confirm:", {
      id: result.dna.id,
      heroClass: result.heroClass,
      animal: result.animal.name,
    });

    onComplete(result);
  }, [builtDNA, heroClass, primarySpecies, name, onComplete]);

  // ─── Validation qualité ───────────────────────────────────────────────────────

  const qualityResult = useMemo(() => {
    if (!builtDNA) return null;
    return qualityEngine.validateCharacterDNA(builtDNA);
  }, [builtDNA]);

  const p1Result = useMemo(() => {
    if (!builtDNA) return null;
    return checkP1Acceptance(builtDNA);
  }, [builtDNA]);

  // ─── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div className="character-studio" style={styles.container}>
      {/* En-tête — barre de progression */}
      <div style={styles.header}>
        <h2 style={styles.title}>🎮 Créer ton personnage</h2>
        <div style={styles.progressBar}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              title={STEP_LABELS[s]}
              style={{
                ...styles.progressDot,
                backgroundColor: i === currentStepIndex
                  ? "#FFD700"
                  : i < currentStepIndex
                    ? "#4CAF50"
                    : "#555",
              }}
            />
          ))}
        </div>
        <p style={styles.stepLabel}>{STEP_LABELS[step]}</p>
      </div>

      {/* Corps de l'étape */}
      <div style={styles.body}>
        {step === "species_primary" && (
          <StepSpecies
            label="Choisis ton espèce principale"
            selected={primarySpecies}
            onSelect={setPrimarySpecies}
          />
        )}

        {step === "species_secondary" && (
          <div>
            <p style={styles.hint}>Optionnel — tu peux choisir une deuxième espèce pour un hybride.</p>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary, marginBottom: 12 }}
              onClick={() => setSecondarySpecies(null)}
            >
              Aucun hybride (mono-espèce)
            </button>
            <StepSpecies
              label="Deuxième espèce (hybride)"
              selected={secondarySpecies ?? primarySpecies}
              onSelect={(id) => setSecondarySpecies(id === primarySpecies ? null : id)}
              exclude={primarySpecies}
            />
          </div>
        )}

        {step === "palette" && (
          <StepPalette palette={palette} onChange={setPalette} />
        )}

        {step === "morphology" && (
          <StepMorphology selected={morphologyKey} onSelect={setMorphologyKey} />
        )}

        {step === "hero_class" && (
          <StepHeroClass selected={heroClass} onSelect={setHeroClass} />
        )}

        {step === "graphic_style" && (
          <StepGraphicStyle selected={graphicStyle} onSelect={setGraphicStyle} />
        )}

        {step === "preview_dna" && builtDNA && (
          <StepPreviewDNA dna={builtDNA} name={name} onNameChange={setName} />
        )}

        {step === "quality_check" && qualityResult && p1Result && (
          <StepQualityCheck quality={qualityResult} p1={p1Result} />
        )}

        {step === "confirm" && builtDNA && (
          <StepConfirm dna={builtDNA} name={name} heroClass={heroClass} onConfirm={handleConfirm} />
        )}
      </div>

      {/* Navigation */}
      <div style={styles.nav}>
        {onCancel && currentStepIndex === 0 && (
          <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={onCancel}>
            Annuler
          </button>
        )}
        {currentStepIndex > 0 && (
          <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={goPrev}>
            ← Précédent
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step !== "confirm" && (
          <button style={styles.btn} onClick={goNext}>
            {step === "quality_check" ? "Valider →" : "Suivant →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sous-composants d'étapes ─────────────────────────────────────────────────

function StepSpecies({ label, selected, onSelect, exclude }: {
  label: string;
  selected: SpeciesId;
  onSelect: (id: SpeciesId) => void;
  exclude?: SpeciesId;
}) {
  const species = Object.values(SPECIES_REGISTRY).filter(
    (s) => s.id !== "custom" && s.id !== exclude
  );

  return (
    <div>
      <p style={styles.hint}>{label}</p>
      <div style={styles.grid}>
        {species.map((sp) => (
          <button
            key={sp.id}
            title={`${sp.name} — ${sp.family}`}
            style={{
              ...styles.card,
              borderColor: selected === sp.id ? "#FFD700" : "#333",
              backgroundColor: selected === sp.id ? "#1a1a00" : "#1a1a1a",
            }}
            onClick={() => onSelect(sp.id)}
          >
            <span style={styles.emoji}>{sp.emoji}</span>
            <span style={styles.cardLabel}>{sp.name}</span>
            <span style={styles.cardSub}>{sp.family}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPalette({ palette, onChange }: {
  palette: CharacterPalette;
  onChange: (p: CharacterPalette) => void;
}) {
  const fields: { key: keyof CharacterPalette; label: string }[] = [
    { key: "primary",      label: "Couleur principale" },
    { key: "secondary",    label: "Couleur secondaire" },
    { key: "accent",       label: "Accent (yeux, lumières)" },
    { key: "marking",      label: "Motifs / rayures" },
    { key: "outlineColor", label: "Contour des pixels" },
  ];

  return (
    <div>
      <p style={styles.hint}>Personnalise les couleurs de ton personnage.</p>
      <div style={styles.paletteGrid}>
        {fields.map(({ key, label }) => (
          <label key={String(key)} style={styles.colorField}>
            <span style={styles.colorLabel}>{label}</span>
            <div style={styles.colorRow}>
              <input
                type="color"
                value={palette[key]}
                onChange={(e) => onChange({ ...palette, [key]: e.target.value })}
                style={styles.colorInput}
              />
              <span style={styles.colorHex}>{palette[key]}</span>
            </div>
          </label>
        ))}
      </div>
      {/* Aperçu palette */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {(["primary", "secondary", "accent", "marking", "outlineColor"] as const).map((k) => (
          <div
            key={k}
            title={k}
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              backgroundColor: palette[k],
              border: "1px solid #555",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StepMorphology({ selected, onSelect }: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  const presets = Object.entries(MORPHOLOGY_PRESETS);

  return (
    <div>
      <p style={styles.hint}>Choisis la morphologie de ton personnage.</p>
      <div style={styles.grid}>
        {presets.map(([key, m]) => (
          <button
            key={key}
            style={{
              ...styles.card,
              borderColor: selected === key ? "#FFD700" : "#333",
              backgroundColor: selected === key ? "#1a1a00" : "#1a1a1a",
            }}
            onClick={() => onSelect(key)}
          >
            <span style={styles.cardLabel}>{key}</span>
            <span style={styles.cardSub}>{m.proportions} · {m.size}</span>
            <span style={styles.cardSub}>{m.heightTiles} tiles de haut</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepHeroClass({ selected, onSelect }: {
  selected: HeroClassDNA;
  onSelect: (cls: HeroClassDNA) => void;
}) {
  const classes: { id: HeroClassDNA; emoji: string; label: string; desc: string }[] = [
    { id: "SAMURAI",  emoji: "⚔️",  label: "Samouraï",   desc: "Maîtrise du sabre" },
    { id: "CYBERPUNK",emoji: "⚡",  label: "Cyberpunk",  desc: "Technologie et néon" },
    { id: "MAGE",     emoji: "🔮",  label: "Mage",       desc: "Magie et éléments" },
    { id: "ARCHER",   emoji: "🏹",  label: "Archer",     desc: "Précision à distance" },
    { id: "KNIGHT",   emoji: "🛡️",  label: "Chevalier",  desc: "Armure et honneur" },
    { id: "PIRATE",   emoji: "🏴‍☠️", label: "Pirate",     desc: "Aventure et liberté" },
    { id: "NINJA",    emoji: "🥷",  label: "Ninja",      desc: "Discrétion et vitesse" },
    { id: "TANK",     emoji: "🪨",  label: "Tank",       desc: "Force et résistance" },
    { id: "WARRIOR",  emoji: "🪓",  label: "Guerrier",   desc: "Combat au corps à corps" },
    { id: "ASSASSIN", emoji: "🗡️",  label: "Assassin",   desc: "Furtivité et finesse" },
    { id: "PALADIN",  emoji: "✨",  label: "Paladin",    desc: "Lumière divine" },
    { id: "DRUID",    emoji: "🌿",  label: "Druide",     desc: "Nature et métamorphose" },
    { id: "BARD",     emoji: "🎵",  label: "Barde",      desc: "Musique et charme" },
    { id: "BERSERKER",emoji: "💢",  label: "Berserker",  desc: "Rage et puissance" },
  ];

  return (
    <div>
      <p style={styles.hint}>Choisis la classe de ton personnage.</p>
      <div style={styles.grid}>
        {classes.map(({ id, emoji, label, desc }) => (
          <button
            key={id}
            style={{
              ...styles.card,
              borderColor: selected === id ? "#FFD700" : "#333",
              backgroundColor: selected === id ? "#1a1a00" : "#1a1a1a",
            }}
            onClick={() => onSelect(id)}
          >
            <span style={styles.emoji}>{emoji}</span>
            <span style={styles.cardLabel}>{label}</span>
            <span style={styles.cardSub}>{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepGraphicStyle({ selected, onSelect }: {
  selected: GraphicStyle;
  onSelect: (s: GraphicStyle) => void;
}) {
  const styles_list: { id: GraphicStyle; label: string; desc: string }[] = [
    { id: "pixel_art_16",  label: "Pixel Art 16×16", desc: "Rétro compact" },
    { id: "pixel_art_32",  label: "Pixel Art 32×32", desc: "Standard RPG" },
    { id: "pixel_art_64",  label: "Pixel Art 64×64", desc: "Détaillé" },
    { id: "pixel_art_128", label: "Pixel Art 128×128", desc: "Haute résolution" },
    { id: "chibi",         label: "Chibi",           desc: "Mignon et stylisé" },
    { id: "anime",         label: "Anime",           desc: "Style japonais" },
    { id: "cartoon",       label: "Cartoon",         desc: "Illustration colorée" },
    { id: "isometric",     label: "Isométrique",     desc: "Vue 2.5D" },
  ];

  return (
    <div>
      <p style={stylesGlobal.hint}>Choisis le style graphique de ton personnage.</p>
      <div style={stylesGlobal.grid}>
        {styles_list.map(({ id, label, desc }) => (
          <button
            key={id}
            style={{
              ...stylesGlobal.card,
              borderColor: selected === id ? "#FFD700" : "#333",
              backgroundColor: selected === id ? "#1a1a00" : "#1a1a1a",
            }}
            onClick={() => onSelect(id)}
          >
            <span style={stylesGlobal.cardLabel}>{label}</span>
            <span style={stylesGlobal.cardSub}>{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPreviewDNA({ dna, name, onNameChange }: {
  dna: CharacterDNA;
  name: string;
  onNameChange: (n: string) => void;
}) {
  const sp = SPECIES_REGISTRY[dna.primarySpecies];
  const sp2 = dna.secondarySpecies ? SPECIES_REGISTRY[dna.secondarySpecies] : null;

  return (
    <div>
      <p style={styles.hint}>Ton personnage est prêt. Donne-lui un nom !</p>

      <label style={styles.nameField}>
        <span>Nom du personnage</span>
        <input
          type="text"
          value={name}
          maxLength={32}
          onChange={(e) => onNameChange(e.target.value)}
          style={styles.nameInput}
          placeholder="Mon héros…"
        />
      </label>

      <div style={styles.dnaCard}>
        <h3 style={{ margin: "0 0 12px", color: "#FFD700" }}>
          {sp.emoji} {name}
          {sp2 ? ` + ${sp2.emoji}` : ""}
        </h3>

        <table style={styles.dnaTable}>
          <tbody>
            <tr><td style={styles.tdKey}>Identifiant</td><td style={styles.tdVal}><code>{dna.id}</code></td></tr>
            <tr><td style={styles.tdKey}>Version</td><td style={styles.tdVal}>v{dna.version}</td></tr>
            <tr><td style={styles.tdKey}>Espèce</td><td style={styles.tdVal}>{sp.name}{sp2 ? ` + ${sp2.name}` : ""}</td></tr>
            <tr><td style={styles.tdKey}>Classe</td><td style={styles.tdVal}>{dna.heroClass}</td></tr>
            <tr><td style={styles.tdKey}>Style</td><td style={styles.tdVal}>{dna.graphicStyle}</td></tr>
            <tr><td style={styles.tdKey}>Morphologie</td><td style={styles.tdVal}>{dna.morphology.proportions} · {dna.morphology.size}</td></tr>
            <tr><td style={styles.tdKey}>Traits</td><td style={styles.tdVal}>{dna.effectiveTraits.join(", ") || "—"}</td></tr>
            <tr><td style={styles.tdKey}>Palette</td><td style={styles.tdVal}>
              <div style={{ display: "flex", gap: 4 }}>
                {(["primary", "secondary", "accent"] as const).map((k) => (
                  <div key={k} style={{ width: 16, height: 16, backgroundColor: dna.palette[k], borderRadius: 2 }} />
                ))}
              </div>
            </td></tr>
            <tr><td style={styles.tdKey}>Squelette</td><td style={styles.tdVal}>{dna.skeleton.type} · {dna.skeleton.bones.length} os</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepQualityCheck({ quality, p1 }: {
  quality: ReturnType<QualityEngine["validateCharacterDNA"]>;
  p1: ReturnType<typeof checkP1Acceptance>;
}) {
  return (
    <div>
      <p style={styles.hint}>Validation du personnage avant export.</p>

      <div style={{
        ...styles.dnaCard,
        borderColor: quality.passed ? "#4CAF50" : "#ff4444",
      }}>
        <h3 style={{ color: quality.passed ? "#4CAF50" : "#ff4444", margin: "0 0 8px" }}>
          {quality.passed ? "✅ Personnage valide" : "⚠️ Problèmes détectés"}
        </h3>

        {quality.failures.length > 0 && (
          <div>
            <strong>Problèmes :</strong>
            <ul style={{ margin: "8px 0", paddingLeft: 16 }}>
              {quality.failures.map((f: { severity: string; message: string }, i: number) => (
                <li key={i} style={{ color: f.severity === "blocking" ? "#ff4444" : "#FFD700" }}>
                  [{f.severity}] {f.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {quality.warnings.length > 0 && (
          <div>
            <strong>Avertissements :</strong>
            <ul style={{ margin: "8px 0", paddingLeft: 16 }}>
              {quality.warnings.map((w: string, i: number) => (
                <li key={i} style={{ color: "#aaa" }}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <strong>Critères P1 :</strong>
          <table style={{ width: "100%", marginTop: 8, fontSize: 12 }}>
            <tbody>
              {Object.entries(p1.criteria).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color: "#aaa", paddingRight: 8 }}>{k}</td>
                  <td style={{ color: v ? "#4CAF50" : "#ff8800" }}>{v ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StepConfirm({ dna, name, heroClass, onConfirm }: {
  dna: CharacterDNA;
  name: string;
  heroClass: HeroClassDNA;
  onConfirm: () => void;
}) {
  const sp = SPECIES_REGISTRY[dna.primarySpecies];

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>{sp.emoji}</div>
      <h2 style={{ color: "#FFD700", margin: "0 0 8px" }}>{name}</h2>
      <p style={{ color: "#aaa", margin: "0 0 4px" }}>{sp.name} · {heroClass}</p>
      <p style={{ color: "#666", margin: "0 0 24px", fontSize: 12 }}>DNA {dna.id} · v{dna.version}</p>

      <button
        style={{ ...styles.btn, fontSize: 18, padding: "12px 32px" }}
        onClick={onConfirm}
      >
        🎮 Jouer avec ce personnage
      </button>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: "flex" as const,
    flexDirection: "column" as const,
    height: "100%",
    backgroundColor: "#0d0d0d",
    color: "#e0e0e0",
    fontFamily: "'Courier New', monospace",
    maxWidth: 720,
    margin: "0 auto",
  },
  header: {
    padding: "16px 20px 8px",
    borderBottom: "1px solid #222",
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: "#FFD700",
    letterSpacing: "0.1em",
  },
  progressBar: {
    display: "flex" as const,
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    transition: "background-color 0.2s",
  },
  stepLabel: {
    margin: 0,
    fontSize: 11,
    color: "#888",
    letterSpacing: "0.05em",
  },
  body: {
    flex: 1,
    overflow: "auto" as const,
    padding: "16px 20px",
  },
  nav: {
    display: "flex" as const,
    gap: 8,
    padding: "12px 20px",
    borderTop: "1px solid #222",
    alignItems: "center" as const,
  },
  btn: {
    padding: "8px 20px",
    backgroundColor: "#FFD700",
    color: "#000",
    border: "none",
    cursor: "pointer",
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    fontWeight: "bold" as const,
    letterSpacing: "0.05em",
  },
  btnSecondary: {
    backgroundColor: "#333",
    color: "#e0e0e0",
  },
  hint: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 12,
  },
  grid: {
    display: "grid" as const,
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: 8,
  },
  card: {
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    padding: "10px 6px",
    border: "2px solid #333",
    cursor: "pointer",
    transition: "border-color 0.15s",
    backgroundColor: "#1a1a1a",
    gap: 4,
  },
  emoji: {
    fontSize: 24,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "bold" as const,
    color: "#e0e0e0",
    textAlign: "center" as const,
  },
  cardSub: {
    fontSize: 10,
    color: "#888",
    textAlign: "center" as const,
  },
  paletteGrid: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 10,
  },
  colorField: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 4,
    fontSize: 12,
    color: "#aaa",
  },
  colorRow: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  colorInput: {
    width: 40,
    height: 28,
    border: "none",
    cursor: "pointer",
    backgroundColor: "transparent",
  },
  colorLabel: {
    fontSize: 12,
    color: "#aaa",
  },
  colorHex: {
    fontSize: 12,
    color: "#888",
    fontFamily: "monospace",
  },
  nameField: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 6,
    fontSize: 13,
    marginBottom: 20,
  },
  nameInput: {
    padding: "8px 12px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #444",
    color: "#e0e0e0",
    fontFamily: "'Courier New', monospace",
    fontSize: 15,
    maxWidth: 280,
  },
  dnaCard: {
    padding: "16px",
    border: "1px solid #333",
    backgroundColor: "#111",
    fontSize: 13,
  },
  dnaTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 12,
  },
  tdKey: {
    padding: "4px 12px 4px 0",
    color: "#888",
    width: "40%",
  },
  tdVal: {
    padding: "4px 0",
    color: "#e0e0e0",
  },
};

// Alias pour StepGraphicStyle (évite conflit de nom avec la variable `styles`)
const stylesGlobal = styles;
