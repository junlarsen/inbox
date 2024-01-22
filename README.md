# Inbox

A tool for mass-generating Gmail inbox filters from a concise TOML file.

## Usage

Clone the repository, and install the dependencies. After this you will be able to write an `input.toml` file in which
you can store your filters.

```
git clone https://github.com/junlarsen/inbox && cd inbox
pnpm install

# Write your filters in input.toml, see example below

# And generate the filters.xml file
pnpm dev
```

### Example input.toml

```toml
[filters.social]
"Facebook" = "from:(facebookmail.com OR facebook.com)"
# You can also skip the inbox, star it, mark it as read, or give it a Gmail category.
"GitHub" = { query = "from:notifications@github.com", "mark-as-read" = true, "star-it" = true, "skip-the-inbox" = true, "category" = "^smartlabel_updates" }
```

You should now have an output file named `filters.xml` which you can directly import into Gmail. Please see
[Google's documentation](https://support.google.com/mail/answer/6579?hl=en) for more information on how to import 
the generated filters.

This is a small thing I hacked together in a matter of a few hours, so please don't hesitate to open an issue if you
want any help or have any questions. There is also zero validation on the input file at the moment.

## License

MIT
