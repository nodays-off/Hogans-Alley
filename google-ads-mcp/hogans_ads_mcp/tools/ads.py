"""Ad and ad group management tools for Google Ads."""

from typing import Optional

from google.ads.googleads.errors import GoogleAdsException

from hogans_ads_mcp.config import get_google_ads_client


def get_tools():
  """Return list of ad management tool functions."""
  return [
      create_ad_group,
      create_responsive_search_ad,
      list_ads,
      update_ad_status,
  ]


async def create_ad_group(
    customer_id: str,
    campaign_id: str,
    name: str,
    cpc_bid_dollars: float = 2.00,
) -> str:
  """Create an ad group within a campaign.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: Campaign ID to create the ad group in.
    name: Ad group name.
    cpc_bid_dollars: Default CPC bid in dollars.

  Returns:
    Created ad group details.
  """
  client = get_google_ads_client()
  ad_group_service = client.get_service("AdGroupService")
  campaign_service = client.get_service("CampaignService")

  operation = client.get_type("AdGroupOperation")
  ad_group = operation.create
  ad_group.name = name
  ad_group.campaign = campaign_service.campaign_path(
      customer_id, campaign_id
  )
  ad_group.status = client.enums.AdGroupStatusEnum.ENABLED
  ad_group.type_ = client.enums.AdGroupTypeEnum.SEARCH_STANDARD
  ad_group.cpc_bid_micros = int(cpc_bid_dollars * 1_000_000)

  try:
    response = ad_group_service.mutate_ad_groups(
        customer_id=customer_id, operations=[operation]
    )
    resource_name = response.results[0].resource_name

    return (
        f"Ad group created successfully!\n"
        f"  Name: {name}\n"
        f"  Resource: {resource_name}\n"
        f"  CPC Bid: ${cpc_bid_dollars:.2f}\n"
        f"  Status: ENABLED"
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


async def create_responsive_search_ad(
    customer_id: str,
    ad_group_id: str,
    headlines: str,
    descriptions: str,
    final_url: str = "https://hogans.netlify.app/shop.html",
    path1: Optional[str] = None,
    path2: Optional[str] = None,
) -> str:
  """Create a responsive search ad.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    ad_group_id: Ad group ID to create the ad in.
    headlines: Pipe-separated headlines (min 3, max 15, each max 30 chars).
        Example: "Premium Rain Parkas|Vancouver-Made|Recycled Materials"
    descriptions: Pipe-separated descriptions (min 2, max 4, each max 90
        chars).
    final_url: Landing page URL.
    path1: Optional display URL path 1 (max 15 chars).
    path2: Optional display URL path 2 (max 15 chars).

  Returns:
    Created ad details.
  """
  client = get_google_ads_client()
  ad_group_ad_service = client.get_service("AdGroupAdService")

  operation = client.get_type("AdGroupAdOperation")
  ad_group_ad = operation.create
  ad_group_ad.ad_group = client.get_service(
      "AdGroupService"
  ).ad_group_path(customer_id, ad_group_id)
  ad_group_ad.status = client.enums.AdGroupAdStatusEnum.ENABLED

  ad = ad_group_ad.ad
  ad.final_urls.append(final_url)

  # Add headlines
  headline_list = [h.strip() for h in headlines.split("|")]
  for headline_text in headline_list:
    headline = client.get_type("AdTextAsset")
    headline.text = headline_text
    ad.responsive_search_ad.headlines.append(headline)

  # Add descriptions
  description_list = [d.strip() for d in descriptions.split("|")]
  for desc_text in description_list:
    description = client.get_type("AdTextAsset")
    description.text = desc_text
    ad.responsive_search_ad.descriptions.append(description)

  if path1:
    ad.responsive_search_ad.path1 = path1
  if path2:
    ad.responsive_search_ad.path2 = path2

  try:
    response = ad_group_ad_service.mutate_ad_group_ads(
        customer_id=customer_id, operations=[operation]
    )
    resource_name = response.results[0].resource_name

    return (
        f"Responsive search ad created!\n"
        f"  Resource: {resource_name}\n"
        f"  Headlines ({len(headline_list)}):\n"
        + "\n".join(f"    - {h}" for h in headline_list)
        + f"\n  Descriptions ({len(description_list)}):\n"
        + "\n".join(f"    - {d}" for d in description_list)
        + f"\n  URL: {final_url}"
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


async def list_ads(
    customer_id: str,
    campaign_id: str,
    status_filter: Optional[str] = None,
) -> str:
  """List all ads in a campaign.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: Campaign ID to list ads for.
    status_filter: Optional - ENABLED, PAUSED, or REMOVED.

  Returns:
    List of ads with their status and type.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  query = f"""
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.type,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.status,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros
    FROM ad_group_ad
    WHERE campaign.id = {campaign_id}
  """

  if status_filter:
    query += f" AND ad_group_ad.status = '{status_filter}'"

  query += " ORDER BY metrics.impressions DESC"

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    results = []
    for row in response:
      ad = row.ad_group_ad
      m = row.metrics
      cost = m.cost_micros / 1_000_000

      headlines = [
          h.text for h in ad.ad.responsive_search_ad.headlines
      ]
      headline_preview = " | ".join(headlines[:3]) if headlines else "N/A"

      results.append(
          f"Ad ID: {ad.ad.id} ({ad.status.name})\n"
          f"  Ad Group: {row.ad_group.name}\n"
          f"  Type: {ad.ad.type_.name}\n"
          f"  Headlines: {headline_preview}\n"
          f"  Impressions: {m.impressions:,} | Clicks: {m.clicks:,} "
          f"| CTR: {m.ctr:.2%} | Cost: ${cost:.2f}"
      )

    if not results:
      return f"No ads found for campaign {campaign_id}."
    return f"Ads in Campaign {campaign_id}:\n\n" + "\n\n".join(results)

  except GoogleAdsException as ex:
    return _format_error(ex)


async def update_ad_status(
    customer_id: str,
    ad_group_id: str,
    ad_id: str,
    new_status: str,
) -> str:
  """Update an ad's status.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    ad_group_id: Ad group ID containing the ad.
    ad_id: The ad ID to update.
    new_status: ENABLED, PAUSED, or REMOVED.

  Returns:
    Confirmation of the status change.
  """
  client = get_google_ads_client()
  ad_group_ad_service = client.get_service("AdGroupAdService")

  operation = client.get_type("AdGroupAdOperation")
  ad_group_ad = operation.update
  ad_group_ad.resource_name = ad_group_ad_service.ad_group_ad_path(
      customer_id, ad_group_id, ad_id
  )

  status_enum = client.enums.AdGroupAdStatusEnum
  status_map = {
      "ENABLED": status_enum.ENABLED,
      "PAUSED": status_enum.PAUSED,
      "REMOVED": status_enum.REMOVED,
  }

  new_status_upper = new_status.upper()
  if new_status_upper not in status_map:
    return f"Invalid status: {new_status}. Use ENABLED, PAUSED, or REMOVED."

  ad_group_ad.status = status_map[new_status_upper]

  field_mask = client.get_type("FieldMask")
  field_mask.paths.append("status")
  operation.update_mask.CopyFrom(field_mask)

  try:
    ad_group_ad_service.mutate_ad_group_ads(
        customer_id=customer_id, operations=[operation]
    )
    return f"Ad {ad_id} status updated to {new_status_upper}."

  except GoogleAdsException as ex:
    return _format_error(ex)


def _format_error(ex: GoogleAdsException) -> str:
  messages = []
  for error in ex.failure.errors:
    messages.append(f"Error: {error.message}")
  return "Google Ads API Error:\n" + "\n".join(messages)
