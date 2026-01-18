/**
 * Steam Property Lookup Tool - Application Logic
 * Uses pre-generated CoolProp data for IAPWS-IF97 calculations
 * Minimal academic style with light/dark mode
 */

// ============================================
// Global State
// ============================================

let saturationDome = null;
let saturationTables = null;
let currentDiagram = 'Tv';
let currentState = null;
let isDarkMode = false;

// ============================================
// Theme Management
// ============================================

function applyTheme(dark) {
    isDarkMode = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    updateChart(); // Redraw chart with new theme colors
}

function getThemeColors() {
    if (isDarkMode) {
        return {
            bg: '#1a1a1a',
            plotBg: '#252525',
            text: '#e8e8e8',
            grid: '#444444',
            liquid: '#66cc99',
            vapor: '#aa88dd',
            critical: '#ff6666',
            marker: '#6699ff',
            isobar: '#ffaa55',
            isotherm: '#55aaff'
        };
    } else {
        return {
            bg: '#ffffff',
            plotBg: '#f8f8f8',
            text: '#1a1a1a',
            grid: '#dddddd',
            liquid: '#006633',
            vapor: '#663399',
            critical: '#cc0000',
            marker: '#0066cc',
            isobar: '#cc6600',
            isotherm: '#0066cc'
        };
    }
}

// ============================================
// Data Loading
// ============================================

async function loadData() {
    try {
        const [domeResponse, tablesResponse] = await Promise.all([
            fetch('data/saturation_dome.json'),
            fetch('data/saturation_tables.json')
        ]);

        saturationDome = await domeResponse.json();
        saturationTables = await tablesResponse.json();

        console.log('Data loaded successfully');
        initializeChart();
    } catch (error) {
        console.error('Failed to load data:', error);
        alert('Failed to load steam property data. Please ensure the data files exist.');
    }
}

// ============================================
// Property Calculations
// ============================================

/**
 * Linear interpolation helper
 */
