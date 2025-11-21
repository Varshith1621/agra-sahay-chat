import { useState } from "react";
import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MapPin, Store, Cloud, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapChatInterface } from "./MapChatInterface";

const GOOGLE_MAPS_API_KEY = "AIzaSyDVb4t2_a7x62PYX8AF-vWYsUt1Au2K4Ls";

interface MarketLocation {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  crops: string;
  price: string;
}

interface FarmLocation {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  area: string;
}

// Sample agricultural markets (mandis) in India
const sampleMarkets: MarketLocation[] = [
  {
    id: "1",
    name: "Azadpur Mandi",
    position: { lat: 28.7041, lng: 77.1025 },
    crops: "Vegetables, Fruits",
    price: "₹20-50/kg",
  },
  {
    id: "2",
    name: "Pune Market Yard",
    position: { lat: 18.5204, lng: 73.8567 },
    crops: "Tomatoes, Onions",
    price: "₹15-35/kg",
  },
  {
    id: "3",
    name: "Chennai Koyambedu Market",
    position: { lat: 13.0827, lng: 80.2707 },
    crops: "Rice, Vegetables",
    price: "₹25-60/kg",
  },
];

const MapView = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketLocation | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<FarmLocation | null>(null);
  const [farmLocations, setFarmLocations] = useState<FarmLocation[]>([]);
  const [center, setCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // Center of India

  const handleMapClick = (e: any) => {
    if (e.detail && e.detail.latLng) {
      const newFarm: FarmLocation = {
        id: Date.now().toString(),
        name: `Field ${farmLocations.length + 1}`,
        position: { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng },
        area: "To be measured",
      };
      setFarmLocations([...farmLocations, newFarm]);
    }
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        <Card className="lg:col-span-2 p-4">
          <Tabs defaultValue="markets" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="markets" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Markets
              </TabsTrigger>
              <TabsTrigger value="farms" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                My Farms
              </TabsTrigger>
              <TabsTrigger value="weather" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Weather
              </TabsTrigger>
            </TabsList>

          <TabsContent value="markets" className="flex-1 mt-0">
            <Map
              defaultCenter={center}
              defaultZoom={5}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {sampleMarkets.map((market) => (
                <Marker
                  key={market.id}
                  position={market.position}
                  onClick={() => setSelectedMarket(market)}
                />
              ))}
              {selectedMarket && (
                <InfoWindow
                  position={selectedMarket.position}
                  onCloseClick={() => setSelectedMarket(null)}
                >
                  <div className="p-2">
                    <h3 className="font-semibold">{selectedMarket.name}</h3>
                    <p className="text-sm">Crops: {selectedMarket.crops}</p>
                    <p className="text-sm">Price: {selectedMarket.price}</p>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </TabsContent>

          <TabsContent value="farms" className="flex-1 mt-0">
            <div className="mb-2 text-sm text-muted-foreground">
              Click on the map to mark your farm locations
            </div>
            <Map
              defaultCenter={center}
              defaultZoom={5}
              gestureHandling="greedy"
              onClick={handleMapClick}
            >
              {farmLocations.map((farm) => (
                <Marker
                  key={farm.id}
                  position={farm.position}
                  onClick={() => setSelectedFarm(farm)}
                />
              ))}
              {selectedFarm && (
                <InfoWindow
                  position={selectedFarm.position}
                  onCloseClick={() => setSelectedFarm(null)}
                >
                  <div className="p-2">
                    <h3 className="font-semibold">{selectedFarm.name}</h3>
                    <p className="text-sm">Area: {selectedFarm.area}</p>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="mt-2"
                      onClick={() => {
                        setFarmLocations(farmLocations.filter(f => f.id !== selectedFarm.id));
                        setSelectedFarm(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </TabsContent>

          <TabsContent value="weather" className="flex-1 mt-0">
            <div className="mb-2 text-sm text-muted-foreground">
              Weather and rainfall visualization
            </div>
            <Map
              defaultCenter={center}
              defaultZoom={5}
              gestureHandling="greedy"
              mapTypeId="terrain"
            >
              {/* Weather layer will be added here */}
            </Map>
          </TabsContent>
        </Tabs>
      </Card>
      
      <div className="lg:col-span-1">
        <MapChatInterface />
      </div>
    </div>
    </APIProvider>
  );
};

export default MapView;
