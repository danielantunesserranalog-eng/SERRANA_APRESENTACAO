// =================================================================
// LÓGICA DE FILTROS GLOBAIS
// =================================================================
window.filtroGlobalAtual = 'hoje';

window.setFiltroGlobal = function(tipo, el) {
    window.filtroGlobalAtual = tipo;
    
    const botoes = document.querySelectorAll('#botoesFiltroGlobal .btn-filter-periodo');
    botoes.forEach(b => b.classList.remove('active'));
    
    if(el && el.tagName === 'BUTTON') {
        el.classList.add('active');
    }

    if (tipo !== 'data_especifica') document.getElementById('filtroDataGlobalEspecifica').value = '';
    if (tipo !== 'mes_especifico') document.getElementById('filtroMesGlobalEspecifico').value = '';

    window.dispararFiltrosGlobais();
};

window.getDatasFiltroGlobal = function() {
    let inicio = new Date();
    let fim = new Date();
    const tipo = window.filtroGlobalAtual;

    inicio.setHours(0,0,0,0);
    fim.setHours(23,59,59,999);

    if (tipo === 'd1') {
        inicio.setDate(inicio.getDate() - 1);
        fim.setDate(fim.getDate() - 1);
    } else if (tipo === 'd2') {
        inicio.setDate(inicio.getDate() - 2);
        fim.setDate(fim.getDate() - 2);
    } else if (tipo === 'd3') {
        inicio.setDate(inicio.getDate() - 3);
        fim.setDate(fim.getDate() - 3);
    } else if (tipo === 'd7') {
        inicio.setDate(inicio.getDate() - 7);
        fim.setDate(fim.getDate() - 7);
    } else if (tipo === 'data_especifica') {
        const val = document.getElementById('filtroDataGlobalEspecifica').value;
        if(val) {
            const [y, m, d] = val.split('-');
            inicio = new Date(y, m-1, d, 0, 0, 0);
            fim = new Date(y, m-1, d, 23, 59, 59, 999);
        }
    } else if (tipo === 'mes_especifico') {
        const val = document.getElementById('filtroMesGlobalEspecifico').value;
        if(val) {
            const [y, m] = val.split('-');
            inicio = new Date(y, m-1, 1, 0, 0, 0);
            fim = new Date(y, m, 0, 23, 59, 59, 999);
        }
    }
    return { inicio, fim, valorBruto: tipo };
};

