"""OAuth2 authentication setup for Google Ads API.

Run this script to generate a refresh token for your Google Ads API
credentials. You only need to do this once.

Usage:
  python -m hogans_ads_mcp.auth

Prerequisites:
  1. Create a Google Cloud project at https://console.cloud.google.com/
  2. Enable the Google Ads API
  3. Create OAuth 2.0 credentials (Desktop application type)
  4. Download the client_secret JSON file
"""

import json
import sys
from pathlib import Path

import yaml
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/adwords"]
CONFIG_PATH = Path(__file__).parent.parent / "google-ads.yaml"


def main():
  print("=" * 60)
  print("Google Ads API - OAuth2 Setup")
  print("Hogan's Alley Campaign Manager")
  print("=" * 60)
  print()

  # Check for existing config
  if CONFIG_PATH.exists():
    with open(CONFIG_PATH) as f:
      existing = yaml.safe_load(f)
    if existing.get("refresh_token") and not existing["refresh_token"].startswith("<"):
      print(f"Config already exists at {CONFIG_PATH}")
      print(f"Refresh token is already set.")
      response = input("Re-generate refresh token? (y/N): ")
      if response.lower() != "y":
        print("Aborted.")
        return

  # Get client credentials
  print("You need your OAuth2 client credentials.")
  print("Option 1: Provide the path to your client_secret JSON file")
  print("Option 2: Enter client_id and client_secret manually")
  print()

  choice = input("Enter path to client_secret JSON (or press Enter to type manually): ").strip()

  if choice and Path(choice).exists():
    flow = InstalledAppFlow.from_client_secrets_file(choice, scopes=SCOPES)
  else:
    client_id = input("Client ID: ").strip()
    client_secret = input("Client Secret: ").strip()

    if not client_id or not client_secret:
      print("Error: Client ID and Client Secret are required.")
      sys.exit(1)

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }
    flow = InstalledAppFlow.from_client_config(client_config, scopes=SCOPES)

  print()
  print("A browser window will open for authentication.")
  print("Sign in with the Google account that has Google Ads access.")
  print()

  credentials = flow.run_local_server(port=0)

  # Get developer token
  print()
  developer_token = input(
      "Developer token (from Google Ads > Tools > API Center): "
  ).strip()

  login_customer_id = input(
      "Manager account ID (optional, without dashes): "
  ).strip()

  # Write config
  config = {
      "client_id": credentials.client_id,
      "client_secret": credentials.client_secret,
      "refresh_token": credentials.refresh_token,
      "developer_token": developer_token or "<YOUR_DEVELOPER_TOKEN>",
  }

  if login_customer_id:
    config["login_customer_id"] = login_customer_id

  with open(CONFIG_PATH, "w") as f:
    yaml.dump(config, f, default_flow_style=False)

  print()
  print(f"Credentials saved to {CONFIG_PATH}")
  print()
  print("Next steps:")
  print("  1. Make sure your developer token is approved")
  print("  2. Start the MCP server: python -m hogans_ads_mcp.server")
  print()


if __name__ == "__main__":
  main()
