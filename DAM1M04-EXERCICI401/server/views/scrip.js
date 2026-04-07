document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {

        // Quitar active de todas las pestañas
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

        // Activar la pestaña clicada
        tab.classList.add("active");

        // Activar el contenido correspondiente
        const tabId = tab.getAttribute("data-tab");
        document.getElementById(tabId).classList.add("active");
    });
});