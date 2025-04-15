import { useState, useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Select from "react-select";
import { useToast } from "../hooks/use-toast";
import { Id } from "../../convex/_generated/dataModel";

type Theater = {
  value: Id<"theaters">;
  label: string;
  cinemaId: string;
};

type Movie = {
  value: string;
  label: string;
  film_id: string;
};

export function MovieAlerts() {
  const { toast } = useToast();
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [oneSignalPlayerId, setOneSignalPlayerId] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const getNearbyTheaters = useAction(api.movieglu.getNearbyTheaters);
  const getMovieShowtimes = useAction(api.movieglu.getMovieShowtimes);
  const createAlert = useMutation(api.alerts.createAlert);
  const userAlerts = useQuery(api.alerts.getUserAlerts) || [];
  const deleteAlert = useMutation(api.alerts.deleteAlert);

  // Find theaters by city name
  const handleFindTheaters = async () => {
    if (!city.trim()) {
      toast({
        title: "Error",
        description: "Please enter a city name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Geocode city name to lat/lng using OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
      );
      const data = await response.json();
      console.log("Geocoding response:", data); // Debug log

      if (!data || data.length === 0) {
        toast({
          title: "Error",
          description: "City not found. Please enter a valid city name.",
          variant: "destructive",
        });
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      console.log("Coordinates:", { lat, lng }); // Debug log

      const fetchedTheaters = await getNearbyTheaters({ lat, lng });
      console.log("Fetched theaters:", fetchedTheaters); // Debug log

      setTheaters(fetchedTheaters);
      toast({
        title: "Success",
        description: `Found ${fetchedTheaters.length} theaters near ${city}`,
      });
    } catch (error) {
      console.error("Error fetching theaters:", error); // Debug log
      toast({
        title: "Error",
        description: "Failed to fetch theaters for this city. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch movies when theater is selected
  useEffect(() => {
    if (selectedTheater) {
      const fetchMovies = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const fetchedMovies = await getMovieShowtimes({
            cinemaId: selectedTheater.cinemaId,
            date: today,
          });
          setMovies(fetchedMovies);
        } catch (error) {
          console.error("Error fetching movies:", error); // Debug log
          toast({
            title: "Error",
            description: "Failed to fetch movies",
            variant: "destructive",
          });
        }
      };
      fetchMovies();
    }
  }, [selectedTheater, getMovieShowtimes, toast]);

  const handleCreateAlert = async () => {
    if (!selectedMovie || !selectedTheater || !oneSignalPlayerId) return;

    try {
      await createAlert({
        movieId: selectedMovie.film_id,
        theaterId: selectedTheater.value,
        movieTitle: selectedMovie.label,
        theaterName: selectedTheater.label,
        oneSignalPlayerId,
      });

      toast({
        title: "Success",
        description: "Alert created successfully",
      });

      setSelectedMovie(null);
      setSelectedTheater(null);
    } catch (error) {
      console.error("Error creating alert:", error); // Debug log
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlert = async (alertId: Id<"userAlerts">) => {
    try {
      await deleteAlert({ alertId });
      toast({
        title: "Success",
        description: "Alert deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting alert:", error); // Debug log
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Set Up Movie Alerts</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              City Name
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name (e.g., London)"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <button
              onClick={handleFindTheaters}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Searching..." : "Find Theaters"}
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Theater
            </label>
            <Select
              value={selectedTheater}
              onChange={setSelectedTheater}
              options={theaters}
              placeholder="Choose a theater..."
              className="basic-single"
              classNamePrefix="select"
              isDisabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Movie
            </label>
            <Select
              value={selectedMovie}
              onChange={setSelectedMovie}
              options={movies}
              placeholder="Choose a movie..."
              className="basic-single"
              classNamePrefix="select"
              isDisabled={!selectedTheater}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              OneSignal Player ID
            </label>
            <input
              type="text"
              value={oneSignalPlayerId}
              onChange={(e) => setOneSignalPlayerId(e.target.value)}
              placeholder="Enter your OneSignal Player ID"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <button
            onClick={handleCreateAlert}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedMovie || !selectedTheater || !oneSignalPlayerId}
          >
            Set Up Alert
          </button>
        </div>
      </div>

      {userAlerts.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Your Alerts</h3>
          <div className="space-y-4">
            {userAlerts.map((alert) => (
              <div
                key={alert._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="font-medium">{alert.movieTitle}</p>
                  <p className="text-sm text-gray-600">{alert.theaterName}</p>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
