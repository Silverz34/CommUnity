document.addEventListener('DOMContentLoaded', () => {
    fetch('http://107.22.248.129:7001/reportes/total')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Total de reportes recibido:', data);

            // Asegúrate que la respuesta tenga una propiedad 'total'
            const total = data.total !== undefined ? data.total : 'No disponible';
            document.getElementById('total-reportes').textContent = total;
        })
        .catch(error => {
            console.error('Error al obtener el total de reportes:', error);
            document.getElementById('total-reportes').textContent = 'Error';
        });
});


document.addEventListener('DOMContentLoaded', () => {
    fetch('http://107.22.248.129:7001/reportes/resueltos/total')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Total de reportes resueltos recibido:', data);

            // Verifica y asigna el valor recibido
            const resueltos = data.resueltos !== undefined ? data.resueltos : 'No disponible';

            // Muestra el total de reportes resueltos en el HTML
            document.getElementById('reportes-atendidos').textContent = resueltos;
        })
        .catch(error => {
            console.error('Error al obtener el total de reportes resueltos:', error);
            document.getElementById('reportes-atendidos').textContent = 'Error';
        });
});


document.addEventListener('DOMContentLoaded', async () => {
  const tiempoElemento = document.getElementById('tiempo-resolver');

  try {
    const response = await fetch('http://107.22.248.129:7001/reportes/tiempo-promedio');
    
    if (!response.ok) {
      throw new Error(`Error al obtener el tiempo promedio: ${response.status}`);
    }

    const data = await response.json();
    const promedioHoras = data.promedio_horas;

    // Limitar a 2 decimales
    const promedioFormateado = parseFloat(promedioHoras).toFixed(0);
    
    tiempoElemento.textContent = `${promedioFormateado} horas`;
  } catch (error) {
    console.error('Error al obtener el tiempo promedio:', error);
    tiempoElemento.textContent = 'No disponible';
  }
});