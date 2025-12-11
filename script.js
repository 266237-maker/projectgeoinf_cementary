// Inicjalizacja mapy – startowo Warszawa, potem dopasujemy do granicy cmentarza
const map = L.map('map').setView([52.2297, 21.0122], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let gravesLayer = null;    // warstwa z grobami (GeoJSON)
let gravesData = null;     // pełne GeoJSON mogił
let currentFeature = null; // aktualnie wybrany grób

// pola wyszukiwania
const firstNameInput = document.getElementById('q-imie');
const lastNameInput = document.getElementById('q-nazwisko');
const birthDateInput = document.getElementById('q-urodzenie');
const deathDateInput = document.getElementById('q-smierc');

const searchBtn = document.getElementById('search');
const downloadGraveBtn = document.getElementById('download-grave');
const downloadAllBtn = document.getElementById('download-all');
const detailsDiv = document.getElementById('details');

// ===== pomocnicza funkcja do pobierania właściwości =====
function getProp(p, keys) {
    for (const k of keys) {
        if (k in p && p[k] != null && String(p[k]).trim() !== '') {
            return p[k];
        }
    }
    return '';
}

// ============ ŁADOWANIE DANYCH ============

// 1) granica cmentarza – UWAGA: plik w folderze "Data"
fetch('./Data/granica_cmentarza.geojson')
    .then(r => {
        if (!r.ok) {
            throw new Error(`HTTP ${r.status}`);
        }
        return r.json();
    })
    .then(data => {
        const boundaryLayer = L.geoJSON(data, {
            style: {
                weight: 2,
                dashArray: '5,3',
                fillOpacity: 0,
                color: '#444'
            }
        }).addTo(map);

        // dopasuj widok do granicy
        map.fitBounds(boundaryLayer.getBounds());
        console.log('Granica cmentarza wczytana, liczba obiektów:', data.features?.length ?? 0);
    })
    .catch(err => {
        console.error('Błąd wczytywania granicy cmentarza:', err);
        detailsDiv.innerHTML = `
            <h2>Błąd danych</h2>
            <p>Nie udało się wczytać granicy cmentarza (<code>Data/granica_cmentarza.geojson</code>).</p>
        `;
    });

// 2) groby – UWAGA: plik w folderze "Data"
fetch('./Data/mogily.geojson')
    .then(r => {
        if (!r.ok) {
            throw new Error(`HTTP ${r.status}`);
        }
        return r.json();
    })
    .then(data => {
        gravesData = data;

        gravesLayer = L.geoJSON(data, {
            pointToLayer: (feature, latlng) =>
                L.circleMarker(latlng, {
                    radius: 5,
                    weight: 1,
                    color: '#1f4e5f',
                    fillColor: '#1f4e5f',
                    fillOpacity: 0.8
                }),
            onEachFeature: (feature, layer) => {
                layer.bindPopup(makePopupHtml(feature));
                layer.on('click', () => selectFeature(feature, layer));
            }
        }).addTo(map);

        console.log('Mogiły wczytane, liczba grobów:', data.features?.length ?? 0);
    })
    .catch(err => {
        console.error('Błąd wczytywania mogił:', err);
        detailsDiv.innerHTML = `
            <h2>Błąd danych</h2>
            <p>Nie udało się wczytać grobów (<code>Data/mogily.geojson</code>).</p>
        `;
    });


// ============ POMOCNICZE ============

function makePopupHtml(feature) {
    const p = feature.properties || {};

    const imie = getProp(p, ['imie', 'Imie', 'IMIE']);
    const nazwisko = getProp(p, ['nazwisko', 'Nazwisko', 'NAZWISKO']);
    const dataUrodz = getProp(p, ['data_urodzenia', 'Data urodz', 'DATA_URODZ']);
    const dataSmierci = getProp(
        p,
        ['data_smierci', 'Data śmierci', 'DATA_SMIERCI', 'Data ┼Ť']
    );

    return `
        <b>${imie || ''} ${nazwisko || ''}</b><br>
        Data urodzenia: ${dataUrodz || '-'}<br>
        Data śmierci: ${dataSmierci || '-'}
    `;
}

function selectFeature(feature, layer) {
    currentFeature = feature;

    // podświetlenie wybranego grobu
    gravesLayer.eachLayer(l => {
        if (l === layer) {
            l.setStyle({ color: '#c0392b', fillColor: '#c0392b' });
        } else {
            l.setStyle({ color: '#1f4e5f', fillColor: '#1f4e5f' });
        }
    });

    updateDetails(feature);
    downloadGraveBtn.disabled = false;

    // pokaż popup na mapie
    if (layer) {
        layer.openPopup();
        map.panTo(layer.getLatLng());
    }
}

function updateDetails(feature) {
    const p = feature.properties || {};

    const imie = getProp(p, ['imie', 'Imie', 'IMIE']);
    const nazwisko = getProp(p, ['nazwisko', 'Nazwisko', 'NAZWISKO']);
    const dataUrodz = getProp(p, ['data_urodzenia', 'Data urodz', 'DATA_URODZ']);
    const dataSmierci = getProp(
        p,
        ['data_smierci', 'Data śmierci', 'DATA_SMIERCI', 'Data ┼Ť']
    );
    const id = getProp(p, ['id', 'ID']);

    detailsDiv.innerHTML = `
        <h2>${imie || ''} ${nazwisko || ''}</h2>
        <ul>
            <li><strong>ID grobu:</strong> ${id || '-'}</li>
            <li><strong>Data urodzenia:</strong> ${dataUrodz || '-'}</li>
            <li><strong>Data śmierci:</strong> ${dataSmierci || '-'}</li>
        </ul>
        <p><em>Dane możesz pobrać przyciskiem "Pobierz dane grobu (JSON)" powyżej.</em></p>
    `;
}

// ============ WYSZUKIWANIE ============

// generowanie listy wyników wyszukiwania
function renderSearchResults(results) {
    if (!results.length) {
        detailsDiv.innerHTML = `
            <h2>Brak wyników</h2>
            <p>Nie znaleziono grobów spełniających kryteria wyszukiwania.</p>
        `;
        downloadGraveBtn.disabled = true;
        return;
    }

    if (results.length === 1) {
        // tylko jeden wynik – od razu wybieramy
        const { feature, layer } = results[0];
        selectFeature(feature, layer);
        return;
    }

    // wiele wyników – pokaż listę do wyboru
    let html = `<h2>Wyniki wyszukiwania (${results.length})</h2>`;
    html += `<p>Wybierz odpowiednią osobę z listy poniżej:</p>`;
    html += `<ol>`;

    results.forEach((res, idx) => {
        const p = res.feature.properties || {};
        const imie = getProp(p, ['imie', 'Imie', 'IMIE']) || '';
        const nazwisko = getProp(p, ['nazwisko', 'Nazwisko', 'NAZWISKO']) || '';
        const dataUrodz = getProp(p, ['data_urodzenia', 'Data urodz', 'DATA_URODZ']) || '-';
        const dataSmierci = getProp(
            p,
            ['data_smierci', 'Data śmierci', 'DATA_SMIERCI', 'Data ┼Ť']
        ) || '-';

        html += `
            <li>
                <button type="button"
                        class="result-btn"
                        data-result-index="${idx}">
                    <strong>${imie} ${nazwisko}</strong>
                    – ur. ${dataUrodz}, zm. ${dataSmierci}
                </button>
            </li>
        `;
    });

    html += `</ol>`;
    detailsDiv.innerHTML = html;
    downloadGraveBtn.disabled = true; // dopóki nic nie wybierzemy

    // podpinamy kliknięcia pod przyciski
    const buttons = detailsDiv.querySelectorAll('.result-btn');
    buttons.forEach(btn => {
        const idx = parseInt(btn.getAttribute('data-result-index'), 10);
        const { feature, layer } = results[idx];

        btn.addEventListener('click', () => {
            selectFeature(feature, layer);
        });
    });
}

function performSearch() {
    if (!gravesLayer) return;

    const qImie = (firstNameInput.value || '').toLowerCase().trim();
    const qNazwisko = (lastNameInput.value || '').toLowerCase().trim();
    const qUrodz = (birthDateInput.value || '').toLowerCase().trim();
    const qSmierc = (deathDateInput.value || '').toLowerCase().trim();

    if (!qImie && !qNazwisko && !qUrodz && !qSmierc) {
        detailsDiv.innerHTML = `
            <h2>Szczegóły grobu</h2>
            <p>Wpisz imię, nazwisko lub daty i kliknij "Szukaj".</p>
        `;
        return;
    }

    const results = [];

    gravesLayer.eachLayer(layer => {
        const p = layer.feature.properties || {};
        const imie = getProp(p, ['imie', 'Imie', 'IMIE']).toLowerCase();
        const nazwisko = getProp(p, ['nazwisko', 'Nazwisko', 'NAZWISKO']).toLowerCase();
        const dataUrodz = getProp(p, ['data_urodzenia', 'Data urodz', 'DATA_URODZ']).toLowerCase();
        const dataSmierci = getProp(
            p,
            ['data_smierci', 'Data śmierci', 'DATA_SMIERCI', 'Data ┼Ť']
        ).toLowerCase();

        let match = true;
        if (qImie && !imie.includes(qImie)) match = false;
        if (qNazwisko && !nazwisko.includes(qNazwisko)) match = false;
        if (qUrodz && !dataUrodz.includes(qUrodz)) match = false;
        if (qSmierc && !dataSmierci.includes(qSmierc)) match = false;

        if (match) {
            results.push({ feature: layer.feature, layer });
        }
    });

    // zamknij wszystkie popupy zanim pokażemy listę / wybierzemy jeden
    gravesLayer.eachLayer(layer => layer.closePopup());

    renderSearchResults(results);
}

// przycisk "Szukaj"
searchBtn.addEventListener('click', performSearch);

// Enter w dowolnym z pól uruchamia wyszukiwanie
[firstNameInput, lastNameInput, birthDateInput, deathDateInput].forEach(input => {
    if (!input) return;
    input.addEventListener('keyup', e => {
        if (e.key === 'Enter') performSearch();
    });
});

// ============ POBIERANIE DANYCH ============

// pojedynczy grób jako JSON
downloadGraveBtn.addEventListener('click', () => {
    if (!currentFeature) return;

    const p = currentFeature.properties || {};
    const imie = (getProp(p, ['imie', 'Imie', 'IMIE']) || 'grob').toLowerCase();
    const nazwisko = (getProp(p, ['nazwisko', 'Nazwisko', 'NAZWISKO']) || '').toLowerCase();

    const jsonStr = JSON.stringify(currentFeature, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `grob_${imie}_${nazwisko}.json`.replace(/[^a-z0-9_.-]+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
});

// wszystkie groby – oryginalny GeoJSON
downloadAllBtn.addEventListener('click', () => {
    if (!gravesData) return;

    const jsonStr = JSON.stringify(gravesData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'mogily.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
});
