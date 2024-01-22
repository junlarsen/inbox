import fs from "node:fs/promises";
import toml from "toml";
import xmlbuilder from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces.js";

type Action =
  | string
  | {
      query: string;
      "skip-the-inbox"?: boolean;
      "mark-as-read"?: boolean;
      "star-it"?: boolean;
      "apply-category"?: string;
    };

type Entry = {
  query: Action;
  label: string;
};

const isActionQuery = (action: Action): action is Exclude<Action, string> => {
  return typeof action === "object";
};

async function process(entry: Entry, b: XMLBuilder) {
  const query =
    typeof entry.query === "string" ? entry.query : entry.query.query;
  let builder = b
    .ele("entry")
    .ele("category")
    .att("term", "filter")
    .up()
    .ele("title")
    .txt("Mail filter")
    .up();

  if (isActionQuery(entry.query)) {
    builder = builder
      .ele("apps:property")
      .att("name", "hasTheWord")
      .att("value", entry.query.query)
      .up();

    if (entry.query["skip-the-inbox"]) {
      builder = builder
        .ele("apps:property")
        .att("name", "shouldArchive")
        .att("value", "true")
        .up();
    }

    if (entry.query["mark-as-read"]) {
      builder = builder
        .ele("apps:property")
        .att("name", "shouldMarkAsRead")
        .att("value", "true")
        .up();
    }

    if (entry.query["apply-category"]) {
      builder = builder
        .ele("apps:property")
        .att("name", "smartLabelToApply")
        .att("value", entry.query["apply-category"] as string)
        .up();
    }

    if (entry.query["star-it"]) {
      builder = builder
        .ele("apps:property")
        .att("name", "shouldStar")
        .att("value", "true")
        .up();
    }
  } else {
    builder = builder
      .ele("apps:property")
      .att("name", "hasTheWord")
      .att("value", query)
      .up();
  }

  builder = builder
    .ele("apps:property")
    .att("name", "label")
    .att("value", entry.label)
    .up()
    .up();

  return builder;
}

async function main() {
  const input = await fs.readFile("input.toml", "utf-8");
  const configuration = await toml.parse(input);
  let builder = xmlbuilder.create();

  builder = builder
    .ele("feed")
    .att("xmlns", "http://www.w3.org/2005/Atom")
    .att("xmlns:apps", "http://schemas.google.com/apps/2006")
    .ele("title")
    .txt("Mail filters")
    .up();

  for (const [key, value] of Object.entries(configuration.filters)) {
    for (const [label, query] of Object.entries(
      value as Record<string, Action>,
    )) {
      builder = await process({ query, label: `${key}/${label}` }, builder);
    }
  }

  const xml = builder.end({ prettyPrint: true });
  await fs.writeFile("filters.xml", xml, "utf-8");
}

await main();
