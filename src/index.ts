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

const buildElement = (
  b: XMLBuilder,
  tag: string,
  attributes: [att: string, val: string][],
  txt?: string,
) => {
  let builder = b.ele(tag);
  for (const [att, val] of attributes) {
    builder = builder.att(att, val);
  }
  if (txt) {
    builder = builder.txt(txt);
  }
  return builder.up();
};

async function process(entry: Entry, b: XMLBuilder) {
  const query =
    typeof entry.query === "string" ? entry.query : entry.query.query;
  let builder = b.ele("entry");
  builder = buildElement(builder, "category", [["term", "filter"]]);
  builder = buildElement(builder, "title", [], "Mail filter");

  if (isActionQuery(entry.query)) {
    builder = buildElement(builder, "apps:property", [
      ["name", "hasTheWord"],
      ["value", entry.query.query],
    ]);

    if (entry.query["skip-the-inbox"]) {
      builder = buildElement(builder, "apps:property", [
        ["name", "shouldArchive"],
        ["value", "true"],
      ]);
    }

    if (entry.query["mark-as-read"]) {
      builder = buildElement(builder, "apps:property", [
        ["name", "shouldMarkAsRead"],
        ["value", "true"],
      ]);
    }

    if (entry.query["apply-category"]) {
      builder = buildElement(builder, "apps:property", [
        ["name", "smartLabelToApply"],
        ["value", entry.query["apply-category"] as string],
      ]);
    }

    if (entry.query["star-it"]) {
      builder = buildElement(builder, "apps:property", [
        ["name", "shouldStar"],
        ["value", "true"],
      ]);
    }
  } else {
    builder = buildElement(builder, "apps:property", [
      ["name", "hasTheWord"],
      ["value", query],
    ]);
  }
  return buildElement(builder, "apps:property", [
    ["name", "label"],
    ["value", entry.label],
  ]).up();
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
