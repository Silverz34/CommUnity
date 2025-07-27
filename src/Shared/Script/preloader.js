window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    // Ocultar preloader con transición suave
    preloader.style.opacity = '0';
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 500); // Tiempo igual a la transición CSS (0.5s)
});

