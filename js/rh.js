// ARQUIVO: js/rh.js
// Inicializa a conexão com o Supabase usando a configuração global do sistema

if (!window.supabaseClientGlobal && typeof supabase !== 'undefined' && typeof SUPABASE_CONFIG !== 'undefined') {
    window.supabaseClientGlobal = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
}
const _supa = window.supabaseClientGlobal;

function obterDataHoje() {
    return '2099-12-31'; // Data fixa do RH
}

window.salvarDadosRH = async function(msgId = 'msg-rh-1', isSilent = false) {
    const msg = document.getElementById(msgId);
    if (msg && !isSilent) {
        msg.style.color = 'var(--text-dim)';
        msg.innerText = "Salvando no banco de dados...";
    }
    
    const dados = {
        data_registro: obterDataHoje(),
        headcount: parseInt(document.getElementById('input-headcount')?.value || 0),
        atestados: parseInt(document.getElementById('input-atestados')?.value || 0),
        afastamentos: parseInt(document.getElementById('input-afastamentos')?.value || 0),
        admissoes: parseInt(document.getElementById('input-admissoes')?.value || 0),
        integracoes: parseInt(document.getElementById('input-integracoes')?.value || 0),
        
        mural_avisos: JSON.stringify(window.listasRH.avisos_rh || []),
        mural_liberacoes: JSON.stringify(window.listasRH.liberacoes_rh || []),
        
        mural_aniversariantes: document.getElementById('input-aniversariantes-rh')?.value || null,
        mural_calendario: document.getElementById('input-calendario-rh')?.value || null
    };
    
    try {
        if (!_supa) throw new Error("Conexão com Supabase não estabelecida.");
        
        const { data: existe } = await _supa.from('rh_indicadores').select('id').eq('data_registro', obterDataHoje()).limit(1);
        
        let erroBanco = null;
        
        if (existe && existe.length > 0) {
            const { error } = await _supa.from('rh_indicadores').update(dados).eq('data_registro', obterDataHoje());
            erroBanco = error;
        } else {
            const { error } = await _supa.from('rh_indicadores').insert([dados]);
            erroBanco = error;
        }
        
        if (erroBanco) {
            if (msg && !isSilent) { msg.style.color = 'var(--vermelho)'; msg.innerText = "ERRO NO BANCO: " + erroBanco.message; }
            return;
        }
        
        if (msg && !isSilent) {
            msg.style.color = 'var(--verde)'; msg.innerText = "Salvo no banco com sucesso!";
            setTimeout(() => msg.innerText = "", 4000);
        }
    } catch (err) {
        if (msg && !isSilent) { msg.style.color = 'var(--vermelho)'; msg.innerText = "Falha de conexão ao tentar salvar!"; }
    }
}

window.limparMuralRH = async function(idMural) {
    if(!confirm("Tem certeza que deseja apagar todos os itens desta lista? Esta ação não pode ser desfeita.")) {
        return;
    }
    const el = document.getElementById(idMural);
    if(el) el.value = '';
    await window.salvarDadosRH('msg-murais-rh', true);
    const msg = document.getElementById('msg-murais-rh');
    if(msg) {
        msg.style.color = 'var(--verde)'; msg.innerText = "Lista limpa com sucesso!";
        setTimeout(() => msg.innerText = "", 3000);
    }
}

window.adicionarVaga = async function() {
    const cargo = document.getElementById('vaga-cargo').value;
    const setor = document.getElementById('vaga-setor').value;
    const qtd = document.getElementById('vaga-qtd').value;

    if(!cargo || !setor || !qtd) { alert("Preencha o Cargo, Setor e a Quantidade para adicionar a vaga!"); return; }

    try {
        const { error } = await _supa.from('rh_vagas').insert([{ cargo: cargo, setor: setor, quantidade: parseInt(qtd), status: 'Aberta' }]);
        if (error) { alert("ERRO NO BANCO: " + error.message); return; }
        
        document.getElementById('vaga-cargo').value = '';
        document.getElementById('vaga-setor').value = '';
        document.getElementById('vaga-qtd').value = '';
        window.carregarDadosRH();
    } catch (err) { alert("Erro de conexão. Verifique sua rede."); }
}

window.concluirVaga = async function(id) {
    if(confirm("Deseja marcar esta vaga como concluída?")) {
        try {
            const { error } = await _supa.from('rh_vagas').update({ status: 'Concluída' }).eq('id', id);
            if (error) { alert("ERRO NO BANCO: " + error.message); return; }
            window.carregarDadosRH();
        } catch (err) { alert("Falha de conexão."); }
    }
}

