let data = [];

// Daten laden
fetch("data.json")
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        console.log("Daten geladen:", data);
        populateFilters();
    })
    .catch(error => console.error("Fehler beim Laden der Daten:", error));

function populateFilters() {
    let adaptionSet = new Set();
    let figurtypSet = new Set();
    let zeitSet = new Set();
    let dialektSet = new Set();
    let herkunftSet = new Set();

    data.forEach(entry => {
        if (entry.dialekt?.adaption) adaptionSet.add(entry.dialekt.adaption);
        if (entry.figur?.rolle) figurtypSet.add(entry.figur.rolle);
        if (entry.theaterstück?.zeit) zeitSet.add(entry.theaterstück.zeit);
        if (entry.dialekt?.dialekt_grossraum) dialektSet.add(entry.dialekt.dialekt_grossraum);
        if (entry.autor?.herkunft) herkunftSet.add(entry.autor.herkunft);
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

document.querySelectorAll("#filters select").forEach(select => {
    select.addEventListener("change", performSearch);
});

document.getElementById("search-input").addEventListener("input", function () {
    performSearch();
});

document.getElementById("export-csv-btn").addEventListener("click", exportToCSV);

function performSearch() {
    let query = document.getElementById("search-input").value.toLowerCase();
    let selectedAdaption = document.getElementById("filter-adaption").value;
    let selectedFigurtyp = document.getElementById("filter-figurtyp").value;
    let selectedZeit = document.getElementById("filter-zeit").value;
    let selectedDialekt = document.getElementById("filter-dialekt-grossraum").value;
    let selectedHerkunft = document.getElementById("filter-herkunft").value;

    let results = data.filter(entry => {
        let matchesQuery = query.length < 2 || Object.values(entry).some(value =>
            typeof value === "string" && value.toLowerCase().includes(query)
        );

        let matchesFilters =
            (!selectedAdaption || entry.dialekt.adaption === selectedAdaption) &&
            (!selectedFigurtyp || entry.figur.rolle === selectedFigurtyp) &&
            (!selectedZeit || entry.theaterstück.zeit === selectedZeit) &&
            (!selectedDialekt || entry.dialekt.dialekt_grossraum === selectedDialekt) &&
            (!selectedHerkunft || entry.autor.herkunft === selectedHerkunft);

        return matchesQuery && matchesFilters;
    });

    displayResults(results, query);
}

function displayResults(results, query = "") {
    let resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = results.length === 0
        ? "<p>Keine Ergebnisse gefunden.</p>"
        : results.map(entry => `
            <div class="result-item">
                <h2>${entry.theaterstück.titel} (${entry.theaterstück.zeit})</h2>
                <p><strong>Autor:</strong> ${entry.autor.name}</p>
                <p><strong>Figur:</strong> ${entry.figur.name} - ${entry.figur.rolle}</p>
                <p><strong>Dialekt:</strong> ${entry.dialekt.dialekt_grossraum} (${entry.dialekt.adaption})</p>
                <p>
                    <strong>Textauszug:</strong> 
                    <span class="abschnitt-preview">${createCollapsibleText(entry.abschnitt, query)}</span>
                </p>
                <p><a href="${entry.original_link}" target="_blank">Quelle</a></p>
            </div>`).join("");

    document.querySelectorAll(".show-more-btn").forEach(button => {
        button.addEventListener("click", function () {
            let fullText = this.previousElementSibling;
            if (fullText.style.display === "none") {
                fullText.style.display = "inline";
                this.textContent = "Weniger anzeigen";
            } else {
                fullText.style.display = "none";
                this.textContent = "Mehr anzeigen";
            }
        });
    });
}

function createCollapsibleText(text, query) {
    const maxLength = 300;
    const highlightedText = highlightText(text, query);

    if (highlightedText.length <= maxLength) {
        return highlightedText;
    }

    return `
        ${highlightedText.substring(0, maxLength)}...
        <span class="full-text" style="display: none;">${highlightedText.substring(maxLength)}</span>
        <button class="show-more-btn">Mehr anzeigen</button>
    `;
}

function highlightText(text, query) {
    if (!query) return text;
    let regex = new RegExp(query, "gi");
    return text.replace(regex, match => `<span class="highlight">${match}</span>`);
}

// CSV-Export-Funktion
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";

    // CSV Header
    csvContent += "ID;Titel;Entstehungszeit;Autor;Herkunft Autor;Figur;Rolle;Dialekt;Adaptionstyp;Abschnitt;Quelle\n";

    let results = document.querySelectorAll(".result-item");
    
    results.forEach(result => {
        let titel = result.querySelector("h2").textContent.replace(/;/g, ",");
        let autor = result.querySelector("p:nth-of-type(1)").textContent.split(": ")[1] || "";
        let figur = result.querySelector("p:nth-of-type(2)").textContent.split(": ")[1] || "";
        let dialekt = result.querySelector("p:nth-of-type(3)").textContent.split(": ")[1] || "";
        let abschnitt = result.querySelector(".abschnitt-preview").textContent.replace(/;/g, ",").replace(/\n/g, " ");
        let quelle = result.querySelector("a") ? result.querySelector("a").href : "";

        csvContent += `"${titel}";"${autor}";"${figur}";"${dialekt}";"${abschnitt}";"${quelle}"\n`;
    });

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link);
    link.click();
}
