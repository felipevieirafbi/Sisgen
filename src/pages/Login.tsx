import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!consent) {
      setError("Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || "",
          email: user.email || "",
          role: "client",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/dashboard");
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: user.email || "",
          role: "client",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#e8e0d8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col items-center">
          <img src="https://regulabio.com.br/assets/logo/regulabio-symbol.png" alt="RegulaBio Logo" className="h-16 w-auto mb-4" referrerPolicy="no-referrer" />
          <h2 className="mt-2 text-center text-3xl font-extrabold text-[#1b3a4b]">
            {isLogin ? t('login.access') : t('login.create')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('login.platform')}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailAuth}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">{t('login.name')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#234b61] focus:border-[#234b61] focus:z-10 sm:text-sm"
                    placeholder={t('login.name')}
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">{t('login.email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#234b61] focus:border-[#234b61] focus:z-10 sm:text-sm"
                  placeholder={t('login.email')}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">{t('login.password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#234b61] focus:border-[#234b61] focus:z-10 sm:text-sm"
                  placeholder={t('login.password')}
                />
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="focus:ring-[#234b61] h-4 w-4 text-[#1b3a4b] border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="consent" className="font-medium text-gray-700">
                  Li e concordo com os <a href="/terms" className="text-[#b8975a] hover:underline" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a <a href="/privacy" className="text-[#b8975a] hover:underline" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#1b3a4b] hover:bg-[#234b61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b3a4b] disabled:opacity-50 transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-[#234b61] group-hover:text-white" aria-hidden="true" />
              </span>
              {isLogin ? t('login.enter') : t('login.register')}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('login.or_continue')}</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-[#e8e0d8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b3a4b] disabled:opacity-50 transition-colors"
            >
              <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
              Google
            </button>
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-[#234b61] hover:text-[#1b3a4b]"
          >
            {isLogin ? t('login.no_account') : t('login.has_account')}
          </button>
        </div>
      </div>
    </div>
  );
}
