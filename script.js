const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTp1LlW5tsWIyE7E5BGFiKHS2qBjzh8wGaZdR3EsQSzXVyxgq1hrh4y54KpkVHiL-4Moux0CA43c4nb/pub?output=csv";
const IMAGE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTp1LlW5tsWIyE7E5BGFiKHS2qBjzh8wGaZdR3EsQSzXVyxgq1hrh4y54KpkVHiL-4Moux0CA43c4nb/pub?gid=676833393&single=true&output=csv";

let imageMap = {};

Promise.all([
  fetch(DATA_URL).then(res => res.text()),
  fetch(IMAGE_URL).then(res => res.text())
])
.then(([dataText, imageText]) => {
  const dataParsed = Papa.parse(dataText, { header: true }).data;
  const imageParsed = Papa.parse(imageText, { header: true }).data;

  const filteredData = dataParsed.filter(row => row["Item Code"] && row["Variant Code"]);
  imageParsed.forEach(row => {
    if (row["Item Code"] && row["Image URL"]) {
      imageMap[row["Item Code"]] = row["Image URL"];
    }
  });

  renderCatalogue(filteredData);
})
.catch(err => {
  document.getElementById("catalogue").innerHTML = "<p>❌ Failed to load data.</p>";
});

function renderCatalogue(data) {
  const container = document.getElementById("catalogue");
  const categorySelect = document.getElementById("categorySelect");
  const categories = [...new Set(data.map(item => item["Category"]))];

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  categorySelect.addEventListener("change", () => {
    const selected = categorySelect.value;
    const filtered = data.filter(row => row["Category"] === selected);
    const itemsGrouped = groupBy(filtered, "Item Code");

    container.innerHTML = "";

const categoryWrapper = document.createElement("div");
categoryWrapper.id = "category-section"; // PDF target

const downloadBtn = document.createElement("button");
downloadBtn.textContent = "Download as PDF";
downloadBtn.className = "download-btn";
downloadBtn.onclick = () => downloadPDF("category-section", `${selected}.pdf`);

container.appendChild(downloadBtn);
container.appendChild(categoryWrapper);


    Object.entries(itemsGrouped).forEach(([itemCode, entries]) => {
      const block = document.createElement("div");
      block.className = "item-block";

      const img = document.createElement("img");
      img.src = imageMap[itemCode] || "default.jpg";
      img.alt = itemCode;
      img.className = "item-image";

      const name = entries[0]["Item Name"];
      const specs = entries[0]["Specs"];

block.innerHTML += `
  <div class="item-header">
    <div class="item-meta">
      <span><strong>Item Code:</strong> ${entries[0]["Item Code"]}</span>
      <span><strong>HSN Code:</strong> ${entries[0]["HSN Code"]}</span>
    </div>
    <div class="item-name">${name}</div>
  </div>
`;
      block.appendChild(img);
      block.innerHTML += `<p><em>${specs}</em></p>`;

      const table = document.createElement("table");
table.innerHTML = `
  <tr>
    <th>Variant Code</th>
    <th>Description</th>
    <th>Price/Unit</th>
    <th>Unit</th>
    <th>MOQ</th>
    <th>WhatsApp</th>
  </tr>
`;

      entries.forEach(entry => {
        const msg = encodeURIComponent(
          `Hi, I’m interested in this tool:\nItem: ${name}\nVariant Code: ${entry["Variant Code"]}\nDescription: ${entry["Description"]}\nPrice: ${entry["Price/Unit"]}`
        );

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${entry["Variant Code"]}</td>
          <td>${entry["Description"]}</td>
          <td>${entry["Price/Unit"]}</td>
          <td>${entry["Unit"]}</td>
	  <td>${entry["MOQ"]}</td>
          <td><a target="_blank" href="https://wa.me/917986297302?text=${msg}"><i class="fab fa-whatsapp"></i>WhatsApp</a></td>
        `;
        table.appendChild(tr);
      });

      block.appendChild(table);
      categoryWrapper.appendChild(block);

    });
  });
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const value = item[key];
    if (!result[value]) result[value] = [];
    result[value].push(item);
    return result;
  }, {});
}

function downloadPDF(categoryId, filename) {
  const source = document.getElementById(categoryId);
  const items = Array.from(source.querySelectorAll(".item-block"));
  if (items.length === 0) return;

  const printableContainer = document.createElement("div");
  printableContainer.style.width = "210mm";
  printableContainer.style.minHeight = "297mm";
  printableContainer.style.padding = "10mm";
  printableContainer.style.boxSizing = "border-box";
  printableContainer.style.background = "white";
  printableContainer.style.display = "flex";
  printableContainer.style.flexDirection = "column";
  printableContainer.style.gap = "10mm";
  printableContainer.style.position = "fixed";
  printableContainer.style.top = "-9999px";
  printableContainer.id = "printable-grid";
  document.body.appendChild(printableContainer);

  for (let i = 0; i < items.length; i += 2) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.gap = "10mm";
    row.style.pageBreakInside = "avoid";

    for (let j = 0; j < 2 && (i + j) < items.length; j++) {
      const original = items[i + j];
      const clone = original.cloneNode(true);

      clone.style.flex = "1";
      clone.style.boxSizing = "border-box";
      clone.style.border = "1px solid #ccc";
      clone.style.borderRadius = "6px";
      clone.style.padding = "6mm";
      clone.style.fontSize = "9pt";
      clone.style.background = "white";
      clone.style.display = "flex";
      clone.style.flexDirection = "column";
      clone.style.justifyContent = "flex-start";
      clone.style.alignItems = "center";

      const img = clone.querySelector("img");
      if (img) {
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.objectFit = "contain";
      }

      row.appendChild(clone);
    }

    printableContainer.appendChild(row);
  }

  // Show container temporarily for rendering
  printableContainer.style.display = "block";

  // Wait for all images to load
  const images = printableContainer.querySelectorAll("img");
  const imagePromises = Array.from(images).map(img =>
    new Promise(resolve => {
      if (img.complete) resolve();
      else img.onload = img.onerror = () => resolve();
    })
  );

  Promise.all(imagePromises).then(() => {
    // Get full content height in pixels
    const contentHeight = printableContainer.offsetHeight;
    const a4HeightPx = 1122; // approx A4 @ 96dpi (html2canvas scale=1)

    // Determine scale factor to fit height into A4
    const scaleFactor = a4HeightPx / contentHeight;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2 * scaleFactor, // scale down to fit height
        useCORS: true,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printableContainer).save().then(() => {
      document.body.removeChild(printableContainer);
    });
  });
}
