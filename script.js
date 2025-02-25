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
        let searchQuery = this.value.trim().toLowerCase();
        performSearch(searchQuery);
    });

    function performSearch(query) {
        if (!query) {
            displayResults([]);
            return;
        }

        let options = {
            includeScore: false,
            threshold: 0.2,  // Toleranz für Fuzzy-Suche
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
        displayResults(results);
    }

    function displayResults(results) {
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
                <p><strong>Textauszug:</strong> ${highlightQuery(entry.abschnitt, document.getElementById("search-input").value)}</p>
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
