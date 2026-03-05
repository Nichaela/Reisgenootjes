const filterButtons = document.querySelectorAll(".filter-btn");
const toggleButton = document.getElementById("toggleFilter");
const filterMenu = document.getElementById("filterMenu");
const closeButton = document.getElementById("closeMenu");
const items = document.querySelectorAll(".all li");

// Open menu
toggleButton.addEventListener("click", () => {
  filterMenu.classList.add("show");
  toggleButton.style.display = "none";
});

// Close menu
closeButton.addEventListener("click", () => {
  filterMenu.classList.remove("show");
  toggleButton.style.display = "block";
});

// Filter knoppen
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    btn.classList.toggle("active");
    const filter = btn.dataset.gender;

    items.forEach(item => {

      const gender = item.dataset.gender;

      if (filter === "all" || gender === filter) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }

    });

  });
});