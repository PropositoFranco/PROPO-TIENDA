import { useState, useEffect } from 'react';
import { ASSET_KEYS } from '../config/assetManifest';
import { PLACEHOLDERS } from '../config/assetManifest';

/**
 * Resolves asset keys to URLs from Supabase.
 * Usage: const { bgUrl, characterUrl, overlayUrl } = useAssetLayer('HUB');
 * Falls back to CSS placeholders when assets are not yet available.
 */
export function useAssetLayer(sectionKey) {
  const [urls, setUrls] = useState({ bgUrl: null, characterUrl: null, overlayUrl: null });

  useEffect(() => {
    const keys = ASSET_KEYS[sectionKey];
    if (!keys) return;

    // In production, this would fetch from Supabase asset_manifest table
    // For now, returns null — components should use CSS fallbacks
    setUrls({
      bgUrl: null,
      characterUrl: keys.character ? null : null,
      overlayUrl: keys.overlay ? null : null,
    });
  }, [sectionKey]);

  return urls;
}

export function useMaestroAsset() {
  // Returns the Maestro character SVG or null
  return PLACEHOLDERS.maestro;
}
