"""Configuration loader for Google Ads credentials."""

import os
from pathlib import Path

import yaml


def load_google_ads_config() -> dict:
  """Load Google Ads API credentials from YAML config file.

  Checks for config in this order:
  1. GOOGLE_ADS_CREDENTIALS env var (path to yaml)
  2. google-ads.yaml in the MCP server directory
  3. ~/google-ads.yaml

  Returns:
    Dictionary with Google Ads API credentials.

  Raises:
    FileNotFoundError: If no config file is found.
  """
  config_paths = [
      os.environ.get("GOOGLE_ADS_CREDENTIALS", ""),
      str(Path(__file__).parent.parent / "google-ads.yaml"),
      str(Path.home() / "google-ads.yaml"),
  ]

  for config_path in config_paths:
    if config_path and Path(config_path).exists():
      with open(config_path) as f:
        return yaml.safe_load(f)

  raise FileNotFoundError(
      "No google-ads.yaml found. Copy google-ads.yaml.example to "
      "google-ads.yaml and fill in your credentials."
  )


def get_google_ads_client():
  """Create and return a Google Ads API client."""
  from google.ads.googleads.client import GoogleAdsClient

  config = load_google_ads_config()
  return GoogleAdsClient.load_from_dict(config)
