// Small magic effect on click
document.querySelectorAll(".person").forEach(person => {
    person.addEventListener("click", () => {
        person.style.transform = "scale(1.15)";
        setTimeout(() => {
            person.style.transform = "";
        }, 300);
    });
});
