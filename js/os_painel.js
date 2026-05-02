// =================================================================
// js/os_painel.js - Integração Completa do Menu de Manutenção
// =================================================================

// 1. Configuração do Supabase Exclusivo para Manutenção
const supabaseUrlManutencao = 'https://ihgiyxzxdldqmrkziijl.supabase.co';
const supabaseKeyManutencao = 'sb_publishable_JpMZhW5ZrFKBr7m9KXBkoQ_cpxy1k3x';

// Inicializa a instância separada para não conflitar com a base principal (viagens)
const supabaseManutencao = window.supabase.createClient(supabaseUrlManutencao, supabaseKeyManutencao);

// Variáveis Globais de Manutenção
window.ordensServico = [];
window.frotasManutencao = [];

// Função que puxa os dados ao abrir o Dashboard
window.carregarDadosManutencao = async function() {
    try {
        // Busca Ordens de Serviço
        const { data: osData, error: osError } = await supabaseManutencao.from('ordens_servico').select('*');
        if (!osError && osData) {
            window.ordensServico = osData;
        } else {
            window.ordensServico = [];
        }

        // CORREÇÃO: Busca a frota real cadastrada na tabela frotas_manutencao
        const { data: frotaData, error: frotaError } = await supabaseManutencao.from('frotas_manutencao').select('*').order('cavalo', { ascending: true });
        
        if (!frotaError && frotaData) {
            window.frotasManutencao = frotaData;
        } else {
            window.frotasManutencao = [];
        }

    } catch (error) {
        console.error("Erro Crítico ao carregar dados da manutenção:", error);
    }
};

// =================================================================
// FUNÇÕES DO FILTRO GLOBAL E KPIS
// =================================================================
window.getDatasFiltroGlobal = function() {
    const selectFiltro = document.getElementById('filtroGlobalPeriodo');
    const filtro = selectFiltro ? selectFiltro.value : 'mes_atual';
    const hoje = new Date();
    let inicio = new Date(hoje);
    inicio.setHours(0,0,0,0);
    
    let fim = new Date();
    fim.setHours(23,59,59,999);
    if (filtro === 'dia_atual') {
        // inicio já é hoje às 00:00
    } else if (filtro === 'semana_atual') {
        inicio.setDate(inicio.getDate() - inicio.getDay());
    } else if (filtro === 'mes_atual') {
        inicio.setDate(1);
    } else {
        let d = parseInt(filtro) || 30;
        inicio.setDate(inicio.getDate() - d + 1);
    }
    return { inicio: inicio, fim: fim, valorBruto: filtro };
};

