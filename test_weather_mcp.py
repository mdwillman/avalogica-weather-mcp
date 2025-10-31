import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from dedalus_labs.utils.streaming import stream_async

# Load environment variables (optional if you later use API keys)
load_dotenv()

async def main():
    # Initialize Dedalus client and runner
    client = AsyncDedalus()
    runner = DedalusRunner(client)

    # Run a request using your deployed weather MCP server
    result = await runner.run(
        input="Get a 3-day weather forecast for New York City (40.7128, -74.0060).",
        model="openai/gpt-5-mini",  # or another model available in your account
        mcp_servers=["mdwillman/avalogica-weather-mcp"],  # your MCP server slug
        stream=False
    )

    print("\n=== Final Output ===")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())