import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, generateObject, type UIMessage } from "ai";

export default class NLToQueryChatService {
  public async ask(messages: UIMessage[]) {
    await generateObject({
      model: openai("gpt-5"),
      schemaName: "QueryDsl",
      schemaDescription:
        "QueryDSL is a JSON object that represents a query to the database.",
      messages: convertToModelMessages(messages),
      temperature: 0,
      maxRetries: 3,
    });
  }
}
