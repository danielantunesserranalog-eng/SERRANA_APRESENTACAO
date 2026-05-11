window.renderizarPatioManutencaoDash = function() {
    const container = document.getElementById('patioManutencaoDashContainer');
    if (!container) return;

    if (!window.ordensServico || window.ordensServico.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center;">Aguardando dados de Ordem de Serviço...</p>';
        return;
    }

    // CORREÇÃO AQUI: IGNORANDO "Cavalo Disponível S/ Carreta"
    const osAtivas = window.ordensServico.filter(o => (o.status === 'Aguardando Oficina' || o.status === 'Em Manutenção') && o.tipo !== 'Sinistro' && o.tipo !== 'Cavalo Disponível S/ Carreta');

    if (osAtivas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #10b981; font-size: 2rem; margin: 0;">PÁTIO VAZIO <i class="fas fa-check-circle"></i></h2>
                <p style="color: #94a3b8; font-size: 1.1rem; margin-top: 10px;">Nenhum veículo aguardando manutenção no momento.</p>
            </div>
        `;
        return;
    }

    osAtivas.sort((a, b) => {
        const pesoPri = { 'Urgente': 4, 'Alta': 3, 'Normal': 2, 'Baixa': 1 };
        const pA = pesoPri[a.prioridade] || 0;
        const pB = pesoPri[b.prioridade] || 0;
        if (pA !== pB) return pB - pA;
        return new Date(a.data_abertura) - new Date(b.data_abertura);
    });

    const agora = new Date();

    container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px;">` + osAtivas.map(os => {
        let corPrioridade = '#3b82f6';
        if (os.prioridade === 'Urgente') corPrioridade = '#ef4444';
        else if (os.prioridade === 'Alta') corPrioridade = '#f97316';
        else if (os.prioridade === 'Baixa') corPrioridade = '#10b981';

        let diffHrs = 0, diffMin = 0;
        let entradaHoraStr = '--:--';

        if (os.data_abertura) {
            const inicio = new Date(os.data_abertura.replace('Z', '').replace('+00:00', ''));
            const diffMs = agora - inicio;
            if(diffMs > 0) {
                diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            }
            entradaHoraStr = inicio.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        }

        let colorCronometro = '#fff', piscarAnimacao = '';
        if (diffHrs >= 24) { colorCronometro = '#ef4444'; piscarAnimacao = 'animation: piscar 1.5s infinite;'; }
        else if (diffHrs >= 12) { colorCronometro = '#f59e0b'; }

        const frotaVinculada = (window.frotasManutencao || []).find(f => f.cavalo === os.placa) || {};
        const conjuntosBadge = [frotaVinculada.carreta1, frotaVinculada.carreta2, frotaVinculada.carreta3]
            .filter(Boolean)
            .map(c => `<span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; border: 1px solid rgba(255,255,255,0.2); margin-right: 6px; display: inline-block;">${c}</span>`)
            .join('');

        const textoStatus = os.status === 'Em Manutenção' ? 'EM OFICINA' : 'AGUARDANDO ATENDIMENTO';
        const bgStatus = os.status === 'Em Manutenção' ? '#1e3a8a' : '#1e293b';
        const borderStatus = os.status === 'Em Manutenção' ? '#3b82f6' : '#475569';

        return `
            <div style="background: ${bgStatus}; border: 2px solid ${borderStatus}; border-radius: 12px; padding: 18px; box-shadow: 0 6px 15px rgba(0,0,0,0.3); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 0.75rem; color: #cbd5e1; margin-bottom: 2px; font-weight: 600;">O.S. #${os.id} | ${textoStatus}</div>
                        <div style="font-size: 2.2rem; font-weight: 900; color: #fff; line-height: 1.1; letter-spacing: 1px;">${os.placa}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="background: ${corPrioridade}; color: #fff; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; text-transform: uppercase;">
                            ${os.prioridade}
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: 12px; min-height: 22px;">${conjuntosBadge}</div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; margin-bottom: 15px; flex: 1;">
                    <div style="color: #60a5fa; font-weight: 800; font-size: 0.95rem; margin-bottom: 6px;">${os.tipo}</div>
                    <div style="color: #cbd5e1; font-size: 0.85rem;">Motorista: <strong style="color: #fff;">${os.motorista || '-'}</strong></div>
                    <div style="color: #94a3b8; font-size: 0.8rem; margin-top: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${os.problema || 'Nenhum detalhe'}">
                        Detalhe: ${os.problema || 'Nenhum detalhe'}
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                    <div style="color: #94a3b8; font-size: 0.85rem;">
                        Entrada: <br><strong style="color: #fff; font-size: 1.1rem;">${entradaHoraStr}</strong>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: bold; letter-spacing: 1px;">TEMPO NO PÁTIO</div>
                        <div style="font-size: 1.8rem; font-weight: 900; color: ${colorCronometro}; font-family: monospace; ${piscarAnimacao}">
                            ${String(diffHrs).padStart(2,'0')}:${String(diffMin).padStart(2,'0')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('') + `</div>`;
};

window.muralSetorKey = 'mural_manutencao';
window.muralSetorData = [];

window.formatarDataMural = function(dataIso) {
    if(!dataIso) return ''; const [ano, mes, dia] = dataIso.split('-'); return `${dia}/${mes}/${ano}`;
}

window.carregarMuralSetor = async function() {
    try {
        if (!window.supabaseClientGlobal && typeof supabase !== 'undefined' && typeof SUPABASE_CONFIG !== 'undefined') {
            window.supabaseClientGlobal = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        }
        const _supa = window.supabaseClientGlobal;
        if(!_supa) return;

        const { data } = await _supa.from('configuracoes').select('valor').eq('chave', window.muralSetorKey).limit(1);
        if (data && data.length > 0 && data[0].valor) {
            window.muralSetorData = JSON.parse(data[0].valor);
        } else {
            window.muralSetorData = [];
        }
        window.renderizarMuralSetor();
    } catch(e) { console.error("Erro ao carregar mural do setor:", e); }
};

window.renderizarMuralSetor = function() {
    const container = document.getElementById('lista-mural-setor');
    if(!container) return;
    if(window.muralSetorData.length === 0) {
        container.innerHTML = '<div style="color: var(--text-dim); padding: 10px; text-align: center; font-size: 0.9rem;">Nenhuma informação ou aviso no momento.</div>';
        return;
    }
    
    container.innerHTML = window.muralSetorData.map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
            <div style="flex: 1;">
                <span style="color: var(--text-dim); font-size: 0.8rem; font-weight: bold; margin-right: 8px;"><i class="fas fa-calendar-day"></i> ${window.formatarDataMural(item.data)}</span>
                <span style="color: white; font-size: 0.9rem;">${item.texto}</span>
            </div>
            <button class="btn-kanban" style="background: var(--verde); padding: 6px 12px; border: none; border-radius: 4px; color: white; cursor: pointer;" onclick="window.concluirMuralSetor(${item.id})" title="Concluir / Retirar">
                <i class="fas fa-check"></i>
            </button>
        </div>
    `).join('');
};

window.addMuralSetor = async function() {
    const dt = document.getElementById('data-mural-setor').value;
    const txt = document.getElementById('txt-mural-setor').value.trim();
    if(!dt || !txt) { alert("Preencha a data e o texto para adicionar ao mural!"); return; }
    
    window.muralSetorData.push({ id: Date.now(), data: dt, texto: txt });
    document.getElementById('txt-mural-setor').value = '';
    window.renderizarMuralSetor();
    await window.salvarMuralSetor();
};

window.concluirMuralSetor = async function(id) {
    if(!confirm("Concluir e retirar este aviso do mural?")) return;
    window.muralSetorData = window.muralSetorData.filter(i => i.id !== id);
    window.renderizarMuralSetor();
    await window.salvarMuralSetor();
};

window.salvarMuralSetor = async function() {
    const msg = document.getElementById('msg-mural-setor');
    if(msg) { msg.style.color = 'var(--text-dim)'; msg.innerText = 'Salvando...'; }
    
    try {
        if (!window.supabaseClientGlobal && typeof supabase !== 'undefined' && typeof SUPABASE_CONFIG !== 'undefined') {
            window.supabaseClientGlobal = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        }
        const _supa = window.supabaseClientGlobal;
        await _supa.from('configuracoes').upsert([{ chave: window.muralSetorKey, valor: JSON.stringify(window.muralSetorData) }], { onConflict: 'chave' });
        
        if(msg) { 
            msg.style.color = 'var(--verde)'; msg.innerText = 'Salvo com sucesso!';
            setTimeout(() => msg.innerText='', 3000);
        }
    } catch(e) {
        if(msg) { msg.style.color = 'var(--vermelho)'; msg.innerText = 'Erro ao salvar!'; }
    }
};

window.initDashManutencao = function() {
    if (!document.getElementById('css-animacao-piscar')) {
        var animacaoCss = document.createElement('style');
        animacaoCss.id = 'css-animacao-piscar';
        animacaoCss.innerHTML = `@keyframes piscar { 0% { opacity: 1; } 50% { opacity: 0.4; color: #fca5a5; } 100% { opacity: 1; } }`;
        document.head.appendChild(animacaoCss);
    }

    if (typeof window.carregarDadosManutencao === 'function') {
        window.carregarDadosManutencao().then(() => {
            setTimeout(() => {
                if (typeof window.preencherFiltroMesGlobal === 'function') window.preencherFiltroMesGlobal();
                if (typeof window.dispararFiltrosGlobais === 'function') window.dispararFiltrosGlobais();
                if (typeof window.renderizarPatioManutencaoDash === 'function') window.renderizarPatioManutencaoDash();
                if(document.getElementById('data-mural-setor')) {
                    document.getElementById('data-mural-setor').value = new Date().toISOString().split('T')[0];
                }
                window.carregarMuralSetor();
            }, 300);
        });
    } else {
        setTimeout(() => {
            if (typeof window.dispararFiltrosGlobais === 'function') window.dispararFiltrosGlobais();
            if (typeof window.renderizarPatioManutencaoDash === 'function') window.renderizarPatioManutencaoDash();
            if(document.getElementById('data-mural-setor')) {
                document.getElementById('data-mural-setor').value = new Date().toISOString().split('T')[0];
            }
            window.carregarMuralSetor();
        }, 800);
    }

    if (window.intervaloCronometroPatio) clearInterval(window.intervaloCronometroPatio);
    window.intervaloCronometroPatio = setInterval(() => {
        if (typeof window.renderizarPatioManutencaoDash === 'function') {
            window.renderizarPatioManutencaoDash();
        }
    }, 60000);
};