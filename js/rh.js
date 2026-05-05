// ARQUIVO: js/rh.js

// Inicializa a conexão com o Supabase usando a configuração global do sistema
if (!window.supabaseClientGlobal && typeof supabase !== 'undefined' && typeof SUPABASE_CONFIG !== 'undefined') {
    window.supabaseClientGlobal = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
}
const _supa = window.supabaseClientGlobal;

// Pega a data de hoje garantindo o fuso horário do Brasil (evita virar o dia antecipadamente)
function obterDataHoje() {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime.split('T')[0];
}

window.salvarDadosRH = async function() {
    const msg = document.getElementById('msg-rh');
    if (msg) {
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
        mural_avisos: document.getElementById('input-avisos-rh')?.value || null,
        mural_liberacoes: document.getElementById('input-liberacoes-rh')?.value || null,
        mural_aniversariantes: document.getElementById('input-aniversariantes-rh')?.value || null,
        mural_calendario: document.getElementById('input-calendario-rh')?.value || null
    };
    
    try {
        if (!_supa) throw new Error("Conexão com Supabase não estabelecida.");

        const { error } = await _supa.from('rh_indicadores').upsert([dados], { onConflict: 'data_registro' });
        
        if (error) {
            console.error("Erro detalhado do Supabase:", error);
            if (msg) {
                msg.style.color = 'var(--vermelho)';
                msg.innerText = "ERRO NO BANCO: " + error.message;
            }
            return;
        }
        
        if (msg) {
            msg.style.color = 'var(--verde)';
            msg.innerText = "Indicadores e Murais salvos no banco com sucesso!";
            setTimeout(() => msg.innerText = "", 4000);
        }
        
        window.carregarDadosRH();
    } catch (err) {
        console.error("Erro de execução no salvamento de RH:", err);
        if (msg) {
            msg.style.color = 'var(--vermelho)';
            msg.innerText = "Falha de conexão ao tentar salvar!";
        }
    }
};

window.adicionarVaga = async function() {
    const cargo = document.getElementById('vaga-cargo').value;
    const setor = document.getElementById('vaga-setor').value;
    const qtd = document.getElementById('vaga-qtd').value;
    
    if(!cargo || !setor || !qtd) {
        alert("Preencha o Cargo, Setor e a Quantidade para adicionar a vaga!");
        return;
    }
    
    try {
        const { error } = await _supa.from('rh_vagas').insert([{ 
            cargo: cargo, 
            setor: setor, 
            quantidade: parseInt(qtd),
            status: 'Aberta'
        }]);
        
        if (error) {
            console.error("Erro do Supabase ao adicionar vaga:", error);
            alert("ERRO NO BANCO: " + error.message);
            return;
        }
        
        document.getElementById('vaga-cargo').value = '';
        document.getElementById('vaga-setor').value = '';
        document.getElementById('vaga-qtd').value = '';
        
        window.carregarDadosRH();
    } catch (err) {
        console.error("Erro de conexão ao adicionar vaga:", err);
        alert("Erro de conexão. Verifique sua rede.");
    }
};

window.concluirVaga = async function(id) {
    if(confirm("Deseja marcar esta vaga como concluída? Ela sairá do painel, mas ficará no histórico do banco.")) {
        try {
            const { error } = await _supa.from('rh_vagas').update({ status: 'Concluída' }).eq('id', id);
            
            if (error) {
                console.error("Erro do Supabase ao concluir vaga:", error);
                alert("ERRO NO BANCO: " + error.message);
                return;
            }
            
            window.carregarDadosRH();
        } catch (err) {
            console.error("Erro de execução ao concluir vaga:", err);
            alert("Falha de conexão ao tentar concluir a vaga.");
        }
    }
};