// =================================================================
// FUNÇÕES DE CÁLCULO DE DM E GRÁFICOS
// =================================================================
window.renderizarPatioManutencaoDash = function() {
    const container = document.getElementById('patioManutencaoDashContainer');
    if (!container) return;

    if (!window.ordensServico || window.ordensServico.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center;">Aguardando dados de Ordem de Serviço...</p>';
        return;
    }

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

window.atualizarKPIsGlobais = function() {
    try {
        if (!window.ordensServico) return;
        const datas = typeof window.getDatasFiltroGlobal === 'function' ? window.getDatasFiltroGlobal() : { inicio: new Date(), fim: new Date() };
        const inicio = datas.inicio;
        const fim = datas.fim;
        
        let totalOS = 0;
        let abertasOS = 0;
        let concluidasOS = 0;
        let msTotalTempo = 0;
        let osComTempo = 0;
        
        window.ordensServico.forEach(os => {
            if (os.status === 'Agendada') return;
            let osInicioStr = os.data_abertura;
            if (!osInicioStr) return;
            if (!osInicioStr.includes('T')) osInicioStr += 'T00:00:00';
            const dtAbertura = new Date(osInicioStr.replace('Z', '').replace('+00:00', ''));
            let dtConclusao = new Date();
            if (os.data_conclusao) {
                let osFimStr = os.data_conclusao;
                if (!osFimStr.includes('T')) osFimStr += 'T00:00:00';
                dtConclusao = new Date(osFimStr.replace('Z', '').replace('+00:00', ''));
            }
            
            if (dtAbertura <= fim && dtConclusao >= inicio) {
                totalOS++;
                if (os.status === 'Concluída' || os.status === 'Resolvido') {
                    concluidasOS++;
                    if (dtAbertura && os.data_conclusao) { 
                        msTotalTempo += (dtConclusao - dtAbertura);
                        osComTempo++;
                    }
                } else {
                    abertasOS++;
                }
            }
        });
        
        let taxaConclusao = totalOS > 0 ? ((concluidasOS / totalOS) * 100).toFixed(1) : 0;
        let tempoMedioStr = '0h 0m';
        if (osComTempo > 0) {
            let mediaMs = msTotalTempo / osComTempo;
            let mediaHoras = Math.floor(mediaMs / (1000 * 60 * 60));
            let mediaMinutos = Math.floor((mediaMs % (1000 * 60 * 60)) / (1000 * 60));
            tempoMedioStr = `${mediaHoras}h ${mediaMinutos}m`;
        }
        
        const elKpiTotal = document.getElementById('kpiTotalOS');
        const elKpiAbertas = document.getElementById('kpiAbertasOS');
        const elKpiConcluidas = document.getElementById('kpiConcluidasOS');
        const elKpiTaxa = document.getElementById('kpiTaxaOS');
        const elKpiTempo = document.getElementById('kpiTempoMedioOS');
        if(elKpiTotal) elKpiTotal.innerText = totalOS;
        if(elKpiAbertas) elKpiAbertas.innerText = abertasOS;
        if(elKpiConcluidas) elKpiConcluidas.innerText = concluidasOS;
        if(elKpiTaxa) elKpiTaxa.innerText = taxaConclusao + '%';
        if(elKpiTempo) elKpiTempo.innerText = tempoMedioStr;
        
        if (!window.frotasManutencao || window.frotasManutencao.length === 0) return;
        
        let fimParaCalculo = fim > new Date() ? new Date() : fim;
        let msTotalPeriodo = fimParaCalculo - inicio;
        if (msTotalPeriodo <= 0) msTotalPeriodo = 1;
        
        let msManutencaoComum = 0;
        let msSOS = 0;
        let totalMsDisponivelPeriodo = 0;
        
        window.frotasManutencao.forEach(frota => {
            if(frota.status === 'Inativo') return;
            
            let frotaInicioStr = frota.data_inicial ? frota.data_inicial : '2026-04-01';
            let dtEntradaVeiculo = new Date(frotaInicioStr + 'T00:00:00');
            
            let overlapDispInicio = dtEntradaVeiculo > inicio ? dtEntradaVeiculo : inicio;
            if (overlapDispInicio < fimParaCalculo) {
                totalMsDisponivelPeriodo += (fimParaCalculo - overlapDispInicio);
            }
            
            const todasOSCavalo = window.ordensServico.filter(o => o.placa === frota.cavalo && o.status !== 'Agendada' && o.tipo !== 'Cavalo Disponível S/ Carreta');
            todasOSCavalo.forEach(os => {
                let osInicioStr = os.data_abertura;
                if (!osInicioStr) return;
                if (!osInicioStr.includes('T')) osInicioStr += 'T00:00:00';
                const osInicio = new Date(osInicioStr.replace('Z', '').replace('+00:00', ''));
                
                let osFim = new Date(); 
                if (os.data_conclusao) {
                    let osFimStr = os.data_conclusao;
                    if (!osFimStr.includes('T')) osFimStr += 'T00:00:00';
                    osFim = new Date(osFimStr.replace('Z', '').replace('+00:00', ''));
                }
                
                let inicioValido = osInicio > dtEntradaVeiculo ? osInicio : dtEntradaVeiculo;
                let overlapInicio = inicioValido > inicio ? inicioValido : inicio;
                const overlapFim = osFim < fimParaCalculo ? osFim : fimParaCalculo;
                
                if (overlapInicio < overlapFim) {
                    const tempoParado = overlapFim - overlapInicio;
                    const tipoOS = (os.tipo || os.tipo_manutencao || '').toUpperCase();
                    const descOS = (os.descricao || '').toUpperCase();
                    const prioridadeOS = (os.prioridade || '').toUpperCase();
                    if (
                        tipoOS.includes('S.O.S') || tipoOS.includes('SOS') || tipoOS.includes('SOCORRO') ||
                        descOS.includes('S.O.S') || descOS.includes('SOS') || descOS.includes('SOCORRO') ||
                        prioridadeOS.includes('EMERGÊNCIA')
                    ) {
                        msSOS += tempoParado;
                    } else {
                        msManutencaoComum += tempoParado;
                    }
                }
            });
        });
        
        let msManutTotal = msManutencaoComum + msSOS;
        let dispNoPeriodoMs = totalMsDisponivelPeriodo - msManutTotal;
        if (dispNoPeriodoMs < 0) dispNoPeriodoMs = 0;
        
        const mediaAtivosReal = Math.round(dispNoPeriodoMs / msTotalPeriodo);
        const mediaManutReal = Math.round(msManutencaoComum / msTotalPeriodo);
        const mediaSOSReal = Math.round(msSOS / msTotalPeriodo);
        const percentDMReal = totalMsDisponivelPeriodo > 0 ? (dispNoPeriodoMs / totalMsDisponivelPeriodo) * 100 : 100;
        
        const elAvgDM = document.getElementById('avgDM');
        const elAvgAtivos = document.getElementById('avgAtivos');
        const elAvgManut = document.getElementById('avgManut');
        const elAvgSOS = document.getElementById('avgSOS');
        
        if(elAvgDM) elAvgDM.innerText = percentDMReal.toFixed(1) + '%';
        if(elAvgAtivos) elAvgAtivos.innerText = mediaAtivosReal;
        if(elAvgManut) elAvgManut.innerText = mediaManutReal;
        if(elAvgSOS) elAvgSOS.innerText = mediaSOSReal;
    } catch(e) {
        console.error("Erro ao atualizar KPIs Globais:", e);
    }
};

window.renderizarGraficoStatusFrotaHorario = function() {
    try {
        if (!window.frotasManutencao || window.frotasManutencao.length === 0) return;
        
        const agora = new Date();
        let dataBase = new Date(); 
        let ehHoje = true;
        const inputData = document.getElementById('filtroDataEspecificaHoraria');
        if (inputData && inputData.value) {
            const partesData = inputData.value.split('-');
            if(partesData.length === 3) {
                dataBase = new Date(partesData[0], partesData[1] - 1, partesData[2]);
                ehHoje = (dataBase.getDate() === agora.getDate() && 
                          dataBase.getMonth() === agora.getMonth() && 
                          dataBase.getFullYear() === agora.getFullYear());
            }
        } else if (inputData && !inputData.value) {
            const mesStr = String(agora.getMonth() + 1).padStart(2, '0');
            const diaStr = String(agora.getDate()).padStart(2, '0');
            inputData.value = `${agora.getFullYear()}-${mesStr}-${diaStr}`;
        }
        const labelsX = [];
        const dadosBarraAtivos = [];
        const dadosBarraManut = [];
        const dadosBarraSOS = [];
        let horaLimite = 23;
        if (ehHoje) {
            horaLimite = agora.getHours();
        }
        for (let i = 0; i <= horaLimite; i++) {
            const inicioHora = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(), i, 0, 0, 0);
            const fimHora = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(), i, 59, 59, 999);
            
            let qtdFrotaAtivaHora = 0;
            let qtdEmManutencao = 0;
            let qtdEmSOS = 0;
            
            window.frotasManutencao.forEach(frota => {
                if(frota.status === 'Inativo') return;
                
                let frotaInicioStr = frota.data_inicial ? frota.data_inicial : '2026-04-01';
                let dtEntradaVeiculo = new Date(frotaInicioStr + 'T00:00:00');
                if (dtEntradaVeiculo > fimHora) return; 
                
                qtdFrotaAtivaHora++;
                
                let teveManutencaoComum = false;
                let teveSOS = false;
                const todasOSCavalo = window.ordensServico.filter(o => o.placa === frota.cavalo && o.tipo !== 'Cavalo Disponível S/ Carreta');
                
                todasOSCavalo.forEach(os => {
                    let osInicioStr = os.data_abertura;
                    if (!osInicioStr) return;
                    if (!osInicioStr.includes('T')) osInicioStr += 'T00:00:00';
                    const osInicio = new Date(osInicioStr.replace('Z', '').replace('+00:00', ''));
                    
                    let osFim = agora;
                    if (os.data_conclusao) {
                        let osFimStr = os.data_conclusao;
                        if (!osFimStr.includes('T')) osFimStr += 'T00:00:00';
                        osFim = new Date(osFimStr.replace('Z', '').replace('+00:00', ''));
                    }
                    
                    let inicioValido = osInicio > dtEntradaVeiculo ? osInicio : dtEntradaVeiculo;
                    const overlapInicio = inicioValido > inicioHora ? inicioValido : inicioHora;
                    const overlapFim = osFim < fimHora ? osFim : fimHora;
                    if (overlapInicio < overlapFim && os.status !== 'Agendada') {
                        const tipoOS = (os.tipo || os.tipo_manutencao || '').toUpperCase();
                        const descOS = (os.descricao || '').toUpperCase();
                        const prioridadeOS = (os.prioridade || '').toUpperCase();
                        if (
                            tipoOS.includes('S.O.S') || tipoOS.includes('SOS') || tipoOS.includes('SOCORRO') ||
                            descOS.includes('S.O.S') || descOS.includes('SOS') || descOS.includes('SOCORRO') ||
                            prioridadeOS.includes('EMERGÊNCIA')
                        ) {
                            teveSOS = true;
                        } else {
                            teveManutencaoComum = true;
                        }
                    }
                });
                if (teveSOS) {
                    qtdEmSOS++;
                } else if (teveManutencaoComum) {
                    qtdEmManutencao++;
                }
            });
            let qtdAtivos = qtdFrotaAtivaHora - qtdEmManutencao - qtdEmSOS;
            if (qtdAtivos < 0) qtdAtivos = 0;
            labelsX.push(`${String(i).padStart(2,'0')}:00`);
            dadosBarraAtivos.push(qtdAtivos);
            dadosBarraManut.push(qtdEmManutencao);
            dadosBarraSOS.push(qtdEmSOS);
        }
        let msTotalDiaCalc = 24 * 60 * 60 * 1000;
        let inicioDiaCalc = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(), 0, 0, 0, 0);
        let fimParaCalculoTotal = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(), 23, 59, 59, 999);
        if (ehHoje) {
            msTotalDiaCalc = agora - inicioDiaCalc;
            fimParaCalculoTotal = agora;
        }
        if (msTotalDiaCalc > 0) {
            let totalMsDisponivelDia = 0;
            let msManutencaoComumDia = 0;
            let msSOSDia = 0;
            
            window.frotasManutencao.forEach(frota => {
                if(frota.status === 'Inativo') return;
                
                let frotaInicioStr = frota.data_inicial ? frota.data_inicial : '2026-04-01';
                let dtEntradaVeiculo = new Date(frotaInicioStr + 'T00:00:00');
                
                let overlapDispInicio = dtEntradaVeiculo > inicioDiaCalc ? dtEntradaVeiculo : inicioDiaCalc;
                if (overlapDispInicio < fimParaCalculoTotal) {
                    totalMsDisponivelDia += (fimParaCalculoTotal - overlapDispInicio);
                }

                let manutComumCavalo = 0;
                let sosCavalo = 0;
                const todasOSCavalo = window.ordensServico.filter(o => o.placa === frota.cavalo && o.status !== 'Agendada' && o.tipo !== 'Cavalo Disponível S/ Carreta');
                
                todasOSCavalo.forEach(os => {
                    let osInicioStr = os.data_abertura;
                    if (!osInicioStr) return;
                    if (!osInicioStr.includes('T')) osInicioStr += 'T00:00:00';
                    const osInicio = new Date(osInicioStr.replace('Z', '').replace('+00:00', ''));
                    
                    let osFim = agora; 
                    if (os.data_conclusao) {
                        let osFimStr = os.data_conclusao;
                        if (!osFimStr.includes('T')) osFimStr += 'T00:00:00';
                        osFim = new Date(osFimStr.replace('Z', '').replace('+00:00', ''));
                    }
                    
                    let inicioValido = osInicio > dtEntradaVeiculo ? osInicio : dtEntradaVeiculo;
                    const overlapInicio = inicioValido > inicioDiaCalc ? inicioValido : inicioDiaCalc;
                    const overlapFim = osFim < fimParaCalculoTotal ? osFim : fimParaCalculoTotal;
                    if (overlapInicio < overlapFim) {
                        const tipoOS = (os.tipo || os.tipo_manutencao || '').toUpperCase();
                        const descOS = (os.descricao || '').toUpperCase();
                        const prioridadeOS = (os.prioridade || '').toUpperCase();
                        if (
                            tipoOS.includes('S.O.S') || tipoOS.includes('SOS') || tipoOS.includes('SOCORRO') ||
                            descOS.includes('S.O.S') || descOS.includes('SOS') || descOS.includes('SOCORRO') ||
                            prioridadeOS.includes('EMERGÊNCIA')
                        ) {
                            sosCavalo += (overlapFim - overlapInicio);
                        } else {
                            manutComumCavalo += (overlapFim - overlapInicio);
                        }
                    }
                });
                
                if (manutComumCavalo + sosCavalo > msTotalDiaCalc) {
                    let proporcao = msTotalDiaCalc / (manutComumCavalo + sosCavalo);
                    manutComumCavalo *= proporcao;
                    sosCavalo *= proporcao;
                }
                msManutencaoComumDia += manutComumCavalo;
                msSOSDia += sosCavalo;
            });
            let msManutTotal = msManutencaoComumDia + msSOSDia;
            let dispNoDiaMs = totalMsDisponivelDia - msManutTotal;
            if (dispNoDiaMs < 0) dispNoDiaMs = 0;
            const mediaAtivosReal = Math.round(dispNoDiaMs / msTotalDiaCalc);
            const mediaManutReal = Math.round(msManutencaoComumDia / msTotalDiaCalc);
            const mediaSOSReal = Math.round(msSOSDia / msTotalDiaCalc);
            const elAvgAtivosInterno = document.getElementById('avgAtivosInterno');
            const elAvgManutInterno = document.getElementById('avgManutInterno');
            const elAvgSOSInterno = document.getElementById('avgSOSInterno');
            if(elAvgAtivosInterno) elAvgAtivosInterno.innerText = mediaAtivosReal;
            if(elAvgManutInterno) elAvgManutInterno.innerText = mediaManutReal;
            if(elAvgSOSInterno) elAvgSOSInterno.innerText = mediaSOSReal;
        }
        if (typeof echarts === 'undefined') return;
        const chartDomBarras = document.getElementById('graficoStatusFrotaHorario');
        if (chartDomBarras) {
            let myChartBarras = echarts.getInstanceByDom(chartDomBarras);
            if (!myChartBarras) myChartBarras = echarts.init(chartDomBarras);
            const optionBarras = {
                backgroundColor: 'transparent',
                tooltip: { 
                    trigger: 'axis', 
                    axisPointer: { type: 'shadow' } 
                },
                legend: { 
                    data: ['Disponível', 'Manutenção', 'SOS'], 
                    textStyle: { color: '#ffffff', fontWeight: 'bold' }, 
                    top: 0 
                },
                grid: { 
                    top: '15%', left: '3%', right: '3%', bottom: '5%', containLabel: true 
                },
                xAxis: { 
                    type: 'category', 
                    data: labelsX, 
                    axisLabel: { color: '#ffffff', fontWeight: 'bold' } 
                },
                yAxis: { 
                    type: 'value', 
                    name: 'Quantidade de Veículos',
                    nameTextStyle: { color: '#ffffff', padding: [0, 0, 0, 50], fontWeight: 'bold', fontSize: 13 },
                    axisLabel: { color: '#ffffff', fontWeight: 'bold' }, 
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } 
                },
                series: [
                    { 
                        name: 'Disponível', 
                        type: 'bar', 
                        itemStyle: { color: '#10b981' }, 
                        data: dadosBarraAtivos,
                        label: { show: true, position: 'top', color: '#10b981', fontWeight: 'bold', formatter: (p) => p.value > 0 ? p.value : '', fontSize: 12 }
                    },
                    { 
                        name: 'Manutenção', 
                        type: 'bar', 
                        itemStyle: { color: '#f59e0b' }, 
                        data: dadosBarraManut,
                        label: { show: true, position: 'top', color: '#f59e0b', fontWeight: 'bold', formatter: (p) => p.value > 0 ? p.value : '', fontSize: 12 }
                    },
                    { 
                        name: 'SOS', 
                        type: 'bar', 
                        itemStyle: { color: '#ef4444' }, 
                        data: dadosBarraSOS,
                        label: { show: true, position: 'top', color: '#ef4444', fontWeight: 'bold', formatter: (p) => p.value > 0 ? p.value : '', fontSize: 12 }
                    }
                ]
            };
            myChartBarras.setOption(optionBarras);
            window.addEventListener('resize', () => myChartBarras.resize());
        }
    } catch(e) {
        console.error("Erro na DM Status Frota Horário:", e);
    }
};

