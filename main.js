// ============================================
// CONFIGURACIÓN Y CACHE DE ELEMENTOS DOM
// ============================================
const CONFIG = {
    JSON_URL: '/api/resultados-v2',
    DATOS_EMBEBIDOS: null,
    INTERVALO_SORTEO: 60000, // 1 min
    INTERVALO_NORMAL: 300000 // 5 min
};

// Cache de elementos DOM (evita múltiples queries)
const DOM = {
    reloj: null,
    fecha: null,
    actualizacion: null,
    contenido: null,
    loading: null
};

// Inicializar cache DOM
function initDOM() {
    DOM.reloj = document.getElementById('relojHonduras');
    DOM.fecha = document.getElementById('fechaActual');
    DOM.actualizacion = document.getElementById('ultimaActualizacion');
    DOM.contenido = document.getElementById('contenido');
    DOM.loading = document.getElementById('loading');
}

// ============================================
// DETECTAR TIPO DE JUEGO (Optimizado)
// ============================================
const MAPEO_JUEGOS = {
    'juga-3': 'juga3', 'juga3': 'juga3',
    'pega-3': 'pega3', 'pega3': 'pega3',
    'premia-2': 'premia2', 'premia2': 'premia2',
    'la-diaria': 'diaria', 'diaria': 'diaria',
    'loto-super-premio': 'super', 'super-premio': 'super', 'superpremio': 'super'
};

function obtenerTipoJuego() {
    const path = window.location.pathname.toLowerCase();
    for (const key in MAPEO_JUEGOS) {
        if (path.includes(key)) return MAPEO_JUEGOS[key];
    }
    return 'todos';
}

// ============================================
// RELOJ HONDURAS (Optimizado)
// ============================================
function actualizarReloj() {
    if (!DOM.reloj) return;
    
    const ahora = new Date();
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    const horaHN = new Date(utc - 21600000); // UTC-6 en ms
    
    DOM.reloj.textContent = horaHN.toTimeString().slice(0, 8);
}

setInterval(actualizarReloj, 1000);

