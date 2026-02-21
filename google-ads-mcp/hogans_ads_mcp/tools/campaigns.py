"""Campaign management tools for Google Ads."""

from typing import Optional

from google.ads.googleads.errors import GoogleAdsException

from hogans_ads_mcp.config import get_google_ads_client


def get_tools():
  """Return list of campaign management tool functions."""
  return [
      list_campaigns,
      get_campaign,
      create_campaign,
      update_campaign_status,
      update_campaign_budget,
  ]


async def list_campaigns(
    customer_id: str,
    status_filter: Optional[str] = None,
) -> str:
  """List all campaigns for the given customer account.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    status_filter: Optional filter - ENABLED, PAUSED, or REMOVED.

  Returns:
    Formatted list of campaigns with ID, name, status, and budget.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  query = """
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      campaign.start_date,
      campaign.end_date
    FROM campaign
  """

  if status_filter:
    query += f" WHERE campaign.status = '{status_filter}'"

  query += " ORDER BY campaign.name"

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    results = []
    for row in response:
      campaign = row.campaign
      budget_amount = row.campaign_budget.amount_micros / 1_000_000
      results.append(
          f"ID: {campaign.id}\n"
          f"  Name: {campaign.name}\n"
          f"  Status: {campaign.status.name}\n"
          f"  Channel: {campaign.advertising_channel_type.name}\n"
          f"  Daily Budget: ${budget_amount:.2f}\n"
          f"  Start: {campaign.start_date}\n"
          f"  End: {campaign.end_date}"
      )

    if not results:
      return "No campaigns found."
    return f"Found {len(results)} campaign(s):\n\n" + "\n\n".join(results)

  except GoogleAdsException as ex:
    return _format_error(ex)


async def get_campaign(customer_id: str, campaign_id: str) -> str:
  """Get detailed information about a specific campaign.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: The campaign ID to retrieve.

  Returns:
    Detailed campaign information.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  query = f"""
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.bidding_strategy_type,
      campaign_budget.amount_micros,
      campaign_budget.delivery_method,
      campaign.start_date,
      campaign.end_date,
      campaign.target_spend.target_spend_micros,
      campaign.geo_target_type_setting.positive_geo_target_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE campaign.id = {campaign_id}
  """

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    for row in response:
      c = row.campaign
      m = row.metrics
      budget = row.campaign_budget.amount_micros / 1_000_000
      cost = m.cost_micros / 1_000_000
      avg_cpc = m.average_cpc / 1_000_000

      return (
          f"Campaign: {c.name} (ID: {c.id})\n"
          f"Status: {c.status.name}\n"
          f"Channel: {c.advertising_channel_type.name}\n"
          f"Bidding: {c.bidding_strategy_type.name}\n"
          f"Daily Budget: ${budget:.2f}\n"
          f"Start: {c.start_date} | End: {c.end_date}\n\n"
          f"Performance:\n"
          f"  Impressions: {m.impressions:,}\n"
          f"  Clicks: {m.clicks:,}\n"
          f"  CTR: {m.ctr:.2%}\n"
          f"  Avg CPC: ${avg_cpc:.2f}\n"
          f"  Cost: ${cost:.2f}\n"
          f"  Conversions: {m.conversions:.1f}"
      )

    return f"Campaign {campaign_id} not found."

  except GoogleAdsException as ex:
    return _format_error(ex)


