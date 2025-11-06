import yaml from "js-yaml";

export default class PromptBuilder {
  private _lines: string[] = [];

  public section(title: string): this {
    const lines = [`### ${title}`];

    this._lines.push(...lines);
    return this;
  }

  public subSection(title: string): this {
    const lines = [`#### ${title}`];
    this._lines.push(...lines);
    return this;
  }

  public bullet(lines: string[], depth = 1): this {
    if (depth > 1) {
      return this.lines(
        this.indentLines(
          lines.map((line) => `- ${line}`),
          depth
        )
      );
    }

    return this.lines(lines.map((line) => `- ${line}`));
  }

  public lines(lines: string[]): this {
    this._lines.push(...lines);
    return this;
  }

  public yaml(object: any): this {
    const yamlStr = yaml.dump(object);
    this.lines(["```yaml", yamlStr, "```"]);
    return this;
  }

  public json(object: any): this {
    const jsonStr = JSON.stringify(object, null, 2);
    this.lines(["```json", jsonStr, "```"]);
    return this;
  }

  public text(line: string): this {
    this._lines.push(line);
    return this;
  }

  public newLine(): this {
    this._lines.push("");
    return this;
  }

  public indentLine(line: string, level = 1): string {
    const pad = "  ".repeat(level);
    return `${pad}${line}`;
  }

  public indentLines(lines: string[], level = 1): string[] {
    return lines.map((line) => this.indentLine(line, level));
  }

  public build(): string {
    return this._lines.join("\n").trim();
  }
}