window.preencherMesesDMDiaria = function() {
    const select = document.getElementById('filtroMesEvolucaoDMDiaria');
    if (!select || !window.ordensServico) return;

    const mesesDisponiveis = new Set();
    const hoje = new Date();
    const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    window.ordensServico.forEach(os => {
        if (os.data_abertura && os.status !== 'Agendada') {
            let dataStr = os.data_abertura;
            if (!dataStr.includes('T')) dataStr += 'T00:00:00';
            const data = new Date(dataStr.replace('Z', '').replace('+00:00', ''));
            if (!isNaN(data.getTime())) {
                const ano = data.getFullYear();
                const mes = String(data.getMonth() + 1).padStart(2, '0');
                mesesDisponiveis.add(`${ano}-${mes}`);
            }
        }
    });

    mesesDisponiveis.add(mesAtualKey); 
    const mesesOrdenados = Array.from(mesesDisponiveis).sort((a, b) => b.localeCompare(a)); 
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const optionsAtuais = Array.from(select.options).map(o => o.value).join(',');
    const novasOptions = mesesOrdenados.join(',');

    if (optionsAtuais !== novasOptions) {
        let html = '';
        mesesOrdenados.forEach(chave => {
            const [ano, mes] = chave.split('-');
            const nomeMes = nomesMeses[parseInt(mes) - 1];
            const label = `${nomeMes}/${ano.slice(2)}`;
            const isAtual = chave === mesAtualKey;
            html += `<option value="${chave}" ${isAtual ? 'selected' : ''}>${label}</option>`;
        });
        
        const valAnterior = select.value;
        select.innerHTML = html;
        if (valAnterior && mesesOrdenados.includes(valAnterior)) {
            select.value = valAnterior;
        }
    }
};

