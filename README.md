# Avalogica Weather MCP

**Version:** 0.1.0  
**Author:** Marshall D. Willman  
**License:** MIT  

⚠️ **Note:** This is a **test MCP server** developed for evaluation and integration experiments.  
It may be updated, refactored, or replaced in future versions as Avalogica’s production MCP architecture evolves.

A lightweight [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server providing real-time and forecast weather data for AI applications and agents.

---

## Overview

The **Avalogica Weather MCP** enables clients to query localized weather forecasts by latitude and longitude.  
It integrates easily with the Dedalus SDK, ChatGPT Atlas, or other MCP-compatible clients.

---

## Features

- Provides daily forecast data for up to 7 days.  
- Returns minimum and maximum temperatures, optionally including precipitation and wind.  
- Stateless and authentication-free — ideal for testing or open access integrations.  
- Built on the official [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk).

---

## Installation

```bash
git clone https://github.com/mdwillman/avalogica-weather-mcp.git
cd avalogica-weather-mcp
npm install
npm run build