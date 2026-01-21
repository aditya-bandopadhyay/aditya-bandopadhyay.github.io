/**
 * Steam Property Quiz Module
 * 
 * Students receive two "given" properties and must determine
 * the phase and remaining thermodynamic properties.
 */

// Version 2.1 - Nice table increments
// ===== Global State =====
let saturationData = null;
let superheatedData = null;
let currentState = null;
let givenProperties = [];

const PROPERTIES = ['P', 'T', 'v', 'h', 's', 'u'];
const TOLERANCE = 0.005; // +/- 0.5%

// ===== Data Loading =====

async function load_saturation_data() {
    const response = await fetch('data/saturation_tables.json');
    return response.json();
}

async function load_superheated_data() {
    const response = await fetch('data/property_grid.json');
    return response.json();
}

async function initialize_data() {
    try {
        [saturationData, superheatedData] = await Promise.all([
            load_saturation_data(),
            load_superheated_data()
        ]);
        return true;
    } catch (error) {
        console.error('Failed to load data:', error);
        alert(`Error loading data files: ${error.message}\n\nMake sure you're running a local server (e.g., python3 -m http.server 8000)`);
        return false;
    }
}

// ===== State Generation =====

function get_saturation_temperature(P_kPa) {
    // Interpolate T_sat from pressure
    const data = saturationData.by_temperature;

    for (let i = 0; i < data.length - 1; i++) {
        if (data[i].P_kPa <= P_kPa && data[i + 1].P_kPa >= P_kPa) {
            const frac = (P_kPa - data[i].P_kPa) / (data[i + 1].P_kPa - data[i].P_kPa);
            return data[i].T_C + frac * (data[i + 1].T_C - data[i].T_C);
        }
    }

    // Outside range
    if (P_kPa <= data[0].P_kPa) return data[0].T_C;
    return data[data.length - 1].T_C;
}

function compute_saturated_properties(P_kPa, x) {
    // Compute mixture properties: prop = prop_f + x * (prop_g - prop_f)
    const data = saturationData.by_temperature;

    let lower = data[0], upper = data[1];
    for (let i = 0; i < data.length - 1; i++) {
        if (data[i].P_kPa <= P_kPa && data[i + 1].P_kPa >= P_kPa) {
            lower = data[i];
            upper = data[i + 1];
            break;
        }
    }

    const frac = (P_kPa - lower.P_kPa) / (upper.P_kPa - lower.P_kPa);

    // Interpolate saturation properties
    const interp = (prop) => lower[prop] + frac * (upper[prop] - lower[prop]);

    const T_sat = interp('T_C');
    const v = interp('v_f') + x * (interp('v_g') - interp('v_f'));
    const h = interp('h_f') + x * (interp('h_g') - interp('h_f'));
    const s = interp('s_f') + x * (interp('s_g') - interp('s_f'));
    const u = interp('u_f') + x * (interp('u_g') - interp('u_f'));

    return { P: P_kPa, T: T_sat, v, h, s, u, x, phase: 'saturated' };
}

function get_superheated_properties(P_kPa, T_C) {
    // Find data at this pressure (or interpolate)
    const pressures = [...new Set(superheatedData.map(d => d.P_kPa))].sort((a, b) => a - b);

    let lowerP = pressures[0], upperP = pressures[pressures.length - 1];
    for (let i = 0; i < pressures.length - 1; i++) {
        if (pressures[i] <= P_kPa && pressures[i + 1] >= P_kPa) {
            lowerP = pressures[i];
            upperP = pressures[i + 1];
            break;
        }
    }

    const propsLower = get_props_at_exact_P_T(lowerP, T_C);
    const propsUpper = get_props_at_exact_P_T(upperP, T_C);

    if (!propsLower || !propsUpper) return null;

    if (lowerP === upperP) return propsLower;

    const frac = (P_kPa - lowerP) / (upperP - lowerP);
    return {
        P: P_kPa,
        T: T_C,
        v: propsLower.v + frac * (propsUpper.v - propsLower.v),
        h: propsLower.h + frac * (propsUpper.h - propsLower.h),
        s: propsLower.s + frac * (propsUpper.s - propsLower.s),
        u: propsLower.u + frac * (propsUpper.u - propsLower.u),
        x: null,
        phase: 'superheated'
    };
}

