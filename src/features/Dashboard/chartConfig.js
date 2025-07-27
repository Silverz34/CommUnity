let reportesChart;
let intervaloRefresco;

function inicializarGrafica() {
    const ctx = document.getElementById('reportesChart').getContext('2d');
    reportesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Reportes por categoría',
                data: [],
                backgroundColor: [
                    'rgba(28, 161, 193, 0.8)',
                    'rgba(247, 184, 1, 0.8)',
                    'rgba(89, 108, 255, 0.8)',
                    'rgba(77, 215, 167, 0.8)',
                    'rgba(160, 221, 159, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(28, 161, 193, 1)',
                    'rgba(247, 184, 1, 1)',
                    'rgba(89, 108, 255, 1)',
                    'rgba(77, 215, 167, 1)',
                    'rgba(160, 221, 159, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function cargarDatos() {
    try {
        const response = await fetch('http://107.22.248.129:7001/estadisticas/por-tipo');
        
        if (!response.ok) {
            throw new Error('Fallo al obtener datos de la gráfica');
        }

        const datosGrafica = await response.json();

        // Extraer categorías y cantidades del endpoint
        const categorias = datosGrafica.map(item => item.tipo);
        const cantidades = datosGrafica.map(item => item.cantidad);

        // Actualizar gráfica
        reportesChart.data.labels = categorias;
        reportesChart.data.datasets[0].data = cantidades;
        reportesChart.update();

        console.log('Datos de la gráfica actualizados:', { categorias, cantidades });

    } catch (error) {
        console.error('Error al cargar datos:', error.message);
        alert(`Ocurrió un error al cargar los datos: ${error.message}`);
    }
}

function iniciarAutoRefresco() {
    intervaloRefresco = setInterval(cargarDatos, 600000); // 10 minutos
}

function detenerAutoRefresco() {
    if (intervaloRefresco) {
        clearInterval(intervaloRefresco);
        intervaloRefresco = null;
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    inicializarGrafica();
    cargarDatos();
    iniciarAutoRefresco();
});

// Limpiar intervalo al cerrar la página
window.addEventListener('beforeunload', () => {
    detenerAutoRefresco();
});