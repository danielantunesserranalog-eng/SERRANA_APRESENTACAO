// Templates Manutenção
function getManOrdensTemplate() {
    return `
        <div class="cards-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">ORDENS ABERTAS</div>
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <div class="stat-card-value">12 <small>meta: 15</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 80%; background: #10b981;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">MTBF</div>
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-card-value">520h <small>meta: 500h</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 104%; background: #3b82f6;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">MTTR</div>
                    <i class="fas fa-hourglass-half"></i>
                </div>
                <div class="stat-card-value">2.5h <small>meta: 3h</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 83%; background: #f59e0b;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">DISPONIBILIDADE</div>
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-card-value">97.5% <small>meta: 96%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 102%; background: #8b5cf6;"></div></div>
            </div>
        </div>
        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-title"><i class="fas fa-chart-bar"></i> Ordens por Tipo</div>
                <canvas id="ordensTipoChart" class="chart-canvas"></canvas>
            </div>
            <div class="chart-card">
                <div class="chart-title"><i class="fas fa-chart-pie"></i> Distribuição por Prioridade</div>
                <div class="kpi-chart-wrapper"><canvas id="ordensPrioridadeChart" style="max-height: 200px;"></canvas></div>
            </div>
        </div>
        <div class="table-container">
            <div class="chart-title"><i class="fas fa-tools"></i> Ordens de Serviço em Andamento</div>
            <table class="data-table">
                <thead>
                    <tr><th>OS</th><th>Equipamento</th><th>Tipo</th><th>Prioridade</th><th>Abertura</th><th>Status</th></tr>
                </thead>
                <tbody>
                    <tr><td>OS-001</td><td>Máquina A - Prensa</td><td>Corretiva</td><td><span class="kpi-indicator kpi-danger">Alta</span></td><td>10/01/2024</td><td><span class="kpi-indicator kpi-warning">Em andamento</span></td></tr>
                    <tr><td>OS-002</td><td>Esteira Transportadora</td><td>Preventiva</td><td><span class="kpi-indicator kpi-success">Baixa</span></td><td>12/01/2024</td><td><span class="kpi-indicator kpi-success">Concluída</span></td></tr>
                    <tr><td>OS-003</td><td>Compressor Central</td><td>Corretiva</td><td><span class="kpi-indicator kpi-danger">Alta</span></td><td>14/01/2024</td><td><span class="kpi-indicator kpi-warning">Aguardando peça</span></td></tr>
                    <tr><td>OS-004</td><td>Sistema Elétrico</td><td>Preventiva</td><td><span class="kpi-indicator kpi-warning">Média</span></td><td>13/01/2024</td><td><span class="kpi-indicator kpi-warning">Em andamento</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function getManPreventivaTemplate() {
    return `
        <div class="cards-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">PREVENTIVAS REALIZADAS</div>
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-card-value">85% <small>meta: 90%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 94%; background: #10b981;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">EQUIPAMENTOS REVISADOS</div>
                    <i class="fas fa-microchip"></i>
                </div>
                <div class="stat-card-value">42 <small>de 50</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 84%; background: #3b82f6;"></div></div>
            </div>
        </div>
        <div class="config-section">
            <div class="config-title"><i class="fas fa-calendar-alt"></i> Plano de Manutenção Preventiva - Janeiro/2024</div>
            <canvas id="preventivaChart" style="height: 350px;"></canvas>
        </div>
        <div class="table-container">
            <div class="chart-title"><i class="fas fa-list"></i> Cronograma de Manutenções</div>
            <table class="data-table">
                <thead>
                    <tr><th>Equipamento</th><th>Frequência</th><th>Próxima Data</th><th>Responsável</th><th>Status</th></tr>
                </thead>
                <tbody>
                    <tr><td>Prensa Hidráulica</td><td>Mensal</td><td>25/01/2024</td><td>Equipe Elétrica</td><td><span class="kpi-indicator kpi-warning">Agendado</span></td></tr>
                    <tr><td>Compressor</td><td>Semanal</td><td>20/01/2024</td><td>Equipe Mecânica</td><td><span class="kpi-indicator kpi-success">Realizado</span></td></tr>
                    <tr><td>Sistema de Refrigeração</td><td>Quinzenal</td><td>22/01/2024</td><td>Equipe Geral</td><td><span class="kpi-indicator kpi-warning">Agendado</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function getManEquipamentosTemplate() {
    return `
        <div class="config-section">
            <div class="config-title"><i class="fas fa-plus-circle"></i> Cadastrar Novo Equipamento</div>
            <form id="formEquipamento">
                <div class="form-group">
                    <label class="form-label">Nome do Equipamento</label>
                    <input type="text" class="form-input" placeholder="Ex: Prensa Hidráulica Modelo X">
                </div>
                <div class="form-group">
                    <label class="form-label">Número de Série</label>
                    <input type="text" class="form-input" placeholder="Número de série">
                </div>
                <div class="form-group">
                    <label class="form-label">Localização</label>
                    <input type="text" class="form-input" placeholder="Setor / Local">
                </div>
                <div class="form-group">
                    <label class="form-label">Data da Última Manutenção</label>
                    <input type="date" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-select">
                        <option>Operacional</option>
                        <option>Em Manutenção</option>
                        <option>Parado</option>
                        <option>Aguardando Peça</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Cadastrar Equipamento</button>
            </form>
        </div>
        <div class="table-container">
            <div class="chart-title"><i class="fas fa-microchip"></i> Lista de Equipamentos</div>
            <table class="data-table">
                <thead>
                    <tr><th>Equipamento</th><th>Série</th><th>Localização</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    <tr><td>Prensa Hidráulica</td><td>PR-001</td><td>Setor A</td><td><span class="kpi-indicator kpi-success">Operacional</span></td><td><i class="fas fa-edit" style="cursor:pointer; color:#3b82f6;"></i> <i class="fas fa-trash" style="cursor:pointer; color:#ef4444;"></i></td></tr>
                    <tr><td>Compressor Industrial</td><td>CP-002</td><td>Setor B</td><td><span class="kpi-indicator kpi-warning">Em Manutenção</span></td><td><i class="fas fa-edit" style="cursor:pointer; color:#3b82f6;"></i> <i class="fas fa-trash" style="cursor:pointer; color:#ef4444;"></i></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// Funções de navegação
window.carregarOrdens = () => loadModuleContent('manutencao', 'man_ordens');
window.carregarPreventiva = () => loadModuleContent('manutencao', 'man_preventiva');
window.carregarEquipamentos = () => loadModuleContent('manutencao', 'man_equipamentos');

// Inicializadores de gráficos
window.init_manutencao_man_ordens = () => {
    const ctx = document.getElementById('ordensTipoChart')?.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Preventiva', 'Corretiva', 'Urgente', 'Preditiva'],
                datasets: [{
                    label: 'Quantidade',
                    data: [25, 15, 5, 8],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { labels: { color: '#fff' } } },
                scales: {
                    y: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                    x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } }
                }
            }
        });
    }
    
    const ctx2 = document.getElementById('ordensPrioridadeChart')?.getContext('2d');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Alta', 'Média', 'Baixa'],
                datasets: [{ data: [30, 45, 25], backgroundColor: ['#ef4444', '#f59e0b', '#10b981'], borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#fff', font: { size: 10 } } } }
            }
        });
    }
};

window.init_manutencao_man_preventiva = () => {
    const ctx = document.getElementById('preventivaChart')?.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                datasets: [{ label: 'Manutenções Realizadas', data: [8, 10, 12, 15], borderColor: '#3b82f6', fill: true, backgroundColor: 'rgba(59, 130, 246, 0.1)' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { labels: { color: '#fff' } } },
                scales: {
                    y: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                    x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } }
                }
            }
        });
    }
};