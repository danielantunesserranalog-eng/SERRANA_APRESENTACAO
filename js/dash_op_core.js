// =========================================================
// MÓDULO 3: NÚCLEO, FILTROS E CÁLCULOS (OPERACIONAL)
// =========================================================

window.op_chartDataLabelsPlugin = {
    id: 'customDataLabels',
    afterDatasetsDraw: (chart) => {
        const { ctx } = chart;
        ctx.save();
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                const dataVal = dataset.data[index];
                if (dataVal > 0) {
                    ctx.fillText(dataVal.toLocaleString('pt-BR', {maximumFractionDigits: 0}), bar.x, bar.y - 4);
                }
            });
        });
        ctx.restore();
    }
};

window.SUPABASE_URL_OP = 'https://qnpwkvazkntbqjbwegcp.supabase.co';
window.SUPABASE_KEY_OP = 'sb_publishable_bjTFgpk-qAdpVuWzr4hbng_G8O9qlc8';
window.supabaseClientLocal = window.supabase.createClient(window.SUPABASE_URL_OP, window.SUPABASE_KEY_OP);

window.fullHistoricoDataOp = [];
window.activeQuickFilterOp = 'ALL';
window.diasConsideradosGlobais = 1;
window.chartCarregamento = null;
window.chartTransporte = null;

window.serranaLoaders = ['GSR0001', 'GSR0002', 'GSR0003', 'GSR0007', 'GSR0008', 'GRB0015', 'GRB0022'];
window.reflorestarLoaders = ['GRB0017', 'GRB0020', 'GRB0029'];
window.jslLoaders = ['GSL0012', 'GSL0016'];

// --- VARIÁVEIS PARA AS METAS DINÂMICAS DO BANCO ---
window.metaCaixaMedia = 0;
window.metaVolumeDiario = 0;
window.metaViagensCalculada = 0;

window.carregarMetasGlobais = async function() {
    try {
        // Puxa diretamente da tabela 'metas_globais'
        const { data, error } = await window.supabaseClientLocal
            .from('metas_globais')
            .select('*')
            .limit(1); // Pega a linha principal de configurações
        
        if (data && data.length > 0) {
            const metas = data[0];
            
            // Coluna cx_prog para a Caixa Média (m³)
            if (metas.cx_prog !== undefined && metas.cx_prog !== null) {
                window.metaCaixaMedia = parseFloat(metas.cx_prog);
            }
            
            // Coluna vol_prog para o Volume Diário Global (m³)
            if (metas.vol_prog !== undefined && metas.vol_prog !== null) {
                window.metaVolumeDiario = parseFloat(metas.vol_prog);
            }

            console.log("🎯 Metas do Banco Carregadas:", { CaixaMedia: window.metaCaixaMedia, VolumeDiario: window.metaVolumeDiario });
        } else {
            console.log("⚠️ Nenhuma meta encontrada na tabela 'metas_globais'.");
        }
    } catch (e) {
        console.error("Erro ao buscar metas globais:", e);
    }
};

window.normalizarCiclos = function(dataArr) {
    const pMap = new Map();
    dataArr.forEach(d => {
        if (d.cicloHorasOriginal === undefined) { d.cicloHorasOriginal = d.cicloHoras; }
        if (d.cicloHorasOriginal > 0 && d.cicloHorasOriginal <= 12) { 
            const pl = d.placa || 'N/A';
            if (!pMap.has(pl)) pMap.set(pl, { ciclos: 0, count: 0 });
            pMap.get(pl).ciclos += d.cicloHorasOriginal;
            pMap.get(pl).count++;
        }
    });
    
    const frotas = Array.from(pMap.values()).map(x => x.ciclos / x.count).sort((a, b) => a - b).slice(0, 20);
    if (frotas.length === 0) return;
    const mediaMenores = frotas.reduce((a, b) => a + b, 0) / frotas.length;
    
    dataArr.forEach(d => {
        if (d.cicloHorasOriginal > 12) { d.cicloHoras = mediaMenores; } 
        else { d.cicloHoras = d.cicloHorasOriginal; }
    });
};

window.checkLoader = function(d, loaderArray) {
    const val = String(d.carregadorFlorestal || d.grua || '').trim().toUpperCase();
    if (val && val !== '-') return loaderArray.includes(val);
    for (let key in d) {
        if (d[key] && typeof d[key] === 'string') {
            if (loaderArray.includes(d[key].trim().toUpperCase())) return true;
        }
    }
    return false;
};

window.isSerranaTransp = function(d) {
    return String(d.transportadora || '').toUpperCase().includes('SERRANALOG');
};