// ============================================
// UTILIDADES (Optimizadas)
// ============================================
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatearFecha() {
    const f = new Date();
    return `${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;
}

function formatearFechaSorteo(fecha) {
    if (!fecha || fecha.includes('-') && fecha.split('-').length === 3) return fecha;
    
    const [dia, mes] = fecha.split('-').map(Number);
    const ahora = new Date();
    const year = (mes < ahora.getMonth() + 1 || (mes === ahora.getMonth() + 1 && dia <= ahora.getDate())) 
        ? ahora.getFullYear() 
        : ahora.getFullYear() - 1;
    
    return `${fecha}-${year}`;
}

// ============================================
// FILTRAR Y AGRUPAR (Optimizado)
// ============================================
function filtrarSorteos(sorteos, tipo) {
    if (tipo === 'todos') return sorteos;
    
    return Object.fromEntries(
        Object.entries(sorteos).filter(([key]) => key.toLowerCase().includes(tipo))
    );
}

const GRUPOS_HORARIO = {
    '11:00 AM': [], '3:00 PM': [], '9:00 PM': [], 'super': []
};

const MAPEO_HORAS = {
    '11:00 AM': '11:00 AM', '10:00 AM': '11:00 AM',
    '3:00 PM': '3:00 PM', '2:00 PM': '3:00 PM', '15:00': '3:00 PM',
    '9:00 PM': '9:00 PM', '21:00': '9:00 PM'
};

const ORDEN_JUEGOS = ['juga3', 'pega3', 'premia2', 'diaria', 'super'];

function agruparPorHorario(sorteos) {
    // Reset grupos
    Object.keys(GRUPOS_HORARIO).forEach(k => GRUPOS_HORARIO[k] = []);
    
    sorteos.forEach(([key, datos]) => {
        const keyLower = key.toLowerCase();
        
        if (keyLower.includes('super')) {
            GRUPOS_HORARIO['super'].push([key, datos]);
        } else {
            const horaNorm = MAPEO_HORAS[datos.hora_sorteo];
            if (horaNorm) GRUPOS_HORARIO[horaNorm].push([key, datos]);
        }
    });
    
    // Ordenar grupos
    Object.values(GRUPOS_HORARIO).forEach(grupo => {
        grupo.sort((a, b) => {
            const tipoA = ORDEN_JUEGOS.findIndex(t => a[0].toLowerCase().includes(t));
            const tipoB = ORDEN_JUEGOS.findIndex(t => b[0].toLowerCase().includes(t));
            return tipoA - tipoB;
        });
    });
    
    return GRUPOS_HORARIO;
}

// ============================================
// CREAR CARDS (Optimizado con templates)
// ============================================
function crearCardJuego(key, datos) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    const nombreBase = datos.nombre_juego.replace(/\s*(11:00 AM|3:00 PM|9:00 PM|10:00 AM|2:00 PM)/gi, '').trim();
    const logo = datos.logo_url ? `<img src="${datos.logo_url}" alt="${nombreBase}" class="game-logo" onerror="this.style.display='none'">` : '';
    
    let contenido = '';
    
    if (key.includes('juga3')) {
        contenido = datos.numero_ganador ? `
            <div class="juga3-numero">
                <div class="numeros-titulo">NÚMEROS GANADORES</div>
                <div class="numeros-individuales">
                    ${datos.numeros_individuales.map((n, i) => 
                        `<div class="bola" style="animation-delay:${i*0.1}s">${n}</div>`
                    ).join('')}
                </div>
            </div>
        ` : '<div class="pendiente">⏳ Pendiente</div>';
    } else if (datos.numeros_adicionales?.length > 0) {
        const titulo = key.includes('diaria') ? 'NÚMERO · SIGNO · MULTIPLICADOR' : 'NÚMEROS GANADORES';
        contenido = `
            <div class="numeros-container">
                <div class="numeros-titulo">${titulo}</div>
                <div class="numeros-grid">
                    ${datos.numeros_adicionales.map((n, i) => 
                        `<div class="bola ${isNaN(n)?'texto':''}" style="animation-delay:${i*0.1}s">${n}</div>`
                    ).join('')}
                </div>
            </div>
        `;
    } else {
        contenido = '<div class="pendiente">⏳ Pendiente</div>';
    }
    
    const fechaConAnio = formatearFechaSorteo(datos.fecha_sorteo);
    const sinResultados = !datos.numero_ganador && (!datos.numeros_adicionales?.length);
    
    card.innerHTML = `
        <div class="game-header">
            <div class="game-title-row">
                <div class="game-name">${nombreBase}</div>
                ${logo}
            </div>
            <div class="game-meta">
                <div class="game-date">📅 ${fechaConAnio}</div>
                ${datos.hora_sorteo ? `<div class="game-time">🕐 ${datos.hora_sorteo}</div>` : ''}
            </div>
        </div>
        ${contenido}
        ${sinResultados ? '<div style="text-align:center"><span class="estado-badge">⏳ Próximamente</span></div>' : ''}
    `;
    
    return card;
}

// ============================================
// ORDENAR SORTEOS (Optimizado)
// ============================================
const ORDEN_HORAS = {
    '11:00 AM': 1, '10:00 AM': 1,
    '3:00 PM': 2, '2:00 PM': 2, '15:00': 2,
    '9:00 PM': 3, '21:00': 3
};

function ordenarPorFechaYHora(sorteos) {
    return Object.entries(sorteos).sort((a, b) => {
        const [keyA, datosA] = a;
        const [keyB, datosB] = b;
        
        const [diaA, mesA, yearA = new Date().getFullYear()] = datosA.fecha_sorteo.split('-').map(Number);
        const [diaB, mesB, yearB = new Date().getFullYear()] = datosB.fecha_sorteo.split('-').map(Number);
        
        // Ordenar por fecha (reciente primero)
        if (yearA !== yearB) return yearB - yearA;
        if (mesA !== mesB) return mesB - mesA;
        if (diaA !== diaB) return diaB - diaA;
        
        // Ordenar por hora
        const horaA = ORDEN_HORAS[datosA.hora_sorteo] || 0;
        const horaB = ORDEN_HORAS[datosB.hora_sorteo] || 0;
        if (horaA !== horaB) return horaA - horaB;
        
        // Ordenar por tipo
        const tipoA = ORDEN_JUEGOS.findIndex(t => keyA.includes(t));
        const tipoB = ORDEN_JUEGOS.findIndex(t => keyB.includes(t));
        return tipoA - tipoB;
    });
}

// ============================================
// CARGAR RESULTADOS (Optimizado)
// ============================================
async function cargarResultados() {
    try {
        let data;
        
        if (CONFIG.DATOS_EMBEBIDOS) {
            data = CONFIG.DATOS_EMBEBIDOS;
        } else {
            const res = await fetch(`${CONFIG.JSON_URL}?t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!res.ok) throw new Error('Error al cargar resultados');
            data = await res.json();
        }
        
        // Actualizar UI
        if (DOM.fecha) DOM.fecha.textContent = formatearFecha();
        if (DOM.actualizacion && data.fecha_actualizacion) {
            DOM.actualizacion.textContent = data.fecha_actualizacion;
        }
        
        if (!DOM.contenido) return;
        
        const sorteos = data.sorteos || data;
        const tipoJuego = obtenerTipoJuego();
        const sorteosFiltrados = filtrarSorteos(sorteos, tipoJuego);
        
        if (Object.keys(sorteosFiltrados).length === 0) {
            DOM.contenido.innerHTML = '<div class="error-message">ℹ️ No hay resultados disponibles para este juego todavía.</div>';
            return;
        }
        
        const sorteosOrdenados = ordenarPorFechaYHora(sorteosFiltrados);
        const grupos = agruparPorHorario(sorteosOrdenados);
        
        // Limpiar contenido
        DOM.contenido.innerHTML = '';
        
        // Renderizar secciones
        const HORARIOS = ['11:00 AM', '3:00 PM', '9:00 PM', 'super'];
        const EMOJIS = { '11:00 AM': '🌅', '3:00 PM': '☀️', '9:00 PM': '🌙', 'super': '🎰' };
        const NOMBRES = { 
            '11:00 AM': 'SORTEO DE LA MAÑANA',
            '3:00 PM': 'SORTEO DE LA TARDE',
            '9:00 PM': 'SORTEO DE LA NOCHE',
            'super': 'SÚPER PREMIO'
        };
        
        // Fragment para mejor performance
        const fragment = document.createDocumentFragment();
        
        HORARIOS.forEach(h => {
            const sorteosDeLaHora = grupos[h];
            if (!sorteosDeLaHora?.length) return;
            
            const section = document.createElement('div');
            section.className = 'sorteo-section';
            
            const header = document.createElement('h2');
            header.className = 'sorteo-header';
            header.textContent = h === 'super' 
                ? `${EMOJIS[h]} ${NOMBRES[h]}` 
                : `${EMOJIS[h]} ${NOMBRES[h]} - ${h}`;
            
            const grid = document.createElement('div');
            grid.className = 'sorteo-grid';
            
            sorteosDeLaHora.forEach(([key, datos]) => {
                grid.appendChild(crearCardJuego(key, datos));
            });
            
            section.appendChild(header);
            section.appendChild(grid);
            fragment.appendChild(section);
        });
        
        DOM.contenido.appendChild(fragment);
        
    } catch (error) {
        console.error('Error:', error);
        if (DOM.contenido) {
            DOM.contenido.innerHTML = `<div class="error-message">⚠️ Error al cargar los resultados<br><small>${error.message}</small></div>`;
        }
    } finally {
        if (DOM.loading) DOM.loading.style.display = 'none';
    }
}

