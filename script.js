document.addEventListener("DOMContentLoaded", function () {
    let data = [];
    
    fetch("data.json")
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
            populateFilters(data);
        });
    
    document.getElementById("search-input").addEventListener("input", function () {
        searchAndDisplayResults();
    });

    document.getElementById("export-csv-btn").addEventListener("click", function () {
        exportToCSV(data);
    });
});

function searchAndDisplayResults() {
    let query = document.getElementById("search-input").value.toLowerCase();
    let resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    let filteredData = data.filter(entry => 
        JSON.stringify(entry).toLowerCase().includes(query)
    );

    if (filteredData.length === 0) {
        resultsContainer.innerHTML = "<p>Keine Treffer gefunden.</p>";
        return;
    }

    filteredData.forEach(entry => {
        let entryDiv = document.createElement("div");
        entryDiv.classList.add("result-entry");

        let title = `<h3>${entry.theaterstück.titel} (${entry.theaterstück.zeit})</h3>`;
        let author = `<p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten})</p>`;
        let role = `<p><strong>Figur:</strong> ${entry.figur.name} (${entry.figur.rolle})</p>`;
        let abschnitt = `<p class="collapsible-text">${formatTextWithLineBreaks(highlightText(entry.abschnitt, query))}</p>`;
        let link = `<p><a href="${entry.original_link}" target="_blank">Originalquelle</a></p>`;
        
        let toggleButton = document.createElement("button");
        toggleButton.textContent = "Mehr anzeigen";
        toggleButton.classList.add("toggle-btn");
        toggleButton.addEventListener("click", function () {
            let textElement = entryDiv.querySelector(".collapsible-text");
            textElement.classList.toggle("expanded");
            toggleButton.textContent = textElement.classList.contains("expanded") ? "Weniger anzeigen" : "Mehr anzeigen";
        });

        entryDiv.innerHTML = title + author + role + abschnitt + link;
        entryDiv.appendChild(toggleButton);
        resultsContainer.appendChild(entryDiv);
    });
}

function highlightText(text, query) {
    if (!query) return text;
    let regex = new RegExp(query, "gi");
    return text.replace(regex, match => `<mark>${match}</mark>`);
}

function formatTextWithLineBreaks(text) {
    return text.replace(/\n/g, "<br>");
}

function exportToCSV(data) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID;Titel;Autor;Figur;Abschnitt\n";

    data.forEach(entry => {
        let row = `${entry.id};${entry.theaterstück.titel};${entry.autor.name};${entry.figur.name};"${entry.abschnitt.replace(/"/g, '""')}"`;
        csvContent += row + "\n";
    });

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link);
    link.click();
}

function populateFilters(data) {
    let uniqueAdaption = [...new Set(data.map(entry => entry.dialekt.adaption))];
    let uniqueFigur = [...new Set(data.map(entry => entry.figur.rolle))];
    let uniqueZeit = [...new Set(data.map(entry => entry.theaterstück.zeit))];
    let uniqueDialekt = [...new Set(data.map(entry => entry.dialekt.dialekt_grossraum))];
    let uniqueHerkunft = [...new Set(data.map(entry => entry.autor.herkunft))];

    populateDropdown("filter-adaption", uniqueAdaption);
    populateDropdown("filter-figurtyp", uniqueFigur);
    populateDropdown("filter-zeit", uniqueZeit);
    populateDropdown("filter-dialekt-grossraum", uniqueDialekt);
    populateDropdown("filter-herkunft", uniqueHerkunft);
}

function populateDropdown(filterId, values) {
    let dropdown = document.getElementById(filterId);
    values.forEach(value => {
        let option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        dropdown.appendChild(option);
    });
}