window.setupOperacionalFilters = function() {
    const btnQFs = document.querySelectorAll('.btn-op-qf');
    const datePicker = document.getElementById('opDatePicker');
    const filterMesOp = document.getElementById('filterMesOp');
    const filterTransp = document.getElementById('filterTransportadora');
    
    btnQFs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            window.activeQuickFilterOp = e.currentTarget.getAttribute('data-op-qf');
            btnQFs.forEach(b => {
                if(b.getAttribute('data-op-qf') === window.activeQuickFilterOp) {
                    b.classList.add('active', 'border-sky-500/50', 'text-sky-400', 'bg-sky-900/30');
                    b.classList.remove('border-transparent', 'text-slate-400', 'hover:bg-slate-700/50');
                } else {
                    b.classList.remove('active', 'border-sky-500/50', 'text-sky-400', 'bg-sky-900/30');
                    b.classList.add('border-transparent', 'text-slate-400', 'hover:bg-slate-700/50');
                }
            });
            if(datePicker) datePicker.value = '';
            if(filterMesOp) filterMesOp.value = 'ALL';
            window.atualizarPainelOperacional();
        });
    });

    if(datePicker) {
        datePicker.addEventListener('change', () => {
            if(datePicker.value) {
                window.activeQuickFilterOp = 'DATE';
                btnQFs.forEach(b => {
                    b.classList.remove('active', 'border-sky-500/50', 'text-sky-400', 'bg-sky-900/30');
                    b.classList.add('border-transparent', 'text-slate-400', 'hover:bg-slate-700/50');
                });
                if(filterMesOp) filterMesOp.value = 'ALL';
                window.atualizarPainelOperacional();
            }
        });
    }

    if(filterMesOp) {
        filterMesOp.addEventListener('change', () => {
            if(filterMesOp.value !== 'ALL') {
                window.activeQuickFilterOp = 'ALL';
                btnQFs.forEach(b => {
                    b.classList.remove('active', 'border-sky-500/50', 'text-sky-400', 'bg-sky-900/30');
                    b.classList.add('border-transparent', 'text-slate-400', 'hover:bg-slate-700/50');
                });
                if(datePicker) datePicker.value = '';
            }
            window.atualizarPainelOperacional();
        });
    }

    if(filterTransp) {
        filterTransp.addEventListener('change', () => {
            window.atualizarPainelOperacional();
        });
    }
};

window.loadManutencaoDataForMeta = async function() {
    try {
        const SUPABASE_MAN_URL = 'https://ihgiyxzxdldqmrkziijl.supabase.co';
        const SUPABASE_MAN_KEY = 'sb_publishable_JpMZhW5ZrFKBr7m9KXBkoQ_cpxy1k3x';
        const clientMan = window.supabase.createClient(SUPABASE_MAN_URL, SUPABASE_MAN_KEY);
        
        const [osResp, frotasResp] = await Promise.all([
            clientMan.from('ordens_servico').select('*'),
            clientMan.from('frotas_manutencao').select('*')
        ]);
        
        if (osResp.data) window.osParaMeta = osResp.data;
        if (frotasResp.data) window.frotasParaMeta = frotasResp.data;
    } catch (e) {
        console.error("Erro ao carregar dados de manutenção para meta:", e);
    }
};

window.loadOperacionalData = async function() {
    try {
        let historico = [];
        let from = 0;
        const step = 1000;
        let fetchMore = true;
        
        while (fetchMore) {
            const { data, error } = await window.supabaseClientLocal
                .from('historico_viagens')
                .select('*')
                .range(from, from + step - 1);
                
            if (error) break;
            if (data && data.length > 0) {
                historico = historico.concat(data);
                from += step;
            }
            if (!data || data.length < step) fetchMore = false;
        }
        
        if(historico && historico.length > 0) {
            historico = historico.filter(d => {
                const motorista = String(d.motorista || '').toUpperCase();
                return !motorista.includes('JULIO CESAR ALMEIDA NUNES') && motorista !== '-';
            });
            window.fullHistoricoDataOp = historico.reverse();
            window.normalizarCiclos(window.fullHistoricoDataOp);
        }

        const filterMesOp = document.getElementById('filterMesOp');
        const filterTransp = document.getElementById('filterTransportadora');

        if(window.fullHistoricoDataOp.length > 0) {
            if(filterMesOp) {
                const mesesSet = new Set();
                window.fullHistoricoDataOp.forEach(d => {
                    if(d.dataDaBaseExcel && d.dataDaBaseExcel !== 'Desconhecida') {
                        const p = d.dataDaBaseExcel.split('/');
                        if(p.length >= 3) {
                            let y = p[2]; if(y.length === 2) y = "20"+y;
                            mesesSet.add(`${p[1]}/${y}`);
                        }
                    }
                });
                const allMeses = Array.from(mesesSet).sort((a,b) => {
                      const pA = a.split('/'); const pB = b.split('/');
                      return new Date(pA[1], pA[0]-1, 1) - new Date(pB[1], pB[0]-1, 1);
                });
                const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                
                filterMesOp.innerHTML = '<option value="ALL">Todos os Meses</option>';
                allMeses.forEach(mStr => {
                    const p = mStr.split('/');
                    const mesIdx = parseInt(p[0]) - 1;
                    const nomeMes = monthNames[mesIdx] + '/' + p[1].substring(2);
                    filterMesOp.insertAdjacentHTML('beforeend', `<option value="${mStr}">${nomeMes}</option>`);
                });
                
                const hj = new Date();
                const mesAtualStr = String(hj.getMonth() + 1).padStart(2, '0') + '/' + hj.getFullYear();
                if(allMeses.includes(mesAtualStr)) {
                    filterMesOp.value = mesAtualStr;
                }
            }
            if(filterTransp) {
                const transps = [...new Set(window.fullHistoricoDataOp.map(d => d.transportadora))].filter(Boolean).sort();
                filterTransp.innerHTML = '<option value="ALL">TODAS AS TRANSPORTADORAS</option>';
                transps.forEach(t => filterTransp.insertAdjacentHTML('beforeend', `<option value="${t}">${t}</option>`));
            }

            window.atualizarPainelOperacional();
        }
    } catch(e) { console.error("Erro operacionais:", e); }
};

