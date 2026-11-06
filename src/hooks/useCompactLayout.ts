import { useWindowDimensions } from 'react-native';

/** True on short screens (e.g. iPhone SE), where vertical space is scarce. */
export function useCompactLayout(): boolean {
  const { height } = useWindowDimensions();
  return height < 700;
}
