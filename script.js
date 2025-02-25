document.addEventListener("DOMContentLoaded", function () {
    let data = [];

    // JSON-Daten laden
    fetch("data.json")
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
        })
        .catch(error => console.error("Fehler beim Laden der Daten:", error));

    // Suchfeld überwachen
    document.getElementById("search-input").addEventListener("input", function () {
        let searchQuery = this.value.trim();
        performSearch(searchQuery);
    });

    function performSearch(query) {
        if (!query || query.length < 2) {  // Mindestens 2 Zeichen für eine Suche
            displayResults([]);
            return;
        }

        let options = {
            includeScore: false,
            threshold: 0.1,  // Präzisere Suche (niedriger = exakter)
            distance: 100,  // Maximale Distanz für Fuzzy-Suche
            minMatchCharLength: 2, // Mindestlänge des Matches
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
        displayResults(results, query);
    }

    function displayResults(results, query) {
        let resultContainer = document.getElementById("results");
        resultContainer.innerHTML = "";

        if (results.length === 0) {
            resultContainer.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
            return;
        }

        results.forEach(entry => {
            let entryDiv = document.createElement("div");
            entryDiv.classList.add("search-result");

            entryDiv.innerHTML = `
                <h3>${entry.theaterstück.titel} (${entry.theaterstück.zeit})</h3>
                <p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten})</p>
                <p><strong>Figur:</strong> ${entry.figur.name} – ${entry.figur.rolle}</p>
                <p><strong>Dialekt:</strong> ${entry.dialekt.dialekt_grossraum}</p>
                <p><strong>Textauszug:</strong> ${highlightQuery(entry.abschnitt, query)}</p>
            `;
            resultContainer.appendChild(entryDiv);
        });
    }

    // Suchbegriff im Text farblich hervorheben
    function highlightQuery(text, query) {
        if (!query.trim()) return text;
        let regex = new RegExp(query, "gi");
        return text.replace(regex, match => `<mark>${match}</mark>`);
    }
});
