import { NextResponse } from 'next/server';

export async function GET() {
  // This is a test endpoint to show the expected format
  const testResponse = {
    version: "0.0.10",
    notes: "This is a test release with automatic updates enabled",
    pub_date: "2025-01-20T00:00:00Z",
    platforms: {
      "windows-x86_64": {
        signature: "untrusted comment: minisign public key: A4C3D74F92C3280E\nRwQOKMOST9fDpAg6n+4YgB0ieLvK5GiHO2U3xK1td4j0PKhdPzwodc2",
        url: "https://github.com/Samer-Gassouma/Wasla/releases/download/v0.0.10/Wasla_0.0.10_x64_en-US.msi.zip"
      }
    }
  };

  return NextResponse.json(testResponse, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
} 