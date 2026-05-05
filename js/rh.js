// ARQUIVO: js/rh.js

window.salvarDadosRH = function() {
    const dadosSalvos = JSON.parse(localStorage.getItem('dados_rh') || '{}');
    
    // Coleta os valores digitados no formulário
    const dados = {
        headcount: document.getElementById('input-headcount') ? document.getElementById('input-headcount').value : (dadosSalvos.headcount || 0),
        atestados: document.getElementById('input-atestados') ? document.getElementById('input-atestados').value : (dadosSalvos.atestados || 0),
        afastamentos: document.getElementById('input-afastamentos') ? document.getElementById('input-afastamentos').value : (dadosSalvos.afastamentos || 0),
        admissoes: document.getElementById('input-admissoes') ? document.getElementById('input-admissoes').value : (dadosSalvos.admissoes || 0),
        integracoes: document.getElementById('input-integracoes') ? document.getElementById('input-integracoes').value : (dadosSalvos.integracoes || 0)
        // A quantidade de vagas agora é automática, calculada pela tabela!
    };
    
    // Salva os dados locais principais
    localStorage.setItem('dados_rh', JSON.stringify(dados));
    
    const msg = document.getElementById('msg-rh');
    if (msg) {
        msg.style.color = 'var(--verde)';
        msg.innerText = "Indicadores atualizados com sucesso!";
        setTimeout(() => msg.innerText = "", 3000);
    }
    
    window.carregarDadosRH();
}

window.adicionarVaga = function() {
    const cargo = document.getElementById('vaga-cargo').value;
    const setor = document.getElementById('vaga-setor').value;
    const qtd = document.getElementById('vaga-qtd').value;
    
    if(!cargo || !setor || !qtd) {
        alert("Preencha o Cargo, Setor e a Quantidade para adicionar a vaga!");
        return;
    }

    // Puxa as vagas salvas ou cria uma lista vazia
    let vagas = JSON.parse(localStorage.getItem('vagas_rh') || '[]');
    
    // Adiciona a nova vaga
    vagas.push({ cargo: cargo, setor: setor, quantidade: parseInt(qtd) });
    
    // Salva de volta
    localStorage.setItem('vagas_rh', JSON.stringify(vagas));

    // Limpa os campos
    document.getElementById('vaga-cargo').value = '';
    document.getElementById('vaga-setor').value = '';
    document.getElementById('vaga-qtd').value = '';

    window.carregarDadosRH();
}

window.concluirVaga = function(index) {
    if(confirm("Deseja concluir e remover esta vaga do painel?")) {
        let vagas = JSON.parse(localStorage.getItem('vagas_rh') || '[]');
        vagas.splice(index, 1); // Remove do array
        localStorage.setItem('vagas_rh', JSON.stringify(vagas));
        window.carregarDadosRH();
    }
}

window.carregarDadosRH = function() {
    const dadosSalvos = localStorage.getItem('dados_rh');
    const vagas = JSON.parse(localStorage.getItem('vagas_rh') || '[]');
    
    // Calcula o total de vagas ativas somando as quantidades
    let totalVagas = 0;
    vagas.forEach(v => {
        totalVagas += parseInt(v.quantidade || 0);
    });

    if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        
        // 1. Repreencher os inputs
        if(document.getElementById('input-headcount')) document.getElementById('input-headcount').value = dados.headcount || '';
        if(document.getElementById('input-atestados')) document.getElementById('input-atestados').value = dados.atestados || '';
        if(document.getElementById('input-afastamentos')) document.getElementById('input-afastamentos').value = dados.afastamentos || '';
        if(document.getElementById('input-admissoes')) document.getElementById('input-admissoes').value = dados.admissoes || '';
        if(document.getElementById('input-integracoes')) document.getElementById('input-integracoes').value = dados.integracoes || '';
        
        // 2. Atualizar os Cards no Dashboard (Painel)
        if(document.getElementById('val-headcount')) document.getElementById('val-headcount').innerText = dados.headcount || 0;
        if(document.getElementById('val-atestados')) document.getElementById('val-atestados').innerText = dados.atestados || 0;
        if(document.getElementById('val-afastamentos')) document.getElementById('val-afastamentos').innerText = dados.afastamentos || 0;
        if(document.getElementById('val-admissoes')) document.getElementById('val-admissoes').innerText = dados.admissoes || 0;
        if(document.getElementById('val-integracoes')) document.getElementById('val-integracoes').innerText = dados.integracoes || 0;
    }
    
    // Atualiza o KPI de Vagas em ambas as telas (se ele existir nelas)
    if(document.getElementById('val-vagas')) document.getElementById('val-vagas').innerText = totalVagas;

    // Renderiza a tabela de Lançamento (com botão de concluir)
    const tbodyLancamento = document.getElementById('tabela-vagas-lancamento');
    if (tbodyLancamento) {
        if (vagas.length === 0) {
            tbodyLancamento.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-dim);">Nenhuma vaga em aberto no momento.</td></tr>';
        } else {
            tbodyLancamento.innerHTML = vagas.map((v, i) => `
                <tr style="background: rgba(255,255,255,0.02);">
                    <td style="color: white; font-weight: bold; border-bottom: 1px solid var(--border); padding: 12px;">${v.cargo}</td>
                    <td style="color: var(--text-dim); border-bottom: 1px solid var(--border); padding: 12px;"><i class="fas fa-building"></i> ${v.setor}</td>
                    <td style="color: var(--amarelo); font-weight: bold; text-align: center; border-bottom: 1px solid var(--border); padding: 12px;">${v.quantidade}</td>
                    <td style="text-align: right; border-bottom: 1px solid var(--border); padding: 12px;">
                        <button class="btn-kanban" style="display:inline-block; background: var(--verde);" onclick="concluirVaga(${i})" title="Marcar como Concluída">
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
        if (vagas.length === 0) {
            tbodyDash.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-dim);">Todas as vagas foram preenchidas!</td></tr>';
        } else {
            tbodyDash.innerHTML = vagas.map(v => `
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
}

// Executa assim que a tela abre
window.carregarDadosRH();