function lerp(x, x0, x1, y0, y1) {
    if (x1 === x0) return y0;
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

/**
 * Find bracketing indices for interpolation
 */
function findBracket(arr, value, key) {
    for (let i = 0; i < arr.length - 1; i++) {
        const v0 = key ? arr[i][key] : arr[i];
        const v1 = key ? arr[i + 1][key] : arr[i + 1];
        if (value >= v0 && value <= v1) {
            return [i, i + 1];
        }
    }
    return null;
}

/**
 * Interpolate saturation properties at given temperature
 */
function getSaturationByT(T_C) {
    const table = saturationTables.by_temperature;
    const bracket = findBracket(table, T_C, 'T_C');

    if (!bracket) return null;

    const [i, j] = bracket;
    const t0 = table[i], t1 = table[j];

    return {
        T_C: T_C,
        P_kPa: lerp(T_C, t0.T_C, t1.T_C, t0.P_kPa, t1.P_kPa),
        v_f: lerp(T_C, t0.T_C, t1.T_C, t0.v_f, t1.v_f),
        v_g: lerp(T_C, t0.T_C, t1.T_C, t0.v_g, t1.v_g),
        h_f: lerp(T_C, t0.T_C, t1.T_C, t0.h_f, t1.h_f),
        h_g: lerp(T_C, t0.T_C, t1.T_C, t0.h_g, t1.h_g),
        s_f: lerp(T_C, t0.T_C, t1.T_C, t0.s_f, t1.s_f),
        s_g: lerp(T_C, t0.T_C, t1.T_C, t0.s_g, t1.s_g),
        u_f: lerp(T_C, t0.T_C, t1.T_C, t0.u_f, t1.u_f),
        u_g: lerp(T_C, t0.T_C, t1.T_C, t0.u_g, t1.u_g)
    };
}

/**
 * Interpolate saturation properties at given pressure
 */
function getSaturationByP(P_kPa) {
    const table = saturationTables.by_pressure;
    const bracket = findBracket(table, P_kPa, 'P_kPa');

    if (!bracket) return null;

    const [i, j] = bracket;
    const t0 = table[i], t1 = table[j];

    return {
        P_kPa: P_kPa,
        T_C: lerp(P_kPa, t0.P_kPa, t1.P_kPa, t0.T_C, t1.T_C),
        v_f: lerp(P_kPa, t0.P_kPa, t1.P_kPa, t0.v_f, t1.v_f),
        v_g: lerp(P_kPa, t0.P_kPa, t1.P_kPa, t0.v_g, t1.v_g),
        h_f: lerp(P_kPa, t0.P_kPa, t1.P_kPa, t0.h_f, t1.h_f),
        h_g: lerp(P_kPa, t0.P_kPa, t1.P_kPa, t0.h_g, t1.h_g),
        s_f: lerp(P_kPa, t0.P_kPa, t1.P_kPa, t0.s_f, t1.s_f),
        s_g: lerp(P_kPa, t0.P_kPa, t1.P_kPa, t0.s_g, t1.s_g),
        u_f: lerp(P_kPa, t0.P_kPa, t1.P_kPa, t0.u_f, t1.u_f),
        u_g: lerp(P_kPa, t0.P_kPa, t1.P_kPa, t0.u_g, t1.u_g)
    };
}

/**
 * Calculate two-phase properties given quality
 */
function twoPhaseProperties(sat, x) {
    return {
        T_C: sat.T_C,
        P_kPa: sat.P_kPa,
        v: sat.v_f + x * (sat.v_g - sat.v_f),
        h: sat.h_f + x * (sat.h_g - sat.h_f),
        s: sat.s_f + x * (sat.s_g - sat.s_f),
        u: sat.u_f + x * (sat.u_g - sat.u_f),
        x: x,
        phase: 'Saturated (Two-Phase)'
    };
}

/**
 * Determine phase from P, T
 */
function determinePhase(P_kPa, T_C) {
    const T_crit = 373.946;
    const P_crit = 22064;

    if (P_kPa >= P_crit && T_C >= T_crit) {
        return 'Supercritical';
    }

    const sat = getSaturationByP(P_kPa);
    if (!sat) return 'Unknown';

    const T_sat = sat.T_C;

    if (Math.abs(T_C - T_sat) < 0.1) {
        return 'Saturated (Two-Phase)';
    } else if (T_C < T_sat) {
        return 'Subcooled Liquid';
    } else {
        return 'Superheated Vapor';
    }
}

/**
 * Calculate properties for P-T input
 */
function calculatePT(P_kPa, T_C) {
    const phase = determinePhase(P_kPa, T_C);
    const sat = getSaturationByP(P_kPa);

    if (!sat) return null;

    let result;

    if (phase === 'Subcooled Liquid') {
        result = {
            T_C: T_C,
            P_kPa: P_kPa,
            v: sat.v_f,
            h: sat.h_f,
            s: sat.s_f,
            u: sat.u_f,
            x: null,
            phase: phase
        };
    } else if (phase === 'Superheated Vapor') {
        const T_sat = sat.T_C;
        const superheat = T_C - T_sat;
        const cp_approx = 2.0;
        result = {
            T_C: T_C,
            P_kPa: P_kPa,
            v: sat.v_g * (T_C + 273.15) / (T_sat + 273.15),
            h: sat.h_g + cp_approx * superheat,
            s: sat.s_g + cp_approx * Math.log((T_C + 273.15) / (T_sat + 273.15)),
            u: sat.u_g + 1.5 * superheat,
            x: null,
            phase: phase
        };
    } else if (phase === 'Supercritical') {
        result = {
            T_C: T_C,
            P_kPa: P_kPa,
            v: null,
            h: null,
            s: null,
            u: null,
            x: null,
            phase: phase
        };
    } else {
        result = {
            T_C: T_C,
            P_kPa: P_kPa,
            v: null,
            h: null,
            s: null,
            u: null,
            x: null,
            phase: 'Saturated - specify quality'
        };
    }

    return result;
}

function calculateTx(T_C, x) {
    const sat = getSaturationByT(T_C);
    if (!sat) return null;
    return twoPhaseProperties(sat, x);
}

function calculatePx(P_kPa, x) {
    const sat = getSaturationByP(P_kPa);
    if (!sat) return null;
    return twoPhaseProperties(sat, x);
}

function calculatePh(P_kPa, h) {
    const sat = getSaturationByP(P_kPa);
    if (!sat) return null;

    if (h < sat.h_f) {
        return {
            T_C: sat.T_C - (sat.h_f - h) / 4.2,
            P_kPa: P_kPa,
            v: sat.v_f,
            h: h,
            s: sat.s_f,
            u: h - P_kPa * sat.v_f,
            x: null,
            phase: 'Subcooled Liquid'
        };
    } else if (h > sat.h_g) {
        const superheat = (h - sat.h_g) / 2.0;
        return {
            T_C: sat.T_C + superheat,
            P_kPa: P_kPa,
            v: sat.v_g * (1 + superheat / (sat.T_C + 273.15)),
            h: h,
            s: sat.s_g + 2.0 * Math.log(1 + superheat / (sat.T_C + 273.15)),
            u: h - P_kPa * sat.v_g,
            x: null,
            phase: 'Superheated Vapor'
        };
    } else {
        const x = (h - sat.h_f) / (sat.h_g - sat.h_f);
        return twoPhaseProperties(sat, x);
    }
}

function calculatePs(P_kPa, s) {
    const sat = getSaturationByP(P_kPa);
    if (!sat) return null;

    if (s < sat.s_f) {
        return {
            T_C: sat.T_C,
            P_kPa: P_kPa,
            v: sat.v_f,
            h: sat.h_f,
            s: s,
            u: sat.u_f,
            x: null,
            phase: 'Subcooled Liquid'
        };
    } else if (s > sat.s_g) {
        const ds = s - sat.s_g;
        const superheat = ds * (sat.T_C + 273.15) / 2.0;
        return {
            T_C: sat.T_C + superheat,
            P_kPa: P_kPa,
            v: sat.v_g * Math.exp(ds / 2.0),
            h: sat.h_g + 2.0 * superheat,
            s: s,
            u: sat.u_g + 1.5 * superheat,
            x: null,
            phase: 'Superheated Vapor'
        };
    } else {
        const x = (s - sat.s_f) / (sat.s_g - sat.s_f);
        return twoPhaseProperties(sat, x);
    }
}

function calculateProperties(inputPair, value1, value2) {
    switch (inputPair) {
        case 'PT': return calculatePT(value1, value2);
        case 'Ph': return calculatePh(value1, value2);
        case 'Ps': return calculatePs(value1, value2);
        case 'Tx': return calculateTx(value1, value2);
        case 'Px': return calculatePx(value1, value2);
        default: return null;
    }
}

// ============================================
// Isobar and Isotherm Generation
// ============================================

/**
 * Generate isobar line data for a given pressure
 */
function generateIsobar(P_kPa) {
    const sat = getSaturationByP(P_kPa);
    if (!sat) return null;

    const points = [];

    // Subcooled region (approximate)
    for (let T = 0; T < sat.T_C; T += 20) {
        points.push({
            T_C: T,
            v: sat.v_f,
            s: sat.s_f - 4.2 * Math.log((sat.T_C + 273.15) / (T + 273.15))
        });
    }

    // Saturation points
    points.push({ T_C: sat.T_C, v: sat.v_f, s: sat.s_f });

    // Two-phase region
    for (let x = 0.1; x < 1; x += 0.1) {
        points.push({
            T_C: sat.T_C,
            v: sat.v_f + x * (sat.v_g - sat.v_f),
            s: sat.s_f + x * (sat.s_g - sat.s_f)
        });
    }

    points.push({ T_C: sat.T_C, v: sat.v_g, s: sat.s_g });

    // Superheated region
    for (let dT = 20; dT <= 400; dT += 20) {
        const T = sat.T_C + dT;
        if (T > 800) break;
        points.push({
            T_C: T,
            v: sat.v_g * (T + 273.15) / (sat.T_C + 273.15),
            s: sat.s_g + 2.0 * Math.log((T + 273.15) / (sat.T_C + 273.15))
        });
    }

    return { P_kPa, points };
}

/**
 * Generate isotherm line data for a given temperature
 */
function generateIsotherm(T_C) {
    const sat = getSaturationByT(T_C);
    const points = [];

    if (sat) {
        // Below critical: has two-phase region
        // Subcooled
        points.push({ P_kPa: sat.P_kPa * 2, v: sat.v_f * 0.99, s: sat.s_f - 0.1 });
        points.push({ P_kPa: sat.P_kPa, v: sat.v_f, s: sat.s_f });

        // Two-phase (horizontal on T-v and T-s)
        for (let x = 0.1; x < 1; x += 0.1) {
            points.push({
                P_kPa: sat.P_kPa,
                v: sat.v_f + x * (sat.v_g - sat.v_f),
                s: sat.s_f + x * (sat.s_g - sat.s_f)
            });
        }

        points.push({ P_kPa: sat.P_kPa, v: sat.v_g, s: sat.s_g });

        // Superheated at lower pressures
        for (let P = sat.P_kPa * 0.5; P > 10; P *= 0.5) {
            const v = sat.v_g * sat.P_kPa / P;
            points.push({ P_kPa: P, v: v, s: sat.s_g + 0.5 * Math.log(sat.P_kPa / P) });
        }
    }

    return { T_C, points };
}

// ============================================
// Chart Functions
// ============================================

function initializeChart() {
    updateChart();
}

function getChartData() {
    const colors = getThemeColors();
    const liquid = saturationDome.liquid;
    const vapor = saturationDome.vapor;
    const crit = saturationDome.critical;

    let xLiquid, xVapor, yLiquid, yVapor, xCrit, yCrit;
    let xLabel, yLabel, title;
    let xType = 'linear';

    switch (currentDiagram) {
        case 'Tv':
            xLiquid = liquid.v_m3kg;
            xVapor = vapor.v_m3kg;
            yLiquid = liquid.T_C;
            yVapor = vapor.T_C;
            xCrit = crit.v_m3kg;
            yCrit = crit.T_C;
            xLabel = 'Specific Volume (m³/kg)';
            yLabel = 'Temperature (°C)';
            title = 'T-v Diagram';
            xType = 'log'; // Log scale for specific volume
            break;
        case 'Pv':
            xLiquid = liquid.v_m3kg;
            xVapor = vapor.v_m3kg;
            yLiquid = liquid.P_kPa;
            yVapor = vapor.P_kPa;
            xCrit = crit.v_m3kg;
            yCrit = crit.P_kPa;
            xLabel = 'Specific Volume (m³/kg)';
            yLabel = 'Pressure (kPa)';
            title = 'P-v Diagram';
            xType = 'log'; // Log scale for specific volume
            break;
        case 'Ts':
            xLiquid = liquid.s_kJkgK;
            xVapor = vapor.s_kJkgK;
            yLiquid = liquid.T_C;
            yVapor = vapor.T_C;
            xCrit = crit.s_kJkgK;
            yCrit = crit.T_C;
            xLabel = 'Specific Entropy (kJ/(kg·K))';
            yLabel = 'Temperature (°C)';
            title = 'T-s Diagram';
            break;
    }

    const traces = [
        // Liquid saturation line - thicker
        {
            x: xLiquid,
            y: yLiquid,
            mode: 'lines',
            name: 'Saturated Liquid',
            line: { color: colors.liquid, width: 3 }
        },
        // Vapor saturation line - thicker
        {
            x: xVapor,
            y: yVapor,
            mode: 'lines',
            name: 'Saturated Vapor',
            line: { color: colors.vapor, width: 3 }
        },
        // Critical point
        {
            x: [xCrit],
            y: [yCrit],
            mode: 'markers',
            name: 'Critical Point',
            marker: { color: colors.critical, size: 12, symbol: 'diamond' }
        }
    ];

    // Add isobars
    const isobarPressures = [10, 100, 1000, 10000];
    isobarPressures.forEach((P, idx) => {
        const isobar = generateIsobar(P);
        if (isobar && isobar.points.length > 2) {
            let xData, yData;
            switch (currentDiagram) {
                case 'Tv':
                    xData = isobar.points.map(p => p.v);
                    yData = isobar.points.map(p => p.T_C);
                    break;
                case 'Pv':
                    // Isobars are horizontal lines in P-v
                    xData = isobar.points.map(p => p.v);
                    yData = isobar.points.map(() => P);
                    break;
                case 'Ts':
                    xData = isobar.points.map(p => p.s);
                    yData = isobar.points.map(p => p.T_C);
                    break;
            }
            traces.push({
                x: xData,
                y: yData,
                mode: 'lines',
                name: `P = ${P} kPa`,
                line: { color: colors.isobar, width: 1.5, dash: 'dash' },
                showlegend: idx === 0
            });
        }
    });

    // Add isotherms
    const isothermTemps = [50, 100, 200, 300];
    isothermTemps.forEach((T, idx) => {
        const isotherm = generateIsotherm(T);
        if (isotherm && isotherm.points.length > 2) {
            let xData, yData;
            switch (currentDiagram) {
                case 'Tv':
                    // Isotherms are horizontal lines in T-v
                    xData = isotherm.points.map(p => p.v);
                    yData = isotherm.points.map(() => T);
                    break;
                case 'Pv':
                    xData = isotherm.points.map(p => p.v);
                    yData = isotherm.points.map(p => p.P_kPa);
                    break;
                case 'Ts':
                    // Isotherms are horizontal lines in T-s
                    xData = isotherm.points.map(p => p.s);
                    yData = isotherm.points.map(() => T);
                    break;
            }
            traces.push({
                x: xData,
                y: yData,
                mode: 'lines',
                name: `T = ${T}°C`,
                line: { color: colors.isotherm, width: 1.5, dash: 'dot' },
                showlegend: idx === 0
            });
        }
    });

    // Current state marker
    if (currentState) {
        let stateX, stateY;

        switch (currentDiagram) {
            case 'Tv':
                stateX = currentState.v;
                stateY = currentState.T_C;
                break;
            case 'Pv':
                stateX = currentState.v;
                stateY = currentState.P_kPa;
                break;
            case 'Ts':
                stateX = currentState.s;
                stateY = currentState.T_C;
                break;
        }

        if (stateX != null && stateY != null) {
            traces.push({
                x: [stateX],
                y: [stateY],
                mode: 'markers',
                name: 'Current State',
                marker: {
                    color: colors.marker,
                    size: 14,
                    symbol: 'circle',
                    line: { color: isDarkMode ? 'white' : 'black', width: 2 }
                }
            });
        }
    }

    return { traces, xLabel, yLabel, title, xType };
}

function updateChart() {
    const colors = getThemeColors();
    const { traces, xLabel, yLabel, title, xType } = getChartData();

    const layout = {
        title: {
            text: title,
            font: { family: 'Times New Roman, serif', color: colors.text, size: 20 }
        },
        xaxis: {
            title: { text: xLabel, font: { family: 'Times New Roman, serif' } },
            type: xType,
            color: colors.text,
            gridcolor: colors.grid,
            zerolinecolor: colors.grid,
            linewidth: 2
        },
        yaxis: {
            title: { text: yLabel, font: { family: 'Times New Roman, serif' } },
            type: currentDiagram === 'Pv' ? 'log' : 'linear',
            color: colors.text,
            gridcolor: colors.grid,
            zerolinecolor: colors.grid,
            linewidth: 2
        },
        paper_bgcolor: colors.bg,
        plot_bgcolor: colors.plotBg,
        font: { family: 'Times New Roman, serif', color: colors.text },
        legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: colors.bg,
            bordercolor: colors.grid,
            borderwidth: 1,
            font: { family: 'Times New Roman, serif' }
        },
        margin: { l: 70, r: 30, t: 60, b: 60 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    Plotly.react('chart-container', traces, layout, config);

    const chartDiv = document.getElementById('chart-container');
    chartDiv.removeAllListeners && chartDiv.removeAllListeners('plotly_click');
    chartDiv.on('plotly_click', handleChartClick);
}

function handleChartClick(data) {
    if (!data.points || data.points.length === 0) return;

    const point = data.points[0];
    const x = point.x;
    const y = point.y;

    console.log(`Clicked at (${x}, ${y})`);
}

// ============================================
// UI Functions
// ============================================

function updateInputLabels(inputPair) {
    const label1 = document.getElementById('input1-label');
    const label2 = document.getElementById('input2-label');
    const input1 = document.getElementById('input1');
    const input2 = document.getElementById('input2');

    switch (inputPair) {
        case 'PT':
            label1.textContent = 'Pressure (kPa)';
            label2.textContent = 'Temperature (°C)';
            input1.placeholder = 'e.g., 101.325';
            input2.placeholder = 'e.g., 100';
            break;
        case 'Ph':
            label1.textContent = 'Pressure (kPa)';
            label2.textContent = 'Enthalpy (kJ/kg)';
            input1.placeholder = 'e.g., 101.325';
            input2.placeholder = 'e.g., 2675';
            break;
        case 'Ps':
            label1.textContent = 'Pressure (kPa)';
            label2.textContent = 'Entropy (kJ/(kg·K))';
            input1.placeholder = 'e.g., 101.325';
            input2.placeholder = 'e.g., 7.35';
            break;
        case 'Tx':
            label1.textContent = 'Temperature (°C)';
            label2.textContent = 'Quality (0-1)';
            input1.placeholder = 'e.g., 100';
            input2.placeholder = 'e.g., 0.5';
            break;
        case 'Px':
            label1.textContent = 'Pressure (kPa)';
            label2.textContent = 'Quality (0-1)';
            input1.placeholder = 'e.g., 101.325';
            input2.placeholder = 'e.g., 0.5';
            break;
    }
}

function updateOutputDisplay(state) {
    const format = (val) => val != null ? val.toFixed(4) : '--';

    document.getElementById('out-T').textContent = format(state.T_C);
    document.getElementById('out-P').textContent = format(state.P_kPa);
    document.getElementById('out-v').textContent = state.v != null ? state.v.toExponential(4) : '--';
    document.getElementById('out-h').textContent = format(state.h);
    document.getElementById('out-s').textContent = format(state.s);
    document.getElementById('out-u').textContent = format(state.u);
    document.getElementById('out-x').textContent = state.x != null ? state.x.toFixed(4) : 'N/A';

    const phaseEl = document.getElementById('phase-value');
    phaseEl.textContent = state.phase;
    phaseEl.className = 'phase-value';

    if (state.phase.includes('Liquid') && !state.phase.includes('Two')) {
        phaseEl.classList.add('liquid');
    } else if (state.phase.includes('Two-Phase') || state.phase.includes('Saturated')) {
        phaseEl.classList.add('twophase');
    } else if (state.phase.includes('Vapor') || state.phase.includes('Superheated')) {
        phaseEl.classList.add('vapor');
    } else if (state.phase.includes('Supercritical')) {
        phaseEl.classList.add('supercritical');
    }
}

function handleCalculate() {
    const inputPair = document.querySelector('input[name="inputPair"]:checked').value;
    const value1 = parseFloat(document.getElementById('input1').value);
    const value2 = parseFloat(document.getElementById('input2').value);

    if (isNaN(value1) || isNaN(value2)) {
        alert('Please enter valid numeric values');
        return;
    }

    const result = calculateProperties(inputPair, value1, value2);

    if (!result) {
        alert('Could not calculate properties for the given inputs. Check that values are within valid ranges.');
        return;
    }

    currentState = result;
    updateOutputDisplay(result);
    updateChart();
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            applyTheme(e.target.checked);
        });
    }

    // Input pair radio buttons
    document.querySelectorAll('input[name="inputPair"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateInputLabels(e.target.value);
        });
    });

    // Calculate button
    document.getElementById('calculate-btn').addEventListener('click', handleCalculate);

    // Enter key to calculate
    document.querySelectorAll('.input-group input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCalculate();
        });
    });

    // Diagram toggle buttons
    document.querySelectorAll('.diagram-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.diagram-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentDiagram = e.target.dataset.diagram;
            updateChart();
        });
    });
});
