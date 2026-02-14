declare module 'react-leaflet-drift-marker' {
  import { MarkerProps } from 'react-leaflet';
  import { LatLngExpression } from 'leaflet';
  import { FC } from 'react';

  interface DriftMarkerProps extends MarkerProps {
    duration: number;
    keepAtCenter?: boolean;
    position: LatLngExpression;
    icon?: unknown;
    children?: React.ReactNode; 
  }

  const DriftMarker: FC<DriftMarkerProps>;
  export default DriftMarker;
}