window.atualizarKPIsGlobais = function() {
    try {
        if (!window.ordensServico) return;
        const datas = window.getDatasFiltroGlobal();
        const inicio = datas.inicio;
        const fim = datas.fim;
        
        let totalOS = 0, abertasOS = 0, concluidasOS = 0, msTotalTempo = 0, osComTempo = 0;
        
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
        
        if(document.getElementById('kpiTotalOS')) document.getElementById('kpiTotalOS').innerText = totalOS;
        if(document.getElementById('kpiAbertasOS')) document.getElementById('kpiAbertasOS').innerText = abertasOS;
        if(document.getElementById('kpiConcluidasOS')) document.getElementById('kpiConcluidasOS').innerText = concluidasOS;
        if(document.getElementById('kpiTaxaOS')) document.getElementById('kpiTaxaOS').innerText = taxaConclusao + '%';
        if(document.getElementById('kpiTempoMedioOS')) document.getElementById('kpiTempoMedioOS').innerText = tempoMedioStr;
        
        if (!window.frotasManutencao || window.frotasManutencao.length === 0) return;
        
        const totalFrota = window.frotasManutencao.length;
        let fimParaCalculo = fim > new Date() ? new Date() : fim;
        let msTotalPeriodo = fimParaCalculo - inicio;
        if (msTotalPeriodo <= 0) msTotalPeriodo = 1;
        let msManutencaoComum = 0, msSOS = 0;
        
        window.frotasManutencao.forEach(frota => {
            const todasOSCavalo = window.ordensServico.filter(o => o.placa === frota.cavalo && o.status !== 'Agendada');
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
                const overlapInicio = osInicio > inicio ? osInicio : inicio;
                const overlapFim = osFim < fimParaCalculo ? osFim : fimParaCalculo;
                if (overlapInicio < overlapFim) {
                    const tempoParado = overlapFim - overlapInicio;
                    const tipoOS = (os.tipo || os.tipo_manutencao || '').toUpperCase();
                    if (tipoOS.includes('S.O.S') || tipoOS.includes('SOS')) {
                        msSOS += tempoParado;
                    } else {
                        msManutencaoComum += tempoParado;
                    }
                }
            });
        });
        
        const totalMsDisponivelPeriodo = totalFrota * msTotalPeriodo;
        let msManutTotal = msManutencaoComum + msSOS;
        let dispNoPeriodoMs = totalMsDisponivelPeriodo - msManutTotal;
        if (dispNoPeriodoMs < 0) dispNoPeriodoMs = 0;
        const mediaAtivosReal = Math.round(dispNoPeriodoMs / msTotalPeriodo);
        const mediaManutReal = Math.round(msManutencaoComum / msTotalPeriodo);
        const mediaSOSReal = Math.round(msSOS / msTotalPeriodo);
        const percentDMReal = totalMsDisponivelPeriodo > 0 ? (dispNoPeriodoMs / totalMsDisponivelPeriodo) * 100 : 100;
        
        if(document.getElementById('avgDM')) document.getElementById('avgDM').innerText = percentDMReal.toFixed(1) + '%';
        if(document.getElementById('avgAtivos')) document.getElementById('avgAtivos').innerText = mediaAtivosReal;
        if(document.getElementById('avgManut')) document.getElementById('avgManut').innerText = mediaManutReal;
        if(document.getElementById('avgSOS')) document.getElementById('avgSOS').innerText = mediaSOSReal;
    } catch(e) {
        console.error("Erro ao atualizar KPIs Globais:", e);
    }
};

window.dispararFiltrosGlobais = function() {
    try { if(typeof atualizarKPIsGlobais === 'function') atualizarKPIsGlobais(); } catch(e){}
    try { if(typeof renderizarGraficoEvolucaoDMDiaria === 'function') renderizarGraficoEvolucaoDMDiaria(); } catch(e){}
    try { if(typeof renderizarRelatorioGerencialOS === 'function') renderizarRelatorioGerencialOS(); } catch(e){}
    try { if(typeof renderizarRelatorioTipoServico === 'function') renderizarRelatorioTipoServico(); } catch(e){}
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

    let html = '';
    mesesOrdenados.forEach(chave => {
        const [ano, mes] = chave.split('-');
        const nomeMes = nomesMeses[parseInt(mes) - 1];
        const label = `${nomeMes}/${ano.slice(2)}`;
        const isAtual = chave === mesAtualKey;
        html += `<option value="${chave}" ${isAtual ? 'selected' : ''}>${label}</option>`;
    });
    
    select.innerHTML = html;
};