// ============================================
// SISTEMA DE ACTUALIZACIÓN (Optimizado)
// ============================================
function obtenerIntervaloActualizacion() {
    const ahora = new Date();
    const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
    const horaHN = new Date(utc - 21600000);
    
    const h = horaHN.getHours();
    const m = horaHN.getMinutes();
    
    // Durante sorteos: cada 1 min
    if ((h === 11 || h === 15 || h === 21) && m <= 30) {
        return CONFIG.INTERVALO_SORTEO;
    }
    
    return CONFIG.INTERVALO_NORMAL;
}

function programarActualizacion() {
    setTimeout(() => {
        cargarResultados();
        programarActualizacion();
    }, obtenerIntervaloActualizacion());
}

// ============================================
// RULETA DE NÚMEROS (Optimizado)
// ============================================
let ruletaActiva = false;

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
    
    if (display && !ruletaActiva) {
        display.innerHTML = '<div class="spinning-number">000</div><p style="color:#999;margin-top:20px">Haz clic en "Girar" para descubrir tus números</p>';
    }
}

function cerrarRuleta(e) {
    if (e && e.target !== e.currentTarget) return;
    const overlay = document.getElementById('ruletaOverlay');
    if (overlay) overlay.classList.remove('active');
    ruletaActiva = false;
}

