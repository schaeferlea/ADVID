document.addEventListener("DOMContentLoaded", function () {
    let data = [];

    // Daten aus data.json laden
    fetch("data.json")
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
        })
        .catch(error => console.error("Fehler beim Laden der Daten:", error));

    // Suchfeld überwachen
    document.getElementById("searchInput").addEventListener("input", function () {
        let searchQuery = this.value.trim().toLowerCase();
        performSearch(searchQuery);
    });

    function performSearch(query) {
        if (query === "") {
            displayResults([]); // Keine Suche, also leere Ergebnisse
            return;
        }

        let results = data.filter(entry => {
            return Object.values(entry).some(value => 
                typeof value === "string" && value.toLowerCase().includes(query)
            ) || Object.values(entry).some(value => 
                typeof value === "object" && JSON.stringify(value).toLowerCase().includes(query)
            );
        });

        displayResults(results);
    }

    function displayResults(results) {
        let resultContainer = document.getElementById("searchResults");
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
                <p><strong>Textauszug:</strong> ${entry.abschnitt}</p>
            `;
            resultContainer.appendChild(entryDiv);
        });
    }
});
