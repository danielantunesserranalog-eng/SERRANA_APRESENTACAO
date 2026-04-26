// ARQUIVO: js/rh.js

function salvarDadosRH() {
    // Coleta os valores digitados no formulário
    const dados = {
        headcount: document.getElementById('input-headcount').value || 0,
        abs: document.getElementById('input-abs').value || 0,
        turnover: document.getElementById('input-turnover').value || 0,
        vagas: document.getElementById('input-vagas').value || 0,
        he: document.getElementById('input-he').value || 0
    };
    
    // Salva os dados para que persistam localmente no navegador
    localStorage.setItem('dados_rh', JSON.stringify(dados));
    
    // Exibe a mensagem de sucesso
    const msg = document.getElementById('msg-rh');
    msg.innerText = "Painel atualizado localmente com sucesso!";
    setTimeout(() => msg.innerText = "", 3000);
    
    // Chama a função para renderizar os cards com as cores e números novos
    carregarDadosRH();
}

function carregarDadosRH() {
    const dadosSalvos = localStorage.getItem('dados_rh');
    
    if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        
        // 1. Repreencher os inputs para não aparecerem vazios
        document.getElementById('input-headcount').value = dados.headcount;
        document.getElementById('input-abs').value = dados.abs;
        document.getElementById('input-turnover').value = dados.turnover;
        document.getElementById('input-vagas').value = dados.vagas;
        document.getElementById('input-he').value = dados.he;
        
        // 2. Atualizar o Painel (Dashboard)
        // Headcount
        document.getElementById('val-headcount').innerText = dados.headcount;
        
        // Absenteísmo (Muda de cor se passar da meta de 3.5%)
        const valAbs = parseFloat(dados.abs);
        const elAbs = document.getElementById('val-abs');
        const farolAbs = document.getElementById('farol-abs');
        elAbs.innerText = valAbs.toFixed(1) + "%";
        
        if (valAbs > 3.5) {
            elAbs.className = "kpi-value status-vermelho";
            farolAbs.className = "farol-indicator bg-vermelho";
        } else {
            elAbs.className = "kpi-value status-verde";
            farolAbs.className = "farol-indicator bg-verde";
        }

        // Turnover (Muda de cor se passar da meta de 3.0%)
        const valTurnover = parseFloat(dados.turnover);
        const elTurnover = document.getElementById('val-turnover');
        const farolTurnover = document.getElementById('farol-turnover');
        elTurnover.innerText = valTurnover.toFixed(1) + "%";
        
        if (valTurnover > 3.0) {
            elTurnover.className = "kpi-value status-vermelho";
            farolTurnover.className = "farol-indicator bg-vermelho";
        } else {
            elTurnover.className = "kpi-value status-verde";
            farolTurnover.className = "farol-indicator bg-verde";
        }
        
        // Vagas
        document.getElementById('val-vagas').innerText = dados.vagas;
        
        // Horas Extras (Formatar como Moeda Brasileira)
        const valorHe = parseFloat(dados.he);
        document.getElementById('val-he').innerText = valorHe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}

// Quando a tela carregar, ele busca os últimos dados salvos
carregarDadosRH();