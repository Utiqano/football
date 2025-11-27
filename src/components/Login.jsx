// src/components/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles.css";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    else setUser(data.user);

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Match du Jeudi</h1>
        <p className="subtitle">Connexion pour confirmer ta présence</p>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          {error && <p className="error-msg">{error}</p>}
        </form>

        <div className="footer-login">
          Pas encore de compte ? Demande à l’organisateur
        </div>
      </div>
    </div>
  );
}
