import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const customIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
}

export function MapSelectionDialog({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  onConfirm,
}: MapSelectionDialogProps) {
  const defaultLat = 24.7136;
  const defaultLng = 46.6753;

  const [selectedLat, setSelectedLat] = useState<number | null>(
    initialLat && !isNaN(initialLat) ? initialLat : null
  );
  const [selectedLng, setSelectedLng] = useState<number | null>(
    initialLng && !isNaN(initialLng) ? initialLng : null
  );

  useEffect(() => {
    if (open) {
      setSelectedLat(initialLat && !isNaN(initialLat) ? initialLat : null);
      setSelectedLng(initialLng && !isNaN(initialLng) ? initialLng : null);
    }
  }, [open, initialLat, initialLng]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
  };

  const handleConfirm = () => {
    if (selectedLat !== null && selectedLng !== null) {
      onConfirm(selectedLat, selectedLng);
      onOpenChange(false);
    }
  };

  const centerLat = selectedLat ?? initialLat ?? defaultLat;
  const centerLng = selectedLng ?? initialLng ?? defaultLng;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select asset coordinates</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Select the correct location on the map to assign coordinates. When you select a point on the map, latitude and longitude will update automatically.
        </p>
        <div className="relative h-[350px] rounded-md overflow-hidden border">
          {open && (
            <MapContainer
              center={[centerLat, centerLng]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              key={`${centerLat}-${centerLng}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />
              {selectedLat !== null && selectedLng !== null && (
                <Marker position={[selectedLat, selectedLng]} icon={customIcon} />
              )}
            </MapContainer>
          )}
          {selectedLat !== null && selectedLng !== null && (
            <Card className="absolute top-3 left-3 z-[1000] shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Selected location</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedLat.toFixed(15)},<br />
                      {selectedLng.toFixed(15)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedLat === null || selectedLng === null}
          >
            Confirm choice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
