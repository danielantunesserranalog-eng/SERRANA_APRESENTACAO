function getConsResumoTemplate() {
    return `
        <div class="cards-grid">
            <div class="stat-card"><div class="stat-card-header"><div class="stat-card-title">METAS GERAIS</div><i class="fas fa-flag-checkered"></i></div><div class="stat-card-value">87% <small>meta: 85%</small></div></div>
            <div class="stat-card"><div class="stat-card-header"><div class="stat-card-title">PRAZOS</div><i class="fas fa-stopwatch"></i></div><div class="stat-card-value">92% <small>meta: 95%</small></div></div>
            <div class="stat-card"><div class="stat-card-header"><div class="stat-card-title">MELHORIAS</div><i class="fas fa-chart-line"></i></div><div class="stat-card-value">12 <small>implementadas</small></div></div>
        </div>
        <div class="charts-container">
            <div class="chart-card"><div class="chart-title"><i class="fas fa-chart-line"></i> Performance Geral</div><canvas id="performanceGeralChart" class="chart-canvas"></canvas></div>
            <div class="chart-card"><div class="chart-title"><i class="fas fa-chart-pie"></i> Distribuição de Metas</div><div class="kpi-chart-wrapper"><canvas id="metasDistChart" style="max-height: 200px;"></canvas></div></div>
        </div>
    `;
}

function getConsMetasTemplate() { return `<div class="config-section"><div class="config-title"><i class="fas fa-bullseye"></i> Metas do Período</div><form><div class="form-group"><label>Setor</label><select class="form-select"><option>RH</option><option>Operacional</option><option>Manutenção</option><option>SSMA</option></select></div><div class="form-group"><label>Meta</label><input type="text" class="form-input" placeholder="Descrição da meta"></div><div class="form-group"><label>Prazo</label><input type="date" class="form-input"></div><button class="btn-primary">Registrar Meta</button></form></div>`; }
function getConsAcoesTemplate() { return `<div class="table-container"><div class="chart-title"><i class="fas fa-list-check"></i> Próximas Ações</div><table class="data-table"><thead><tr><th>Ação</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th></tr></thead><tbody><tr><td>Implementar novo sistema</td><td>Qualidade</td><td>30/01/2024</td><td><span class="kpi-indicator kpi-danger">Alta</span></td></tr><tr><td>Treinamento equipe</td><td>RH</td><td>25/01/2024</td><td><span class="kpi-indicator kpi-warning">Média</span></td></tr></tbody></table></div>`; }

window.carregarResumo = () => loadModuleContent('consideracoes', 'cons_resumo');
window.carregarMetas = () => loadModuleContent('consideracoes', 'cons_metas');
window.carregarAcoes = () => loadModuleContent('consideracoes', 'cons_acoes');

window.init_consideracoes_cons_resumo = () => {
    const ctx = document.getElementById('performanceGeralChart')?.getContext('2d');
    if (ctx) new Chart(ctx, { type: 'radar', data: { labels: ['RH', 'Operacional', 'Manutenção', 'SSMA'], datasets: [{ label: 'Performance', data: [87, 92, 85, 90], backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6' }] }, options: { responsive: true, scales: { r: { ticks: { color: '#fff' }, grid: { color: '#374151' } } } } });
    const ctx2 = document.getElementById('metasDistChart')?.getContext('2d');
    if (ctx2) new Chart(ctx2, { type: 'doughnut', data: { labels: ['Atingidas', 'Em andamento', 'Não iniciadas'], datasets: [{ data: [65, 25, 10], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#fff', font: { size: 10 } } } } } });
};