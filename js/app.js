const menuData = [
    { 
        id: 'consideracoes', 
        title: 'CONSIDERAÇÕES', 
        icon: 'fa-clipboard-list', 
        submenus: [
            { id: 'cons_resumo', title: 'Resumo da Reunião', file: 'cons_resumo.html', key: 'resp_geral', def: 'Diretoria' }
        ]
    },
    { 
        id: 'rh', 
        title: 'RH', 
        icon: 'fa-users', 
        submenus: [
            { id: 'rh_apontamentos', title: 'Apontamentos Diários', file: 'rh_apontamentos.html', key: 'resp_rh', def: 'Responsável RH' },
            { id: 'rh_jornada', title: 'Jornadas e Escalas', file: 'rh_jornada.html', key: 'resp_rh', def: 'Responsável RH' }
        ]
    },
    { 
        id: 'operacional', 
        title: 'OPERACIONAL', 
        icon: 'fa-truck', 
        submenus: [
            { id: 'op_frentes', title: 'Lançar Frentes', file: 'op_frentes.html', key: 'resp_operacional', def: 'Anderson Lemos' },
            { id: 'op_pbtc', title: 'Indicadores PBTC', file: 'op_pbtc.html', key: 'resp_operacional', def: 'Anderson Lemos' }
        ]
    },
    { 
        id: 'manutencao', 
        title: 'MANUTENÇÃO', 
        icon: 'fa-tools', 
        submenus: [
            { id: 'man_dm', title: 'Apontamentos DM', file: 'man_dm.html', key: 'resp_manutencao', def: 'Gestão de Frota' },
            { id: 'man_sinistros', title: 'Registrar Sinistros', file: 'man_sinistros.html', key: 'resp_manutencao', def: 'Gestão de Frota' }
        ]
    },
    { 
        id: 'ssma', 
        title: 'SSMA', 
        icon: 'fa-shield-alt', 
        submenus: [
            { id: 'ssma_ocorrencias', title: 'Lançar Ocorrências', file: 'ssma_ocorrencias.html', key: 'resp_ssma', def: 'Segurança do Trabalho' }
        ]
    }
];

const configMenuData = [
    {
        id: 'configuracoes',
        title: 'CONFIGURAÇÕES',
        icon: 'fa-cog',
        submenus: [
            { id: 'conf_sistema', title: 'Ajustes do Sistema / Responsáveis', file: 'conf_sistema.html', key: 'none', def: 'Administrador TI' }
        ]
    }
];

function renderMenuElements(dataArray, containerId) {
    const list = document.getElementById(containerId);
    list.innerHTML = ''; 

    dataArray.forEach(menu => {
        const li = document.createElement('li');
        li.className = 'menu-item';
        
        let html = `
            <a href="#" class="menu-link" onclick="toggleSubmenu(event, this)">
                <div class="menu-link-left">
                    <i class="fas ${menu.icon}"></i>
                    <span>${menu.title}</span>
                </div>
                <i class="fas fa-chevron-right arrow"></i>
            </a>
            <ul class="submenu-list">
        `;

        menu.submenus.forEach(sub => {
            html += `
                <li>
                    <a href="#" class="submenu-link" onclick="loadModule(event, '${sub.title}', '${sub.file}', '${sub.key}', '${sub.def}')">
                        <i class="fas fa-angle-right"></i>
                        <span>${sub.title}</span>
                    </a>
                </li>
            `;
        });

        html += `</ul>`;
        li.innerHTML = html;
        list.appendChild(li);
    });
}

function initMenu() {
    renderMenuElements(menuData, 'menu-list');
    renderMenuElements(configMenuData, 'config-menu-list');
}

function toggleSubmenu(event, element) {
    event.preventDefault();
    const parentLi = element.parentElement;
    
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item !== parentLi) {
            item.classList.remove('open');
            item.querySelector('.menu-link').classList.remove('active');
        }
    });

    parentLi.classList.toggle('open');
    element.classList.toggle('active');
}

async function loadModule(event, subTitle, fileName, respKey, defName) {
    if(event) event.preventDefault();
    
    const contentArea = document.getElementById('content-area');
    
    // Atualiza cabeçalho
    document.getElementById('current-sector-title').innerText = subTitle;

    // Lógica inteligente: Puxa o nome salvo ou usa o padrão
    let nomeResponsavel = defName;
    if(respKey !== 'none') {
        nomeResponsavel = localStorage.getItem(respKey) || defName;
    }
    document.getElementById('presenter-name').innerText = nomeResponsavel;
    
    // Destaca menu ativo
    if(event) {
        document.querySelectorAll('.submenu-link').forEach(l => l.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }

    contentArea.innerHTML = '<div class="kpi-card" style="text-align:center; padding: 50px;">Carregando dados...</div>';

    try {
        const resp = await fetch(`views/${fileName}`);
        if (!resp.ok) throw new Error('Arquivo não encontrado');
        
        const html = await resp.text();
        contentArea.innerHTML = html;
        
        // Ativa scripts
        const scripts = contentArea.querySelectorAll('script');
        scripts.forEach(s => {
            const newScript = document.createElement('script');
            newScript.textContent = s.innerHTML;
            document.body.appendChild(newScript);
            document.body.removeChild(newScript);
        });
        
    } catch (e) {
        contentArea.innerHTML = `
            <div class="kpi-card" style="border-color: var(--vermelho);">
                <h3 style="color: var(--vermelho);"><i class="fas fa-exclamation-triangle"></i> Arquivo Ausente</h3>
                <p style="margin-top: 10px; color: var(--text-dim);">Não foi possível encontrar a tela <b>views/${fileName}</b>.</p>
                <p style="color: var(--text-dim); font-size: 0.9rem; margin-top: 5px;">Você precisa criar esse arquivo para ver os dados.</p>
            </div>
        `;
    }
}

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR');
}

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    setInterval(updateClock, 1000);
    updateClock();
});