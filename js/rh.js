// ARQUIVO: js/rh.js

// Inicializa a conexão com o Supabase usando a configuração global do sistema
if (!window.supabaseClientGlobal && typeof supabase !== 'undefined' && typeof SUPABASE_CONFIG !== 'undefined') {
    window.supabaseClientGlobal = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
}
const _supa = window.supabaseClientGlobal;

// Pega a data de hoje no formato YYYY-MM-DD para atrelar aos indicadores
function obterDataHoje() {
    return new Date().toISOString().split('T')[0];
}

window.salvarDadosRH = async function() {
    const msg = document.getElementById('msg-rh');
    if (msg) {
        msg.style.color = 'var(--text-dim)';
        msg.innerText = "Salvando no banco de dados...";
    }
    
    // Coleta os valores digitados no formulário
    const dados = {
        data_registro: obterDataHoje(), // Salva usando a data de hoje para gerar histórico
        headcount: parseInt(document.getElementById('input-headcount')?.value || 0),
        atestados: parseInt(document.getElementById('input-atestados')?.value || 0),
        afastamentos: parseInt(document.getElementById('input-afastamentos')?.value || 0),
        admissoes: parseInt(document.getElementById('input-admissoes')?.value || 0),
        integracoes: parseInt(document.getElementById('input-integracoes')?.value || 0)
    };
    
    try {
        // Usa upsert: se já tiver registro hoje, ele atualiza. Se não tiver, ele cria novo.
        const { error } = await _supa.from('rh_indicadores').upsert([dados], { onConflict: 'data_registro' });
        
        if (error) throw error;

        if (msg) {
            msg.style.color = 'var(--verde)';
            msg.innerText = "Indicadores salvos no banco com sucesso!";
            setTimeout(() => msg.innerText = "", 3000);
        }
        
        window.carregarDadosRH();
    } catch (err) {
        console.error("Erro ao salvar indicadores de RH no banco:", err);
        if (msg) {
            msg.style.color = 'var(--vermelho)';
            msg.innerText = "Erro ao salvar no banco de dados.";
        }
    }
}

window.adicionarVaga = async function() {
    const cargo = document.getElementById('vaga-cargo').value;
    const setor = document.getElementById('vaga-setor').value;
    const qtd = document.getElementById('vaga-qtd').value;
    
    if(!cargo || !setor || !qtd) {
        alert("Preencha o Cargo, Setor e a Quantidade para adicionar a vaga!");
        return;
    }

    try {
        // Insere a nova vaga no banco com status 'Aberta'
        const { error } = await _supa.from('rh_vagas').insert([{ 
            cargo: cargo, 
            setor: setor, 
            quantidade: parseInt(qtd),
            status: 'Aberta'
        }]);

        if (error) throw error;

        // Limpa os campos
        document.getElementById('vaga-cargo').value = '';
        document.getElementById('vaga-setor').value = '';
        document.getElementById('vaga-qtd').value = '';

        window.carregarDadosRH();
    } catch (err) {
        console.error("Erro ao adicionar vaga no banco:", err);
        alert("Erro ao adicionar vaga. Verifique a conexão.");
    }
}

// O ID da vaga no banco de dados é passado aqui, não mais a posição da lista
window.concluirVaga = async function(id) {
    if(confirm("Deseja marcar esta vaga como concluída? Ela sairá do painel, mas ficará no histórico do banco.")) {
        try {
            const { error } = await _supa.from('rh_vagas').update({ status: 'Concluída' }).eq('id', id);
            
            if (error) throw error;
            
            window.carregarDadosRH();
        } catch (err) {
            console.error("Erro ao concluir vaga no banco:", err);
            alert("Erro ao concluir vaga.");
        }
    }
}

window.carregarDadosRH = async function() {
    if (!_supa) return;

    try {
        // 1. Puxa o indicador mais recente cadastrado (ordena pela data mais nova)
        const { data: indData, error: indError } = await _supa.from('rh_indicadores').select('*').order('data_registro', { ascending: false }).limit(1);
        
        if (!indError && indData && indData.length > 0) {
            const dados = indData[0];
            
            // Repreencher os inputs de lançamento (se estiver na tela de lançamento)
            if(document.getElementById('input-headcount')) document.getElementById('input-headcount').value = dados.headcount || '';
            if(document.getElementById('input-atestados')) document.getElementById('input-atestados').value = dados.atestados || '';
            if(document.getElementById('input-afastamentos')) document.getElementById('input-afastamentos').value = dados.afastamentos || '';
            if(document.getElementById('input-admissoes')) document.getElementById('input-admissoes').value = dados.admissoes || '';
            if(document.getElementById('input-integracoes')) document.getElementById('input-integracoes').value = dados.integracoes || '';
            
            // Atualizar os Cards no Dashboard (Painel)
            if(document.getElementById('val-headcount')) document.getElementById('val-headcount').innerText = dados.headcount || 0;
            if(document.getElementById('val-atestados')) document.getElementById('val-atestados').innerText = dados.atestados || 0;
            if(document.getElementById('val-afastamentos')) document.getElementById('val-afastamentos').innerText = dados.afastamentos || 0;
            if(document.getElementById('val-admissoes')) document.getElementById('val-admissoes').innerText = dados.admissoes || 0;
            if(document.getElementById('val-integracoes')) document.getElementById('val-integracoes').innerText = dados.integracoes || 0;
        }

        // 2. Puxa as vagas que estão com status 'Aberta'
        const { data: vagas, error: vagasError } = await _supa.from('rh_vagas').select('*').eq('status', 'Aberta').order('data_criacao', { ascending: false });
        
        let totalVagas = 0;
        let listaVagas = [];

        if (!vagasError && vagas) {
            listaVagas = vagas;
            vagas.forEach(v => {
                totalVagas += parseInt(v.quantidade || 0);
            });
        }
        
        // Atualiza o KPI de Vagas totais no painel
        if(document.getElementById('val-vagas')) document.getElementById('val-vagas').innerText = totalVagas;

        // Renderiza a tabela de Lançamento (com botão de concluir ligado ao ID do banco)
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

        // Renderiza a tabela do Dashboard (somente visualização)
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
        console.error("Erro ao puxar dados do banco:", err);
    }
}

// Executa assim que a tela abre
window.carregarDadosRH();