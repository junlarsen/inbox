import fs from "node:fs/promises";
import toml from "toml";
import xmlbuilder from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces.js";

type Entry = {
  query: string;
  label: string;
};

async function process(entry: Entry, builder: XMLBuilder) {
  return builder
    .ele("entry")
    .ele("category")
    .att("term", "filter")
    .up()

    .ele("title")
    .txt("Mail filter")
    .up()

    .ele("apps:property")
    .att("name", "hasTheWord")
    .att("value", entry.query)
    .up()

    .ele("apps:property")
    .att("name", "label")
    .att("value", entry.label)
    .up()
    .up();
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
    for (const [label, query] of Object.entries(value as any)) {
      builder = await process(
        { query: query as any, label: `${key}/${label}` },
        builder,
      );
    }
  }

  const xml = builder.end({ prettyPrint: true });
  await fs.writeFile("filters.xml", xml, "utf-8");
}

await main();
