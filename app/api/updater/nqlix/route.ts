import { NextRequest, NextResponse } from 'next/server';

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  content_type: string;
}

interface GitHubRelease {
  tag_name: string;
  body: string;
  published_at: string;
  assets: GitHubAsset[];
}

interface TauriUpdaterResponse {
  version: string;
  notes: string;
  pub_date: string;
  platforms: {
    [key: string]: {
      signature: string;
      url: string;
     };
  };
}

export async function GET(request: NextRequest) {
  try {
    // Fetch the latest release from GitHub
    const response = await fetch(
      'https://api.github.com/repos/Samer-Gassouma/Wasla/releases/latest',
      {
        headers: {
          'User-Agent': 'Wasla-Updater-Service',
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch GitHub release' },
        { status: 500 }
      );
    }

    const release: GitHubRelease = await response.json();

    // Parse version (remove 'v' prefix if present)
    const version = release.tag_name.startsWith('v')
      ? release.tag_name.substring(1)
      : release.tag_name;

    // Find the MSI and NSIS installers
    const msiAsset = release.assets.find(asset =>
      asset.name.endsWith('.msi') && asset.name.includes('x64')
    );

    const nsisAsset = release.assets.find(asset =>
      asset.name.endsWith('.exe') && asset.name.includes('x64')
    );

    // Find the updater files (signatures)
    const msiSignature = release.assets.find(asset =>
      asset.name.endsWith('.msi.zip.sig')
    );

    const nsisSignature = release.assets.find(asset =>
      asset.name.endsWith('.nsis.zip.sig')
    );

    // Build the Tauri updater response
    const updaterResponse: TauriUpdaterResponse = {
      version: version,
      notes: release.body || `Release ${release.tag_name}`,
      pub_date: release.published_at,
      platforms: {}
    };

    // Add Windows x64 platform if MSI is available
    if (msiAsset && msiSignature) {
      try {
        // Fetch the actual signature content from the .sig file
        const sigResponse = await fetch(msiSignature.browser_download_url);
        if (sigResponse.ok) {
          const signatureContent = await sigResponse.text();

          updaterResponse.platforms['windows-x86_64'] = {
            signature: signatureContent,
            url: msiAsset.browser_download_url
          };
        }
      } catch (error) {
        console.error('Failed to fetch MSI signature:', error);
      }
    }

    // Add Windows x64 platform if NSIS is available (prefer MSI if both exist)
    if (nsisAsset && nsisSignature && !updaterResponse.platforms['windows-x86_64']) {
      try {
        // Fetch the actual signature content from the .sig file
        const sigResponse = await fetch(nsisSignature.browser_download_url);
        if (sigResponse.ok) {
          const signatureContent = await sigResponse.text();

          updaterResponse.platforms['windows-x86_64'] = {
            signature: signatureContent,
            url: nsisAsset.browser_download_url
          };
        }
      } catch (error) {
        console.error('Failed to fetch NSIS signature:', error);
      }
    }

    // Check if we have any platforms configured
    if (Object.keys(updaterResponse.platforms).length === 0) {
      return NextResponse.json(
        {
          error: 'No valid updater files found in release',
          details: 'This release is missing the required .zip.sig signature files that Tauri needs for automatic updates.',
          availableAssets: release.assets.map(asset => asset.name),
          suggestion: 'Ensure the Tauri build has updater enabled and signing keys configured properly.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(updaterResponse, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Updater service error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 