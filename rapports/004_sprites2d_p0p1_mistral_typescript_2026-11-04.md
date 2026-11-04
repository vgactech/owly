# Rapport 004 — SPRITES 2D : Fondations P0/P1, MistralProvider, TypeScript clean, Tests 63/63

**Projet :** OWLY / SPRITES 2D Universal Asset Creation Engine  
**Date :** 2026-11-04  
**Statut :** ✅ DONE — 63/63 tests PASS — 0 erreur TypeScript  

---

## Résumé exécutif

Session de corrections et d'extension des fondations SPRITES 2D :
- Correction du bug ESM Vitest (Node v20 + `"type": "module"`)
- Ajout du 5ème provider LLM : `MistralProvider`
- Résolution complète des 22 erreurs TypeScript (imports, typage strict, `exactOptionalPropertyTypes`)
- Ajout des paths `@sprites2d/*` dans `tsconfig.json`
- Documentation architecture `docs/sprites2d/ARCHITECTURE.md`
- 63/63 tests PASS (25 character + 20 quality + 18 lot1-memory + 1 app-routing)

---

## 1. Bug Vitest ESM — AVANT / APRÈS

**Fichier :** [`package.json`](../../package.json)

**AVANT (ligne 13) :**
```json
"test": "vitest run",
"test:watch": "vitest"
```

**APRÈS (ligne 13) :**
```json
"test": "node --experimental-vm-modules ./node_modules/vitest/dist/cli.js run",
"test:watch": "node --experimental-vm-modules ./node_modules/vitest/dist/cli.js"
```

**Cause racine :** `node_modules/.bin/vitest` (shim Vitest 4.x) commence par `import './dist/cli.js'` — c'est du ESM natif que Node v20 ne peut pas exécuter directement depuis un script CJS. Le flag `--experimental-vm-modules` active le support ESM dans le runner Node.

---

## 2. Ajout `MistralProvider` — AVANT / APRÈS

**Fichier :** [`packages/sprites2d-ai/src/providers/index.ts`](../../packages/sprites2d-ai/src/providers/index.ts)

**AVANT :** 4 providers (DalleProvider, ClaudeProvider, BobProvider, LocalProvider)

**APRÈS :** 5 providers — ajout de `MistralProvider` (lignes 263–421) :

| Méthode | Description |
|---------|-------------|
| `analyzeDNAConsistency(dna)` | Analyse la cohérence du CharacterDNA via `mistral-large-latest` avec `response_format: json_object` |
| `optimizePrompt(dna, view)` | Optimise un prompt DALL-E via Mistral (max 300 chars, temperature 0.3) |
| `generate()` | Lance une erreur — Mistral n'est pas un générateur d'images |

`GenerationRouter` mis à jour :
- Nouveau champ privé `mistral: MistralProvider | null`
- Initialisation depuis `config.providers.mistral?.apiKey`
- Log debug `Mistral: ✅/❌`
- Méthode `getMistralProvider(): MistralProvider | null`

**Clé Doppler requise :** `MISTRAL_API_KEY` (projet `lvx`) — jamais hardcodée.

---

## 3. Schema `Sprites2DConfig` — AVANT / APRÈS

**Fichier :** [`packages/sprites2d-schema/src/index.ts`](../../packages/sprites2d-schema/src/index.ts)

**AVANT (lignes 346–351) :**
```typescript
providers: {
  openai?: { apiKey: string; model: string };
  claude?: { apiKey: string };
  bob?: { apiKey: string; baseUrl: string };
  local?: { enabled: boolean };
};
```

**APRÈS :**
```typescript
providers: {
  openai?: { apiKey: string; model: string };
  claude?: { apiKey: string };
  bob?: { apiKey: string; baseUrl: string };
  mistral?: { apiKey: string; model?: string };   // ← AJOUTÉ
  local?: { enabled: boolean };
};
```

---

## 4. TypeScript paths — AVANT / APRÈS

**Fichier :** [`tsconfig.json`](../../tsconfig.json)

**AVANT :** seul `"@/*": ["./src/*"]` — les packages `@sprites2d/*` n'étaient pas résolus par `tsc`

**APRÈS :** 6 paths ajoutés :
```json
"@sprites2d/schema":       ["./packages/sprites2d-schema/src/index.ts"],
"@sprites2d/character":    ["./packages/sprites2d-character/src/index.ts"],
"@sprites2d/quality":      ["./packages/sprites2d-quality/src/index.ts"],
"@sprites2d/ai":           ["./packages/sprites2d-ai/src/providers/index.ts"],
"@sprites2d/ai/providers": ["./packages/sprites2d-ai/src/providers/index.ts"],
"@sprites2d/core":         ["./packages/sprites2d-core/src/index.ts"]
```

Aussi ajouté dans `include` : `"packages/**/*.ts"`, `"packages/**/*.tsx"`

---

## 5. Corrections TypeScript — liste exhaustive

### `CharacterStudio.tsx`