function get_props_at_exact_P_T(P_kPa, T_C) {
    const atP = superheatedData.filter(d => d.P_kPa === P_kPa && d.phase !== 'liquid');
    if (atP.length === 0) return null;

    atP.sort((a, b) => a.T_C - b.T_C);

    let lower = null, upper = null;
    for (let i = 0; i < atP.length - 1; i++) {
        if (atP[i].T_C <= T_C && atP[i + 1].T_C >= T_C) {
            lower = atP[i];
            upper = atP[i + 1];
            break;
        }
    }

    if (!lower) return null;

    const frac = (T_C - lower.T_C) / (upper.T_C - lower.T_C);
    return {
        P: P_kPa,
        T: T_C,
        v: lower.v_m3kg + frac * (upper.v_m3kg - lower.v_m3kg),
        h: lower.h_kJkg + frac * (upper.h_kJkg - lower.h_kJkg),
        s: lower.s_kJkgK + frac * (upper.s_kJkgK - lower.s_kJkgK),
        u: lower.u_kJkg + frac * (upper.u_kJkg - lower.u_kJkg),
        x: null,
        phase: 'superheated'
    };
}

function is_valid_property_pair(prop1, prop2, phase) {
    // P and T are coupled in saturation - not a valid pair there
    if (phase === 'saturated' &&
        ((prop1 === 'P' && prop2 === 'T') || (prop1 === 'T' && prop2 === 'P'))) {
        return false;
    }
    return prop1 !== prop2;
}

function select_given_properties(state) {
    const candidates = ['P', 'T', 'v', 'h', 's'];
    let pair;
    do {
        const shuffled = [...candidates].sort(() => Math.random() - 0.5);
        pair = [shuffled[0], shuffled[1]];
    } while (!is_valid_property_pair(pair[0], pair[1], state.phase));
    return pair;
}

function generate_random_state() {
    const isSaturated = Math.random() < 0.5;

    const pressures = [...new Set(superheatedData.map(d => d.P_kPa))].sort((a, b) => a - b);
    const validPressures = pressures.filter(p => p >= 10 && p <= 10000);
    const P_kPa = validPressures[Math.floor(Math.random() * validPressures.length)];
    const T_sat = get_saturation_temperature(P_kPa);

    if (isSaturated) {
        const x = 0.1 + Math.random() * 0.8;
        return compute_saturated_properties(P_kPa, x);
    } else {
        const atP = superheatedData.filter(d => d.P_kPa === P_kPa && d.phase !== 'liquid');
        if (atP.length === 0) {
            return compute_saturated_properties(P_kPa, 0.1 + Math.random() * 0.8);
        }

        const maxT = Math.max(...atP.map(d => d.T_C));
        const minT = T_sat + 20;
        const safeMaxT = maxT - 20;

        if (minT >= safeMaxT) {
            return compute_saturated_properties(P_kPa, 0.1 + Math.random() * 0.8);
        }

        const T_C = minT + Math.random() * (safeMaxT - minT);
        const props = get_superheated_properties(P_kPa, T_C);

        return props || compute_saturated_properties(P_kPa, 0.1 + Math.random() * 0.8);
    }
}

// ===== UI Rendering =====

function format_value(value, prop) {
    if (value === null || value === undefined) return '';
    if (prop === 'v') return value.toExponential(4);
    if (prop === 'x') return value.toFixed(4);
    return value.toFixed(2);
}

function render_property_row(givenProps, state) {
    PROPERTIES.forEach(prop => {
        const input = document.getElementById(`input-${prop}`);
        input.classList.remove('correct', 'incorrect');

        if (givenProps.includes(prop)) {
            input.value = format_value(state[prop], prop);
            input.readOnly = true;
        } else {
            input.value = '';
            input.readOnly = false;
        }
    });

    // Reset phase select
    const phaseSelect = document.getElementById('phase-select');
    phaseSelect.value = '';
    phaseSelect.classList.remove('correct', 'incorrect');

    // Reset quality
    const qualityInput = document.getElementById('input-x');
    qualityInput.value = '';
    qualityInput.classList.remove('correct', 'incorrect');

    // Show/hide quality column based on phase (initially show)
    document.getElementById('quality-header').classList.remove('hidden');
    document.getElementById('quality-cell').classList.remove('hidden');
}

// ===== Validation =====