window.parseDateTime = function(dateVal) {
    if (!dateVal) return null;
    const str = String(dateVal).trim();
    if (str === 'Desconhecida') return null;

    let baseDate = null;
    if (str.includes('/')) {
        const parts = str.split(' ')[0].split('/');
        if (parts.length >= 3) {
            let year = parseInt(parts[2], 10);
            if (year < 100) year += 2000;
            baseDate = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
    } else if (str.includes('-')) { baseDate = new Date(str); }

    if (!baseDate || isNaN(baseDate.getTime())) return null;
    baseDate.setHours(0, 0, 0, 0);
    return baseDate;
};

window.formatarHorasMinutos = function(horasDecimais) {
    if (horasDecimais === null || horasDecimais === undefined || isNaN(horasDecimais) || horasDecimais <= 0) return '-';
    let horas = Math.floor(horasDecimais);
    let minutos = Math.round((horasDecimais - horas) * 60);
    if (minutos === 60) { horas += 1; minutos = 0; }
    if (horas === 0 && minutos === 0) return '0m';
    if (horas === 0) return `${minutos}m`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos.toString().padStart(2, '0')}m`;
};

window.atualizarElementoTempo = function(idElemento, mediaReal, metaData) {
    const el = document.getElementById(idElemento);
    if (!el) return;
    
    const strReal = window.formatarHorasMinutos(mediaReal);
    const strMeta = window.formatarHorasMinutos(metaData);
    
    let corClasse = "text-white";
    let icone = "";

    if (metaData > 0) {
        if (mediaReal > metaData) {
            corClasse = "text-rose-500";
            icone = `<i class="fas fa-exclamation-circle text-2xl text-rose-500 shadow-sm rounded-full bg-rose-500/10 p-1"></i>`;
        } else {
            corClasse = "text-emerald-400";
            icone = `<i class="fas fa-check-circle text-2xl text-emerald-400 shadow-sm rounded-full bg-emerald-500/10 p-1"></i>`;
        }
    }

    el.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
            <span class="text-[38px] font-black leading-none m-0 ${corClasse} drop-shadow-md">${strReal}</span>
            ${icone}
        </div>
        <div class="w-full mt-auto pt-3 border-t border-slate-700/50 flex justify-between items-center">
            <p class="text-[11px] text-slate-400 font-bold uppercase tracking-widest m-0">Padrão</p>
            <span class="text-[13px] font-black text-white">${strMeta}</span>
        </div>
    `;
};

window.calcStats = function(dataArr) {
    const viagens = dataArr.length;
    const vol = dataArr.reduce((s,d) => s + (parseFloat(String(d.volumeReal).replace(',','.'))||0), 0);
    const medVol = viagens > 0 ? vol / viagens : 0;

    const validCiclos = dataArr.filter(d => d.cicloHoras > 0);
    const somaCiclos = validCiclos.reduce((s,d) => s + d.cicloHoras, 0);
    const medCiclo = validCiclos.length > 0 ? somaCiclos / validCiclos.length : 0;

    const validFilaCpo = dataArr.filter(d => d.filaCampoHoras > 0);
    const medFilaCpo = validFilaCpo.length > 0 ? validFilaCpo.reduce((s,d) => s + d.filaCampoHoras, 0) / validFilaCpo.length : 0;

    const validCarreg = dataArr.filter(d => d.tempoCarregamentoHoras > 0);
    const medCarreg = validCarreg.length > 0 ? validCarreg.reduce((s,d) => s + d.tempoCarregamentoHoras, 0) / validCarreg.length : 0;

    const validFilaFab = dataArr.filter(d => d.filaFabricaHoras > 0);
    const medFilaFab = validFilaFab.length > 0 ? validFilaFab.reduce((s,d) => s + d.filaFabricaHoras, 0) / validFilaFab.length : 0;

    const medAsfalto = viagens > 0 ? dataArr.reduce((s, d) => s + (d.distanciaAsfalto || 0), 0) / viagens : 0;
    const medTerra = viagens > 0 ? dataArr.reduce((s, d) => s + (d.distanciaTerra || 0), 0) / viagens : 0;

    return { volTotal: vol, medVol, medCiclo, medFilaCpo, medCarreg, medFilaFab, medAsfalto, medTerra };
};