window.renderizarGraficoEvolucaoDMDiaria = function() {
    try {
        if (!window.frotasManutencao || window.frotasManutencao.length === 0) return;
        
        if (typeof window.preencherMesesDMDiaria === 'function') {
            window.preencherMesesDMDiaria();
        }

        const selectMes = document.getElementById('filtroMesEvolucaoDMDiaria');
        let dataInicio, hoje;

        if (selectMes && selectMes.value) {
            const [ano, mes] = selectMes.value.split('-');
            dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1, 0, 0, 0);
            hoje = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59, 999);

            const agora = new Date();
            if (dataInicio.getFullYear() === agora.getFullYear() && dataInicio.getMonth() === agora.getMonth()) {
                hoje = agora;
            }
        } else {
            const datasFiltro = typeof window.getDatasFiltroGlobal === 'function' ? window.getDatasFiltroGlobal() : { inicio: new Date(), fim: new Date() };
            dataInicio = new Date(datasFiltro.inicio);
            hoje = new Date(datasFiltro.fim);
        }

        const labelsDias = [];
        const dadosDMDiaria = [];
        let atual = new Date(dataInicio);
        
        while (atual <= hoje) {
            const inicioDia = new Date(atual.getFullYear(), atual.getMonth(), atual.getDate(), 0, 0, 0);
            const fimDia = new Date(atual.getFullYear(), atual.getMonth(), atual.getDate(), 23, 59, 59, 999);
            
            let msTotalDia = 24 * 60 * 60 * 1000;
            let fimParaCalculo = fimDia;
            const ehHoje = (atual.toDateString() === new Date().toDateString());
            if (ehHoje) {
                const agora = new Date();
                msTotalDia = agora - inicioDia;
                fimParaCalculo = agora;
            }
            if (msTotalDia > 0) {
                let qtdFrotaDia = 0;
                let totalMsDisponivelDia = 0;
                let msManutencaoDia = 0;
                
                window.frotasManutencao.forEach(frota => {
                    if(frota.status === 'Inativo') return;
                    
                    let frotaInicioStr = frota.data_inicial ? frota.data_inicial : '2026-04-01';
                    let dtEntradaVeiculo = new Date(frotaInicioStr + 'T00:00:00');
                    
                    let overlapDispInicio = dtEntradaVeiculo > inicioDia ? dtEntradaVeiculo : inicioDia;
                    if (overlapDispInicio < fimParaCalculo) {
                        totalMsDisponivelDia += (fimParaCalculo - overlapDispInicio);
                        qtdFrotaDia++;
                    }

                    let manutencaoCavalo = 0;
                    const todasOSCavalo = window.ordensServico.filter(o => o.placa === frota.cavalo && o.status !== 'Agendada' && o.tipo !== 'Cavalo Disponível S/ Carreta');
                    
                    todasOSCavalo.forEach(os => {
                        let osInicioStr = os.data_abertura;
                        if (!osInicioStr) return;
                        if (!osInicioStr.includes('T')) osInicioStr += 'T00:00:00';
                        const osInicio = new Date(osInicioStr.replace('Z', '').replace('+00:00', ''));
                        
                        let osFim = new Date(); 
                        if (os.data_conclusao) {
                            let osFimStr = os.data_conclusao;
                            if (!osFimStr.includes('T')) osFimStr += 'T00:00:00';
                            osFim = new Date(osFimStr.replace('Z', '').replace('+00:00', ''));
                        }
                        
                        let inicioValido = osInicio > dtEntradaVeiculo ? osInicio : dtEntradaVeiculo;
                        const overlapInicio = inicioValido > inicioDia ? inicioValido : inicioDia;
                        const overlapFim = osFim < fimParaCalculo ? osFim : fimParaCalculo;
                        if (overlapInicio < overlapFim) {
                            manutencaoCavalo += (overlapFim - overlapInicio);
                        }
                    });
                    if (manutencaoCavalo > msTotalDia) manutencaoCavalo = msTotalDia;
                    msManutencaoDia += manutencaoCavalo;
                });
                let dispNoDiaMs = totalMsDisponivelDia - msManutencaoDia;
                if (dispNoDiaMs < 0) dispNoDiaMs = 0;
                let percentDM = totalMsDisponivelDia > 0 ? (dispNoDiaMs / totalMsDisponivelDia) * 100 : 100;
                let mediaCavalosDisp = msTotalDia > 0 ? Math.round(dispNoDiaMs / msTotalDia) : 0;
                const diaStr = String(atual.getDate()).padStart(2, '0') + '/' + String(atual.getMonth() + 1).padStart(2, '0');
                labelsDias.push(diaStr);
                
                dadosDMDiaria.push({
                    value: percentDM.toFixed(2),
                    disp: mediaCavalosDisp,
                    total: qtdFrotaDia 
                });
            }
            
            atual.setDate(atual.getDate() + 1);
        }

        let somaDM = 0;
        dadosDMDiaria.forEach(d => somaDM += parseFloat(d.value));
        let mediaDM = dadosDMDiaria.length > 0 ? (somaDM / dadosDMDiaria.length).toFixed(1) : 0;

        let totalOSMes = 0;
        let concluidasOSMes = 0;
        let tempoTotalMs = 0;
        let osComTempo = 0;

        window.ordensServico.forEach(os => {
            if (os.status === 'Agendada') return;
            let osInicioStr = os.data_abertura;
            if (!osInicioStr) return;
            if (!osInicioStr.includes('T')) osInicioStr += 'T00:00:00';
            const dtAbertura = new Date(osInicioStr.replace('Z', '').replace('+00:00', ''));
            
            let dtConclusao = new Date();
            if (os.data_conclusao) {
                let osFimStr = os.data_conclusao;
                if (!osFimStr.includes('T')) osFimStr += 'T00:00:00';
                dtConclusao = new Date(osFimStr.replace('Z', '').replace('+00:00', ''));
            }

            if (dtAbertura <= hoje && dtConclusao >= dataInicio) {
                totalOSMes++;
                if (os.status === 'Concluída' || os.status === 'Resolvido') {
                    concluidasOSMes++;
                    if (os.data_conclusao) {
                        tempoTotalMs += (dtConclusao - dtAbertura);
                        osComTempo++;
                    }
                }
            }
        });

        let tempoMedioStr = '0h 0m';
        if (osComTempo > 0) {
            let mediaMs = tempoTotalMs / osComTempo;
            let mediaHoras = Math.floor(mediaMs / (1000 * 60 * 60));
            let mediaMinutos = Math.floor((mediaMs % (1000 * 60 * 60)) / (1000 * 60));
            tempoMedioStr = `${mediaHoras}h ${mediaMinutos}m`;
        }

        const elKpiMiniDM = document.getElementById('kpiMiniDM');
        const elKpiMiniTotal = document.getElementById('kpiMiniTotalOS');
        const elKpiMiniConcluidas = document.getElementById('kpiMiniConcluidas');
        const elKpiMiniTempo = document.getElementById('kpiMiniTempo');

        if(elKpiMiniDM) elKpiMiniDM.innerText = mediaDM + '%';
        if(elKpiMiniTotal) elKpiMiniTotal.innerText = totalOSMes;
        if(elKpiMiniConcluidas) elKpiMiniConcluidas.innerText = concluidasOSMes;
        if(elKpiMiniTempo) elKpiMiniTempo.innerText = tempoMedioStr;
        
        if (typeof echarts === 'undefined') return;
        const chartDom = document.getElementById('graficoEvolucaoDMDiaria');
        if (chartDom) {
            let myChart = echarts.getInstanceByDom(chartDom);
            if (!myChart) myChart = echarts.init(chartDom);
            const option = {
                backgroundColor: 'transparent',
                tooltip: { 
                    trigger: 'axis', 
                    formatter: function (params) {
                        const d = params[0].data;
                        return `<b style="font-size:14px; border-bottom:1px solid #444; padding-bottom:4px; display:block; margin-bottom:4px;">${params[0].name}</b>` +
                               `Média Disponíveis: <span style="color:#10b981; font-weight:bold;">${d.disp}</span> / ${d.total} veículos<br/>` +
                               `Índice DM: <span style="color:#10b981; font-weight:bold;">${d.value}%</span>`;
                    }
                },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: labelsDias,
                    axisLabel: { color: '#ffffff', fontWeight: 'bold' }
                },
                yAxis: {
                    type: 'value',
                    min: 0,
                    max: 100,
                    axisLabel: { formatter: '{value}%', color: '#ffffff', fontWeight: 'bold' },
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
                },
                series: [{
                    name: 'Média DM Diária',
                    type: 'line',
                    data: dadosDMDiaria,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    label: {
                        show: true,
                        position: 'top',
                        formatter: function (params) {
                            return `${params.data.disp}/${params.data.total}\n(${params.data.value}%)`;
                        },
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: '900',
                        align: 'center',
                        lineHeight: 18,
                        textBorderColor: 'rgba(0, 0, 0, 0.8)',
                        textBorderWidth: 3
                    },
                    itemStyle: { color: '#10b981' }, 
                    lineStyle: { width: 4 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
                        ])
                    }
                }]
            };
            myChart.setOption(option);
            window.removeEventListener('resize', myChart.resize);
            window.addEventListener('resize', () => myChart.resize());
        }
    } catch(e) {
        console.error("Erro na DM Evolução Diária Geral:", e);
    }
};

