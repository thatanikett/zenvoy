import { useState, useEffect, useCallback } from "react";
import { sendSOS } from "../api";

// ── CONFIG ────────────────────────────────────────────
// For demo: hardcode user name and contact number here
// In production these would come from a settings screen
const SOS_USER_NAME = "Zenvoy User";
const SOS_CONTACT_NUMBER = "+917607938730"; // teammate's number

export default function SOSButton() {
  const [state, setState] = useState("idle");
  const [location, setLocation] = useState(null);
  const [countdown, setCountdown] = useState(3);

  const handleSend = useCallback(async () => {
    setState("sending");
    const lat = location?.lat ?? 28.6139;
    const lng = location?.lng ?? 77.209;
    try {
      await sendSOS(lat, lng, SOS_USER_NAME, SOS_CONTACT_NUMBER);
      setState("sent");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }, [location]);

  // Keep location fresh
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    if (state !== "confirm") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((v) => {
        if (v <= 1) {
          clearInterval(interval);
          handleSend();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state, handleSend]);

  useEffect(() => {
    if (state !== "sent") return;
    const t = setTimeout(() => setState("idle"), 4000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "24px",
        right: "20px",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {/* Confirm overlay */}
      {state === "confirm" && (
        <div
          style={{
            pointerEvents: "all",
            background: "var(--bg-surface)",
            border: "1px solid rgba(255,68,68,0.4)",
            borderRadius: "var(--radius-lg)",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "220px",
            animation: "fadeUp 0.2s ease",
            boxShadow: "0 8px 40px rgba(255,68,68,0.2)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--accent-danger)",
              letterSpacing: "0.1em",
            }}
          >
            SENDING IN {countdown}s...
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Alert + live location will be sent to your emergency contact.
          </div>
          <button
            onClick={() => setState("idle")}
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-bright)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "6px",
              cursor: "pointer",
              letterSpacing: "0.08em",
            }}
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Sent confirmation */}
      {state === "sent" && (
        <div
          style={{
            pointerEvents: "none",
            background: "rgba(0,229,160,0.1)",
            border: "1px solid rgba(0,229,160,0.3)",
            borderRadius: "var(--radius-lg)",
            padding: "10px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--accent-safe)",
            letterSpacing: "0.08em",
            animation: "fadeUp 0.2s ease",
          }}
        >
          ✓ ALERT DISPATCHED
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div
          style={{
            pointerEvents: "none",
            background: "rgba(255,68,68,0.1)",
            border: "1px solid rgba(255,68,68,0.3)",
            borderRadius: "var(--radius-lg)",
            padding: "10px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--accent-danger)",
            letterSpacing: "0.08em",
            animation: "fadeUp 0.2s ease",
          }}
        >
          ✗ SEND FAILED — RETRY
        </div>
      )}

      {/* SOS Button */}
      <div style={{ pointerEvents: "all", position: "relative" }}>
        {/* Pulse rings — only when idle */}
        {state === "idle" && (
          <>
            <div style={pulseRingStyle(1)} />
            <div style={pulseRingStyle(1.5)} />
          </>
        )}

        <button
          onClick={() => state === "idle" && setState("confirm")}
          disabled={state === "sending" || state === "sent"}
          style={{
            position: "relative",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background:
              state === "sent"
                ? "var(--accent-safe)"
                : state === "sending"
                  ? "var(--accent-warn)"
                  : "var(--accent-danger)",
            border: "3px solid rgba(255,255,255,0.2)",
            cursor: state === "idle" ? "pointer" : "default",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
            boxShadow:
              state === "idle"
                ? "0 0 0 0 rgba(255,68,68,0.4), 0 4px 20px rgba(255,68,68,0.5)"
                : "none",
            transition: "background 0.3s, transform 0.1s",
            transform: state === "confirm" ? "scale(1.05)" : "scale(1)",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          aria-label="SOS Emergency Alert"
        >
          {state === "sending" ? (
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "white",
                  letterSpacing: "0.05em",
                  lineHeight: 1,
                }}
              >
                SOS
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "8px",
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.1em",
                }}
              >
                HELP
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function pulseRingStyle(delay) {
  return {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "2px solid rgba(255,68,68,0.5)",
    animation: `pulse-ring 2s ease-out ${delay}s infinite`,
    pointerEvents: "none",
  };
}
