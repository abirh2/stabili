import React, { useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { STABILI_TILE_ATTRIBUTION, STABILI_TILE_URL } from './leaflet';

interface StabiliMapProps {
  center: LatLngExpression;
  zoom: number;
  ariaLabel: string;
  children?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  scrollWheelZoom?: boolean;
}

interface StabiliMapUnavailableProps {
  title?: string;
  description: string;
  className?: string;
}

const MapState: React.FC<{ title: string; description: string; live?: boolean }> = ({ title, description, live = false }) => (
  <div className="stabili-map-state" role={live ? 'status' : undefined} aria-live={live ? 'polite' : undefined}>
    <span className="stabili-map-state__icon"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export const StabiliMap: React.FC<StabiliMapProps> = ({
  center,
  zoom,
  ariaLabel,
  children,
  header,
  className = '',
  scrollWheelZoom = false,
}) => {
  const [tileState, setTileState] = useState<'loading' | 'ready' | 'error'>('loading');

  return (
    <div className={`stabili-leaflet-frame ${className}`}>
      {header}
      <div className="stabili-map-canvas">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={scrollWheelZoom}
          zoomControl
          className="h-full w-full"
          aria-label={ariaLabel}
        >
          <TileLayer
            attribution={STABILI_TILE_ATTRIBUTION}
            url={STABILI_TILE_URL}
            maxZoom={20}
            eventHandlers={{
              loading: () => setTileState('loading'),
              load: () => setTileState('ready'),
              tileerror: () => setTileState('error'),
            }}
          />
          {children}
        </MapContainer>
        {tileState === 'loading' && (
          <div className="stabili-map-overlay is-loading">
            <span className="stabili-map-spinner" aria-hidden="true" />
            <span role="status">Loading map…</span>
          </div>
        )}
        {tileState === 'error' && (
          <div className="stabili-map-overlay">
            <MapState title="Map tiles unavailable" description="Building locations will return when the map service is available." live />
          </div>
        )}
      </div>
    </div>
  );
};

export const StabiliMapUnavailable: React.FC<StabiliMapUnavailableProps> = ({
  title = 'Map location unavailable',
  description,
  className = '',
}) => (
  <div className={`stabili-leaflet-frame stabili-map-unavailable ${className}`}>
    <MapState title={title} description={description} live />
  </div>
);
