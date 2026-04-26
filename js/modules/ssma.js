function getSsmaIndicadoresTemplate() {
    return `
        <div class="cards-grid">
            <div class="stat-card"><div class="stat-card-header"><div class="stat-card-title">DIAS SEM ACIDENTE</div><i class="fas fa-calendar-check"></i></div><div class="stat-card-value">180 <small>meta: 365</small></div><div class="progress-bar"><div class="progress-fill" style="width: 49%; background: #10b981;"></div></div></div>
            <div class="stat-card"><div class="stat-card-header"><div class="stat-card-title">TREINAMENTOS SSMA</div><i class="fas fa-chalkboard-user"></i></div><div class="stat-card-value">156 <small>participantes</small></div></div>
            <div class="stat-card"><div class="stat-card-header"><div class="stat-card-title">RECICLAGEM</div><i class="fas fa-recycle"></i></div><div class="stat-card-value">2,500kg <small>meta: 3,000kg</small></div></div>
        </div>
        <div class="charts-container">
            <div class="chart-card"><div class="chart-title"><i class="fas fa-chart-line"></i> Evolução de Acidentes</div><canvas id="acidentesChart" class="chart-canvas"></canvas></div>
            <div class="chart-card"><div class="chart-title"><i class="fas fa-chart-pie"></i> Distribuição por Tipo</div><div class="kpi-chart-wrapper"><canvas id="ssmaTipoChart" style="max-height: 200px;"></canvas></div></div>
        </div>
    `;
}

function getSsmaTreinamentosTemplate() { return `<div class="table-container"><div class="chart-title"><i class="fas fa-certificate"></i> Treinamentos Realizados</div><table class="data-table"><thead><tr><th>Treinamento</th><th>Data</th><th>Participantes</th><th>Aproveitamento</th></tr></thead><tbody><tr><td>NR-10</td><td>10/01/2024</td><td>25</td><td>98%</td></tr></tbody></table></div>`; }
function getSsmaAuditoriasTemplate() { return `<div class="config-section"><div class="config-title"><i class="fas fa-clipboard-check"></i> Agendar Auditoria</div><form><div class="form-group"><label>Tipo</label><select class="form-select"><option>Interna</option><option>Externa</option></select></div><div class="form-group"><label>Data</label><input type="date" class="form-input"></div><button class="btn-primary">Agendar</button></form></div>`; }

window.carregarIndicadoresSSMA = () => loadModuleContent('ssma', 'ssma_indicadores');
window.carregarTreinamentosSSMA = () => loadModuleContent('ssma', 'ssma_treinamentos');
window.carregarAuditorias = () => loadModuleContent('ssma', 'ssma_auditorias');

window.init_ssma_ssma_indicadores = () => {
    const ctx = document.getElementById('acidentesChart')?.getContext('2d');
    if (ctx) new Chart(ctx, { type: 'line', data: { labels: ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], datasets: [{ label: 'Acidentes', data: [2, 1, 0, 0, 0, 0], borderColor: '#ef4444', fill: true }] }, options: { responsive: true } });
    const ctx2 = document.getElementById('ssmaTipoChart')?.getContext('2d');
    if (ctx2) new Chart(ctx2, { type: 'doughnut', data: { labels: ['Segurança', 'Saúde', 'Meio Ambiente'], datasets: [{ data: [60, 25, 15], backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#fff', font: { size: 10 } } } } } });
};