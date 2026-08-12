import { useState } from "react";
import { MainDashboard } from "./components/dashboard/MainDashboard";
import { BatteryDetail } from "./components/dashboard/BatteryDetail";
import { LocationDashboard } from "./components/dashboard/LocationDashboard";

type View = "main" | "battery" | "location";

export default function App() {
  const [view, setView] = useState<View>("main");
  const [selectedBatteryId, setSelectedBatteryId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  function handleSelectBattery(id: string) {
    setSelectedBatteryId(id);
    setView("battery");
  }

  function handleSelectLocation(id: string) {
    setSelectedLocationId(id);
    setView("location");
  }

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      {view === "main" && (
        <MainDashboard
          onSelectBattery={handleSelectBattery}
          onSelectLocation={handleSelectLocation}
        />
      )}
      {view === "battery" && selectedBatteryId && (
        <BatteryDetail
          batteryId={selectedBatteryId}
          onBack={() => setView("main")}
        />
      )}
      {view === "location" && selectedLocationId && (
        <LocationDashboard
          locationId={selectedLocationId}
          onBack={() => setView("main")}
          onSelectBattery={handleSelectBattery}
        />
      )}
    </div>
  );
}
