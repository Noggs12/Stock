// Estado en memoria
let products = [];
let idCounter = 1;
const STORAGE_KEY = "gestion_productos_lista";

const formatCurrency = (value) =>
  `${value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

const getForm = () => document.getElementById("product-form");
const getBody = () => document.getElementById("products-body");

const selectors = {
  totalUnitsSold: () => document.getElementById("total-units-sold"),
  totalUnitsRemaining: () => document.getElementById("total-units-remaining"),
  totalCostSold: () => document.getElementById("total-cost-sold"),
  totalCostRemaining: () => document.getElementById("total-cost-remaining"),
  totalRevenueSold: () => document.getElementById("total-revenue-sold"),
  totalRevenueRemaining: () =>
    document.getElementById("total-revenue-remaining"),
  totalProfit: () => document.getElementById("total-profit"),
};

function saveToStorage() {
  try {
    const payload = {
      products,
      idCounter,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error("No se pudo guardar en localStorage", e);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.products)) return;
    products = parsed.products;
    idCounter = typeof parsed.idCounter === "number" ? parsed.idCounter : 1;
  } catch (e) {
    console.error("No se pudo leer desde localStorage", e);
  }
}

function addProductFromForm(event) {
  event.preventDefault();
  const form = getForm();
  const formData = new FormData(form);

  const name = (formData.get("name") || "").toString().trim();
  const costPrice = parseFloat(formData.get("costPrice"));
  const salePrice = parseFloat(formData.get("salePrice"));
  const stock = parseInt(formData.get("stock"), 10);
  const sold = parseInt(formData.get("sold"), 10);

  if (!name) return;
  if (Number.isNaN(costPrice) || Number.isNaN(salePrice)) return;
  if (Number.isNaN(stock) || Number.isNaN(sold)) return;
  if (sold > stock) {
    alert("Las unidades vendidas no pueden ser mayores que el stock.");
    return;
  }

  products.push({
    id: idCounter++,
    name,
    costPrice,
    salePrice,
    stock,
    sold,
  });

  form.reset();
  renderProducts();
  renderSummary();
  saveToStorage();
}

function removeProduct(id) {
  products = products.filter((p) => p.id !== id);
  renderProducts();
  renderSummary();
  saveToStorage();
}

function updateSold(id, delta) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  const nextSold = product.sold + delta;
  if (nextSold < 0) return;
  if (nextSold > product.stock) {
    alert("No puedes vender más unidades que las que hay en stock.");
    return;
  }

  product.sold = nextSold;
  renderProducts();
  renderSummary();
  saveToStorage();
}

function clearProducts() {
  if (!products.length) return;
  const ok = confirm("¿Seguro que quieres vaciar toda la lista de productos?");
  if (!ok) return;
  products = [];
  renderProducts();
  renderSummary();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("No se pudo limpiar localStorage", e);
  }
}

function renderProducts() {
  const body = getBody();
  body.innerHTML = "";

  products.forEach((p) => {
    const remaining = p.stock - p.sold;
    const revenueSold = p.sold * p.salePrice;
    const revenueRemaining = remaining * p.salePrice;
    const costSold = p.sold * p.costPrice;
    const costRemaining = remaining * p.costPrice;
    const profit = revenueSold + revenueRemaining - (costSold + costRemaining);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="cell-name" data-label="Producto">${p.name}</td>
      <td class="cell-number" data-label="Coste">${formatCurrency(
        p.costPrice
      )}</td>
      <td class="cell-number" data-label="Venta">${formatCurrency(
        p.salePrice
      )}</td>
      <td class="cell-number" data-label="Stock">${p.stock}</td>
      <td class="cell-number" data-label="Vendidas">
        <div class="sold-controls">
          <button class="btn-icon" data-action="decrease">−</button>
          <span>${p.sold}</span>
          <button class="btn-icon" data-action="increase">+</button>
        </div>
      </td>
      <td class="cell-number" data-label="Por vender">${remaining}</td>
      <td class="cell-number" data-label="Ingresos vendidos">${formatCurrency(
        revenueSold
      )}</td>
      <td class="cell-number" data-label="Ingresos pendientes">${formatCurrency(
        revenueRemaining
      )}</td>
      <td class="cell-number" data-label="Beneficio total">${formatCurrency(
        profit
      )}</td>
      <td class="cell-number" data-label="Acciones">
        <button class="btn-icon danger" data-action="delete">✕</button>
      </td>
    `;

    const decreaseBtn = tr.querySelector('[data-action="decrease"]');
    const increaseBtn = tr.querySelector('[data-action="increase"]');
    const deleteBtn = tr.querySelector('[data-action="delete"]');

    decreaseBtn.addEventListener("click", () => updateSold(p.id, -1));
    increaseBtn.addEventListener("click", () => updateSold(p.id, 1));
    deleteBtn.addEventListener("click", () => removeProduct(p.id));

    body.appendChild(tr);
  });
}

function renderSummary() {
  let totalUnitsSold = 0;
  let totalUnitsRemaining = 0;
  let totalCostSold = 0;
  let totalCostRemaining = 0;
  let totalRevenueSold = 0;
  let totalRevenueRemaining = 0;

  products.forEach((p) => {
    const remaining = p.stock - p.sold;

    totalUnitsSold += p.sold;
    totalUnitsRemaining += remaining;

    totalCostSold += p.sold * p.costPrice;
    totalCostRemaining += remaining * p.costPrice;

    totalRevenueSold += p.sold * p.salePrice;
    totalRevenueRemaining += remaining * p.salePrice;
  });

  const totalProfit =
    totalRevenueSold + totalRevenueRemaining - (totalCostSold + totalCostRemaining);

  selectors.totalUnitsSold().textContent = totalUnitsSold.toString();
  selectors.totalUnitsRemaining().textContent =
    totalUnitsRemaining.toString();
  selectors.totalCostSold().textContent = formatCurrency(totalCostSold);
  selectors.totalCostRemaining().textContent =
    formatCurrency(totalCostRemaining);
  selectors.totalRevenueSold().textContent =
    formatCurrency(totalRevenueSold);
  selectors.totalRevenueRemaining().textContent =
    formatCurrency(totalRevenueRemaining);
  selectors.totalProfit().textContent = formatCurrency(totalProfit);
}

function init() {
  loadFromStorage();

  const form = getForm();
  form.addEventListener("submit", addProductFromForm);

  const clearButton = document.getElementById("clear-products");
  clearButton.addEventListener("click", clearProducts);

  renderProducts();
  renderSummary();
}

window.addEventListener("DOMContentLoaded", init);


