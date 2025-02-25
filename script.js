// Globale Variable für die Daten
let data = [];

// Daten aus JSON-Datei laden
fetch("data.json")
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        console.log("Daten erfolgreich geladen:", data);
        populateFilters(); // Füllt die Dropdown-Filter mit echten Werten
    })
    .catch(error => console.error("Fehler beim Laden der Daten:", error));

// Dropdown-Filter füllen
function populateFilters() {
    let adaptionSet = new Set();
    let figurtypSet = new Set();
    let zeitSet = new Set();
    let dialektSet = new Set();
    let herkunftSet = new Set();

    data.forEach(entry => {
        if (entry.dialekt.adaption) adaptionSet.add(entry.dialekt.adaption);
        if (entry.figur.rolle) figurtypSet.add(entry.figur.rolle);
        if (entry.theaterstück.zeit) zeitSet.add(entry.theaterstück.zeit);
        if (entry.dialekt.dialekt_grossraum) dialektSet.add(entry.dialekt.dialekt_grossraum);
        if (entry.autor.herkunft) herkunftSet.add(entry.autor.herkunft);
    });

    populateDropdown("filter-adaption", adaptionSet);
    populateDropdown("filter-figurtyp", figurtypSet);
    populateDropdown("filter-zeit", zeitSet);
    populateDropdown("filter-dialekt-grossraum", dialektSet);
    populateDropdown("filter-herkunft", herkunftSet);
}

function populateDropdown(id, values) {
    let select = document.getElementById(id);
    select.innerHTML = `<option value="">Alle</option>`;
    values.forEach(value => {
        select.innerHTML += `<option value="${value}">${value}</option>`;
    });
}

// Suchfunktion mit Fuse.js
function performSearch(query) {
    if (!query || query.length < 2) {
        displayResults([]); // Leere Ergebnisse, wenn zu wenig Zeichen
        return;
    }

    let options = {
        includeScore: false,
        threshold: 0.3, // Erlaubt leichte Abweichungen
        distance: 100,
        minMatchCharLength: 2,
        keys: [
            "theaterstück.titel",
            "theaterstück.zeit",
            "autor.name",
            "autor.herkunft",
            "figur.name",
            "figur.rolle",
            "dialekt.adaption",
            "dialekt.dialekt_grossraum",
            "abschnitt"
        ]
    };

    let fuse = new Fuse(data, options);
    let results = fuse.search(query).map(result => result.item);
    
    console.log("Suchergebnisse für '" + query + "':", results); // Debugging
    displayResults(results, query);
}

// Ergebnisse anzeigen mit Suchwort-Hervorhebung
function displayResults(results, query = "") {
    let resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    if (results.length === 0) {
        resultsContainer.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
        return;
    }

    results.forEach(entry => {
        let highlightedAbschnitt = highlightText(entry.abschnitt, query);
        let resultItem = `
            <div class="result-item">
                <h2>${entry.theaterstück.titel} (${entry.theaterstück.zeit})</h2>
                <p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten})</p>
                <p><strong>Figur:</strong> ${entry.figur.name} - ${entry.figur.rolle}</p>
                <p><strong>Dialekt:</strong> ${entry.dialekt.dialekt_grossraum} (${entry.dialekt.adaption})</p>
                <p><strong>Textauszug:</strong> ${highlightedAbschnitt}</p>
                <p><a href="${entry.original_link}" target="_blank">Quelle</a></p>
            </div>
        `;
        resultsContainer.innerHTML += resultItem;
    });
}

// Suchwort hervorheben
function highlightText(text, query) {
    if (!query) return text;
    let regex = new RegExp(query, "gi");
    return text.replace(regex, match => `<span class="highlight">${match}</span>`);
}

// Suchinput-Feld überwachen
document.getElementById("search-input").addEventListener("input", function () {
    performSearch(this.value);
});

// Export als CSV
document.getElementById("export-csv-btn").addEventListener("click", function () {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Titel,Entstehungszeit,Autor,Figur,Dialekt,Textauszug,Quelle\n";

    data.forEach(entry => {
        let row = [
            `"${entry.theaterstück.titel}"`,
            `"${entry.theaterstück.zeit}"`,
            `"${entry.autor.name}"`,
            `"${entry.figur.name} - ${entry.figur.rolle}"`,
            `"${entry.dialekt.dialekt_grossraum} (${entry.dialekt.adaption})"`,
            `"${entry.abschnitt.replace(/"/g, '""')}"`, // Doppelte Anführungszeichen escapen
            `"${entry.original_link}"`
        ].join(",");

        csvContent += row + "\n";
    });

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
