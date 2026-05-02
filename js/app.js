const menuData = [
    { 
        id: 'rh', title: 'RH', icon: 'fa-users', mainFile: 'rh.html', key: 'resp_rh', def: 'Responsável RH',
        submenus: [
            { id: 'rh_painel', title: 'Lançamentos e Painel', file: 'rh.html', key: 'resp_rh', def: 'Responsável RH' }
        ]
    },
    { 
        id: 'operacional', title: 'OPERACIONAL', icon: 'fa-truck', mainFile: 'dash_operacional.html', key: 'resp_operacional', def: 'Jilcleiton / Daniel Lemos',
        submenus: [
            { id: 'op_frentes', title: 'Lançar Frentes', file: 'op_frentes.html', key: 'resp_operacional', def: 'Jilcleiton / Daniel Lemos' },
            { id: 'op_pbtc', title: 'Indicadores PBTC', file: 'op_pbtc.html', key: 'resp_operacional', def: 'Jilcleiton / Daniel Lemos' }
        ]
    },
    { 
        id: 'manutencao', title: 'MANUTENÇÃO', icon: 'fa-tools', mainFile: 'dash_manutencao.html', key: 'resp_manutencao', def: 'Gestão de Frota',
        submenus: [
            { id: 'man_dm', title: 'Apontamentos DM', file: 'man_dm.html', key: 'resp_manutencao', def: 'Gestão de Frota' },
            { id: 'man_sinistros', title: 'Registrar Sinistros', file: 'man_sinistros.html', key: 'resp_manutencao', def: 'Gestão de Frota' }
        ]
    },
    { 
        id: 'ssma', title: 'SSMA', icon: 'fa-shield-alt', mainFile: 'dash_ssma.html', key: 'resp_ssma', def: 'Segurança do Trabalho',
        submenus: [
            { id: 'ssma_ocorrencias', title: 'Lançar Ocorrências', file: 'ssma_ocorrencias.html', key: 'resp_ssma', def: 'Segurança do Trabalho' }
        ]
    },
    { 
        id: 'consideracoes', title: 'CONSIDERAÇÕES', icon: 'fa-clipboard-list', mainFile: 'dash_consideracoes.html', key: 'resp_geral', def: 'Diretoria',
        submenus: [
            { id: 'cons_resumo', title: 'Resumo da Reunião', file: 'cons_resumo.html', key: 'resp_geral', def: 'Diretoria' }
        ]
    }
];

const configMenuData = [{
    id: 'configuracoes', title: 'CONFIGURAÇÕES', icon: 'fa-cog', mainFile: 'conf_sistema.html', key: 'none', def: 'Administrador TI',
    submenus: [{ id: 'conf_sistema', title: 'Ajustes / Responsáveis', file: 'conf_sistema.html', key: 'none', def: 'Administrador TI' }]
}];

let lastClickTime = 0;

function renderMenuElements(dataArray, containerId) {
    const list = document.getElementById(containerId);
    list.innerHTML = ''; 
    dataArray.forEach(menu => {
        const li = document.createElement('li');
        li.className = 'menu-item';
        li.innerHTML = `
            <a href="#" class="menu-link" onclick="handleMenuInteraction(event, this, '${menu.title} - INDICADORES GERAIS', '${menu.mainFile}', '${menu.key}', '${menu.def}')">
                <div class="menu-link-left"><i class="fas ${menu.icon}"></i><span>${menu.title}</span></div>
                <i class="fas fa-chevron-down arrow"></i>
            </a>
            <ul class="submenu-list">
                ${menu.submenus.map(sub => `
                    <li><a href="#" class="submenu-link" onclick="loadModule(event, '${sub.title}', '${sub.file}', '${sub.key}', '${sub.def}')">
                        <i class="fas fa-angle-right"></i><span>${sub.title}</span>
                    </a></li>
                `).join('')}
            </ul>`;
        list.appendChild(li);
    });
}

function initMenu() {
    renderMenuElements(menuData, 'menu-list');
    renderMenuElements(configMenuData, 'config-menu-list');
}

function handleMenuInteraction(event, element, title, file, key, def) {
    event.preventDefault();
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;
    loadModule(null, title, file, key, def);
    document.querySelectorAll('.menu-link, .submenu-link').forEach(l => l.classList.remove('active'));
    element.classList.add('active');
    if (timeDiff < 400 && timeDiff > 0) toggleSubmenu(element);
    lastClickTime = currentTime;
}

function toggleSubmenu(element) {
    const parentLi = element.parentElement;
    document.querySelectorAll('.menu-item').forEach(item => { if (item !== parentLi) item.classList.remove('open'); });
    parentLi.classList.toggle('open');
}

async function loadModule(event, subTitle, fileName, respKey, defName) {
    if(event) event.preventDefault();
    const contentArea = document.getElementById('content-area');
    document.getElementById('current-sector-title').innerText = subTitle;
    
    let nomeResponsavel = (respKey !== 'none') ? (localStorage.getItem(respKey) || defName) : defName;
    document.getElementById('presenter-name').innerText = nomeResponsavel;
    
    if(event && event.currentTarget) {
        document.querySelectorAll('.submenu-link, .menu-link').forEach(l => l.classList.remove('active'));
        event.currentTarget.classList.add('active');
        event.currentTarget.closest('.menu-item').querySelector('.menu-link').classList.add('active');
    }

    contentArea.innerHTML = '<div class="kpi-card" style="text-align:center; padding: 50px;"><i class="fas fa-spinner fa-spin"></i><br>Carregando...</div>';
    try {
        const resp = await fetch(`./views/${fileName}`);
        if (!resp.ok) throw new Error();
        const html = await resp.text();
        contentArea.innerHTML = html;
        contentArea.querySelectorAll('script').forEach(s => {
            const newScript = document.createElement('script');
            newScript.textContent = s.innerHTML;
            document.body.appendChild(newScript);
            document.body.removeChild(newScript);
        });
    } catch (e) {
        contentArea.innerHTML = `<div class="kpi-card" style="border-color: var(--vermelho);"><h3>Erro ao carregar</h3><p>Verifique o arquivo <b>views/${fileName}</b></p></div>`;
    }
}

async function sincronizarNomesDoBanco() {
    try {
        const { createClient } = supabase;
        const _supa = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        const { data } = await _supa.from('configuracoes').select('chave, valor');
        if (data) {
            data.forEach(item => localStorage.setItem(item.chave, item.valor));
            const currentTitle = document.getElementById('current-sector-title').innerText;
            if (currentTitle.includes('OPERACIONAL')) {
                document.getElementById('presenter-name').innerText = localStorage.getItem('resp_operacional') || 'Jilcleiton / Daniel Lemos';
            }
        }
    } catch (e) { console.log('Erro na sincronização inicial'); }
}

function updateClock() { document.getElementById('clock').innerText = new Date().toLocaleTimeString('pt-BR'); }

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    sincronizarNomesDoBanco();
    setInterval(updateClock, 1000);
    updateClock();
    loadModule(null, 'OPERACIONAL - INDICADORES GERAIS', 'dash_operacional.html', 'resp_operacional', 'Jilcleiton / Daniel');
});