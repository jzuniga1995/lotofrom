// ============================================
// CONFIGURACIÓN
// ============================================

const JSON_URL = 'https://raw.githubusercontent.com/jzuniga1995/lotohn/main/resultados_hoy.json';
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
// CREAR CARDS DE JUEGOS
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
        ` : '<div class="pendiente">⏳ Pendiente</div>';
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
            contenidoPrincipal = '<div class="pendiente">⏳ Pendiente</div>';
        }
    }

    card.innerHTML = `
        <div class="game-header">
            <div class="game-title-row">
                <div class="game-name">${nombreBase}</div>
                ${logoHTML}
            </div>
            <div class="game-meta">
                <div class="game-date">📅 ${datos.fecha_sorteo}</div>
                ${datos.hora_sorteo ? `<div class="game-time">🕐 ${datos.hora_sorteo}</div>` : ''}
            </div>
        </div>
        
        ${contenidoPrincipal}
        
        ${!datos.numero_ganador && (!datos.numeros_adicionales || datos.numeros_adicionales.length === 0) ? `
            <div style="text-align:center;">
                <span class="estado-badge">⏳ Próximamente</span>
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
        
        // Comparar fechas (formato DD-MM)
        const [diaA, mesA] = datosA.fecha_sorteo.split('-').map(Number);
        const [diaB, mesB] = datosB.fecha_sorteo.split('-').map(Number);
        
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
// CARGAR RESULTADOS (CON FILTRADO)
// ============================================

async function cargarResultados() {
    try {
        let data;
        
        if (DATOS_EMBEBIDOS) {
            data = DATOS_EMBEBIDOS;
        } else {
            const response = await fetch(JSON_URL);
            
            if (!response.ok) {
                throw new Error('No se pudieron cargar los resultados. Por favor, intenta de nuevo más tarde.');
            }
            
            data = await response.json();
        }
        
        // Actualizar fecha en el DOM
        const fechaElement = document.getElementById('fechaActual');
        if (fechaElement) {
            fechaElement.textContent = formatearFecha();
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
        
        const grid = document.createElement('div');
        grid.className = 'games-grid';
        
        const sorteos = data.sorteos || data;
        
        // **FILTRAR según el tipo de página**
        const tipoJuego = obtenerTipoJuego();
        const sorteosFiltrados = filtrarSorteos(sorteos, tipoJuego);
        
        // Verificar si hay resultados después del filtrado
        if (Object.keys(sorteosFiltrados).length === 0) {
            contenido.innerHTML = `
                <div class="error-message">
                    ℹ️ No hay resultados disponibles para este juego todavía.
                </div>
            `;
            return;
        }
        
        // Ordenar sorteos filtrados
        const sorteosOrdenados = ordenarPorFechaYHora(sorteosFiltrados);
        
        sorteosOrdenados.forEach(([key, datos]) => {
            grid.appendChild(crearCardJuego(key, datos));
        });
        
        contenido.innerHTML = '';
        contenido.appendChild(grid);
        
    } catch (error) {
        console.error('Error:', error);
        const contenido = document.getElementById('contenido');
        if (contenido) {
            contenido.innerHTML = `
                <div class="error-message">
                    ⚠️ Error al cargar los resultados<br>
                    <small>${error.message}</small>
                </div>
            `;
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

// Actualizar cada 5 minutos
setInterval(cargarResultados, 5 * 60 * 1000);

// ============================================
// RULETA DE NÚMEROS DE LA SUERTE
// ============================================

// Ocultar tooltip después de 10 segundos
setTimeout(() => {
    const tooltip = document.getElementById('ruletaTooltip');
    if (tooltip) tooltip.classList.add('hidden');
}, 10000);

function mostrarRuleta() {
    const overlay = document.getElementById('ruletaOverlay');
    const tooltip = document.getElementById('ruletaTooltip');
    const display = document.getElementById('ruletaDisplay');
    
    if (overlay) overlay.classList.add('active');
    if (tooltip) tooltip.classList.add('hidden');
    
    // Reset display
    if (display) {
        display.innerHTML = `
            <div class="spinning-number">000</div>
            <p style="color: #999; margin-top: 20px;">Haz clic en "Girar" para descubrir tus números</p>
        `;
    }
}

function cerrarRuleta(event) {
    if (event && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('ruletaOverlay');
    if (overlay) overlay.classList.remove('active');
}

function girarRuleta() {
    const display = document.getElementById('ruletaDisplay');
    const button = event.target;
    
    if (!display || !button) return;
    
    // Deshabilitar botón mientras gira
    button.disabled = true;
    button.classList.add('spinning');
    button.textContent = '🎲 Girando...';
    
    // Mostrar números girando
    display.innerHTML = '<div class="spinning-number" id="spinningNum">000</div>';
    
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
        button.classList.remove('spinning');
        button.textContent = '🎲 Girar Otra Vez';
        
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
            <div class="numeros-suerte-display">
                ${numeros.map(num => `
                    <div class="numero-suerte">${num.toString().padStart(2, '0')}</div>
                `).join('')}
            </div>
            <div class="mensaje-suerte">✨ ${mensajeAleatorio} ✨</div>
        `;
    }
}

function crearConfetti() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffd700', '#00ff88'];
    const overlay = document.getElementById('ruletaOverlay');
    
    if (!overlay) return;
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.width = confetti.style.height = (Math.random() * 10 + 5) + 'px';
            
            overlay.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}
