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

  public bullet(lines: string[]): this {
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

  public build(): string {
    return this._lines.join("\n").trim();
  }
}