function check_answer(showCorrect = false) {
    let allCorrect = true;

    // Check properties
    PROPERTIES.forEach(prop => {
        const input = document.getElementById(`input-${prop}`);
        if (givenProperties.includes(prop)) return;

        input.classList.remove('correct', 'incorrect');
        const value = input.value.trim();

        if (!value) {
            input.classList.add('incorrect');
            allCorrect = false;
            if (showCorrect) input.value = format_value(currentState[prop], prop);
            return;
        }

        try {
            const parsed = parseFloat(value);
            if (isNaN(parsed)) throw new Error('Not a number');

            const truth = currentState[prop];
            const error = Math.abs((parsed - truth) / truth);

            if (error <= TOLERANCE) {
                input.classList.add('correct');
            } else {
                input.classList.add('incorrect');
                allCorrect = false;
                if (showCorrect) input.value = format_value(truth, prop);
            }
        } catch {
            input.classList.add('incorrect');
            allCorrect = false;
            if (showCorrect) input.value = format_value(currentState[prop], prop);
        }
    });

    // Check phase
    const phaseSelect = document.getElementById('phase-select');
    phaseSelect.classList.remove('correct', 'incorrect');
    if (phaseSelect.value === currentState.phase) {
        phaseSelect.classList.add('correct');
    } else {
        phaseSelect.classList.add('incorrect');
        allCorrect = false;
        if (showCorrect) phaseSelect.value = currentState.phase;
    }

    // Check quality (only for saturated)
    const qualityInput = document.getElementById('input-x');
    qualityInput.classList.remove('correct', 'incorrect');

    if (currentState.phase === 'saturated') {
        const qVal = qualityInput.value.trim();
        if (!qVal) {
            qualityInput.classList.add('incorrect');
            allCorrect = false;
            if (showCorrect) qualityInput.value = currentState.x.toFixed(4);
        } else {
            try {
                const parsed = parseFloat(qVal);
                const error = Math.abs((parsed - currentState.x) / currentState.x);
                if (error <= TOLERANCE) {
                    qualityInput.classList.add('correct');
                } else {
                    qualityInput.classList.add('incorrect');
                    allCorrect = false;
                    if (showCorrect) qualityInput.value = currentState.x.toFixed(4);
                }
            } catch {
                qualityInput.classList.add('incorrect');
                allCorrect = false;
                if (showCorrect) qualityInput.value = currentState.x.toFixed(4);
            }
        }
    }

    return allCorrect;
}

function show_feedback(allCorrect, isSubmit) {
    const feedback = document.getElementById('feedback-section');
    feedback.classList.add('show');
    feedback.classList.remove('success', 'error');

    if (allCorrect) {
        feedback.classList.add('success');
        feedback.textContent = '✓ All correct!';
    } else if (isSubmit) {
        feedback.classList.add('error');
        feedback.textContent = 'Correct values shown. Study and try again!';
    } else {
        feedback.classList.add('error');
        feedback.textContent = 'Some answers need correction.';
    }
}

// ===== Table Population (Sonntag-style) =====

// Nice temperature increments for saturation table
const SAT_TEMPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75,
    80, 85, 90, 95, 100, 110, 120, 130, 140, 150, 160, 170, 180,
    190, 200, 220, 240, 260, 280, 300, 320, 340, 360, 370];

// Nice pressure increments for saturation table
const SAT_PRESSURES = [1, 5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500,
    750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000];

// Nice pressure values for superheated table
const SUPER_PRESSURES = [10, 50, 100, 200, 300, 400, 500, 750, 1000,
    1500, 2000, 3000, 5000, 7500, 10000];

function find_nearest_entry_by_temp(targetT) {
    const data = saturationData.by_temperature;
    let best = data[0];
    let bestDiff = Math.abs(data[0].T_C - targetT);

    for (const d of data) {
        const diff = Math.abs(d.T_C - targetT);
        if (diff < bestDiff) {
            best = d;
            bestDiff = diff;
        }
    }
    return best;
}

function find_nearest_entry_by_pressure(targetP) {
    const data = saturationData.by_temperature;
    let best = data[0];
    let bestDiff = Math.abs(data[0].P_kPa - targetP);

    for (const d of data) {
        const diff = Math.abs(d.P_kPa - targetP);
        if (diff < bestDiff) {
            best = d;
            bestDiff = diff;
        }
    }
    return best;
}

function populate_saturation_table_by_temp() {
    const tbody = document.getElementById('sat-tbody-temp');
    tbody.innerHTML = '';

    SAT_TEMPS.forEach(T => {
        const d = find_nearest_entry_by_temp(T);
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${T.toFixed(0)}</td>
      <td>${d.P_kPa.toFixed(2)}</td>
      <td>${d.v_f.toExponential(3)}</td>
      <td>${d.v_g.toExponential(3)}</td>
      <td>${d.h_f.toFixed(1)}</td>
      <td>${d.h_g.toFixed(1)}</td>
      <td>${d.s_f.toFixed(4)}</td>
      <td>${d.s_g.toFixed(4)}</td>
    `;
        tbody.appendChild(row);
    });
}

function populate_saturation_table_by_pres() {
    const tbody = document.getElementById('sat-tbody-pres');
    tbody.innerHTML = '';

    SAT_PRESSURES.forEach(P => {
        const d = find_nearest_entry_by_pressure(P);
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${P.toFixed(0)}</td>
      <td>${d.T_C.toFixed(2)}</td>
      <td>${d.v_f.toExponential(3)}</td>
      <td>${d.v_g.toExponential(3)}</td>
      <td>${d.h_f.toFixed(1)}</td>
      <td>${d.h_g.toFixed(1)}</td>
      <td>${d.s_f.toFixed(4)}</td>
      <td>${d.s_g.toFixed(4)}</td>
    `;
        tbody.appendChild(row);
    });
}

