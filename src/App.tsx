"use client";

import { useEffect, useMemo, useState } from "react";

type FieldName = "balls" | "ballWeight" | "hydration" | "proofingHours" | "saltPercent" | "manualYeast";
type DraftRecipe = Record<FieldName, string>;

const DEFAULT_RECIPE: DraftRecipe = {
  balls: "1",
  ballWeight: "260",
  hydration: "65",
  proofingHours: "3",
  saltPercent: "2.8",
  manualYeast: "0.86",
};

// Krzywa drożdży zachowana z oryginalnego projektu DiMateo.
const YEAST_CURVE = 0.0215;
const STORAGE_KEY = "dimateo-recipe-v1";
const parseValue = (value: string) => Number(value.replace(",", "."));
const format = (value: number, digits = 0) => new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(value);

function validate(recipe: DraftRecipe, autoYeast: boolean) {
  const errors: Partial<Record<FieldName, string>> = {};
  const balls = parseValue(recipe.balls);
  const ballWeight = parseValue(recipe.ballWeight);
  const hydration = parseValue(recipe.hydration);
  const proofingHours = parseValue(recipe.proofingHours);
  const saltPercent = parseValue(recipe.saltPercent);
  const manualYeast = parseValue(recipe.manualYeast);

  if (!Number.isFinite(balls) || !Number.isInteger(balls)) errors.balls = "Podaj pełną liczbę pizz.";
  else if (balls < 1 || balls > 30) errors.balls = "Wybierz od 1 do 30 pizz.";

  if (!Number.isFinite(ballWeight)) errors.ballWeight = "Podaj wagę jednej kulki.";
  else if (ballWeight < 100 || ballWeight > 500) errors.ballWeight = "Waga powinna wynosić od 100 do 500 g.";

  if (!Number.isFinite(hydration)) errors.hydration = "Podaj poziom hydracji.";
  else if (hydration < 45 || hydration > 90) errors.hydration = "Hydracja powinna wynosić od 45 do 90%.";

  if (!Number.isFinite(proofingHours)) errors.proofingHours = "Podaj czas wyrastania.";
  else if (proofingHours < 1 || proofingHours > 72) errors.proofingHours = "Czas powinien wynosić od 1 do 72 godzin.";

  if (!Number.isFinite(saltPercent)) errors.saltPercent = "Podaj ilość soli.";
  else if (saltPercent < 0 || saltPercent > 5) errors.saltPercent = "Sól powinna wynosić od 0 do 5%.";

  if (!autoYeast) {
    if (!Number.isFinite(manualYeast)) errors.manualYeast = "Podaj ilość drożdży.";
    else if (manualYeast < 0 || manualYeast > 30) errors.manualYeast = "Podaj od 0 do 30 g drożdży.";
    else if (Number.isFinite(balls) && Number.isFinite(ballWeight) && manualYeast >= balls * ballWeight) {
      errors.manualYeast = "Drożdże muszą ważyć mniej niż całe ciasto.";
    }
  }
  return errors;
}

function calculateRecipe(recipe: DraftRecipe, autoYeast: boolean) {
  const balls = parseValue(recipe.balls);
  const ballWeight = parseValue(recipe.ballWeight);
  const hydration = parseValue(recipe.hydration) / 100;
  const proofingHours = parseValue(recipe.proofingHours);
  const saltRatio = parseValue(recipe.saltPercent) / 100;
  const manualYeast = parseValue(recipe.manualYeast);
  const targetWeight = balls * ballWeight;

  if (autoYeast) {
    const yeastRatio = YEAST_CURVE / Math.pow(proofingHours, 1.25);
    const flour = targetWeight / (1 + hydration + saltRatio + yeastRatio);
    return {
      flour,
      water: flour * hydration,
      salt: flour * saltRatio,
      yeast: flour * yeastRatio,
      total: targetWeight,
      perBall: ballWeight,
      yeastPercent: yeastRatio * 100,
    };
  }

  const flour = (targetWeight - manualYeast) / (1 + hydration + saltRatio);
  return {
    flour,
    water: flour * hydration,
    salt: flour * saltRatio,
    yeast: manualYeast,
    total: targetWeight,
    perBall: ballWeight,
    yeastPercent: flour > 0 ? (manualYeast / flour) * 100 : 0,
  };
}

