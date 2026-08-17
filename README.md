# DiMateo

Nowoczesny kalkulator składników i proporcji ciasta na pizzę.

Aplikacja działa publicznie pod adresem: [dimateo.creativecrafts.pl](https://dimateo.creativecrafts.pl/)

## Funkcje

- obliczanie ilości mąki, wody, soli i drożdży
- liczba pizz i waga pojedynczej kulki
- hydracja oraz czas wyrastania
- automatyczna lub ręczna ilość drożdży
- walidacja wprowadzanych danych
- zapis ustawień lokalnie w przeglądarce
- kopiowanie gotowego przepisu
- responsywny interfejs na telefon i komputer

## Uruchomienie lokalne

Wymagany jest Node.js 20 lub nowszy.

```bash
npm install
npm run dev
```

## Budowanie wersji produkcyjnej

```bash
npm run build
```

Gotowe pliki zostaną zapisane w katalogu `dist`. Zawartość tego katalogu można umieścić w katalogu `public_html` hostingu.

## Wersjonowanie

- `main` — wersja produkcyjna
- `feature/nazwa-funkcji` — nowe funkcje
- zmiany trafiają do `main` przez Pull Request

## Technologia

React, TypeScript i Vite.