function populate_superheated_table() {
    const tbody = document.getElementById('super-tbody');
    tbody.innerHTML = '';

    const allPressures = [...new Set(superheatedData.map(d => d.P_kPa))].sort((a, b) => a - b);

    SUPER_PRESSURES.forEach(targetP => {
        // Find closest available pressure
        let P = allPressures.reduce((prev, curr) =>
            Math.abs(curr - targetP) < Math.abs(prev - targetP) ? curr : prev
        );

        const T_sat = get_saturation_temperature(P);

        // Add pressure header row - show target pressure
        const headerRow = document.createElement('tr');
        headerRow.className = 'pressure-header';
        headerRow.innerHTML = `<td colspan="6">P = ${targetP.toFixed(0)} kPa (T_sat = ${T_sat.toFixed(1)}°C)</td>`;
        tbody.appendChild(headerRow);

        // Get data at this pressure, superheated only
        const atP = superheatedData.filter(d => d.P_kPa === P && d.phase !== 'liquid' && d.T_C > T_sat);
        atP.sort((a, b) => a.T_C - b.T_C);

        // Select temperature entries at ~50°C intervals
        const startT = Math.ceil((T_sat + 10) / 50) * 50;
        for (let T = startT; T <= 800; T += 50) {
            // Find entry closest to this temperature
            const entry = atP.reduce((prev, curr) =>
                !prev || Math.abs(curr.T_C - T) < Math.abs(prev.T_C - T) ? curr : prev
                , null);

            if (entry && Math.abs(entry.T_C - T) < 30) {
                const row = document.createElement('tr');
                row.innerHTML = `
          <td></td>
          <td>${T.toFixed(0)}</td>
          <td>${entry.v_m3kg.toExponential(3)}</td>
          <td>${entry.h_kJkg.toFixed(1)}</td>
          <td>${entry.s_kJkgK.toFixed(4)}</td>
          <td>${entry.u_kJkg.toFixed(1)}</td>
        `;
                tbody.appendChild(row);
            }
        }
    });
}

// ===== Event Handlers =====

function setup_event_handlers() {
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const theme = document.body.getAttribute('data-theme');
        document.body.setAttribute('data-theme', theme === 'light' ? 'dark' : 'light');
    });

    document.getElementById('restart-btn').addEventListener('click', restart_quiz);

    document.getElementById('view-tables-btn').addEventListener('click', () => {
        document.getElementById('table-modal').classList.add('show');
    });

    document.querySelector('.close-btn').addEventListener('click', () => {
        document.getElementById('table-modal').classList.remove('show');
    });

    // Main tabs (Saturation / Superheated)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(`${e.target.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Sub-tabs (By Temperature / By Pressure)
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.subtab).classList.add('active');
        });
    });

    document.getElementById('phase-select').addEventListener('change', (e) => {
        const qHeader = document.getElementById('quality-header');
        const qCell = document.getElementById('quality-cell');
        if (e.target.value === 'superheated') {
            qHeader.classList.add('hidden');
            qCell.classList.add('hidden');
        } else {
            qHeader.classList.remove('hidden');
            qCell.classList.remove('hidden');
        }
    });

    document.getElementById('check-btn').addEventListener('click', () => {
        const allCorrect = check_answer(false);
        show_feedback(allCorrect, false);
    });

    document.getElementById('submit-btn').addEventListener('click', () => {
        const allCorrect = check_answer(true);
        show_feedback(allCorrect, true);
    });

    document.getElementById('table-modal').addEventListener('click', (e) => {
        if (e.target.id === 'table-modal') {
            e.target.classList.remove('show');
        }
    });
}

function restart_quiz() {
    document.getElementById('feedback-section').classList.remove('show', 'success', 'error');

    currentState = generate_random_state();
    givenProperties = select_given_properties(currentState);

    render_property_row(givenProperties, currentState);

    console.log('State:', currentState);
    console.log('Given:', givenProperties);
}

// ===== Init =====

async function init() {
    if (!(await initialize_data())) return;

    setup_event_handlers();
    populate_saturation_table_by_temp();
    populate_saturation_table_by_pres();
    populate_superheated_table();
    restart_quiz();
}

document.addEventListener('DOMContentLoaded', init);
