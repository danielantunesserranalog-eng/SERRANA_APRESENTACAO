// Templates RH
function getRhIndicadoresTemplate() {
    return `
        <div class="cards-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">COLABORADORES</div>
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-card-value">247 <small>meta: 250</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 98%; background: #3b82f6;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">TURNOVER</div>
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <div class="stat-card-value">2.8% <small>meta: 3.0%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 93%; background: #10b981;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">TREINAMENTOS</div>
                    <i class="fas fa-chalkboard-user"></i>
                </div>
                <div class="stat-card-value">89% <small>meta: 95%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 94%; background: #f59e0b;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">ABSENTEÍSMO</div>
                    <i class="fas fa-calendar-times"></i>
                </div>
                <div class="stat-card-value">3.2% <small>meta: 3.5%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 91%; background: #8b5cf6;"></div></div>
            </div>
        </div>
        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-title"><i class="fas fa-chart-line"></i> Evolução de Colaboradores</div>
                <canvas id="rhEvolucaoChart" class="chart-canvas"></canvas>
            </div>
            <div class="chart-card">
                <div class="chart-title"><i class="fas fa-chart-pie"></i> Distribuição por Departamento</div>
                <div class="kpi-chart-wrapper"><canvas id="rhDepartamentoChart" style="max-height: 200px;"></canvas></div>
            </div>
        </div>
        <div class="table-container">
            <div class="chart-title"><i class="fas fa-table"></i> Últimas Contratações</div>
            <table class="data-table">
                <thead><tr><th>Nome</th><th>Cargo</th><th>Data</th><th>Status</th></tr></thead>
                <tbody>
                    <tr><td>João Silva</td><td>Analista Sr.</td><td>15/01/2024</td><td><span class="kpi-indicator kpi-success">Ativo</span></td></tr>
                    <tr><td>Maria Santos</td><td>Coordenadora</td><td>10/01/2024</td><td><span class="kpi-indicator kpi-success">Ativo</span></td></tr>
                    <tr><td>Pedro Costa</td><td>Desenvolvedor</td><td>05/01/2024</td><td><span class="kpi-indicator kpi-success">Ativo</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function getRhFuncionariosTemplate() {
    return `
        <div class="config-section">
            <div class="config-title"><i class="fas fa-user-plus"></i> Cadastrar Novo Funcionário</div>
            <form id="formFuncionario">
                <div class="form-group"><label class="form-label">Nome Completo</label><input type="text" class="form-input" placeholder="Digite o nome"></div>
                <div class="form-group"><label class="form-label">Cargo</label><input type="text" class="form-input" placeholder="Digite o cargo"></div>
                <div class="form-group"><label class="form-label">Departamento</label><select class="form-select"><option>RH</option><option>Operacional</option><option>Manutenção</option><option>SSMA</option></select></div>
                <div class="form-group"><label class="form-label">Data Admissão</label><input type="date" class="form-input"></div>
                <button type="submit" class="btn-primary">Cadastrar Funcionário</button>
            </form>
        </div>
        <div class="table-container">
            <div class="chart-title"><i class="fas fa-list"></i> Lista de Funcionários</div>
            <table class="data-table" id="tabelaFuncionarios">
                <thead><tr><th>Nome</th><th>Cargo</th><th>Departamento</th><th>Admissão</th><th>Ações</th></tr></thead>
                <tbody>
                    <tr><td>João Silva</td><td>Analista Sr.</td><td>RH</td><td>15/01/2024</td><td><i class="fas fa-edit" style="cursor:pointer; color:#3b82f6;"></i> <i class="fas fa-trash" style="cursor:pointer; color:#ef4444;"></i></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function getRhTreinamentosTemplate() {
    return `
        <div class="cards-grid">
            <div class="stat-card"><div class="stat-card-header"><div class="stat-card-title">TREINAMENTOS REALIZADOS</div><i class="fas fa-check-circle"></i></div><div class="stat-card-value">156 <small>meta: 150</small></div><div class="progress-bar"><div class="progress-fill" style="width: 104%; background: #10b981;"></div></div></div>
            <div class="stat-card"><div class="stat-card-header"><div class="stat-card-title">HORAS TREINADAS</div><i class="fas fa-clock"></i></div><div class="stat-card-value">1,280 <small>horas</small></div><div class="progress-bar"><div class="progress-fill" style="width: 85%; background: #3b82f6;"></div></div></div>
            <div class="stat-card"><div class="stat-card-header"><div class="stat-card-title">SATISFAÇÃO</div><i class="fas fa-star"></i></div><div class="stat-card-value">4.8 <small>/5.0</small></div><div class="progress-bar"><div class="progress-fill" style="width: 96%; background: #f59e0b;"></div></div></div>
        </div>
        <div class="table-container">
            <div class="chart-title"><i class="fas fa-calendar"></i> Próximos Treinamentos</div>
            <table class="data-table">
                <thead><tr><th>Treinamento</th><th>Data</th><th>Instrutor</th><th>Vagas</th><th>Status</th></tr></thead>
                <tbody>
                    <tr><td>NR-10</td><td>25/01/2024</td><td>Carlos Souza</td><td>15/30</td><td><span class="kpi-indicator kpi-warning">Agendado</span></td></tr>
                    <tr><td>Gestão de Equipes</td><td>30/01/2024</td><td>Ana Paula</td><td>8/20</td><td><span class="kpi-indicator kpi-warning">Agendado</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

window.carregarIndicadores = () => loadModuleContent('rh', 'rh_indicadores');
window.carregarFuncionarios = () => loadModuleContent('rh', 'rh_funcionarios');
window.carregarTreinamentos = () => loadModuleContent('rh', 'rh_treinamentos');

window.init_rh_indicadores = () => {
    const ctx1 = document.getElementById('rhEvolucaoChart')?.getContext('2d');
    const ctx2 = document.getElementById('rhDepartamentoChart')?.getContext('2d');
    if (ctx1) new Chart(ctx1, { type: 'line', data: { labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'], datasets: [{ label: 'Colaboradores', data: [220, 230, 235, 240, 245, 247], borderColor: '#3b82f6', tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: true } });
    if (ctx2) new Chart(ctx2, { type: 'doughnut', data: { labels: ['Operacional', 'RH', 'Manutenção', 'SSMA'], datasets: [{ data: [120, 45, 52, 30], backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'] }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: '#fff', font: { size: 10 } } } } } });
};