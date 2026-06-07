'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';
import { verifyLogin } from '@/lib/actions';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await verifyLogin(username, password);
            if (result.success) {
                router.refresh(); // Update server components credentials
                router.push('/manager');
            } else {
                setError(result.message || 'Invalid username or password');
            }
        } catch (err) {
            setError('An error occurred during login');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginCard}>
                <div className={styles.loginHeader}>
                    <Globe size={32} className={styles.logo} strokeWidth={1.5} />
                    <h1 className={styles.title}>Manager Login</h1>
                    <p className={styles.subtitle}>Sign in to manage your headless site</p>
                </div>

                <form className={styles.form} onSubmit={handleLogin}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.loginButton} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="spinner" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <Link href="/" className={styles.backLink}>
                        Back to Website
                    </Link>
                </div>
            </div>
        </div>
    );
}
