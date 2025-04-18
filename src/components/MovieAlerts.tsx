import { useState, useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Select from "react-select";
import { useToast } from "../hooks/use-toast";
import { Id } from "../../convex/_generated/dataModel";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

declare global {
  interface Window {
    myAppOneSignalPlayerId?: string;
  }
}

type Theater = {
  name: string;
  address: string;
  cinemaId: string;
};

type Showtime = {
  times: { start_time: string }[];
};

type Movie = {
  film_title: string;
  film_id: string;
  showtimes: Showtime[];
};
const renderShowtimes = (showtimes: Showtime[]) => {
  // Flatten all times from all showings (usually just one showing per movie result)
  const allTimes = showtimes.flatMap(showing => showing.times);

  if (allTimes.length === 0) {
    return <p className="text-sm text-gray-500 px-3 py-2">No showtimes listed for this date.</p>;
  }

  return (
    <ul className="list-none p-0 m-0 flex flex-wrap gap-2"> {/* Use flex-wrap for tags */}
      {allTimes.map((time, index) => (
        <li
          key={index}
          className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full" // Tag-like appearance
        >
          {time.start_time} {/* Display the formatted time */}
        </li>
      ))}
    </ul>
  );
};

export function MovieAlerts() {
  const { toast } = useToast();
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [Theaters, setTheaters] = useState<Theater[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [oneSignalPlayerId, setOneSignalPlayerId] = useState<string | null>(null);
  const [city, setCity] = useState<string>("");
  const [isLoadingTheaters, setIsLoadingTheaters] = useState(false);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);

  const getNearbyTheaters = useAction(api.movieglu.getNearbyTheaters);
  const getMovieShowtimes = useAction(api.movieglu.getMovieShowtimes);
  const createAlert = useMutation(api.alerts.createAlert);
  const userAlerts = useQuery(api.alerts.getUserAlerts) || [];
  const deleteAlert = useMutation(api.alerts.deleteAlert);

  // Fetch OneSignal Player ID automatically
  useEffect(() => {
    const checkPlayerId = () => {
      if (window.myAppOneSignalPlayerId) {
        setOneSignalPlayerId(window.myAppOneSignalPlayerId);
        console.log("OneSignal Player ID set:", window.myAppOneSignalPlayerId);
      } else {
        console.log("OneSignal Player ID not found, retrying...");
        setTimeout(checkPlayerId, 1000);
      }
    };
    checkPlayerId();
  }, []);

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

    setIsLoadingTheaters(true);
    setTheaters([]);
    setSelectedTheater(null);
    setMovies([]);
    setSelectedMovie(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
      );
      if (!response.ok) throw new Error(`Geocoding failed: ${response.statusText}`);
      const data = await response.json();
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
      const fetchedTheaters = await getNearbyTheaters({ lat, lng });

      if (Array.isArray(fetchedTheaters)) {
        setTheaters(fetchedTheaters);
        toast({
          title: "Success",
          description: `Found ${fetchedTheaters.length} theaters near ${city}`,
        });
      } else {
        console.error("getNearbyTheaters returned invalid data:", fetchedTheaters);
        toast({
          title: "Error",
          description: "Invalid theater data received.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching theaters:", error);
      toast({
        title: "Error",
        description: `Failed to fetch theaters: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingTheaters(false);
    }
  };

  // Fetch movies when theater or date changes
  useEffect(() => {
    console.log("Before fetching: cinemaId =", selectedTheater?.cinemaId, "selectedDate =", selectedDate);
    if (selectedTheater?.cinemaId && selectedDate) {
      const fetchMovies = async () => {
        setIsLoadingMovies(true);
        setMovies([]);
        setSelectedMovie(null);
        try {
          const formattedDate = selectedDate.toISOString().split('T')[0];
          const fetchedMovies = await getMovieShowtimes({
            cinemaId: selectedTheater.cinemaId,
            date: formattedDate,
          });

          console.log("After fetching: fetchedMovies =", fetchedMovies);

          if (Array.isArray(fetchedMovies)) {
            setMovies(fetchedMovies);
          } else {
            console.error("getMovieShowtimes returned invalid data:", fetchedMovies);
            toast({
              title: "Error",
              description: "Invalid movie data received.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching movies:", error);
          toast({
            title: "Error",
            description: `Failed to fetch movies: ${error instanceof Error ? error.message : "Unknown error"}`,
            variant: "destructive",
          });
        } finally {
          setIsLoadingMovies(false);
        }
      };
      fetchMovies();
    }
  }, [selectedTheater, selectedDate, getMovieShowtimes, toast]);

  // Create alert
  const handleCreateAlert = async () => {
    if (!oneSignalPlayerId) {
      toast({
        title: "Error",
        description: "Notification setup incomplete. Please ensure notifications are enabled.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedMovie || !selectedTheater) {
      toast({
        title: "Error",
        description: "Please select a theater and movie.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingAlert(true);
    try {
      await createAlert({
        movieId: selectedMovie.film_id,
        cinemaId: selectedTheater.cinemaId, // Changed from theaterId to match crons.ts
        movieTitle: selectedMovie.film_title,
        cinemaName: selectedTheater.name,
        oneSignalPlayerId,
      });
      toast({
        title: "Success",
        description: "Alert created successfully!",
      });
      setSelectedMovie(null);
      setSelectedTheater(null);
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({
        title: "Error",
        description: `Failed to create alert: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  // Delete alert
  const handleDeleteAlert = async (alertId: Id<"userAlerts">) => {
    try {
      await deleteAlert({ alertId });
      toast({
        title: "Success",
        description: "Alert deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast({
        title: "Error",
        description: `Failed to delete alert: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  // Format showtimes for display

  return (
    <div className="max-w-2xl mx-auto p-4 transition-all duration-300 ease-in-out">
      <div className="bg-white shadow-xl rounded-xl p-8 mb-8 hover:shadow-2xl transition-shadow duration-300">
        <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Check Movie Show Availability</h2>
        <div className="space-y-6">
          <div className="space-y-2 group">
            <label htmlFor="city-input" className="block text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
              City Name
            </label>
            <input
              id="city-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name (e.g., London)"
              className="w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300"
              aria-describedby="city-help"
            />
            <p id="city-help" className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Enter a city to find nearby theaters.</p>
          </div>
          <div className="space-y-2 group">
            <label htmlFor="date-picker" className="block text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
              Select Date
            </label>
            <DatePicker
              id="date-picker"
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              minDate={new Date()}
              dateFormat="yyyy-MM-dd"
              className="w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300"
              placeholderText="Select a date"
              aria-describedby="date-help"
            />
            <p id="date-help" className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Choose a date to view showtimes.</p>
          </div>
          <div>
            <button
              onClick={handleFindTheaters}
              disabled={isLoadingTheaters || !city.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium shadow-md"
            >
              {isLoadingTheaters ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : "Find Theaters"}
            </button>
          </div>
          <div className="space-y-2 group">
            <label htmlFor="theater-select" className="block text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
              Select Theater
            </label>
            <Select<Theater>
              inputId="theater-select"
              value={selectedTheater}
              onChange={(theater) => {
                console.log("Theater selected:", theater);
                setSelectedTheater(theater);
              }}
              options={Theaters}
              getOptionLabel={(theater: Theater) =>
                `${theater.name} (${theater.address})`
              }
              getOptionValue={(theater: Theater) => theater.cinemaId}
              placeholder={isLoadingTheaters ? "Loading theaters..." : "Choose a theater..."}
              className="basic-single"
              classNamePrefix="select"
              isLoading={isLoadingTheaters}
              isDisabled={isLoadingTheaters || Theaters.length === 0}
              noOptionsMessage={() =>
                isLoadingTheaters ? "Loading..." : city ? "No theaters found" : "Enter a city first"
              }
              aria-label="Select Theater"
              styles={{
                control: (base) => ({
                  ...base,
                  padding: '4px',
                  borderRadius: '0.5rem',
                  borderWidth: '2px',
                  '&:hover': {
                    borderColor: '#93C5FD'
                  }
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#2563EB' : state.isFocused ? '#BFDBFE' : 'white',
                  color: state.isSelected ? 'white' : '#1F2937',
                  ':active': {
                    backgroundColor: '#2563EB',
                    color: 'white'
                  }
                })
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="movie-select" className="block text-sm font-medium text-gray-700">
              Select Movie
            </label>
            <Select
              inputId="movie-select"
              value={selectedMovie}
              onChange={setSelectedMovie}
              options={movies}
              getOptionLabel={(movie: Movie) => movie.film_title}
              getOptionValue={(movie: Movie) => movie.film_id}
              placeholder={isLoadingMovies ? "Loading movies..." : "Choose a movie..."}
              className="basic-single"
              classNamePrefix="select"
              isLoading={isLoadingMovies}
              isDisabled={!selectedTheater || isLoadingMovies || movies.length === 0}
              noOptionsMessage={() =>
                isLoadingMovies ? "Loading..." : selectedTheater ? "No movies available" : "Select a theater first"
              }
            />
          </div>
            {selectedMovie && (
            <>
              {selectedMovie.showtimes.length > 0 ? (
                <div className="space-y-2 animate-fadeIn">
                  <label className="block text-sm font-semibold text-gray-700">Available Showtimes</label>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-inner">
                    {renderShowtimes(selectedMovie.showtimes)}
                  </div>
                </div>
              ) : selectedMovie ? (
                <button
                  onClick={handleCreateAlert}
                  disabled={!selectedMovie || !selectedTheater || !oneSignalPlayerId || isSubmittingAlert}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium shadow-md"
                >
                  {isSubmittingAlert ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Alert...
                    </span>
                  ) : "Set Up Alert"}
                </button>
              ) : null}
            </>
          )}

          {!oneSignalPlayerId && (
            <p className="text-sm text-yellow-600 mt-2 text-center">
              Waiting for notification permission...
            </p>
          )}
        </div>
      </div>
      {userAlerts.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Your Alerts</h3>
          <div className="space-y-4">
            {userAlerts.map((alert) => (
              <div
                key={alert._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-200"
              >
                <div>
                  <p className="font-medium text-gray-800">{alert.movieTitle}</p>
                  <p className="text-sm text-gray-600">{alert.cinemaName}</p>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert._id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                  aria-label={`Delete alert for ${alert.movieTitle}`}
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