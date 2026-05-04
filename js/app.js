const menuData = [
    { id: 'ssma', title: 'SSMA', icon: 'fa-shield-alt', mainFile: 'dash_ssma.html', key: 'resp_ssma', def: 'Segurança do Trabalho',
        submenus: [{ id: 'ssma_ocorrencias', title: 'Lançar Ocorrências', file: 'ssma_ocorrencias.html', key: 'resp_ssma', def: 'Segurança do Trabalho' }] },
    { id: 'rh', title: 'RH', icon: 'fa-users', mainFile: 'rh.html', key: 'resp_rh', def: 'Responsável RH',
        submenus: [{ id: 'rh_painel', title: 'Lançamentos e Painel', file: 'rh.html', key: 'resp_rh', def: 'Responsável RH' }] },
    { id: 'operacional', title: 'OPERACIONAL', icon: 'fa-truck', mainFile: 'dash_operacional.html', key: 'resp_operacional', def: 'Jilcleiton / Daniel Lemos',
        submenus: [
            { id: 'op_frentes', title: 'Lançar Frentes', file: 'op_frentes.html', key: 'resp_operacional', def: 'Jilcleiton / Daniel Lemos' },
            { id: 'op_pbtc', title: 'Indicadores PBTC', file: 'op_pbtc.html', key: 'resp_operacional', def: 'Jilcleiton / Daniel Lemos' }
        ] },
    { id: 'manutencao', title: 'MANUTENÇÃO', icon: 'fa-tools', mainFile: 'dash_manutencao.html', key: 'resp_manutencao', def: 'Gestão de Frota',
        submenus: [
            { id: 'man_dm', title: 'Apontamentos DM', file: 'man_dm.html', key: 'resp_manutencao', def: 'Gestão de Frota' },
            { id: 'man_sinistros', title: 'Registrar Sinistros', file: 'man_sinistros.html', key: 'resp_manutencao', def: 'Gestão de Frota' }
        ] },
    { id: 'consideracoes', title: 'CONSIDERAÇÕES', icon: 'fa-clipboard-list', mainFile: 'dash_consideracoes.html', key: 'resp_geral', def: 'Diretoria',
        submenus: [
            { id: 'cons_resumo', title: 'Resumo da Reunião', file: 'cons_resumo.html', key: 'resp_geral', def: 'Diretoria' },
            { id: 'cons_historico', title: 'Histórico de Metas', file: 'cons_historico.html', key: 'resp_geral', def: 'Diretoria' }
        ] }
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
            <a href="#" id="link-${menu.id}" class="menu-link" onclick="handleMenuInteraction(event, this, '${menu.title} - INDICADORES GERAIS', '${menu.mainFile}', '${menu.key}', '${menu.def}')">
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
    if (event) event.preventDefault();
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

        if (!['dash_consideracoes.html', 'cons_historico.html', 'conf_sistema.html'].includes(fileName)) {
            injectKanbanLauncher(subTitle);
        }

    } catch (e) {
        contentArea.innerHTML = `<div class="kpi-card" style="border-color: var(--vermelho);"><h3>Erro ao carregar</h3><p>Verifique o arquivo <b>views/${fileName}</b></p></div>`;
    }
}

// INJEÇÃO DO KANBAN LAUNCHER COM MÚLTIPLOS RESPONSÁVEIS
function injectKanbanLauncher(setorTitle) {
    const contentArea = document.getElementById('content-area');
    const setorNome = setorTitle.split('-')[0].trim();
    const hoje = new Date().toISOString().split('T')[0];
    
    const launcherHtml = `
    <div class="content-panel kpi-card kanban-form-container" style="margin-top: 40px; border-left: 5px solid var(--primary);">
        <h3 class="nav-label" style="color: var(--primary); margin-bottom: 20px; font-size: 1rem;">
            <i class="fas fa-bullseye"></i> METAS A CUMPRIR E CONSIDERAÇÕES DO DIA (KANBAN)
        </h3>
        <div class="form-grid">
            <div class="input-group">
                <label style="color: var(--text-dim); font-size: 0.8rem; margin-bottom: 5px; display: block;">Setor</label>
                <input type="text" id="kb-setor" class="config-input" value="${setorNome}" readonly style="background: rgba(0,0,0,0.2);">
            </div>
            
            <div class="input-group">
                <label style="color: var(--text-dim); font-size: 0.8rem; margin-bottom: 5px; display: block;">Responsável(is) pela Ação</label>
                <div style="display: flex; gap: 10px;">
                    <select id="kb-responsavel" class="config-input" style="flex: 1;"></select>
                    <button type="button" class="btn-salvar" style="padding: 10px 15px;" onclick="adicionarResponsavelKb()"><i class="fas fa-plus"></i></button>
                </div>
                <!-- Div onde as "Tags" de pessoas selecionadas vão aparecer -->
                <div id="kb-responsaveis-list" style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;"></div>
                <input type="hidden" id="kb-responsavel-final" value="">
            </div>

            <div class="input-group">
                <label style="color: var(--text-dim); font-size: 0.8rem; margin-bottom: 5px; display: block;">Previsão de Conclusão</label>
                <input type="date" id="kb-data" class="config-input" value="${hoje}">
            </div>
            <div class="input-group" style="grid-column: 1 / -1;">
                <label style="color: var(--text-dim); font-size: 0.8rem; margin-bottom: 5px; display: block;">Meta / Ação Principal</label>
                <input type="text" id="kb-meta" class="config-input" placeholder="Ex: Ajustar o indicador PBTC para cálculo de média até as 14h">
            </div>
            <div class="input-group" style="grid-column: 1 / -1;">
                <label style="color: var(--text-dim); font-size: 0.8rem; margin-bottom: 5px; display: block;">Considerações Adicionais (Opcional)</label>
                <textarea id="kb-consideracao" class="config-input" rows="2" placeholder="Observações do dia..."></textarea>
            </div>
        </div>
        <div style="margin-top: 15px; display: flex; justify-content: flex-end; align-items: center;">
            <span id="kb-msg" style="margin-right: 20px; font-weight: bold; font-size: 0.9rem;"></span>
            <button class="btn-salvar" onclick="salvarKanbanItem()">
                <i class="fas fa-share-square"></i> Enviar para o Quadro
            </button>
        </div>
    </div>`;
    
    contentArea.insertAdjacentHTML('beforeend', launcherHtml);
    carregarDropdownResponsaveis();
}

