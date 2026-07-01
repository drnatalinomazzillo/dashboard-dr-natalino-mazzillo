/**
 * Formata data para DD/MM/YYYY
 */
export function formatDateBR(dateStr) {
    if (!dateStr) return '-';
    if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return dateStr;
}

/**
 * Formata valor como moeda brasileira
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Calcula tempo entre duas datas em dias
 */
export function calculateLeadTime(leadDate, saleDate) {
    if (!leadDate || !saleDate) return "N/A";
    const d1 = new Date(leadDate.includes('T') ? leadDate.split('T')[0] : leadDate);
    const d2 = new Date(saleDate.includes('T') ? saleDate.split('T')[0] : saleDate);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + (diffDays === 1 ? " dia" : " dias");
}

/**
 * Normaliza data ISO (remove timezone, converte DD/MM/YYYY para YYYY-MM-DD)
 */
export function normalizeDate(dateStr) {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    if (dateStr.includes('/')) return dateStr.split('/').reverse().join('-');
    return dateStr;
}

/**
 * Retorna data de hoje no formato YYYY-MM-DD
 */
export function todayISO() {
    return new Date().toISOString().split('T')[0];
}
