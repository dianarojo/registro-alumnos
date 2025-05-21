document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('alumno-form');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const formTitle = document.getElementById('form-title');
    const alumnosBody = document.getElementById('alumnos-body');
    const alumnoIdInput = document.getElementById('alumno-id');
    
    let editingId = null;
    
    // Cargar alumnos al iniciar
    fetchAlumnos();
    
    // Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const alumno = {
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            edad: parseInt(document.getElementById('edad').value),
            email: document.getElementById('email').value,
            carrera: document.getElementById('carrera').value
        };
        
        try {
            if (editingId) {
                // Actualizar alumno existente
                await updateAlumno(editingId, alumno);
                showAlert('Alumno actualizado correctamente', 'success');
            } else {
                // Crear nuevo alumno
                await createAlumno(alumno);
                showAlert('Alumno creado correctamente', 'success');
            }
            
            resetForm();
            fetchAlumnos();
        } catch (error) {
            console.error('Error:', error);
            showAlert(`Error al guardar: ${error.message}`, 'error');
        }
    });
    
    // Manejar cancelar edición
    cancelBtn.addEventListener('click', () => {
        resetForm();
    });
    
    // Función para mostrar alertas
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.textContent = message;
        
        document.body.prepend(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
    
    // Función para cargar alumnos
    async function fetchAlumnos() {
        try {
            const response = await fetch('/api/alumnos');
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const alumnos = await response.json();
            
            if (alumnos.length === 0) {
                alumnosBody.innerHTML = '<tr><td colspan="7">No hay alumnos registrados</td></tr>';
                return;
            }
            
            renderAlumnosTable(alumnos);
        } catch (error) {
            console.error('Error al cargar alumnos:', error);
            alumnosBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        Error al cargar los alumnos: ${error.message}
                        <button onclick="location.reload()">Reintentar</button>
                    </td>
                </tr>
            `;
        }
    }
    
    // Función auxiliar para renderizar la tabla
    function renderAlumnosTable(alumnos) {
        alumnosBody.innerHTML = alumnos.map(alumno => `
            <tr>
                <td>${alumno.id}</td>
                <td>${alumno.nombre}</td>
                <td>${alumno.apellido}</td>
                <td>${alumno.edad}</td>
                <td>${alumno.email}</td>
                <td>${alumno.carrera}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${alumno.id}">Editar</button>
                    <button class="action-btn delete-btn" data-id="${alumno.id}">Eliminar</button>
                </td>
            </tr>
        `).join('');
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editAlumno(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteAlumno(btn.dataset.id));
        });
    }
    
    // Función para crear un nuevo alumno
    async function createAlumno(alumno) {
        const response = await fetch('/api/alumnos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alumno),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear alumno');
        }
    }
    
    // Función para actualizar un alumno
    async function updateAlumno(id, alumno) {
        const response = await fetch(`/api/alumnos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alumno),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar alumno');
        }
    }
    
    // Función para eliminar un alumno
    async function deleteAlumno(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este alumno?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/alumnos/${id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar alumno');
            }
            
            showAlert('Alumno eliminado correctamente', 'success');
            fetchAlumnos();
        } catch (error) {
            console.error('Error:', error);
            showAlert(`Error al eliminar: ${error.message}`, 'error');
        }
    }
    
    // Función para editar un alumno
    async function editAlumno(id) {
        try {
            const response = await fetch(`/api/alumnos/${id}`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const alumno = await response.json();
            
            editingId = alumno.id;
            alumnoIdInput.value = alumno.id;
            document.getElementById('nombre').value = alumno.nombre;
            document.getElementById('apellido').value = alumno.apellido;
            document.getElementById('edad').value = alumno.edad;
            document.getElementById('email').value = alumno.email;
            document.getElementById('carrera').value = alumno.carrera;
            
            formTitle.textContent = 'Editar Alumno';
            submitBtn.textContent = 'Actualizar';
            cancelBtn.style.display = 'inline-block';
            
            // Scroll al formulario
            document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error al cargar alumno para editar:', error);
            showAlert(`Error al cargar alumno: ${error.message}`, 'error');
        }
    }
    
    // Función para resetear el formulario
    function resetForm() {
        form.reset();
        editingId = null;
        alumnoIdInput.value = '';
        formTitle.textContent = 'Agregar Nuevo Alumno';
        submitBtn.textContent = 'Guardar';
        cancelBtn.style.display = 'none';
    }
});