window.renderizarGraficoEvolucaoDMDiaria = function() {
    try {
        if (!window.frotasManutencao || window.frotasManutencao.length === 0) return;
        
        if (document.getElementById('filtroMesEvolucaoDMDiaria').options.length === 0) {
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
            hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
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
                let qtdFrotaDia = window.frotasManutencao.length;
                const totalMsDisponivelDia = qtdFrotaDia * msTotalDia;
                let msManutencaoDia = 0;
                
                window.frotasManutencao.forEach(frota => {
                    let manutencaoCavalo = 0;
                    const todasOSCavalo = window.ordensServico.filter(o => o.placa === frota.cavalo && o.status !== 'Agendada');
                    
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
                        const overlapInicio = osInicio > inicioDia ? osInicio : inicioDia;
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

        // Mini KPIs
        let somaDM = 0;
        dadosDMDiaria.forEach(d => somaDM += parseFloat(d.value));
        let mediaDM = dadosDMDiaria.length > 0 ? (somaDM / dadosDMDiaria.length).toFixed(1) : 0;

        let totalOSMes = 0, concluidasOSMes = 0, tempoTotalMs = 0, osComTempo = 0;
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

        if(document.getElementById('kpiMiniDM')) document.getElementById('kpiMiniDM').innerText = mediaDM + '%';
        if(document.getElementById('kpiMiniTotalOS')) document.getElementById('kpiMiniTotalOS').innerText = totalOSMes;
        if(document.getElementById('kpiMiniConcluidas')) document.getElementById('kpiMiniConcluidas').innerText = concluidasOSMes;
        if(document.getElementById('kpiMiniTempo')) document.getElementById('kpiMiniTempo').innerText = tempoMedioStr;

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
                        return `<b style="font-size:14px;">${params[0].name}</b><br/>` +
                               `Disponíveis: <span style="color:#10b981; font-weight:bold;">${d.disp}</span>/${d.total}<br/>` +
                               `DM: <span style="color:#10b981; font-weight:bold;">${d.value}%</span>`;
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
                        formatter: function (params) { return `${params.data.disp}/${params.data.total}\n(${params.data.value}%)`; },
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: '900',
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
            setTimeout(() => myChart.resize(), 100);
            window.addEventListener('resize', () => myChart.resize());
        }
    } catch(e) { console.error("Erro na DM Evolução Diária:", e); }
};

window.renderizarRelatorioGerencialOS = function() {
    let filtroData = window.getDatasFiltroGlobal();

    const osManutencao = window.ordensServico.filter(o => {
        if (o.tipo === 'Sinistro') return false;
        if (!o.data_abertura) return false;
        let osInicioStr = o.data_abertura;
        if (!osInicioStr.includes('T')) osInicioStr += 'T00:00:00';
        const d = new Date(osInicioStr.replace('Z', '').replace('+00:00', ''));
        return d >= filtroData.inicio && d <= filtroData.fim;
    });

    const porCavalo = {};
    osManutencao.forEach(o => { porCavalo[o.placa] = (porCavalo[o.placa] || 0) + 1; });
    const topCavalos = Object.entries(porCavalo).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    const maxCavaloCount = topCavalos.length > 0 ? topCavalos[0][1] : 1;
    let htmlCavalos = '';
    topCavalos.forEach(([placa, qtd], index) => {
        const percent = (qtd / maxCavaloCount) * 100;
        htmlCavalos += `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.85rem; color: #e2e8f0;">
                    <strong>${index + 1}º ${placa}</strong><span>${qtd} O.S.</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); border-radius: 4px; height: 12px; overflow: hidden;">
                    <div style="background: #ef4444; width: ${percent}%; height: 100%;"></div>
                </div>
            </div>`;
    });
    if(document.getElementById('rankingCavalosOS')) document.getElementById('rankingCavalosOS').innerHTML = htmlCavalos || '<p style="color:#94a3b8;">Sem dados.</p>';

    const porPrioridade = { 'Urgente': 0, 'Alta': 0, 'Normal': 0, 'Baixa': 0 };
    osManutencao.forEach(o => { if(porPrioridade[o.prioridade] !== undefined) porPrioridade[o.prioridade]++; });
    const colorsPri = { 'Urgente': '#ef4444', 'Alta': '#f97316', 'Normal': '#eab308', 'Baixa': '#10b981' };
    
    let htmlPrio = '';
    Object.keys(porPrioridade).forEach(p => {
        const qtd = porPrioridade[p];
        const percent = osManutencao.length > 0 ? (qtd / osManutencao.length) * 100 : 0;
        htmlPrio += `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.85rem; color: #e2e8f0;">
                    <span>Prioridade <strong>${p}</strong></span><span>${qtd} ocorrências</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); border-radius: 4px; height: 10px; overflow: hidden;">
                    <div style="background: ${colorsPri[p]}; width: ${percent}%; height: 100%;"></div>
                </div>
            </div>`;
    });
    if(document.getElementById('graficoPrioridadeOS')) document.getElementById('graficoPrioridadeOS').innerHTML = htmlPrio || '<p style="color:#94a3b8;">Sem dados.</p>';

    window.renderizarGraficoOcorrenciasPorTipo();
};

window.renderizarGraficoOcorrenciasPorTipo = function() {
    const el = document.getElementById('graficoOcorrenciasTipoBarra');
    if (!el) return;

    let filtroData = window.getDatasFiltroGlobal();
    const filtradas = window.ordensServico.filter(o => {
        if (o.tipo === 'Sinistro') return false; 
        if (!o.data_abertura) return false;
        let osInicioStr = o.data_abertura;
        if (!osInicioStr.includes('T')) osInicioStr += 'T00:00:00';
        const d = new Date(osInicioStr.replace('Z', '').replace('+00:00', ''));
        return d >= filtroData.inicio && d <= filtroData.fim;
    });

    const contagem = {};
    filtradas.forEach(o => {
        const t = o.tipo || 'Não Informado';
        contagem[t] = (contagem[t] || 0) + 1;
    });

    const sorted = Object.entries(contagem).sort((a,b) => b[1] - a[1]);
    const categories = sorted.map(i => i[0]);
    const data = sorted.map(i => i[1]);

    if (categories.length === 0) {
        el.innerHTML = '<div style="color:#94a3b8; display:flex; justify-content:center; align-items:center; height:100%;">Nenhuma O.S registrada no período.</div>';
        return;
    }

    if (typeof echarts !== 'undefined') {
        el.innerHTML = ''; 
        if (window.chartOcorrenciasTipo) window.chartOcorrenciasTipo.dispose();
        
        window.chartOcorrenciasTipo = echarts.init(el);
        const option = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '4%', bottom: '25%', top: '15%', containLabel: true },
            xAxis: {
                type: 'category',
                data: categories,
                axisLabel: { color: '#94a3b8', rotate: 35, interval: 0, fontSize: 10, fontWeight: 'bold' }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#94a3b8' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
            },
            series: [{
                name: 'Ocorrências',
                type: 'bar',
                data: data,
                barWidth: '40%',
                label: { show: true, position: 'top', color: '#fff', fontWeight: 'bold' },
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#0ea5e9' },
                        { offset: 1, color: '#3b82f6' }
                    ]),
                    borderRadius: [6, 6, 0, 0] 
                }
            }]
        };
        window.chartOcorrenciasTipo.setOption(option);
        setTimeout(() => window.chartOcorrenciasTipo.resize(), 100);
        window.addEventListener('resize', () => window.chartOcorrenciasTipo.resize());
    }
};

