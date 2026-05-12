// ── เพิ่มใน server.js ก่อน app.listen() ──────────────────────────

// GET /api/coach/:teamId  → head coach ของทีม
app.get("/api/coach/:teamId", async (req, res) => {
  try {
    const data    = await fetchAPI(`/coachs?team=${req.params.teamId}`);
    const coaches = data.response || [];

    // หา coach ที่ยังทำงานอยู่ (ไม่มี career.end) หรืออันล่าสุด
    const active = coaches.find((c) =>
      c.career?.some((career) => career.team?.id == req.params.teamId && !career.end)
    ) || coaches[0];

    if (!active) return res.json({ coach: null });

    // หา career entry ของทีมนี้
    const career = active.career?.find((c) => c.team?.id == req.params.teamId && !c.end)
      || active.career?.[0];

    res.json({
      coach: {
        id:          active.id,
        name:        active.name,
        nationality: active.nationality,
        age:         active.age,
        photo:       active.photo,
        career: {
          contract: {
            start: career?.start || null,
          },
        },
      },
    });
  } catch (e) {
    console.error("[coach]", e.message);
    res.status(500).json({ error: e.message });
  }
});
