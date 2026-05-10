window.initNovoDashboardOperacional = function() {
    if(typeof Chart === 'undefined') {
        setTimeout(window.initNovoDashboardOperacional, 50);
        return; 
    }

    window.abrirImagemGlobalOperacional = function(src) {
        let modal = document.getElementById('modal-imagem-global');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-imagem-global';
            modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 999999; justify-content: center; align-items: center; backdrop-filter: blur(5px);';
            modal.onclick = function(e) { if(e.target.id === 'modal-imagem-global') modal.style.display = 'none'; };
            
            modal.innerHTML = `
                <div style="position: relative; max-width: 90vw; max-height: 90vh; display: flex; justify-content: center; align-items: center;">
                    <button onclick="document.getElementById('modal-imagem-global').style.display='none'" style="position: absolute; top: -15px; right: -15px; background: rgba(239, 68, 68, 0.9); border: 2px solid white; color: white; width: 40px; height: 40px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; z-index: 100000; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition: 0.2s;" onmouseover="this.style.background='#ef4444'" onmouseout="this.style.background='rgba(239, 68, 68, 0.9)'"><i class="fas fa-times"></i></button>
                    <img id="img-modal-src-global" src="" style="max-width: 90vw; max-height: 85vh; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); object-fit: contain;">
                </div>
            `;
            document.body.appendChild(modal);
        }
        document.getElementById('img-modal-src-global').src = src;
        modal.style.display = 'flex';
    };

    const chartDataLabelsPlugin = {
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

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const SUPABASE_URL = 'https://qnpwkvazkntbqjbwegcp.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_bjTFgpk-qAdpVuWzr4hbng_G8O9qlc8';
    const supabaseClientLocal = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let fullHistoricoDataOp = [];
    let activeQuickFilterOp = 'ALL';
    window.diasConsideradosGlobais = 1;
    let chartCarregamento = null;
    let chartTransporte = null;
    
    const serranaLoaders = ['GSR0001', 'GSR0002', 'GSR0003', 'GSR0007', 'GSR0008', 'GRB0015', 'GRB0022'];
    const reflorestarLoaders = ['GRB0017', 'GRB0020', 'GRB0029'];
    const jslLoaders = ['GSL0012', 'GSL0016'];

    function normalizarCiclos(dataArr) {
        const pMap = new Map();
        dataArr.forEach(d => {
            if (d.cicloHorasOriginal === undefined) {
                d.cicloHorasOriginal = d.cicloHoras;
            }
            if (d.cicloHorasOriginal > 0 && d.cicloHorasOriginal <= 12) { 
                const pl = d.placa || 'N/A';
                if (!pMap.has(pl)) pMap.set(pl, { ciclos: 0, count: 0 });
                pMap.get(pl).ciclos += d.cicloHorasOriginal;
                pMap.get(pl).count++;
            }
        });
        
        const frotas = Array.from(pMap.values())
            .map(x => x.ciclos / x.count)
            .sort((a, b) => a - b)
            .slice(0, 20);
            
        if (frotas.length === 0) return;
        const mediaMenores = frotas.reduce((a, b) => a + b, 0) / frotas.length;
        
        dataArr.forEach(d => {
            if (d.cicloHorasOriginal > 12) {
                d.cicloHoras = mediaMenores;
            } else {
                d.cicloHoras = d.cicloHorasOriginal; 
            }
        });
    }

    function checkLoader(d, loaderArray) {
        const val = String(d.carregadorFlorestal || d.grua || '').trim().toUpperCase();
        if (val && val !== '-') return loaderArray.includes(val);
        for (let key in d) {
            if (d[key] && typeof d[key] === 'string') {
                if (loaderArray.includes(d[key].trim().toUpperCase())) return true;
            }
        }
        return false;
    }

    function isSerranaTransp(d) {
        return String(d.transportadora || '').toUpperCase().includes('SERRANALOG');
    }

    function setupOperacionalFilters() {
        const btnQFs = document.querySelectorAll('.btn-op-qf');
        const datePicker = document.getElementById('opDatePicker');
        const filterMesOp = document.getElementById('filterMesOp');
        const filterTransp = document.getElementById('filterTransportadora');
        
        btnQFs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeQuickFilterOp = e.currentTarget.getAttribute('data-op-qf');
                btnQFs.forEach(b => {
                    if(b.getAttribute('data-op-qf') === activeQuickFilterOp) {
                        b.classList.add('active', 'border-sky-500/50', 'text-sky-400', 'bg-sky-900/30');
                        b.classList.remove('border-transparent', 'text-slate-400', 'hover:bg-slate-700/50');
                    } else {
                        b.classList.remove('active', 'border-sky-500/50', 'text-sky-400', 'bg-sky-900/30');
                        b.classList.add('border-transparent', 'text-slate-400', 'hover:bg-slate-700/50');
                    }
                });
                if(datePicker) datePicker.value = '';
                if(filterMesOp) filterMesOp.value = 'ALL';
                atualizarPainelOperacional();
            });
        });

        if(datePicker) {
            datePicker.addEventListener('change', () => {
                if(datePicker.value) {
                    activeQuickFilterOp = 'DATE';
                    btnQFs.forEach(b => {
                        b.classList.remove('active', 'border-sky-500/50', 'text-sky-400', 'bg-sky-900/30');
                        b.classList.add('border-transparent', 'text-slate-400', 'hover:bg-slate-700/50');
                    });
                    if(filterMesOp) filterMesOp.value = 'ALL';
                    atualizarPainelOperacional();
                }
            });
        }

        if(filterMesOp) {
            filterMesOp.addEventListener('change', () => {
                if(filterMesOp.value !== 'ALL') {
                    activeQuickFilterOp = 'ALL';
                    btnQFs.forEach(b => {
                        b.classList.remove('active', 'border-sky-500/50', 'text-sky-400', 'bg-sky-900/30');
                        b.classList.add('border-transparent', 'text-slate-400', 'hover:bg-slate-700/50');
                    });
                    if(datePicker) datePicker.value = '';
                }
                atualizarPainelOperacional();
            });
        }

        if(filterTransp) {
            filterTransp.addEventListener('change', () => {
                atualizarPainelOperacional();
            });
        }
    }

    async function loadManutencaoDataForMeta() {
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
    }

    async function loadOperacionalData() {
        try {
            let historico = [];
            let from = 0;
            const step = 1000;
            let fetchMore = true;
            
            while (fetchMore) {
                const { data, error } = await supabaseClientLocal
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
                fullHistoricoDataOp = historico.reverse();
                normalizarCiclos(fullHistoricoDataOp);
            }

            const filterMesOp = document.getElementById('filterMesOp');
            const filterTransp = document.getElementById('filterTransportadora');

            if(fullHistoricoDataOp.length > 0) {
                if(filterMesOp) {
                    let currMesOp = filterMesOp.value;
                    const mesesSet = new Set();
                    fullHistoricoDataOp.forEach(d => {
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
                    const transps = [...new Set(fullHistoricoDataOp.map(d => d.transportadora))].filter(Boolean).sort();
                    filterTransp.innerHTML = '<option value="ALL">TODAS AS TRANSPORTADORAS</option>';
                    transps.forEach(t => filterTransp.insertAdjacentHTML('beforeend', `<option value="${t}">${t}</option>`));
                }

                atualizarPainelOperacional();
            }
        } catch(e) { console.error("Erro operacionais:", e); }
    }

    function parseDateTime(dateVal) {
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
        } else if (str.includes('-')) {
            baseDate = new Date(str);
        }

        if (!baseDate || isNaN(baseDate.getTime())) return null;
        baseDate.setHours(0, 0, 0, 0);
        return baseDate;
    }

    function formatarHorasMinutos(horasDecimais) {
        if (horasDecimais === null || horasDecimais === undefined || isNaN(horasDecimais) || horasDecimais <= 0) return '-';
        let horas = Math.floor(horasDecimais);
        let minutos = Math.round((horasDecimais - horas) * 60);
        if (minutos === 60) {
            horas += 1;
            minutos = 0;
        }
        if (horas === 0 && minutos === 0) return '0m';
        if (horas === 0) return `${minutos}m`;
        if (minutos === 0) return `${horas}h`;
        return `${horas}h ${minutos.toString().padStart(2, '0')}m`;
    }

    function atualizarElementoTempo(idElemento, mediaReal, metaData) {
        const el = document.getElementById(idElemento);
        if (!el) return;
        
        const strReal = formatarHorasMinutos(mediaReal);
        const strMeta = formatarHorasMinutos(metaData);
        
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
    }

    function calcStats(dataArr) {
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
    }

    function atualizarPainelOperacional() {
        const dataRef = document.getElementById('opDatePicker') ? document.getElementById('opDatePicker').value : null;
        const filterMesOp = document.getElementById('filterMesOp');
        const mesRef = filterMesOp ? filterMesOp.value : 'ALL';
        const filterTransp = document.getElementById('filterTransportadora');
        const activeT = filterTransp ? filterTransp.value : 'ALL';

        const filteredGlobal = fullHistoricoDataOp.filter(d => {
            const parsed = parseDateTime(d.dataDaBaseExcel);
            if(!parsed) return false;

            const mTransp = activeT === 'ALL' || d.transportadora === activeT;

            if (mesRef !== 'ALL') {
                const p = d.dataDaBaseExcel.split('/');
                if(p.length >= 3) {
                      let y = p[2]; if(y.length === 2) y = "20"+y;
                      if(`${p[1]}/${y}` !== mesRef) return false;
                } else return false;
            } else {
                if(activeQuickFilterOp === 'ALL' && !dataRef) return mTransp;
            }

            if (mesRef === 'ALL') {
                parsed.setHours(0,0,0,0); 
                const hj = new Date(); hj.setHours(0,0,0,0);
                
                if (activeQuickFilterOp === 'DATE' && dataRef) {
                    const dr = new Date(dataRef + "T00:00:00");
                    dr.setHours(0,0,0,0);
                    return parsed.getTime() === dr.getTime() && mTransp;
                }
                const diff = Math.round((hj - parsed)/86400000);
                if (activeQuickFilterOp === 'D-1') return diff === 1 && mTransp;
                if (activeQuickFilterOp === 'D-2') return diff === 2 && mTransp;
                if (activeQuickFilterOp === 'D-3') return diff >= 0 && diff <= 2 && mTransp;
                if (activeQuickFilterOp === 'D-7') return diff >= 0 && diff <= 7 && mTransp;
                if (activeQuickFilterOp === 'D-30') return diff >= 0 && diff <= 30 && mTransp;
                if (activeQuickFilterOp === 'SEM') {
                    const inicioSemana = new Date(hj);
                    inicioSemana.setDate(hj.getDate() - hj.getDay());
                    return (parsed >= inicioSemana && parsed <= hj) && mTransp;
                }
            }

            return mesRef !== 'ALL' && mTransp;
        });

        let cardsData = filteredGlobal;
        const opStatusFetch = document.getElementById('opStatusFetch');

        if (activeT === 'ALL') {
            cardsData = filteredGlobal.filter(d => checkLoader(d, serranaLoaders) && isSerranaTransp(d));
            if (opStatusFetch) {
                opStatusFetch.innerHTML = `<i class="fas fa-database text-sky-500 mr-1"></i> Geral: ${filteredGlobal.length} Viagens | 100% Serrana: ${cardsData.length} Viagens`;
            }
        } else {
            if (opStatusFetch) {
                opStatusFetch.innerHTML = `<i class="fas fa-truck text-sky-500 mr-1"></i> ${activeT}: ${filteredGlobal.length} Viagens`;
            }
        }

        // --- LÓGICA DA META DE VIAGENS VS DISPONIBILIDADE DA MANUTENÇÃO ---
        const totalViagens = cardsData.length;
        const elTotalViagens = document.getElementById('totalViagens');
        const elMetaTexto = document.getElementById('metaViagensText');
        const elIconeMeta = document.getElementById('iconeMetaViagens');

        elTotalViagens.innerText = totalViagens;
        elTotalViagens.className = "text-[32px] font-extrabold leading-none m-0 text-white transition-all"; 
        
        if (elMetaTexto && window.frotasParaMeta && window.osParaMeta) {
            let totalFrota = window.frotasParaMeta.length;
            
            let dataInicioCalc = new Date(); dataInicioCalc.setHours(0,0,0,0);
            let dataFimCalc = new Date(); dataFimCalc.setHours(23,59,59,999);
            let diasConsideradosCalc = 1;

            const hjCalc = new Date(); hjCalc.setHours(0,0,0,0);

            if (mesRef !== 'ALL') {
                const p = mesRef.split('/');
                let ano = parseInt(p[1]); if(ano < 100) ano += 2000;
                let mes = parseInt(p[0]) - 1;
                dataInicioCalc = new Date(ano, mes, 1, 0,0,0);
                dataFimCalc = new Date(ano, mes + 1, 0, 23,59,59,999);
                if (dataInicioCalc.getFullYear() === hjCalc.getFullYear() && dataInicioCalc.getMonth() === hjCalc.getMonth()) {
                    dataFimCalc = new Date(); dataFimCalc.setHours(23,59,59,999);
                }
                diasConsideradosCalc = Math.max(1, Math.ceil((dataFimCalc - dataInicioCalc) / (1000 * 60 * 60 * 24)));
            } else {
                if (activeQuickFilterOp === 'DATE' && dataRef) {
                    dataInicioCalc = new Date(dataRef + "T00:00:00");
                    dataFimCalc = new Date(dataRef + "T23:59:59");
                    diasConsideradosCalc = 1;
                } else if (activeQuickFilterOp === 'D-1') {
                    dataInicioCalc.setDate(hjCalc.getDate() - 1);
                    dataFimCalc = new Date(dataInicioCalc); dataFimCalc.setHours(23,59,59,999);
                    diasConsideradosCalc = 1;
                } else if (activeQuickFilterOp === 'D-2') {
                    dataInicioCalc.setDate(hjCalc.getDate() - 2);
                    dataFimCalc = new Date(dataInicioCalc); dataFimCalc.setHours(23,59,59,999);
                    diasConsideradosCalc = 1;
                } else if (activeQuickFilterOp === 'D-3') {
                    dataInicioCalc.setDate(hjCalc.getDate() - 2);
                    dataFimCalc = new Date(hjCalc); dataFimCalc.setHours(23,59,59,999);
                    diasConsideradosCalc = 3;
                } else if (activeQuickFilterOp === 'D-7') {
                    dataInicioCalc.setDate(hjCalc.getDate() - 7);
                    diasConsideradosCalc = 8;
                } else if (activeQuickFilterOp === 'D-30') {
                    dataInicioCalc.setDate(hjCalc.getDate() - 30);
                    diasConsideradosCalc = 31;
                } else if (activeQuickFilterOp === 'SEM') {
                    dataInicioCalc.setDate(hjCalc.getDate() - hjCalc.getDay());
                    diasConsideradosCalc = hjCalc.getDay() + 1;
                } else {
                    if (filteredGlobal.length > 0) {
                        const datasSort = filteredGlobal.map(d => parseDateTime(d.dataDaBaseExcel)).filter(Boolean).sort((a,b) => a-b);
                        if (datasSort.length > 0) {
                            dataInicioCalc = datasSort[0];
                            dataFimCalc = datasSort[datasSort.length - 1];
                            dataFimCalc.setHours(23,59,59,999);
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
                    if (overlapInicio < overlapFim) {
                        msManutTotal += (overlapFim - overlapInicio);
                    }
                });
            });

            const totalMsDisponivelPeriodo = totalFrota * msTotalPeriodo;
            let dispNoPeriodoMs = totalMsDisponivelPeriodo - msManutTotal;
            if (dispNoPeriodoMs < 0) dispNoPeriodoMs = 0;
            const mediaAtivosReal = Math.round(dispNoPeriodoMs / msTotalPeriodo);

            if (activeT === 'ALL' || activeT.toUpperCase().includes('SERRANALOG')) {
                const metaViagens = mediaAtivosReal * 2 * diasConsideradosCalc;
                
                elMetaTexto.innerHTML = `Disp: <b class="text-emerald-400">${mediaAtivosReal}</b> carros | Meta: <b class="text-sky-400">${metaViagens}</b>`;
                elMetaTexto.classList.remove('hidden');
                
                if (metaViagens > 0) {
                    if (totalViagens >= metaViagens) {
                        elTotalViagens.className = "text-[32px] font-extrabold leading-none m-0 text-emerald-400 drop-shadow-md transition-all";
                        elIconeMeta.innerHTML = '<i class="fas fa-check-circle text-emerald-400 text-[22px] drop-shadow-md" title="Meta Atingida"></i>';
                    } else {
                        elTotalViagens.className = "text-[32px] font-extrabold leading-none m-0 text-rose-500 drop-shadow-md transition-all";
                        elIconeMeta.innerHTML = '<i class="fas fa-exclamation-circle text-rose-500 text-[22px] drop-shadow-md" title="Abaixo da Meta"></i>';
                    }
                } else {
                    elIconeMeta.innerHTML = '';
                }
            } else {
                elMetaTexto.classList.add('hidden');
                elIconeMeta.innerHTML = '';
            }
        } else {
            if(elMetaTexto) elMetaTexto.classList.add('hidden');
            if(elIconeMeta) elIconeMeta.innerHTML = '';
        }

        const totalPesoKg = cardsData.reduce((s,x)=>s+(parseFloat(String(x.pesoLiquido).replace(',','.'))||0), 0);
        const mediaPbtc = totalViagens > 0 ? (totalPesoKg / 1000) / totalViagens : 0;
        
        let pbtcCor = "text-white";
        let pbtcIcone = "";

        if (mediaPbtc > 0) {
            if (mediaPbtc < 74) {
                pbtcCor = "text-yellow-400";
                pbtcIcone = '<i class="fas fa-exclamation-triangle text-yellow-400 text-xl ml-2" title="Abaixo do ideal"></i>';
            } else if (mediaPbtc >= 74 && mediaPbtc <= 77.7) {
                pbtcCor = "text-emerald-400";
                pbtcIcone = '<i class="fas fa-check-circle text-emerald-400 text-xl ml-2" title="Ideal"></i>';
            } else if (mediaPbtc > 77.7) {
                pbtcCor = "text-rose-500";
                pbtcIcone = '<i class="fas fa-times-circle text-rose-500 text-xl ml-2" title="Acima do ideal"></i>';
            }
        }
        document.getElementById('totalPesoLiq').innerHTML = `<span class="${pbtcCor}">${mediaPbtc.toLocaleString('pt-PT', {maximumFractionDigits:1})} t</span>${pbtcIcone}`;

        const totalVol = cardsData.reduce((s,x)=>s+(parseFloat(String(x.volumeReal).replace(',','.'))||0), 0);
        const mediaVol = totalViagens > 0 ? (totalVol / totalViagens) : 0;
        
        document.getElementById('mediaVolumeViagem').innerText = mediaVol.toLocaleString('pt-PT', {maximumFractionDigits:1}) + ' m³';
        document.getElementById('totalVolumeReal').innerText = totalVol.toLocaleString('pt-PT', {maximumFractionDigits:1}) + ' m³';

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

        atualizarElementoTempo('cicloMedio', mediaCiclo, 10.083); 
        atualizarElementoTempo('filaCampo', mediaFilaCampo, 1.333); 
        atualizarElementoTempo('tempoCarregamento', mediaTempoCarregamento, 0.5); 
        atualizarElementoTempo('filaFabrica', mediaFilaFabrica, 0.5); 

        const tbodyComp = document.getElementById('comparativoBody');
        if (tbodyComp) {
            const dataC1 = filteredGlobal.filter(d => checkLoader(d, serranaLoaders) && isSerranaTransp(d));
            const dataC2 = filteredGlobal.filter(d => checkLoader(d, serranaLoaders) && !isSerranaTransp(d));
            const dataC3 = filteredGlobal.filter(d => checkLoader(d, reflorestarLoaders) && isSerranaTransp(d));
            const dataC4 = filteredGlobal.filter(d => checkLoader(d, jslLoaders) && isSerranaTransp(d));
            
            const stC1 = calcStats(dataC1);
            const stC2 = calcStats(dataC2);
            const stC3 = calcStats(dataC3);
            const stC4 = calcStats(dataC4);
            const stGlobal = calcStats(filteredGlobal);

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
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stC1.medCiclo)}</td>
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stC2.medCiclo)}</td>
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stC3.medCiclo)}</td>
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stC4.medCiclo)}</td>
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stGlobal.medCiclo)}</td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-300 text-[12px] uppercase tracking-wider"><i class="fas fa-hourglass-half text-amber-500 w-5"></i> Espera Média Campo</td>
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stC1.medFilaCpo)}</td>
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stC2.medFilaCpo)}</td>
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stC3.medFilaCpo)}</td>
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stC4.medFilaCpo)}</td>
                    <td class="px-6 py-4 font-mono text-white text-[16px] font-bold text-right">${formatarHorasMinutos(stGlobal.medFilaCpo)}</td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors border-t border-slate-700">
                    <td class="px-6 py-4 font-bold text-slate-300 text-[12px] uppercase tracking-wider"><i class="fas fa-road text-slate-400 w-5"></i> Dist. Média (Asfalto/Terra)</td>
                    <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right">
                        <span class="text-sky-300">Asf: ${stC1.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br>
                        <span class="text-amber-400">Ter: ${stC1.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span>
                    </td>
                    <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right">
                        <span class="text-sky-300">Asf: ${stC2.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br>
                        <span class="text-amber-400">Ter: ${stC2.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span>
                    </td>
                    <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right">
                        <span class="text-sky-300">Asf: ${stC3.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br>
                        <span class="text-amber-400">Ter: ${stC3.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span>
                    </td>
                    <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right">
                        <span class="text-sky-300">Asf: ${stC4.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br>
                        <span class="text-amber-400">Ter: ${stC4.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span>
                    </td>
                    <td class="px-6 py-4 font-mono text-white text-[14px] font-bold text-right">
                        <span class="text-sky-300">Asf: ${stGlobal.medAsfalto.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span><br>
                        <span class="text-amber-400">Ter: ${stGlobal.medTerra.toLocaleString('pt-PT',{minimumFractionDigits:1, maximumFractionDigits:1})}</span>
                    </td>
                </tr>
            `;
        }

        const baseEvolucao = filteredGlobal.length > 0 ? filteredGlobal : fullHistoricoDataOp;
        renderCarregamentoChart(baseEvolucao);
        
        const baseTransporte = baseEvolucao.filter(d => {
            const transp = String(d.transportadora || "").toUpperCase();
            return transp.includes('SERRANALOG') && !transp.includes('ASN');
        });
        renderTransporteChart(baseTransporte);

        const filteredSerrana = cardsData;
        let diasConsiderados = 1;
        if(activeQuickFilterOp === 'D-1') diasConsiderados = 1;
        if(activeQuickFilterOp === 'D-2') diasConsiderados = 1;
        if(activeQuickFilterOp === 'D-3') diasConsiderados = 3;
        if(activeQuickFilterOp === 'D-7') diasConsiderados = 7;
        if(activeQuickFilterOp === 'D-30') diasConsiderados = 30;
        if(activeQuickFilterOp === 'ALL') diasConsiderados = 30;
        
        renderLeaderboards(filteredSerrana, diasConsiderados);
    }

    function renderCarregamentoChart(data) {
        const ctxCarreg = document.getElementById('evolucaoCarregamentoChart');
        if(!ctxCarreg) return;

        let existingChart = Chart.getChart("evolucaoCarregamentoChart");
        if (existingChart != undefined) { existingChart.destroy(); }
        if (chartCarregamento) chartCarregamento.destroy();
        
        const dailyMap = new Map();
        data.forEach(d => {
            const dt = d.dataDaBaseExcel;
            if (!dt || dt === 'Desconhecida') return;
            if (!dailyMap.has(dt)) dailyMap.set(dt, 0);
            const vol = parseFloat(String(d.volumeReal).replace(',', '.')) || 0;
            dailyMap.set(dt, dailyMap.get(dt) + vol);
        });

        const sortedDates = Array.from(dailyMap.keys()).sort((a, b) => {
            const pA = a.split('/'); const pB = b.split('/');
            return new Date(pA[2], pA[1]-1, pA[0]) - new Date(pB[2], pB[1]-1, pB[0]);
        });
        const displayDates = sortedDates.slice(-30);
        const displayVols = displayDates.map(dt => dailyMap.get(dt));
        
        const ctx = ctxCarreg.getContext('2d');
        let gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#10b981'); 
        gradient.addColorStop(1, '#047857'); 

        chartCarregamento = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: displayDates.map(d => d.substring(0, 5)), 
                datasets: [{
                    label: 'Carregamento (m³)',
                    data: displayVols,
                    backgroundColor: gradient,
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false, beginAtZero: true, suggestedMax: Math.max(...displayVols) * 1.2 }, 
                    x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11, weight: 'bold' }, color: '#cbd5e1' } }
                },
                layout: { padding: { top: 25 } }
            },
            plugins: [chartDataLabelsPlugin]
        });
    }

    function renderTransporteChart(data) {
        const ctxTransp = document.getElementById('evolucaoTransporteChart');
        if(!ctxTransp) return;

        let existingChart = Chart.getChart("evolucaoTransporteChart");
        if (existingChart != undefined) { existingChart.destroy(); }
        if (chartTransporte) chartTransporte.destroy();
        
        const dailyMap = new Map();
        data.forEach(d => {
            const dt = d.dataDaBaseExcel;
            if (!dt || dt === 'Desconhecida') return;
            if (!dailyMap.has(dt)) dailyMap.set(dt, 0);
            const vol = parseFloat(String(d.volumeReal).replace(',', '.')) || 0;
            dailyMap.set(dt, dailyMap.get(dt) + vol);
        });

        const sortedDates = Array.from(dailyMap.keys()).sort((a, b) => {
            const pA = a.split('/'); const pB = b.split('/');
            return new Date(pA[2], pA[1]-1, pA[0]) - new Date(pB[2], pB[1]-1, pB[0]);
        });
        const displayDates = sortedDates.slice(-30);
        const displayVols = displayDates.map(dt => dailyMap.get(dt));
        
        const ctx = ctxTransp.getContext('2d');
        let gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#38bdf8'); 
        gradient.addColorStop(1, '#0369a1'); 

        chartTransporte = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: displayDates.map(d => d.substring(0, 5)), 
                datasets: [{
                    label: 'Transporte (m³)',
                    data: displayVols,
                    backgroundColor: gradient,
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false, beginAtZero: true, suggestedMax: Math.max(...displayVols) * 1.2 }, 
                    x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11, weight: 'bold' }, color: '#cbd5e1' } }
                },
                layout: { padding: { top: 25 } }
            },
            plugins: [chartDataLabelsPlugin]
        });
    }

    function renderLeaderboards(data, diasConsiderados = 1) {
        const pMap = new Map();
        data.forEach(d => {
            const pl = d.placa || 'N/A';
            const volNum = parseFloat(String(d.volumeReal).replace(',', '.')) || 0;
            if(!pMap.has(pl)) pMap.set(pl, {p: pl, t: d.transportadora||'-', vol: 0, v: 0, ciclos: 0, cCount: 0});
            
            const o = pMap.get(pl);
            o.vol += volNum; o.v++;
            if(d.cicloHoras > 0) { o.ciclos += d.cicloHoras; o.cCount++; }
        });

        const arr = Array.from(pMap.values());
        
        window.diasConsideradosGlobais = diasConsiderados;
        window.globalTopVol = [...arr].sort((a,b)=>b.vol - a.vol);
        window.globalTopCiclo = [...arr].filter(x=>x.cCount > 0).map(x=>({...x, cMedio: x.ciclos/x.cCount})).sort((a,b)=>a.cMedio - b.cMedio);

        const bVol = document.getElementById('leaderboardBody');
        if(bVol) {
            bVol.innerHTML = '';
            window.globalTopVol.forEach((x,i) => {
                const viagensPorDia = diasConsiderados > 0 ? (x.v / diasConsiderados) : x.v;
                const cumpriuMeta = viagensPorDia >= 2;
                
                const badgeHtml = cumpriuMeta 
                    ? `<span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold" title="${viagensPorDia.toFixed(1)} viagens/dia"><i class="fas fa-check mr-1"></i>SIM</span>`
                    : `<span class="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold" title="${viagensPorDia.toFixed(1)} viagens/dia"><i class="fas fa-times mr-1"></i>NÃO</span>`;

                const tr = `<tr>
                    <td class="px-4 py-3 text-center"><div class="w-6 h-6 rounded-full ${i<3?'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]':'bg-slate-800 text-slate-400'} flex items-center justify-center text-xs font-bold">${i+1}</div></td>
                    <td class="px-4 py-3 font-bold text-white">${x.p}</td>
                    <td class="px-4 py-3 text-slate-400 truncate max-w-[100px]">${x.t}</td>
                    <td class="px-4 py-3 text-center text-slate-300">${x.v}</td>
                    <td class="px-4 py-3 text-right font-mono text-emerald-400">${x.vol.toLocaleString('pt-PT',{maximumFractionDigits:1})}</td>
                    <td class="px-4 py-3 text-center">${badgeHtml}</td>
                </tr>`;
                bVol.insertAdjacentHTML('beforeend', tr);
            });
            
            if (window.globalTopVol.length === 0) {
                bVol.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-slate-500">Nenhum veículo encontrado no período.</td></tr>`;
            }
        }

        const bCiclo = document.getElementById('leaderboardCicloBody');
        if(bCiclo) {
            bCiclo.innerHTML = '';
            window.globalTopCiclo.forEach((x,i) => {
                const tr = `<tr>
                    <td class="px-4 py-3 text-center"><div class="w-6 h-6 rounded-full ${i<3?'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]':'bg-slate-800 text-slate-400'} flex items-center justify-center text-xs font-bold">${i+1}</div></td>
                    <td class="px-4 py-3 font-bold text-white">${x.p}</td>
                    <td class="px-4 py-3 text-slate-400 truncate max-w-[100px]">${x.t}</td>
                    <td class="px-4 py-3 text-center text-slate-300">${x.v}</td>
                    <td class="px-4 py-3 text-right font-mono text-sky-400">${formatarHorasMinutos(x.cMedio)}</td>
                </tr>`;
                bCiclo.insertAdjacentHTML('beforeend', tr);
            });
            
            if (window.globalTopCiclo.length === 0) {
                bCiclo.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-500">Nenhum ciclo encontrado no período.</td></tr>`;
            }
        }
    }

    window.exportarTopVolume = function() {
        if (!window.globalTopVol || window.globalTopVol.length === 0) {
            alert("Não há dados de Volume para exportar no período selecionado."); return;
        }
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Posicao;Placa;Transportadora;Total Viagens;Volume Total;Media Viagens/Dia;Cumpriu Meta\n";

        window.globalTopVol.forEach((x, i) => {
            const viagensPorDia = window.diasConsideradosGlobais > 0 ? (x.v / window.diasConsideradosGlobais) : x.v;
            const cumpriuMeta = viagensPorDia >= 2 ? 'SIM' : 'NAO';
            csvContent += `${i + 1};${x.p};${x.t};${x.v};${x.vol.toString().replace('.', ',')};${viagensPorDia.toFixed(2).replace('.', ',')};${cumpriuMeta}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Relatorio_Volume_Veiculos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    window.exportarTopCiclo = function() {
        if (!window.globalTopCiclo || window.globalTopCiclo.length === 0) {
            alert("Não há dados de Ciclos para exportar no período selecionado."); return;
        }
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Posicao;Placa;Transportadora;Viagens Realizadas;Ciclo Medio (Decimais)\n";

        window.globalTopCiclo.forEach((x, i) => {
            csvContent += `${i + 1};${x.p};${x.t};${x.v};${x.cMedio.toFixed(2).replace('.', ',')}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Relatorio_Ciclos_Veiculos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    window.muralSetorKey = 'mural_operacional';
    window.muralSetorData = [];

    window.formatarDataMural = function(dataIso) {
        if(!dataIso) return ''; const [ano, mes, dia] = dataIso.split('-'); return `${dia}/${mes}/${ano}`;
    }

    window.carregarMuralSetor = async function() {
        try {
            const _supa = window.supabaseClientGlobal || supabaseClientLocal;
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
            container.innerHTML = '<div class="text-slate-400 text-center py-3 text-sm">Nenhuma informação ou aviso no momento.</div>';
            return;
        }
        
        container.innerHTML = window.muralSetorData.map(item => {
            const imgHtml = item.imagem ? `<div class="mt-3"><img src="${item.imagem}" class="rounded-lg border border-slate-600 max-h-48 object-contain shadow-md" alt="Imagem Anexa" onclick="window.abrirImagemGlobalOperacional('${item.imagem}')" style="cursor: pointer; transition: 0.3s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"></div>` : '';
            return `
            <div class="flex items-start justify-between bg-slate-900/40 p-3 rounded-lg border-l-4 border-sky-400 border-t border-r border-b border-slate-700/50">
                <div class="flex-1">
                    <div class="mb-1">
                        <span class="text-slate-400 text-xs font-bold mr-2"><i class="fas fa-calendar-day"></i> ${window.formatarDataMural(item.data)}</span>
                        <span class="text-white text-sm font-medium">${item.texto}</span>
                    </div>
                    ${imgHtml}
                </div>
                <button class="bg-emerald-600/80 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-md transition-colors ml-3 mt-1" onclick="window.concluirMuralSetor(${item.id})" title="Concluir / Retirar">
                    <i class="fas fa-check"></i>
                </button>
            </div>
            `;
        }).join('');
    };

    window.addMuralSetor = async function() {
        const dt = document.getElementById('data-mural-setor').value;
        const txt = document.getElementById('txt-mural-setor').value.trim();
        const imgInput = document.getElementById('img-mural-setor');

        if(!dt || !txt) { alert("Preencha a data e o texto para adicionar ao mural!"); return; }
        
        const finalizarAdicao = async (imagemBase64) => {
            window.muralSetorData.unshift({ id: Date.now(), data: dt, texto: txt, imagem: imagemBase64 });
            document.getElementById('txt-mural-setor').value = '';
            document.getElementById('lbl-nome-arquivo').innerText = '';
            if(imgInput) imgInput.value = '';
            
            window.renderizarMuralSetor();
            await window.salvarMuralSetor();
        };

        if (imgInput && imgInput.files && imgInput.files[0]) {
            const file = imgInput.files[0];
            const reader = new FileReader();
            reader.onload = function(e) { finalizarAdicao(e.target.result); };
            reader.readAsDataURL(file); 
        } else {
            finalizarAdicao(null);
        }
    };

    window.concluirMuralSetor = async function(id) {
        if(!confirm("Concluir e retirar este aviso do mural?")) return;
        window.muralSetorData = window.muralSetorData.filter(i => i.id !== id);
        window.renderizarMuralSetor();
        await window.salvarMuralSetor();
    };

    window.salvarMuralSetor = async function() {
        const msg = document.getElementById('msg-mural-setor');
        if(msg) { msg.className = 'text-xs font-bold text-slate-400'; msg.innerText = 'Salvando...'; }
        
        try {
            const _supa = window.supabaseClientGlobal || supabaseClientLocal;
            await _supa.from('configuracoes').upsert([{ chave: window.muralSetorKey, valor: JSON.stringify(window.muralSetorData) }], { onConflict: 'chave' });
            
            if(msg) { 
                msg.className = 'text-xs font-bold text-emerald-400'; 
                msg.innerText = 'Salvo com sucesso!';
                setTimeout(() => msg.innerText='', 3000);
            }
        } catch(e) {
            if(msg) { msg.className = 'text-xs font-bold text-rose-500'; msg.innerText = 'Erro ao salvar!'; }
        }
    };

    window.frotaPendenciasData = [];

    window.carregarFrotaSupabase = async function() {
        try {
            const client = window.supabaseClientGlobal || supabaseClientLocal;
            const { data, error } = await client.from('frota_pendencias').select('*').order('data_criacao', { ascending: false });
            if (error) throw error;
            window.frotaPendenciasData = data || [];
            window.renderizarTabelaFrota();
        } catch (e) { console.error("Erro ao carregar frota:", e); }
    };

    window.toggleStatusSupabase = async function(id, campo, valorAtual) {
        try {
            const client = window.supabaseClientGlobal || supabaseClientLocal;
            const { error } = await client.from('frota_pendencias').update({ [campo]: !valorAtual }).eq('id', id);
            if (error) throw error;
            window.carregarFrotaSupabase();
        } catch (e) { console.error("Erro ao atualizar status:", e); }
    };

    window.renderizarTabelaFrota = function() {
        const tbody = document.getElementById('lista-caminhoes-pendentes');
        if(!tbody) return;
        tbody.innerHTML = '';

        if(window.frotaPendenciasData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-slate-500">Nenhuma frota com pendência cadastrada.</td></tr>';
            return;
        }

        window.frotaPendenciasData.forEach(cam => {
            const getIcon = (status, campo) => status 
                ? `<i class="fas fa-check-circle text-emerald-400 text-lg cursor-pointer hover:scale-110 transition-transform" onclick="window.toggleStatusSupabase(${cam.id}, '${campo}', true)"></i>` 
                : `<i class="fas fa-times-circle text-rose-500 text-lg cursor-pointer hover:scale-110 transition-transform" onclick="window.toggleStatusSupabase(${cam.id}, '${campo}', false)"></i>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-4 py-3 bg-slate-900/40 text-white">${cam.placa}</td>
                <td class="px-2 py-3 text-center">${getIcon(cam.crlve, 'crlve')}</td>
                <td class="px-2 py-3 text-center">${getIcon(cam.crono, 'crono')}</td>
                <td class="px-2 py-3 text-center">${getIcon(cam.antt, 'antt')}</td>
                <td class="px-2 py-3 text-center">${getIcon(cam.aet, 'aet')}</td>
                <td class="px-2 py-3 text-center">${getIcon(cam.apr, 'apr')}</td>
                <td class="px-2 py-3 text-center">${getIcon(cam.floresta, 'floresta')}</td>
                <td class="px-2 py-3 text-center">${getIcon(cam.estrada, 'estrada')}</td>
                <td class="px-2 py-3 text-center">${getIcon(cam.hosp, 'hosp')}</td>
            `;
            tbody.appendChild(tr);
        });
    };

    setupOperacionalFilters();
    loadManutencaoDataForMeta().finally(() => {
        loadOperacionalData();
    });
    
    if(document.getElementById('data-mural-setor')) {
        document.getElementById('data-mural-setor').value = new Date().toISOString().split('T')[0];
    }
    window.carregarMuralSetor();
    window.carregarFrotaSupabase();
};