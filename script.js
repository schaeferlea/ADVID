document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const filterAdaption = document.getElementById("filterAdaption");
    const filterFigurtyp = document.getElementById("filterFigurtyp");
    const filterZeit = document.getElementById("filterZeit");
    const filterDialektGrossraum = document.getElementById("filterDialektGrossraum");
    const filterHerkunft = document.getElementById("filterHerkunft");
    let globalData = [];

    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            globalData = data;
            displayResults(globalData);
        });

    const fuseOptions = {
        keys: ["theaterstück.titel", "autor.name", "figur.name", "abschnitt"],
        threshold: 0.4,
        includeScore: true,
    };

    function combinedSearch(query, data) {
        query = query.trim();
        if (query === "") return data;

        const exactResults = data.filter(entry => {
            return entry.abschnitt.toLowerCase().includes(query.toLowerCase());
        });

        const fuse = new Fuse(data, fuseOptions);
        const fuseResults = fuse.search(query).map(result => result.item);

        const combined = [...exactResults];
        fuseResults.forEach(item => {
            if (!combined.some(existing => existing.id === item.id)) {
                combined.push(item);
            }
        });
        return combined;
    }

    function updateResults() {
        let filteredData = globalData.filter(entry => {
            if (filterAdaption.value && entry.dialekt.adaption !== filterAdaption.value) return false;
            if (filterFigurtyp.value && entry.figur.rolle !== filterFigurtyp.value) return false;
            if (filterZeit.value && getZeitGroup(entry.theaterstück.zeit) !== filterZeit.value) return false;
            if (filterDialektGrossraum.value && entry.dialekt.dialekt_grossraum !== filterDialektGrossraum.value) return false;
            if (filterHerkunft.value && entry.autor.herkunft !== filterHerkunft.value) return false;
            return true;
        });

        const query = searchInput.value.trim();
        if (query !== "") {
            filteredData = combinedSearch(query, filteredData);
        }

        displayResults(filteredData);
    }

    function displayResults(results) {
        const resultsContainer = document.getElementById("results");
        resultsContainer.innerHTML = "";
        results.forEach(entry => {
            const entryElement = document.createElement("div");
            entryElement.classList.add("result-item");
            entryElement.innerHTML = `
                <h3>${entry.theaterstück.titel} (${entry.theaterstück.zeit})</h3>
                <p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten})</p>
                <p><strong>Figur:</strong> ${entry.figur.name} - ${entry.figur.rolle}</p>
                <p><strong>Dialekt:</strong> ${entry.dialekt.dialekt_grossraum} (${entry.dialekt.adaption})</p>
                <p><strong>Textauszug:</strong> <span class="highlightable">${highlightQuery(entry.abschnitt, searchInput.value)}</span></p>
                <p><a href="${entry.original_link}" target="_blank">Originalquelle</a></p>
            `;
            resultsContainer.appendChild(entryElement);
        });
    }

    function highlightQuery(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(regex, "<mark>$1</mark>");
    }

    searchInput.addEventListener("input", updateResults);
    filterAdaption.addEventListener("change", updateResults);
    filterFigurtyp.addEventListener("change", updateResults);
    filterZeit.addEventListener("change", updateResults);
    filterDialektGrossraum.addEventListener("change", updateResults);
    filterHerkunft.addEventListener("change", updateResults);
});
