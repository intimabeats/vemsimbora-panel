// src/components/InteractiveMap.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  ScaleControl,
} from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, X } from 'lucide-react'
// No Mapboxgl import needed here

interface Mission {
  id: string
  title: string
  description: string
  address: string
  reward: number
  latitude: number
  longitude: number
  category: 'food' | 'culture' | 'entertainment' | 'nature'
  difficulty: 'easy' | 'medium' | 'hard'
}

const CustomMarker: React.FC<{
  mission: Mission;
  onClick: () => void;
}> = ({ mission, onClick }) => {
  const getCategoryColor = (category: Mission['category']) => {
    const colors = {
      food: 'bg-orange-500',
      culture: 'bg-purple-500',
      entertainment: 'bg-blue-500',
      nature: 'bg-green-500',
    };
    return colors[category];
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transform transition-transform hover:scale-110"
    >
      <div className={`relative ${getCategoryColor(mission.category)}`}>
        <MapPin className="text-white w-8 h-8" strokeWidth={2.5} />
        <div
          className={`absolute -inset-2 ${getCategoryColor(
            mission.category
          )} opacity-30 rounded-full animate-ping`}
        />
      </div>
    </div>
  );
};

export const InteractiveMap: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [viewState, setViewState] = useState({
    latitude: -10.9171,  // Aracaju coordinates
    longitude: -37.0718,
    zoom: 13 // Adjusted zoom for Aracaju
  })
  const [mapLoaded, setMapLoaded] = useState(false); // Track map loading state
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<Map>(null); //  Ref for the Map component

  // Simulated missions data (Aracaju)
  useEffect(() => {
    const mockMissions: Mission[] = [
      {
        id: '1',
        title: 'Orla de Atalaia',
        description: 'Fotografe os principais pontos turísticos da Orla de Atalaia.',
        address: 'Orla de Atalaia, Aracaju',
        reward: 150,
        latitude: -10.9822,
        longitude: -37.0433,
        category: 'nature',
        difficulty: 'easy'
      },
      {
        id: '2',
        title: 'Mercado Municipal',
        description: 'Registre a culinária e o artesanato local no Mercado.',
        address: 'Mercado Municipal Antônio Franco, Aracaju',
        reward: 200,
        latitude: -10.9115,
        longitude: -37.0728,
        category: 'culture',
        difficulty: 'medium'
      },
      {
        id: '3',
        title: 'Oceanário de Aracaju',
        description: 'Capture a beleza da vida marinha no Oceanário.',
        address: 'Av. Santos Dumont, 1010 - Atalaia, Aracaju',
        reward: 180,
        latitude: -10.9864,
        longitude: -37.0389,
        category: 'entertainment',
        difficulty: 'medium'
      },
      {
        id: '4',
        title: 'Museu da Gente Sergipana',
        description: 'Documente a cultura e história sergipana no museu.',
        address: 'Av. Ivo do Prado, 398 - Centro, Aracaju',
        reward: 160,
        latitude: -10.9136,
        longitude: -37.0704,
        category: 'culture',
        difficulty: 'easy'
      },
      {
        id: '5',
        title: 'Passarela do Caranguejo',
        description: 'Fotografe a famosa Passarela do Caranguejo e seus arredores.',
        address: 'Passarela do Caranguejo, Aracaju',
        reward: 120,
        latitude: -10.9845,
        longitude: -37.0412,
        category: 'entertainment',
        difficulty: 'easy'
      },
    ];

    // Simulate loading and error
    const timeoutId = setTimeout(() => {
      setMissions(mockMissions)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  const getCategoryColor = (category: Mission['category']) => {
    const colors = {
      food: 'bg-orange-500',
      culture: 'bg-purple-500',
      entertainment: 'bg-blue-500',
      nature: 'bg-green-500',
    };
    return colors[category];
  };

  const getDifficultyLabel = (difficulty: Mission['difficulty']) => {
    const labels = {
      easy: 'Fácil',
      medium: 'Médio',
      hard: 'Difícil',
    };
    return labels[difficulty];
  };

  // Use useCallback for the onLoad handler
  const handleMapLoad = useCallback((event: any) => {
      // event.target is the map instance
      if (event.target) {
          mapRef.current = event.target; // Store the map instance
          setMapLoaded(true); // Set mapLoaded to true when map is loaded
      }
  }, []);


  if (error) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <p className="text-red-500">Erro ao carregar o mapa: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] relative rounded-xl overflow-hidden shadow-lg">
      <Map
        {...viewState}
        onLoad={handleMapLoad} // Use the onLoad event
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef} // Keep the ref for potential direct map access
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation={true}
          showUserHeading={true}
        />
        <ScaleControl />

        {/* Only render markers and popups after the map has loaded */}
        {mapLoaded && missions.map((mission) => (
          <Marker
            key={mission.id}
            latitude={mission.latitude}
            longitude={mission.longitude}
          >
            <CustomMarker
              mission={mission}
              onClick={() => setSelectedMission(mission)}
            />
          </Marker>
        ))}

        {mapLoaded && selectedMission && ( // Also check mapLoaded here
          <Popup
            latitude={selectedMission.latitude}
            longitude={selectedMission.longitude}
            anchor="bottom"
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedMission(null)}
            className="!min-w-[300px] !max-w-[350px]"
          >
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold">{selectedMission.title}</h3>
                <button
                  onClick={() => setSelectedMission(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-gray-600">{selectedMission.description}</p>
              <div className="flex justify-between items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm text-white ${getCategoryColor(
                    selectedMission.category
                  )}`}
                >
                  {selectedMission.category.charAt(0).toUpperCase() +
                    selectedMission.category.slice(1)}
                </span>
                <span className="text-gray-500 text-sm">
                  {getDifficultyLabel(selectedMission.difficulty)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">
                  {selectedMission.address}
                </span>
                <span className="font-bold text-green-600">
                  {selectedMission.reward} 🪙
                </span>
              </div>
              <button
                className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Aceitar Missão
              </button>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-10">
        <h4 className="font-bold mb-2">Categorias</h4>
        <div className="space-y-2">
          {Object.entries({
            food: 'Gastronomia',
            culture: 'Cultura',
            entertainment: 'Entretenimento',
            nature: 'Natureza',
          }).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${getCategoryColor(
                  key as Mission['category']
                )}`}
              />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};