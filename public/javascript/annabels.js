const filterButtons = document.querySelectorAll(".filter-btn");
const toggleButton = document.getElementById("toggleFilter");
const filterMenu = document.getElementById("filterMenu");
const closeButton = document.getElementById("closeMenu");
const items = document.querySelectorAll(".all li");

let activeFilters = new Set();

// Open/close menu
toggleButton.addEventListener("click", () => {
  filterMenu.classList.add("show");
  toggleButton.style.display = "none";
});
closeButton.addEventListener("click", () => {
  filterMenu.classList.remove("show");
  toggleButton.style.display = "block";
});

// Filter functionaliteit
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.gender;

    if (filter === "all") {
      if (activeFilters.size === 0) {
        // Alles tonen
        items.forEach(item => item.style.display = "block");
        btn.classList.add("active");
      } else {
        // Alles deselecteren
        activeFilters.clear();
        items.forEach(item => item.style.display = "none");
        btn.classList.remove("active");
      }
      // haal active van andere knoppen
      filterButtons.forEach(b => {
        if (b.dataset.gender !== "all") b.classList.remove("active");
      });
      return;
    }

    // Toggle actieve filter
    if (activeFilters.has(filter)) {
      activeFilters.delete(filter);
      btn.classList.remove("active");
    } else {
      activeFilters.add(filter);
      btn.classList.add("active");
    }

    // Schakel "Alles" knop uit als andere filters actief zijn
    const allBtn = document.querySelector('[data-gender="all"]');
    allBtn.classList.remove("active");

    // Toon/verberg items
    items.forEach(item => {
      item.style.display = (activeFilters.size === 0 || activeFilters.has(item.dataset.gender)) ? "block" : "none";
    });
  });
});