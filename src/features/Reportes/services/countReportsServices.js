export async function obtenerTotalReport() {
  try {
    const respuesta = await fetch('http://107.22.248.129:7001/reportes/total');
    
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    
    const datos = await respuesta.json();
    
    // Asumiendo que la respuesta es un objeto con una propiedad "total"
    if (typeof datos.total !== 'undefined') {
      return datos.total;
    } else {
      throw new Error('La respuesta no contiene la propiedad "total"');
    }
  } catch (error) {
    console.error('Error al obtener el total:', error);
    // Puedes manejar el error como prefieras o relanzarlo
    throw error;
  }
}