// =================================================================
// PAINÉIS INFERIORES FALTANTES (AGORA FUNCIONANDO)
// =================================================================
window.renderizarRankingCavalos = function() {
    const container = document.getElementById('rankingCavalosOS');
    if(!container) return;
    const os = window.ordensServico || [];
    const { inicio, fim } = window.getDatasFiltroGlobal();
    
    const contagem = {};
    os.forEach(o => {
        if(o.status === 'Agendada' || o.tipo === 'Cavalo Disponível S/ Carreta') return;
        let dtStr = o.data_abertura;
        if(!dtStr) return;
        if (!dtStr.includes('T')) dtStr += 'T00:00:00';
        const dtAbertura = new Date(dtStr.replace('Z', '').replace('+00:00', ''));
        
        if(dtAbertura >= inicio && dtAbertura <= fim && o.placa) {
            contagem[o.placa] = (contagem[o.placa] || 0) + 1;
        }
    });

    const top5 = Object.entries(contagem).sort((a,b) => b[1] - a[1]).slice(0, 5);
    
    if(top5.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding: 20px;">Nenhuma ocorrência no período.</p>';
        return;
    }

    container.innerHTML = top5.map((item, index) => {
        const placa = item[0];
        const qtd = item[1];
        let cor = '#3b82f6';
        if(index === 0) cor = '#ef4444';
        else if(index === 1) cor = '#f97316';
        else if(index === 2) cor = '#facc15';

        return `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 12px 15px; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid ${cor};">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2rem; font-weight: bold; color: ${cor};">#${index+1}</span>
                <span style="font-size: 1.1rem; font-weight: bold; color: white;">${placa}</span>
            </div>
            <div style="font-size: 1.2rem; font-weight: 900; color: white;">${qtd} <span style="font-size: 0.8rem; font-weight: normal; color: #94a3b8;">O.S.</span></div>
        </div>`;
    }).join('');
};