window.atualizarPainelOperacional = function() {
    const dataRef = document.getElementById('opDatePicker') ? document.getElementById('opDatePicker').value : null;
    const filterMesOp = document.getElementById('filterMesOp');
    const mesRef = filterMesOp ? filterMesOp.value : 'ALL';
    const filterTransp = document.getElementById('filterTransportadora');
    const activeT = filterTransp ? filterTransp.value : 'ALL';

    const filteredGlobal = window.fullHistoricoDataOp.filter(d => {
        const parsed = window.parseDateTime(d.dataDaBaseExcel);
        if(!parsed) return false;

        const mTransp = activeT === 'ALL' || d.transportadora === activeT;

        if (mesRef !== 'ALL') {
            const p = d.dataDaBaseExcel.split('/');
            if(p.length >= 3) {
                  let y = p[2]; if(y.length === 2) y = "20"+y;
                  if(`${p[1]}/${y}` !== mesRef) return false;
            } else return false;
        } else {
            if(window.activeQuickFilterOp === 'ALL' && !dataRef) return mTransp;
        }

        if (mesRef === 'ALL') {
            parsed.setHours(0,0,0,0); 
            const hj = new Date(); hj.setHours(0,0,0,0);
            
            if (window.activeQuickFilterOp === 'DATE' && dataRef) {
                const dr = new Date(dataRef + "T00:00:00"); dr.setHours(0,0,0,0);
                return parsed.getTime() === dr.getTime() && mTransp;
            }
            const diff = Math.round((hj - parsed)/86400000);
            
            if (window.activeQuickFilterOp === 'D-1') return diff === 1 && mTransp;
            if (window.activeQuickFilterOp === 'D-2') return diff === 2 && mTransp;
            if (window.activeQuickFilterOp === 'D-3') return diff >= 1 && diff <= 3 && mTransp;
            if (window.activeQuickFilterOp === 'D-7') return diff >= 1 && diff <= 7 && mTransp;
            if (window.activeQuickFilterOp === 'D-30') return diff >= 1 && diff <= 30 && mTransp;
            
            if (window.activeQuickFilterOp === 'SEM') {
                const inicioSemana = new Date(hj); inicioSemana.setDate(hj.getDate() - hj.getDay());
                return (parsed >= inicioSemana && parsed <= hj) && mTransp;
            }
        }
        return mesRef !== 'ALL' && mTransp;
    });

    let cardsData = filteredGlobal;
    const opStatusFetch = document.getElementById('opStatusFetch');

    if (activeT === 'ALL') {
        cardsData = filteredGlobal.filter(d => window.checkLoader(d, window.serranaLoaders) && window.isSerranaTransp(d));
        if (opStatusFetch) opStatusFetch.innerHTML = `<i class="fas fa-database text-sky-500 mr-1"></i> Geral: ${filteredGlobal.length} Viagens | 100% Serrana: ${cardsData.length} Viagens`;
    } else {
        if (opStatusFetch) opStatusFetch.innerHTML = `<i class="fas fa-truck text-sky-500 mr-1"></i> ${activeT}: ${filteredGlobal.length} Viagens`;
    }

    const totalViagens = cardsData.length;
    const elTotalViagens = document.getElementById('totalViagens');
    const elMetaTexto = document.getElementById('metaViagensText');
    const elIconeMeta = document.getElementById('iconeMetaViagens');

    elTotalViagens.innerText = totalViagens;
    elTotalViagens.className = "text-[32px] font-extrabold leading-none m-0 text-white transition-all"; 
    
    window.metaViagensCalculada = 0;
    let diasConsideradosCalc = 1;
    let mediaAtivosReal = 0; // Guardamos para usar no volume depois

    if (elMetaTexto && window.frotasParaMeta && window.osParaMeta) {
        let totalFrota = window.frotasParaMeta.length;
        
        let dataInicioCalc = new Date(); dataInicioCalc.setHours(0,0,0,0);
        let dataFimCalc = new Date(); dataFimCalc.setHours(23,59,59,999);

        const hjCalc = new Date(); hjCalc.setHours(0,0,0,0);

        if (mesRef !== 'ALL') {
            const p = mesRef.split('/');
            let ano = parseInt(p[1]); if(ano < 100) ano += 2000;
            let mes = parseInt(p[0]) - 1;
            dataInicioCalc = new Date(ano, mes, 1, 0,0,0);
            dataFimCalc = new Date(ano, mes + 1, 0, 23,59,59,999);
            if (dataInicioCalc.getFullYear() === hjCalc.getFullYear() && dataInicioCalc.getMonth() === hjCalc.getMonth()) {
                dataFimCalc = new Date(); dataFimCalc.setDate(hjCalc.getDate() - 1); dataFimCalc.setHours(23,59,59,999);
            }
            diasConsideradosCalc = Math.max(1, Math.ceil((dataFimCalc - dataInicioCalc) / (1000 * 60 * 60 * 24)));
        } else {
            if (window.activeQuickFilterOp === 'DATE' && dataRef) {
                dataInicioCalc = new Date(dataRef + "T00:00:00"); dataFimCalc = new Date(dataRef + "T23:59:59"); diasConsideradosCalc = 1;
            } else if (window.activeQuickFilterOp === 'D-1') {
                dataInicioCalc.setDate(hjCalc.getDate() - 1); dataFimCalc = new Date(dataInicioCalc); dataFimCalc.setHours(23,59,59,999); diasConsideradosCalc = 1;
            } else if (window.activeQuickFilterOp === 'D-2') {
                dataInicioCalc.setDate(hjCalc.getDate() - 2); dataFimCalc = new Date(dataInicioCalc); dataFimCalc.setHours(23,59,59,999); diasConsideradosCalc = 1;
            } else if (window.activeQuickFilterOp === 'D-3') {
                dataInicioCalc.setDate(hjCalc.getDate() - 3); dataFimCalc = new Date(hjCalc); dataFimCalc.setDate(hjCalc.getDate() - 1); dataFimCalc.setHours(23,59,59,999); diasConsideradosCalc = 3;
            } else if (window.activeQuickFilterOp === 'D-7') {
                dataInicioCalc.setDate(hjCalc.getDate() - 7); dataFimCalc = new Date(hjCalc); dataFimCalc.setDate(hjCalc.getDate() - 1); dataFimCalc.setHours(23,59,59,999); diasConsideradosCalc = 7;
            } else if (window.activeQuickFilterOp === 'D-30') {
                dataInicioCalc.setDate(hjCalc.getDate() - 30); dataFimCalc = new Date(hjCalc); dataFimCalc.setDate(hjCalc.getDate() - 1); dataFimCalc.setHours(23,59,59,999); diasConsideradosCalc = 30;
            } else if (window.activeQuickFilterOp === 'SEM') {
                dataInicioCalc.setDate(hjCalc.getDate() - hjCalc.getDay()); dataFimCalc = new Date(hjCalc); dataFimCalc.setDate(hjCalc.getDate() - 1); dataFimCalc.setHours(23,59,59,999); diasConsideradosCalc = Math.max(1, hjCalc.getDay());
            } else {
                if (filteredGlobal.length > 0) {
                    const datasSort = filteredGlobal.map(d => window.parseDateTime(d.dataDaBaseExcel)).filter(Boolean).sort((a,b) => a-b);
                    if (datasSort.length > 0) {
                        dataInicioCalc = datasSort[0]; dataFimCalc = datasSort[datasSort.length - 1]; dataFimCalc.setHours(23,59,59,999);
                        diasConsideradosCalc = Math.max(1, Math.ceil((dataFimCalc - dataInicioCalc) / (1000 * 60 * 60 * 24)));
                    }
                }
            }
        }

        let msTotalPeriodo = dataFimCalc - dataInicioCalc;
        if (msTotalPeriodo <= 0) msTotalPeriodo = 1;

        let msManutTotal = 0;
        window.frotasParaMeta.forEach(frota => {
            const todasOSCavalo = window.osParaMeta.filter(o => o.placa === frota.cavalo && o.status !== 'Agendada');
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
                const overlapInicio = osInicio > dataInicioCalc ? osInicio : dataInicioCalc;
                const overlapFim = osFim < dataFimCalc ? osFim : dataFimCalc;
                if (overlapInicio < overlapFim) { msManutTotal += (overlapFim - overlapInicio); }
            });
        });

        const totalMsDisponivelPeriodo = totalFrota * msTotalPeriodo;
        let dispNoPeriodoMs = totalMsDisponivelPeriodo - msManutTotal;
        if (dispNoPeriodoMs < 0) dispNoPeriodoMs = 0;
        
        mediaAtivosReal = Math.round(dispNoPeriodoMs / msTotalPeriodo);

        if (activeT === 'ALL' || activeT.toUpperCase().includes('SERRANALOG')) {
            window.metaViagensCalculada = mediaAtivosReal * 2 * diasConsideradosCalc;
            
            elMetaTexto.innerHTML = `Disp: <b class="text-emerald-400">${mediaAtivosReal}</b> carros | Meta: <b class="text-sky-400">${window.metaViagensCalculada}</b>`;
            elMetaTexto.classList.remove('hidden');
            
            if (window.metaViagensCalculada > 0) {
                if (totalViagens >= window.metaViagensCalculada) {
                    elTotalViagens.className = "text-[32px] font-extrabold leading-none m-0 text-emerald-400 drop-shadow-md transition-all";
                    elIconeMeta.innerHTML = '<i class="fas fa-check-circle text-emerald-400 text-[22px] drop-shadow-md" title="Meta Atingida"></i>';
                } else {
                    elTotalViagens.className = "text-[32px] font-extrabold leading-none m-0 text-rose-500 drop-shadow-md transition-all";
                    elIconeMeta.innerHTML = '<i class="fas fa-exclamation-circle text-rose-500 text-[22px] drop-shadow-md" title="Abaixo da Meta"></i>';
                }
            } else { elIconeMeta.innerHTML = ''; }
        } else { elMetaTexto.classList.add('hidden'); elIconeMeta.innerHTML = ''; }
    } else { if(elMetaTexto) elMetaTexto.classList.add('hidden'); if(elIconeMeta) elIconeMeta.innerHTML = ''; }

    // --- NOVA LÓGICA DE METAS DE VOLUME (COM FALLBACK SE O BANCO ESTIVER ZERADO) ---
    const totalPesoKg = cardsData.reduce((s,x)=>s+(parseFloat(String(x.pesoLiquido).replace(',','.'))||0), 0);
    const mediaPbtc = totalViagens > 0 ? (totalPesoKg / 1000) / totalViagens : 0;
    
    let pbtcCor = "text-white", pbtcIcone = "";
    if (mediaPbtc > 0) {
        if (mediaPbtc < 74) { pbtcCor = "text-yellow-400"; pbtcIcone = '<i class="fas fa-exclamation-triangle text-yellow-400 text-xl ml-2" title="Abaixo do ideal"></i>'; }
        else if (mediaPbtc >= 74 && mediaPbtc <= 77.7) { pbtcCor = "text-emerald-400"; pbtcIcone = '<i class="fas fa-check-circle text-emerald-400 text-xl ml-2" title="Ideal"></i>'; }
        else if (mediaPbtc > 77.7) { pbtcCor = "text-rose-500"; pbtcIcone = '<i class="fas fa-times-circle text-rose-500 text-xl ml-2" title="Acima do ideal"></i>'; }
    }
    document.getElementById('totalPesoLiq').innerHTML = `<span class="${pbtcCor}">${mediaPbtc.toLocaleString('pt-PT', {maximumFractionDigits:1})} t</span>${pbtcIcone}`;

    const totalVol = cardsData.reduce((s,x)=>s+(parseFloat(String(x.volumeReal).replace(',','.'))||0), 0);
    const mediaVol = totalViagens > 0 ? (totalVol / totalViagens) : 0;
    
    let elMediaVol = document.getElementById('mediaVolumeViagem');
    let metaCaixaText = document.getElementById('metaVolMediaText');
    let iconeCaixa = document.getElementById('iconeMetaVolMedia');
    
    elMediaVol.innerText = mediaVol.toLocaleString('pt-PT', {maximumFractionDigits:1}) + ' m³';
    
    // ** FALLBACK DE SEGURANÇA: Se o banco retornar vazio, ele força 48 m³ para aparecer na tela **
    let metaCaixaFinal = window.metaCaixaMedia > 0 ? window.metaCaixaMedia : 48;
    
    if (metaCaixaFinal > 0) {
        if(metaCaixaText) {
            metaCaixaText.innerText = `Meta: ${metaCaixaFinal} m³`;
            metaCaixaText.classList.remove('hidden');
        }
        if (mediaVol >= metaCaixaFinal) {
            elMediaVol.className = "text-[32px] font-extrabold leading-none m-0 text-emerald-400 drop-shadow-md transition-all";
            if(iconeCaixa) iconeCaixa.innerHTML = '<i class="fas fa-check-circle text-emerald-400 text-[22px] drop-shadow-md"></i>';
        } else {
            elMediaVol.className = "text-[32px] font-extrabold leading-none m-0 text-rose-500 drop-shadow-md transition-all";
            if(iconeCaixa) iconeCaixa.innerHTML = '<i class="fas fa-exclamation-circle text-rose-500 text-[22px] drop-shadow-md"></i>';
        }
    }

    let elTotalVol = document.getElementById('totalVolumeReal');
    let metaVolTotalText = document.getElementById('metaVolTotalText');
    let iconeVolTotal = document.getElementById('iconeMetaVolTotal');
    
    elTotalVol.innerText = totalVol.toLocaleString('pt-PT', {maximumFractionDigits:1}) + ' m³';
    
    // Calcula a Meta de Volume Total (com Fallback)
    let metaVolumeCalculada = 0;
    
    if (window.metaVolumeDiario > 0) {
        // Se cadastrou o Diário Global explícito, multiplica pelos dias filtrados
        metaVolumeCalculada = window.metaVolumeDiario * diasConsideradosCalc;
    } else if (window.metaViagensCalculada > 0) {
        // Multiplica as Viagens Esperadas pela Caixa Média esperada
        metaVolumeCalculada = window.metaViagensCalculada * metaCaixaFinal;
    } else {
        // Fallback Extremo: Se a manutenção também não estiver preenchida no dia, supõe 50 caminhões
        metaVolumeCalculada = (50 * 2 * diasConsideradosCalc) * metaCaixaFinal;
    }

    if (metaVolumeCalculada > 0) {
        if(metaVolTotalText) {
            metaVolTotalText.innerHTML = `Meta: <b class="text-sky-400">${metaVolumeCalculada.toLocaleString('pt-PT')} m³</b>`;
            metaVolTotalText.classList.remove('hidden');
        }
        
        if (totalVol >= metaVolumeCalculada) {
            elTotalVol.className = "text-[32px] font-extrabold leading-none m-0 text-emerald-400 drop-shadow-md transition-all";
            if(iconeVolTotal) iconeVolTotal.innerHTML = '<i class="fas fa-check-circle text-emerald-400 text-[22px] drop-shadow-md"></i>';
        } else {
            elTotalVol.className = "text-[32px] font-extrabold leading-none m-0 text-rose-500 drop-shadow-md transition-all";
            if(iconeVolTotal) iconeVolTotal.innerHTML = '<i class="fas fa-exclamation-circle text-rose-500 text-[22px] drop-shadow-md"></i>';
        }
    }
    // --------------------------------------------------------

    const mediaAsfalto = totalViagens > 0 ? cardsData.reduce((s, r) => s + (r.distanciaAsfalto||0), 0) / totalViagens : 0;
    const mediaTerra = totalViagens > 0 ? cardsData.reduce((s, r) => s + (r.distanciaTerra||0), 0) / totalViagens : 0;
    const mediaDistTotal = mediaAsfalto + mediaTerra;

    document.getElementById('mediaDistancia').innerText = mediaDistTotal.toLocaleString('pt-PT', {maximumFractionDigits:2}) + ' km';
    document.getElementById('mediaAsfalto').innerText = mediaAsfalto.toLocaleString('pt-PT', {maximumFractionDigits:2});
    document.getElementById('mediaTerra').innerText = mediaTerra.toLocaleString('pt-PT', {maximumFractionDigits:2});

    const validCycles = cardsData.filter(d => d.cicloHoras > 0);
    const mediaCiclo = validCycles.length > 0 ? validCycles.reduce((s, d) => s + d.cicloHoras, 0) / validCycles.length : 0;

    const validFilaCampo = cardsData.filter(d => d.filaCampoHoras > 0);
    const mediaFilaCampo = validFilaCampo.length > 0 ? validFilaCampo.reduce((s, d) => s + d.filaCampoHoras, 0) / validFilaCampo.length : 0;

    const validTempoCarregamento = cardsData.filter(d => d.tempoCarregamentoHoras > 0);
    const mediaTempoCarregamento = validTempoCarregamento.length > 0 ? validTempoCarregamento.reduce((s, d) => s + d.tempoCarregamentoHoras, 0) / validTempoCarregamento.length : 0;

    const validFilaFabrica = cardsData.filter(d => d.filaFabricaHoras > 0);
    const mediaFilaFabrica = validFilaFabrica.length > 0 ? validFilaFabrica.reduce((s, d) => s + d.filaFabricaHoras, 0) / validFilaFabrica.length : 0;

    window.atualizarElementoTempo('cicloMedio', mediaCiclo, 10.083); 
    window.atualizarElementoTempo('filaCampo', mediaFilaCampo, 1.333); 
    window.atualizarElementoTempo('tempoCarregamento', mediaTempoCarregamento, 0.5); 
    window.atualizarElementoTempo('filaFabrica', mediaFilaFabrica, 0.5); 

    const tbodyComp = document.getElementById('comparativoBody');
    if (tbodyComp) {
        const dataC1 = filteredGlobal.filter(d => window.checkLoader(d, window.serranaLoaders) && window.isSerranaTransp(d));
        const dataC2 = filteredGlobal.filter(d => window.checkLoader(d, window.serranaLoaders) && !window.isSerranaTransp(d));
        const dataC3 = filteredGlobal.filter(d => window.checkLoader(d, window.reflorestarLoaders) && window.isSerranaTransp(d));
        const dataC4 = filteredGlobal.filter(d => window.checkLoader(d, window.jslLoaders) && window.isSerranaTransp(d));
        
        const stC1 = window.calcStats(dataC1), stC2 = window.calcStats(dataC2), stC3 = window.calcStats(dataC3), stC4 = window.calcStats(dataC4), stGlobal = window.calcStats(filteredGlobal);

        tbodyComp.innerHTML = `
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="px-6 py-4 font-bold text-white text-[13px]"><i class="fas fa-route text-slate-400 w-5"></i> Viagens Realizadas</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${dataC1.length}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${dataC2.length}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${dataC3.length}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${dataC4.length}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${filteredGlobal.length}</td>
            </tr>
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="px-6 py-4 font-bold text-white text-[13px]"><i class="fas fa-box-open text-indigo-400 w-5"></i> Caixa de Carga Média</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stC1.medVol.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stC2.medVol.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stC3.medVol.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stC4.medVol.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stGlobal.medVol.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
            </tr>
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="px-6 py-4 font-bold text-white text-[13px]"><i class="fas fa-cubes text-cyan-400 w-5"></i> Volume Total</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stC1.volTotal.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stC2.volTotal.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stC3.volTotal.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stC4.volTotal.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${stGlobal.volTotal.toLocaleString('pt-PT',{maximumFractionDigits:1})} m³</td>
            </tr>
            <tr class="hover:bg-slate-800/30 transition-colors border-t border-slate-700/50">
                <td class="px-6 py-4 font-bold text-slate-300 text-[12px] uppercase tracking-wider"><i class="fas fa-stopwatch text-blue-400 w-5"></i> Ciclo Médio Total</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stC1.medCiclo)}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stC2.medCiclo)}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stC3.medCiclo)}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stC4.medCiclo)}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stGlobal.medCiclo)}</td>
            </tr>
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="px-6 py-4 font-bold text-slate-300 text-[12px] uppercase tracking-wider"><i class="fas fa-hourglass-half text-amber-500 w-5"></i> Espera Média Campo</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stC1.medFilaCpo)}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stC2.medFilaCpo)}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stC3.medFilaCpo)}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stC4.medFilaCpo)}</td>
                <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${window.formatarHorasMinutos(stGlobal.medFilaCpo)}</td>
            </tr>
            <tr class="hover:bg-slate-800/30 transition-colors border-t border-slate-700">
                <td class="px-6 py-4 font-bold text-slate-300 text-[12px] uppercase tracking-wider"><i class="fas fa-road text-slate-400 w-5"></i> Dist. Média (Asfalto/Terra)</td>
                <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right"><span class="text-sky-300">Asf: ${stC1.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br><span class="text-amber-400">Ter: ${stC1.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span></td>
                <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right"><span class="text-sky-300">Asf: ${stC2.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br><span class="text-amber-400">Ter: ${stC2.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span></td>
                <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right"><span class="text-sky-300">Asf: ${stC3.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br><span class="text-amber-400">Ter: ${stC3.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span></td>
                <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right"><span class="text-sky-300">Asf: ${stC4.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br><span class="text-amber-400">Ter: ${stC4.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span></td>
                <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right"><span class="text-sky-300">Asf: ${stGlobal.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br><span class="text-amber-400">Ter: ${stGlobal.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span></td>
            </tr>
        `;
    }

    const baseEvolucao = filteredGlobal.length > 0 ? filteredGlobal : window.fullHistoricoDataOp;
    if (typeof window.renderCarregamentoChart === 'function') window.renderCarregamentoChart(baseEvolucao);
    
    const baseTransporte = baseEvolucao.filter(d => {
        const transp = String(d.transportadora || "").toUpperCase();
        return transp.includes('SERRANALOG') && !transp.includes('ASN');
    });
    if (typeof window.renderTransporteChart === 'function') window.renderTransporteChart(baseTransporte);

    const filteredSerrana = cardsData;
    let diasConsiderados = 1;
    if(window.activeQuickFilterOp === 'D-1') diasConsiderados = 1;
    if(window.activeQuickFilterOp === 'D-2') diasConsiderados = 1;
    if(window.activeQuickFilterOp === 'D-3') diasConsiderados = 3;
    if(window.activeQuickFilterOp === 'D-7') diasConsiderados = 7;
    if(window.activeQuickFilterOp === 'D-30') diasConsiderados = 30;
    if(window.activeQuickFilterOp === 'ALL') diasConsiderados = 30;
    
    if (typeof window.renderLeaderboards === 'function') window.renderLeaderboards(filteredSerrana, diasConsiderados);
};

// =========================================================
// FUNÇÃO DE INICIALIZAÇÃO GERAL DO OPERACIONAL
// =========================================================
window.initNovoDashboardOperacional = async function() {
    if(typeof Chart === 'undefined') {
        setTimeout(window.initNovoDashboardOperacional, 50);
        return; 
    }

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    window.setupOperacionalFilters();
    
    // CARREGA AS METAS DO BANCO DE DADOS PRIMEIRO
    await window.carregarMetasGlobais();

    window.loadManutencaoDataForMeta().finally(() => {
        window.loadOperacionalData();
    });
    
    if(document.getElementById('data-mural-setor')) {
        document.getElementById('data-mural-setor').value = new Date().toISOString().split('T')[0];
    }
    window.carregarMuralSetor();
    window.carregarFrotaSupabase();
};