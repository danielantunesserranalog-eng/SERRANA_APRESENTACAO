window.loadModuleContent = loadModuleContent;

// Refresh button
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const activeSubmenu = document.querySelector('.submenu-item.active');
            if (activeSubmenu) {
                const setorId = activeSubmenu.closest('.has-submenu')?.getAttribute('data-setor');
                const submenuId = activeSubmenu.getAttribute('data-submenu');
                if (setorId && submenuId) {
                    loadModuleContent(setorId, submenuId);
                }
            }
        });
    }
});