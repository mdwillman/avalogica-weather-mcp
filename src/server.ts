import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { getForecastTool } from "./tools/index.js";
import { GetForecastArgs } from "./types.js";

/**
 * Main server class for Avalogica Weather MCP integration
 * @class WeatherServer
 */
export class WeatherServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'avalogica-weather',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
        this.setupErrorHandling();
    }

    /**
 * Registers all MCP tool handlers for the Avalogica Weather MCP server.
 * @private
 */
    private setupHandlers(): void {
        // ---- List Available Tools ----
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [getForecastTool.definition],
        }));

        // ---- Handle Tool Calls ----
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            // Route tool calls by name
            switch (name) {
                case "get_forecast": {
                    // Validate argument structure
                    if (
                        !args ||
                        typeof args !== "object" ||
                        typeof (args as any).latitude !== "number" ||
                        typeof (args as any).longitude !== "number"
                    ) {
                        throw new McpError(
                            ErrorCode.InvalidParams,
                            "Invalid or missing arguments for get_forecast. Expected { latitude: number, longitude: number, days?: number }."
                        );
                    }

                    // Safe, typed call to the forecast handler
                    return await getForecastTool.handler(args as unknown as GetForecastArgs);
                }

                default:
                    // Unknown tool requested
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Unknown tool: ${name}`
                    );
            }
        });
    }

    /**
     * Configures error handling and graceful shutdown
     * @private
     */
    private setupErrorHandling(): void {
        this.server.onerror = (error) => console.error('[MCP Error]', error);

        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    /**
     * Returns the underlying MCP server instance
     * @returns {Server} MCP server instance
     */
    getServer(): Server {
        return this.server;
    }
}

/**
 * Factory function for creating standalone Avalogica Weather MCP server instances.
 * Used by HTTP transport for session-based connections.
 * @returns {Server} Configured MCP server instance
 */
export function createStandaloneServer(): Server {
    const server = new Server(
        {
            name: 'avalogica-weather-discovery',
            version: '0.1.0',
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    // ---- List available tools ----
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [getForecastTool.definition],
    }));

    // ---- Handle tool calls ----
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        switch (name) {
            case "get_forecast": {
                // Validate arguments before invoking tool
                if (
                    !args ||
                    typeof args !== "object" ||
                    typeof (args as any).latitude !== "number" ||
                    typeof (args as any).longitude !== "number"
                ) {
                    throw new McpError(
                        ErrorCode.InvalidParams,
                        "Invalid or missing arguments for get_forecast. Expected { latitude: number, longitude: number, days?: number }."
                    );
                }

                return await getForecastTool.handler(args as unknown as GetForecastArgs);
            }

            default:
                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown tool: ${name}`
                );
        }
    });

    return server;
}