window.carregarDadosRH = async function() {
    if (!_supa) return;
    
    try {
        const { data: indData, error: indError } = await _supa.from('rh_indicadores').select('*').order('data_registro', { ascending: false }).limit(1);
        
        if (!indError && indData && indData.length > 0) {
            const dados = indData[0];
            
            // 1. Povoar Inputs (Tela de Lançamento)
            if(document.getElementById('input-headcount')) document.getElementById('input-headcount').value = dados.headcount || '';
            if(document.getElementById('input-atestados')) document.getElementById('input-atestados').value = dados.atestados || '';
            if(document.getElementById('input-afastamentos')) document.getElementById('input-afastamentos').value = dados.afastamentos || '';
            if(document.getElementById('input-admissoes')) document.getElementById('input-admissoes').value = dados.admissoes || '';
            if(document.getElementById('input-integracoes')) document.getElementById('input-integracoes').value = dados.integracoes || '';
            
            if(document.getElementById('input-avisos-rh')) document.getElementById('input-avisos-rh').value = dados.mural_avisos || '';
            if(document.getElementById('input-liberacoes-rh')) document.getElementById('input-liberacoes-rh').value = dados.mural_liberacoes || '';
            if(document.getElementById('input-aniversariantes-rh')) document.getElementById('input-aniversariantes-rh').value = dados.mural_aniversariantes || '';
            if(document.getElementById('input-calendario-rh')) document.getElementById('input-calendario-rh').value = dados.mural_calendario || '';
            
            // 2. Povoar o Dashboard (Tela de Apresentação)
            if(document.getElementById('val-headcount')) document.getElementById('val-headcount').innerText = dados.headcount || 0;
            if(document.getElementById('val-atestados')) document.getElementById('val-atestados').innerText = dados.atestados || 0;
            if(document.getElementById('val-afastamentos')) document.getElementById('val-afastamentos').innerText = dados.afastamentos || 0;
            if(document.getElementById('val-admissoes')) document.getElementById('val-admissoes').innerText = dados.admissoes || 0;
            if(document.getElementById('val-integracoes')) document.getElementById('val-integracoes').innerText = dados.integracoes || 0;

            if(document.getElementById('mural-avisos-rh')) document.getElementById('mural-avisos-rh').innerText = dados.mural_avisos || 'Sem avisos no momento.';
            if(document.getElementById('mural-liberacoes-rh')) document.getElementById('mural-liberacoes-rh').innerText = dados.mural_liberacoes || 'Sem atualizações.';
            if(document.getElementById('mural-aniversariantes-rh')) document.getElementById('mural-aniversariantes-rh').innerText = dados.mural_aniversariantes || 'Nenhum aniversariante registrado.';
            
            // 3. Povoar o Calendário
            if(typeof window.gerarCalendarioVisual === 'function') {
                window.gerarCalendarioVisual(dados.mural_calendario || '');
            } else if (document.getElementById('mural-calendario-rh')) {
                document.getElementById('mural-calendario-rh').innerText = dados.mural_calendario || 'Sem eventos programados.';
            }

        } else {
            // Limpa o calendário se não houver registros
            if (typeof window.gerarCalendarioVisual === 'function') {
                window.gerarCalendarioVisual('');
            }
        }
        
        // Puxa as vagas que estão com status 'Aberta'
        const { data: vagas, error: vagasError } = await _supa.from('rh_vagas').select('*').eq('status', 'Aberta').order('data_criacao', { ascending: false });
        
        let totalVagas = 0;
        let listaVagas = [];
        
        if (!vagasError && vagas) {
            listaVagas = vagas;
            vagas.forEach(v => {
                totalVagas += parseInt(v.quantidade || 0);
            });
        }
        
        if(document.getElementById('val-vagas')) document.getElementById('val-vagas').innerText = totalVagas;
        
        const tbodyLancamento = document.getElementById('tabela-vagas-lancamento');
        if (tbodyLancamento) {
            if (listaVagas.length === 0) {
                tbodyLancamento.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-dim);">Nenhuma vaga em aberto no momento.</td></tr>';
            } else {
                tbodyLancamento.innerHTML = listaVagas.map(v => `
                    <tr style="background: rgba(255,255,255,0.02);">
                        <td style="color: white; font-weight: bold; border-bottom: 1px solid var(--border); padding: 12px;">${v.cargo}</td>
                        <td style="color: var(--text-dim); border-bottom: 1px solid var(--border); padding: 12px;"><i class="fas fa-building"></i> ${v.setor}</td>
                        <td style="color: var(--amarelo); font-weight: bold; text-align: center; border-bottom: 1px solid var(--border); padding: 12px;">${v.quantidade}</td>
                        <td style="text-align: right; border-bottom: 1px solid var(--border); padding: 12px;">
                            <button class="btn-kanban" style="display:inline-block; background: var(--verde);" onclick="concluirVaga(${v.id})" title="Marcar como Concluída">
                                <i class="fas fa-check"></i> Concluir
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
        
        const tbodyDash = document.getElementById('tabela-vagas-dash');
        if (tbodyDash) {
            if (listaVagas.length === 0) {
                tbodyDash.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-dim);">Todas as vagas foram preenchidas!</td></tr>';
            } else {
                tbodyDash.innerHTML = listaVagas.map(v => `
                    <tr style="background: rgba(255,255,255,0.02);">
                        <td style="color: white; font-weight: bold; border-bottom: 1px solid var(--border); padding: 12px;">${v.cargo}</td>
                        <td style="color: var(--text-dim); border-bottom: 1px solid var(--border); padding: 12px;"><i class="fas fa-building"></i> ${v.setor}</td>
                        <td style="text-align: center; border-bottom: 1px solid var(--border); padding: 12px;">
                            <span class="badge bg-amarelo">${v.quantidade} Vaga(s)</span>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error("Erro geral ao puxar dados do banco:", err);
    }
};

window.carregarDadosRH();