// Templates Operacional
function getOpProducaoTemplate() {
    return `
        <div class="cards-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">PRODUÇÃO (UN)</div>
                    <i class="fas fa-industry"></i>
                </div>
                <div class="stat-card-value">15,420 <small>meta: 15,000</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 103%; background: #10b981;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">EFICIÊNCIA</div>
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <div class="stat-card-value">92.5% <small>meta: 90%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 103%; background: #3b82f6;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">DISPONIBILIDADE</div>
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-card-value">96.8% <small>meta: 95%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 102%; background: #f59e0b;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">QUALIDADE</div>
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-card-value">98.2% <small>meta: 97%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 101%; background: #8b5cf6;"></div></div>
            </div>
        </div>
        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-title"><i class="fas fa-chart-line"></i> Produção Diária - Última Semana</div>
                <canvas id="producaoDiariaChart" class="chart-canvas"></canvas>
            </div>
            <div class="chart-card">
                <div class="chart-title"><i class="fas fa-chart-pie"></i> Distribuição por Linha de Produção</div>
                <div class="kpi-chart-wrapper"><canvas id="producaoLinhaChart" style="max-height: 200px;"></canvas></div>
            </div>
        </div>
        <div class="table-container">
            <div class="chart-title"><i class="fas fa-truck"></i> Últimas Entregas Realizadas</div>
            <table class="data-table">
                <thead>
                    <tr><th>Cliente</th><th>Produto</th><th>Quantidade</th><th>Data Entrega</th><th>Status</th></tr>
                </thead>
                <tbody>
                    <tr><td>Empresa ABC</td><td>Produto X</td><td>1,500</td><td>15/01/2024</td><td><span class="kpi-indicator kpi-success">Entregue</span></td></tr>
                    <tr><td>Distribuidora XYZ</td><td>Produto Y</td><td>2,300</td><td>14/01/2024</td><td><span class="kpi-indicator kpi-success">Entregue</span></td></tr>
                    <tr><td>Indústria 123</td><td>Produto Z</td><td>1,800</td><td>13/01/2024</td><td><span class="kpi-indicator kpi-warning">Em andamento</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function getOpEficienciaTemplate() {
    return `
        <div class="config-section">
            <div class="config-title"><i class="fas fa-chart-line"></i> Indicadores de Eficiência por Setor</div>
            <canvas id="eficienciaChart" style="height: 350px;"></canvas>
        </div>
        <div class="cards-grid" style="margin-top: 1.5rem;">
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">OEE GLOBAL</div>
                    <i class="fas fa-chart-simple"></i>
                </div>
                <div class="stat-card-value">85% <small>meta: 82%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 104%; background: #10b981;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">CICLO MÉDIO</div>
                    <i class="fas fa-hourglass-half"></i>
                </div>
                <div class="stat-card-value">2.5h <small>meta: 2.8h</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 89%; background: #3b82f6;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">SETUP</div>
                    <i class="fas fa-cogs"></i>
                </div>
                <div class="stat-card-value">45min <small>meta: 40min</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 89%; background: #f59e0b;"></div></div>
            </div>
        </div>
    `;
}

function getOpEntregasTemplate() {
    return `
        <div class="cards-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">ENTREGAS NO PRAZO</div>
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-card-value">94% <small>meta: 95%</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 99%; background: #10b981;"></div></div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">SATISFAÇÃO DO CLIENTE</div>
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-card-value">4.7 <small>/5.0</small></div>
                <div class="progress-bar"><div class="progress-fill" style="width: 94%; background: #3b82f6;"></div></div>
            </div>
        </div>
        <div class="table-container">
            <div class="chart-title"><i class="fas fa-truck-fast"></i> Histórico de Entregas</div>
            <table class="data-table" id="tabelaEntregas">
                <thead>
                    <tr><th>Pedido</th><th>Cliente</th><th>Produto</th><th>Quantidade</th><th>Data</th><th>Status</th></tr>
                </thead>
                <tbody>
                    <tr><td>#001</td><td>Empresa ABC</td><td>Produto X</td><td>1,500</td><td>15/01/2024</td><td><span class="kpi-indicator kpi-success">Concluído</span></td></tr>
                    <tr><td>#002</td><td>Distribuidora XYZ</td><td>Produto Y</td><td>2,300</td><td>14/01/2024</td><td><span class="kpi-indicator kpi-success">Concluído</span></td></tr>
                    <tr><td>#003</td><td>Indústria 123</td><td>Produto Z</td><td>1,800</td><td>16/01/2024</td><td><span class="kpi-indicator kpi-warning">Em rota</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// Funções de navegação
window.carregarProducao = () => loadModuleContent('operacional', 'op_producao');
window.carregarEficiencia = () => loadModuleContent('operacional', 'op_eficiencia');
window.carregarEntregas = () => loadModuleContent('operacional', 'op_entregas');

// Inicializadores de gráficos
window.init_operacional_op_producao = () => {
    const ctx = document.getElementById('producaoDiariaChart')?.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
                datasets: [{
                    label: 'Produção (unidades)',
                    data: [2100, 2350, 2280, 2450, 2580, 1860],
                    backgroundColor: '#3b82f6',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: '#fff' } }
                },
                scales: {
                    y: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                    x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } }
                }
            }
        });
    }
    
    const ctx2 = document.getElementById('producaoLinhaChart')?.getContext('2d');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Linha A', 'Linha B', 'Linha C'],
                datasets: [{
                    data: [45, 35, 20],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#fff', font: { size: 10 } } }
                }
            }
        });
    }
};

window.init_operacional_op_eficiencia = () => {
    const ctx = document.getElementById('eficienciaChart')?.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
                datasets: [
                    { label: 'Eficiência Real', data: [85, 87, 89, 91, 90, 92.5], borderColor: '#3b82f6', tension: 0.4, fill: false },
                    { label: 'Meta', data: [85, 85, 87, 88, 89, 90], borderColor: '#f59e0b', borderDash: [5, 5], tension: 0.4, fill: false }
                ]
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