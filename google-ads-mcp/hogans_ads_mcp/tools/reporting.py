"""Performance reporting tools for Google Ads."""

from typing import Optional

from google.ads.googleads.errors import GoogleAdsException

from hogans_ads_mcp.config import get_google_ads_client


def get_tools():
  """Return list of reporting tool functions."""
  return [
      get_campaign_performance,
      get_ad_group_performance,
      get_search_terms_report,
      get_geo_performance,
  ]


async def get_campaign_performance(
    customer_id: str,
    date_range: str = "LAST_30_DAYS",
    campaign_id: Optional[str] = None,
) -> str:
  """Get campaign performance metrics.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    date_range: Date range - LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH,
        LAST_MONTH, or custom range as YYYY-MM-DD,YYYY-MM-DD.
    campaign_id: Optional specific campaign ID to report on.

  Returns:
    Formatted performance report with key metrics.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  query = """
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  """

  if campaign_id:
    query += f" AND campaign.id = {campaign_id}"

  if "," in date_range:
    start, end = date_range.split(",")
    query += (
        f" AND segments.date >= '{start.strip()}'"
        f" AND segments.date <= '{end.strip()}'"
    )
  else:
    query += f" AND segments.date DURING {date_range}"

  query += " ORDER BY metrics.cost_micros DESC"

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    results = []
    total_cost = 0
    total_clicks = 0
    total_impressions = 0
    total_conversions = 0

    for row in response:
      c = row.campaign
      m = row.metrics
      cost = m.cost_micros / 1_000_000
      avg_cpc = m.average_cpc / 1_000_000
      cpc_conv = m.cost_per_conversion / 1_000_000 if m.conversions else 0

      total_cost += cost
      total_clicks += m.clicks
      total_impressions += m.impressions
      total_conversions += m.conversions

      roas = (
          m.conversions_value / cost if cost > 0 else 0
      )

      results.append(
          f"{c.name} ({c.status.name})\n"
          f"  Impressions: {m.impressions:,} | Clicks: {m.clicks:,} "
          f"| CTR: {m.ctr:.2%}\n"
          f"  Cost: ${cost:.2f} | Avg CPC: ${avg_cpc:.2f}\n"
          f"  Conversions: {m.conversions:.1f} "
          f"| CPA: ${cpc_conv:.2f} | ROAS: {roas:.2f}x"
      )

    if not results:
      return f"No campaign data found for {date_range}."

    overall_ctr = (
        total_clicks / total_impressions if total_impressions else 0
    )

    summary = (
        f"=== Performance Report ({date_range}) ===\n"
        f"Total Spend: ${total_cost:.2f} | "
        f"Clicks: {total_clicks:,} | "
        f"CTR: {overall_ctr:.2%} | "
        f"Conversions: {total_conversions:.1f}\n"
        f"{'=' * 50}\n\n"
    )

    return summary + "\n\n".join(results)

  except GoogleAdsException as ex:
    return _format_error(ex)


async def get_ad_group_performance(
    customer_id: str,
    campaign_id: str,
    date_range: str = "LAST_30_DAYS",
) -> str:
  """Get ad group level performance within a campaign.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: Campaign ID to get ad group performance for.
    date_range: LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, or LAST_MONTH.

  Returns:
    Ad group performance breakdown.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  query = f"""
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group
    WHERE campaign.id = {campaign_id}
      AND ad_group.status != 'REMOVED'
      AND segments.date DURING {date_range}
    ORDER BY metrics.cost_micros DESC
  """

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    results = []
    for row in response:
      ag = row.ad_group
      m = row.metrics
      cost = m.cost_micros / 1_000_000
      avg_cpc = m.average_cpc / 1_000_000

      results.append(
          f"{ag.name} (ID: {ag.id}, {ag.status.name})\n"
          f"  Impressions: {m.impressions:,} | Clicks: {m.clicks:,} "
          f"| CTR: {m.ctr:.2%}\n"
          f"  Cost: ${cost:.2f} | Avg CPC: ${avg_cpc:.2f} "
          f"| Conversions: {m.conversions:.1f}"
      )

    if not results:
      return f"No ad groups found for campaign {campaign_id}."
    return (
        f"Ad Groups for Campaign {campaign_id} ({date_range}):\n\n"
        + "\n\n".join(results)
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


async def get_search_terms_report(
    customer_id: str,
    campaign_id: str,
    date_range: str = "LAST_30_DAYS",
    min_impressions: int = 10,
) -> str:
  """Get search terms report to identify what people are actually searching.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: Campaign ID to pull search terms for.
    date_range: LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, or LAST_MONTH.
    min_impressions: Minimum impressions threshold to include.

  Returns:
    Search terms with performance metrics, useful for negative keyword
    identification.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  query = f"""
    SELECT
      search_term_view.search_term,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions
    FROM search_term_view
    WHERE campaign.id = {campaign_id}
      AND segments.date DURING {date_range}
      AND metrics.impressions >= {min_impressions}
    ORDER BY metrics.impressions DESC
    LIMIT 50
  """

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    results = []
    for row in response:
      m = row.metrics
      cost = m.cost_micros / 1_000_000
      term = row.search_term_view.search_term

      results.append(
          f'"{term}"\n'
          f"  Impressions: {m.impressions:,} | Clicks: {m.clicks:,} "
          f"| CTR: {m.ctr:.2%}\n"
          f"  Cost: ${cost:.2f} | Conversions: {m.conversions:.1f}"
      )

    if not results:
      return f"No search terms found for campaign {campaign_id}."
    return (
        f"Search Terms Report ({date_range}):\n\n" + "\n\n".join(results)
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


async def get_geo_performance(
    customer_id: str,
    campaign_id: str,
    date_range: str = "LAST_30_DAYS",
) -> str:
  """Get geographic performance breakdown.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: Campaign ID to get geo performance for.
    date_range: LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, or LAST_MONTH.

  Returns:
    Performance breakdown by geographic location.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  query = f"""
    SELECT
      geographic_view.country_criterion_id,
      geographic_view.location_type,
      campaign_criterion.location.geo_target_constant,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions
    FROM geographic_view
    WHERE campaign.id = {campaign_id}
      AND segments.date DURING {date_range}
    ORDER BY metrics.impressions DESC
    LIMIT 20
  """

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    results = []
    for row in response:
      m = row.metrics
      cost = m.cost_micros / 1_000_000
      geo = row.geographic_view

      results.append(
          f"Location ID: {geo.country_criterion_id} "
          f"({geo.location_type.name})\n"
          f"  Impressions: {m.impressions:,} | Clicks: {m.clicks:,} "
          f"| CTR: {m.ctr:.2%}\n"
          f"  Cost: ${cost:.2f} | Conversions: {m.conversions:.1f}"
      )

    if not results:
      return f"No geo data found for campaign {campaign_id}."
    return (
        f"Geographic Performance ({date_range}):\n\n" + "\n\n".join(results)
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


def _format_error(ex: GoogleAdsException) -> str:
  messages = []
  for error in ex.failure.errors:
    messages.append(f"Error: {error.message}")
  return "Google Ads API Error:\n" + "\n".join(messages)
