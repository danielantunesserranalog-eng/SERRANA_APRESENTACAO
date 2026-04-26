function getConfGeralTemplate() {
    return `
        <div class="config-section">
            <div class="config-title"><i class="fas fa-globe"></i> Configurações Gerais</div>
            <form>
                <div class="form-group"><label class="form-label">Nome da Empresa</label><input type="text" class="form-input" value="Serrana" placeholder="Nome da empresa"></div>
                <div class="form-group"><label class="form-label">Tema</label><select class="form-select"><option>Dark</option><option>Light (em breve)</option></select></div>
                <div class="form-group"><label class="form-label">Idioma</label><select class="form-select"><option>Português</option><option>Inglês (em breve)</option></select></div>
                <button type="submit" class="btn-primary">Salvar Configurações</button>
            </form>
        </div>
        <div class="config-section">
            <div class="config-title"><i class="fas fa-database"></i> Dados do Sistema</div>
            <p>Última atualização: Janeiro/2024</p>
            <p>Versão: 2.0.0</p>
        </div>
    `;
}

function getConfUsuariosTemplate() {
    return `
        <div class="config-section">
            <div class="config-title"><i class="fas fa-users-cog"></i> Gerenciar Usuários</div>
            <form id="formUsuario">
                <div class="form-group"><label class="form-label">Nome</label><input type="text" class="form-input" placeholder="Nome do usuário"></div>
                <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" placeholder="email@empresa.com"></div>
                <div class="form-group"><label class="form-label">Perfil</label><select class="form-select"><option>Administrador</option><option>Gestor</option><option>Usuário</option></select></div>
                <button type="submit" class="btn-primary">Adicionar Usuário</button>
            </form>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Ações</th></tr></thead>
                <tbody><tr><td>Admin</td><td>admin@serrana.com</td><td>Administrador</td><td><i class="fas fa-edit"></i> <i class="fas fa-trash"></i></td></tr></tbody>
            </table>
        </div>
    `;
}

function getConfSetoresTemplate() {
    return `
        <div class="config-section">
            <div class="config-title"><i class="fas fa-building"></i> Configuração de Setores</div>
            ${menuConfig.filter(m => m.id !== 'configuracoes').map(setor => `
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-primary); border-radius: 12px;">
                    <h3><i class="${setor.icone}" style="color: ${setor.cor}"></i> ${setor.nome}</h3>
                    <div class="form-group"><label class="form-label">Responsável</label><input type="text" class="form-input" placeholder="Nome do responsável"></div>
                    <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" placeholder="email@setor.com"></div>
                </div>
            `).join('')}
            <button class="btn-primary">Salvar Configurações dos Setores</button>
        </div>
    `;
}

function getConfBackupTemplate() {
    return `
        <div class="config-section">
            <div class="config-title"><i class="fas fa-database"></i> Backup e Restauração</div>
            <button class="btn-primary" style="margin-right: 1rem;"><i class="fas fa-download"></i> Exportar Dados</button>
            <button class="btn-secondary"><i class="fas fa-upload"></i> Importar Backup</button>
        </div>
        <div class="config-section">
            <div class="config-title"><i class="fas fa-clock"></i> Histórico de Backups</div>
            <table class="data-table">
                <thead><tr><th>Data</th><th>Tamanho</th><th>Tipo</th><th>Ações</th></tr></thead>
                <tbody><tr><td>15/01/2024 10:30</td><td>2.5 MB</td><td>Completo</td><td><i class="fas fa-download"></i> Baixar</td></tr></tbody>
            </table>
        </div>
    `;
}

window.carregarConfigGeral = () => loadModuleContent('configuracoes', 'conf_geral');
window.carregarConfigUsuarios = () => loadModuleContent('configuracoes', 'conf_usuarios');
window.carregarConfigSetores = () => loadModuleContent('configuracoes', 'conf_setores');
window.carregarConfigBackup = () => loadModuleContent('configuracoes', 'conf_backup');