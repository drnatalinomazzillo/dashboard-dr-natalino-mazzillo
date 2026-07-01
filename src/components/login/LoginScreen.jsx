import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { doLogin } from '../../services/apiService';

export default function LoginScreen() {
    const { login } = useApp();
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!user.trim() || !pass.trim()) {
            setError('Preencha usuário e senha.');
            return;
        }

        setLoading(true);
        try {
            const data = await doLogin(user.trim(), pass.trim());
            if (data.success) {
                login(user.trim());
            } else {
                setError('❌ Usuário ou senha incorretos.');
            }
        } catch (err) {
            console.error(err);
            setError('❌ Erro de conexão. Tente novamente.');
        }
        setLoading(false);
    }

    return (
        <div className="login-screen">
            <div className="login-box">
                <div className="text-center text-4xl mb-4">🔒</div>
                <h1>Acesso Restrito</h1>
                <p className="brand">Próximo Nível Business®</p>
                <form onSubmit={handleSubmit} autoComplete="off">
                    <div style={{ marginBottom: 16 }}>
                        <label>Usuário</label>
                        <input
                            type="text"
                            placeholder="Digite seu usuário"
                            value={user}
                            onChange={e => setUser(e.target.value)}
                            autoComplete="off"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label>Senha</label>
                        <input
                            type="password"
                            placeholder="Digite sua senha"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Verificando...' : 'Entrar'}
                    </button>
                </form>
                <p className="error-msg">{error}</p>
            </div>
        </div>
    );
}
