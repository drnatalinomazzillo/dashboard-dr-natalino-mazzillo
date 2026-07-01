import { createContext, useContext, useReducer, useCallback } from 'react';
import { fetchAllData } from '../services/apiService';

const AppContext = createContext(null);

const initialState = {
    // Auth
    isAuthenticated: sessionStorage.getItem('nt_auth') === 'true',
    currentUser: sessionStorage.getItem('nt_user') || '',

    // Data
    publics: [],
    procedures: [],
    history: [],
    sales: [],
    marketing: [],
    extraTags: JSON.parse(localStorage.getItem('nt_extra_tags') || '[]'),

    // UI
    activeTab: 'vendas',
    loading: false,
    toast: { message: '', type: 'success', visible: false },
};

function appReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };

        case 'SET_AUTH':
            return {
                ...state,
                isAuthenticated: action.payload.isAuthenticated,
                currentUser: action.payload.user || state.currentUser,
            };

        case 'SET_TAB':
            return { ...state, activeTab: action.payload };

        case 'SET_APP_DATA':
            return {
                ...state,
                publics: action.payload.publics || state.publics,
                procedures: action.payload.procedures || state.procedures,
                history: action.payload.history || state.history,
                sales: action.payload.sales || state.sales,
                marketing: action.payload.marketing || state.marketing,
            };

        case 'ADD_SALE':
            return { ...state, sales: [...state.sales, action.payload] };

        case 'UPDATE_SALE': {
            const newSales = [...state.sales];
            newSales[action.payload.index] = { ...newSales[action.payload.index], ...action.payload.data };
            return { ...state, sales: newSales };
        }

        case 'ADD_MARKETING':
            return { ...state, marketing: [...state.marketing, action.payload] };

        case 'ADD_CREATIVES':
            return { ...state, history: [...action.payload, ...state.history] };

        case 'ADD_CONFIG':
            if (action.payload.type === 'public') {
                return { ...state, publics: [...state.publics, { name: action.payload.name, code: action.payload.code }] };
            }
            return { ...state, procedures: [...state.procedures, { name: action.payload.name, code: action.payload.code }] };

        case 'ADD_EXTRA_TAG': {
            const newTags = [...state.extraTags, action.payload];
            localStorage.setItem('nt_extra_tags', JSON.stringify(newTags));
            return { ...state, extraTags: newTags };
        }

        case 'SHOW_TOAST':
            return { ...state, toast: { message: action.payload.message, type: action.payload.type || 'success', visible: true } };

        case 'HIDE_TOAST':
            return { ...state, toast: { ...state.toast, visible: false } };

        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const showToast = useCallback((message, type = 'success') => {
        dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
        setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 2500);
    }, []);

    const initData = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const data = await fetchAllData();
            dispatch({
                type: 'SET_APP_DATA',
                payload: {
                    history: data.history || [],
                    sales: data.sales || [],
                    marketing: data.marketing || [],
                    publics: data.configs?.publics || [],
                    procedures: data.configs?.procedures || [],
                }
            });
            showToast("Sincronizado com Sucesso!");
        } catch (e) {
            console.error("Sync Error", e);
            showToast("Erro de conexão. Tente recarregar.", "error");
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [showToast]);

    const login = useCallback((user) => {
        sessionStorage.setItem('nt_auth', 'true');
        sessionStorage.setItem('nt_user', user);
        dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, user } });
    }, []);

    const value = {
        state,
        dispatch,
        showToast,
        initData,
        login,

        // Computed helpers
        getAllTags: () => [...new Set([...state.history.map(i => i.refCode), ...state.extraTags])].sort(),
        getAllCreatives: () => [...new Set(state.history.map(i => i.finalName))].sort(),
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