window.carregarDadosRH = async function() {
    if (!_supa) return;
    
    function safeParseMuralRH(str) {
        if (!str || str.trim() === '') return [];
        try {
            let parsed = JSON.parse(str);
            if (Array.isArray(parsed)) return parsed;
            return [];
        } catch(e) {
            return [{ id: Date.now(), data: new Date().toISOString().split('T')[0], texto: str }];
        }
    }

    try {
        const { data: indData, error: indError } = await _supa.from('rh_indicadores').select('*').order('data_registro', { ascending: false }).limit(1);
        
        if (!indError && indData && indData.length > 0) {
            const dados = indData[0];
            
            if(document.getElementById('input-headcount')) document.getElementById('input-headcount').value = dados.headcount || '';
            if(document.getElementById('input-atestados')) document.getElementById('input-atestados').value = dados.atestados || '';
            if(document.getElementById('input-afastamentos')) document.getElementById('input-afastamentos').value = dados.afastamentos || '';
            if(document.getElementById('input-admissoes')) document.getElementById('input-admissoes').value = dados.admissoes || '';
            if(document.getElementById('input-integracoes')) document.getElementById('input-integracoes').value = dados.integracoes || '';
            
            if (window.listasRH) {
                window.listasRH.avisos_rh = safeParseMuralRH(dados.mural_avisos);
                window.listasRH.liberacoes_rh = safeParseMuralRH(dados.mural_liberacoes);

                if(typeof window.renderizarListaMuralRH === 'function') {
                    window.renderizarListaMuralRH('avisos_rh');
                    window.renderizarListaMuralRH('liberacoes_rh');
                }
            }
            
            if(document.getElementById('input-aniversariantes-rh')) document.getElementById('input-aniversariantes-rh').value = dados.mural_aniversariantes || '';
            if(document.getElementById('input-calendario-rh')) document.getElementById('input-calendario-rh').value = dados.mural_calendario || '';
            
            if(document.getElementById('val-headcount')) document.getElementById('val-headcount').innerText = dados.headcount || 0;
            if(document.getElementById('val-atestados')) document.getElementById('val-atestados').innerText = dados.atestados || 0;
            if(document.getElementById('val-afastamentos')) document.getElementById('val-afastamentos').innerText = dados.afastamentos || 0;
            if(document.getElementById('val-admissoes')) document.getElementById('val-admissoes').innerText = dados.admissoes || 0;
            if(document.getElementById('val-integracoes')) document.getElementById('val-integracoes').innerText = dados.integracoes || 0;
            
            if(typeof window.renderizarListaApresentacaoRH === 'function') {
                window.renderizarListaApresentacaoRH('mural-avisos-rh', dados.mural_avisos, 'var(--amarelo)');
                window.renderizarListaApresentacaoRH('mural-liberacoes-rh', dados.mural_liberacoes, '#0ea5e9');
            }

            if(typeof window.gerarAniversariantesVisual === 'function') { window.gerarAniversariantesVisual(dados.mural_aniversariantes || ''); } 
            if(typeof window.gerarCalendarioVisual === 'function') { window.gerarCalendarioVisual(dados.mural_calendario || ''); }
        }
        
        const { data: vagas, error: vagasError } = await _supa.from('rh_vagas').select('*').eq('status', 'Aberta').order('data_criacao', { ascending: false });

        let totalVagas = 0; let listaVagas = [];
        if (!vagasError && vagas) { listaVagas = vagas; vagas.forEach(v => { totalVagas += parseInt(v.quantidade || 0); }); }

        if(document.getElementById('val-vagas')) document.getElementById('val-vagas').innerText = totalVagas;
        
        const tbodyLancamento = document.getElementById('tabela-vagas-lancamento');
        if (tbodyLancamento) {
            if (listaVagas.length === 0) { tbodyLancamento.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-dim);">Nenhuma vaga em aberto no momento.</td></tr>'; } 
            else { tbodyLancamento.innerHTML = listaVagas.map(v => `<tr style="background: rgba(255,255,255,0.02);"><td style="color: white; font-weight: bold; border-bottom: 1px solid var(--border); padding: 12px;">${v.cargo}</td><td style="color: var(--text-dim); border-bottom: 1px solid var(--border); padding: 12px;"><i class="fas fa-building"></i> ${v.setor}</td><td style="color: var(--amarelo); font-weight: bold; text-align: center; border-bottom: 1px solid var(--border); padding: 12px;">${v.quantidade}</td><td style="text-align: right; border-bottom: 1px solid var(--border); padding: 12px;"><button class="btn-kanban" style="display:inline-block; background: var(--verde);" onclick="concluirVaga(${v.id})" title="Marcar como Concluída"><i class="fas fa-check"></i> Concluir</button></td></tr>`).join(''); }
        }
        
        const tbodyDash = document.getElementById('tabela-vagas-dash');
        if (tbodyDash) {
            if (listaVagas.length === 0) { tbodyDash.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-dim);">Todas as vagas foram preenchidas!</td></tr>'; } 
            else { tbodyDash.innerHTML = listaVagas.map(v => `<tr style="background: rgba(255,255,255,0.02);"><td style="color: white; font-weight: bold; border-bottom: 1px solid var(--border); padding: 12px;">${v.cargo}</td><td style="color: var(--text-dim); border-bottom: 1px solid var(--border); padding: 12px;"><i class="fas fa-building"></i> ${v.setor}</td><td style="text-align: center; border-bottom: 1px solid var(--border); padding: 12px;"><span class="badge bg-amarelo">${v.quantidade} Vaga(s)</span></td></tr>`).join(''); }
        }

    } catch (err) { console.error("Erro geral ao puxar dados do banco:", err); }
}

window.carregarDadosRH();