// ARQUIVO: js/rh.js
// Inicializa a conexão com o Supabase usando a configuração global do sistema

if (!window.supabaseClientGlobal && typeof supabase !== 'undefined' && typeof SUPABASE_CONFIG !== 'undefined') {
    window.supabaseClientGlobal = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
}
const _supa = window.supabaseClientGlobal;

// Mantemos uma data fixa apenas como referência de segurança no banco
function obterDataMestra() {
    return '2099-12-31';
}

window.salvarDadosRH = async function(msgId = 'msg-rh-1', isSilent = false) {
    const msg = document.getElementById(msgId);
    if (msg && !isSilent) {
        msg.style.color = 'var(--text-dim)';
        msg.innerText = "Salvando alterações...";
    }
    
    const dados = {
        data_registro: obterDataMestra(),
        headcount: parseInt(document.getElementById('input-headcount')?.value || 0),
        atestados: parseInt(document.getElementById('input-atestados')?.value || 0),
        afastamentos: parseInt(document.getElementById('input-afastamentos')?.value || 0),
        admissoes: parseInt(document.getElementById('input-admissoes')?.value || 0),
        integracoes: parseInt(document.getElementById('input-integracoes')?.value || 0),
        sgt: parseInt(document.getElementById('input-sgt')?.value || 0),
        
        mural_avisos: JSON.stringify(window.listasRH.avisos_rh || []),
        mural_liberacoes: JSON.stringify(window.listasRH.liberacoes_rh || []),
        
        mural_aniversariantes: document.getElementById('input-aniversariantes-rh')?.value || null,
        mural_calendario: document.getElementById('input-calendario-rh')?.value || null
    };
    
    try {
        if (!_supa) throw new Error("Conexão com Supabase não estabelecida.");
        
        // BUSCA SEMPRE O PRIMEIRO REGISTRO EXISTENTE (Não importa a data)
        const { data: registros } = await _supa.from('rh_indicadores').select('id').limit(1);
        
        let erroBanco = null;
        
        if (registros && registros.length > 0) {
            // Se já existe uma linha, ATUALIZA ela pelo ID único
            const { error } = await _supa.from('rh_indicadores').update(dados).eq('id', registros[0].id);
            erroBanco = error;
        } else {
            // Se a tabela estiver totalmente vazia, cria a primeira linha
            const { error } = await _supa.from('rh_indicadores').insert([dados]);
            erroBanco = error;
        }
        
        if (erroBanco) {
            if (msg && !isSilent) { msg.style.color = 'var(--vermelho)'; msg.innerText = "ERRO: " + erroBanco.message; }
            return;
        }
        
        if (msg && !isSilent) {
            msg.style.color = 'var(--verde)'; msg.innerText = "Dados atualizados com sucesso!";
            setTimeout(() => msg.innerText = "", 4000);
        }
    } catch (err) {
        if (msg && !isSilent) { msg.style.color = 'var(--vermelho)'; msg.innerText = "Falha de conexão!"; }
    }
}

