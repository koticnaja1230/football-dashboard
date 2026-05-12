import { useState, useEffect, useCallback } from "react";

const buildUrl = (path, leagueId) => `/api/${path}/${leagueId}`;

export function useLeagueData(leagueId) {
  const [standings, setStandings] = useState(null);
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [standingsRes, matchesRes] = await Promise.all([
        fetch(buildUrl("standings", leagueId)),
        fetch(buildUrl("matches", leagueId)),
      ]);

      if (!standingsRes.ok)
        throw new Error(`Standings error ${standingsRes.status}`);
      if (!matchesRes.ok) throw new Error(`Matches error ${matchesRes.status}`);

      const [standingsData, matchesData] = await Promise.all([
        standingsRes.json(),
        matchesRes.json(),
      ]);

      setStandings(standingsData?.standings?.[0]?.table || []);
      setMatches(matchesData?.matches || []);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    standings,
    matches,
    loading,
    error,
    refetch: fetchData,
  };
}
