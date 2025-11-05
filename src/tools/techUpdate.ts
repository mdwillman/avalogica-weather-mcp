import {
  CallToolResult,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { OpenAIClient } from "../openaiClient.js";
import {
  TechUpdateArgs,
  TechUpdateCitation,
  TechUpdateResult,
} from "../types.js";

interface TopicDefinition {
  slug: string;
  title: string;
  description: string;
  focus: string;
  keywords: string[];
}

const TOPIC_DEFINITIONS: TopicDefinition[] = [
  {
    slug: "newModels",
    title: "New AI Model Releases",
    description: "Fresh releases of base or fine-tuned AI models and platform capabilities.",
    focus:
      "Highlight launch details, differentiating capabilities, availability, and early adoption signals.",
    keywords: ["newmodels", "modelrelease", "modelreleases", "latestmodels"],
  },
  {
    slug: "aiProductUpdates",
    title: "AI Product & Platform Updates",
    description:
      "Significant product announcements, roadmap changes, or integrations across AI platforms.",
    focus:
      "Summarize new features, integrations, or pricing/rollout notes impacting builders or enterprises.",
    keywords: [
      "aiproductupdates",
      "productupdates",
      "platformupdates",
      "aiproduct",
    ],
  },
  {
    slug: "techResearch",
    title: "AI & Tech Research Highlights",
    description:
      "Notable research publications, benchmarks, and open-source releases in AI and adjacent fields.",
    focus:
      "Call out core findings, performance metrics, and implications for practitioners.",
    keywords: ["techresearch", "airesearch", "researchupdates", "mlresearch"],
  },
  {
    slug: "polEthicsAndSafety",
    title: "Policy, Ethics & Safety",
    description:
      "Developments in AI regulation, governance frameworks, safety tooling, and ethical debates.",
    focus:
      "Summarize regulatory actions, standards proposals, or industry pledges with practical impact.",
    keywords: [
      "polethicsandsafety",
      "polethicsafety",
      "policyethics",
      "polsafety",
      "policyethicsandsafety",
    ],
  },
  {
    slug: "upcomingEvents",
    title: "Upcoming AI & Tech Events",
    description:
      "Major conferences, product showcases, and community gatherings worth tracking.",
    focus:
      "Note dates, headlining announcements, and why the event matters for practitioners.",
    keywords: [
      "upcomingevents",
      "aievents",
      "techevents",
      "events",
    ],
  },
];

const topicIndex = new Map<string, TopicDefinition>();
for (const topic of TOPIC_DEFINITIONS) {
  for (const keyword of topic.keywords) {
    topicIndex.set(keyword, topic);
  }
  topicIndex.set(topic.slug.toLowerCase(), topic);
}

const openAiClient = new OpenAIClient();

function normalizeTopicKey(topic: string): string {
  return topic.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveTopic(topic: string): TopicDefinition | undefined {
  return topicIndex.get(normalizeTopicKey(topic));
}

function buildPrompt(definition: TopicDefinition): string {
  return `You are an AI technology news analyst. Provide a concise, timely update focused on ${
    definition.title
  }.
- Prioritize developments within the last 30 days and emphasize ${definition.focus}.
- Present 3-4 bullet points with the most impactful updates.
- Close with a one-sentence outlook on what to watch next.
- Include inline source markers (e.g., [1]) tied to credible references.
- Assume the audience is technical but busy; keep the total response under 180 words.`;
}

function findFirstText(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = findFirstText(item);
      if (text) {
        return text;
      }
    }
    return undefined;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string" && record.text.trim()) {
      return record.text.trim();
    }
    if (Array.isArray(record.content)) {
      const text = findFirstText(record.content);
      if (text) {
        return text;
      }
    }
    for (const val of Object.values(record)) {
      const text = findFirstText(val);
      if (text) {
        return text;
      }
    }
  }

  return undefined;
}

function extractCitations(input: unknown, fallbackText: string): TechUpdateCitation[] {
  const citations: TechUpdateCitation[] = [];
  const seen = new Set<string>();

  const pushCitation = (label: string, url: string) => {
    if (!url || seen.has(url)) {
      return;
    }
    citations.push({ label: label || url, url });
    seen.add(url);
  };

  const explore = (node: unknown) => {
    if (!node) {
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        explore(item);
      }
      return;
    }

    if (typeof node === "object") {
      const record = node as Record<string, unknown>;

      if (typeof record.url === "string") {
        const label = typeof record.label === "string"
          ? record.label
          : typeof record.title === "string"
          ? record.title
          : typeof record.name === "string"
          ? record.name
          : record.url;
        pushCitation(label, record.url);
      }

      if (Array.isArray(record.citations)) {
        for (const item of record.citations) {
          if (typeof item === "object" && item !== null) {
            const citationRecord = item as Record<string, unknown>;
            if (typeof citationRecord.url === "string") {
              const label = typeof citationRecord.label === "string"
                ? citationRecord.label
                : typeof citationRecord.title === "string"
                ? citationRecord.title
                : citationRecord.url;
              pushCitation(label, citationRecord.url);
            }
          }
        }
      }

      for (const value of Object.values(record)) {
        explore(value);
      }
    }
  };

  explore(input);

  if (citations.length === 0 && fallbackText) {
    const urlRegex = /(https?:\/\/[^\s)]+)(?![^\[]*\])/gi;
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(fallbackText)) !== null) {
      const url = match[1];
      pushCitation(url, url);
    }
  }

  return citations;
}

export const getTechUpdateTool = {
  definition: {
    name: "get_tech_update",
    description:
      "Get a concise, citation-rich update on the latest AI and technology developments for a specific topic.",
    inputSchema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "Topic focus for the update. Supported values: newModels, aiProductUpdates, techResearch, polEthicsAndSafety, upcomingEvents.",
        },
      },
      required: ["topic"],
    },
  },
  handler: async (args: TechUpdateArgs): Promise<CallToolResult> => {
    const topicDefinition = resolveTopic(args.topic);
    if (!topicDefinition) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Unsupported topic for get_tech_update. Choose one of: newModels, aiProductUpdates, techResearch, polEthicsAndSafety, upcomingEvents."
      );
    }

    const prompt = buildPrompt(topicDefinition);

    try {
      const response = await openAiClient.createResponse({
        model: "gpt-4.1-2025-04-14",
        tools: [{ type: "web_search_preview" }],
        input: prompt,
      });

      const text =
        (typeof response.output_text === "string" && response.output_text.trim()) ||
        findFirstText(response.output) ||
        findFirstText(response.data);

      if (!text) {
        throw new Error("OpenAI response did not include any textual content.");
      }

      const createdAt = Number.isFinite(response.created)
        ? new Date(response.created * 1000).toISOString()
        : new Date().toISOString();

      const citations = extractCitations(response.tool_outputs ?? response, text);

      const result: TechUpdateResult = {
        content: text,
        citations,
        model: response.model ?? "gpt-4.1-2025-04-14",
        createdAt,
        topic: topicDefinition.slug,
        title: topicDefinition.title,
        description: topicDefinition.description,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("[AI News MCP] Tech update handler error:", error);

      if (error instanceof McpError) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Unexpected error calling OpenAI Responses API.";

      throw new McpError(ErrorCode.InternalError, message);
    }
  },
};
