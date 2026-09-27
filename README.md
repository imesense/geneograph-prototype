# GeneoGraph Prototype

This is a static site. Open `src/index.html` directly or serve `src/` as static
files; no build step is required. The current root-based GitHub Pages
configuration does not publish the application from `src/`.

The HTML contains the application shell and a small runtime configuration block.
Styles, scripts, and sample data live directly in `src/`; images are in
`src/assets/`. Stylesheets and classic deferred scripts are listed in source
order in `src/index.html`;
keep that order when editing them. Leaflet and Quill remain pinned CDN dependencies.

## License

Contents of this repository licensed under terms of the __GNU GPL 3 license__ unless otherwise specified.
See [this](./LICENSE.txt) file for details.
