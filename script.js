const map = L.map('map').setView([52.2297, 21.0122], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let markers = [];

// Pobierz testowe dane (groby.json)
fetch('data/groby.json').then(r => r.json()).then(data => {
    data.forEach(g => {
        const m = L.marker([g.lat, g.lng]).addTo(map)
            .bindPopup(`<b>${g.imie} ${g.nazwisko}</b><br>${g.data_smierci}`);
        m.grob = g;
        markers.push(m);
    });
});

// Proste wyszukiwanie
document.getElementById('search').addEventListener('click', () => {
    const q = document.getElementById('q').value.toLowerCase();
    markers.forEach(m => {
        const g = m.grob;
        const match = [g.imie, g.nazwisko, g.data_smierci].join(' ').toLowerCase().includes(q);
        if (match) m.openPopup();
    });
});