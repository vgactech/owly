# SPRITES 2D — Architecture

> Projet : OWLY / SPRITES 2D Universal Asset Creation Engine  
> Module : documentation architecture  
> Version : v0.1.0  
> DEBUG MODE ACTIVE | CERTIFIED_100=false | unique_human_proven=false

---

## Vue d'ensemble

SPRITES 2D est un moteur de création d'assets 2D universel, indépendant d'OWLY.
Il est organisé en packages isolés communiquant via des contrats TypeScript définis dans `@sprites2d/schema`.

```
OWLY (src/)
  └─ importe sprites2d-* (jamais l'inverse)

@sprites2d/schema         ─── contrats de données (types, interfaces)
@sprites2d/character      ─── moteur DNA déterministe
@sprites2d/quality        ─── validation & scores
@sprites2d/ai             ─── providers LLM & génération d'images
@sprites2d/core           ─── moteur principal (orchestration)
```

---

## Packages

### `@sprites2d/schema`
**Rôle :** contrats de données centraux, partagés par tous les packages.  
**Règle absolue :** ne jamais importer d'OWLY ni des autres packages sprites2d.

Types exportés :
- `SpeciesId`, `Species`, `SpeciesFamily` — 16 espèces (owl, cat, wolf, fox, dragon…)
- `CharacterDNA` — structure principale, versionnée, avec historique
- `Morphology`, `CharacterPalette`, `Skeleton` — sous-structures du DNA
- `HeroClassDNA`, `GraphicStyle`, `CharacterView` — enums de configuration
- `QualityCheckResult`, `QualityFailure` — résultats de validation
- `Sprites2DConfig` — configuration du moteur (`openai`, `claude`, `bob`, `mistral`, `local`)

---

### `@sprites2d/character`
**Rôle :** moteur déterministe de création de CharacterDNA.  
**Dépendances :** `@sprites2d/schema` uniquement.

Exports principaux :
| Symbole | Description |
|---------|-------------|
| `SPECIES_REGISTRY` | 16 espèces avec traits anatomiques, famille, emoji |
| `computeHybridTraits()` | Calcule les traits effectifs pour un hybride |
| `MORPHOLOGY_PRESETS` | 8 presets : hero_standard, chibi, realistic, athletic… |
| `buildSkeleton()` | Construit le squelette selon l'espèce et les traits |
| `buildCharacterDNA()` | Crée un DNA versionné complet |
| `updateCharacterDNA()` | Met à jour un champ, incrémente la version, logue l'historique |
| `OWLY_HERO_PRESETS` | 8 presets OWLY (SAMURAI, CYBERPUNK, MAGE, ARCHER, KNIGHT, PIRATE, NINJA, TANK) |
| `buildOwlyHeroPresets()` | Construit les 8 DNA OWLY depuis les presets |

**Squelette** (3 types) :
- `humanoid` — 20 os (biped, sans queue ni ailes)
- `avian` — 26 os (ailes + queue)
- `quadruped` — 22 os (4 pattes)

---

### `@sprites2d/quality`
**Rôle :** validation automatique des assets (CharacterDNA).  
**Dépendances :** `@sprites2d/schema`, `@sprites2d/character`.

Exports principaux :
| Symbole | Description |
|---------|-------------|
| `QualityEngine` | Moteur de validation — 6 checks indépendants |
| `checkP1Acceptance()` | Vérifie les 8 critères d'acceptation P1 ROADMAP |