window.renderizarOcorrenciasTipoBarra = function() {
    const container = document.getElementById('graficoOcorrenciasTipoBarra');
    if(!container || typeof echarts === 'undefined') return;
    const os = window.ordensServico || [];
    const { inicio, fim } = window.getDatasFiltroGlobal();

    const contagem = {};
    os.forEach(o => {
        if(o.status === 'Agendada' || o.tipo === 'Cavalo Disponível S/ Carreta') return;
        let dtStr = o.data_abertura;
        if(!dtStr) return;
        if (!dtStr.includes('T')) dtStr += 'T00:00:00';
        const dtAbertura = new Date(dtStr.replace('Z', '').replace('+00:00', ''));
        if(dtAbertura >= inicio && dtAbertura <= fim) {
            const tipo = o.tipo || 'Outros';
            contagem[tipo] = (contagem[tipo] || 0) + 1;
        }
    });

    const keys = Object.keys(contagem).sort((a,b) => contagem[a] - contagem[b]); 
    const values = keys.map(k => contagem[k]);

    let myChart = echarts.getInstanceByDom(container);
    if (!myChart) myChart = echarts.init(container);
    
    const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { top: '10%', left: '3%', right: '10%', bottom: '5%', containLabel: true },
        xAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#94a3b8' } },
        yAxis: { type: 'category', data: keys, axisLabel: { color: '#ffffff', width: 120, overflow: 'truncate' } },
        series: [{
            name: 'Quantidade',
            type: 'bar',
            data: values,
            itemStyle: { color: '#0ea5e9', borderRadius: [0, 4, 4, 0] },
            label: { show: true, position: 'right', color: '#fff', fontWeight: 'bold' }
        }]
    };
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
};