function carregarDropdownResponsaveis() {
    const select = document.getElementById('kb-responsavel');
    if(!select) return;
    
    const membrosSalvos = JSON.parse(localStorage.getItem('membros_kanban') || '[]');
    let options = '<option value="">Selecione para adicionar...</option>';
    
    membrosSalvos.forEach(m => {
        options += `<option value="${m.nome}">${m.nome} (${m.setor})</option>`;
    });

    if (membrosSalvos.length === 0) {
        options += `<option value="">Cadastre as pessoas no Menu Configurações</option>`;
    }
    
    select.innerHTML = options;
}

window.adicionarResponsavelKb = function() {
    const select = document.getElementById('kb-responsavel');
    const nome = select.value;
    if (!nome) return;
    
    let finalInput = document.getElementById('kb-responsavel-final');
    let lista = finalInput.value ? finalInput.value.split(' | ') : [];
    
    if (!lista.includes(nome)) {
        lista.push(nome);
        finalInput.value = lista.join(' | ');
        renderResponsaveisKb();
    }
}

window.removerResponsavelKb = function(nome) {
    let finalInput = document.getElementById('kb-responsavel-final');
    let lista = finalInput.value.split(' | ').filter(n => n !== nome);
    finalInput.value = lista.join(' | ');
    renderResponsaveisKb();
}

window.renderResponsaveisKb = function() {
    const container = document.getElementById('kb-responsaveis-list');
    const finalInput = document.getElementById('kb-responsavel-final');
    if (!finalInput.value) { container.innerHTML = ''; return; }
    
    const lista = finalInput.value.split(' | ');
    container.innerHTML = lista.map(nome => 
        `<span class="badge-setor" style="background: var(--primary); color: white; display: flex; align-items: center; gap: 8px; padding: 6px 12px;">
            <i class="fas fa-user-circle"></i> ${nome} 
            <i class="fas fa-times" style="cursor:pointer; color: #f43f5e;" onclick="removerResponsavelKb('${nome}')" title="Remover"></i>
        </span>`
    ).join('');
}

window.salvarKanbanItem = async function() {
    const setor = document.getElementById('kb-setor').value;
    const responsavel = document.getElementById('kb-responsavel-final').value;
    const meta = document.getElementById('kb-meta').value;
    const data_previsao = document.getElementById('kb-data').value;
    const consideracao = document.getElementById('kb-consideracao').value;
    const msg = document.getElementById('kb-msg');

    if(!meta || !responsavel) { 
        msg.style.color = 'var(--vermelho)'; 
        msg.innerText = 'Preencha a Meta e adicione ao menos um Responsável no botão (+) !'; 
        return; 
    }

    const item = { 
        id: Date.now(), 
        setor: setor, 
        responsavel: responsavel, 
        meta: meta, 
        consideracao: consideracao, 
        data_previsao: data_previsao,
        status: 'TODO', 
        data_criacao: new Date().toISOString() 
    };

    msg.style.color = 'var(--text-dim)'; msg.innerText = 'Salvando...';

    try {
        if (typeof supabase !== 'undefined' && SUPABASE_CONFIG) {
            const _supa = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
            const { error } = await _supa.from('kanban_metas').insert([item]);
            if (error) throw error;
        } else {
            throw new Error("Supabase não carregado");
        }
    } catch(e) {
        let localKanban = JSON.parse(localStorage.getItem('kanban_metas_local') || '[]');
        localKanban.push(item);
        localStorage.setItem('kanban_metas_local', JSON.stringify(localKanban));
    }

    msg.style.color = 'var(--verde)'; msg.innerText = 'Enviado para o Quadro de Considerações!';
    document.getElementById('kb-meta').value = '';
    document.getElementById('kb-consideracao').value = '';
    document.getElementById('kb-responsavel-final').value = '';
    renderResponsaveisKb(); // Limpa as tags
    setTimeout(() => msg.innerText = '', 4000);
}

async function sincronizarNomesDoBanco() {
    try {
        const { createClient } = supabase;
        const _supa = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        const { data } = await _supa.from('configuracoes').select('chave, valor');
        if (data) {
            data.forEach(item => localStorage.setItem(item.chave, item.valor));
        }
    } catch (e) {}
}

function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('pt-BR');
}

function iniciarReuniao() {
    const splash = document.getElementById('splash-screen');
    splash.classList.add('hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 600);
    loadModule(null, 'SSMA - INDICADORES GERAIS', 'dash_ssma.html', 'resp_ssma', 'Segurança do Trabalho');
    const ssmaLink = document.getElementById('link-ssma');
    if (ssmaLink) {
        document.querySelectorAll('.menu-link, .submenu-link').forEach(l => l.classList.remove('active'));
        ssmaLink.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    sincronizarNomesDoBanco();
    setInterval(updateClock, 1000);
    updateClock();
    const splashDate = document.getElementById('splash-date');
    if (splashDate) {
        const opcoesData = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        splashDate.innerText = new Date().toLocaleDateString('pt-BR', opcoesData).toUpperCase();
    }
});