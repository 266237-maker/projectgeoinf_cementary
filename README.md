# projectgeoinf_cementary

Aplikacja webowa z interaktywną mapą cmentarza.  
Pozwala wyszukiwać groby po **imieniu**, **nazwisku** oraz **dacie urodzenia / śmierci**, a następnie:

- zlokalizować grób na mapie,
- wyświetlić szczegóły w panelu bocznym,
- pobrać dane wybranego grobu jako plik JSON,
- pobrać cały zbiór grobów jako plik GeoJSON.

Projekt powstał jako część pracy z zakresu geoinformacji / systemów informacji przestrzennej.

---

## Funkcjonalności

- Interaktywna mapa cmentarza
  - wizualizacja granicy cmentarza na podstawie pliku `granica_cmentarza.geojson`,
  - punkty grobów wczytywane z pliku `mogily.geojson`,
  - automatyczne dopasowanie widoku mapy do granicy cmentarza.

- Wyszukiwanie grobów
  - wyszukiwanie po:
    - imieniu,
    - nazwisku,
    - dacie urodzenia (np. `12.03.1950`),
    - dacie śmierci (np. `01.11.2005`),
  - obsługa częściowych dopasowań (np. fragment nazwiska).

- *Szczegóły grobu
  - po kliknięciu w punkt na mapie lub wybraniu z wyników wyszukiwania:
    - podświetlenie grobu na mapie,
    - wyświetlenie: imię, nazwisko, data urodzenia, data śmierci, ID grobu.

- Eksport danych
  - pobranie pojedynczego grobu jako `grob_imie_nazwisko.json`,
  - pobranie wszystkich grobów jako `mogily.geojson`.



Wykorzystane technologie

- **HTML5**, **CSS3**, **JavaScript (ES6+)**
- **[Leaflet.js](https://leafletjs.com/)** – biblioteka do map interaktywnych
- **OpenStreetMap** – podkład mapowy
- **GeoJSON** – format danych przestrzennych (granica cmentarza, lokalizacje grobów)

> Aplikacja działa w 100% po stronie przeglądarki 

Struktura projektu

Struktura katalogów:

```text
/
├─ index.html
├─ style.css
├─ script.js
└─ Data/
   ├─ granica_cmentarza.geojson
   └─ mogily.geojson
```


## Instrukcja uruchomienia mapy

Pobranie plików
- wejdź na stronę projektu na GitHubie,
- kliknij Code → Download ZIP,
- zapisz plik na komputerze.
- Rozpakowanie archiwum
- kliknij prawym przyciskiem pobrane archiwum .zip,
- wybierz Wyodrębnij tutaj,
- poczekaj aż powstanie folder z plikami mapy.
- Uruchomienie mapy
- otwórz rozpakowany folder,
- znajdź plik index.html,
- kliknij go dwukrotnie,
- mapa uruchomi się w Twojej przeglądarce.

## Wymagania
- żadnej instalacji nie trzeba,
- wystarczy dowolna aktualna przeglądarka internetowa.
