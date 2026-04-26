const menuConfig = [
    {
        id: 'rh',
        nome: 'RH',
        icone: 'fas fa-users',
        cor: '#3b82f6',
        submenus: [
            { id: 'rh_indicadores', nome: 'Indicadores', acao: 'carregarIndicadores' },
            { id: 'rh_funcionarios', nome: 'Funcionários', acao: 'carregarFuncionarios' },
            { id: 'rh_treinamentos', nome: 'Treinamentos', acao: 'carregarTreinamentos' }
        ]
    },
    {
        id: 'operacional',
        nome: 'OPERACIONAL',
        icone: 'fas fa-chart-line',
        cor: '#10b981',
        submenus: [
            { id: 'op_producao', nome: 'Produção', acao: 'carregarProducao' },
            { id: 'op_eficiencia', nome: 'Eficiência', acao: 'carregarEficiencia' },
            { id: 'op_entregas', nome: 'Entregas', acao: 'carregarEntregas' }
        ]
    },
    {
        id: 'manutencao',
        nome: 'MANUTENÇÃO',
        icone: 'fas fa-tools',
        cor: '#f59e0b',
        submenus: [
            { id: 'man_ordens', nome: 'Ordens de Serviço', acao: 'carregarOrdens' },
            { id: 'man_preventiva', nome: 'Preventiva', acao: 'carregarPreventiva' },
            { id: 'man_equipamentos', nome: 'Equipamentos', acao: 'carregarEquipamentos' }
        ]
    },
    {
        id: 'ssma',
        nome: 'SSMA',
        icone: 'fas fa-shield-alt',
        cor: '#8b5cf6',
        submenus: [
            { id: 'ssma_indicadores', nome: 'Indicadores', acao: 'carregarIndicadoresSSMA' },
            { id: 'ssma_treinamentos', nome: 'Treinamentos', acao: 'carregarTreinamentosSSMA' },
            { id: 'ssma_auditorias', nome: 'Auditorias', acao: 'carregarAuditorias' }
        ]
    },
    {
        id: 'consideracoes',
        nome: 'CONSIDERAÇÕES FINAIS',
        icone: 'fas fa-clipboard-list',
        cor: '#ef4444',
        submenus: [
            { id: 'cons_resumo', nome: 'Resumo', acao: 'carregarResumo' },
            { id: 'cons_metas', nome: 'Metas', acao: 'carregarMetas' },
            { id: 'cons_acoes', nome: 'Próximas Ações', acao: 'carregarAcoes' }
        ]
    },
    {
        id: 'configuracoes',
        nome: 'CONFIGURAÇÕES',
        icone: 'fas fa-cog',
        cor: '#6b7280',
        submenus: [
            { id: 'conf_geral', nome: 'Geral', acao: 'carregarConfigGeral' },
            { id: 'conf_usuarios', nome: 'Usuários', acao: 'carregarConfigUsuarios' },
            { id: 'conf_setores', nome: 'Setores', acao: 'carregarConfigSetores' },
            { id: 'conf_backup', nome: 'Backup', acao: 'carregarConfigBackup' }
        ]
    }
];

function loadMenu() {
    const menuList = document.getElementById('menu-list');
    if (!menuList) return;
    
    menuList.innerHTML = '';
    
    menuConfig.forEach(item => {
        const li = document.createElement('li');
        li.className = 'menu-item has-submenu';
        li.setAttribute('data-setor', item.id);
        
        li.innerHTML = `
            <i class="${item.icone}" style="color: ${item.cor}"></i>
            <span>${item.nome}</span>
            <i class="fas fa-chevron-right submenu-toggle" style="margin-left: auto; font-size: 0.75rem;"></i>
        `;
        
        // Criar submenu
        const submenuUl = document.createElement('ul');
        submenuUl.className = 'submenu';
        
        item.submenus.forEach(sub => {
            const subLi = document.createElement('li');
            subLi.className = 'submenu-item menu-item';
            subLi.setAttribute('data-submenu', sub.id);
            subLi.setAttribute('data-acao', sub.acao);
            subLi.innerHTML = `
                <i class="fas fa-circle" style="font-size: 0.5rem; width: 20px;"></i>
                <span>${sub.nome}</span>
            `;
            subLi.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window[sub.acao]) {
                    window[sub.acao]();
                } else if (window.loadModuleContent) {
                    window.loadModuleContent(item.id, sub.id);
                }
                document.querySelectorAll('.menu-item.active').forEach(el => {
                    el.classList.remove('active');
                });
                subLi.classList.add('active');
            });
            submenuUl.appendChild(subLi);
        });
        
        li.appendChild(submenuUl);
        
        li.addEventListener('click', (e) => {
            if (e.target === li || e.target.classList.contains('submenu-toggle') || e.target.parentElement === li) {
                li.classList.toggle('open');
                submenuUl.classList.toggle('open');
            }
        });
        
        menuList.appendChild(li);
    });
    
    // Abrir primeiro menu por padrão
    const firstMenu = document.querySelector('.has-submenu');
    if (firstMenu) {
        firstMenu.classList.add('open');
        firstMenu.querySelector('.submenu').classList.add('open');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        });
    }
});

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const dateTimeElement = document.getElementById('current-date-time');
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleDateString('pt-BR', options);
    }
}