function girarRuleta() {
    if (ruletaActiva) return;
    ruletaActiva = true;
    
    const display = document.getElementById('ruletaDisplay');
    const btn = event.target;
    
    if (!display || !btn) return;
    
    btn.disabled = true;
    btn.classList.add('spinning');
    btn.textContent = '🎲 Girando...';
    
    display.innerHTML = '<div class="spinning-number" id="spinningNum">000</div>';
    
    let counter = 0;
    const spinInterval = setInterval(() => {
        const num = document.getElementById('spinningNum');
        if (num) num.textContent = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    }, 50);
    
    setTimeout(() => {
        clearInterval(spinInterval);
        mostrarNumerosSuerte();
        crearConfetti();
        
        btn.disabled = false;
        btn.classList.remove('spinning');
        btn.textContent = '🎲 Girar Otra Vez';
        ruletaActiva = false;
    }, 3000);
}

function mostrarNumerosSuerte() {
    const numeros = new Set();
    while(numeros.size < 4) {
        numeros.add(Math.floor(Math.random() * 100));
    }
    
    const mensajes = [
        "¡Estos son tus números ganadores!",
        "¡La suerte está de tu lado!",
        "¡Números mágicos para ti!",
        "¡Que la fortuna te acompañe!",
        "¡Confía en estos números!",
        "¡Tu día de suerte ha llegado!"
    ];
    
    const display = document.getElementById('ruletaDisplay');
    if (display) {
        display.innerHTML = `
            <div class="numeros-suerte-display">
                ${[...numeros].map(n => `<div class="numero-suerte">${String(n).padStart(2,'0')}</div>`).join('')}
            </div>
            <div class="mensaje-suerte">✨ ${mensajes[Math.floor(Math.random() * mensajes.length)]} ✨</div>
        `;
    }
}

function crearConfetti() {
    const colors = ['#667eea','#764ba2','#f093fb','#f5576c','#ffd700','#00ff88'];
    const overlay = document.getElementById('ruletaOverlay');
    if (!overlay) return;
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.cssText = `
                left:${Math.random()*100}%;
                background:${colors[Math.floor(Math.random()*colors.length)]};
                animation-duration:${Math.random()*2+2}s;
                width:${Math.random()*10+5}px;
                height:${Math.random()*10+5}px
            `;
            overlay.appendChild(c);
            setTimeout(() => c.remove(), 3000);
        }, i * 30);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    actualizarReloj();
    cargarResultados();
    programarActualizacion();
});

