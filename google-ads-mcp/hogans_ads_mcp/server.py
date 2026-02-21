"""Hogan's Alley Google Ads MCP Server.

MCP server for managing Google Ads campaigns for Hogan's Alley rain jackets.
Provides tools for campaign management, reporting, and budget optimization.
"""

import logging
import sys

from dotenv import load_dotenv
from fastmcp import FastMCP

from hogans_ads_mcp.tools import campaigns, reporting, keywords, ads

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mcp_server = FastMCP(
    name="Hogan's Alley Google Ads",
    instructions=(
        "You are a Google Ads campaign manager for Hogan's Alley, "
        "a premium rain jacket company based in Vancouver, BC. "
        "Use the available tools to manage campaigns, monitor performance, "
        "and optimize ad spend. The primary markets are Vancouver, Seattle, "
        "and Portland. Products are premium rain parkas at $395 CAD."
    ),
)

# Mount tool modules
for tool_module in [campaigns, reporting, keywords, ads]:
  for tool in tool_module.get_tools():
    mcp_server.add_tool(tool)


def main():
  load_dotenv()
  logger.info("Starting Hogan's Alley Google Ads MCP Server")
  mcp_server.run(transport="stdio")


if __name__ == "__main__":
  main()