window.renderizarPrioridadeOS = function() {
    const container = document.getElementById('graficoPrioridadeOS');
    if(!container || typeof echarts === 'undefined') return;
    const os = window.ordensServico || [];
    const { inicio, fim } = window.getDatasFiltroGlobal();

    const contagem = { 'Urgente': 0, 'Alta': 0, 'Normal': 0, 'Baixa': 0 };
    os.forEach(o => {
        if(o.status === 'Agendada' || o.tipo === 'Cavalo Disponível S/ Carreta') return;
        let dtStr = o.data_abertura;
        if(!dtStr) return;
        if (!dtStr.includes('T')) dtStr += 'T00:00:00';
        const dtAbertura = new Date(dtStr.replace('Z', '').replace('+00:00', ''));
        if(dtAbertura >= inicio && dtAbertura <= fim) {
            const pri = o.prioridade || 'Normal';
            if(contagem[pri] !== undefined) contagem[pri]++;
            else contagem['Normal']++;
        }
    });

    const dataPie = [
        { value: contagem['Urgente'], name: 'Urgente', itemStyle: { color: '#ef4444' } },
        { value: contagem['Alta'], name: 'Alta', itemStyle: { color: '#f97316' } },
        { value: contagem['Normal'], name: 'Normal', itemStyle: { color: '#3b82f6' } },
        { value: contagem['Baixa'], name: 'Baixa', itemStyle: { color: '#10b981' } }
    ].filter(d => d.value > 0);

    let myChart = echarts.getInstanceByDom(container);
    if (!myChart) myChart = echarts.init(container);
    
    const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        legend: { bottom: '0', textStyle: { color: '#ffffff' } },
        series: [{
            name: 'Prioridade',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold', color: '#fff' } },
            labelLine: { show: false },
            data: dataPie
        }]
    };
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
};

