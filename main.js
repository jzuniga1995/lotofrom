// ============================================
// CONFIGURACIÓN
// ============================================

const JSON_URL = '/api/resultados-v2';
const DATOS_EMBEBIDOS = null;

// ============================================
// DETECTAR TIPO DE PÁGINA
// ============================================

function obtenerTipoJuego() {
    const path = window.location.pathname.toLowerCase();
    
    // Mapeo de URLs a tipos de juego
    const mapeo = {
        'juga-3': 'juga3',
        'juga3': 'juga3',
        'pega-3': 'pega3',
        'pega3': 'pega3',
        'premia-2': 'premia2',
        'premia2': 'premia2',
        'la-diaria': 'diaria',
        'diaria': 'diaria',
        'loto-super-premio': 'super',
        'super-premio': 'super',
        'superpremio': 'super'
    };
    
    // Buscar coincidencia en el path
    for (const [key, value] of Object.entries(mapeo)) {
        if (path.includes(key)) {
            return value;
        }
    }
    
    return 'todos'; // Página principal - mostrar todos
}

// ============================================
// RELOJ HONDURAS
// ============================================

function actualizarReloj() {
    const ahora = new Date();
    
    // Honduras está en UTC-6 (CST - Central Standard Time)
    const offsetHonduras = -6;
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    const horaHonduras = new Date(utc + (3600000 * offsetHonduras));
    
    const horas = String(horaHonduras.getHours()).padStart(2, '0');
    const minutos = String(horaHonduras.getMinutes()).padStart(2, '0');
    const segundos = String(horaHonduras.getSeconds()).padStart(2, '0');
    
    const relojElement = document.getElementById('relojHonduras');
    if (relojElement) {
        relojElement.textContent = `${horas}:${minutos}:${segundos}`;
    }
}

// Actualizar reloj cada segundo
setInterval(actualizarReloj, 1000);
actualizarReloj();

// ============================================
// UTILIDADES
// ============================================

