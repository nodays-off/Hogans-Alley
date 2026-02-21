"""Keyword management tools for Google Ads."""

from typing import Optional

from google.ads.googleads.errors import GoogleAdsException

from hogans_ads_mcp.config import get_google_ads_client


def get_tools():
  """Return list of keyword management tool functions."""
  return [
      list_keywords,
      add_keywords,
      add_negative_keywords,
      get_keyword_performance,
  ]


async def list_keywords(
    customer_id: str,
    ad_group_id: str,
    status_filter: Optional[str] = None,
) -> str:
  """List keywords in an ad group.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    ad_group_id: Ad group ID to list keywords for.
    status_filter: Optional - ENABLED, PAUSED, or REMOVED.

  Returns:
    List of keywords with match type and status.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  query = f"""
    SELECT
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.effective_cpc_bid_micros
    FROM ad_group_criterion
    WHERE ad_group.id = {ad_group_id}
      AND ad_group_criterion.type = 'KEYWORD'
  """

  if status_filter:
    query += f" AND ad_group_criterion.status = '{status_filter}'"

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    results = []
    for row in response:
      kw = row.ad_group_criterion
      bid = kw.effective_cpc_bid_micros / 1_000_000

      results.append(
          f"[{kw.keyword.match_type.name}] {kw.keyword.text}\n"
          f"  ID: {kw.criterion_id} | Status: {kw.status.name} "
          f"| CPC Bid: ${bid:.2f}"
      )

    if not results:
      return f"No keywords found in ad group {ad_group_id}."
    return (
        f"Keywords in Ad Group {ad_group_id}:\n\n" + "\n\n".join(results)
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


async def add_keywords(
    customer_id: str,
    ad_group_id: str,
    keywords: str,
    match_type: str = "PHRASE",
    cpc_bid_dollars: Optional[float] = None,
) -> str:
  """Add keywords to an ad group.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    ad_group_id: Ad group ID to add keywords to.
    keywords: Comma-separated list of keywords to add.
    match_type: EXACT, PHRASE, or BROAD.
    cpc_bid_dollars: Optional CPC bid in dollars.

  Returns:
    Confirmation of added keywords.
  """
  client = get_google_ads_client()
  ad_group_criterion_service = client.get_service(
      "AdGroupCriterionService"
  )

  match_enum = client.enums.KeywordMatchTypeEnum
  match_map = {
      "EXACT": match_enum.EXACT,
      "PHRASE": match_enum.PHRASE,
      "BROAD": match_enum.BROAD,
  }

  match_type_upper = match_type.upper()
  if match_type_upper not in match_map:
    return f"Invalid match type: {match_type}. Use EXACT, PHRASE, or BROAD."

  operations = []
  keyword_list = [kw.strip() for kw in keywords.split(",")]

  for keyword_text in keyword_list:
    operation = client.get_type("AdGroupCriterionOperation")
    criterion = operation.create
    criterion.ad_group = client.get_service(
        "AdGroupService"
    ).ad_group_path(customer_id, ad_group_id)
    criterion.keyword.text = keyword_text
    criterion.keyword.match_type = match_map[match_type_upper]
    criterion.status = client.enums.AdGroupCriterionStatusEnum.ENABLED

    if cpc_bid_dollars:
      criterion.cpc_bid_micros = int(cpc_bid_dollars * 1_000_000)

    operations.append(operation)

  try:
    response = ad_group_criterion_service.mutate_ad_group_criteria(
        customer_id=customer_id, operations=operations
    )

    added = len(response.results)
    return (
        f"Added {added} keyword(s) to ad group {ad_group_id}:\n"
        + "\n".join(f"  [{match_type_upper}] {kw}" for kw in keyword_list)
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


async def add_negative_keywords(
    customer_id: str,
    campaign_id: str,
    keywords: str,
) -> str:
  """Add negative keywords to a campaign to prevent wasted spend.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: Campaign ID to add negative keywords to.
    keywords: Comma-separated list of negative keywords.

  Returns:
    Confirmation of added negative keywords.
  """
  client = get_google_ads_client()
  campaign_criterion_service = client.get_service(
      "CampaignCriterionService"
  )

  operations = []
  keyword_list = [kw.strip() for kw in keywords.split(",")]

  for keyword_text in keyword_list:
    operation = client.get_type("CampaignCriterionOperation")
    criterion = operation.create
    criterion.campaign = client.get_service(
        "CampaignService"
    ).campaign_path(customer_id, campaign_id)
    criterion.negative = True
    criterion.keyword.text = keyword_text
    criterion.keyword.match_type = (
        client.enums.KeywordMatchTypeEnum.BROAD
    )
    operations.append(operation)

  try:
    response = campaign_criterion_service.mutate_campaign_criteria(
        customer_id=customer_id, operations=operations
    )

    added = len(response.results)
    return (
        f"Added {added} negative keyword(s) to campaign {campaign_id}:\n"
        + "\n".join(f"  - {kw}" for kw in keyword_list)
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


async def get_keyword_performance(
    customer_id: str,
    campaign_id: str,
    date_range: str = "LAST_30_DAYS",
) -> str:
  """Get keyword-level performance metrics.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: Campaign ID to get keyword performance for.
    date_range: LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, or LAST_MONTH.

  Returns:
    Keyword performance breakdown sorted by cost.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  query = f"""
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      ad_group_criterion.quality_info.quality_score
    FROM keyword_view
    WHERE campaign.id = {campaign_id}
      AND segments.date DURING {date_range}
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  """

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    results = []
    for row in response:
      kw = row.ad_group_criterion
      m = row.metrics
      cost = m.cost_micros / 1_000_000
      avg_cpc = m.average_cpc / 1_000_000
      qs = kw.quality_info.quality_score or "N/A"

      results.append(
          f"[{kw.keyword.match_type.name}] {kw.keyword.text} "
          f"(Ad Group: {row.ad_group.name})\n"
          f"  Impressions: {m.impressions:,} | Clicks: {m.clicks:,} "
          f"| CTR: {m.ctr:.2%}\n"
          f"  Cost: ${cost:.2f} | Avg CPC: ${avg_cpc:.2f} "
          f"| Conversions: {m.conversions:.1f}\n"
          f"  Quality Score: {qs}"
      )

    if not results:
      return f"No keyword data found for campaign {campaign_id}."
    return (
        f"Keyword Performance ({date_range}):\n\n" + "\n\n".join(results)
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


def _format_error(ex: GoogleAdsException) -> str:
  messages = []
  for error in ex.failure.errors:
    messages.append(f"Error: {error.message}")
  return "Google Ads API Error:\n" + "\n".join(messages)
