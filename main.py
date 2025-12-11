# main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pathlib import Path
import json

app = FastAPI(title="Cemetery API")

# --- CORS: pozwala na zapytania z frontendu (Live Server na innym porcie) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # na potrzeby ćwiczeń zostawiamy *
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Wczytanie pliku GeoJSON z grobami ---
DATA_PATH = Path(__file__).parent / "Data" / "mogily.geojson"

if not DATA_PATH.exists():
    raise RuntimeError(f"Brak pliku {DATA_PATH}. Upewnij się, że ścieżka jest poprawna.")

with DATA_PATH.open(encoding="utf-8") as f:
    GRAVES_GEOJSON = json.load(f)

FEATURES: List[dict] = GRAVES_GEOJSON.get("features", [])


def get_prop(props: dict, keys):
    """Pomocnicza – szuka pierwszej niepustej wartości pośród podanych kluczy."""
    for k in keys:
        if k in props and props[k] is not None and str(props[k]).strip() != "":
            return props[k]
    return ""


def matches(feature: dict,
            imie: Optional[str],
            nazwisko: Optional[str],
            data_urodzenia: Optional[str],
            data_smierci: Optional[str]) -> bool:
    """Sprawdza czy feature spełnia kryteria wyszukiwania (case-insensitive, 'zawiera')."""
    p = feature.get("properties", {}) or {}

    im = str(get_prop(p, ["imie", "Imie", "IMIE"])).lower()
    nz = str(get_prop(p, ["nazwisko", "Nazwisko", "NAZWISKO"])).lower()
    du = str(get_prop(p, ["data_urodzenia", "Data urodz", "DATA_URODZ"])).lower()
    ds = str(get_prop(p, ["data_smierci", "Data śmierci", "DATA_SMIERCI", "Data ┼Ť"])).lower()

    if imie and imie.lower() not in im:
        return False
    if nazwisko and nazwisko.lower() not in nz:
        return False
    if data_urodzenia and data_urodzenia.lower() not in du:
        return False
    if data_smierci and data_smierci.lower() not in ds:
        return False
    return True


@app.get("/api/graves")
def list_graves(
    imie: Optional[str] = Query(None, description="Filtr: imię (fragment)"),
    nazwisko: Optional[str] = Query(None, description="Filtr: nazwisko (fragment)"),
    data_urodzenia: Optional[str] = Query(None, description="Filtr: data urodzenia (fragment, np. '1980')"),
    data_smierci: Optional[str] = Query(None, description="Filtr: data śmierci (fragment, np. '2020')"),
):
    """
    Zwraca groby w formacie GeoJSON FeatureCollection.
    Jeśli podasz parametry zapytania – filtruje po imieniu/nazwisku/datach.
    """
    if not any([imie, nazwisko, data_urodzenia, data_smierci]):
        # bez filtrów – zwróć wszystkie
        features = FEATURES
    else:
        features = [
            f for f in FEATURES
            if matches(f, imie, nazwisko, data_urodzenia, data_smierci)
        ]

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@app.get("/api/graves/{grave_id}")
def get_grave(grave_id: int):
    """
    Zwraca pojedynczy grób na podstawie indeksu listy features.
    (dla prostoty używamy indeksu, ale możesz to zmienić na swoje ID z properties).
    """
    if grave_id < 0 or grave_id >= len(FEATURES):
        raise HTTPException(status_code=404, detail="Grób nie istnieje")

    return FEATURES[grave_id]