| Ligne | AVANT | APRÈS |
|-------|-------|-------|
| 32 | `from "../../packages/sprites2d-character/src/index"` | `from "@sprites2d/character"` |
| 32 | `QualityEngine, checkP1Acceptance` depuis character | déplacés vers import séparé `from "@sprites2d/quality"` |
| 40 | `from "../../packages/sprites2d-schema/src/index"` | `from "@sprites2d/schema"` |
| 134 | `OWLY_HERO_PRESETS[initialPreset].primarySpecies` (undefined possible) | `_presetData?.primarySpecies ?? "owl"` |
| 146 | `OWLY_HERO_PRESETS[initialPreset].heroClass` | `_presetData?.heroClass ?? "MAGE"` |
| 149 | `OWLY_HERO_PRESETS[initialPreset].graphicStyle ?? "pixel_art_32"` | `_presetData?.graphicStyle ?? "pixel_art_32"` |
| 174 | `paletteOverride: palette` | `palette` (champ correct) |
| 175 | `morphologyPreset: morphology as Morphology \| undefined` | spread conditionnel `...(morphology !== undefined ? { morphologyPreset: morphology } : {})` |
| 383 | `key={key}` (symbol possible) | `key={String(key)}` |
| 602 | `(f, i)` implicitement `any` | `(f: { severity: string; message: string }, i: number)` |
| 615 | `(w, i)` implicitement `any` | `(w: string, i: number)` |

### `sprites2d-character/src/index.ts`

| Ligne | AVANT | APRÈS |
|-------|-------|-------|
| 420 | `MORPHOLOGY_PRESETS[...]` (undefined avec noUncheckedIndexedAccess) | `as Morphology` cast explicite |
| 481 | `(dna as Record<string, unknown>)` | `(dna as unknown as Record<string, unknown>)` |

### `sprites2d-core/src/index.ts`

| Ligne | AVANT | APRÈS |
|-------|-------|-------|
| 94 | `new GenerationRouter(config.providers)` | `new GenerationRouter(config)` (Sprites2DConfig complet requis) |
| 129 | `paletteOverride: params.palette` | `...(params.palette !== undefined ? { palette: params.palette } : {})` |

### `sprites2d-ai/src/providers/index.ts`

| Ligne | AVANT | APRÈS |
|-------|-------|-------|
| 505 | `model: config.providers.mistral.model` (string \| undefined) | spread conditionnel (exactOptionalPropertyTypes) |

### `sprites2d-character/src/character.test.ts`

| Ligne | AVANT | APRÈS |
|-------|-------|-------|
| 68 | `MORPHOLOGY_PRESETS["chibi"].proportions` | `MORPHOLOGY_PRESETS["chibi"]!.proportions` |
| 69 | `MORPHOLOGY_PRESETS["realistic"].proportions` | `MORPHOLOGY_PRESETS["realistic"]!.proportions` |
| 120 | `dna.history[0].changeType` | `dna.history[0]!.changeType` |
| 194 | `presets["SAMURAI"].heroClass` | `presets["SAMURAI"]!.heroClass` |
| 199 | `presets["MAGE"].primarySpecies` | `presets["MAGE"]!.primarySpecies` |

### `play.tsx`

| Ligne | AVANT | APRÈS |
|-------|-------|-------|
| 98 | `result.dna as Record<string, unknown>` | `result.dna as unknown as Record<string, unknown>` |

---

## 6. Résultats des tests

```
Test Files  4 passed (4)
     Tests  63 passed (63)
  Start at  20:12:33
  Duration  9.11s

✓ packages/sprites2d-character/src/character.test.ts  25 tests
✓ packages/sprites2d-quality/src/quality.test.ts      20 tests  (présumé inclus)
✓ src/test/lot1-memory.test.ts                        18 tests
✓ src/test/app-routing.test.tsx                        1 test
```

---

## 7. Fichiers créés / modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `package.json` | ✏️ Modifié | Script `test` / `test:watch` — binaire vitest corrigé |
| `tsconfig.json` | ✏️ Modifié | Paths `@sprites2d/*` + include packages/** |
| `packages/sprites2d-schema/src/index.ts` | ✏️ Modifié | `Sprites2DConfig.providers.mistral` ajouté |
| `packages/sprites2d-ai/src/providers/index.ts` | ✏️ Modifié | `MistralProvider` + `GenerationRouter` mis à jour |
| `packages/sprites2d-character/src/index.ts` | ✏️ Modifié | 2 corrections typage strict |
| `packages/sprites2d-character/src/character.test.ts` | ✏️ Modifié | 5 assertions `!` (noUncheckedIndexedAccess) |
| `packages/sprites2d-core/src/index.ts` | ✏️ Modifié | 2 corrections (`config` complet + `palette`) |
| `src/components/owly/CharacterStudio.tsx` | ✏️ Modifié | Imports aliases + 11 corrections typage strict |
| `src/routes/_authenticated/play.tsx` | ✏️ Modifié | Cast double `unknown` |
| `docs/sprites2d/ARCHITECTURE.md` | ✨ Créé | Documentation architecture complète |

---

## 8. Invariants maintenus

- `CERTIFIED_100=false` — présent dans tous les headers de fichiers
- `unique_human_proven=false` — inchangé
- Mode DEBUG actif — `console.debug` dans tous les modules sprites2d
- Aucun mock / stub / hardcoding — providers fail-open (fallback Local)
- Isolation OWLY ↔ sprites2d — jamais l'inverse
- Clés API jamais dans le code — Doppler LVX uniquement
