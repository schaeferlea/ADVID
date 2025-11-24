document.addEventListener("DOMContentLoaded", () => {
  let dataset = [];
  let kontextAnzeigen = true;
  let activeFilteredData = [];

  const textSearchInput   = document.getElementById("search-input");
  const globalSearchInput = document.getElementById("search-global");
  const regexCheckbox     = document.getElementById("use-regex");
  const exportBtn         = document.getElementById("export-csv-btn");

  // Daten laden
  fetch("data_segmentiert.json")
    .then(res => res.json())
    .then(data => {
      dataset = data;
      populateDropdowns(data);
      activeFilteredData = data;
      displayResults(data);
      scrollToHashIfPresent(); // Sprung zu Eintrag, falls von Karte mit #id gekommen
    });

  // Event-Listener für Suchfelder
  if (textSearchInput) {
    textSearchInput.addEventListener("input", performSearch);
  }
  if (globalSearchInput) {
    globalSearchInput.addEventListener("input", performSearch);
  }
  if (regexCheckbox) {
    regexCheckbox.addEventListener("change", performSearch);
  }

  // Export-Button
  if (exportBtn) {
    exportBtn.addEventListener("click", exportToTSV);
  }

  // Button zum (Nicht-)Berücksichtigen des Kontextes im Text
  const toggleKontextBtn = document.createElement("button");
  toggleKontextBtn.textContent = "Kontext nicht berücksichtigen";
  toggleKontextBtn.addEventListener("click", () => {
    kontextAnzeigen = !kontextAnzeigen;
    toggleKontextBtn.textContent = kontextAnzeigen
      ? "Kontext nicht berücksichtigen"
      : "Kontext berücksichtigen";
    performSearch();
  });
  const searchContainer = document.querySelector(".search-container");
  if (searchContainer) {
    searchContainer.appendChild(toggleKontextBtn);
  }

  // ---------------- Haupt-Suchfunktion ----------------

  function performSearch() {
    if (!dataset || dataset.length === 0) return;

    const rawTextQuery   = (textSearchInput?.value || "").trim();
    const rawGlobalQuery = (globalSearchInput?.value || "").trim();
    const textQuery      = rawTextQuery.toLowerCase();
    const globalQuery    = rawGlobalQuery.toLowerCase();
    const useRegexRaw    = regexCheckbox?.checked || false;

    const adaption = document.getElementById("filter-adaption")?.value || "";
    const figur    = document.getElementById("filter-figurtyp")?.value || "";
    const zeit     = document.getElementById("filter-zeit")?.value || "";
    const dialekt  = document.getElementById("filter-dialekt-grossraum")?.value || "";
    const herkunft = document.getElementById("filter-herkunft")?.value || "";

    // RegEx für Abschnittssuche vorbereiten
    let useRegex = useRegexRaw && rawTextQuery !== "";
    let regexForSearch = null;

    if (useRegex) {
      try {
        // Für die Trefferprüfung reicht /i
        regexForSearch = new RegExp(rawTextQuery, "i");
      } catch (e) {
        // Ungültiger RegEx -> wie normale Textsuche behandeln
        useRegex = false;
      }
    }

    const filtered = dataset.filter(entry => {
      // 1. Spezielle Suche im Abschnittstext (nur figurtext)
      const matchesTextQuery =
        textQuery === "" ||
        entry.abschnitt_segmentiert.some(seg => {
          if (seg.typ !== "figurtext") return false;
          const text = seg.text || "";

          if (useRegex && regexForSearch) {
            return regexForSearch.test(text);
          } else {
            return text.toLowerCase().includes(textQuery);
          }
        });

      // 2. Globale Suche in Metadaten (immer einfache Textsuche)
      const metaParts = [
        entry.id,
        entry.theaterstück?.titel,
        entry.theaterstück?.zeit,
        entry.theaterstück?.druckort,
        entry.theaterstück?.auffuehrungshinweise,
        entry.autor?.name,
        entry.autor?.herkunft,
        Array.isArray(entry.autor?.orte)
          ? entry.autor.orte.join(" ")
          : entry.autor?.orte,
        entry.autor?.lebensdaten,
        entry.figur?.name,
        entry.figur?.rolle,
        entry.figur?.beschreibung,
        entry.dialekt?.adaption,
        entry.dialekt?.dialekt_grossraum
      ];

      const metaText = metaParts
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesGlobalQuery =
        globalQuery === "" || metaText.includes(globalQuery);

      if (!matchesTextQuery || !matchesGlobalQuery) {
        return false;
      }

      const jahr     = parseInt(entry.theaterstück?.zeit);
      const zeitraum = get50JahresZeitraum(jahr);

      return (
        (adaption === "" || entry.dialekt?.adaption === adaption) &&
        (figur   === "" || entry.figur?.rolle === figur) &&
        (zeit    === "" || zeitraum === zeit) &&
        (dialekt === "" || entry.dialekt?.dialekt_grossraum === dialekt) &&
        (herkunft=== "" || entry.autor?.herkunft === herkunft)
      );
    });

    activeFilteredData = filtered;
    const highlightQuery = rawTextQuery || "";
    displayResults(filtered, highlightQuery, useRegex);
    scrollToHashIfPresent(); // falls mit #id gefiltert wurde
  }

  // ---------------- Anzeige der Ergebnisse ----------------

  function displayResults(data, query = "", useRegex = false) {
    const resultsContainer = document.getElementById("results");
    if (!resultsContainer) return;

    resultsContainer.innerHTML =
      data.length === 0 ? "<p>Keine Ergebnisse gefunden.</p>" : "";

    data.forEach(entry => {
      const item = document.createElement("div");
      item.className = "result-item";
      // ID für Ankerlinks (Karte)
      if (entry.id) {
        item.id = entry.id;
      }

      const figurtexte = entry.abschnitt_segmentiert
        ? entry.abschnitt_segmentiert.filter(s => s.typ === "figurtext")
        : [];

      const fullTextHTML = (entry.abschnitt_segmentiert || [])
        .filter(seg => kontextAnzeigen || seg.typ === "figurtext")
        .map(seg =>
          `<div class="${seg.typ === "kontext" ? "kontext" : "figurtext"}">
             ${highlightText(seg.text || "", query, useRegex)}
           </div>`
        )
        .join("");

      const preview = shortenToWords(
        figurtexte.map(s => s.text || "").join(" "),
        12
      );

      item.innerHTML = `
        <h3>${entry.theaterstück?.titel || "Ohne Titel"} (${entry.theaterstück?.zeit || "?"})</h3>
        <p><strong>Autor:</strong> ${entry.autor?.name || "?"} (${entry.autor?.lebensdaten || "?"})</p>
        <p><strong>Herkunft:</strong> ${entry.autor?.herkunft || "?"}</p>
        <p><strong>Figur:</strong> ${entry.figur?.name || "?"} (${entry.figur?.rolle || "?"})</p>
        <p><strong>Adaption:</strong> ${entry.dialekt?.adaption || "?"} (${entry.dialekt?.dialekt_grossraum || "?"})</p>
        <div class="abschnitt-preview figurtext">${preview}</div>
        <button class="toggle-abschnitt">Mehr</button>
        <div class="abschnitt-full hidden">${fullTextHTML}</div>
        <p><a href="${entry.original_link || "#"}" target="_blank">Quelle</a></p>
      `;

      resultsContainer.appendChild(item);

      const btn        = item.querySelector(".toggle-abschnitt");
      const full       = item.querySelector(".abschnitt-full");
      const previewBox = item.querySelector(".abschnitt-preview");

      if (btn && full && previewBox) {
        full.style.display = "none";
        btn.addEventListener("click", () => {
          const visible = full.style.display === "block";
          full.style.display      = visible ? "none"  : "block";
          previewBox.style.display = visible ? "block" : "none";
          btn.textContent         = visible ? "Mehr"  : "Weniger";
        });
      }
    });
  }

  // ---------------- Hilfsfunktionen ----------------

  function highlightText(text, query, useRegex = false) {
    if (!query) return text;

    if (useRegex) {
      try {
        const re = new RegExp(query, "gi");
        return text.replace(
          re,
          match => `<span class="highlight">${match}</span>`
        );
      } catch (e) {
        // Fallback auf normale Textsuche
      }
    }

    // Normaler Modus: Query als Literal (Sonderzeichen escapen)
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re   = new RegExp(safe, "gi");
    return text.replace(
      re,
      match => `<span class="highlight">${match}</span>`
    );
  }

  function shortenToWords(text, count) {
    const words = text.trim().split(/\s+/);
    if (!text.trim()) return "";
    return (
      words.slice(0, count).join(" ") +
      (words.length > count ? " ..." : "")
    );
  }

  function get50JahresZeitraum(jahr) {
    if (isNaN(jahr)) return "";
    const start = Math.floor(jahr / 50) * 50;
    return `${start}–${start + 49}`;
  }

  function populateDropdowns(data) {
    if (!data || data.length === 0) return;

    populate("filter-adaption",        data.map(d => d.dialekt?.adaption));
    populate("filter-figurtyp",        data.map(d => d.figur?.rolle));
    populate("filter-dialekt-grossraum",
             data.map(d => d.dialekt?.dialekt_grossraum));
    populate("filter-herkunft",        data.map(d => d.autor?.herkunft));

    const zeiten = [...new Set(
      data.map(d => get50JahresZeitraum(parseInt(d.theaterstück?.zeit)))
    )].filter(Boolean);

    populate("filter-zeit", zeiten);
  }

  function populate(id, values) {
    const el = document.getElementById(id);
    if (!el || !values) return;

    const unique = [...new Set(values.filter(Boolean))].sort();
    unique.forEach(val => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      el.appendChild(opt);
    });
    el.addEventListener("change", performSearch);
  }

  function exportToTSV() {
    const dataToExport =
      activeFilteredData && activeFilteredData.length > 0
        ? activeFilteredData
        : dataset;

    if (!dataToExport || dataToExport.length === 0) return;

    const headers = [
      "ID",
      "Titel",
      "Zeit",
      "Druckort",
      "Auffuehrung",
      "Autor",
      "Herkunft",
      "Orte",
      "Lebensdaten",
      "Figur",
      "Rolle",
      "Beschreibung",
      "Adaption",
      "Dialekt",
      "Koord_Autor",
      "Koord_Figur",
      "Abschnitt",
      "Figurtext",
      "Link"
    ];

    const tsv = [headers.join("\t")];

    dataToExport.forEach(entry => {
      const abschnittVolltext = (entry.abschnitt_segmentiert || [])
        .map(s =>
          (s.text || "")
            .replace(/\n/g, " ")
            .replace(/\t/g, " ")
        )
        .join(" ");

      const figurtext = (entry.abschnitt_segmentiert || [])
        .filter(s => s.typ === "figurtext")
        .map(s =>
          (s.text || "")
            .replace(/\n/g, " ")
            .replace(/\t/g, " ")
        )
        .join(" ");

      const row = [
        entry.id || "",
        entry.theaterstück?.titel || "",
        entry.theaterstück?.zeit || "",
        entry.theaterstück?.druckort || "",
        entry.theaterstück?.auffuehrungshinweise || "",
        entry.autor?.name || "",
        entry.autor?.herkunft || "",
        entry.autor?.orte || "",
        entry.autor?.lebensdaten || "",
        entry.figur?.name || "",
        entry.figur?.rolle || "",
        entry.figur?.beschreibung || "",
        entry.dialekt?.adaption || "",
        entry.dialekt?.dialekt_grossraum || "",
        entry.geokoordinaten?.herkunft_autor
          ? `${entry.geokoordinaten.herkunft_autor.lat}, ${entry.geokoordinaten.herkunft_autor.lng}`
          : "",
        entry.geokoordinaten?.herkunft_figur
          ? `${entry.geokoordinaten.herkunft_figur.lat}, ${entry.geokoordinaten.herkunft_figur.lng}`
          : "",
        abschnittVolltext,
        figurtext,
        entry.original_link || ""
      ].map(val =>
        (val ?? "")
          .toString()
          .replace(/\t/g, " ")
          .replace(/\n/g, " ")
          .trim()
      );

      tsv.push(row.join("\t"));
    });

    const blob = new Blob(["\uFEFF" + tsv.join("\n")], {
      type: "text/tab-separated-values;charset=utf-8;"
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "AdViD_Datenbank_Export.tsv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Scrollt bei vorhandener URL mit #id zum passenden Eintrag
  function scrollToHashIfPresent() {
    if (!window.location.hash) return;
    const targetId = window.location.hash.substring(1);
    if (!targetId) return;

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("highlight-entry"); // optional: in CSS gestalten
    }
  }
});
