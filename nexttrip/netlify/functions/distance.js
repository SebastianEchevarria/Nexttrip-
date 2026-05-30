exports.handler = async (event) => {
  const { origin, destination } = event.queryStringParameters || {};
  
  if (!origin || !destination) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing origin or destination" }) };
  }

  const GMAPS_KEY = "AIzaSyDBpHd3eQLth0GhXeI50dT5JfefWfpQyAY";
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GMAPS_KEY}&language=es&units=metric&mode=driving`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status !== "OK") {
      return { statusCode: 200, body: JSON.stringify({ error: data.status }) };
    }
    
    const el = data.rows?.[0]?.elements?.[0];
    if (el?.status !== "OK") {
      return { statusCode: 200, body: JSON.stringify({ error: "Route not found" }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        km: Math.round(el.distance.value / 100) / 10,
        duration: el.duration.text,
        distance: el.distance.text,
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
