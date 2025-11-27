// src/components/Dashboard.jsx → VERSION FINALE ULTIME – AUCUNE ERREUR
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../styles.css";

export default function Dashboard({ user, setUser }) {
  const [participating, setParticipating] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [participantsList, setParticipantsList] = useState([]); // [{name, email}]
  const [myMvpVote, setMyMvpVote] = useState(null); // email du MVP voté
  const [mvpResults, setMvpResults] = useState([]); // [{name, votes}]
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  // Jeudi cette semaine
  const getCurrentThursday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 4 : (4 - day + 7) % 7 || 0;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const thursday = getCurrentThursday();
  const weekKey = thursday.toISOString().split("T")[0];
  const formattedDate = thursday
    .toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .replace(/^\w/, (c) => c.toUpperCase());

  useEffect(() => {
    loadEverything();
    const channel = supabase
      .channel("all")
      .on("postgres_changes", { event: "*", schema: "public" }, () =>
        loadEverything()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const loadEverything = async () => {
    await Promise.all([
      loadMyAnswer(),
      loadParticipants(),
      loadMyMvpVote(),
      loadMvpResults(),
    ]);
    setLoading(false);
  };

  const loadMyAnswer = async () => {
    const { data } = await supabase
      .from("weekly_participation")
      .select("participating")
      .eq("user_id", user.id)
      .eq("week_date", weekKey)
      .maybeSingle();
    setParticipating(data?.participating ?? null);
  };

  const loadParticipants = async () => {
    const { data, count } = await supabase
      .from("participants_this_week")
      .select("email", { count: "exact" })
      .eq("week_date", weekKey)
      .eq("participating", true);

    setTotalParticipants(count || 0);
    const list =
      data?.map((r) => ({ name: r.email.split("@")[0], email: r.email })) || [];
    setParticipantsList(list);
  };

  const loadMyMvpVote = async () => {
    const { data } = await supabase
      .from("mvp_votes")
      .select("mvp_email")
      .eq("match_week", weekKey)
      .eq("voter_id", user.id)
      .maybeSingle();
    setMyMvpVote(data?.mvp_email || null);
  };

  const loadMvpResults = async () => {
    const { data } = await supabase
      .from("mvp_results")
      .select("email,votes")
      .eq("match_week", weekKey)
      .order("votes", { ascending: false });
    const results =
      data?.map((r) => ({ name: r.email.split("@")[0], votes: r.votes })) || [];
    setMvpResults(results);
  };

  const submitAnswer = async (answer) => {
    setLoading(true);
    await supabase.from("weekly_participation").upsert(
      {
        user_id: user.id,
        week_date: weekKey,
        participating: answer,
      },
      { onConflict: "user_id,week_date" }
    );
    setParticipating(answer);
    loadParticipants();
    if (answer) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    setLoading(false);
  };

  const voteMvp = async (mvpEmail) => {
    await supabase.from("mvp_votes").upsert(
      {
        match_week: weekKey,
        voter_id: user.id,
        mvp_email: mvpEmail,
      },
      { onConflict: "match_week,voter_id" }
    );

    setMyMvpVote(mvpEmail);
    loadMvpResults();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <>
      {/* Confettis */}
      {showConfetti && (
        <div className="confetti">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{ "--delay": i * 0.05 }}
            />
          ))}
        </div>
      )}

      <button onClick={handleLogout} className="big-logout-btn">
        Déconnexion
      </button>

      <div className="dashboard-with-sidebar">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-header">Participants</div>
          <div className="sidebar-count">{totalParticipants}</div>
          <div className="sidebar-list">
            {participantsList.length === 0 ? (
              <p className="no-participants">En attente...</p>
            ) : (
              participantsList.map((p, i) => (
                <div key={i} className="sidebar-item">
                  {p.name}
                  {myMvpVote === p.email && " (ton vote)"}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN */}
        <div className="main-content">
          {/* Participation */}
          <div className="hero-card">
            <h2>Tu viens ce {formattedDate} ?</h2>
            {participating === null && !loading ? (
              <div className="btn-group">
                <button onClick={() => submitAnswer(true)} className="btn-yes">
                  OUI, je viens !
                </button>
                <button onClick={() => submitAnswer(false)} className="btn-no">
                  Non
                </button>
              </div>
            ) : (
              <div className="answer-display">
                {participating ? "Tu es inscrit !" : "Tu ne viens pas"}
                <button
                  onClick={() => submitAnswer(!participating)}
                  className="change-btn"
                >
                  Changer
                </button>
              </div>
            )}
          </div>

          {/* Vote MVP */}
          {participating && (
            <div
              className="hero-card"
              style={{
                marginTop: "30px",
                background: "rgba(220,20,60,0.15)",
                border: "4px solid #DC143C",
              }}
            >
              <h2 style={{ color: "#DC143C" }}>Qui est le MVP du match ?</h2>
              {myMvpVote ? (
                <p style={{ fontSize: "28px", margin: "20px 0" }}>
                  Tu as voté pour{" "}
                  <strong>
                    {participantsList.find((p) => p.email === myMvpVote)?.name}
                  </strong>
                </p>
              ) : (
                <div className="mvp-vote-grid">
                  {participantsList.map((p) => (
                    <button
                      key={p.email}
                      onClick={() => voteMvp(p.email)}
                      className="mvp-btn"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Résultats MVP avec étoiles */}
          {mvpResults.length > 0 && (
            <div className="hero-card mvp-results-card">
              <h2>MVP du match</h2>
              {mvpResults.map((r, i) => {
                const isWinner = i === 0;
                return (
                  <div
                    key={i}
                    className={`mvp-result-item ${isWinner ? "winner" : ""}`}
                  >
                    {isWinner && (
                      <div className="trophy">
                        <div className="star"></div>
                        <div className="star"></div>
                        <div className="star"></div>
                      </div>
                    )}
                    <div className="mvp-name">{r.name}</div>
                    <div className="mvp-votes">
                      {r.votes} vote{r.votes > 1 ? "s" : ""}
                    </div>
                    {isWinner && <div className="crown"></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
