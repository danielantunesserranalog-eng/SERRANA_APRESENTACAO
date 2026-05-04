// ARQUIVO: js/rh.js

window.salvarDadosRH = function() {
    // Puxa os dados que já existem para não sobrescrever os apagados por acidente
    const dadosSalvos = JSON.parse(localStorage.getItem('dados_rh') || '{}');
    
    // Coleta os valores digitados no formulário (caso a pessoa esteja na tela de lançamento)
    const dados = {
        headcount: document.getElementById('input-headcount') ? document.getElementById('input-headcount').value : (dadosSalvos.headcount || 0),
        atestados: document.getElementById('input-atestados') ? document.getElementById('input-atestados').value : (dadosSalvos.atestados || 0),
        afastamentos: document.getElementById('input-afastamentos') ? document.getElementById('input-afastamentos').value : (dadosSalvos.afastamentos || 0),
        admissoes: document.getElementById('input-admissoes') ? document.getElementById('input-admissoes').value : (dadosSalvos.admissoes || 0),
        integracoes: document.getElementById('input-integracoes') ? document.getElementById('input-integracoes').value : (dadosSalvos.integracoes || 0),
        vagas: document.getElementById('input-vagas') ? document.getElementById('input-vagas').value : (dadosSalvos.vagas || 0)
    };
    
    // Salva os dados localmente
    localStorage.setItem('dados_rh', JSON.stringify(dados));
    
    // Exibe a mensagem de sucesso
    const msg = document.getElementById('msg-rh');
    if (msg) {
        msg.innerText = "Indicadores atualizados com sucesso!";
        setTimeout(() => msg.innerText = "", 3000);
    }
    
    // Atualiza a tela imediatamente
    window.carregarDadosRH();
}

window.carregarDadosRH = function() {
    const dadosSalvos = localStorage.getItem('dados_rh');
    
    if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        
        // 1. Repreencher os inputs na tela de Lançamento
        if(document.getElementById('input-headcount')) document.getElementById('input-headcount').value = dados.headcount || '';
        if(document.getElementById('input-atestados')) document.getElementById('input-atestados').value = dados.atestados || '';
        if(document.getElementById('input-afastamentos')) document.getElementById('input-afastamentos').value = dados.afastamentos || '';
        if(document.getElementById('input-admissoes')) document.getElementById('input-admissoes').value = dados.admissoes || '';
        if(document.getElementById('input-integracoes')) document.getElementById('input-integracoes').value = dados.integracoes || '';
        if(document.getElementById('input-vagas')) document.getElementById('input-vagas').value = dados.vagas || '';
        
        // 2. Atualizar os Cards no Dashboard (Painel)
        if(document.getElementById('val-headcount')) document.getElementById('val-headcount').innerText = dados.headcount || 0;
        if(document.getElementById('val-atestados')) document.getElementById('val-atestados').innerText = dados.atestados || 0;
        if(document.getElementById('val-afastamentos')) document.getElementById('val-afastamentos').innerText = dados.afastamentos || 0;
        if(document.getElementById('val-admissoes')) document.getElementById('val-admissoes').innerText = dados.admissoes || 0;
        if(document.getElementById('val-integracoes')) document.getElementById('val-integracoes').innerText = dados.integracoes || 0;
        if(document.getElementById('val-vagas')) document.getElementById('val-vagas').innerText = dados.vagas || 0;
    }
}

// Executa assim que a tela abre
window.carregarDadosRH();