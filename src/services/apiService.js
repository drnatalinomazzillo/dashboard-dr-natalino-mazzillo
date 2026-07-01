import { API_URL } from '../config/api';

/**
 * Busca todos os dados do servidor (read)
 */
export async function fetchAllData() {
    const response = await fetch(API_URL + "?action=read&_t=" + Date.now());
    const data = await response.json();
    return data;
}

/**
 * Adiciona uma nova venda
 */
export async function addSale(saleData) {
    const response = await fetch(API_URL + "?action=addSale", {
        method: "POST",
        body: JSON.stringify(saleData)
    });
    return response.json();
}

/**
 * Edita uma venda existente
 */
export async function editSale(updatedData) {
    const response = await fetch(API_URL + "?action=editSale", {
        method: "POST",
        body: JSON.stringify(updatedData)
    });
    return response.json();
}

/**
 * Adiciona dados de marketing
 */
export async function addMarketing(marketingData) {
    const response = await fetch(API_URL + "?action=addMarketing", {
        method: "POST",
        body: JSON.stringify(marketingData)
    });
    return response.json();
}

/**
 * Adiciona criativos em lote
 */
export async function addCreatives(items) {
    const response = await fetch(API_URL + "?action=addCreatives", {
        method: "POST",
        body: JSON.stringify(items)
    });
    return response.json();
}

/**
 * Adiciona item de configuração (público ou procedimento)
 */
export async function addConfig(configData) {
    const response = await fetch(API_URL + "?action=addConfig", {
        method: "POST",
        body: JSON.stringify(configData)
    });
    return response.json();
}

/**
 * Login via Apps Script
 */
export async function doLogin(user, pass) {
    const response = await fetch(
        API_URL + '?action=login&user=' + encodeURIComponent(user) + '&pass=' + encodeURIComponent(pass)
    );
    return response.json();
}
