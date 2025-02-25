document.addEventListener("DOMContentLoaded", function () {
    let dataset = [];

    // Daten laden
    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            dataset = data;
            populateDropdowns(dataset);
            displayResults(dataset);
        });

    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", function () {
        performSearch();
    });

    document.getElementById("export-csv-btn").addEventListener("click", exportToCSV);

    function performSearch() {
        let query = searchInput.value.toLowerCase().trim();
        let filteredData = dataset.filter(entry =>
            Object.values(entry).some(value =>
                JSON.stringify(value).toLowerCase().includes(query)
            )
        );
        displayResults(filteredData, query);
    }

    function displayResults(data, query = "") {
        const resultsContainer = document.getElementById("results");
        resultsContainer.innerHTML = "";

        if (data.length === 0) {
            resultsContainer.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
            return;
        }

        data.forEach(entry => {
            let resultItem = document.createElement("div");
            resultItem.classList.add("result-item");

            let formattedAbschnitt = formatLineBreaks(entry.abschnitt);
            let highlightedAbschnitt = highlightText(formattedAbschnitt, query);
            let shortAbschnitt = shortenText(highlightedAbschnitt);

            resultItem.innerHTML = `
                <h3>${entry.theaterstück.titel} (${entry.theaterstück.zeit})</h3>
                <p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten})</p>
                <p><strong>Herkunft:</strong> ${entry.autor.herkunft}</p>
                <p><strong>Figur:</strong> ${entry.figur.name} (${entry.figur.rolle})</p>
                <p><strong>Adaption:</strong> ${entry.dialekt.adaption} (${entry.dialekt.dialekt_grossraum})</p>
                <p><strong>Abschnitt:</strong> 
                    <span class="abschnitt-preview">${shortAbschnitt}</span>
                    <button class="toggle-abschnitt">Mehr</button>
                    <span class="abschnitt-full hidden">${highlightedAbschnitt}</span>
                </p>
                <p><a href="${entry.original_link}" target="_blank">Quelle</a></p>
            `;

            resultsContainer.appendChild(resultItem);

            let toggleBtn = resultItem.querySelector(".toggle-abschnitt");
            let preview = resultItem.querySelector(".abschnitt-preview");
            let full = resultItem.querySelector(".abschnitt-full");

            toggleBtn.addEventListener("click", function () {
                if (full.classList.contains("hidden")) {
                    full.classList.remove("hidden");
                    preview.classList.add("hidden");
                    toggleBtn.textContent = "Weniger";
                } else {
                    full.classList.add("hidden");
                    preview.classList.remove("hidden");
                    toggleBtn.textContent = "Mehr";
                }
            });
        });
    }

    function populateDropdowns(data) {
        populateDropdown("filter-adaption", data.map(d => d.dialekt.adaption));
        populateDropdown("filter-figurtyp", data.map(d => d.figur.rolle));
        populateDropdown("filter-zeit", data.map(d => d.theaterstück.zeit));
        populateDropdown("filter-dialekt-grossraum", data.map(d => d.dialekt.dialekt_grossraum));
        populateDropdown("filter-herkunft", data.map(d => d.autor.herkunft));
    }

    function populateDropdown(id, values) {
        let dropdown = document.getElementById(id);
        let uniqueValues = [...new Set(values)].sort();
        uniqueValues.forEach(value => {
            let option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            dropdown.appendChild(option);
        });

        dropdown.addEventListener("change", function () {
            filterResults();
        });
    }

    function filterResults() {
        let adaptionFilter = document.getElementById("filter-adaption").value;
        let figurFilter = document.getElementById("filter-figurtyp").value;
        let zeitFilter = document.getElementById("filter-zeit").value;
        let dialektFilter = document.getElementById("filter-dialekt-grossraum").value;
        let herkunftFilter = document.getElementById("filter-herkunft").value;

        let filteredData = dataset.filter(entry => 
            (adaptionFilter === "" || entry.dialekt.adaption === adaptionFilter) &&
            (figurFilter === "" || entry.figur.rolle === figurFilter) &&
            (zeitFilter === "" || entry.theaterstück.zeit === zeitFilter) &&
            (dialektFilter === "" || entry.dialekt.dialekt_grossraum === dialektFilter) &&
            (herkunftFilter === "" || entry.autor.herkunft === herkunftFilter)
        );

        displayResults(filteredData);
    }

    function highlightText(text, query) {
        if (!query) return text;
        let regex = new RegExp(query, "gi");
        return text.replace(regex, match => `<span class="highlight">${match}</span>`);
    }

    function formatLineBreaks(text) {
        return text.replace(/\n/g, "<br>");
    }

    function shortenText(text, length = 200) {
        if (text.length <= length) return text;
        return text.substring(0, length) + "...";
    }

    function exportToCSV() {
        let csvContent = "data:text/csv;charset=utf-8,";
        let headers = [
            "ID",
            "Titel",
            "Entstehungszeit",
            "Druckort",
            "Aufführungshinweise",
            "Autor",
            "Herkunft Autor",
            "Koordinaten Herkunft Autor",
            "Orte Autor",
            "Lebensdaten Autor",
            "Figur",
            "Rolle",
            "Beschreibung",
            "Adaptionstyp",
            "Adaptierte Varietät",
            "Abschnitt",
            "Original-Link",
            "Koordinaten Herkunft Figur"
        ];

        csvContent += headers.join(",") + "\n";

        dataset.forEach(entry => {
            let row = [
                entry.id,
                entry.theaterstück.titel,
                entry.theaterstück.zeit,
                entry.theaterstück.druckort,
                entry.theaterstück.auffuehrungshinweise || "",
                entry.autor.name,
                entry.autor.herkunft,
                entry.geokoordinaten?.herkunft_autor 
                    ? `${entry.geokoordinaten.herkunft_autor.lat}, ${entry.geokoordinaten.herkunft_autor.lng}` 
                    : "",
                entry.autor.orte ? entry.autor.orte.join("; ") : "",
                entry.autor.lebensdaten,
                entry.figur.name,
                entry.figur.rolle,
                entry.figur.beschreibung || "",
                entry.dialekt.adaption,
                entry.dialekt.dialekt_grossraum,
                `"${entry.abschnitt.replace(/\n/g, " ")}"`,
                entry.original_link,
                entry.geokoordinaten?.herkunft_figur 
                    ? `${entry.geokoordinaten.herkunft_figur.lat}, ${entry.geokoordinaten.herkunft_figur.lng}` 
                    : ""
            ];

            csvContent += row.map(field => `"${field}"`).join(",") + "\n";
        });

        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "AdViD_Datenbank_Export.csv");
        document.body.appendChild(link);
        link.click();
    }
});