// =================================================================
// NOVA TABELA: DESEMPENHO POR TIPO DE SERVIÇO
// =================================================================
window.renderizarRelatorioTipoServico = function() {
    const tbody = document.getElementById('tabelaRelatorioTipoServico');
    if (!tbody) return;
    
    let filtroData = window.getDatasFiltroGlobal();

    // Filtra O.S. que estão dentro do período selecionado
    const osNoPeriodo = window.ordensServico.filter(o => {
        if (o.status === 'Agendada') return false;
        if (!o.data_abertura) return false;
        let osInicioStr = o.data_abertura;
        if (!osInicioStr.includes('T')) osInicioStr += 'T00:00:00';
        const d = new Date(osInicioStr.replace('Z', '').replace('+00:00', ''));
        return d >= filtroData.inicio && d <= filtroData.fim;
    });

    // Agrupa e consolida as métricas
    const agrupado = {};
    
    osNoPeriodo.forEach(os => {
        const tipo = os.tipo || os.tipo_manutencao || 'Não Informado';
        if (!agrupado[tipo]) {
            agrupado[tipo] = { quantidade: 0, tempoTotalMs: 0, concluidasComTempo: 0 };
        }
        
        agrupado[tipo].quantidade++;
        
        // Calcula o tempo médio apenas se estiver concluída e possuir as datas
        if ((os.status === 'Concluída' || os.status === 'Resolvido') && os.data_abertura && os.data_conclusao) {
            const inicio = new Date(os.data_abertura.replace('Z', '').replace('+00:00', ''));
            const fim = new Date(os.data_conclusao.replace('Z', '').replace('+00:00', ''));
            if (fim > inicio) {
                agrupado[tipo].tempoTotalMs += (fim - inicio);
                agrupado[tipo].concluidasComTempo++;
            }
        }
    });

    // Formatação e ordenação
    let dadosTabela = Object.keys(agrupado).map(tipo => {
        const info = agrupado[tipo];
        let tempoMedioStr = '-';
        
        if (info.concluidasComTempo > 0) {
            const mediaMs = info.tempoTotalMs / info.concluidasComTempo;
            const mediaHrs = Math.floor(mediaMs / (1000 * 60 * 60));
            const mediaMin = Math.floor((mediaMs % (1000 * 60 * 60)) / (1000 * 60));
            tempoMedioStr = `${mediaHrs}h ${String(mediaMin).padStart(2, '0')}m`;
        }
        
        return {
            tipo: tipo,
            quantidade: info.quantidade,
            tempoMedioStr: tempoMedioStr
        };
    });

    // Ordenação Alfabética por Tipo de Serviço
    dadosTabela.sort((a, b) => a.tipo.localeCompare(b.tipo));

    if (dadosTabela.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#94a3b8;">Nenhum serviço encontrado no período.</td></tr>';
        window.tipoServicoDataExport = [];
        return;
    }

    tbody.innerHTML = dadosTabela.map(item => {
        return `
            <tr style="background: rgba(255,255,255,0.02);">
                <td style="color: #3b82f6; font-weight: bold; font-size: 1.1rem; padding: 12px; border-bottom: 1px solid var(--border);">${item.tipo}</td>
                <td style="color: #fff; text-align: center; font-size: 1.1rem; font-weight: bold; padding: 12px; border-bottom: 1px solid var(--border);">${item.quantidade}</td>
                <td style="color: #a855f7; text-align: right; font-weight: bold; font-size: 1.1rem; padding: 12px; border-bottom: 1px solid var(--border);">${item.tempoMedioStr}</td>
            </tr>
        `;
    }).join('');
    
    // Salva os dados para a exportação
    window.tipoServicoDataExport = dadosTabela;
};

window.exportarRelatorioTipoServicoExcel = function() {
    if (!window.tipoServicoDataExport || window.tipoServicoDataExport.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Tipo de Serviço;Quantidade (O.S.);Tempo Médio de Conclusão\n";
    window.tipoServicoDataExport.forEach(item => {
        csvContent += `"${item.tipo}";${item.quantidade};"${item.tempoMedioStr}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Tipo_Servico_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.exportarGraficoPNG = async function(idElemento, nomeArquivo) {
    const chartDiv = document.getElementById(idElemento);
    if (!chartDiv) return;
    const container = chartDiv.closest('.content-panel');
    if (!container) return;
    
    const botoes = container.querySelectorAll('button');
    botoes.forEach(btn => btn.style.display = 'none');

    try {
        const canvas = await html2canvas(container, {
            scale: 2, backgroundColor: '#0f172a', useCORS: true
        });
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nomeArquivo}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Erro ao exportar:", e);
    } finally {
        botoes.forEach(btn => btn.style.display = '');
    }
};