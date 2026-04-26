// Dashboard Manager
let currentSetor = 'rh';
let charts = {};

// Função principal para carregar dashboard
window.loadDashboard = function(setorId) {
    currentSetor = setorId;
    const data = getSetorData(setorId);
    
    // Atualizar título
    document.getElementById('setor-title').textContent = data.titulo;
    document.getElementById('setor-subtitle').textContent = data.subtitulo;
    
    // Renderizar dashboard
    renderDashboard(data);
};

// Renderizar dashboard completo
function renderDashboard(data) {
    const container = document.getElementById('dashboard-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading" id="dashboard-loading">
            <div class="spinner"></div>
        </div>
    `;
    
    // Simular carregamento para melhor experiência
    setTimeout(() => {
        const dashboardHTML = `
            <!-- Cards de Estatísticas -->
            <div class="cards-grid">
                ${generateStatCards(data.stats)}
            </div>
            
            <!-- Gráficos -->
            <div class="charts-container">
                <div class="chart-card">
                    <div class="chart-title">
                        <i class="fas fa-chart-line"></i>
                        <span>Desempenho por Indicador</span>
                    </div>
                    <canvas id="performanceChart" class="chart-canvas"></canvas>
                </div>
                <div class="chart-card">
                    <div class="chart-title">
                        <i class="fas fa-chart-pie"></i>
                        <span>Distribuição de KPIs</span>
                    </div>
                    <canvas id="kpiChart" class="chart-canvas"></canvas>
                </div>
            </div>
            
            <!-- KPIs -->
            <div class="cards-grid">
                ${generateKPICards(data.kpis)}
            </div>
            
            <!-- Tabela de Dados -->
            <div class="table-container">
                <div class="chart-title">
                    <i class="fas fa-table"></i>
                    <span>${getTableTitle(currentSetor)}</span>
                </div>
                ${generateDataTable(currentSetor, data)}
            </div>
        `;
        
        container.innerHTML = dashboardHTML;
        
        // Inicializar gráficos após renderizar
        initCharts(data);
    }, 500);
}

// Gerar cards de estatísticas
function generateStatCards(stats) {
    return Object.entries(stats).map(([key, stat]) => `
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-title">${formatStatName(key)}</div>
                <i class="${getStatIcon(key)}"></i>
            </div>
            <div class="stat-card-value">
                ${stat.valor.toLocaleString()} ${stat.unidade}
                <small style="font-size: 0.875rem; color: ${stat.valor >= stat.meta ? '#10b981' : '#f59e0b'}">
                    meta: ${stat.meta} ${stat.unidade}
                </small>
            </div>
            <div style="margin-top: 0.5rem;">
                <div style="background: var(--bg-primary); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: ${stat.valor >= stat.meta ? 'var(--success)' : 'var(--accent-warning)'}; 
                                width: ${Math.min((stat.valor / stat.meta) * 100, 100)}%; 
                                height: 100%; transition: width 1s ease;">
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Gerar cards de KPIs
function generateKPICards(kpis) {
    return kpis.map(kpi => `
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-title">${kpi.nome}</div>
                <i class="fas fa-chart-simple"></i>
            </div>
            <div class="stat-card-value">
                ${kpi.valor}%
                <span class="kpi-indicator kpi-${kpi.tipo}" style="margin-left: 0.5rem;">
                    ${kpi.valor >= kpi.meta ? '✓ Meta alcançada' : '↺ Em progresso'}
                </span>
            </div>
            <div style="margin-top: 0.5rem;">
                <div style="background: var(--bg-primary); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: var(--accent-primary); 
                                width: ${(kpi.valor / kpi.meta) * 100}%; 
                                height: 100%; transition: width 1s ease;">
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Gerar tabela de dados específica por setor
function generateDataTable(setor, data) {
    switch(setor) {
        case 'rh':
            return `
                <table class="data-table">
                    <thead>
                        <tr><th>Nome</th><th>Cargo</th><th>Data Contratação</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${data.ultimasContratacoes.map(item => `
                            <tr>
                                <td>${item.nome}</td>
                                <td>${item.cargo}</td>
                                <td>${item.data}</td>
                                <td><span class="kpi-indicator kpi-success">${item.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        case 'operacional':
            return `
                <table class="data-table">
                    <thead><tr><th>Cliente</th><th>Produto</th><th>Quantidade</th><th>Status</th></tr></thead>
                    <tbody>
                        ${data.ultimasEntregas.map(item => `
                            <tr>
                                <td>${item.cliente}</td>
                                <td>${item.produto}</td>
                                <td>${item.quantidade}</td>
                                <td><span class="kpi-indicator ${item.status === 'Entregue' ? 'kpi-success' : 'kpi-warning'}">${item.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        case 'manutencao':
            return `
                <table class="data-table">
                    <thead><tr><th>Equipamento</th><th>Tipo</th><th>Data</th><th>Status</th></tr></thead>
                    <tbody>
                        ${data.ultimasManutencoes.map(item => `
                            <tr>
                                <td>${item.equipamento}</td>
                                <td>${item.tipo}</td>
                                <td>${item.data}</td>
                                <td><span class="kpi-indicator ${item.status === 'Concluída' ? 'kpi-success' : 'kpi-warning'}">${item.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        case 'ssma':
            return `
                <table class="data-table">
                    <thead><tr><th>Ação</th><th>Data</th><th>Participantes</th><th>Status</th></tr></thead>
                    <tbody>
                        ${data.ultimasAcoes.map(item => `
                            <tr>
                                <td>${item.acao}</td>
                                <td>${item.data}</td>
                                <td>${item.participantes}</td>
                                <td><span class="kpi-indicator kpi-success">${item.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        case 'consideracoes':
            return `
                <table class="data-table">
                    <thead><tr><th>Item</th><th>Prazo</th><th>Responsável</th><th>Prioridade</th></tr></thead>
                    <tbody>
                        ${data.proximosPassos.map(item => `
                            <tr>
                                <td>${item.item}</td>
                                <td>${item.prazo}</td>
                                <td>${item.responsavel}</td>
                                <td><span class="kpi-indicator ${item.prioridade === 'Alta' ? 'kpi-danger' : 'kpi-warning'}">${item.prioridade}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        default:
            return '<p>Nenhum dado disponível</p>';
    }
}

// Inicializar gráficos
function initCharts(data) {
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    
    // Gráfico de desempenho
    const performanceCtx = document.getElementById('performanceChart')?.getContext('2d');
    if (performanceCtx && window.Chart) {
        charts.performance = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
                datasets: [{
                    label: 'Desempenho Real',
                    data: [65, 72, 78, 82, 85, 87],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Meta',
                    data: [70, 75, 80, 85, 85, 85],
                    borderColor: '#10b981',
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    y: {
                        grid: { color: '#374151' },
                        ticks: { color: '#9ca3af' }
                    },
                    x: {
                        grid: { color: '#374151' },
                        ticks: { color: '#9ca3af' }
                    }
                }
            }
        });
    }
    
    // Gráfico de KPIs
    const kpiCtx = document.getElementById('kpiChart')?.getContext('2d');
    if (kpiCtx && window.Chart && data.kpis) {
        charts.kpi = new Chart(kpiCtx, {
            type: 'doughnut',
            data: {
                labels: data.kpis.map(k => k.nome),
                datasets: [{
                    data: data.kpis.map(k => k.valor),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }
}

// Funções utilitárias
function formatStatName(key) {
    const names = {
        colaboradores: 'Colaboradores',
        turnover: 'Turnover',
        treinamentos: 'Treinamentos',
        absenteismo: 'Absenteísmo',
        producao: 'Produção',
        eficiencia: 'Eficiência',
        disponibilidade: 'Disponibilidade',
        qualidade: 'Qualidade',
        ordensAbertas: 'Ordens Abertas',
        mtbf: 'MTBF',
        mttr: 'MTTR',
        acidentes: 'Acidentes',
        diasSemAcidente: 'Dias sem Acidente',
        reciclagem: 'Reciclagem',
        entregas: 'Entregas',
        prazos: 'Prazos',
        melhorias: 'Melhorias'
    };
    return names[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function getStatIcon(key) {
    const icons = {
        colaboradores: 'fas fa-user-friends',
        turnover: 'fas fa-exchange-alt',
        treinamentos: 'fas fa-chalkboard-user',
        absenteismo: 'fas fa-calendar-times',
        producao: 'fas fa-industry',
        eficiencia: 'fas fa-tachometer-alt',
        disponibilidade: 'fas fa-clock',
        qualidade: 'fas fa-check-circle',
        ordensAbertas: 'fas fa-clipboard-list',
        mtbf: 'fas fa-chart-line',
        mttr: 'fas fa-hourglass-half',
        acidentes: 'fas fa-exclamation-triangle',
        diasSemAcidente: 'fas fa-calendar-check',
        reciclagem: 'fas fa-recycle',
        entregas: 'fas fa-truck',
        prazos: 'fas fa-stopwatch',
        melhorias: 'fas fa-chart-line'
    };
    return icons[key] || 'fas fa-chart-simple';
}

function getTableTitle(setor) {
    const titles = {
        rh: 'Últimas Contratações',
        operacional: 'Últimas Entregas',
        manutencao: 'Últimas Manutenções',
        ssma: 'Últimas Ações SSMA',
        consideracoes: 'Próximos Passos'
    };
    return titles[setor] || 'Dados Recentes';
}

// Event listener para botão de refresh
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (currentSetor) {
                loadDashboard(currentSetor);
            }
        });
    }
});