function NumberField({ id, label, value, unit, hint, error, min, max, step = "1", onChange }: {
  id: FieldName;
  label: string;
  value: string;
  unit: string;
  hint?: string;
  error?: string;
  min: number;
  max: number;
  step?: string;
  onChange: (value: string) => void;
}) {
  const descriptionId = `${id}-${error ? "error" : "hint"}`;
  return (
    <div className={`field ${error ? "field--invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field__control">
        <input id={id} name={id} type="number" inputMode="decimal" value={value} min={min} max={max} step={step}
          aria-invalid={Boolean(error)} aria-describedby={descriptionId} onChange={(event) => onChange(event.target.value)} />
        <span>{unit}</span>
      </div>
      <p id={descriptionId} className={error ? "field__error" : "field__hint"}>{error ?? hint}</p>
    </div>
  );
}

function IngredientRow({ symbol, name, detail, value }: { symbol: string; name: string; detail: string; value: string }) {
  return (
    <li className="ingredient">
      <span className="ingredient__symbol" aria-hidden="true">{symbol}</span>
      <span className="ingredient__name"><strong>{name}</strong><small>{detail}</small></span>
      <strong className="ingredient__value">{value}</strong>
    </li>
  );
}

function PizzaLogo({ className = "" }: { className?: string }) {
  const pepperoni = [
    [22, 18], [22, 30], [22, 42], [22, 54], [22, 66],
    [34, 18], [47, 22], [55, 32], [57, 45], [52, 57], [42, 65], [33, 66],
  ];

  return (
    <svg className={className} viewBox="0 0 80 80" role="img" aria-label="Pizza z pepperoni w kształcie litery D">
      <defs>
        <linearGradient id="cheese" x1="12" y1="8" x2="68" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD66B" />
          <stop offset="1" stopColor="#F6A938" />
        </linearGradient>
        <filter id="pizza-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1F2937" floodOpacity=".22" />
        </filter>
      </defs>
      <circle cx="40" cy="40" r="35" fill="#D77C24" filter="url(#pizza-shadow)" />
      <circle cx="40" cy="40" r="30.5" fill="url(#cheese)" stroke="#FFE9A8" strokeWidth="1.5" />
      <path d="M18 45c8-5 12 1 19-3 8-5 12 3 24-2" fill="none" stroke="#FFF1BB" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      {pepperoni.map(([cx, cy], index) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="4.8" fill="#E8483A" stroke="#B92D2C" strokeWidth="1" />
          <circle cx={cx - 1.4} cy={cy - 1.2} r=".8" fill="#FF8C65" opacity=".85" />
          {index % 2 === 0 && <circle cx={cx + 1.5} cy={cy + 1.2} r=".55" fill="#9D2425" opacity=".75" />}
        </g>
      ))}
    </svg>
  );
}

function pizzaWord(count: number) {
  if (count === 1) return "pizza";
  const lastTwo = count % 100;
  const last = count % 10;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "pizze";
  return "pizz";
}

export default function Home() {
  const [recipe, setRecipe] = useState<DraftRecipe>(DEFAULT_RECIPE);
  const [autoYeast, setAutoYeast] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    let savedRecipe: DraftRecipe | null = null;
    let savedAutoYeast: boolean | null = null;
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as {
        recipe?: Partial<DraftRecipe>;
        autoYeast?: boolean;
      } | null;
      const fields = Object.keys(DEFAULT_RECIPE) as FieldName[];
      if (saved?.recipe && fields.every((field) => typeof saved.recipe?.[field] === "string")) {
        savedRecipe = saved.recipe as DraftRecipe;
      }
      if (typeof saved?.autoYeast === "boolean") savedAutoYeast = saved.autoYeast;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    const timer = window.setTimeout(() => {
      if (savedRecipe) setRecipe(savedRecipe);
      if (savedAutoYeast !== null) setAutoYeast(savedAutoYeast);
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ recipe, autoYeast }));
  }, [recipe, autoYeast, storageReady]);
  const errors = useMemo(() => validate(recipe, autoYeast), [recipe, autoYeast]);
  const isValid = Object.keys(errors).length === 0;
  const result = useMemo(() => isValid ? calculateRecipe(recipe, autoYeast) : null, [recipe, autoYeast, isValid]);

  const updateField = (field: FieldName, value: string) => setRecipe((current) => ({ ...current, [field]: value }));
  const changeBalls = (direction: number) => {
    const current = parseValue(recipe.balls);
    const next = Math.min(30, Math.max(1, (Number.isFinite(current) ? current : 1) + direction));
    updateField("balls", String(next));
  };
  const hydration = parseValue(recipe.hydration);
  const proofingHours = parseValue(recipe.proofingHours);
  const balls = parseValue(recipe.balls);

  const restoreDefaults = () => {
    setRecipe(DEFAULT_RECIPE);
    setAutoYeast(true);
    setCopyStatus("idle");
  };

  const copyRecipe = async () => {
    if (!result) return;
    const text = [
      `DiMateo — ${recipe.balls} ${pizzaWord(balls)} po ${format(result.perBall)} g`,
      `Mąka: ${format(result.flour)} g`,
      `Woda: ${format(result.water)} g (${format(parseValue(recipe.hydration), 1)}%)`,
      `Sól: ${format(result.salt, 1)} g (${format(parseValue(recipe.saltPercent), 1)}%)`,
      `Drożdże: ${format(result.yeast, 2)} g`,
      `Wyrastanie: ${format(proofingHours, 1)} h`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2400);
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#calculator" aria-label="DiMateo — przejdź do kalkulatora">
          <PizzaLogo className="brand__mark" />
          <span><strong>DiMateo</strong><small>kalkulator ciasta na pizzę</small></span>
        </a>
        <span className="privacy-badge"><i /> Ustawienia zapisane lokalnie</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Pizza zaczyna się od dobrych proporcji</p>
        <h1 id="page-title">Twoje ciasto.<br />Policzone co do grama.</h1>
        <p className="intro__copy">Ustaw liczbę pizz, wagę kulek i czas. DiMateo od razu przeliczy cały przepis.</p>
      </section>

      <section id="calculator" className="calculator" aria-label="Kalkulator ciasta na pizzę">
        <div className="calculator__form">
          <div className="section-heading"><span>01</span><div><p>Ile pizzy przygotowujesz?</p><h2>Porcje</h2></div></div>
          <div className="portion-grid">
            <div className={`field ${errors.balls ? "field--invalid" : ""}`}>
              <label htmlFor="balls">Liczba pizz</label>
              <div className="stepper">
                <button type="button" onClick={() => changeBalls(-1)} aria-label="Zmniejsz liczbę pizz">−</button>
                <input id="balls" name="balls" type="number" inputMode="numeric" min="1" max="30" step="1"
                  value={recipe.balls} aria-invalid={Boolean(errors.balls)} aria-describedby="balls-message"
                  onChange={(event) => updateField("balls", event.target.value)} />
                <button type="button" onClick={() => changeBalls(1)} aria-label="Zwiększ liczbę pizz">+</button>
              </div>
              <p id="balls-message" className={errors.balls ? "field__error" : "field__hint"}>{errors.balls ?? "Od 1 do 30 sztuk"}</p>
            </div>
            <NumberField id="ballWeight" label="Waga jednej kulki" value={recipe.ballWeight} unit="g" hint="Najczęściej 230–280 g"
              error={errors.ballWeight} min={100} max={500} onChange={(value) => updateField("ballWeight", value)} />
          </div>

          <div className="divider" />
          <div className="section-heading"><span>02</span><div><p>Dopasuj charakter ciasta</p><h2>Parametry</h2></div></div>

          <div className="parameter-block">
            <div className="range-heading">
              <div><label htmlFor="hydration-range">Hydracja</label><small>Więcej wody oznacza lżejsze, ale trudniejsze ciasto.</small></div>
              <div className={`compact-input ${errors.hydration ? "compact-input--invalid" : ""}`}>
                <input id="hydration" aria-label="Hydracja w procentach" type="number" inputMode="decimal" min="45" max="90" step="0.1"
                  value={recipe.hydration} aria-invalid={Boolean(errors.hydration)} onChange={(event) => updateField("hydration", event.target.value)} />
                <span>%</span>
              </div>
            </div>
            <input id="hydration-range" className="range" type="range" min="45" max="90" step="0.5"
              value={Number.isFinite(hydration) ? hydration : 65} aria-describedby="hydration-message"
              onChange={(event) => updateField("hydration", event.target.value)} />
            <div className="range-scale"><span>45% zwarte</span><span>90% lekkie</span></div>
            <p id="hydration-message" className={errors.hydration ? "field__error" : "sr-only"}>{errors.hydration}</p>
          </div>

          <div className="parameter-block">
            <div className="range-heading">
              <div><label htmlFor="proofingHours">Czas wyrastania</label><small>Automatycznie dopasujemy ilość drożdży.</small></div>
              <div className={`compact-input ${errors.proofingHours ? "compact-input--invalid" : ""}`}>
                <input id="proofingHours" type="number" inputMode="decimal" min="1" max="72" step="0.5"
                  value={recipe.proofingHours} aria-invalid={Boolean(errors.proofingHours)} onChange={(event) => updateField("proofingHours", event.target.value)} />
                <span>h</span>
              </div>
            </div>
            <div className="presets" aria-label="Szybki wybór czasu wyrastania">
              {[3, 8, 24, 48].map((hours) => (
                <button type="button" key={hours} className={proofingHours === hours ? "is-active" : ""}
                  aria-pressed={proofingHours === hours} onClick={() => updateField("proofingHours", String(hours))}>{hours} h</button>
              ))}
            </div>
            <p className={errors.proofingHours ? "field__error" : "sr-only"}>{errors.proofingHours}</p>
          </div>

          <div className="two-fields">
            <NumberField id="saltPercent" label="Sól" value={recipe.saltPercent} unit="%" hint="Procent względem mąki"
              error={errors.saltPercent} min={0} max={5} step="0.1" onChange={(value) => updateField("saltPercent", value)} />
            <div className="yeast-setting">
              <div className="toggle-row">
                <div><strong>Drożdże automatycznie</strong><small>Według czasu wyrastania</small></div>
                <button type="button" role="switch" aria-checked={autoYeast} className={`switch ${autoYeast ? "is-on" : ""}`}
                  onClick={() => setAutoYeast((current) => !current)}><span /></button>
              </div>
              {!autoYeast && <NumberField id="manualYeast" label="Własna ilość drożdży" value={recipe.manualYeast} unit="g"
                error={errors.manualYeast} min={0} max={30} step="0.01" onChange={(value) => updateField("manualYeast", value)} />}
            </div>
          </div>
        </div>

        <aside className="result-card" aria-live="polite">
          <div className="result-card__top">
            <p>Twój przepis</p>
            <button
              type="button"
              onClick={restoreDefaults}
              title="Przywróć: hydracja 65%, sól 2,8%, 1 pizza po 260 g i 3 godziny wyrastania"
            >
              Przywróć domyślne
            </button>
          </div>
          {!result ? (
            <div className="result-empty" role="alert"><span>!</span><h2>Sprawdź wprowadzone dane</h2><p>Popraw oznaczone pola, aby zobaczyć dokładny przepis.</p></div>
          ) : (
            <>
              <div className="result-total"><span>Łącznie</span><strong>{format(result.total)} <small>g</small></strong>
                <p>{recipe.balls} {pizzaWord(balls)} × {format(result.perBall)} g</p></div>
              <ul className="ingredients">
                <IngredientRow symbol="M" name="Mąka" detail="100%" value={`${format(result.flour)} g`} />
                <IngredientRow symbol="W" name="Woda" detail={`${format(parseValue(recipe.hydration), 1)}%`} value={`${format(result.water)} g`} />
                <IngredientRow symbol="S" name="Sól" detail={`${format(parseValue(recipe.saltPercent), 1)}%`} value={`${format(result.salt, 1)} g`} />
                <IngredientRow symbol="D" name="Drożdże" detail={`${format(result.yeastPercent, 2)}%`} value={`${format(result.yeast, 2)} g`} />
              </ul>
              <div className="recipe-note"><span aria-hidden="true">✦</span><p><strong>Wskazówka DiMateo</strong>
                {proofingHours >= 24 ? "Długi czas wyrastania — zaplanuj chłodną fermentację i wyjmij ciasto wcześniej."
                  : hydration >= 70 ? "To dość mokre ciasto. Pomogą zwilżone dłonie i delikatne składanie."
                    : "Proporcje są wygodne do pracy w domu. Daj kulkom odpocząć przed formowaniem."}</p></div>
              <button className="copy-button" type="button" onClick={copyRecipe}>
                <span aria-hidden="true">{copyStatus === "copied" ? "✓" : "⧉"}</span>
                {copyStatus === "copied" ? "Przepis skopiowany" : copyStatus === "error" ? "Nie udało się skopiować" : "Kopiuj przepis"}
              </button>
            </>
          )}
        </aside>
      </section>

      <footer><strong>DiMateo</strong><span>Precyzyjne proporcje. Lepsza pizza.</span></footer>
    </main>
  );
}
