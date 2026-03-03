const ul = document.querySelector("ul"); // je lijst
const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    ul.className = "";        // verwijder oude filter
    ul.classList.add(filter); // voeg nieuwe filter toe
  });
});