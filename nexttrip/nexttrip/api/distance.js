export default async function handler(req, res) {
  const { origin, destination } = req.query;
  
  if (!origin || !destination) {
    return res.status(400).json({ error: "Missing params" });
  }

  const GMAPS_KEY = "AIzaSyDBpHd3eQLth0GhXeI50dT5JfefWfpQyAY";
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GMAPS_KEY}&language=es&units=metric&mode=driving`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== "OK") return res.status(200).json({ error: data.status });
    
    const el = data.rows?.[0]?.elements?.[0];
    if (el?.status !== "OK") return res.status(200).json({ error: "Route not found" });

    res.status(200).json({
      km: Math.round(el.distance.value / 100) / 10,
      duration: el.duration.text,
      distance: el.distance.text,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
