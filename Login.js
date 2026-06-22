import React, { useState } from 'react';
import { ethers } from 'ethers';

export default function Login({ onLogin, onSignup }) {
    const [userType, setUserType] = useState('public');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const BACKEND_URL = 'http://localhost:5000';

    // ==========================================
    //       NORMAL LOGIN (Authority only)
    // ==========================================
    const handleNormalLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, userType: 'authority' })
            });
            const data = await response.json();

            if (data.success) {
                onLogin(data.user);
            } else {
                setError(data.message || 'Invalid login credentials');
            }
        } catch (err) {
            setError('Server error during login');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    //       WEB3 LOGIN (Public only)
    // ==========================================
    const handleMetaMaskLogin = async () => {
        setError('');
        setLoading(true);

        if (!window.ethereum) {
            setError('MetaMask is not installed! Please add the extension.');
            setLoading(false);
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const walletAddress = accounts[0];

            const nonceRes = await fetch(`${BACKEND_URL}/api/auth/nonce`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress })
            });
            const nonceData = await nonceRes.json();
            if (!nonceData.success) throw new Error(nonceData.error);

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const signature = await signer.signMessage(nonceData.nonce);

            const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, signature })
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) throw new Error(verifyData.error);

            // Force userType to 'public' for Web3 logins, regardless of
            // whatever value is currently stored in the database.
            verifyData.user.userType = 'public';

            onLogin(verifyData.user);

        } catch (err) {
            console.error(err);
            setError(err.message || 'MetaMask login failed.');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    //              STYLES
    // ==========================================
    const styles = {
        page: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#eaf2fc',
            fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
        },
        card: {
            width: '380px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '32px 28px',
            boxShadow: '0 10px 30px rgba(30, 64, 175, 0.12)',
        },
        title: {
            fontSize: '26px',
            fontWeight: 800,
            color: '#1e2a4a',
            margin: '0 0 20px 0',
        },
        toggleWrap: {
            display: 'flex',
            backgroundColor: '#eef2fb',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '20px',
        },
        toggleBtn: (active) => ({
            flex: 1,
            padding: '10px 0',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            backgroundColor: active ? '#5b8def' : 'transparent',
            color: active ? '#ffffff' : '#1e2a4a',
            transition: 'all 0.2s ease',
        }),
        input: {
            width: '100%',
            padding: '13px 14px',
            fontSize: '15px',
            borderRadius: '10px',
            border: '1px solid #d7e0f0',
            marginBottom: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            color: '#1e2a4a',
        },
        passwordWrap: {
            position: 'relative',
        },
        eyeIcon: {
            position: 'absolute',
            right: '14px',
            top: '13px',
            cursor: 'pointer',
            color: '#8392b5',
            fontSize: '16px',
            userSelect: 'none',
        },
        linksRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '18px',
            fontSize: '13px',
        },
        link: {
            color: '#3b6fe0',
            textDecoration: 'none',
            cursor: 'pointer',
            fontWeight: 600,
        },
        loginBtn: {
            width: '100%',
            padding: '14px 0',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#2f4380',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
        },
        web3Btn: {
            width: '100%',
            padding: '14px 0',
            borderRadius: '10px',
            border: '1px solid #d7e0f0',
            backgroundColor: '#f4f6fb',
            color: '#1e2a4a',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
        },
        error: {
            color: '#d64545',
            fontSize: '13px',
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: '14px',
        },
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h1 style={styles.title}>Log In</h1>

                {/* TOGGLE: Public / Government Authority */}
                <div style={styles.toggleWrap}>
                    <button
                        type="button"
                        style={styles.toggleBtn(userType === 'public')}
                        onClick={() => { setUserType('public'); setError(''); }}
                    >
                        Public
                    </button>
                    <button
                        type="button"
                        style={styles.toggleBtn(userType === 'authority')}
                        onClick={() => { setUserType('authority'); setError(''); }}
                    >
                        Government Authority
                    </button>
                </div>

                {error && <p style={styles.error}>{error}</p>}

                {/* AUTHORITY: traditional login form ONLY */}
                {userType === 'authority' && (
                    <form onSubmit={handleNormalLogin}>
                        <input
                            type="text"
                            placeholder="Email or Mobile Number"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                        />

                        <div style={styles.passwordWrap}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={styles.input}
                            />
                            <span
                                style={styles.eyeIcon}
                                onClick={() => setShowPassword((s) => !s)}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </span>
                        </div>

                        <div style={styles.linksRow}>
                            <span style={styles.link} onClick={() => { /* hook up forgot-password flow */ }}>
                                Forgot Password?
                            </span>
                            <span style={styles.link} onClick={onSignup}>
                                Sign Up
                            </span>
                        </div>

                        <button type="submit" disabled={loading} style={styles.loginBtn}>
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>
                )}

                {/* PUBLIC: Web3 wallet button ONLY */}
                {userType === 'public' && (
                    <button
                        type="button"
                        onClick={handleMetaMaskLogin}
                        disabled={loading}
                        style={styles.web3Btn}
                    >
                        {loading ? 'Verifying Identity...' : '🦊 Sign in with Web3 Wallet'}
                    </button>
                )}
            </div>
        </div>
    );
}