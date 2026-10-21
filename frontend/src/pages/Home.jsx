import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { getEventBySlug } from "../services/api.js";

import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import PassSelector from "../components/PassSelector.jsx";
import EventInfo from "../components/EventInfo.jsx";
import Footer from "../components/Footer.jsx";

function Home() {
  const navigate = useNavigate();

  const [event, setEvent] =
    useState(null);

  const [passes, setPasses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getEventBySlug(
            "garba-night-2026"
          );

        setEvent(
          response.data.event
        );

        setPasses(
          response.data.passes
        );
      } catch (error) {
        console.error(
          "Event loading error:",
          error
        );

        setError(
          error.message ||
            "Unable to load event"
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, []);

  const handleSelectPass = (pass) => {
    navigate("/checkout", {
      state: {
        event,
        pass,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ecfffd]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />

          <p className="text-sm font-medium text-slate-500">
            Loading the night...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ecfffd] p-6">
        <div className="max-w-md rounded-[2rem] border border-white/70 bg-white/60 p-8 text-center shadow-xl backdrop-blur-2xl">
          <RefreshCw className="mx-auto h-8 w-8 text-teal-600" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Couldn't load the event
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#ecfffd] text-slate-900">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(103,232,249,0.22),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(45,212,191,0.18),transparent_30%),linear-gradient(180deg,#ecfffd_0%,#f5fffe_55%,#ecfffd_100%)]" />

        <div className="relative">
          <Navbar event={event} />

          <Hero event={event} />

          <PassSelector
            passes={passes}
            onSelect={handleSelectPass}
          />

          <EventInfo event={event} />

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Home;