async def create_campaign(
    customer_id: str,
    name: str,
    daily_budget_dollars: float,
    channel_type: str = "SEARCH",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> str:
  """Create a new Google Ads campaign.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    name: Campaign name.
    daily_budget_dollars: Daily budget in dollars.
    channel_type: SEARCH, DISPLAY, or DISCOVERY.
    start_date: Start date in YYYY-MM-DD format.
    end_date: End date in YYYY-MM-DD format.

  Returns:
    Created campaign details with resource name.
  """
  client = get_google_ads_client()

  # Create budget
  budget_service = client.get_service("CampaignBudgetService")
  budget_operation = client.get_type("CampaignBudgetOperation")
  budget = budget_operation.create
  budget.name = f"{name} Budget"
  budget.amount_micros = int(daily_budget_dollars * 1_000_000)
  budget.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD

  try:
    budget_response = budget_service.mutate_campaign_budgets(
        customer_id=customer_id, operations=[budget_operation]
    )
    budget_resource = budget_response.results[0].resource_name
  except GoogleAdsException as ex:
    return _format_error(ex)

  # Create campaign
  campaign_service = client.get_service("CampaignService")
  campaign_operation = client.get_type("CampaignOperation")
  campaign = campaign_operation.create
  campaign.name = name
  campaign.campaign_budget = budget_resource
  campaign.status = client.enums.CampaignStatusEnum.PAUSED

  channel_enum = client.enums.AdvertisingChannelTypeEnum
  channel_map = {
      "SEARCH": channel_enum.SEARCH,
      "DISPLAY": channel_enum.DISPLAY,
      "DISCOVERY": channel_enum.DISCOVERY,
  }
  campaign.advertising_channel_type = channel_map.get(
      channel_type.upper(), channel_enum.SEARCH
  )

  # Use Target Spend (Maximize Clicks) bidding
  campaign.target_spend.target_spend_micros = 0

  if start_date:
    campaign.start_date = start_date.replace("-", "")
  if end_date:
    campaign.end_date = end_date.replace("-", "")

  try:
    response = campaign_service.mutate_campaigns(
        customer_id=customer_id, operations=[campaign_operation]
    )
    resource_name = response.results[0].resource_name

    return (
        f"Campaign created successfully!\n"
        f"  Name: {name}\n"
        f"  Resource: {resource_name}\n"
        f"  Channel: {channel_type}\n"
        f"  Daily Budget: ${daily_budget_dollars:.2f}\n"
        f"  Status: PAUSED (enable when ready)\n"
        f"  Start: {start_date or 'Not set'}\n"
        f"  End: {end_date or 'Not set'}"
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


async def update_campaign_status(
    customer_id: str,
    campaign_id: str,
    new_status: str,
) -> str:
  """Update a campaign's status (enable, pause, or remove).

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: The campaign ID to update.
    new_status: ENABLED, PAUSED, or REMOVED.

  Returns:
    Confirmation of the status change.
  """
  client = get_google_ads_client()
  campaign_service = client.get_service("CampaignService")
  campaign_operation = client.get_type("CampaignOperation")

  campaign = campaign_operation.update
  campaign.resource_name = campaign_service.campaign_path(
      customer_id, campaign_id
  )

  status_enum = client.enums.CampaignStatusEnum
  status_map = {
      "ENABLED": status_enum.ENABLED,
      "PAUSED": status_enum.PAUSED,
      "REMOVED": status_enum.REMOVED,
  }

  new_status_upper = new_status.upper()
  if new_status_upper not in status_map:
    return f"Invalid status: {new_status}. Use ENABLED, PAUSED, or REMOVED."

  campaign.status = status_map[new_status_upper]

  field_mask = client.get_type("FieldMask")
  field_mask.paths.append("status")
  campaign_operation.update_mask.CopyFrom(field_mask)

  try:
    campaign_service.mutate_campaigns(
        customer_id=customer_id, operations=[campaign_operation]
    )
    return f"Campaign {campaign_id} status updated to {new_status_upper}."

  except GoogleAdsException as ex:
    return _format_error(ex)


async def update_campaign_budget(
    customer_id: str,
    campaign_id: str,
    new_daily_budget_dollars: float,
) -> str:
  """Update a campaign's daily budget.

  Args:
    customer_id: Google Ads customer ID (without dashes).
    campaign_id: The campaign ID whose budget to update.
    new_daily_budget_dollars: New daily budget in dollars.

  Returns:
    Confirmation of the budget change.
  """
  client = get_google_ads_client()
  ga_service = client.get_service("GoogleAdsService")

  # First, get the budget resource name
  query = f"""
    SELECT campaign.campaign_budget
    FROM campaign
    WHERE campaign.id = {campaign_id}
  """

  try:
    response = ga_service.search(customer_id=customer_id, query=query)
    budget_resource = None
    for row in response:
      budget_resource = row.campaign.campaign_budget
      break

    if not budget_resource:
      return f"Campaign {campaign_id} not found."

    # Update the budget
    budget_service = client.get_service("CampaignBudgetService")
    budget_operation = client.get_type("CampaignBudgetOperation")
    budget = budget_operation.update
    budget.resource_name = budget_resource
    budget.amount_micros = int(new_daily_budget_dollars * 1_000_000)

    field_mask = client.get_type("FieldMask")
    field_mask.paths.append("amount_micros")
    budget_operation.update_mask.CopyFrom(field_mask)

    budget_service.mutate_campaign_budgets(
        customer_id=customer_id, operations=[budget_operation]
    )

    return (
        f"Campaign {campaign_id} daily budget updated "
        f"to ${new_daily_budget_dollars:.2f}."
    )

  except GoogleAdsException as ex:
    return _format_error(ex)


def _format_error(ex: GoogleAdsException) -> str:
  """Format a Google Ads API error into a readable string."""
  messages = []
  for error in ex.failure.errors:
    messages.append(f"Error: {error.message}")
  return "Google Ads API Error:\n" + "\n".join(messages)