window.carregarDadosRH = async function() {
    if (!_supa) return;
    
    function safeParseMuralRH(str) {
        if (!str || str.trim() === '') return [];
        try {
            let parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed : [];
        } catch(e) { return []; }
    }

    try {
        // BUSCA SEMPRE O REGISTRO MAIS RECENTE PARA PREENCHER OS CAMPOS
        const { data: indData, error: indError } = await _supa.from('rh_indicadores').select('*').limit(1);
        
        if (!indError && indData && indData.length > 0) {
            const dados = indData[0];
            
            // Preenche os inputs de lançamento (para você não perder o que já digitou)
            if(document.getElementById('input-headcount')) document.getElementById('input-headcount').value = dados.headcount || 0;
            if(document.getElementById('input-atestados')) document.getElementById('input-atestados').value = dados.atestados || 0;
            if(document.getElementById('input-afastamentos')) document.getElementById('input-afastamentos').value = dados.afastamentos || 0;
            if(document.getElementById('input-admissoes')) document.getElementById('input-admissoes').value = dados.admissoes || 0;
            if(document.getElementById('input-integracoes')) document.getElementById('input-integracoes').value = dados.integracoes || 0;
            if(document.getElementById('input-sgt')) document.getElementById('input-sgt').value = dados.sgt || 0;
            
            if(document.getElementById('input-aniversariantes-rh')) document.getElementById('input-aniversariantes-rh').value = dados.mural_aniversariantes || '';
            if(document.getElementById('input-calendario-rh')) document.getElementById('input-calendario-rh').value = dados.mural_calendario || '';

            // Atualiza as listas internas
            if (window.listasRH) {
                window.listasRH.avisos_rh = safeParseMuralRH(dados.mural_avisos);
                window.listasRH.liberacoes_rh = safeParseMuralRH(dados.mural_liberacoes);
                if(typeof window.renderizarListaMuralRH === 'function') {
                    window.renderizarListaMuralRH('avisos_rh');
                    window.renderizarListaMuralRH('liberacoes_rh');
                }
            }
            
            // Atualiza os valores visuais no Dashboard
            const atualizarTexto = (id, valor) => {
                const el = document.getElementById(id);
                if(el) el.innerText = valor || 0;
            };

            atualizarTexto('val-headcount', dados.headcount);
            atualizarTexto('val-atestados', dados.atestados);
            atualizarTexto('val-afastamentos', dados.afastamentos);
            atualizarTexto('val-admissoes', dados.admissoes);
            atualizarTexto('val-integracoes', dados.integracoes);
            atualizarTexto('val-sgt', dados.sgt);
            
            if(typeof window.renderizarListaApresentacaoRH === 'function') {
                window.renderizarListaApresentacaoRH('mural-avisos-rh', dados.mural_avisos, 'var(--amarelo)');
                window.renderizarListaApresentacaoRH('mural-liberacoes-rh', dados.mural_liberacoes, '#0ea5e9');
            }
            if(typeof window.gerarAniversariantesVisual === 'function') window.gerarAniversariantesVisual(dados.mural_aniversariantes || '');
            if(typeof window.gerarCalendarioVisual === 'function') window.gerarCalendarioVisual(dados.mural_calendario || '');
        }
        
        // Carregamento de Vagas (Mantido original)
        const { data: vagas } = await _supa.from('rh_vagas').select('*').eq('status', 'Aberta').order('data_criacao', { ascending: false });
        let totalVagas = 0;
        if (vagas) {
            vagas.forEach(v => totalVagas += parseInt(v.quantidade || 0));
            const tbodyDash = document.getElementById('tabela-vagas-dash');
            if (tbodyDash) {
                tbodyDash.innerHTML = vagas.map(v => `<tr style="background: rgba(255,255,255,0.02);"><td style="color: white; font-weight: bold; border-bottom: 1px solid var(--border); padding: 12px;">${v.cargo}</td><td style="color: var(--text-dim); border-bottom: 1px solid var(--border); padding: 12px;"><i class="fas fa-building"></i> ${v.setor}</td><td style="text-align: center; border-bottom: 1px solid var(--border); padding: 12px;"><span class="badge bg-amarelo">${v.quantidade} Vaga(s)</span></td></tr>`).join('');
            }
        }
        if(document.getElementById('val-vagas')) document.getElementById('val-vagas').innerText = totalVagas;

    } catch (err) { console.error("Erro ao carregar dados:", err); }
}

// Funções de Vagas e Murais (sem alterações)
window.limparMuralRH = async function(idMural) {
    if(!confirm("Deseja apagar todos os itens desta lista?")) return;
    const el = document.getElementById(idMural);
    if(el) el.value = '';
    await window.salvarDadosRH('msg-murais-rh', true);
}

window.adicionarVaga = async function() {
    const cargo = document.getElementById('vaga-cargo').value;
    const setor = document.getElementById('vaga-setor').value;
    const qtd = document.getElementById('vaga-qtd').value;
    if(!cargo || !setor || !qtd) return;
    const { error } = await _supa.from('rh_vagas').insert([{ cargo, setor, quantidade: parseInt(qtd), status: 'Aberta' }]);
    if(!error) { window.carregarDadosRH(); }
}

window.carregarDadosRH();