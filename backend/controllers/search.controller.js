export async function searchPerson(req, res) {
  const { query } = req.params;
  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(
        query
      )}&language=en-US&page=1&include_adult=false`
    );
    if (response.results.length === 0) {
      return res.status(404).send(null);
    }
    res.status(200).json({ success: true, content: response.results });
  } catch (error) {
    console.error("Error in searchPerson controller: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}
export async function searchMovie(req, res) {}
export async function searchTv(req, res) {}