window.renderizarRelatorioTipoServico = function() {
    const tbody = document.getElementById('tabelaRelatorioTipoServico');
    if(!tbody) return;
    const os = window.ordensServico || [];
    const { inicio, fim } = window.getDatasFiltroGlobal();

    const resumo = {};
    os.forEach(o => {
        if(o.status === 'Agendada' || o.tipo === 'Cavalo Disponível S/ Carreta') return;
        let dtStr = o.data_abertura;
        if(!dtStr) return;
        if (!dtStr.includes('T')) dtStr += 'T00:00:00';
        const dtAbertura = new Date(dtStr.replace('Z', '').replace('+00:00', ''));
        
        if(dtAbertura >= inicio && dtAbertura <= fim) {
            const tipo = o.tipo || 'Outros';
            if(!resumo[tipo]) resumo[tipo] = { count: 0, tempoTotal: 0, countConcluido: 0 };
            resumo[tipo].count++;

            if (o.data_conclusao && (o.status === 'Concluída' || o.status === 'Resolvido')) {
                let cStr = o.data_conclusao;
                if (!cStr.includes('T')) cStr += 'T00:00:00';
                const dtConclusao = new Date(cStr.replace('Z', '').replace('+00:00', ''));
                resumo[tipo].tempoTotal += (dtConclusao - dtAbertura);
                resumo[tipo].countConcluido++;
            }
        }
    });

    const rows = Object.keys(resumo).sort((a,b) => resumo[b].count - resumo[a].count).map(tipo => {
        const item = resumo[tipo];
        let tempoStr = '-';
        if(item.countConcluido > 0) {
            const mediaMs = item.tempoTotal / item.countConcluido;
            const horas = Math.floor(mediaMs / (1000 * 60 * 60));
            const min = Math.floor((mediaMs % (1000 * 60 * 60)) / (1000 * 60));
            tempoStr = `${horas}h ${min}m`;
        }

        return `
        <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 12px 10px; color: #fff; font-weight: 600;">${tipo}</td>
            <td style="text-align: center; padding: 12px 10px; color: #3b82f6; font-weight: bold; font-size: 1.1rem;">${item.count}</td>
            <td style="text-align: right; padding: 12px 10px; color: #a855f7; font-weight: bold;">${tempoStr}</td>
        </tr>
        `;
    });

    if(rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; color: #94a3b8;">Nenhum dado no período selecionado.</td></tr>';
    } else {
        tbody.innerHTML = rows.join('');
    }
};

// =================================================================
// FUNÇÕES DO MURAL
// =================================================================
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

// =================================================================
// INICIALIZAÇÃO
// =================================================================
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
                if (typeof window.dispararFiltrosGlobais === 'function') window.dispararFiltrosGlobais();
                if(document.getElementById('data-mural-setor')) {
                    document.getElementById('data-mural-setor').value = new Date().toISOString().split('T')[0];
                }
                window.carregarMuralSetor();
            }, 300);
        });
    } else {
        setTimeout(() => {
            if (typeof window.dispararFiltrosGlobais === 'function') window.dispararFiltrosGlobais();
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

setInterval(() => {
    if (typeof window.frotasManutencao === 'undefined' || window.frotasManutencao.length === 0) return;
    
    if (typeof window.preencherMesesDMDiaria === 'function') window.preencherMesesDMDiaria();
    
    const chartDomDiaria = document.getElementById('graficoEvolucaoDMDiaria');
    if (chartDomDiaria && chartDomDiaria.offsetWidth > 0 && !chartDomDiaria.getAttribute('data-rendered')) {
        chartDomDiaria.setAttribute('data-rendered', 'true');
        if (typeof window.renderizarGraficoEvolucaoDMDiaria === 'function') window.renderizarGraficoEvolucaoDMDiaria();
    }
    
    const chartDomBarras = document.getElementById('graficoStatusFrotaHorario');
    if (chartDomBarras && chartDomBarras.offsetWidth > 0 && !chartDomBarras.getAttribute('data-rendered')) {
        chartDomBarras.setAttribute('data-rendered', 'true');
        if (typeof window.renderizarGraficoStatusFrotaHorario === 'function') window.renderizarGraficoStatusFrotaHorario();
    }
    
    const elKpi = document.getElementById('kpiTotalOS');
    if (elKpi && !elKpi.getAttribute('data-rendered')) {
        elKpi.setAttribute('data-rendered', 'true');
        if (typeof window.atualizarKPIsGlobais === 'function') window.atualizarKPIsGlobais();
    }
}, 1000);

setInterval(() => {
    if (typeof window.atualizarKPIsGlobais === 'function') window.atualizarKPIsGlobais();
    const chartDomBarras = document.getElementById('graficoStatusFrotaHorario');
    if (chartDomBarras && chartDomBarras.offsetWidth > 0 && typeof window.renderizarGraficoStatusFrotaHorario === 'function') {
        window.renderizarGraficoStatusFrotaHorario();
    }
}, 60000);