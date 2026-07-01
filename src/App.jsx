import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/login/LoginScreen';
import Header from './components/layout/Header';
import GeneratorTab from './components/generator/GeneratorTab';
import SalesTab from './components/sales/SalesTab';
import AnalyticsTab from './components/analytics/AnalyticsTab';
import SimulatorTab from './components/simulator/SimulatorTab';
import SettingsModal from './components/settings/SettingsModal';
import Toast from './components/common/Toast';
import Loader from './components/common/Loader';

function AppContent() {
    const { state, initData } = useApp();
    const { isAuthenticated, activeTab, loading } = state;
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            initData();
        }
    }, [isAuthenticated, initData]);

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center px-4 py-8">
            <Loader visible={loading} />
            <Toast />

            <Header onOpenSettings={() => setShowSettings(true)} />

            <main className="w-full flex justify-center">
                <div className={`section-content ${activeTab === 'vendas' ? 'active' : ''}`}>
                    {activeTab === 'vendas' && <SalesTab />}
                </div>
                <div className={`section-content ${activeTab === 'analytics' ? 'active' : ''}`}>
                    {activeTab === 'analytics' && <AnalyticsTab />}
                </div>
                <div className={`section-content ${activeTab === 'simulator' ? 'active' : ''}`}>
                    {activeTab === 'simulator' && <SimulatorTab />}
                </div>
                <div className={`section-content ${activeTab === 'generator' ? 'active' : ''}`}>
                    {activeTab === 'generator' && <GeneratorTab />}
                </div>
            </main>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}
