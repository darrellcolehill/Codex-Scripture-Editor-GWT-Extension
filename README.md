# Greek-Words-for-Translators README

**"greek-words-for-translators"** is a Visual Studio Code extension designed specifically for Bible translators using the Codex Scripture Editor extension. This tool enhances the translation workflow by providing access to Greek word data directly within the editor interface.

Based on [BIEL Greek Words for Translators](https://gwt.bibleineverylanguage.org/)

## Features

- **View Greek Word Data:** Quickly access Greek word data relevant to the verse being translated.
- **Integration with Codex Scripture Editor:** Integrates with Codex Scripture Editor for a cohesive translation experience.

## How to Use

1. Clone this repo, open in Visual Studio Code, and run the extension. 
2. Open a project in which you are using the Codex Scripture Editor extension.
3. While working on a verse, run the command `GWT: Open` to fetch and display the Greek word data.

## Requirements

- **Codex Scripture Editor Extension:** Ensure you have the Codex Scripture Editor extension installed and activated in your Visual Studio Code environment.
- **Dependent Module:** This extension depends on the `project-accelerate.shared-state-store` module. Make sure it is installed and configured properly.

# Goals

- Allow users to see Greek word data on a word basis, similar to functionality shown on the [BIEL Greek Words for Translators](https://gwt.bibleineverylanguage.org/) site.
- Allow users to use different aligned source material. 

## Version History

### 1.0.0
- Fetches Greek word data from the [WACS en_gwt repository](https://content.bibletranslationtools.org/WycliffeAssociates/en_gwt/src/commit/ddf4e6135ed4df2e259cdb592375d626aee37489/g3701-g3710) based on the verse reference provided by `project-accelerate.shared-state-store`.
- Utilizes verse data from the [WACS en_ulb_tagged checked repository](https://content.bibletranslationtools.org/WycliffeAssociates/en_ulb_tagged/src/branch/master/Checked).
