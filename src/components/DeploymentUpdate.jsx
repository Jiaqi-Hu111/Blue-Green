import { useState, useEffect } from "react";
import { checkDeployment, releaseURL } from "../deployment";
export function DeploymentUpdate({ onBeforeUpdate }) {
  const [newSha, setNewSha] = useState(null),
    [message, setMessage] = useState(""),
    [dismissed, setDismissed] = useState(null);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let alive = true,
      busy = false;
    const controller = new AbortController();
    const check = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const sha = await checkDeployment({ signal: controller.signal });
        if (alive && sha) setNewSha(sha);
      } catch {
        /* Offline, unavailable manifests and invalid responses leave the running game intact. */
      } finally {
        busy = false;
      }
    };
    check();
    const timer = setInterval(check, 60000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      alive = false;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  if (!newSha || dismissed === newSha) return null;
  return (
    <aside className="deployment-update" aria-label="Website update">
      <span role="status">{message || "New version available"}</span>
      <button
        onClick={() => {
          if (!onBeforeUpdate()) {
            setMessage("Progress could not be saved. Update paused.");
            return;
          }
          window.location.replace(
            releaseURL(import.meta.env.BASE_URL, newSha).href,
          );
        }}
      >
        Update
      </button>
      <button className="update-later" onClick={() => setDismissed(newSha)}>
        Later
      </button>
      <p>
        Your recipe and notebook will be preserved. Updating happens only when
        you choose Update.
      </p>
    </aside>
  );
}
