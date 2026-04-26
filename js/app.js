// ARQUIVO COMPLETO: js/app.js
const menuData = [
    { 
        id: 'rh', 
        title: 'RH', 
        icon: 'fa-users', 
        mainFile: 'dash_rh.html', 
        key: 'resp_rh', 
        def: 'Responsável RH',
        submenus: [
            { id: 'rh_apontamentos', title: 'Apontamentos Diários', file: 'rh_apontamentos.html', key: 'resp_rh', def: 'Responsável RH' },
            { id: 'rh_jornada', title: 'Jornadas e Escalas', file: 'rh_jornada.html', key: 'resp_rh', def: 'Responsável RH' }
        ]
    },
    { 
        id: 'operacional', 
        title: 'OPERACIONAL', 
        icon: 'fa-truck', 
        mainFile: 'dash_operacional.html', 
        key: 'resp_operacional', 
        def: 'Anderson Lemos',
        submenus: [
            { id: 'op_frentes', title: 'Lançar Frentes', file: 'op_frentes.html', key: 'resp_operacional', def: 'Anderson Lemos' },
            { id: 'op_pbtc', title: 'Indicadores PBTC', file: 'op_pbtc.html', key: 'resp_operacional', def: 'Anderson Lemos' }
        ]
    },
    { 
        id: 'manutencao', 
        title: 'MANUTENÇÃO', 
        icon: 'fa-tools', 
        mainFile: 'dash_manutencao.html', 
        key: 'resp_manutencao', 
        def: 'Gestão de Frota',
        submenus: [
            { id: 'man_dm', title: 'Apontamentos DM', file: 'man_dm.html', key: 'resp_manutencao', def: 'Gestão de Frota' },
            { id: 'man_sinistros', title: 'Registrar Sinistros', file: 'man_sinistros.html', key: 'resp_manutencao', def: 'Gestão de Frota' }
        ]
    },
    { 
        id: 'ssma', 
        title: 'SSMA', 
        icon: 'fa-shield-alt', 
        mainFile: 'dash_ssma.html', 
        key: 'resp_ssma', 
        def: 'Segurança do Trabalho',
        submenus: [
            { id: 'ssma_ocorrencias', title: 'Lançar Ocorrências', file: 'ssma_ocorrencias.html', key: 'resp_ssma', def: 'Segurança do Trabalho' }
        ]
    },
    { 
        id: 'consideracoes', 
        title: 'CONSIDERAÇÕES', 
        icon: 'fa-clipboard-list', 
        mainFile: 'dash_consideracoes.html', 
        key: 'resp_geral', 
        def: 'Diretoria',
        submenus: [
            { id: 'cons_resumo', title: 'Resumo da Reunião', file: 'cons_resumo.html', key: 'resp_geral', def: 'Diretoria' }
        ]
    }
];

const configMenuData = [
    {
        id: 'configuracoes',
        title: 'CONFIGURAÇÕES',
        icon: 'fa-cog',
        mainFile: 'conf_sistema.html',
        key: 'none',
        def: 'Administrador TI',
        submenus: [
            { id: 'conf_sistema', title: 'Ajustes / Responsáveis', file: 'conf_sistema.html', key: 'none', def: 'Administrador TI' }
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
            <a href="#" class="menu-link" onclick="handleMenuInteraction(event, this, '${menu.title} - INDICADORES GERAIS', '${menu.mainFile}', '${menu.key}', '${menu.def}')">
                <div class="menu-link-left">
                    <i class="fas ${menu.icon}"></i>
                    <span>${menu.title}</span>
                </div>
                <i class="fas fa-chevron-down arrow"></i>
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

let lastClickTime = 0;

function handleMenuInteraction(event, element, title, file, key, def) {
    event.preventDefault();
    
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;
    
    loadModule(null, title, file, key, def);
    
    document.querySelectorAll('.menu-link, .submenu-link').forEach(l => l.classList.remove('active'));
    element.classList.add('active');

    if (timeDiff < 400 && timeDiff > 0) {
        toggleSubmenu(element);
    }
    
    lastClickTime = currentTime;
}

function toggleSubmenu(element) {
    const parentLi = element.parentElement;
    
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item !== parentLi) {
            item.classList.remove('open');
        }
    });

    parentLi.classList.toggle('open');
}

async function loadModule(event, subTitle, fileName, respKey, defName) {
    if(event) event.preventDefault();
    
    const contentArea = document.getElementById('content-area');
    document.getElementById('current-sector-title').innerText = subTitle;

    let nomeResponsavel = defName;
    if(respKey !== 'none') {
        nomeResponsavel = localStorage.getItem(respKey) || defName;
    }
    document.getElementById('presenter-name').innerText = nomeResponsavel;
    
    if(event && event.currentTarget) {
        document.querySelectorAll('.submenu-link, .menu-link').forEach(l => l.classList.remove('active'));
        event.currentTarget.classList.add('active');
        event.currentTarget.closest('.menu-item').querySelector('.menu-link').classList.add('active');
    }

    contentArea.innerHTML = '<div class="kpi-card" style="text-align:center; padding: 50px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary); margin-bottom:15px;"></i><br>Carregando dados do setor...</div>';

    try {
        const resp = await fetch(`views/${fileName}`);
        if (!resp.ok) throw new Error('Arquivo não encontrado');
        
        const html = await resp.text();
        contentArea.innerHTML = html;
        
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
                <h3 style="color: var(--vermelho);"><i class="fas fa-exclamation-triangle"></i> Tela de Indicadores Pendente</h3>
                <p style="margin-top: 10px; color: var(--text-dim);">O arquivo <b>views/${fileName}</b> ainda não foi criado.</p>
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
    
    loadModule(null, 'OPERACIONAL - INDICADORES GERAIS', 'dash_operacional.html', 'resp_operacional', 'Anderson Lemos');
});