function formatearFecha() {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fecha = new Date();
    return `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

// Nueva función para agregar año a la fecha del sorteo
function formatearFechaSorteo(fechaSorteo) {
    // Si la fecha ya tiene año (DD-MM-YYYY), retornarla tal cual
    if (fechaSorteo && fechaSorteo.split('-').length === 3) {
        return fechaSorteo;
    }
    
    // Extraer día y mes
    const [dia, mes] = fechaSorteo.split('-').map(Number);
    
    // Obtener fecha actual
    const ahora = new Date();
    const yearActual = ahora.getFullYear();
    const mesActual = ahora.getMonth() + 1; // 0-11 -> 1-12
    const diaActual = ahora.getDate();
    
    // Si el mes es menor al actual, o es el mismo mes pero el día es menor,
    // entonces es del año actual. Si no, es del año pasado.
    let year = yearActual;
    
    if (mes < mesActual || (mes === mesActual && dia < diaActual)) {
        year = yearActual; // Fecha en el pasado de este año
    } else if (mes > mesActual || (mes === mesActual && dia > diaActual)) {
        year = yearActual - 1; // Fecha del año pasado
    }
    
    return `${fechaSorteo}-${year}`;
}

// ============================================
// FILTRAR SORTEOS POR TIPO
// ============================================

function filtrarSorteos(sorteos, tipoJuego) {
    if (tipoJuego === 'todos') {
        return sorteos;
    }
    
    const filtrados = {};
    
    for (const [key, value] of Object.entries(sorteos)) {
        const keyLower = key.toLowerCase();
        
        // Coincidencia exacta del tipo de juego
        if (keyLower.includes(tipoJuego)) {
            filtrados[key] = value;
        }
    }
    
    return filtrados;
}

// ============================================
// AGRUPAR SORTEOS POR HORARIO (NUEVA)
// ============================================

function agruparPorHorario(sorteos) {
    const grupos = {
        '11:00 AM': [],
        '3:00 PM': [],
        '9:00 PM': [],
        'super': [] // Grupo especial para Súper Premio
    };
    
    const mapeoHoras = {
        '11:00 AM': '11:00 AM',
        '10:00 AM': '11:00 AM',
        '3:00 PM': '3:00 PM',
        '2:00 PM': '3:00 PM',
        '15:00': '3:00 PM',
        '9:00 PM': '9:00 PM',
        '21:00': '9:00 PM'
    };
    
    sorteos.forEach(([key, datos]) => {
        const keyLower = key.toLowerCase();
        
        // Si es Súper Premio, va al grupo especial
        if (keyLower.includes('super')) {
            grupos['super'].push([key, datos]);
        } else {
            const horaOriginal = datos.hora_sorteo;
            const horaNormalizada = mapeoHoras[horaOriginal];
            
            if (horaNormalizada && grupos[horaNormalizada]) {
                grupos[horaNormalizada].push([key, datos]);
            }
        }
    });
    
    // Ordenar dentro de cada grupo por tipo de juego
    const ordenJuegos = ['juga3', 'pega3', 'premia2', 'diaria', 'super'];
    
    Object.keys(grupos).forEach(hora => {
        grupos[hora].sort((a, b) => {
            const keyA = a[0].toLowerCase();
            const keyB = b[0].toLowerCase();
            
            const tipoA = ordenJuegos.findIndex(tipo => keyA.includes(tipo));
            const tipoB = ordenJuegos.findIndex(tipo => keyB.includes(tipo));
            
            return tipoA - tipoB;
        });
    });
    
    return grupos;
}

// ============================================
// CREAR CARDS DE JUEGOS (ACTUALIZADO CON ICONOS)
// ============================================

function crearCardJuego(key, datos) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    // Limpiar nombre del juego
    let nombreLimpio = datos.nombre_juego;
    const nombreBase = nombreLimpio.replace(/\s*(11:00 AM|3:00 PM|9:00 PM|10:00 AM|2:00 PM)/gi, '').trim();
    
    // Logo del juego
    const logoHTML = datos.logo_url ? 
        `<img src="${datos.logo_url}" alt="${nombreBase}" class="game-logo" onerror="this.style.display='none'">` : 
        '';
    
    let contenidoPrincipal = '';
    
    // Detectar tipo de juego
    if (key.includes('juga3')) {
        // Jugá 3 - Solo bolas con título
        contenidoPrincipal = datos.numero_ganador ? `
            <div class="juga3-numero">
                <div class="numeros-titulo">NÚMEROS GANADORES</div>
                <div class="numeros-individuales">
                    ${datos.numeros_individuales.map((num, index) => 
                        `<div class="bola" style="animation-delay: ${index * 0.1}s">${num}</div>`
                    ).join('')}
                </div>
            </div>
        ` : `<div class="pendiente"><i data-lucide="clock" class="w-5 h-5 inline-block mr-2"></i>Pendiente</div>`;
    } else {
        // Otros juegos - Múltiples números en bolas
        if (datos.numeros_adicionales && datos.numeros_adicionales.length > 0) {
            let titulo = 'NÚMEROS GANADORES';
            if (key.includes('diaria')) titulo = 'NÚMERO · SIGNO · MULTIPLICADOR';
            
            contenidoPrincipal = `
                <div class="numeros-container">
                    <div class="numeros-titulo">${titulo}</div>
                    <div class="numeros-grid">
                        ${datos.numeros_adicionales.map((num, index) => {
                            const esTexto = isNaN(num);
                            return `<div class="bola ${esTexto ? 'texto' : ''}" style="animation-delay: ${index * 0.1}s">${num}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            contenidoPrincipal = `<div class="pendiente"><i data-lucide="clock" class="w-5 h-5 inline-block mr-2"></i>Pendiente</div>`;
        }
    }

    // Formatear la fecha con año
    const fechaConAnio = formatearFechaSorteo(datos.fecha_sorteo);

    card.innerHTML = `
        <div class="game-header">
            <div class="game-title-row">
                <div class="game-name">${nombreBase}</div>
                ${logoHTML}
            </div>
            <div class="game-meta">
                <div class="game-date"><i data-lucide="calendar" class="w-4 h-4 inline-block mr-1"></i>${fechaConAnio}</div>
                ${datos.hora_sorteo ? `<div class="game-time"><i data-lucide="clock" class="w-4 h-4 inline-block mr-1"></i>${datos.hora_sorteo}</div>` : ''}
            </div>
        </div>
        
        ${contenidoPrincipal}
        
        ${!datos.numero_ganador && (!datos.numeros_adicionales || datos.numeros_adicionales.length === 0) ? `
            <div style="text-align:center;">
                <span class="estado-badge"><i data-lucide="clock" class="w-4 h-4 inline-block mr-1"></i>Próximamente</span>
            </div>
        ` : ''}
    `;
    
    return card;
}

// ============================================
// ORDENAR SORTEOS
// ============================================

function ordenarPorFechaYHora(sorteos) {
    const ordenHoras = {
        '11:00 AM': 1, '10:00 AM': 1,
        '3:00 PM': 2, '2:00 PM': 2, '15:00': 2,
        '9:00 PM': 3, '21:00': 3
    };

    return Object.entries(sorteos).sort((a, b) => {
        const [keyA, datosA] = a;
        const [keyB, datosB] = b;
        
        // Comparar fechas (formato DD-MM o DD-MM-YYYY)
        const partesA = datosA.fecha_sorteo.split('-').map(Number);
        const partesB = datosB.fecha_sorteo.split('-').map(Number);
        
        const diaA = partesA[0];
        const mesA = partesA[1];
        const yearA = partesA[2] || new Date().getFullYear();
        
        const diaB = partesB[0];
        const mesB = partesB[1];
        const yearB = partesB[2] || new Date().getFullYear();
        
        // Ordenar por año, mes y día (más reciente primero)
        if (yearA !== yearB) return yearB - yearA;
        if (mesA !== mesB) return mesB - mesA;
        if (diaA !== diaB) return diaB - diaA;
        
        // Misma fecha, ordenar por hora
        const horaA = ordenHoras[datosA.hora_sorteo] || 0;
        const horaB = ordenHoras[datosB.hora_sorteo] || 0;
        
        if (horaA !== horaB) return horaA - horaB;
        
        // Mismo horario, ordenar por tipo de juego
        const ordenJuegos = ['juga3', 'pega3', 'premia2', 'diaria', 'super'];
        const tipoA = ordenJuegos.findIndex(tipo => keyA.includes(tipo));
        const tipoB = ordenJuegos.findIndex(tipo => keyB.includes(tipo));
        
        return tipoA - tipoB;
    });
}

// ============================================
// CARGAR RESULTADOS (ACTUALIZADO CON ICONOS)
// ============================================

async function cargarResultados() {
    try {
        let data;
        
        if (DATOS_EMBEBIDOS) {
            data = DATOS_EMBEBIDOS;
        } else {
            // AGREGAR TIMESTAMP PARA EVITAR CACHÉ
            const urlSinCache = `${JSON_URL}?t=${Date.now()}`;
            
            const response = await fetch(urlSinCache, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error('No se pudieron cargar los resultados. Por favor, intenta de nuevo más tarde.');
            }
            
            data = await response.json();
        }
        
        // Actualizar fecha en el DOM
        const fechaElement = document.getElementById('fechaActual');
        if (fechaElement) {
            const span = fechaElement.querySelector('span');
            if (span) {
                span.textContent = formatearFecha();
            }
        }
        
        // Actualizar última actualización
        if (data.fecha_actualizacion) {
            const actualizacionElement = document.getElementById('ultimaActualizacion');
            if (actualizacionElement) {
                actualizacionElement.textContent = data.fecha_actualizacion;
            }
        }
        
        const contenido = document.getElementById('contenido');
        if (!contenido) {
            console.error('Elemento #contenido no encontrado');
            return;
        }
        
        const sorteos = data.sorteos || data;
        
        // **FILTRAR según el tipo de página**
        const tipoJuego = obtenerTipoJuego();
        const sorteosFiltrados = filtrarSorteos(sorteos, tipoJuego);
        
        // Verificar si hay resultados después del filtrado
        if (Object.keys(sorteosFiltrados).length === 0) {
            contenido.innerHTML = `
                <div class="error-message">
                    <i data-lucide="info" class="w-6 h-6 inline-block mr-2"></i>
                    No hay resultados disponibles para este juego todavía.
                </div>
            `;
            // Inicializar iconos
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        // Ordenar sorteos filtrados
        const sorteosOrdenados = ordenarPorFechaYHora(sorteosFiltrados);
        
        // **AGRUPAR POR HORARIO**
        const gruposPorHorario = agruparPorHorario(sorteosOrdenados);
        
        // Limpiar contenido
        contenido.innerHTML = '';
        
        // **CREAR SECCIONES POR HORARIO CON ICONOS**
        const horarios = ['11:00 AM', '3:00 PM', '9:00 PM', 'super'];
        const iconosHorario = {
            '11:00 AM': 'sunrise',
            '3:00 PM': 'sun',
            '9:00 PM': 'moon',
            'super': 'trophy'
        };
        const nombresHorario = {
            '11:00 AM': 'SORTEO DE LA MAÑANA',
            '3:00 PM': 'SORTEO DE LA TARDE',
            '9:00 PM': 'SORTEO DE LA NOCHE',
            'super': 'SÚPER PREMIO'
        };
        
        horarios.forEach(horario => {
            const sorteosDeLaHora = gruposPorHorario[horario];
            
            // Solo mostrar sección si hay sorteos
            if (sorteosDeLaHora && sorteosDeLaHora.length > 0) {
                // Crear sección
                const section = document.createElement('div');
                section.className = 'sorteo-section';
                
                // Crear header (sin mostrar hora para Súper Premio)
                const header = document.createElement('h2');
                header.className = 'sorteo-header';
                
                const iconoHTML = `<i data-lucide="${iconosHorario[horario]}" class="w-6 h-6 inline-block mr-2"></i>`;
                
                if (horario === 'super') {
                    header.innerHTML = `${iconoHTML}${nombresHorario[horario]}`;
                } else {
                    header.innerHTML = `${iconoHTML}${nombresHorario[horario]} - ${horario}`;
                }
                
                // Crear grid para esta sección
                const grid = document.createElement('div');
                grid.className = 'sorteo-grid';
                
                // Agregar cards al grid
                sorteosDeLaHora.forEach(([key, datos]) => {
                    grid.appendChild(crearCardJuego(key, datos));
                });
                
                // Ensamblar sección
                section.appendChild(header);
                section.appendChild(grid);
                
                // Agregar al contenido principal
                contenido.appendChild(section);
            }
        });
        
        // IMPORTANTE: Inicializar los iconos de Lucide después de crear el contenido
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        console.error('Error:', error);
        const contenido = document.getElementById('contenido');
        if (contenido) {
            contenido.innerHTML = `
                <div class="error-message">
                    <i data-lucide="alert-triangle" class="w-6 h-6 inline-block mr-2"></i>
                    Error al cargar los resultados<br>
                    <small>${error.message}</small>
                </div>
            `;
            // Inicializar iconos
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } finally {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Cargar resultados al iniciar
cargarResultados();

// Actualizar según horarios de sorteo
// Durante sorteos (11:00-11:30, 15:00-15:30, 21:00-21:30): cada 1 minuto
// Resto del día: cada 5 minutos

function obtenerIntervaloActualizacion() {
    const ahora = new Date();
    const offsetHonduras = -6;
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    const horaHonduras = new Date(utc + (3600000 * offsetHonduras));
    
    const hour = horaHonduras.getHours();
    const minute = horaHonduras.getMinutes();
    
    // Durante ventanas de sorteo: actualizar cada 1 minuto
    if (
        (hour === 11 && minute >= 0 && minute <= 30) ||
        (hour === 15 && minute >= 0 && minute <= 30) ||
        (hour === 21 && minute >= 0 && minute <= 30)
    ) {
        return 1 * 60 * 1000; // 1 minuto
    }
    
    // Resto del día: cada 5 minutos
    return 5 * 60 * 1000;
}

// Función para recargar con intervalo dinámico
function programarSiguienteActualizacion() {
    const intervalo = obtenerIntervaloActualizacion();
    setTimeout(() => {
        cargarResultados();
        programarSiguienteActualizacion(); // Reprogramar
    }, intervalo);
}

// Iniciar ciclo de actualizaciones
programarSiguienteActualizacion();


// ============================================
// RULETA DE NÚMEROS DE LA SUERTE (ACTUALIZADO)
// ============================================

// Ocultar tooltip después de 10 segundos
setTimeout(() => {
    const tooltip = document.getElementById('ruletaTooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 300);
    }
}, 10000);

function mostrarRuleta() {
    const overlay = document.getElementById('ruletaOverlay');
    const tooltip = document.getElementById('ruletaTooltip');
    const display = document.getElementById('ruletaDisplay');
    
    if (overlay) overlay.classList.remove('hidden');
    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.display = 'none';
    }
    
    // Reset display
    if (display) {
        display.innerHTML = `
            <div class="text-6xl font-bold text-violet-600 mb-4 py-8 bg-gradient-to-r from-violet-100 to-purple-100 rounded-xl shadow-inner">000</div>
            <p class="text-gray-500">Haz clic en "Girar" para descubrir tus números</p>
        `;
    }
}

function cerrarRuleta(event) {
    if (event && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('ruletaOverlay');
    if (overlay) overlay.classList.add('hidden');
}

function girarRuleta() {
    const display = document.getElementById('ruletaDisplay');
    const button = event.target.closest('button');
    
    if (!display || !button) return;
    
    // Deshabilitar botón mientras gira
    button.disabled = true;
    button.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>Girando...</span>`;
    
    // Inicializar icono
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Mostrar números girando
    display.innerHTML = '<div class="text-6xl font-bold text-violet-600 mb-4 py-8 bg-gradient-to-r from-violet-100 to-purple-100 rounded-xl shadow-inner" id="spinningNum">000</div>';
    
    let counter = 0;
    const spinInterval = setInterval(() => {
        const spinningNum = document.getElementById('spinningNum');
        if (spinningNum) {
            spinningNum.textContent = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        }
        counter++;
    }, 50);
    
    // Después de 3 segundos, mostrar los números finales
    setTimeout(() => {
        clearInterval(spinInterval);
        mostrarNumerosSuerte();
        
        // Reactivar botón
        button.disabled = false;
        button.innerHTML = `<i data-lucide="refresh-cw" class="w-5 h-5"></i><span>Girar Ruleta</span>`;
        
        // Inicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Crear confetti
        crearConfetti();
    }, 3000);
}

function mostrarNumerosSuerte() {
    const numeros = [];
    
    // Generar 4 números únicos entre 00 y 99
    while(numeros.length < 4) {
        const num = Math.floor(Math.random() * 100);
        if (!numeros.includes(num)) {
            numeros.push(num);
        }
    }
    
    const mensajes = [
        "¡Estos son tus números ganadores!",
        "¡La suerte está de tu lado!",
        "¡Números mágicos para ti!",
        "¡Que la fortuna te acompañe!",
        "¡Confía en estos números!",
        "¡Tu día de suerte ha llegado!"
    ];
    
    const mensajeAleatorio = mensajes[Math.floor(Math.random() * mensajes.length)];
    
    const display = document.getElementById('ruletaDisplay');
    if (display) {
        display.innerHTML = `
            <div class="grid grid-cols-2 gap-4 mb-6">
                ${numeros.map(num => `
                    <div class="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-4xl font-bold rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-transform">
                        ${num.toString().padStart(2, '0')}
                    </div>
                `).join('')}
            </div>
            <div class="flex items-center justify-center gap-2 text-lg font-semibold text-violet-600">
                <i data-lucide="sparkles" class="w-5 h-5"></i>
                <span>${mensajeAleatorio}</span>
                <i data-lucide="sparkles" class="w-5 h-5"></i>
            </div>
        `;
        
        // Inicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function crearConfetti() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffd700', '#00ff88'];
    const overlay = document.getElementById('ruletaOverlay');
    
    if (!overlay) return;
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = confetti.style.height = (Math.random() * 10 + 5) + 'px';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.animation = `fall ${Math.random() * 2 + 2}s linear forwards`;
            
            overlay.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }
}

// Agregar animación de caída para confetti
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