**Checks de `QualityEngine.validateCharacterDNA()` :**
1. Vérifications structurelles fondamentales (id, version, espèce, morphologie…)
2. Espèces (espèce primaire/secondaire valides dans `SPECIES_REGISTRY`)
3. Traits anatomiques (conflits beak+snout, cohérence espèce/traits)
4. Morphologie (plages des facteurs de proportion)
5. Palette (format hex #rrggbb, contraste outline/primary)
6. Squelette (os obligatoires, connectivité, points d'attache)
7. Équipements (traits incompatibles, traits requis, restrictions espèces)

**Scores indépendants (ne pas fusionner) :**
- `visualFidelity` — null si aucune vue générée
- `anatomicalConsistency` — basé sur les erreurs espèce/traits/squelette
- `animationQuality` — null (non animé)
- `pixelIntegrity` — null si aucune vue générée
- `equipmentCompatibility` — basé sur les erreurs équipement
- `runtimeReadiness` — 0 / 40 / 80 selon état
- `licenseCompliance` — toujours 100 (assets propriétaires)

**Critères P1 (`checkP1Acceptance()`) :**
presetsAccessible, hybridizationWorks, morphologyFamiliesWork, colorsModifiable,
identityStable, viewsCoherent, projectSaveable, exportIndependent

---

### `@sprites2d/ai`
**Rôle :** providers LLM + génération d'images, routing.  
**Dépendances :** `@sprites2d/schema`.

**Providers disponibles :**

| Provider | Classe | Rôle | Clé Doppler |
|----------|--------|------|-------------|
| DALL-E 3 | `DalleProvider` | Génération images principales | `OPENAI_API_KEY` |
| Claude | `ClaudeProvider` | Validation cohérence DNA | `API_CLAUDE_CODE` |
| IBM Bob | `BobProvider` | Orchestration + optimisation prompt | `BOB_API_KEY` |
| Mistral AI | `MistralProvider` | Alternative open-source : analyse DNA + optimisation prompt | `MISTRAL_API_KEY` |
| Local | `LocalProvider` | Fallback procédural SVG déterministe (0 API) | — |

**Interface `SpriteProvider` :**
```typescript
interface SpriteProvider {
  name: string;
  available: boolean;
  generate(request: SpriteGenerationRequest): Promise<GeneratedView>;
}
```

**Routing (`GenerationRouter`) :**
- DALL-E → Local (fallback automatique)
- `getMistralProvider()` — accès direct pour analyse DNA / optimisation prompt
- `getClaudeProvider()` — accès direct pour analyse DNA

**`buildDallePrompt(dna, view)`** — construit un prompt pixel art optimisé depuis le DNA.

---

### `@sprites2d/core`
**Rôle :** moteur principal d'orchestration.  
**Dépendances :** tous les packages sprites2d.

Exports principaux :
| Symbole | Description |
|---------|-------------|
| `Sprites2DEngine` | Moteur principal — cycle de vie du personnage |
| `createEngine()` | Factory avec configuration optionnelle |

**`Sprites2DEngine` API :**
- `createCharacter(params)` — crée un CharacterDNA versionné
- `updateCharacter(id, changes)` — met à jour un champ, incrémente la version
- `validateCharacter(id)` — exécute `QualityEngine` sur le DNA
- `generateView(id, view)` — génère une vue via `GenerationRouter`
- `checkP1(id)` — vérifie les critères d'acceptation P1
- `exportCharacter(id)` — retourne le DNA + résultats de validation
- `getCharacter(id)` — retourne le DNA en mémoire

---

## Flux de données

```
Utilisateur (CharacterStudio)
    │
    ▼
buildCharacterDNA()          @sprites2d/character
    │  → CharacterDNA (versionné, avec historique)
    ▼
QualityEngine.validateCharacterDNA()   @sprites2d/quality
    │  → QualityCheckResult (7 scores indépendants)
    ▼
GenerationRouter.generate()  @sprites2d/ai
    │  → DalleProvider (ou Local si OPENAI_API_KEY absent)
    ▼
GeneratedView (imageUrl + checksum + provider)
```

---

## Règles architecturales

1. **Dépendances en sens unique** : OWLY → sprites2d-* (jamais l'inverse)
2. **Clés API via Doppler LVX** uniquement — jamais hardcodées (`OPENAI_API_KEY`, `API_CLAUDE_CODE`, `BOB_API_KEY`, `MISTRAL_API_KEY`)
3. **DEBUG MODE actif** dans tous les packages (`console.debug`)
4. **`CERTIFIED_100=false`** — invariant présent dans tous les headers de fichiers
5. **`LocalProvider` toujours disponible** — fallback procédural sans aucune dépendance réseau
6. **Scores qualité indépendants** — ne jamais fusionner en un score global unique
7. **DNA versionné et immuable** — chaque modification crée un nouveau snapshot (nouvel id)
